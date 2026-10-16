from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from reservations.models import (
    LigneReservation,
    Reservation,
    ReservationStatus,
    VehicleReturn,
    VehicleReturnLine,
)
from vehicles.models import (
    Vehicle,
    VehicleCondition,
    VehicleStatus,
)

from payments.models import PaymentStatus

@transaction.atomic
def creer_reservation(
    *,
    client,
    created_by,
    source,
    date_debut,
    date_fin,
    vehicules: list,
    notes_client: str = '',
    notes_agent: str = '',        # ← ajouté pour ReservationAgentCreateSerializer
) -> Reservation:
    """
    Crée une réservation complète de manière atomique.

    La réservation et toutes ses lignes sont créées dans
    une seule transaction.

    Le verrouillage des véhicules avec select_for_update()
    permet d'éviter les conflits lors de créations simultanées
    de réservations pour un même véhicule.
    """

    # ============================================================
    # 1. Vérifier qu'au moins un véhicule est fourni
    # ============================================================

    if not vehicules:
        raise ValidationError(
            _('Une réservation doit contenir au moins un véhicule.')
        )

    # ============================================================
    # 2. Supprimer les doublons
    # ============================================================

    vehicule_ids = list(
        dict.fromkeys(
            vehicule.id
            for vehicule in vehicules
        )
    )

    if not vehicule_ids:
        raise ValidationError(
            _('Aucun véhicule valide n\'a été fourni.')
        )

    # ============================================================
    # 3. Verrouiller les véhicules
    # ============================================================

    vehicules_verrouilles = list(
        Vehicle.objects
        .select_for_update()
        .filter(id__in=vehicule_ids)
    )

    # ============================================================
    # 4. Vérifier que tous les véhicules existent
    # ============================================================

    ids_trouves = {
        vehicule.id
        for vehicule in vehicules_verrouilles
    }

    ids_manquants = [
        str(vehicule_id)
        for vehicule_id in vehicule_ids
        if vehicule_id not in ids_trouves
    ]

    if ids_manquants:
        raise ValidationError(
            {
                'vehicules': _(
                    'Un ou plusieurs véhicules sont introuvables.'
                ),
                'ids_manquants': ids_manquants,
            }
        )

    # ============================================================
    # 5. Créer la réservation
    # ============================================================

    reservation = Reservation(
        client=client,
        created_by=created_by,
        source=source,
        date_debut=date_debut,
        date_fin=date_fin,
        notes_client=notes_client,
        notes_agent=notes_agent,   # ← ajouté
        montant_total=0,
        caution_totale=0,
    )

    # Reservation.save() :
    # - génère le numéro RES-YYYYMMDD-XXXX
    # - calcule nombre_jours
    # - exécute full_clean()
    reservation.save()

    # ============================================================
    # 6. Créer les lignes — snapshot des prix du véhicule
    # ============================================================

    nombre_jours = reservation.nombre_jours or 1

    for vehicule in vehicules_verrouilles:
        prix_journalier = vehicule.daily_rate
        caution = vehicule.deposit or 0
        sous_total = prix_journalier * nombre_jours

        LigneReservation.objects.create(
            reservation=reservation,
            vehicule=vehicule,
            prix_journalier_unitaire=prix_journalier,
            caution_unitaire=caution,
            sous_total=sous_total,
        )

    # ============================================================
    # 7. Recalculer les montants
    # ============================================================

    reservation.recalculer_totaux()

    # ============================================================
    # 8. Retourner la réservation complète
    # ============================================================

    return reservation

