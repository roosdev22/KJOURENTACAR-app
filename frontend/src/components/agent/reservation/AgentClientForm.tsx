import axios from "axios";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";

import { authService } from "../../../api/services/authService";
import type {
  IdDocumentType,
  User,
} from "../../../api/services/authService";

interface AgentClientFormProps {
  onCancel: () => void;
  onClientCreated: (client: User) => void;
}

export default function AgentClientForm({
  onCancel,
  onClientCreated,
}: AgentClientFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState("");

  const [idDocumentType, setIdDocumentType] =
    useState<IdDocumentType>("ID_CARD");

  const [idDocumentNumber, setIdDocumentNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!firstName.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }

    if (!lastName.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!email.trim()) {
      setError("L'adresse email est obligatoire.");
      return;
    }

    if (!phone.trim()) {
      setError("Le téléphone est obligatoire.");
      return;
    }
    try {
      setIsSubmitting(true);

      const client = await authService.createClientByAgent({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        driving_license_number:
          drivingLicenseNumber.trim() || undefined,
        driving_license_expiry:
          drivingLicenseExpiry || undefined,
        id_document_type: idDocumentType,
        id_document_number:
          idDocumentNumber.trim() || undefined,
      });

      onClientCreated(client);
    } catch (error: unknown) {
      console.error("Erreur création client agent :", error);

      if (axios.isAxiosError(error)) {
        const data: unknown = error.response?.data;

        if (
          typeof data === "object" &&
          data !== null
        ) {
          const responseData = data as Record<
            string,
            unknown
          >;

          if (
            typeof responseData.detail === "string"
          ) {
            setError(responseData.detail);
            return;
          }

          if (
            typeof responseData.message === "string"
          ) {
            setError(responseData.message);
            return;
          }

          if (
            typeof responseData.error === "string"
          ) {
            setError(responseData.error);
            return;
          }

          for (const value of Object.values(responseData)) {
            if (Array.isArray(value)) {
              const message = value.find(
                (item): item is string =>
                  typeof item === "string"
              );

              if (message) {
                setError(message);
                return;
              }
            }
          }
        }
      }

      setError(
        "Impossible d'enregistrer le client. Vérifiez les informations."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Retour aux clients
          </button>

          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-red-600" />

            <h2 className="text-lg font-bold text-slate-950">
              Nouveau client
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Enregistrez le client avant de créer sa réservation.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Impossible d'enregistrer le client
            </p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informations personnelles */}
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Informations personnelles
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Prénom"
              required
              value={firstName}
              onChange={setFirstName}
              placeholder="Jean"
            />

            <FormField
              label="Nom"
              required
              value={lastName}
              onChange={setLastName}
              placeholder="Baptiste"
            />

            <FormField
              label="Email"
              required
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="client@example.com"
            />

            <FormField
              label="Téléphone"
              required
              value={phone}
              onChange={setPhone}
              placeholder="+509 ..."
            />

            <div className="sm:col-span-2">
              <FormField
                label="Adresse"
                value={address}
                onChange={setAddress}
                placeholder="Adresse du client"
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Documents de location
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Numéro du permis"
              value={drivingLicenseNumber}
              onChange={setDrivingLicenseNumber}
              placeholder="Numéro du permis"
            />

            <FormField
              label="Expiration du permis"
              type="date"
              value={drivingLicenseExpiry}
              onChange={setDrivingLicenseExpiry}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Type de pièce
              </label>

              <select
                value={idDocumentType}
                onChange={(event) =>
                  setIdDocumentType(
                    event.target.value as IdDocumentType
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              >
                <option value="ID_CARD">
                  Carte d'identité
                </option>

                <option value="PASSPORT">
                  Passeport
                </option>

                <option value="DRIVER_LICENSE">
                  Permis de conduire
                </option>
              </select>
            </div>

            <FormField
              label="Numéro de pièce"
              value={idDocumentNumber}
              onChange={setIdDocumentNumber}
              placeholder="Numéro de la pièce"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <X size={16} />
            Annuler
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check size={17} />
                Enregistrer le client
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// ============================================================
// FIELD
// ============================================================

function FormField({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </div>
  );
}