
import calendar
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from vehicles.models import Vehicle
from reservations.models import Reservation
from payments.models import Paiement


User = get_user_model()

ADMIN_ROLES = {"ADMIN", "SUPER_ADMIN"}

RESERVATION_STATUSES = {
    "PENDING_VERIFICATION",
    "CONFIRMED",
    "CANCELLED",
    "EN_COURS",
    "TERMINEE",
    "EXPIRED",
}


def get_period_dates(period: str, today: date) -> tuple[date, date]:
    if period == "today":
        return today, today

    if period == "week":
        start = today - timedelta(days=today.weekday())
        return start, start + timedelta(days=6)

    if period == "month":
        start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        return start, today.replace(day=last_day)

    if period == "year":
        return date(today.year, 1, 1), date(today.year, 12, 31)

    raise ValueError("Période invalide.")


def money_string(value: Decimal) -> str:
    return f"{value:.2f}"


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ADMIN_ROLES:
            return Response(
                {"detail": "Accès réservé aux administrateurs."},
                status=403,
            )

        period = request.query_params.get("period", "week")

        if period not in {"today", "week", "month", "year"}:
            return Response(
                {"detail": "Période invalide."},
                status=400,
            )

        today = timezone.localdate()
        start_date, end_date = get_period_dates(period, today)

        # --------------------------------------------------
        # VÉHICULES
        # --------------------------------------------------

        vehicles = Vehicle.objects.all()

        total_vehicles = vehicles.count()
        available_vehicles = vehicles.filter(
            status="AVAILABLE"
        ).count()
        maintenance_vehicles = vehicles.filter(
            status="MAINTENANCE"
        ).count()
        out_of_service_vehicles = vehicles.filter(
            status="OUT_OF_SERVICE"
        ).count()

        # --------------------------------------------------
        # RÉSERVATIONS
        # --------------------------------------------------

        reservations = Reservation.objects.all()

        period_reservations = reservations.filter(
            created_at__date__range=(start_date, end_date)
        )

        active_rentals = reservations.filter(
            statut="EN_COURS"
        ).count()

        # Véhicules liés à des locations actuellement en cours.
        active_vehicle_ids = set(
            reservations.filter(
                statut="EN_COURS"
            ).values_list(
                "lignes__vehicule_id",
                flat=True,
            ).distinct()
        )
        active_vehicle_ids.discard(None)

        # Véhicules associés à des réservations confirmées
        # dont la période n'est pas encore terminée.
        reserved_vehicle_ids = set(
            reservations.filter(
                statut="CONFIRMED",
                date_fin__gte=today,
            ).values_list(
                "lignes__vehicule_id",
                flat=True,
            ).distinct()
        )
        reserved_vehicle_ids.discard(None)

        # Les réservations annulées ou terminées sont exclues.
        upcoming_queryset = (
            reservations.filter(
                statut="CONFIRMED",
                date_debut__gte=today,
            )
            .select_related("client")
            .prefetch_related("lignes__vehicule")
            .order_by("date_debut", "created_at")
        )

        upcoming_rentals = []

        for reservation in upcoming_queryset[:5]:
            client = reservation.client

            client_name = (
                client.get_full_name().strip()
                or getattr(client, "email", "")
                or "Client"
            )

            vehicle_names = []

            for line in reservation.lignes.all():
                vehicle = line.vehicule
                vehicle_names.append(
                    f"{vehicle.brand} {vehicle.model}"
                )

            upcoming_rentals.append({
                "id": str(reservation.pk),
                "numero": str(
                    getattr(reservation, "numero", reservation.pk)
                ),
                "client": client_name,
                "vehicles": vehicle_names,
                "date_debut": reservation.date_debut.isoformat(),
                "date_fin": reservation.date_fin.isoformat(),
                "statut": reservation.statut,
            })

        # --------------------------------------------------
        # CLIENTS
        # --------------------------------------------------

        active_clients = User.objects.filter(
            role="CLIENT",
            is_active=True,
        ).count()

        # --------------------------------------------------
        # REVENUS
        #
        # Utilise montant_net_htg calculé par le modèle
        # Paiement pour respecter le taux historique et les
        # remboursements. Seuls les paiements SUCCEEDED comptent.
        # --------------------------------------------------

        successful_payments = Paiement.objects.filter(
            statut="SUCCEEDED",
            date_paiement__date__range=(start_date, end_date),
        ).select_related("reservation")

        revenue_htg = Decimal("0.00")
        revenue_by_bucket = defaultdict(lambda: Decimal("0.00"))

        for payment in successful_payments:
            net_amount = Decimal(
                str(payment.montant_net_htg or "0")
            )

            revenue_htg += net_amount

            payment_date = timezone.localtime(
                payment.date_paiement
            ).date()

            if period == "year":
                bucket = payment_date.strftime("%Y-%m")
            else:
                bucket = payment_date.isoformat()

            revenue_by_bucket[bucket] += net_amount

        # --------------------------------------------------
        # DONNÉES DU GRAPHIQUE
        # --------------------------------------------------

        if period == "year":
            buckets = [
                date(today.year, month, 1)
                for month in range(1, 13)
            ]
        else:
            buckets = []
            current_date = start_date

            while current_date <= end_date:
                buckets.append(current_date)
                current_date += timedelta(days=1)

        chart = []

        for bucket_date in buckets:
            if period == "year":
                bucket_key = bucket_date.strftime("%Y-%m")
                label = bucket_date.strftime("%b")
                bucket_start = bucket_date
                last_day = calendar.monthrange(
                    bucket_date.year,
                    bucket_date.month,
                )[1]
                bucket_end = bucket_date.replace(day=last_day)
            else:
                bucket_key = bucket_date.isoformat()
                label = bucket_date.strftime("%d/%m")
                bucket_start = bucket_date
                bucket_end = bucket_date

            bucket_reservations = reservations.filter(
                created_at__date__range=(
                    bucket_start,
                    bucket_end,
                )
            ).count()

            chart.append({
                "label": label,
                "date": bucket_key,
                "revenue_htg": money_string(
                    revenue_by_bucket[bucket_key]
                ),
                "reservations": bucket_reservations,
            })

        # --------------------------------------------------
        # TAUX D'OCCUPATION
        #
        # Basé sur les véhicules distincts en location.
        # --------------------------------------------------

        occupancy_rate = (
            round(
                len(active_vehicle_ids)
                / total_vehicles
                * 100
            )
            if total_vehicles
            else 0
        )

        # --------------------------------------------------
        # RÉPONSE API
        # --------------------------------------------------

        return Response({
            "period": period,

            "kpis": {
                "total_vehicles": total_vehicles,
                "active_rentals": active_rentals,
                "reservations": period_reservations.count(),
                "revenue_htg": money_string(revenue_htg),
                "occupancy_rate": occupancy_rate,
                "active_clients": active_clients,
            },

            "fleet": {
                "total": total_vehicles,
                "available": available_vehicles,
                "in_rental": len(active_vehicle_ids),
                "reserved": len(reserved_vehicle_ids),
                "maintenance": maintenance_vehicles,
                "out_of_service": out_of_service_vehicles,
            },

            "performance": {
                "revenue_htg": money_string(revenue_htg),
                "reservations_count": period_reservations.count(),
                "chart": chart,
            },

            "upcoming_rentals": upcoming_rentals,
        })
