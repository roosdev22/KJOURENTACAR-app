
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Receipt,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import facturationService, {
  type Facture,
  type SituationFinanciere,
} from "../../api/services/facturationService";
import { reservationService } from "../../api/services/reservationService";
import type { Reservation } from "../../types/reservation";

interface AgentFacturationProps {
  /** À true uniquement pour une route réservée au rôle AGENT. */
  canGenerate?: boolean;
}

const PAGE_SIZE = 8;

const STATUT_FACTURE_LABELS: Record<Facture["statut"], string> = {
  EMISE: "Émise",
  ANNULEE: "Annulée",
};

const STATUT_REGLEMENT_LABELS: Record<
  SituationFinanciere["statut_reglement"],
  string
> = {
  NON_PAYEE: "Non payée",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatAmount(
  value: string | number | null | undefined,
  devise: string,
): string {
  if (value === null || value === undefined || value === "") {
    return `— ${devise}`;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} ${devise}`;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${devise}`;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<unknown>(error)) {
    const data: unknown = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;

      if (typeof record.detail === "string") return record.detail;
      if (typeof record.message === "string") return record.message;

      for (const value of Object.values(record)) {
        if (typeof value === "string" && value.trim()) {
          return value;
        }

        if (Array.isArray(value) && typeof value[0] === "string") {
          return value[0];
        }
      }
    }

    if (error.response?.status === 403) {
      return "Vous n'avez pas les droits nécessaires pour cette action.";
    }

    if (error.response?.status === 401) {
      return "Votre session a expiré. Veuillez vous reconnecter.";
    }

    if (!error.response) {
      return "Impossible de contacter le serveur. Vérifiez votre connexion.";
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;

  return "Une erreur inattendue est survenue.";
}

function getReservationLabel(reservation: Reservation): string {
  const numero = reservation.numero || reservation.id;
  const client = reservation.client_nom || "Client non renseigné";

  return `${numero} — ${client}`;
}

function FactureStatusBadge({
  statut,
}: {
  statut: Facture["statut"];
}) {
  const active = statut === "EMISE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {STATUT_FACTURE_LABELS[statut]}
    </span>
  );
}

