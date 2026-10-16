# apps/reservations/serializers.py

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from rest_framework import serializers

from vehicles.models import Vehicle
from users.models import RoleChoices

from reservations.models import (
    LigneReservation,
    Reservation,
    ReservationSource,
    STAFF_ROLES,
    VehicleReturn,
    VehicleReturnLine,
)
from reservations.services import (
    creer_reservation,
    enregistrer_retour_reservation,
)
from users.models import User

User = get_user_model()


# ============================================================
# LIGNE DE RÉSERVATION — LECTURE
# ============================================================

class LigneReservationSerializer(serializers.ModelSerializer):
    """
    Serializer en lecture seule pour une ligne de réservation.

    Les informations financières (prix_journalier_unitaire,
    caution_unitaire, sous_total) sont des snapshots copiés
    depuis Vehicle au moment de la création. Elles ne doivent
    jamais être acceptées en entrée.
    """

    vehicule_id = serializers.UUIDField(
        source="vehicule.id",
        read_only=True,
    )

    vehicule = serializers.SerializerMethodField()

    class Meta:
        model = LigneReservation

        fields = [
            "id",
            "vehicule_id",
            "vehicule",
            "prix_journalier_unitaire",
            "caution_unitaire",
            "sous_total",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_vehicule(self, obj: LigneReservation) -> dict:
        vehicule = obj.vehicule
        return {
            "id": str(vehicule.id),
            "brand": vehicule.brand,
            "model": vehicule.model,
            "status": vehicule.status,
            "daily_rate": str(vehicule.daily_rate),
            "deposit": str(vehicule.deposit),
        }


# ============================================================
# RESERVATION — LECTURE
# ============================================================

class ReservationSerializer(serializers.ModelSerializer):
    """
    Serializer principal en lecture pour une réservation.

    Utilisé pour :
        - liste des réservations (client et agent)
        - détail d'une réservation
        - réponse après création / action

    Toutes les données calculées ou dérivées sont en
    lecture seule. Les propriétés métier (est_modifiable,
    est_annulable, paiement_reussi) exposent l'état courant
    de la machine à états au frontend sans qu'il ait à
    recalculer les règles métier.
    """

    # --------------------------------------------------------
    # CLIENT
    # --------------------------------------------------------

    client_id = serializers.UUIDField(
        source='client.id',
        read_only=True,
    )

    client_nom = serializers.SerializerMethodField()

    # --------------------------------------------------------
    # CRÉATEUR
    # --------------------------------------------------------

    created_by_id = serializers.UUIDField(        # ← AJOUTÉ
        source='created_by.id',
        read_only=True,
    )

    created_by_nom = serializers.SerializerMethodField()  # ← AJOUTÉ

    # --------------------------------------------------------
    # VALIDATEUR
    # --------------------------------------------------------

    validated_by = serializers.SerializerMethodField()  # ← "validated_by" seul

    # --------------------------------------------------------
    # AFFICHAGE DES CHOIX
    # --------------------------------------------------------

    statut_display = serializers.CharField(
        source='get_statut_display',
        read_only=True,
    )

    source_display = serializers.CharField(
        source='get_source_display',
        read_only=True,
    )

    # --------------------------------------------------------
    # LIGNES
    # --------------------------------------------------------

    lignes = LigneReservationSerializer(
        many=True,
        read_only=True,
    )

    # --------------------------------------------------------
    # PROPRIÉTÉS MÉTIER
    # --------------------------------------------------------

    est_modifiable = serializers.BooleanField(read_only=True)
    est_annulable = serializers.BooleanField(read_only=True)
    paiement_reussi = serializers.BooleanField(read_only=True)

    class Meta:
        model = Reservation

        fields = [
            # Identification
            "id",
            "numero",

            # Client
            "client_id",
            "client_nom",

            # Création
            "created_by_id",
            "created_by_nom",

            # Validation — un seul champ objet, plus _id/_nom séparés
            "validated_by",

            # Dates
            "date_debut",
            "date_fin",
            "date_confirmation",
            "date_annulation",

            # Calculs
            "nombre_jours",
            "montant_total",
            "caution_totale",

            # Statut
            "statut",
            "statut_display",

            # Source
            "source",
            "source_display",

            # Notes
            "notes_client",
            "notes_agent",
            "motif_annulation",

            # Véhicules
            "lignes",

            # Propriétés métier
            "est_modifiable",
            "est_annulable",
            "paiement_reussi",

            # Dates système
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "numero",
            "client_id",
            "client_nom",
            "created_by_id",
            "created_by_nom",
            "validated_by",          # ← plus _id/_nom
            "date_confirmation",
            "date_annulation",
            "nombre_jours",
            "montant_total",
            "caution_totale",
            "statut_display",
            "source_display",
            "lignes",
            "est_modifiable",
            "est_annulable",
            "paiement_reussi",
            "created_at",
            "updated_at",
        ]

    # --------------------------------------------------------
    # MÉTHODES
    # --------------------------------------------------------

    def get_client_nom(self, obj: Reservation) -> str:
        return obj.client.get_full_name()

    def get_created_by_nom(self, obj: Reservation) -> str:
        return obj.created_by.get_full_name()

    def get_validated_by(self, obj: Reservation) -> dict | None:
        if not obj.validated_by:
            return None
        return {
            "id": str(obj.validated_by.id),
            "nom": obj.validated_by.get_full_name() or obj.validated_by.email,
        }

    def validate(self, attrs):
        date_debut = attrs.get("date_debut")
        date_fin = attrs.get("date_fin")

        if date_debut and date_fin:
            if date_fin <= date_debut:
                raise serializers.ValidationError({
                    "date_fin": (
                        "La date de fin doit être postérieure "
                        "à la date de début."
                    )
                })

        return attrs


# ============================================================
# CRÉATION — CLIENT
# ============================================================

class ReservationCreateSerializer(serializers.Serializer):
    """
    Serializer utilisé lorsqu'un CLIENT crée une réservation
    en ligne.

    On hérite de Serializer (et non ModelSerializer) car la
    persistance est entièrement déléguée à creer_reservation()
    dans services.py. Cela découple explicitement la validation
    de l'entrée de la logique de création.
    """

    date_debut = serializers.DateField(
        required=True,
        input_formats=['%Y-%m-%d'],
    )

    date_fin = serializers.DateField(
        required=True,
        input_formats=['%Y-%m-%d'],
    )

    vehicules = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.filter(status="AVAILABLE"),
        many=True,
        required=True,
        allow_empty=False,
    )

    notes_client = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
    )

    # --------------------------------------------------------
    # VALIDATION PAR CHAMP
    # --------------------------------------------------------

    def validate_date_debut(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "La date de début ne peut pas être dans le passé."
            )
        return value

    # --------------------------------------------------------
    # VALIDATION CROISÉE
    # --------------------------------------------------------

    def validate(self, attrs):
        date_debut = attrs["date_debut"]
        date_fin = attrs["date_fin"]
        vehicules = attrs["vehicules"]

        if date_fin <= date_debut:
            raise serializers.ValidationError({
                "date_fin": (
                    "La date de fin doit être postérieure "
                    "à la date de début."
                )
            })

        ids = [v.id for v in vehicules]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError({
                "vehicules": (
                    "Un même véhicule ne peut pas être ajouté "
                    "plusieurs fois dans une réservation."
                )
            })

        return attrs

    # --------------------------------------------------------
    # CRÉATION
    # --------------------------------------------------------

    def create(self, validated_data):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({
                "detail": (
                    "Vous devez être connecté "
                    "pour réserver un véhicule."
                )
            })

        client = request.user

        try:
            reservation = creer_reservation(
                client=client,
                created_by=client,
                source=ReservationSource.CLIENT,
                date_debut=validated_data["date_debut"],
                date_fin=validated_data["date_fin"],
                vehicules=validated_data["vehicules"],
                notes_client=validated_data.get("notes_client", ""),
            )

        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict) from exc
            raise serializers.ValidationError(exc.messages) from exc

        return reservation