@transaction.atomic
def enregistrer_retour_reservation(
    *,
    reservation_id,
    agent,
    lignes: list,
    date_retour_effective=None,
    penalite_retard=0,
    penalite_dommages=0,
    caution_restituee=False,
) -> VehicleReturn:
    """
    Enregistre le retour complet d'une réservation.

    Workflow :
        Reservation EN_COURS
            ↓
        verrouillage de la réservation
            ↓
        verrouillage des véhicules
            ↓
        création du VehicleReturn
            ↓
        création des VehicleReturnLine
            ↓
        inspection de chaque véhicule
            ↓
        mise à jour du kilométrage / état / statut
            ↓
        vérification que tous les véhicules sont retournés
            ↓
        Reservation → TERMINEE

    Cette opération est entièrement atomique.
    """

    # ============================================================
    # VALIDATION DE BASE
    # ============================================================

    if not agent:
        raise ValidationError(
            _("L'agent qui enregistre le retour est obligatoire.")
        )

    if not lignes:
        raise ValidationError(
            _("Le retour doit contenir au moins un véhicule.")
        )

    # ============================================================
    # VERROUILLAGE DE LA RÉSERVATION
    # ============================================================

    try:
        reservation = (
            Reservation.objects
            .select_for_update()
            .get(id=reservation_id)
        )
    except Reservation.DoesNotExist:
        raise ValidationError(
            _("La réservation demandée est introuvable.")
        )

    # ============================================================
    # VÉRIFICATION DU STATUT
    # ============================================================

    if reservation.statut != ReservationStatus.EN_COURS:
        raise ValidationError(
            {
                "reservation": _(
                    "Le retour ne peut être enregistré que "
                    "pour une réservation en cours."
                )
            }
        )

    # ============================================================
    # VÉRIFICATION DES RÔLES
    # ============================================================

    allowed_roles = {
        "AGENT",
        "ADMIN",
        "SUPER_ADMIN",
    }

    if getattr(agent, "role", None) not in allowed_roles:
        raise ValidationError(
            {
                "agent": _(
                    "Vous n'êtes pas autorisé à enregistrer "
                    "le retour d'un véhicule."
                )
            }
        )

    # ============================================================
    # VÉRIFICATION D'UN RETOUR EXISTANT
    # ============================================================

    if VehicleReturn.objects.filter(
        reservation=reservation
    ).exists():
        raise ValidationError(
            {
                "retour": _(
                    "Le retour de cette réservation a déjà été enregistré."
                )
            }
        )

    # ============================================================
    # RÉCUPÉRATION DES LIGNES DE RÉSERVATION
    # ============================================================

    lignes_reservation = list(
        reservation.lignes.select_related("vehicule").all()
    )

    if not lignes_reservation:
        raise ValidationError(
            {
                "reservation": _(
                    "Cette réservation ne contient aucun véhicule."
                )
            }
        )

    lignes_reservation_map = {
        str(ligne.id): ligne
        for ligne in lignes_reservation
    }

    # ============================================================
    # NORMALISATION DES LIGNES FOURNIES
    # ============================================================

    ligne_ids_fournis = []

    for ligne_data in lignes:
        ligne_id = ligne_data.get("ligne_reservation_id")

        if not ligne_id:
            raise ValidationError(
                {
                    "lignes": _(
                        "Chaque ligne de retour doit contenir "
                        "un ligne_reservation_id."
                    )
                }
            )

        ligne_id = str(ligne_id)

        if ligne_id in ligne_ids_fournis:
            raise ValidationError(
                {
                    "lignes": _(
                        "Une même ligne de réservation ne peut "
                        "pas être retournée deux fois."
                    )
                }
            )

        ligne_ids_fournis.append(ligne_id)

    # ============================================================
    # VÉRIFICATION DES LIGNES
    # ============================================================

    ligne_ids_inconnus = [
        ligne_id
        for ligne_id in ligne_ids_fournis
        if ligne_id not in lignes_reservation_map
    ]

    if ligne_ids_inconnus:
        raise ValidationError(
            {
                "lignes": _(
                    "Une ou plusieurs lignes ne correspondent "
                    "pas à cette réservation."
                ),
                "ids_inconnus": ligne_ids_inconnus,
            }
        )

    # ============================================================
    # RETOUR COMPLET OBLIGATOIRE
    # ============================================================

    ligne_ids_attendus = {
        str(ligne.id)
        for ligne in lignes_reservation
    }

    ligne_ids_fournis_set = set(ligne_ids_fournis)

    lignes_manquantes = ligne_ids_attendus - ligne_ids_fournis_set

    if lignes_manquantes:
        raise ValidationError(
            {
                "lignes": _(
                    "Tous les véhicules de la réservation "
                    "doivent être retournés."
                ),
                "ids_manquants": list(lignes_manquantes),
            }
        )

    # ============================================================
    # VERROUILLAGE DES VÉHICULES
    # ============================================================

    vehicule_ids = [
        ligne.vehicule_id
        for ligne in lignes_reservation
    ]

    vehicules_verrouilles = list(
        Vehicle.objects
        .select_for_update()
        .filter(id__in=vehicule_ids)
    )

    vehicules_map = {
        str(vehicule.id): vehicule
        for vehicule in vehicules_verrouilles
    }

    if len(vehicules_map) != len(vehicule_ids):
        raise ValidationError(
            {
                "vehicules": _(
                    "Un ou plusieurs véhicules de la réservation "
                    "sont introuvables."
                )
            }
        )

    # ============================================================
    # CRÉATION DU RETOUR
    # ============================================================

    retour_kwargs = {
        "reservation": reservation,
        "enregistre_par": agent,
        "penalite_retard": penalite_retard,
        "penalite_dommages": penalite_dommages,
        "caution_restituee": caution_restituee,
    }

    if date_retour_effective is not None:
        retour_kwargs["date_retour_effective"] = date_retour_effective

    retour = VehicleReturn.objects.create(
        **retour_kwargs
    )

    # ============================================================
    # CRÉATION DES LIGNES DE RETOUR
    # ============================================================

    for ligne_data in lignes:

        ligne_id = str(
            ligne_data["ligne_reservation_id"]
        )

        ligne_reservation = lignes_reservation_map[ligne_id]

        vehicule = vehicules_map[
            str(ligne_reservation.vehicule_id)
        ]

        kilometrage_retour = ligne_data.get(
            "kilometrage_retour"
        )

        if kilometrage_retour is None:
            raise ValidationError(
                {
                    "lignes": _(
                        "Le kilométrage de retour est obligatoire."
                    )
                }
            )

        try:
            kilometrage_retour = int(kilometrage_retour)
        except (TypeError, ValueError):
            raise ValidationError(
                {
                    "kilometrage_retour": _(
                        "Le kilométrage de retour doit être "
                        "un nombre entier."
                    )
                }
            )

        if kilometrage_retour < vehicule.mileage:
            raise ValidationError(
                {
                    "kilometrage_retour": _(
                        f"Le kilométrage de retour du véhicule "
                        f"{vehicule.display_name} ne peut pas être "
                        f"inférieur au kilométrage actuel "
                        f"({vehicule.mileage} km)."
                    )
                }
            )

        etat_general = ligne_data.get(
            "etat_general",
            VehicleReturnLine.EtatVehicule.BON,
        )

        allowed_conditions = {
            VehicleReturnLine.EtatVehicule.BON,
            VehicleReturnLine.EtatVehicule.DOMMAGES_MINEURS,
            VehicleReturnLine.EtatVehicule.DOMMAGES_MAJEURS,
        }

        if etat_general not in allowed_conditions:
            raise ValidationError(
                {
                    "etat_general": _(
                        "L'état général du véhicule est invalide."
                    )
                }
            )

        observations = ligne_data.get(
            "observations",
            ""
        )

        VehicleReturnLine.objects.create(
            vehicle_return=retour,
            ligne_reservation=ligne_reservation,
            kilometrage_retour=kilometrage_retour,
            etat_general=etat_general,
            observations=observations,
        )

        # ========================================================
        # MISE À JOUR DU VÉHICULE
        # ========================================================

        vehicule.mileage = kilometrage_retour

        if (
            etat_general
            == VehicleReturnLine.EtatVehicule.BON
        ):
            vehicule.condition = VehicleCondition.GOOD
            vehicule.status = VehicleStatus.AVAILABLE

        elif (
            etat_general
            == VehicleReturnLine.EtatVehicule.DOMMAGES_MINEURS
        ):
            vehicule.condition = VehicleCondition.FAIR
            vehicule.status = VehicleStatus.MAINTENANCE

        elif (
            etat_general
            == VehicleReturnLine.EtatVehicule.DOMMAGES_MAJEURS
        ):
            vehicule.condition = VehicleCondition.POOR
            vehicule.status = VehicleStatus.MAINTENANCE

        vehicule.save(
            update_fields=[
                "mileage",
                "condition",
                "status",
                "updated_at",
            ]
        )

    # ============================================================
    # VÉRIFICATION FINALE
    # ============================================================

    if not retour.tous_les_vehicules_sont_retournes:
        raise ValidationError(
            {
                "retour": _(
                    "Tous les véhicules de la réservation "
                    "doivent être retournés avant de terminer "
                    "la réservation."
                )
            }
        )

    # ============================================================
    # TERMINAISON DE LA RÉSERVATION
    # ============================================================

    reservation.terminer()

    # ============================================================
    # RETOUR DU RÉSULTAT
    # ============================================================

    return retour




