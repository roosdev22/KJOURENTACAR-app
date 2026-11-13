
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcon";
import {
  authService,
  type IdDocumentType,
  type UpdateProfilePayload,
} from "../../api/services/authService";
import { useAuth } from "../../hooks/useAuth";

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  driving_license_number: string;
  driving_license_expiry: string;
  id_document_type: IdDocumentType | "";
  id_document_number: string;
}

const initialForm: ProfileForm = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  driving_license_number: "",
  driving_license_expiry: "",
  id_document_type: "",
  id_document_number: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

const inputClass =
  "mt-2.5 block w-full rounded-xl border border-[#E3E6E8] bg-[#F8F9FA] px-4 py-3 text-sm text-[#202327] outline-none transition duration-200 placeholder:text-[#64748B] hover:border-[#D8DDE2] focus:border-[#B4232F] focus:bg-white focus:ring-4 focus:ring-[#B4232F]/10 disabled:cursor-not-allowed disabled:bg-[#EEF1F3]";

const labelClass =
  "text-[13px] font-semibold tracking-wide text-[#202327]";

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: AdminIconName;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F1C7CD] bg-[#FBECEF] text-[#B4232F]">
        <AdminIcon name={icon} size={20} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B4232F]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-bold tracking-tight text-[#202327] sm:text-lg">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#64748B]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  icon?: AdminIconName;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <AdminIcon
            name={Icon}
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={!onChange}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${inputClass} ${Icon ? "pl-10" : ""} ${
            disabled ? "text-slate-500" : ""
          }`}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { updateUser } = useAuth();

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const profile = await authService.getProfile();

        if (!active) return;

        setForm({
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          driving_license_number:
            profile.driving_license_number ?? "",
          driving_license_expiry:
            profile.driving_license_expiry ?? "",
          id_document_type: profile.id_document_type ?? "",
          id_document_number: profile.id_document_number ?? "",
        });

        setEmail(profile.email ?? "");
      } catch (err: unknown) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (
    field: keyof ProfileForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload: UpdateProfilePayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        driving_license_number:
          form.driving_license_number.trim(),
        driving_license_expiry:
          form.driving_license_expiry || undefined,
        id_document_type: form.id_document_type || undefined,
        id_document_number: form.id_document_number.trim(),
      };

      const updatedProfile = await authService.updateProfile(payload);

      updateUser(updatedProfile);

      setForm({
        first_name: updatedProfile.first_name ?? "",
        last_name: updatedProfile.last_name ?? "",
        phone: updatedProfile.phone ?? "",
        address: updatedProfile.address ?? "",
        driving_license_number:
          updatedProfile.driving_license_number ?? "",
        driving_license_expiry:
          updatedProfile.driving_license_expiry ?? "",
        id_document_type: updatedProfile.id_document_type ?? "",
        id_document_number:
          updatedProfile.id_document_number ?? "",
      });

      setEmail(updatedProfile.email ?? "");
      setSuccess("Votre profil a été mis à jour avec succès.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${form.first_name.trim().charAt(0)}${form.last_name
      .trim()
      .charAt(0)}`.toUpperCase() || "C";

  const fullName =
    `${form.first_name} ${form.last_name}`.trim() || "Votre profil";

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <AdminIcon name="loader" size={20} className="animate-spin text-[#B4232F]" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Chargement du profil
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Récupération de vos informations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-red-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition group-hover:border-red-200 group-hover:bg-red-50">
            <AdminIcon name="arrow-left" size={17} />
          </span>
          Retour au tableau de bord
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          <AdminIcon name="lock" size={15} className="text-slate-500" />
          <span className="text-xs font-medium text-slate-600">
            Espace personnel
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        {/* Présentation principale */}
        <section className="relative isolate overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-lg shadow-slate-950/10 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-4 -top-12 -z-10 h-44 w-44 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute bottom-0 right-24 -z-10 h-36 w-36 rounded-full bg-red-600/10 blur-3xl" />

          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-px w-7 bg-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-400">
                  K-JOU RENT A CAR
                </p>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Mon profil<span className="text-red-500">.</span>
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                Gérez vos informations personnelles et préparez vos
                prochaines locations en toute simplicité.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 sm:min-w-52">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-950/30">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {fullName}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {email || "Adresse e-mail non renseignée"}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  <AdminIcon name="user-round" size={13} />
                  Espace client
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2">
              <AdminIcon name="shield" size={16} className="text-red-400" />
              Informations du compte
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <span className="inline-flex items-center gap-2">
              <AdminIcon name="file" size={16} className="text-slate-400" />
              Dossier de location
            </span>
          </div>
        </section>

        {/* Panneau latéral */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <AdminIcon name="shield" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Votre espace
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Informations personnelles
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-xs text-slate-500">Téléphone</span>
                <span className="max-w-[145px] truncate text-xs font-semibold text-slate-800">
                  {form.phone || "À compléter"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Permis</span>
                <span className="text-xs font-semibold text-slate-800">
                  {form.driving_license_number
                    ? "Renseigné"
                    : "À compléter"}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/reservations"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-100">
                <AdminIcon name="calendar-check" size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Mes réservations
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Consulter vos locations
                </p>
              </div>
            </div>
            <AdminIcon name="arrow-up-right" size={17} className="shrink-0 text-slate-400 transition group-hover:text-red-600" />
          </Link>
        </aside>
      </div>

      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
        >
          <AdminIcon name="alert" size={20} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
        >
          <AdminIcon name="check-circle" size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Modification enregistrée</p>
            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identité et coordonnées */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <SectionHeading
              icon="user-round"
              eyebrow="01 / Identité"
              title="Informations personnelles"
              description="Les coordonnées associées à votre compte client."
            />
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 sm:inline-flex">
              <AdminIcon name="lock" size={15} />
              Compte sécurisé
            </span>
          </div>

          <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
            <Field
              id="first_name"
              label="Prénom"
              value={form.first_name}
              onChange={(value) => handleChange("first_name", value)}
              placeholder="Votre prénom"
              autoComplete="given-name"
              required
              maxLength={150}
            />

            <Field
              id="last_name"
              label="Nom de famille"
              value={form.last_name}
              onChange={(value) => handleChange("last_name", value)}
              placeholder="Votre nom"
              autoComplete="family-name"
              required
              maxLength={150}
            />

            <Field
              id="email"
              label="Adresse e-mail"
              value={email}
              icon="mail"
              type="email"
              disabled
            />

            <Field
              id="phone"
              label="Téléphone"
              value={form.phone}
              onChange={(value) => handleChange("phone", value)}
              icon="phone"
              type="tel"
              placeholder="Ex. : +509 ..."
              autoComplete="tel"
              maxLength={30}
            />

            <div className="sm:col-span-2">
              <Field
                id="address"
                label="Adresse complète"
                value={form.address}
                onChange={(value) => handleChange("address", value)}
                icon="map-pin"
                placeholder="Rue, quartier, ville"
                autoComplete="street-address"
                maxLength={255}
              />
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <SectionHeading
              icon="credit-card"
              eyebrow="02 / Documents"
              title="Dossier de location"
              description="Les pièces nécessaires pour préparer vos réservations."
            />
          </div>

          <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
            <div>
              <label htmlFor="id_document_type" className={labelClass}>
                Type de pièce d’identité
              </label>
              <select
                id="id_document_type"
                name="id_document_type"
                className={inputClass}
                value={form.id_document_type}
                onChange={(event) =>
                  handleChange("id_document_type", event.target.value)
                }
              >
                <option value="">Sélectionner un type</option>
                <option value="ID_CARD">Carte d’identité</option>
                <option value="PASSPORT">Passeport</option>
                <option value="DRIVER_LICENSE">Permis de conduire</option>
              </select>
            </div>

            <Field
              id="id_document_number"
              label="Numéro de pièce d’identité"
              value={form.id_document_number}
              onChange={(value) =>
                handleChange("id_document_number", value)
              }
              placeholder="Numéro du document"
              maxLength={100}
            />

            <Field
              id="driving_license_number"
              label="Numéro de permis"
              value={form.driving_license_number}
              onChange={(value) =>
                handleChange("driving_license_number", value)
              }
              placeholder="Numéro du permis de conduire"
              maxLength={100}
            />

            <div>
              <label
                htmlFor="driving_license_expiry"
                className={labelClass}
              >
                Date d’expiration du permis
              </label>
              <div className="relative">
                <AdminIcon name="calendar-check" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="driving_license_expiry"
                  name="driving_license_expiry"
                  type="date"
                  className={`${inputClass} pl-10`}
                  value={form.driving_license_expiry}
                  onChange={(event) =>
                    handleChange(
                      "driving_license_expiry",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 sm:mx-7 sm:mb-7">
            <AdminIcon name="shield" size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-semibold text-amber-950">
                Exactitude des informations
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-900/80">
                Vérifiez vos informations avant l’enregistrement. Elles
                peuvent être utilisées pour préparer votre dossier de
                location.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <AdminIcon name="lock" size={16} />
            Vos modifications sont enregistrées sur votre compte.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <AdminIcon name="loader" size={16} className="animate-spin" />
              ) : success ? (
                <AdminIcon name="check" size={16} />
              ) : (
                <AdminIcon name="save" size={16} />
              )}
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              {!saving && (
                <AdminIcon name="chevron-right" size={16} className="opacity-70" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