# ============================================================
# CRÉATION — AGENT
# ============================================================

class ReservationAgentCreateSerializer(serializers.Serializer):
    """
    Serializer utilisé lorsqu'un AGENT (ou membre du personnel
    autorisé) crée une réservation en agence pour un client.

    Différences avec ReservationCreateSerializer :
        - client_id fourni explicitement par l'agent ;
        - notes_agent disponible ;
        - le statut initial est CONFIRMED directement
          (géré dans creer_reservation() côté service).
    """

    client_id = serializers.PrimaryKeyRelatedField(
        source='client',
        queryset=User.objects.filter(
            role=RoleChoices.CLIENT,
            is_active=True,
        ),
        required=True,
    )

    date_debut = serializers.DateField(
        required=True,
        input_formats=["%Y-%m-%d"],
    )

    date_fin = serializers.DateField(
        required=True,
        input_formats=["%Y-%m-%d"],
    )

    vehicules = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.filter(status="AVAILABLE"),
        many=True,
        required=True,
        allow_empty=False,
    )

    notes_client = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
    )

    notes_agent = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
    )

    # --------------------------------------------------------
    # VALIDATION PAR CHAMP
    # --------------------------------------------------------

    def validate_date_debut(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                "La date de début ne peut pas être dans le passé."
            )
        return value

    # --------------------------------------------------------
    # VALIDATION CROISÉE
    # --------------------------------------------------------

    def validate(self, attrs):
        date_debut = attrs["date_debut"]
        date_fin = attrs["date_fin"]
        vehicules = attrs["vehicules"]
        client = attrs["client"]

        if date_fin <= date_debut:
            raise serializers.ValidationError({
                "date_fin": (
                    "La date de fin doit être postérieure "
                    "à la date de début."
                )
            })

        eligibility = client.is_eligible_for_rental()

        if not eligibility["eligible"]:
            reasons = ', '.join(
                str(r) for r in eligibility.get("reasons", [])
            )
            raise serializers.ValidationError({
                "client_id": (
                    f"Le client n'est pas éligible à la "
                    f"location : {reasons}"
                )
            })

        ids = [v.id for v in vehicules]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError({
                "vehicules": (
                    "Un même véhicule ne peut pas être ajouté "
                    "plusieurs fois dans une réservation."
                )
            })

        return attrs

    # --------------------------------------------------------
    # CRÉATION
    # --------------------------------------------------------

    def create(self, validated_data):
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({
                'detail': (
                    "Vous devez être connecté "
                    "pour créer une réservation."
                )
            })

        agent = request.user

        try:
            reservation = creer_reservation(
                client=validated_data["client"],
                created_by=agent,
                source=ReservationSource.AGENT,
                date_debut=validated_data["date_debut"],
                date_fin=validated_data["date_fin"],
                vehicules=validated_data["vehicules"],
                notes_client=validated_data.get("notes_client", ""),
                notes_agent=validated_data.get("notes_agent", ""),
            )

        except DjangoValidationError as exc:
            if hasattr(exc, 'message_dict'):
                raise serializers.ValidationError(exc.message_dict) from exc
            raise serializers.ValidationError(exc.messages) from exc

        return reservation