def verifier_disponibilite_vehicules(
    *,
    reservation: Reservation,
    vehicule_ids: list,
) -> None:
    """
    Vérifie que les véhicules de la réservation sont disponibles
    pendant sa période.

    Règles :
    - PENDING_VERIFICATION sans paiement réussi : ne bloque pas.
    - PENDING_VERIFICATION avec paiement réussi : bloque.
    - CONFIRMED : bloque.
    - EN_COURS : bloque.
    - CANCELLED : ne bloque pas.
    - EXPIRED : ne bloque pas.
    - TERMINEE : ne bloque pas.

    Cette fonction ne modifie aucune donnée.
    """

    reservations_concurrentes = (
        Reservation.objects
        .filter(
            lignes__vehicule_id__in=vehicule_ids,
            date_debut__lt=reservation.date_fin,
            date_fin__gt=reservation.date_debut,
        )
        .exclude(pk=reservation.pk)
        .filter(
            statut__in=[
                ReservationStatus.PENDING_VERIFICATION,
                ReservationStatus.CONFIRMED,
                ReservationStatus.EN_COURS,
            ]
        )
        .distinct()
    )

    conflits = []

    for reservation_concurrente in reservations_concurrentes:
        if (
            reservation_concurrente.statut
            == ReservationStatus.PENDING_VERIFICATION
        ):
            paiement_reussi = (
                reservation_concurrente.paiements
                .filter(
                    statut=PaymentStatus.SUCCEEDED
                )
                .exists()
            )

            if not paiement_reussi:
                continue

        conflits.append(
            {
                "id": reservation_concurrente.id,
                "numero": reservation_concurrente.numero,
                "statut": reservation_concurrente.statut,
                "date_debut": reservation_concurrente.date_debut,
                "date_fin": reservation_concurrente.date_fin,
            }
        )

    if conflits:
        raise ValidationError(
            {
                "code": "VEHICLE_RESERVATION_CONFLICT",
                "detail": _(
                    "Un ou plusieurs véhicules sont déjà "
                    "réservés pendant cette période."
                ),
                "conflits": [
                    {
                        "reservation_id": str(conflit["id"]),
                        "numero": conflit["numero"],
                        "statut": conflit["statut"],
                        "date_debut": conflit["date_debut"],
                        "date_fin": conflit["date_fin"],
                    }
                    for conflit in conflits
                ],
            }
        )

