import { useCallback, useEffect, useState } from "react";
import rapportService from "../../api/services/rapportService";
import AdminIcon from "../../components/admin/AdminIcon";
import type {
  DemandeGenerationRapport,
  FormatRapport,
  RapportGenere,
  StatutRapport,
  TypeRapport,
} from "../../api/services/rapportService";

const TYPES_RAPPORT: {
  value: TypeRapport;
  label: string;
  description: string;
}[] = [
  {
    value: "FINANCIER",
    label: "Rapport financier",
    description: "Paiements réussis et montants par devise",
  },
  {
    value: "RESERVATIONS",
    label: "Rapport des réservations",
    description: "Réservations réparties par statut et période",
  },
  {
    value: "VEHICULES",
    label: "Rapport du parc automobile",
    description: "État actuel de la flotte de véhicules",
  },
  {
    value: "CONTRATS",
    label: "Rapport des contrats",
    description: "Contrats générés et état des signatures",
  },
  {
    value: "MAINTENANCE",
    label: "Rapport de maintenance",
    description: "Interventions, statuts et coûts enregistrés",
  },
];

const STATUTS: Record<
  StatutRapport,
  { label: string; className: string }
> = {
  EN_ATTENTE: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700",
  },
  EN_COURS: {
    label: "En cours",
    className: "bg-blue-50 text-blue-700",
  },
  TERMINE: {
    label: "Terminé",
    className: "bg-emerald-50 text-emerald-700",
  },
  ECHEC: {
    label: "Échec",
    className: "bg-red-50 text-red-700",
  },
};