function ReglementStatusBadge({
  statut,
}: {
  statut: SituationFinanciere["statut_reglement"];
}) {
  const className =
    statut === "PAYEE"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : statut === "PARTIELLEMENT_PAYEE"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {STATUT_REGLEMENT_LABELS[statut]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
}) {
  return (
    <div className="rounded-2xl border border-[#E3E6E8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
            {label}
          </p>
          <p className="mt-2 break-words text-lg font-bold text-[#202327]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17191C] text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AgentFacturation({
  canGenerate = false,
}: AgentFacturationProps) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [situation, setSituation] =
    useState<SituationFinanciere | null>(null);

  const [selectedFactureId, setSelectedFactureId] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [situationFactureId, setSituationFactureId] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadingSituation =
    Boolean(selectedFactureId) &&
    situationFactureId !== selectedFactureId;

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [facturesData, reservationsData] = await Promise.all([
        facturationService.lister(),
        reservationService.getAllReservations(),
      ]);

      setFactures(facturesData);
      setReservations(reservationsData);

      setSelectedFactureId((current) => {
        if (
          current &&
          facturesData.some((facture) => facture.id === current)
        ) {
          return current;
        }

        return facturesData[0]?.id ?? "";
      });

      setSelectedReservationId((current) => {
        if (
          current &&
          reservationsData.some(
            (reservation) => reservation.id === current,
          )
        ) {
          return current;
        }

        return "";
      });
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const [facturesData, reservationsData] = await Promise.all([
          facturationService.lister(),
          reservationService.getAllReservations(),
        ]);

        if (!active) return;

        setFactures(facturesData);
        setReservations(reservationsData);

        setSelectedFactureId((current) =>
          current && facturesData.some((item) => item.id === current)
            ? current
            : facturesData[0]?.id ?? "",
        );

        setSelectedReservationId("");
      } catch (loadError: unknown) {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  const selectedFacture = useMemo(
    () =>
      factures.find((facture) => facture.id === selectedFactureId) ??
      null,
    [factures, selectedFactureId],
  );

  const reservationById = useMemo(
    () =>
      new Map(
        reservations.map((reservation) => [
          reservation.id,
          reservation,
        ]),
      ),
    [reservations],
  );

  const filteredFactures = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");

    if (!query) return factures;

    return factures.filter((facture) => {
      const reservation = reservationById.get(
        facture.reservation_id,
      );

      return [
        facture.reference,
        facture.reservation_id,
        reservation?.numero,
        reservation?.client_nom,
      ].some((value) =>
        value?.toLocaleLowerCase("fr").includes(query),
      );
    });
  }, [factures, reservationById, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFactures.length / PAGE_SIZE),
  );

  const safePage = Math.min(page, totalPages);

  const paginatedFactures = filteredFactures.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const reservationsEligibles = useMemo(() => {
    const reservationsDejaFacturees = new Set(
      factures.map((facture) => facture.reservation_id),
    );

    return reservations.filter(
      (reservation) =>
        ["CONFIRMED", "EN_COURS", "TERMINEE"].includes(
          reservation.statut,
        ) &&
        !reservationsDejaFacturees.has(reservation.id),
    );
  }, [factures, reservations]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedFactureId) {
      return () => {
        cancelled = true;
      };
    }

    const loadSituation = async () => {
      try {
        const result =
          await facturationService.situationFinanciere(
            selectedFactureId,
          );

        if (!cancelled) {
          setSituation(result);
          setSituationFactureId(selectedFactureId);
        }
      } catch (situationError: unknown) {
        if (!cancelled) {
          setSituation(null);
          setSituationFactureId(selectedFactureId);
          setError(getErrorMessage(situationError));
        }
      }
    };

    void loadSituation();

    return () => {
      cancelled = true;
    };
  }, [selectedFactureId]);

  const handleGenerate = async () => {
    if (
      !canGenerate ||
      !selectedReservationId ||
      generating
    ) {
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const facture = await facturationService.generer({
        reservation_id: selectedReservationId,
      });

      setFactures((current) => {
        const alreadyExists = current.some(
          (item) => item.id === facture.id,
        );

        return alreadyExists
          ? current.map((item) =>
              item.id === facture.id ? facture : item,
            )
          : [facture, ...current];
      });

      setSelectedFactureId(facture.id);
      setSelectedReservationId("");
      setPage(1);

      setSuccess(
        `La facture ${facture.reference} a été générée.`,
      );

      await loadData(true);

      setSelectedFactureId(facture.id);
    } catch (generationError: unknown) {
      setError(getErrorMessage(generationError));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#F4F5F6] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17191C] text-white shadow-sm">
              <Receipt className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#202327]">
                Facturation
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Consultation des factures et suivi des règlements
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing || generating}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Fermer le message d'erreur"
            className="text-red-600 hover:text-red-800"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">{success}</div>

          <button
            type="button"
            onClick={() => setSuccess(null)}
            aria-label="Fermer le message de confirmation"
            className="text-emerald-600 hover:text-emerald-800"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Total des factures"
          value={String(factures.length)}
          icon={Receipt}
        />

        <SummaryCard
          label="Factures émises"
          value={String(
            factures.filter((item) => item.statut === "EMISE").length,
          )}
          icon={FileText}
        />

        <SummaryCard
          label="Factures annulées"
          value={String(
            factures.filter((item) => item.statut === "ANNULEE").length,
          )}
          icon={XCircle}
        />
      </div>

      {canGenerate && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Générer une facture
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Sélectionnez une réservation éligible. Les montants
              sont calculés par le backend.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:flex-row">
            <select
              value={selectedReservationId}
              onChange={(event) =>
                setSelectedReservationId(event.target.value)
              }
              disabled={loading || generating}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-50"
            >
              <option value="">
                Sélectionner une réservation
              </option>

              {reservationsEligibles.map((reservation) => (
                <option
                  key={reservation.id}
                  value={reservation.id}
                >
                  {getReservationLabel(reservation)} —{" "}
                  {reservation.statut}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={
                !selectedReservationId ||
                generating ||
                loading ||
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Générer la facture
                </>
              )}
            </button>
          </div>

          {!loading && reservationsEligibles.length === 0 && (
            <p className="px-5 pb-5 text-xs text-slate-500">
              Aucune réservation éligible sans facture pour le moment.
            </p>
          )}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Liste des factures
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredFactures.length} résultat(s)
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Référence, réservation, client..."
                aria-label="Rechercher une facture"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des factures...
          </div>
        ) : paginatedFactures.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Aucune facture trouvée
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Les factures disponibles apparaîtront ici.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">
                      Référence
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Réservation
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Location
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Caution
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Émise le
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Statut
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Détail
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedFactures.map((facture) => {
                    const reservation = reservationById.get(
                      facture.reservation_id,
                    );

                    const selected =
                      selectedFactureId === facture.id;

                    return (
                      <tr
                        key={facture.id}
                        className={`transition hover:bg-slate-50 ${
                          selected ? "bg-red-50/50" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {facture.reference}
                          </p>

                          <p className="mt-1 font-mono text-[11px] text-slate-400">
                            {facture.id.slice(0, 8)}...
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {reservation?.numero ?? "Réservation"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {reservation?.client_nom ??
                              facture.reservation_id}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          {formatAmount(
                            facture.montant_location,
                            facture.devise,
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {formatAmount(
                            facture.montant_caution,
                            facture.devise,
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(facture.emise_le)}
                        </td>

                        <td className="px-5 py-4">
                          <FactureStatusBadge
                            statut={facture.statut}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFactureId(facture.id)
                            }
                            aria-label={`Consulter la facture ${facture.reference}`}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              selected
                                ? "bg-red-600 text-white"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Page {safePage} sur {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage(Math.max(1, safePage - 1))
                  }
                  disabled={safePage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage(Math.min(totalPages, safePage + 1))
                  }
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedFacture && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Situation financière
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Facture {selectedFacture.reference}
                </p>
              </div>

              <FactureStatusBadge
                statut={selectedFacture.statut}
              />
            </div>
          </div>

          {loadingSituation ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement de la situation financière...
            </div>
          ) : situation && situationFactureId === selectedFactureId ? (
            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Montant location"
                  value={formatAmount(
                    situation.montant_location,
                    situation.devise,
                  )}
                  icon={FileText}
                />

                <SummaryCard
                  label="Caution"
                  value={formatAmount(
                    situation.montant_caution,
                    situation.devise,
                  )}
                  icon={WalletCards}
                />

                <SummaryCard
                  label="Montant payé"
                  value={formatAmount(
                    situation.montant_paye,
                    situation.devise,
                  )}
                  icon={CheckCircle2}
                />

                <SummaryCard
                  label="Montant restant"
                  value={formatAmount(
                    situation.montant_restant,
                    situation.devise,
                  )}
                  icon={WalletCards}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    État du règlement
                  </p>

                  <div className="mt-2">
                    <ReglementStatusBadge
                      statut={situation.statut_reglement}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Données financières calculées par le backend.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              La situation financière n'est pas disponible.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