@transaction.atomic
def expire_reservations() -> int:
    """
    Expire automatiquement les réservations dont la date de début
    est atteinte et qui n'ont pas encore été confirmées.

    Règle métier :

        PENDING_VERIFICATION
                +
        date_debut <= aujourd'hui
                ↓
             EXPIRED

    Une réservation déjà CONFIRMED, CANCELLED, EN_COURS, TERMINEE
    ou EXPIRED n'est jamais modifiée par cette fonction.

    Cette fonction est appelée par Celery Beat.

    Returns:
        int: nombre de réservations effectivement expirées.

    Important :
        - la réservation est verrouillée avant modification ;
        - aucune logique de paiement ou remboursement n'est exécutée
          ici ;
        - le remboursement éventuel sera traité séparément.
    """

    today = timezone.localdate()

    reservations = list(
        Reservation.objects
        .select_for_update()
        .filter(
            statut=ReservationStatus.PENDING_VERIFICATION,
            date_debut__lte=today,
        )
        .order_by("date_debut", "pk")
    )

    nombre_expirees = 0

    for reservation in reservations:
        # Double vérification après verrouillage.
        #
        # Elle protège contre une modification effectuée par une
        # autre transaction avant l'obtention du verrou.
        if reservation.statut != ReservationStatus.PENDING_VERIFICATION:
            continue

        if reservation.date_debut > today:
            continue

        reservation.expirer()

        nombre_expirees += 1

    return nombre_expirees
    
