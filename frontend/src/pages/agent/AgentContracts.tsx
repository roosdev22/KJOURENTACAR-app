import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

import contractService from "../../api/services/contractService";
import type { Contract } from "../../types/contract";

const statusLabels: Record<Contract["status"], string> = {
  GENERATED: "Généré",
  SIGNED: "Signé",
  CANCELLED: "Annulé",
};

const statusClasses: Record<Contract["status"], string> = {
  GENERATED: "bg-blue-50 text-blue-700",
  SIGNED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

export default function AgentContracts() {
 
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await contractService.getContracts();
      setContracts(data);
    } catch (err: unknown) {
      setError(
        contractService.getErrorMessage(
          err,
          "Impossible de charger les contrats."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchContracts = async () => {
      try {
        const data = await contractService.getContracts();

        if (active) {
          setContracts(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            contractService.getErrorMessage(
              err,
              "Impossible de charger les contrats."
            )
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchContracts();

    return () => {
      active = false;
    };
  }, []);

  async function handleDownload(
    contract: Contract,
    type: "generated" | "signed"
  ) {
    setBusyId(contract.id);
    setError("");

    try {
      await contractService.download(contract.id, type);
    } catch (err: unknown) {
      setError(
        contractService.getErrorMessage(
          err,
          "Impossible de télécharger le document."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handlePrint(contract: Contract) {
    setBusyId(contract.id);
    setError("");

    // Ouvrir immédiatement une fenêtre pour éviter le blocage
    // des fenêtres contextuelles par le navigateur.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setBusyId(null);
      setError(
        "Le navigateur a bloqué la fenêtre d'impression. Autorise les fenêtres contextuelles puis réessaie."
      );
      return;
    }

    try {
      const blob = await contractService.getDocument(
        contract.id,
        "generated"
      );

      const url = URL.createObjectURL(blob);

      printWindow.location.href = url;

      printWindow.addEventListener(
        "beforeunload",
        () => URL.revokeObjectURL(url),
        { once: true }
      );

      printWindow.addEventListener(
        "load",
        () => {
          printWindow.focus();
          printWindow.print();
        },
        { once: true }
      );
    } catch (err: unknown) {
      printWindow.close();

      setError(
        contractService.getErrorMessage(
          err,
          "Impossible d'ouvrir le contrat pour impression."
        )
      );
    } finally {
      setBusyId(null);
    }
  }


  async function handleUpload(
    contract: Contract,
    file: File | undefined
  ) {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Sélectionne un fichier PDF.");
      return;
    }

    setBusyId(contract.id);
    setError("");
    setSuccess("");

    try {
      await contractService.uploadSigned(contract.id, file);
      setSuccess(`Le contrat ${contract.reference} a été signé et enregistré.`);
      await loadContracts();
    } catch (err: unknown) {
      setError(
        contractService.getErrorMessage(
          err,
          "Impossible d'enregistrer le contrat signé."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(contract: Contract) {
    const confirmed = window.confirm(
      `Confirmer l'annulation du contrat ${contract.reference} ?`
    );

    if (!confirmed) return;

    setBusyId(contract.id);
    setError("");
    setSuccess("");

    try {
      await contractService.cancel(contract.id);
      setSuccess(`Le contrat ${contract.reference} a été annulé.`);
      await loadContracts();
    } catch (err: unknown) {
      setError(
        contractService.getErrorMessage(
          err,
          "Impossible d'annuler le contrat."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full space-y-5 bg-gray-50 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
            Gestion documentaire
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            Contrats de location
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulte, télécharge et gère les contrats associés aux réservations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadContracts()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Liste des contrats</h2>
              <p className="text-xs text-gray-500">
                {contracts.length} contrat(s)
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Chargement des contrats...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-9 w-9 text-gray-300" />
            <p className="mt-3 font-medium text-gray-800">
              Aucun contrat disponible
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Les contrats apparaîtront ici lorsqu'ils seront créés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Référence
                </th>
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Réservation
                </th>
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Créé le
                </th>
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Documents
                </th>
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => {
                const busy = busyId === contract.id;

                return (
                  <tr
                    key={contract.id}
                    className="transition-colors hover:bg-gray-50/80"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-semibold text-gray-900">
                        {contract.reference}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-gray-600">
                        {contract.reservation_number || "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {formatDate(contract.generated_at)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[contract.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            contract.status === "GENERATED"
                              ? "bg-blue-600"
                              : contract.status === "SIGNED"
                                ? "bg-green-600"
                                : "bg-red-600"
                          }`}
                        />
                        {statusLabels[contract.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {contract.generated_available && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void handleDownload(contract, "generated")
                            }
                            title="Télécharger le contrat original"
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Original
                          </button>
                        )}

                        {contract.signed_available && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void handleDownload(contract, "signed")
                            }
                            title="Télécharger le contrat signé"
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 text-xs font-medium text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Signé
                          </button>
                        )}

                        {!contract.generated_available &&
                          !contract.signed_available && (
                            <span className="text-xs text-gray-400">
                              Aucun document
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {contract.generated_available &&
                          contract.status !== "CANCELLED" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handlePrint(contract)}
                              title="Imprimer le contrat original"
                              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Imprimer
                            </button>
                          )}

                        {contract.status === "GENERATED" && (
                          <>
                            <label
                              className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-red-700 px-2.5 text-xs font-semibold text-white transition hover:bg-red-800 ${
                                busy
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }`}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Signer
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                className="hidden"
                                disabled={busy}
                                onChange={(event) => {
                                  const input = event.currentTarget;
                                  const file = input.files?.[0];

                                  void handleUpload(contract, file);
                                  input.value = "";
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleCancel(contract)}
                              title="Annuler le contrat"
                              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-red-200 bg-white px-2.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Annuler
                            </button>
                          </>
                        )}

                        {contract.status === "SIGNED" && (
                          <span className="whitespace-nowrap text-xs font-medium text-green-700">
                            Contrat signé
                          </span>
                        )}

                        {contract.status === "CANCELLED" && (
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            Contrat annulé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