# ============================================================
# CONFIRMATION
# ============================================================

class ReservationConfirmationSerializer(serializers.Serializer):
    """
    Payload pour confirmer une réservation.

        POST /api/reservations/{id}/confirmer/
        { "confirmation": true }

    La valeur doit être le booléen true (pas "true", pas 1).
    value is not True garantit ce comportement strict.
    """

    confirmation = serializers.BooleanField(required=True)

    def validate_confirmation(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "La confirmation doit être validée."
            )
        return value


# ============================================================
# ANNULATION
# ============================================================

class ReservationCancellationSerializer(serializers.Serializer):
    """
    Payload pour annuler une réservation.

        POST /api/reservations/{id}/annuler/
        { "motif_annulation": "..." }

    min_length=3 évite les motifs vides ou trop courts.
    trim_whitespace=True gère les espaces en début/fin.
    La validation explicite dans validate_motif_annulation
    est un filet de sécurité supplémentaire (strip + check).
    """

    motif_annulation = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        min_length=3,
        max_length=1000,
    )

    def validate_motif_annulation(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                "Le motif d'annulation est obligatoire."
            )
        return value


# ============================================================
# TRANSITION SIMPLE (DÉMARRER / TERMINER)
# ============================================================

class ReservationTransitionSerializer(serializers.Serializer):
    """
    Payload pour les transitions sans données métier :

        POST /api/reservations/{id}/demarrer/
        POST /api/reservations/{id}/terminer/

        { "confirmation": true }

    Le champ confirmation est un garde-fou explicite :
    il oblige le frontend à envoyer un payload intentionnel
    plutôt qu'un POST vide.
    """

    confirmation = serializers.BooleanField(required=True)

    def validate_confirmation(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "Vous devez confirmer cette opération."
            )
        return value

