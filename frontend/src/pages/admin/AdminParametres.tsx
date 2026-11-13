
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import parametresService from "../../api/services/parametresService";
import AdminIcon from "../../components/admin/AdminIcon";
import type {
  HistoriqueParametre,
  ModifierParametresEntreprise,
  ParametresEntreprise,
} from "../../types/parametres";

const emptyForm: ModifierParametresEntreprise = {
  raison_sociale: "",
  nom_commercial: "K-JOU RENT A CAR",
  nif: "",
  patente: "",
  adresse: "",
  telephone: "",
  email: "",
  site_web: "",
  devise_defaut: "HTG",
  prefixe_reservation: "RES",
  prefixe_facture: "FAC",
  prefixe_contrat: "CTR",
  justification: "",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string; justification?: string }>(error)) {
    return (
      error.response?.data?.detail ??
      error.response?.data?.justification ??
      error.message ??
      "Une erreur est survenue."
    );
  }

  return "Une erreur inattendue est survenue.";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-HT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function creerFormulaire(
  configuration: ParametresEntreprise,
): ModifierParametresEntreprise {
  return {
    raison_sociale: configuration.raison_sociale,
    nom_commercial: configuration.nom_commercial,
    nif: configuration.nif,
    patente: configuration.patente,
    adresse: configuration.adresse,
    telephone: configuration.telephone,
    email: configuration.email,
    site_web: configuration.site_web,
    devise_defaut: configuration.devise_defaut,
    prefixe_reservation: configuration.prefixe_reservation,
    prefixe_facture: configuration.prefixe_facture,
    prefixe_contrat: configuration.prefixe_contrat,
    justification: "",
  };
}

