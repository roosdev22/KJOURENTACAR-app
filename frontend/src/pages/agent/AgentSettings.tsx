
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  authService,
  type User,
} from "../../api/services/authService";

type ProfileForm = {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

function toProfileForm(user: User): ProfileForm {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
  };
}

const initialPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

function getRoleLabel(role: User["role"]): string {
  const labels: Record<User["role"], string> = {
    CLIENT: "Client",
    AGENT: "Agent de location",
    GESTIONNAIRE: "Gestionnaire du parc automobile",
    ADMIN: "Administrateur",
    SUPER_ADMIN: "Super administrateur",
  };

  return labels[role];
}

export default function AgentSettings() {
  const [profile, setProfile] = useState<User | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(initialPasswordForm);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

useEffect(() => {
  let ignore = false;

  const fetchProfile = async () => {
    try {
      const user = await authService.getProfile();

      if (ignore) return;

      setProfile(user);
      setForm(toProfileForm(user));
      setProfileError("");
    } catch (error: unknown) {
      if (ignore) return;

      setProfileError(getErrorMessage(error));
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  void fetchProfile();

  return () => {
    ignore = true;
  };
}, [reloadKey]);

const handleRetry = () => {
  setLoading(true);
  setProfileError("");
  setReloadKey((key) => key + 1);
};

  const handleProfileChange = (
    field: keyof ProfileForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setProfileMessage("");
    setProfileError("");
  };

    const handleSaveProfile = async (
            event: React.FormEvent<HTMLFormElement>,
        ) => {
            event.preventDefault();

            if (savingProfile) return;

            setSavingProfile(true);
            setProfileMessage("");
            setProfileError("");

            try {
            const updatedUser = await authService.updateProfile({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
            });

            setProfile(updatedUser);
            setForm(toProfileForm(updatedUser));
            setProfileMessage("Votre profil a été mis à jour.");
            } catch (error: unknown) {
            setProfileError(getErrorMessage(error));
            } finally {
            setSavingProfile(false);
            }
        };

  const handlePasswordChange = (
    field: keyof PasswordForm,
    value: string,
  ) => {
    setPasswordForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (savingPassword) return;

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setPasswordError("Veuillez remplir tous les champs du mot de passe.");
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (
      passwordForm.current_password ===
      passwordForm.new_password
    ) {
      setPasswordError(
        "Le nouveau mot de passe doit être différent de l'ancien.",
      );
      return;
    }

    setSavingPassword(true);

    try {
      await authService.changePassword(passwordForm);

      setPasswordForm(initialPasswordForm);
      setPasswordMessage("Votre mot de passe a été modifié.");
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-3 text-sm text-slate-600">
          Chargement des paramètres...
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Impossible de charger votre profil.
            </p>
            <p className="mt-1 break-words">
              {profileError || "Veuillez réessayer."}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  const labelClass =
    "block text-sm font-semibold text-slate-700";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
            {profile.role === "GESTIONNAIRE"
                ? "Espace gestionnaire"
                : "Espace agent"}
            </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Paramètres
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Gérez vos informations personnelles et la sécurité de votre compte.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Profil personnel
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Informations associées à votre compte.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 p-5">
            {profileError && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="break-words">{profileError}</span>
              </div>
            )}

            {profileMessage && (
              <div
                role="status"
                className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {profileMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Prénom
                <input
                  required
                  autoComplete="given-name"
                  maxLength={150}
                  className={inputClass}
                  value={form.first_name}
                  onChange={(event) =>
                    handleProfileChange("first_name", event.target.value)
                  }
                />
              </label>

              <label className={labelClass}>
                Nom
                <input
                  required
                  autoComplete="family-name"
                  maxLength={150}
                  className={inputClass}
                  value={form.last_name}
                  onChange={(event) =>
                    handleProfileChange("last_name", event.target.value)
                  }
                />
              </label>

              <label className={labelClass}>
                Téléphone
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  maxLength={30}
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) =>
                    handleProfileChange("phone", event.target.value)
                  }
                />
              </label>

              <label className={labelClass}>
                Adresse
                <input
                  required
                  autoComplete="street-address"
                  maxLength={255}
                  className={inputClass}
                  value={form.address}
                  onChange={(event) =>
                    handleProfileChange("address", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                Informations protégées
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Adresse e-mail
                  <input
                    readOnly
                    aria-readonly="true"
                    className={inputClass}
                    value={profile.email}
                  />
                </label>

                <label className={labelClass}>
                  Rôle
                  <input
                    readOnly
                    aria-readonly="true"
                    className={inputClass}
                    value={getRoleLabel(profile.role)}
                  />
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                L’e-mail et le rôle ne peuvent pas être modifiés depuis cette page.
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingProfile ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Sécurité du compte
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Modifiez votre mot de passe.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 p-5">
            {passwordError && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="break-words">{passwordError}</span>
              </div>
            )}

            {passwordMessage && (
              <div
                role="status"
                className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {passwordMessage}
              </div>
            )}

            <label className={labelClass}>
              Mot de passe actuel
              <input
                required
                type="password"
                autoComplete="current-password"
                className={inputClass}
                value={passwordForm.current_password}
                onChange={(event) =>
                  handlePasswordChange("current_password", event.target.value)
                }
              />
            </label>

            <label className={labelClass}>
              Nouveau mot de passe
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
                value={passwordForm.new_password}
                onChange={(event) =>
                  handlePasswordChange("new_password", event.target.value)
                }
              />
            </label>

            <label className={labelClass}>
              Confirmer le nouveau mot de passe
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  handlePasswordChange("confirm_password", event.target.value)
                }
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                <p className="text-xs leading-5 text-slate-600">
                  Votre mot de passe actuel sera vérifié par le serveur.
                  Choisissez un mot de passe robuste qui respecte les règles
                  de sécurité de votre compte.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {savingPassword
                ? "Modification..."
                : "Modifier le mot de passe"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