# ============================================================
# RETOUR DE VÉHICULE — LIGNE D'INSPECTION
# ============================================================


class VehicleReturnLineSerializer(serializers.ModelSerializer):
    """
    Serializer d'une ligne d'inspection lors du retour d'un véhicule.

    Le frontend fournit uniquement les informations constatées
    au moment du retour.

    Les données de départ sont conservées côté backend :
        - véhicule
        - kilométrage de départ
        - ligne de réservation

    Exemple d'entrée :

    {
        "ligne_reservation_id": "uuid",
        "kilometrage_retour": 125430,
        "etat_general": "BON",
        "observations": "Véhicule rendu propre."
    }
    """

    ligne_reservation_id = serializers.PrimaryKeyRelatedField(
        source="ligne_reservation",
        queryset=LigneReservation.objects.select_related(
            "vehicule"
        ),
        write_only=True,
        required=True,
    )

    vehicule = serializers.SerializerMethodField()

    kilometrage_depart = serializers.IntegerField(
        read_only=True,
    )

    kilometrage_retour = serializers.IntegerField(
        required=True,
        min_value=0,
    )

    etat_general = serializers.ChoiceField(
        choices=VehicleReturnLine.EtatVehicule.choices,
        required=True,
    )

    observations = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        default="",
    )

    class Meta:
        model = VehicleReturnLine

        fields = [
            "id",
            "ligne_reservation_id",
            "vehicule",
            "kilometrage_depart",
            "kilometrage_retour",
            "etat_general",
            "observations",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "vehicule",
            "kilometrage_depart",
            "created_at",
            "updated_at",
        ]

    def get_vehicule(self, obj: VehicleReturnLine) -> dict:
        vehicule = obj.ligne_reservation.vehicule

        return {
            "id": str(vehicule.id),
            "brand": vehicule.brand,
            "model": vehicule.model,
            "registration_number": vehicule.registration_number,
        }

    def validate(self, attrs):
        """
        Validation complémentaire avant l'appel au service métier.

        La validation complète du kilométrage reste également
        protégée par VehicleReturnLine.clean() côté modèle.
        """

        ligne = attrs.get("ligne_reservation")
        kilometrage_retour = attrs.get("kilometrage_retour")

        if ligne and kilometrage_retour is not None:
            kilometrage_depart = ligne.vehicule.mileage

            if kilometrage_retour < kilometrage_depart:
                raise serializers.ValidationError({
                    "kilometrage_retour": (
                        "Le kilométrage de retour ne peut pas être "
                        "inférieur au kilométrage de départ."
                    )
                })

        return attrs


# ============================================================
# RETOUR DE VÉHICULE — RETOUR COMPLET
# ============================================================


