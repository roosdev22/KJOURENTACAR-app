import { AlertTriangle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDisplayName } from "../../hooks/useDisplayName";
import { useAgentDashboardData } from "../../hooks/Useagentdashboarddata";

import AgentReservationFilters from "../../components/agent/dashboard/AgentReservationFilters";
import AgentReservationStats from "../../components/agent/dashboard/AgentReservationStats";
import AgentReservationTable from "../../components/agent/dashboard/AgentReservationTable";
import type {
  Reservation,
  ReservationSource,
  ReservationStatus,
} from "../../types/reservation";

// ============================================================
// TYPES
// ============================================================

type PaymentFilter =
  | "ALL"
  | "SUCCEEDED"
  | "PENDING"
  | "FAILED"
  | "NONE";

// ============================================================
// DASHBOARD AGENT
// ============================================================

export default function AgentDashboard() {
  const navigate = useNavigate();
  const displayName = useDisplayName();

  // ==========================================================
  // FILTRES
  // ==========================================================

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    ReservationStatus | "ALL"
  >("ALL");

  const [payment, setPayment] =
    useState<PaymentFilter>("ALL");

  const [source, setSource] =
    useState<ReservationSource | "ALL">("ALL");

  // ==========================================================
  // DONNÉES
  // ==========================================================

  const {
    loading,
    error,
    refetch,

    reservations,

    pendingReservations,

    validationError,
    validateReservation,
  } = useAgentDashboardData();

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const reservationStats = useMemo(() => {
    return {
      total: reservations.length,

      pending: reservations.filter(
        (reservation) =>
          reservation.statut === "PENDING_VERIFICATION"
      ).length,

      confirmed: reservations.filter(
        (reservation) =>
          reservation.statut === "CONFIRMED"
      ).length,

      ongoing: reservations.filter(
        (reservation) =>
          reservation.statut === "EN_COURS"
      ).length,
    };
  }, [reservations]);

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const filteredReservations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      // ------------------------------------------------------
      // Recherche
      // ------------------------------------------------------

      const matchesSearch =
        !normalizedSearch ||
        reservation.numero
          .toLowerCase()
          .includes(normalizedSearch) ||
        reservation.client_nom
          .toLowerCase()
          .includes(normalizedSearch);

      // ------------------------------------------------------
      // Statut
      // ------------------------------------------------------

      const matchesStatus =
        status === "ALL" ||
        reservation.statut === status;

      // ------------------------------------------------------
      // Paiement
      //
      // L'API actuelle expose uniquement paiement_reussi.
      // ------------------------------------------------------

      const matchesPayment =
        payment === "ALL" ||
        (payment === "SUCCEEDED" &&
          reservation.paiement_reussi) ||
        (payment === "NONE" &&
          !reservation.paiement_reussi);

      // ------------------------------------------------------
      // Source
      // ------------------------------------------------------

      const matchesSource =
        source === "ALL" ||
        reservation.source === source;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesSource
      );
    });
  }, [
    reservations,
    search,
    status,
    payment,
    source,
  ]);

  // ==========================================================
  // RESET FILTRES
  // ==========================================================

  const handleResetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPayment("ALL");
    setSource("ALL");
  };

  // ==========================================================
  // VOIR UNE RÉSERVATION
  // ==========================================================

  const handleViewReservation = (
    reservation: Reservation
  ) => {
    navigate(
      `/agent/reservations/${reservation.id}`
    );
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const handleValidateReservation = async (
    reservation: Reservation
  ) => {
    await validateReservation(reservation.id);
  };

  // ==========================================================
  // MODIFICATION
  // ==========================================================

  const handleEditReservation = (
    reservation: Reservation
  ) => {
    navigate(
      `/agent/reservations/${reservation.id}/edit`
    );
  };

  // ==========================================================
  // ANNULATION
  // ==========================================================

  const handleCancelReservation = (
    reservation: Reservation
  ) => {
    navigate(
      `/agent/reservations/${reservation.id}`
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px]">
        <div
          className="
            flex
            min-h-[420px]
            items-center
            justify-center
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-black/10
                border-t-red-600
              "
            />

            <span
              className="
                text-sm
                font-medium
                text-black/50
              "
            >
              Chargement des réservations…
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1600px]">
        <div
          className="
            flex
            min-h-[420px]
            items-center
            justify-center
          "
        >
          <div
            className="
              w-full
              max-w-xl
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-6
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-red-100
                  text-red-700
                "
              >
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  className="
                    text-sm
                    font-bold
                    text-red-900
                  "
                >
                  Impossible de charger les réservations
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-red-700/80
                  "
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={refetch}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-red-700
                    px-4
                    py-2
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-red-800
                  "
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1600px]
        space-y-5
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="
          flex
          flex-col
          gap-3
          border-b
          border-black/[0.07]
          pb-5
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-[11px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-red-600
            "
          >
            Espace agent
          </p>

          <h1
            className="
              mt-1
              text-2xl
              font-black
              tracking-tight
              text-black
              sm:text-3xl
            "
          >
            Bonjour, {displayName}
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-black/45
            "
          >
            Gérez et validez les réservations de
            K-JOU RENT A CAR.
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-black/[0.07]
            bg-white
            px-3
            py-2
            shadow-sm
          "
        >
          <span
            className="
              h-2
              w-2
              rounded-full
              bg-emerald-500
            "
          />

          <span
            className="
              text-xs
              font-semibold
              text-black/60
            "
          >
            Agent opérationnel
          </span>
        </div>
      </header>

      {/* ======================================================
          ERREUR DE VALIDATION
      ====================================================== */}

      {validationError && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
          "
        >
          <AlertTriangle
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-amber-700
            "
          />

          <div>
            <p
              className="
                text-xs
                font-bold
                text-amber-900
              "
            >
              Action impossible
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-amber-800/80
              "
            >
              {validationError}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <AgentReservationStats
        total={reservationStats.total}
        pending={reservationStats.pending}
        confirmed={reservationStats.confirmed}
        ongoing={reservationStats.ongoing}
      />

      {/* ======================================================
          ZONE RÉSERVATIONS
      ====================================================== */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-black/[0.07]
          bg-white
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        "
      >
        {/* ----------------------------------------------------
            ENTÊTE SECTION
        ---------------------------------------------------- */}

        <div
          className="
            border-b
            border-black/[0.06]
            px-4
            py-4
            sm:px-5
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-sm
                  font-bold
                  text-black
                "
              >
                Gestion des réservations
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-black/40
                "
              >
                Consultez, filtrez et traitez les
                réservations clients.
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
                text-black/40
              "
            >
              <span
                className="
                  inline-flex
                  h-6
                  min-w-6
                  items-center
                  justify-center
                  rounded-md
                  bg-black/[0.04]
                  px-2
                  font-bold
                  text-black/60
                "
              >
                {filteredReservations.length}
              </span>

              <span>
                réservation
                {filteredReservations.length > 1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            FILTRES
        ---------------------------------------------------- */}

        <div
          className="
            border-b
            border-black/[0.06]
            bg-[#fcfcfc]
            px-4
            py-4
            sm:px-5
          "
        >
          <AgentReservationFilters
            search={search}
            status={status}
            payment={payment}
            source={source}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onPaymentChange={setPayment}
            onSourceChange={setSource}
            onReset={handleResetFilters}
          />
        </div>

        {/* ----------------------------------------------------
            TABLEAU
        ---------------------------------------------------- */}

        <AgentReservationTable
          reservations={filteredReservations}
          onView={handleViewReservation}
          onValidate={handleValidateReservation}
          onEdit={handleEditReservation}
          onCancel={handleCancelReservation}
        />
      </section>

      {/* ======================================================
          FOOTER INFORMATION
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-2
          border-t
          border-black/[0.06]
          pt-4
          text-[11px]
          text-black/35
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <span>
          {pendingReservations.length} réservation
          {pendingReservations.length > 1
            ? "s"
            : ""}{" "}
          en attente de validation
        </span>

        <span>
          Les montants et conditions sont calculés
          par le serveur.
        </span>
      </div>
    </div>
  );
}