export default function AdminParametres() {
  const [parametres, setParametres] =
    useState<ParametresEntreprise | null>(null);

  const [form, setForm] =
    useState<ModifierParametresEntreprise>(emptyForm);

  const [historique, setHistorique] =
    useState<HistoriqueParametre[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(
    () =>
      Promise.allSettled([
        parametresService.getParametres(),
        parametresService.getHistorique(),
      ]),
    [],
  );

  const applyLoadResults = useCallback(
    (
      [configurationResult, journalResult]:
        Awaited<ReturnType<typeof fetchData>>,
      preserveForm = false,
    ) => {
      const loadErrors: string[] = [];

      if (configurationResult.status === "fulfilled") {
        setParametres(configurationResult.value);
        if (!preserveForm) {
          setForm(creerFormulaire(configurationResult.value));
          setHasUnsavedChanges(false);
        }
      } else {
        loadErrors.push(
          `Impossible de charger les paramètres de l’entreprise. ${getErrorMessage(configurationResult.reason)}`
        );
      }

      if (journalResult.status === "fulfilled") {
        const journal = journalResult.value;
        setHistorique(
          Array.isArray(journal) ? journal : journal.results
        );
      } else {
        loadErrors.push(
          `Impossible de charger l’historique des modifications. ${getErrorMessage(journalResult.reason)}`
        );
      }

      setError(loadErrors.join(" "));
    },
    [],
  );

  const loadData = useCallback(async (preserveForm = false) => {
    const results = await fetchData();
    applyLoadResults(results, preserveForm);
    if (preserveForm && results[0].status === "fulfilled") {
      setRefreshNotice(
        "Vos modifications non enregistrées ont été conservées après l’actualisation.",
      );
    }
    setLoading(false);
    setRefreshing(false);
  }, [applyLoadResults, fetchData]);

  useEffect(() => {
    let active = true;

    fetchData()
      .then((results) => {
        if (active) {
          applyLoadResults(results);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyLoadResults, fetchData]);

  const handleRefresh = () => {
    if (refreshing || saving) {
      return;
    }

    setRefreshing(true);
    setError("");
    setSuccess("");
    setRefreshNotice("");
    void loadData(hasUnsavedChanges);
  };

  const updateField = <
    K extends keyof ModifierParametresEntreprise,
  >(
    field: K,
    value: ModifierParametresEntreprise[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
    setRefreshNotice("");
    setSuccess("");
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving || refreshing) {
      return;
    }

    setError("");
    setSuccess("");
    setRefreshNotice("");

    if (!parametres) {
      setError(
        "Les paramètres de l’entreprise ne sont pas chargés. Réessayez avant d’enregistrer."
      );
      return;
    }

    if (!form.justification.trim()) {
      setError("Le motif de modification est obligatoire.");
      return;
    }

    setSaving(true);

    try {
      const updated = await parametresService.modifierParametres(form);

      setParametres(updated);
      setForm(creerFormulaire(updated));
      setHasUnsavedChanges(false);

      setSuccess("Les paramètres ont été enregistrés.");
      await loadData(false);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <AdminIcon name="refresh" className="h-5 w-5 animate-spin" />
        <span>Chargement des paramètres...</span>
      </div>
    );
  }

  if (!parametres) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-kjou-display text-2xl font-bold tracking-tight text-kjou-text">
              Paramètres de l’entreprise
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Les paramètres enregistrés n’ont pas pu être chargés.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AdminIcon
              name="refresh"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Nouvelle tentative..." : "Réessayer"}
          </button>
        </div>

        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error ||
            "Les paramètres ne sont pas disponibles. Réessayez avant toute modification."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <AdminIcon name="shield" className="h-4 w-4" />
            Administration / Paramètres
          </div>

          <h1 className="font-kjou-display text-2xl font-bold tracking-tight text-kjou-text">
            Paramètres de l’entreprise
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez l’identité, la devise et la numérotation de vos documents.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AdminIcon
            name="refresh"
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AdminIcon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <AdminIcon name="check-circle" className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {refreshNotice && (
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
        >
          {refreshNotice}
        </p>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >
        <fieldset
          disabled={saving || refreshing}
          className="space-y-6 border-0 p-0 disabled:opacity-70"
        >
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="rounded-lg bg-red-50 p-2 text-red-700">
              <AdminIcon name="building" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Identité de l’entreprise
              </h2>
              <p className="text-xs text-slate-500">
                Informations utilisées pour les documents officiels.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-company-commercial-name" className={labelClass}>Nom commercial *</label>
              <input
                id="admin-company-commercial-name"
                className={inputClass}
                required
                maxLength={200}
                value={form.nom_commercial}
                onChange={(e) =>
                  updateField("nom_commercial", e.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="admin-company-legal-name" className={labelClass}>Raison sociale</label>
              <input
                id="admin-company-legal-name"
                className={inputClass}
                maxLength={200}
                value={form.raison_sociale}
                onChange={(e) =>
                  updateField("raison_sociale", e.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="admin-company-nif" className={labelClass}>NIF</label>
              <input
                id="admin-company-nif"
                className={inputClass}
                maxLength={50}
                value={form.nif}
                onChange={(e) => updateField("nif", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-company-patent" className={labelClass}>Numéro de patente</label>
              <input
                id="admin-company-patent"
                className={inputClass}
                maxLength={50}
                value={form.patente}
                onChange={(e) => updateField("patente", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="admin-company-address" className={labelClass}>Adresse</label>
              <textarea
                id="admin-company-address"
                className={inputClass}
                rows={2}
                value={form.adresse}
                onChange={(e) => updateField("adresse", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-company-phone" className={labelClass}>Téléphone</label>
              <input
                id="admin-company-phone"
                className={inputClass}
                type="tel"
                maxLength={30}
                value={form.telephone}
                onChange={(e) => updateField("telephone", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-company-email" className={labelClass}>Adresse e-mail</label>
              <input
                id="admin-company-email"
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="admin-company-website" className={labelClass}>Site web</label>
              <input
                id="admin-company-website"
                className={inputClass}
                type="url"
                placeholder="https://..."
                value={form.site_web}
                onChange={(e) => updateField("site_web", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Configuration financière
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Devise utilisée par défaut dans l’application.
            </p>
          </div>

          <div className="p-5">
            <label htmlFor="admin-default-currency" className={labelClass}>Devise par défaut</label>
            <select
              id="admin-default-currency"
              className={inputClass}
              value={form.devise_defaut}
              onChange={(e) =>
                updateField(
                  "devise_defaut",
                  e.target.value as "HTG" | "USD"
                )
              }
            >
              <option value="HTG">HTG — Gourde haïtienne</option>
              <option value="USD">USD — Dollar américain</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Ce réglage ne modifie pas les montants ni les taux de change
              des paiements déjà enregistrés.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Préfixes de numérotation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Les préfixes configurés seront utilisés par les services métier
              lorsqu’ils seront reliés à cette configuration.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-3">
            <div>
              <label htmlFor="admin-reservation-prefix" className={labelClass}>Réservations</label>
              <input
                id="admin-reservation-prefix"
                className={inputClass}
                required
                maxLength={20}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,19}"
                value={form.prefixe_reservation}
                onChange={(e) =>
                  updateField("prefixe_reservation", e.target.value.toUpperCase())
                }
              />
            </div>

            <div>
              <label htmlFor="admin-invoice-prefix" className={labelClass}>Factures</label>
              <input
                id="admin-invoice-prefix"
                className={inputClass}
                required
                maxLength={20}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,19}"
                value={form.prefixe_facture}
                onChange={(e) =>
                  updateField("prefixe_facture", e.target.value.toUpperCase())
                }
              />
            </div>

            <div>
              <label htmlFor="admin-contract-prefix" className={labelClass}>Contrats</label>
              <input
                id="admin-contract-prefix"
                className={inputClass}
                required
                maxLength={20}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,19}"
                value={form.prefixe_contrat}
                onChange={(e) =>
                  updateField("prefixe_contrat", e.target.value.toUpperCase())
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <label htmlFor="admin-change-justification" className={labelClass}>
            Motif de la modification *
          </label>
          <textarea
            id="admin-change-justification"
            className={inputClass}
            rows={3}
            required
            maxLength={2000}
            placeholder="Expliquez pourquoi vous modifiez ces paramètres..."
            value={form.justification}
            onChange={(e) =>
              updateField("justification", e.target.value)
            }
          />
          <p className="mt-2 text-xs text-slate-600">
            Le motif sera conservé dans l’historique d’audit.
          </p>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || refreshing || !parametres}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <AdminIcon name="refresh" className="h-4 w-4 animate-spin" />
            ) : (
              <AdminIcon name="save" className="h-4 w-4" />
            )}
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
        </fieldset>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <AdminIcon name="clock" className="h-5 w-5 text-slate-600" />
          <div>
            <h2 className="font-semibold text-slate-900">
              Historique des modifications
            </h2>
            <p className="text-xs text-slate-500">
              Les dernières actions enregistrées par le backend.
            </p>
          </div>
        </div>

        {historique === null ? (
          <p className="p-6 text-sm text-slate-500">
            Historique non disponible.
          </p>
        ) : historique.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun historique disponible.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {historique.map((entry) => (
              <article key={entry.id} className="space-y-2 p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.utilisateur_nom ?? "Utilisateur inconnu"} ·{" "}
                      {entry.action}
                    </p>
                  </div>
                  <time className="text-xs text-slate-500">
                    {formatDate(entry.date_action)}
                  </time>
                </div>

                {entry.justification && (
                  <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-medium">Motif : </span>
                    {entry.justification}
                  </p>
                )}

                {Object.keys(entry.nouvelles_valeurs).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-red-700">
                      Voir les valeurs modifiées
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-700">
                          Avant
                        </p>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                          {JSON.stringify(entry.anciennes_valeurs, null, 2)}
                        </pre>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-2 font-semibold text-slate-700">
                          Après
                        </p>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                          {JSON.stringify(entry.nouvelles_valeurs, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {parametres && (
        <p className="text-right text-xs text-slate-400">
          Dernière mise à jour : {formatDate(parametres.modifie_le)}
        </p>
      )}
    </div>
  );
}
