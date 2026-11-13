import {
  AlertCircle,
  ArrowLeft,
  CarFront,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import reservationService from "../../api/services/reservationService";

import type {
  Reservation,
} from "../../types/reservation";

import type {
  VehicleReturnCondition,
  VehicleReturnPayload,
} from "../../api/services/reservationService";

interface ReturnLineForm {
  ligne_reservation_id: string;
  kilometrage_retour: string;
  etat_general: VehicleReturnCondition;
  observations: string;
}

const DEFAULT_CONDITION: VehicleReturnCondition = "BON";

export default function AgentVehicleReturns() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reservationId = searchParams.get("reservation");

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [lines, setLines] = useState<ReturnLineForm[]>([]);

  const [penaliteRetard, setPenaliteRetard] = useState("0.00");
  const [penaliteDommages, setPenaliteDommages] = useState("0.00");
  const [cautionRestituee, setCautionRestituee] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ============================================================
  // CHARGEMENT DE LA RÉSERVATION
  // ============================================================

    useEffect(() => {
  let cancelled = false;

  const loadReservation = async () => {
    try {
      if (!reservationId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const data =
        await reservationService.getReservation(reservationId);

      if (cancelled) {
        return;
      }

      if (data.statut !== "EN_COURS") {
        setError(
          "Cette réservation n'est pas actuellement en cours de location. Le retour ne peut pas être enregistré."
        );

        setReservation(data);
        setLines([]);

        return;
      }

      setReservation(data);

      setLines(
        data.lignes.map((ligne) => ({
          ligne_reservation_id: ligne.id,
          kilometrage_retour: "",
          etat_general: DEFAULT_CONDITION,
          observations: "",
        }))
      );
    } catch (err: unknown) {
      if (cancelled) {
        return;
      }

      console.error(
        "Erreur chargement réservation pour retour :",
        err
      );

      setError(
        "Impossible de charger les informations de la réservation."
      );
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  };

  void loadReservation();

  return () => {
    cancelled = true;
  };
}, [reservationId]);
  // ============================================================
  // INFORMATIONS CALCULÉES
  // ============================================================

  const totalVehicules = reservation?.lignes.length ?? 0;

  const completedLines = useMemo(() => {
    return lines.filter(
      (line) => line.kilometrage_retour.trim() !== ""
    ).length;
  }, [lines]);

  const allKilometragesCompleted =
    lines.length > 0 &&
    lines.every(
      (line) => line.kilometrage_retour.trim() !== ""
    );

  // ============================================================
  // MISE À JOUR D'UNE LIGNE
  // ============================================================

  const updateLine = (
    ligneReservationId: string,
    field: keyof Omit<ReturnLineForm, "ligne_reservation_id">,
    value: string
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.ligne_reservation_id === ligneReservationId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  };

  // ============================================================
  // SOUMISSION
  // ============================================================

  const handleSubmit = async () => {
    if (!reservationId || !reservation) {
      setSubmitError(
        "La réservation est introuvable."
      );
      return;
    }

    if (reservation.statut !== "EN_COURS") {
      setSubmitError(
        "Cette réservation n'est plus en cours de location."
      );
      return;
    }

    setSubmitError(null);

    // ----------------------------------------------------------
    // Validation frontend minimale
    // ----------------------------------------------------------

    const invalidMileage = lines.find(
      (line) =>
        line.kilometrage_retour.trim() === "" ||
        !Number.isInteger(
          Number(line.kilometrage_retour)
        ) ||
        Number(line.kilometrage_retour) < 0
    );

    if (invalidMileage) {
      setSubmitError(
        "Veuillez renseigner un kilométrage de retour valide pour chaque véhicule."
      );
      return;
    }

    const payload: VehicleReturnPayload = {
      date_retour_effective: new Date().toISOString(),

      penalite_retard:
        penaliteRetard.trim() === ""
          ? "0.00"
          : penaliteRetard,

      penalite_dommages:
        penaliteDommages.trim() === ""
          ? "0.00"
          : penaliteDommages,

      caution_restituee: cautionRestituee,

      lignes: lines.map((line) => ({
        ligne_reservation_id:
          line.ligne_reservation_id,

        kilometrage_retour: Number(
          line.kilometrage_retour
        ),

        etat_general: line.etat_general,

        observations:
          line.observations.trim(),
      })),
    };

    try {
      setIsSubmitting(true);

      await reservationService.registerVehicleReturn(
        reservationId,
        payload
      );

      setSuccess(true);

      setTimeout(() => {
        navigate("/agent/locations", {
          replace: true,
        });
      }, 900);
    } catch (err: unknown) {
      console.error(
        "Erreur enregistrement retour véhicule :",
        err
      );

      const responseData = axios.isAxiosError(err)
        ? err.response?.data
        : undefined;

      let message =
        "Impossible d'enregistrer le retour des véhicules.";

      if (
        typeof responseData?.detail === "string"
      ) {
        message = responseData.detail;
      } else if (
        Array.isArray(responseData?.detail)
      ) {
        message =
          responseData.detail.join(" ");
      } else if (
        typeof responseData === "object" &&
        responseData !== null
      ) {
        const values = Object.values(
          responseData
        );

        const firstMessage = values.find(
          (value) =>
            typeof value === "string" ||
            Array.isArray(value)
        );

        if (typeof firstMessage === "string") {
          message = firstMessage;
        } else if (
          Array.isArray(firstMessage)
        ) {
          message =
            firstMessage.join(" ");
        }
      }

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    value: string | null | undefined
  ) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(value));
  };

  // ============================================================
  // ÉTAT DE CHARGEMENT
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#E3E6E8] bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-[#64748B]">
          <Loader2
            size={20}
            className="animate-spin text-[#B4232F]"
          />
          Chargement du retour...
        </div>
      </div>
    );
  }

  // ============================================================
  // ERREUR DE CHARGEMENT
  // ============================================================

  if (error && !reservation) {
    return (
      <div className="space-y-5 bg-[#F4F5F6] p-4 sm:p-6">
        <button
          type="button"
          onClick={() =>
            navigate("/agent/locations")
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#202327]"
        >
          <ArrowLeft size={17} />
          Retour aux locations
        </button>

        <div className="rounded-2xl border border-[#F3C0C7] bg-[#FFF4F5] p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-[#B4232F]"
            />

            <div>
              <h1 className="font-semibold text-[#B4232F]">
                Retour impossible
              </h1>

              <p className="mt-1 text-sm text-[#8F1E2A]">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUCCÈS
  // ============================================================

  if (success) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#F4F5F6] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E3E6E8] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7F0] text-[#16845B]">
            <CheckCircle2 size={30} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#202327]">
            Retour enregistré
          </h1>

          <p className="mt-2 text-sm text-[#64748B]">
            Le retour des véhicules a été enregistré
            avec succès. La réservation est maintenant
            terminée.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#64748B]">
            <Loader2
              size={14}
              className="animate-spin text-[#B4232F]"
            />
            Redirection vers les locations...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE PRINCIPALE
  // ============================================================

  return (
    <div className="space-y-6 bg-[#F4F5F6] p-4 sm:p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/agent/locations")
            }
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#202327]"
          >
            <ArrowLeft size={17} />
            Retour aux locations
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17191C] text-white shadow-sm">
              <RotateCcw size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#202327]">
                Retour des véhicules
              </h1>

              <p className="mt-1 text-sm text-[#64748B]">
                Enregistrer l'état et le kilométrage
                des véhicules retournés
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Impossible d'enregistrer le retour
            </p>

            <p className="mt-1 text-sm text-red-700">
              {submitError}
            </p>
          </div>
        </div>
      )}

      {/* INFORMATIONS RÉSERVATION */}

      {reservation && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Réservation
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {reservation.numero}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <UserRound
                    size={16}
                    className="text-gray-400"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {reservation.client_nom ||
                      "Client inconnu"}
                  </span>
                </div>

                <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                  {totalVehicules} véhicule
                  {totalVehicules > 1
                    ? "s"
                    : ""}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Début de location
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(
                  reservation.date_debut
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">
                Retour prévu
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(
                  reservation.date_fin
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">
                Progression
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {completedLines} /{" "}
                {totalVehicules} véhicule
                {totalVehicules > 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VÉHICULES */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Inspection des véhicules
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Renseignez le kilométrage et l'état de
              chaque véhicule au moment du retour.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {reservation?.lignes.map(
            (ligne, index) => {
              const formLine = lines.find(
                (line) =>
                  line.ligne_reservation_id ===
                  ligne.id
              );

              if (!formLine) return null;

              return (
                <div
                  key={ligne.id}
                  className="p-5"
                >
                  <div className="flex flex-col gap-5">
                    {/* VEHICULE */}

                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <CarFront size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {ligne.vehicule.brand}{" "}
                          {ligne.vehicule.model}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Véhicule #{index + 1}
                        </p>
                      </div>
                    </div>

                    {/* CHAMPS */}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {/* KILOMETRAGE */}

                      <div>
                        <label
                          htmlFor={`mileage-${ligne.id}`}
                          className="mb-1.5 block text-sm font-semibold text-gray-700"
                        >
                          Kilométrage de retour
                        </label>

                        <input
                          id={`mileage-${ligne.id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={
                            formLine.kilometrage_retour
                          }
                          onChange={(event) =>
                            updateLine(
                              ligne.id,
                              "kilometrage_retour",
                              event.target.value
                            )
                          }
                          placeholder="Ex. 45280"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                        />

                        <p className="mt-1.5 text-xs text-gray-400">
                          Le serveur vérifiera que le
                          kilométrage est cohérent.
                        </p>
                      </div>

                      {/* ETAT */}

                      <div>
                        <label
                          htmlFor={`condition-${ligne.id}`}
                          className="mb-1.5 block text-sm font-semibold text-gray-700"
                        >
                          État général
                        </label>

                        <select
                          id={`condition-${ligne.id}`}
                          value={
                            formLine.etat_general
                          }
                          onChange={(event) =>
                            updateLine(
                              ligne.id,
                              "etat_general",
                              event.target
                                .value as VehicleReturnCondition
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                        >
                          <option value="BON">
                            Bon état
                          </option>

                          <option value="DOMMAGES_MINEURS">
                            Dommages mineurs
                          </option>

                          <option value="DOMMAGES_MAJEURS">
                            Dommages majeurs
                          </option>
                        </select>
                      </div>

                      {/* OBSERVATIONS */}

                      <div>
                        <label
                          htmlFor={`observations-${ligne.id}`}
                          className="mb-1.5 block text-sm font-semibold text-gray-700"
                        >
                          Observations
                        </label>

                        <input
                          id={`observations-${ligne.id}`}
                          type="text"
                          value={
                            formLine.observations
                          }
                          onChange={(event) =>
                            updateLine(
                              ligne.id,
                              "observations",
                              event.target.value
                            )
                          }
                          placeholder="État, dommages, remarques..."
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* FINANCES */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Frais et caution
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Les pénalités sont transmises au serveur
            pour validation et enregistrement.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="penalite-retard"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Pénalité de retard
            </label>

            <div className="relative">
              <input
                id="penalite-retard"
                type="number"
                min="0"
                step="0.01"
                value={penaliteRetard}
                onChange={(event) =>
                  setPenaliteRetard(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-16 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                HTG
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="penalite-dommages"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              Pénalité de dommages
            </label>

            <div className="relative">
              <input
                id="penalite-dommages"
                type="number"
                min="0"
                step="0.01"
                value={penaliteDommages}
                onChange={(event) =>
                  setPenaliteDommages(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-16 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                HTG
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={cautionRestituee}
              onChange={(event) =>
                setCautionRestituee(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-gray-400"
            />

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Caution restituée
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                Confirmer que la caution du client a
                été restituée.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            navigate("/agent/locations")
          }
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !allKilometragesCompleted ||
            lines.length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={17} />
              Enregistrer le retour
            </>
          )}
        </button>
      </div>
    </div>
  );
}