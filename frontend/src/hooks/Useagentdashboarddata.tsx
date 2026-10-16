import { useCallback, useEffect, useMemo, useState } from "react";

import { reservationService } from "../api/services/reservationService";

import type { Reservation } from "../types/reservation";

// ============================================================
// UTILITAIRE — DATE DU JOUR
// ============================================================

function getTodayISODate(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// TYPES
// ============================================================

interface UseAgentDashboardDataResult {
  loading: boolean;
  error: string | null;
  refetch: () => void;

  reservations: Reservation[];

  pendingReservations: Reservation[];
  paidReservations: Reservation[];
  unpaidReservations: Reservation[];

  departuresToday: Reservation[];
  returnsToday: Reservation[];

  rentedVehiclesCount: number;
  inspectionVehiclesCount: number;

  validatingId: string | null;
  validationError: string | null;

  validateReservation: (id: string) => Promise<void>;
}

// ============================================================
// HOOK — DONNÉES DU DASHBOARD AGENT
// ============================================================

export function useAgentDashboardData(): UseAgentDashboardDataResult {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationError, setValidationError] =
    useState<string | null>(null);

  // ============================================================
  // CHARGEMENT DES RÉSERVATIONS
  // ============================================================

  const fetchReservations = useCallback(async () => {
    try {
      setError(null);

      const data = await reservationService.getAllReservations();

      setReservations(data);
    } catch (err) {
      console.error(
        "[useAgentDashboardData] getAllReservations",
        err
      );

      setError(
        "Impossible de charger les réservations. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await reservationService.getAllReservations();

        if (cancelled) {
          return;
        }

        setReservations(data);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "[useAgentDashboardData] initial load",
          err
        );

        setError(
          "Impossible de charger les réservations. Vérifiez votre connexion et réessayez."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // DATE DU JOUR
  // ============================================================

  const today = getTodayISODate();

  // ============================================================
  // RÉSERVATIONS À VALIDER
  // ============================================================

  const pendingReservations = useMemo(
    () =>
      reservations.filter(
        (reservation: Reservation) =>
          reservation.statut === "PENDING_VERIFICATION"
      ),
    [reservations]
  );

  // ============================================================
  // RÉSERVATIONS PAYÉES
  // ============================================================

  const paidReservations = useMemo(
    () =>
      reservations.filter(
        (reservation: Reservation) =>
          reservation.paiement_reussi
      ),
    [reservations]
  );

  // ============================================================
  // RÉSERVATIONS NON PAYÉES
  // ============================================================

  const unpaidReservations = useMemo(
    () =>
      reservations.filter(
        (reservation: Reservation) =>
          !reservation.paiement_reussi
      ),
    [reservations]
  );

  // ============================================================
  // DÉPARTS DU JOUR
  // ============================================================

  const departuresToday = useMemo(
    () =>
      reservations.filter(
        (reservation: Reservation) =>
          reservation.date_debut === today
      ),
    [reservations, today]
  );

  // ============================================================
  // RETOURS DU JOUR
  // ============================================================

  const returnsToday = useMemo(
    () =>
      reservations.filter(
        (reservation: Reservation) =>
          reservation.date_fin === today
      ),
    [reservations, today]
  );

  // ============================================================
  // VÉHICULES ACTUELLEMENT EN LOCATION
  // ============================================================

  const rentedVehiclesCount = useMemo(() => {
    const vehicleIds = new Set<string>();

    reservations
      .filter(
        (reservation: Reservation) =>
          reservation.statut === "EN_COURS"
      )
      .forEach((reservation: Reservation) => {
        reservation.lignes.forEach((ligne) => {
          vehicleIds.add(ligne.vehicule.id);
        });
      });

    return vehicleIds.size;
  }, [reservations]);

  // ============================================================
  // VÉHICULES À INSPECTER
  // ============================================================

  // Le modèle Vehicle actuel ne possède pas encore
  // de statut "à inspecter".
  const inspectionVehiclesCount = 0;

  // ============================================================
  // VALIDATION D'UNE RÉSERVATION
  // ============================================================

  const validateReservation = useCallback(
    async (id: string) => {
      setValidatingId(id);
      setValidationError(null);

      try {
        await reservationService.confirmReservation(id);

        await fetchReservations();
      } catch (err) {
        console.error(
          "[useAgentDashboardData] confirmReservation",
          err
        );

        setValidationError(
          "La validation a échoué. La réservation est peut-être déjà traitée."
        );
      } finally {
        setValidatingId(null);
      }
    },
    [fetchReservations]
  );

  // ============================================================
  // REFRESH MANUEL
  // ============================================================

  const refetch = useCallback(() => {
    setLoading(true);
    void fetchReservations();
  }, [fetchReservations]);

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    loading,
    error,
    refetch,

    reservations,

    pendingReservations,
    paidReservations,
    unpaidReservations,

    departuresToday,
    returnsToday,

    rentedVehiclesCount,
    inspectionVehiclesCount,

    validatingId,
    validationError,

    validateReservation,
  };
}

