
from datetime import datetime, time
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from contracts.models import Contract
from maintenance.models import Maintenance
from payments.models import Paiement
from reservations.models import Reservation
from vehicles.models import Vehicle


ZERO = Decimal("0.00")


def _periode(date_debut=None, date_fin=None):
    """Vérifie que la période du rapport est cohérente."""
    if date_debut and date_fin and date_debut > date_fin:
        raise ValueError(
            "La date de début doit être antérieure ou égale à la date de fin."
        )


def _bornes_datetime(date_debut=None, date_fin=None):
    """Construit des bornes inclusives dans le fuseau horaire Django."""
    tz = timezone.get_current_timezone()

    debut = (
        timezone.make_aware(
            datetime.combine(date_debut, time.min),
            timezone=tz,
        )
        if date_debut
        else None
    )

    fin = (
        timezone.make_aware(
            datetime.combine(date_fin, time.max),
            timezone=tz,
        )
        if date_fin
        else None
    )

    return debut, fin


def rapport_financier(date_debut=None, date_fin=None):
    """
    Résume les paiements réussis.
    Les devises restent séparées ; les remboursements sont rattachés
    aux paiements d'origine, faute de date de remboursement dédiée.
    """
    _periode(date_debut, date_fin)

    paiements = Paiement.objects.filter(
        statut="SUCCEEDED",
        date_paiement__isnull=False,
    )

    debut, fin = _bornes_datetime(date_debut, date_fin)

    if debut is not None:
        paiements = paiements.filter(date_paiement__gte=debut)

    if fin is not None:
        paiements = paiements.filter(date_paiement__lte=fin)

    resume = (
        paiements.values("devise")
        .annotate(
            nombre=Count("pk"),
            montant_brut=Sum("montant"),
            montant_htg=Sum("montant_htg"),
            rembourse=Sum("montant_rembourse"),
        )
        .order_by("devise")
    )

    return {
        "date_debut": date_debut,
        "date_fin": date_fin,
        "paiements_par_devise": [
            {
                "devise": ligne["devise"],
                "nombre": ligne["nombre"],
                "montant_brut": ligne["montant_brut"] or ZERO,
                "montant_htg": ligne["montant_htg"] or ZERO,
                "montant_rembourse": ligne["rembourse"] or ZERO,
            }
            for ligne in resume
        ],
        "note_remboursements": (
            "Les remboursements sont rattachés aux paiements d'origine. "
            "Leur date exacte ne peut pas être déterminée sans champ "
            "ou historique dédié au remboursement."
        ),
    }


def rapport_reservations(date_debut=None, date_fin=None):
    """Compte les réservations créées pendant la période."""
    _periode(date_debut, date_fin)

    queryset = Reservation.objects.all()

    if date_debut:
        queryset = queryset.filter(created_at__date__gte=date_debut)

    if date_fin:
        queryset = queryset.filter(created_at__date__lte=date_fin)

    par_statut = (
        queryset.values("statut")
        .annotate(nombre=Count("pk"))
        .order_by("statut")
    )

    return {
        "date_debut": date_debut,
        "date_fin": date_fin,
        "total": queryset.count(),
        "par_statut": list(par_statut),
    }


def rapport_vehicules():
    """Compte les véhicules selon leur statut actuel."""
    par_statut = (
        Vehicle.objects.values("status")
        .annotate(nombre=Count("pk"))
        .order_by("status")
    )

    return {
        "total": Vehicle.objects.count(),
        "par_statut": list(par_statut),
    }


def rapport_contrats(date_debut=None, date_fin=None):
    """Compte les contrats générés pendant la période."""
    _periode(date_debut, date_fin)

    queryset = Contract.objects.all()

    if date_debut:
        queryset = queryset.filter(generated_at__date__gte=date_debut)

    if date_fin:
        queryset = queryset.filter(generated_at__date__lte=date_fin)

    par_statut = (
        queryset.values("status")
        .annotate(nombre=Count("pk"))
        .order_by("status")
    )

    return {
        "date_debut": date_debut,
        "date_fin": date_fin,
        "total": queryset.count(),
        "par_statut": list(par_statut),
    }


def rapport_maintenance(date_debut=None, date_fin=None):
    """Résume les maintenances planifiées pendant la période."""
    _periode(date_debut, date_fin)

    queryset = Maintenance.objects.all()

    if date_debut:
        queryset = queryset.filter(scheduled_date__gte=date_debut)

    if date_fin:
        queryset = queryset.filter(scheduled_date__lte=date_fin)

    par_statut = (
        queryset.values("status")
        .annotate(
            nombre=Count("pk"),
            cout_total=Sum("cost"),
        )
        .order_by("status")
    )

    par_type = (
        queryset.values("maintenance_type")
        .annotate(
            nombre=Count("pk"),
            cout_total=Sum("cost"),
        )
        .order_by("maintenance_type")
    )

    return {
        "date_debut": date_debut,
        "date_fin": date_fin,
        "total": queryset.count(),
        "cout_total": queryset.aggregate(total=Sum("cost"))["total"] or ZERO,
        "par_statut": list(par_statut),
        "par_type": list(par_type),
    }