@transaction.atomic
def confirmer_reservation(
    *,
    reservation_id,
    agent,
) -> Reservation:
    """
    Confirme une réservation de manière atomique.

    Conditions :
        - utilisateur autorisé ;
        - réservation PENDING_VERIFICATION ;
        - date de début non atteinte ;
        - au moins un paiement SUCCEEDED ;
        - client toujours éligible ;
        - réservation contenant au moins un véhicule ;
        - véhicules existants ;
        - véhicules physiquement disponibles ;
        - aucun conflit avec une autre réservation bloquante.

    La réservation est verrouillée avant toute vérification.
    Les paiements et les véhicules sont également verrouillés.

    Cette fonction ne crée et ne confirme aucun paiement.

    Les erreurs métier sont retournées sous forme structurée afin
    que l'API et le frontend puissent afficher un message explicite.
    """

    # ============================================================
    # 1. VALIDATION DE BASE
    # ============================================================

    if not agent:
        raise ValidationError(
            {
                "code": "AGENT_REQUIRED",
                "detail": _(
                    "Impossible de confirmer la réservation : "
                    "l'utilisateur chargé de cette opération "
                    "est obligatoire."
                ),
            }
        )

    # ============================================================
    # 2. VÉRIFICATION DU RÔLE
    # ============================================================

    allowed_roles = {
        "AGENT",
        "ADMIN",
        "SUPER_ADMIN",
    }

    agent_role = getattr(agent, "role", None)

    if agent_role not in allowed_roles:
        raise ValidationError(
            {
                "code": "CONFIRMATION_NOT_ALLOWED",
                "detail": _(
                    "Vous n'êtes pas autorisé à confirmer "
                    "une réservation."
                ),
            }
        )

    # ============================================================
    # 3. VERROUILLAGE DE LA RÉSERVATION
    # ============================================================

    try:
        reservation = (
            Reservation.objects
            .select_for_update()
            .select_related("client")
            .get(pk=reservation_id)
        )

    except Reservation.DoesNotExist as exc:
        raise ValidationError(
            {
                "code": "RESERVATION_NOT_FOUND",
                "detail": _(
                    "Impossible de confirmer la réservation : "
                    "la réservation demandée est introuvable."
                ),
            }
        ) from exc

    # ============================================================
    # 4. VÉRIFICATION DU STATUT
    # ============================================================

    if reservation.statut != ReservationStatus.PENDING_VERIFICATION:
        raise ValidationError(
            {
                "code": "INVALID_RESERVATION_STATUS",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "elle n'est plus en attente de validation."
                ),
                "statut_actuel": reservation.statut,
            }
        )

    # ============================================================
    # 5. VÉRIFICATION DE LA DATE D'EXPIRATION
    # ============================================================
    #
    # Règle métier :
    #
    #   date_debut = 10/09/2026
    #
    #   jusqu'au 09/09/2026  → confirmation possible
    #   à partir du 10/09/2026 → réservation expirée
    #
    # Le service d'expiration Celery changera réellement le statut
    # en EXPIRED.
    #
    # Ici, on empêche simplement une confirmation tardive.
    # ============================================================

    today = timezone.localdate()

    if reservation.date_debut <= today:
        raise ValidationError(
            {
                "code": "RESERVATION_EXPIRED",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "la date de début de location est déjà atteinte."
                ),
                "statut": ReservationStatus.EXPIRED,
                "date_debut": reservation.date_debut,
            }
        )

    # ============================================================
    # 6. VERROUILLAGE DES PAIEMENTS
    # ============================================================

    paiements = list(
        reservation.paiements
        .select_for_update()
        .order_by("pk")
    )

    # ============================================================
    # 7. VÉRIFICATION DU PAIEMENT
    # ============================================================

    paiement_reussi = any(
        paiement.statut == PaymentStatus.SUCCEEDED
        for paiement in paiements
    )

    if not paiement_reussi:
        raise ValidationError(
            {
                "code": "PAYMENT_REQUIRED",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "aucun paiement réussi n'a été enregistré."
                ),
            }
        )

    # ============================================================
    # 8. VÉRIFICATION DE L'ÉLIGIBILITÉ DU CLIENT
    # ============================================================

    eligibility = reservation.client.is_eligible_for_rental()

    if not eligibility.get("eligible", False):

        reasons = eligibility.get(
            "reasons",
            [],
        )

        missing_docs = eligibility.get(
            "missing_docs",
            [],
        )

        raise ValidationError(
            {
                "code": "CLIENT_INELIGIBLE",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "le client n'est pas éligible à la location."
                ),
                "reasons": reasons,
                "missing_docs": missing_docs,
            }
        )

    # ============================================================
    # 9. RÉCUPÉRATION DES LIGNES
    # ============================================================

    lignes = list(
        reservation.lignes
        .select_related("vehicule")
        .all()
    )

    if not lignes:
        raise ValidationError(
            {
                "code": "NO_VEHICLE",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "aucun véhicule n'est associé à la réservation."
                ),
            }
        )

    # ============================================================
    # 10. NORMALISATION DES IDS VÉHICULES
    # ============================================================

    vehicule_ids = list(
        dict.fromkeys(
            ligne.vehicule_id
            for ligne in lignes
        )
    )

    # ============================================================
    # 11. VERROUILLAGE DES VÉHICULES
    # ============================================================
    #
    # On verrouille les véhicules avant de vérifier leur disponibilité
    # afin d'éviter qu'une autre transaction ne modifie leur état
    # pendant notre confirmation.
    # ============================================================

    vehicules = list(
        Vehicle.objects
        .select_for_update()
        .filter(id__in=vehicule_ids)
        .order_by("pk")
    )

    vehicules_map = {
        vehicule.id: vehicule
        for vehicule in vehicules
    }

    # ============================================================
    # 12. VÉRIFICATION DES VÉHICULES MANQUANTS
    # ============================================================

    vehicules_introuvables = sorted(
        set(vehicule_ids) - set(vehicules_map.keys()),
        key=str,
    )

    if vehicules_introuvables:
        raise ValidationError(
            {
                "code": "VEHICLE_NOT_FOUND",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "un ou plusieurs véhicules associés "
                    "sont introuvables."
                ),
                "vehicules_introuvables": [
                    str(vehicle_id)
                    for vehicle_id in vehicules_introuvables
                ],
            }
        )

    # ============================================================
    # 13. VÉRIFICATION DE L'ÉTAT PHYSIQUE DES VÉHICULES
    # ============================================================

    vehicules_indisponibles = []

    for ligne in lignes:
        vehicule = vehicules_map[ligne.vehicule_id]

        if vehicule.status != VehicleStatus.AVAILABLE:
            vehicules_indisponibles.append(
                {
                    "id": str(vehicule.id),
                    "nom": vehicule.display_name,
                    "statut": vehicule.status,
                }
            )

    if vehicules_indisponibles:
        raise ValidationError(
            {
                "code": "VEHICLE_UNAVAILABLE",
                "detail": _(
                    "Impossible de confirmer cette réservation : "
                    "un ou plusieurs véhicules ne sont plus "
                    "physiquement disponibles."
                ),
                "vehicules_indisponibles": vehicules_indisponibles,
            }
        )

    # ============================================================
    # 14. VÉRIFICATION DES CONFLITS TEMPORELS
    # ============================================================
    #
    # Une réservation ne doit pas bloquer un véhicule simplement
    # parce qu'elle existe.
    #
    # Une réservation PENDING_VERIFICATION ne bloque le véhicule
    # que si elle possède au moins un paiement SUCCEEDED.
    #
    # Les statuts qui bloquent une période sont :
    #
    #   - PENDING_VERIFICATION + paiement réussi
    #   - CONFIRMED
    #   - EN_COURS
    #
    # CANCELLED / EXPIRED / TERMINEE ne bloquent pas.
    #
    # Cette vérification sera également réutilisée par le système
    # de paiement avant de valider définitivement un paiement.
    # ============================================================
    # ============================================================