function dateLocale(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function afficherDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-HT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Extrait un message affichable d'une erreur inconnue.
 * Le service lève déjà des messages précis (avec `cause`),
 * on les affiche tels quels.
 */
function messageDepuisErreur(erreur: unknown, parDefaut: string): string {
  return erreur instanceof Error && erreur.message
    ? erreur.message
    : parDefaut;
}

const MESSAGE_HISTORIQUE = "Impossible de charger l'historique des rapports.";

/**
 * Récupère l'historique et garantit un tableau.
 * Fonction pure : aucun setState ici.
 */
async function recupererHistorique(): Promise<RapportGenere[]> {
  const resultat = await rapportService.listerGeneres();
  return Array.isArray(resultat) ? resultat : [];
}

export default function AdminReports() {
  const [typeRapport, setTypeRapport] =
    useState<TypeRapport>("FINANCIER");

  const [formatRapport, setFormatRapport] =
    useState<FormatRapport>("PDF");

  const [dateDebut, setDateDebut] = useState(dateLocale);
  const [dateFin, setDateFin] = useState(dateLocale);

  const [rapports, setRapports] = useState<RapportGenere[]>([]);
  const [chargement, setChargement] = useState(true);
  const [generation, setGeneration] = useState(false);
  const [telechargementId, setTelechargementId] =
    useState<string | null>(null);

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  /**
   * Rechargement de l'historique (bouton « Actualiser » et
   * après une génération).
   *
   * Il n'efface pas `erreur` au départ : sinon il effacerait le
   * message d'une génération échouée juste après l'avoir affiché.
   */
  const chargerRapports = useCallback(async () => {
    try {
      setRapports(await recupererHistorique());
    } catch (e: unknown) {
      console.error("Chargement de l'historique :", e);
      setErreur(messageDepuisErreur(e, MESSAGE_HISTORIQUE));
    } finally {
      setChargement(false);
    }
  }, []);

  // Chargement initial : les setState sont appelés dans les callbacks
  // de la promesse, jamais de façon synchrone dans le corps de l'effet.
  useEffect(() => {
    let actif = true;

    recupererHistorique()
      .then((liste) => {
        if (actif) setRapports(liste);
      })
      .catch((e: unknown) => {
        if (!actif) return;
        console.error("Chargement de l'historique :", e);
        setErreur(messageDepuisErreur(e, MESSAGE_HISTORIQUE));
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, []);

  const actualiser = () => {
    setErreur("");
    setMessage("");
    setChargement(true);
    void chargerRapports();
  };

  const genererRapport = async () => {
    setErreur("");
    setMessage("");

    if (!dateDebut || !dateFin) {
      setErreur("Veuillez sélectionner les deux dates.");
      return;
    }

    if (dateDebut > dateFin) {
      setErreur(
        "La date de début doit être antérieure ou égale à la date de fin.",
      );
      return;
    }

    const demande: DemandeGenerationRapport = {
      type_rapport: typeRapport,
      format_rapport: formatRapport,
      date_debut: dateDebut,
      date_fin: dateFin,
    };

    setGeneration(true);

    try {
      const rapport = await rapportService.generer(demande);

      if (rapport.statut === "TERMINE") {
        setMessage("Rapport généré avec succès.");
      } else {
        setErreur(
          rapport.erreur ||
            "La génération du rapport n'a pas abouti.",
        );
      }
    } catch (e: unknown) {
      console.error("Génération du rapport :", e);
      setErreur(messageDepuisErreur(e, "La génération a échoué."));
    } finally {
      setGeneration(false);
    }

    // Rechargement dans tous les cas : un rapport en échec
    // est aussi enregistré dans l'historique.
    await chargerRapports();
  };

  const telechargerRapport = async (rapport: RapportGenere) => {
    setErreur("");
    setMessage("");
    setTelechargementId(rapport.id);

    try {
      await rapportService.telecharger({
        id: rapport.id,
        format_rapport: rapport.format_rapport,
      });
      setMessage("Téléchargement du rapport lancé.");
    } catch (e: unknown) {
      console.error("Téléchargement du rapport :", e);
      setErreur(messageDepuisErreur(e, "Le téléchargement a échoué."));
    } finally {
      setTelechargementId(null);
    }
  };

  const rapportsTermines = rapports.filter(
    (rapport) => rapport.statut === "TERMINE",
  ).length;

  const rapportsEnEchec = rapports.filter(
    (rapport) => rapport.statut === "ECHEC",
  ).length;

  const nomType = (type: TypeRapport) =>
    TYPES_RAPPORT.find((item) => item.value === type)?.label ?? type;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-kjou-red">
            Administration / Pilotage
          </div>

          <h1 className="font-kjou-display text-2xl font-bold tracking-tight text-kjou-text sm:text-[30px]">
            Rapports et exports
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-kjou-muted">
            Préparez un rapport métier puis retrouvez les fichiers générés.
          </p>
        </div>

        <button
          type="button"
          onClick={actualiser}
          disabled={chargement}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-kjou-control border border-kjou-border bg-white px-4 py-2 text-sm font-semibold text-kjou-text transition hover:bg-kjou-mist disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2 sm:self-auto"
        >
          <AdminIcon
            name="refresh"
            size={16}
            className={chargement ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </header>

      {erreur && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AdminIcon name="alert" size={19} className="mt-0.5 shrink-0" />
          <p>{erreur}</p>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <AdminIcon name="check-circle" size={19} className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <section
        aria-label="Synthèse des rapports"
        className="grid grid-cols-1 gap-px overflow-hidden rounded-kjou-card border border-kjou-border bg-kjou-border sm:grid-cols-3"
      >
        {[
          {
            label: "Rapports enregistrés",
            value: rapports.length,
            detail: "Historique des générations",
          },
          {
            label: "Générations réussies",
            value: rapportsTermines,
            detail: "Fichiers prêts au téléchargement",
          },
          {
            label: "Générations en échec",
            value: rapportsEnEchec,
            detail: "À vérifier si nécessaire",
          },
        ].map((item) => (
          <div key={item.label} className="bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-medium text-kjou-muted">{item.label}</p>
            <p className="mt-1 font-kjou-display text-2xl font-bold text-kjou-text">
              {chargement ? "—" : item.value}
            </p>
            <p className="mt-1 text-xs text-kjou-muted">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-red-50 p-2 text-red-700">
              <AdminIcon name="file" size={20} />
            </span>
            <div>
              <h2 className="font-bold text-gray-900">
                Générer un rapport
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez le type, la période et le format du fichier.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label
              htmlFor="type-rapport"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Type de rapport
            </label>

            <select
              id="type-rapport"
              value={typeRapport}
              onChange={(event) =>
                setTypeRapport(event.target.value as TypeRapport)
              }
              disabled={generation}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {TYPES_RAPPORT.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-sm text-gray-500">
              {
                TYPES_RAPPORT.find(
                  (type) => type.value === typeRapport,
                )?.description
              }
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="date-debut"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Date de début
              </label>
              <div className="relative">
                <AdminIcon
                  name="reservation"
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="date-debut"
                  type="date"
                  value={dateDebut}
                  max={dateFin || undefined}
                  onChange={(event) => setDateDebut(event.target.value)}
                  disabled={generation}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="date-fin"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Date de fin
              </label>
              <div className="relative">
                <AdminIcon
                  name="reservation"
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="date-fin"
                  type="date"
                  value={dateFin}
                  min={dateDebut || undefined}
                  onChange={(event) => setDateFin(event.target.value)}
                  disabled={generation}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-gray-700">
              Format d’exportation
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormatRapport("PDF")}
                disabled={generation}
                aria-pressed={formatRapport === "PDF"}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  formatRapport === "PDF"
                    ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <AdminIcon
                  name="file"
                  size={23}
                  className={
                    formatRapport === "PDF"
                      ? "text-red-700"
                      : "text-gray-500"
                  }
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Document PDF
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Pour consultation et impression
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormatRapport("EXCEL")}
                disabled={generation}
                aria-pressed={formatRapport === "EXCEL"}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                  formatRapport === "EXCEL"
                    ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <AdminIcon
                  name="spreadsheet"
                  size={23}
                  className={
                    formatRapport === "EXCEL"
                      ? "text-red-700"
                      : "text-gray-500"
                  }
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    Fichier Excel
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Pour analyser les données
                  </span>
                </span>
              </button>
            </div>
          </fieldset>

          <div className="flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
            <p className="text-xs leading-5 text-gray-500">
              <AdminIcon
                name="shield"
                size={15}
                className="mr-1 inline-block align-text-bottom"
              />
              La génération et l’accès aux fichiers sont contrôlés par le backend.
            </p>

            <button
              type="button"
              onClick={() => void genererRapport()}
              disabled={generation || chargement}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generation ? (
                <AdminIcon name="loader" size={18} className="animate-spin" />
              ) : (
                <AdminIcon name="reports" size={18} />
              )}
              {generation ? "Génération en cours..." : "Générer le rapport"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-bold text-gray-900">
              Historique des rapports
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Consultez les générations précédentes et téléchargez les fichiers disponibles.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 self-start rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
            <AdminIcon name="clock" size={14} />
            {rapports.length} rapport(s)
          </span>
        </div>

        {chargement ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500">
            <AdminIcon name="loader" size={19} className="animate-spin" />
            Chargement de l’historique...
          </div>
        ) : rapports.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="rounded-2xl bg-gray-100 p-4 text-gray-500">
              <AdminIcon name="file" size={28} />
            </span>
            <h3 className="mt-4 font-semibold text-gray-900">
              Aucun rapport enregistré
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Les rapports générés apparaîtront ici avec leur statut et leur option de téléchargement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Rapport</th>
                  <th className="px-5 py-3 font-semibold">Période</th>
                  <th className="px-5 py-3 font-semibold">Format</th>
                  <th className="px-5 py-3 font-semibold">Création</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rapports.map((rapport) => {
                  const statut = STATUTS[rapport.statut];
                  const enTelechargement =
                    telechargementId === rapport.id;

                  return (
                    <tr
                      key={rapport.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {nomType(rapport.type_rapport)}
                        </p>
                        {rapport.erreur && (
                          <p className="mt-1 max-w-xs text-xs text-red-600">
                            {rapport.erreur}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {rapport.date_debut} – {rapport.date_fin}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-gray-700">
                          {rapport.format_rapport === "PDF" ? (
                            <AdminIcon name="file" size={16} />
                          ) : (
                            <AdminIcon name="spreadsheet" size={16} />
                          )}
                          {rapport.format_rapport}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {afficherDate(rapport.cree_le)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statut.className}`}
                        >
                          {statut.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void telechargerRapport(rapport)}
                          disabled={
                            rapport.statut !== "TERMINE" ||
                            enTelechargement
                          }
                          title={
                            rapport.statut === "TERMINE"
                              ? "Télécharger le rapport"
                              : "Le fichier n'est pas disponible"
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {enTelechargement ? (
                            <AdminIcon
                              name="loader"
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <AdminIcon name="download" size={15} />
                          )}
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-gray-300 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="rounded-lg bg-gray-100 p-3 text-gray-700">
            <AdminIcon name="settings" size={22} />
          </span>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-gray-900">
                Rapports automatiques
              </h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                Phase suivante
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              La conception prévoit la planification quotidienne,
              hebdomadaire ou mensuelle, le choix des formats PDF/Excel
              et la gestion des destinataires. L’interface de configuration
              sera activée lors de la phase dédiée aux planifications
              automatiques.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}