class VehicleReturnSerializer(serializers.ModelSerializer):
    """
    Serializer principal pour enregistrer le retour complet
    d'une réservation.

    Endpoint prévu :

        POST /api/reservations/{id}/retourner/

    Exemple :

    {
        "date_retour_effective": "2026-09-19T16:30:00Z",
        "penalite_retard": "0.00",
        "penalite_dommages": "150.00",
        "caution_restituee": true,
        "lignes": [
            {
                "ligne_reservation_id": "uuid",
                "kilometrage_retour": 125430,
                "etat_general": "DOMMAGES_MINEURS",
                "observations": "Petite rayure sur la portière."
            }
        ]
    }

    La réservation est déterminée par la vue et non par
    le payload envoyé par le frontend.
    """

    lignes = VehicleReturnLineSerializer(
        many=True,
        required=True,
        allow_empty=False,
    )

    date_retour_effective = serializers.DateTimeField(
        required=False,
        allow_null=False,
    )

    penalite_retard = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        required=False,
        default="0.00",
    )

    penalite_dommages = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        required=False,
        default="0.00",
    )

    caution_restituee = serializers.BooleanField(
        required=False,
        default=False,
    )

    # --------------------------------------------------------
    # INFORMATIONS EN LECTURE
    # --------------------------------------------------------

    reservation_id = serializers.UUIDField(
        source="reservation.id",
        read_only=True,
    )

    date_retour_prevue = serializers.DateTimeField(
        read_only=True,
    )

    enregistre_par = serializers.SerializerMethodField()

    total_penalites = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    nombre_vehicules = serializers.IntegerField(
        read_only=True,
    )

    nombre_vehicules_retournes = serializers.IntegerField(
        read_only=True,
    )

    tous_les_vehicules_sont_retournes = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = VehicleReturn

        fields = [
            # Identification
            "id",
            "reservation_id",

            # Dates
            "date_retour_prevue",
            "date_retour_effective",

            # Pénalités
            "penalite_retard",
            "penalite_dommages",
            "total_penalites",

            # Caution
            "caution_restituee",

            # Agent
            "enregistre_par",

            # Véhicules
            "nombre_vehicules",
            "nombre_vehicules_retournes",
            "tous_les_vehicules_sont_retournes",

            # Inspection
            "lignes",

            # Dates système
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "reservation_id",
            "date_retour_prevue",
            "enregistre_par",
            "total_penalites",
            "nombre_vehicules",
            "nombre_vehicules_retournes",
            "tous_les_vehicules_sont_retournes",
            "created_at",
            "updated_at",
        ]

    # --------------------------------------------------------
    # AGENT
    # --------------------------------------------------------

    def get_enregistre_par(self, obj: VehicleReturn) -> dict | None:
        if not obj.enregistre_par:
            return None

        return {
            "id": str(obj.enregistre_par.id),
            "nom": (
                obj.enregistre_par.get_full_name()
                or obj.enregistre_par.email
            ),
        }

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    def validate_lignes(self, value):
        """
        Une réservation doit avoir au moins une ligne
        d'inspection.
        """

        if not value:
            raise serializers.ValidationError(
                "Au moins un véhicule doit être inspecté."
            )

        return value

    # --------------------------------------------------------
    # CRÉATION
    # --------------------------------------------------------

    def create(self, validated_data):
        """
        La persistance est entièrement déléguée au service métier.

        Le service :
            - vérifie l'agent
            - verrouille la réservation
            - vérifie les lignes
            - crée VehicleReturn
            - crée VehicleReturnLine
            - met à jour le kilométrage
            - met à jour l'état du véhicule
            - termine la réservation
            - protège toute l'opération par transaction.atomic()
        """

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError({
                "detail": (
                    "Vous devez être connecté "
                    "pour enregistrer un retour."
                )
            })

        reservation_id = self.context.get("reservation_id")

        if not reservation_id:
            raise serializers.ValidationError({
                "detail": (
                    "La réservation à retourner "
                    "n'a pas été spécifiée."
                )
            })

        lignes_data = validated_data.pop("lignes", [])

        try:
            retour = enregistrer_retour_reservation(
                reservation_id=reservation_id,
                agent=request.user,
                lignes=lignes_data,
                date_retour_effective=validated_data.get(
                    "date_retour_effective"
                ),
                penalite_retard=validated_data.get(
                    "penalite_retard",
                    0,
                ),
                penalite_dommages=validated_data.get(
                    "penalite_dommages",
                    0,
                ),
                caution_restituee=validated_data.get(
                    "caution_restituee",
                    False,
                ),
            )

        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(
                    exc.message_dict
                ) from exc

            raise serializers.ValidationError(
                exc.messages
            ) from exc

        return retour