# 14. VÉRIFICATION DES CONFLITS TEMPORELS
# ============================================================
#
# Une réservation PENDING_VERIFICATION ne bloque PAS le véhicule
# si aucun paiement n'a été réussi.
#
# Une réservation PENDING_VERIFICATION qui possède au moins
# un paiement SUCCEEDED bloque le véhicule.
#
# Les statuts bloquants sont donc :
#
#   - PENDING_VERIFICATION + paiement SUCCEEDED
#   - CONFIRMED
#   - EN_COURS
#
# Les statuts suivants ne bloquent pas :
#
#   - PENDING_VERIFICATION sans paiement réussi
#   - CANCELLED
#   - EXPIRED
#   - TERMINEE
#
# Le chevauchement est calculé ainsi :
#
#   date_debut_concurrente < date_fin_courante
#   ET
#   date_fin_concurrente > date_debut_courante
#
# ============================================================

    verifier_disponibilite_vehicules(
    reservation=reservation,
    vehicule_ids=vehicule_ids,
)

    # ============================================================
    # 15. CONFIRMATION
    # ============================================================
    #
    # La transition d'état appartient au modèle Reservation.
    # Toutes les vérifications complexes ont déjà été effectuées
    # dans ce service.
    # ============================================================

    reservation.confirmer(agent)

    # ============================================================
    # 16. RETOUR
    # ============================================================

    return reservation

