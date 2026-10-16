import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarCheck,
  Car,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Sidebar from "../../components/layoutClient/Sidebar";
import TopBar from "../../components/layoutClient/TopBar";
import WelcomeBanner from "../../components/dashbordClient/WelcomeBanner";
import StatsRow from "../../components/dashbordClient/StatsRow";
import RecentBookings from "../../components/dashbordClient/RecentBookings";
import ProfileWidget from "../../components/dashbordClient/ProfileWidget";
import NextBookingWidget from "../../components/dashbordClient/NextBookingWidget";

import { useAuth } from "../../hooks/useAuth";
import reservationService from "../../api/services/reservationService";

import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

/* ============================================================
   TYPES DASHBOARD
============================================================ */

type BookingStatus =
  | "CONFIRMÉE"
  | "EN COURS"
  | "ANNULÉE"
  | "TERMINÉE"
  | "EN ATTENTE";

interface Booking {
  id: string;
  ref: string;
  vehicle: string;
  dateStart: string;
  dateEnd: string;
  days: number;
  amount: number;
  status: BookingStatus;
}

/* ============================================================
   CHAMPS DU PROFIL — même liste que Sidebar et ReservationPage
============================================================ */

const PROFILE_FIELDS = [
  "phone",
  "address",
  "driving_license_number",
  "driving_license_expiry",
  "id_document_type",
  "id_document_number",
] as const;

/* ============================================================
   HELPERS
============================================================ */

function getUserName(
  user: ReturnType<typeof useAuth>["user"]
): string {
  if (!user) return "Client";

  const fullName = `${user.first_name ?? ""} ${
    user.last_name ?? ""
  }`.trim();

  if (fullName) return fullName;
  if (user.email) return user.email;
  return "Client";
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value
    .slice(0, 10)
    .split("-")
    .map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseLocalDate(value));
}

function parseAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("fr-FR")} HTG`;
}

function getBookingStatus(
  status: ReservationStatus
): BookingStatus {
  switch (status) {
    case "CONFIRMED":       return "CONFIRMÉE";
    case "EN_COURS":        return "EN COURS";
    case "CANCELLED":       return "ANNULÉE";
    case "TERMINEE":        return "TERMINÉE";
    case "PENDING_VERIFICATION":
    default:                return "EN ATTENTE";
  }
}

function getVehicleName(reservation: Reservation): string {
  if (!reservation.lignes?.length) return "Véhicule";
  return reservation.lignes
    .map((ligne) =>
      `${ligne.vehicule?.brand ?? ""} ${ligne.vehicule?.model ?? ""}`.trim()
    )
    .filter(Boolean)
    .join(", ");
}

function reservationToBooking(reservation: Reservation): Booking {
  return {
    id: reservation.id,
    ref: reservation.numero,
    vehicle: getVehicleName(reservation),
    dateStart: formatDate(reservation.date_debut),
    dateEnd: formatDate(reservation.date_fin),
    days: reservation.nombre_jours,
    amount: parseAmount(reservation.montant_total),
    status: getBookingStatus(reservation.statut),
  };
}

/**
 * Calcule le % de complétion du profil.
 * Même liste de champs que Sidebar et ReservationPage
 * pour garantir la cohérence partout.
 */
// function computeProfileCompletion(
//   user: ReturnType<typeof useAuth>["user"]
// ): number {
//   if (!user) return 0;

//   const record = user as Record<string, unknown>;

//   const filled = PROFILE_FIELDS.filter((field) => {
//     const value = record[field];
//     return value !== null && value !== undefined && value !== "";
//   }).length;

//   return Math.round((filled / PROFILE_FIELDS.length) * 100);
// }

function computeProfileCompletion(
  user: ReturnType<typeof useAuth>["user"]
): number {
  if (!user) return 0;

  const record = user as unknown as Record<string, unknown>;

  const filled = PROFILE_FIELDS.filter((field) => {
    const value = record[field];

    return value !== null && value !== undefined && value !== "";
  }).length;

  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------------------------------------------
     UTILISATEUR
  ---------------------------------------------------------- */

  const userName = useMemo(() => getUserName(user), [user]);

  // Même calcul que Sidebar — une seule source de vérité
  const profileCompletion = useMemo(
    () => computeProfileCompletion(user),
    [user]
  );

  /* ----------------------------------------------------------
     CHARGEMENT DES RÉSERVATIONS
  ---------------------------------------------------------- */

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des réservations :",
        err
      );
      setError("Impossible de charger vos réservations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    reservationService
      .getMyReservations()
      .then((data) => {
        if (cancelled) return;
        setReservations(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(
          "Erreur lors du chargement des réservations :",
          err
        );
        setError("Impossible de charger vos réservations.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ----------------------------------------------------------
     BOOKINGS
  ---------------------------------------------------------- */

  const bookings = useMemo<Booking[]>(() => {
    return reservations
      .map(reservationToBooking)
      .sort((a, b) => {
        const rA = reservations.find((r) => r.id === a.id);
        const rB = reservations.find((r) => r.id === b.id);
        const dateA = rA ? new Date(rA.created_at).getTime() : 0;
        const dateB = rB ? new Date(rB.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [reservations]);

  /* ----------------------------------------------------------
     STATISTIQUES
  ---------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = reservations.length;

    const inProgress = reservations.filter(
      (r) => r.statut === "EN_COURS"
    ).length;

    const now = new Date();

    const upcoming = reservations.filter((r) => {
      if (r.statut !== "CONFIRMED") return false;
      return parseLocalDate(r.date_debut) >= now;
    }).length;

    const totalSpent = reservations
      .filter((r) => r.paiement_reussi)
      .reduce((sum, r) => sum + parseAmount(r.montant_total), 0);

    return [
      {
        label: "Réservations",
        value: String(total).padStart(2, "0"),
        icon: Car,
        color: "bg-red-50 text-red-600",
      },
      {
        label: "En cours",
        value: String(inProgress).padStart(2, "0"),
        icon: Clock,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "À venir",
        value: String(upcoming).padStart(2, "0"),
        icon: CalendarCheck,
        color: "bg-amber-50 text-amber-600",
      },
      {
        label: "Total dépensé",
        value: formatMoney(totalSpent),
        icon: Banknote,
        color: "bg-emerald-50 text-emerald-600",
      },
    ];
  }, [reservations]);

  /* ----------------------------------------------------------
     PROCHAINE RÉSERVATION
  ---------------------------------------------------------- */

  const nextBooking = useMemo<Booking | null>(() => {
    const now = new Date();

    const upcoming = reservations
      .filter((r) => r.statut === "CONFIRMED")
      .filter((r) => parseLocalDate(r.date_debut) >= now)
      .sort(
        (a, b) =>
          parseLocalDate(a.date_debut).getTime() -
          parseLocalDate(b.date_debut).getTime()
      );

    if (!upcoming.length) return null;
    return reservationToBooking(upcoming[0]);
  }, [reservations]);

  /* ----------------------------------------------------------
     AUTH LOADING
  ---------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 size={22} className="animate-spin" />
          <span>Chargement de votre espace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            Utilisateur non connecté
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Veuillez vous connecter pour accéder à votre tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     DASHBOARD
  ---------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — calcule son propre profileCompletion via useAuth */}
      <Sidebar />

      <div className="flex flex-1 flex-col pl-64">
        <TopBar userName={userName} />

        <main className="flex-1 px-6 pb-10 pt-24">
          <div className="mx-auto max-w-5xl space-y-6">
            <WelcomeBanner userName={userName} />

            <StatsRow stats={stats} />

            {error && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>

                <button
                  type="button"
                  onClick={() => void loadReservations()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={15} />
                  Réessayer
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-100 bg-white">
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm">
                    Chargement de vos réservations...
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RecentBookings bookings={bookings.slice(0, 5)} />
                </div>

                <div className="flex flex-col gap-4">
                  {/* ProfileWidget reçoit le même calcul que Sidebar */}
                  <ProfileWidget completion={profileCompletion} />
                  <NextBookingWidget booking={nextBooking} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}