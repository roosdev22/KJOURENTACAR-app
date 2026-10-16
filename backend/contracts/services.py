import hashlib
import uuid
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape

from .models import Contract


MAX_SIGNED_PDF_SIZE = 15 * 1024 * 1024  # 15 Mo


def _generate_reference():
    """Génère une référence de contrat unique."""
    for _ in range(10):
        reference = (
            f"CTR-{timezone.localdate():%Y%m%d}-"
            f"{uuid.uuid4().hex[:6].upper()}"
        )
        if not Contract.objects.filter(reference=reference).exists():
            return reference

    raise ValidationError(
        "Impossible de générer une référence de contrat unique."
    )


def generate_contract_pdf(contract):
    """Génère le PDF du contrat et le stocke dans l'espace privé."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError as exc:
        raise ValidationError(
            "ReportLab est requis pour générer les contrats PDF."
        ) from exc

    reservation = contract.reservation
    client = reservation.client
    client_name = (
        client.get_full_name().strip()
        or client.email
        or str(client.pk)
    )

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Contrat {contract.reference}",
        author="K-JOU RENT A CAR",
    )

    styles = getSampleStyleSheet()
    story = [
        Paragraph("K-JOU RENT A CAR", styles["Title"]),
        Paragraph("CONTRAT DE LOCATION DE VÉHICULE", styles["Heading2"]),
        Spacer(1, 0.5 * cm),
        Paragraph(
            f"Référence du contrat : {escape(contract.reference)}",
            styles["Normal"],
        ),
        Paragraph(
            f"Référence de réservation : {escape(str(reservation.numero))}",
            styles["Normal"],
        ),
        Spacer(1, 0.4 * cm),
        Paragraph("INFORMATIONS DU CLIENT", styles["Heading2"]),
    ]

    rows = [
        ["Nom du client", str(client_name)],
        ["Adresse e-mail", str(client.email or "Non renseignée")],
        ["Date de début", str(reservation.date_debut)],
        ["Date de fin", str(reservation.date_fin)],
        ["Nombre de jours", str(reservation.nombre_jours)],
        ["Montant de location", f"{reservation.montant_total} HTG"],
        ["Caution", f"{reservation.caution_totale} HTG"],
    ]

    table = Table(rows, colWidths=[5 * cm, 11 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend(
        [
            table,
            Spacer(1, 0.7 * cm),
            Paragraph("SIGNATURES", styles["Heading2"]),
            Paragraph(
                "Le client et le représentant de l'agence doivent "
                "prendre connaissance des conditions complètes de location "
                "et signer le contrat avant la remise du véhicule.",
                styles["Normal"],
            ),
            Spacer(1, 1.5 * cm),
            Paragraph(
                "Signature du client : __________________________",
                styles["Normal"],
            ),
            Spacer(1, 1 * cm),
            Paragraph(
                "Signature de l'agence : _________________________",
                styles["Normal"],
            ),
        ]
    )

    document.build(story)
    pdf_content = buffer.getvalue()
    buffer.close()

    contract.generated_file.save(
        f"{contract.reference}.pdf",
        ContentFile(pdf_content),
        save=False,
    )
    contract.save(update_fields=["generated_file", "updated_at"])

    return contract


@transaction.atomic
def create_contract_for_reservation(reservation, created_by=None):
    """
    Crée un seul contrat actif pour une réservation confirmée.
    Appeler ce service après la confirmation réussie.
    """
    from reservations.models import Reservation

    reservation_id = getattr(reservation, "pk", reservation)

    locked_reservation = (
        Reservation.objects.select_for_update().get(pk=reservation_id)
    )

    if locked_reservation.statut != "CONFIRMED":
        raise ValidationError(
            "Le contrat ne peut être créé que pour une réservation confirmée."
        )

    existing = (
        Contract.objects.filter(reservation=locked_reservation)
        .exclude(status=Contract.Status.CANCELLED)
        .first()
    )
    if existing:
        if not existing.generated_file:
            return generate_contract_pdf(existing)
        return existing

    contract = Contract.objects.create(
        reference=_generate_reference(),
        reservation=locked_reservation,
        created_by=created_by,
    )

    try:
        return generate_contract_pdf(contract)
    except Exception:
        # Le fichier peut déjà avoir été écrit avant une erreur DB.
        if contract.generated_file and contract.generated_file.name:
            contract.generated_file.storage.delete(
                contract.generated_file.name
            )
        raise


def upload_signed_contract(contract, uploaded_file):
    """Enregistre le PDF signé, son empreinte et la date d'enregistrement."""
    if contract.status != Contract.Status.GENERATED:
        raise ValidationError(
            "Seul un contrat généré et non signé peut être signé."
        )

    if not uploaded_file:
        raise ValidationError("Le fichier PDF signé est obligatoire.")

    if uploaded_file.size > MAX_SIGNED_PDF_SIZE:
        raise ValidationError("Le fichier ne doit pas dépasser 15 Mo.")

    header = uploaded_file.read(5)
    uploaded_file.seek(0)

    if header != b"%PDF-":
        raise ValidationError(
            "Le fichier fourni n'est pas un PDF valide."
        )

    digest = hashlib.sha256()
    for chunk in uploaded_file.chunks():
        digest.update(chunk)
    uploaded_file.seek(0)

    try:
        contract.signed_file = uploaded_file
        contract.signed_file_sha256 = digest.hexdigest()
        contract.signed_at = timezone.now()
        contract.status = Contract.Status.SIGNED
        contract.save(
            update_fields=[
                "signed_file",
                "signed_file_sha256",
                "signed_at",
                "status",
                "updated_at",
            ]
        )
    except Exception:
        if contract.signed_file and contract.signed_file.name:
            contract.signed_file.storage.delete(contract.signed_file.name)
        raise

    return contract


@transaction.atomic
def cancel_contract(contract_id):
    """Annule un contrat non signé sans effacer son historique."""
    contract = Contract.objects.select_for_update().get(pk=contract_id)

    if contract.status != Contract.Status.GENERATED:
        raise ValidationError(
            "Seul un contrat généré et non signé peut être annulé."
        )

    contract.status = Contract.Status.CANCELLED
    contract.cancelled_at = timezone.now()
    contract.save(update_fields=["status", "cancelled_at", "updated_at"])

    return contract