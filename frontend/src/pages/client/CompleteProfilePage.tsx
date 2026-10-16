import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  MapPin,
  Car,
  CreditCard,
  CalendarDays,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import {
  authService,
  type IdDocumentType,
  type UpdateProfilePayload,
} from "../../api/services/authService";

import { useAuth } from "../../hooks/useAuth";

// ============================================================
// TYPES
// ============================================================

interface FormData {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  driving_license_number: string;
  driving_license_expiry: string;
  id_document_type: IdDocumentType | "";
  id_document_number: string;
}

type LocationState = {
  from?: string;
  reason?: string;
  missing?: string[];
} | null;

// ============================================================
// DONNÉES INITIALES
// ============================================================

const initialFormData: FormData = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  driving_license_number: "",
  driving_license_expiry: "",
  id_document_type: "",
  id_document_number: "",
};

// ============================================================
// UTILITAIRES DE NETTOYAGE
// ============================================================

const cleanPhone = (value: string): string =>
  value.replace(/[^\d+\-\s()]/g, "").trim();

const cleanText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const cleanAlphanumeric = (value: string): string =>
  value.replace(/[^A-Za-z0-9\-\s]/g, "").trim();

// ============================================================
// LABELS DES CHAMPS
// ============================================================

const fieldLabels: Record<string, string> = {
  phone: "Téléphone",
  address: "Adresse",
  driving_license_number: "Numéro de permis",
  driving_license_expiry: "Expiration du permis",
  id_document_type: "Type de pièce",
  id_document_number: "Numéro de pièce",
  first_name: "Prénom",
  last_name: "Nom",
};

// ============================================================
// LABELS DES CHAMPS MANQUANTS
// ============================================================

const missingLabels: Record<string, string> = {
  first_name: "Prénom",
  last_name: "Nom",
  phone: "Numéro de téléphone",
  address: "Adresse",
  driving_license_number: "Numéro de permis",
  driving_license_expiry: "Date d'expiration du permis",
  driving_license_expired: "Permis expiré",
  id_document_number: "Numéro de pièce d'identité",
  id_document_type: "Type de pièce d'identité",
};

// ============================================================
// COMPOSANT
// ============================================================

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    updateUser,
    isLoading: authLoading,
  } = useAuth();

  // ==========================================================
  // ÉTAT DE NAVIGATION
  // ==========================================================

  const locationState = location.state as LocationState;

  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // INITIALISATION DU FORMULAIRE
  // ==========================================================

  const [formData, setFormData] = useState<FormData>(() => {
    if (!user) {
      return initialFormData;
    }

    return {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      driving_license_number:
        user.driving_license_number ?? "",
      driving_license_expiry:
        user.driving_license_expiry ?? "",
      id_document_type:
        user.id_document_type ?? "",
      id_document_number:
        user.id_document_number ?? "",
    };
  });

  // ==========================================================
  // SYNCHRONISATION SI USER ARRIVE APRÈS CHARGEMENT
  // ==========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const eligibility = user.eligibility;

    if (eligibility?.eligible === true) {
      const destination =
        locationState?.from ?? "/dashboard";

      navigate(destination, {
        replace: true,
      });
    }
  }, [user, navigate, locationState]);

  // ==========================================================
  // CHANGEMENT DES CHAMPS
  // ==========================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = (): boolean => {
    // --------------------------------------------------------
    // PRÉNOM
    // --------------------------------------------------------

    const firstName = cleanText(formData.first_name);

    if (!firstName) {
      setError("Le prénom est obligatoire.");
      return false;
    }

    if (firstName.length < 2) {
      setError(
        "Le prénom doit contenir au moins 2 caractères."
      );
      return false;
    }

    if (firstName.length > 150) {
      setError(
        "Le prénom ne peut pas dépasser 150 caractères."
      );
      return false;
    }

    // --------------------------------------------------------
    // NOM
    // --------------------------------------------------------

    const lastName = cleanText(formData.last_name);

    if (!lastName) {
      setError("Le nom est obligatoire.");
      return false;
    }

    if (lastName.length < 2) {
      setError(
        "Le nom doit contenir au moins 2 caractères."
      );
      return false;
    }

    if (lastName.length > 150) {
      setError(
        "Le nom ne peut pas dépasser 150 caractères."
      );
      return false;
    }

    // --------------------------------------------------------
    // TÉLÉPHONE
    // --------------------------------------------------------

    const phone = cleanPhone(formData.phone);

    if (!phone) {
      setError(
        "Le numéro de téléphone est obligatoire."
      );
      return false;
    }

    const phoneRegex = /^\+?[1-9]\d{7,14}$/;

    const phoneDigitsOnly = phone.replace(
      /[\s\-()]/g,
      ""
    );

    if (!phoneRegex.test(phoneDigitsOnly)) {
      setError(
        "Numéro de téléphone invalide. " +
          "Format attendu : +50912345678"
      );
      return false;
    }

    // --------------------------------------------------------
    // ADRESSE
    // --------------------------------------------------------

    const address = cleanText(formData.address);

    if (!address) {
      setError("L'adresse est obligatoire.");
      return false;
    }

    if (address.length < 5) {
      setError(
        "L'adresse doit contenir au moins 5 caractères."
      );
      return false;
    }

    // --------------------------------------------------------
    // PERMIS — NUMÉRO
    // --------------------------------------------------------

    const licenseNumber = cleanAlphanumeric(
      formData.driving_license_number
    );

    if (!licenseNumber) {
      setError(
        "Le numéro du permis de conduire est obligatoire."
      );
      return false;
    }

    const licenseRegex =
      /^[A-Za-z0-9\- ]{5,30}$/;

    if (!licenseRegex.test(licenseNumber)) {
      setError(
        "Numéro de permis invalide. " +
          "Entre 5 et 30 caractères alphanumériques."
      );
      return false;
    }

    // --------------------------------------------------------
    // PERMIS — EXPIRATION
    // --------------------------------------------------------

    if (!formData.driving_license_expiry) {
      setError(
        "La date d'expiration du permis est obligatoire."
      );
      return false;
    }

    const expiryDate = new Date(
      `${formData.driving_license_expiry}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (isNaN(expiryDate.getTime())) {
      setError(
        "Date d'expiration du permis invalide."
      );
      return false;
    }

    if (expiryDate <= today) {
      setError(
        "Votre permis de conduire est expiré ou expire aujourd'hui."
      );
      return false;
    }

    // --------------------------------------------------------
    // PIÈCE D'IDENTITÉ — TYPE
    // --------------------------------------------------------

    if (!formData.id_document_type) {
      setError(
        "Le type de pièce d'identité est obligatoire."
      );
      return false;
    }

    const validDocTypes: IdDocumentType[] = [
      "PASSPORT",
      "ID_CARD",
      "DRIVER_LICENSE",
    ];

    if (
      !validDocTypes.includes(
        formData.id_document_type as IdDocumentType
      )
    ) {
      setError(
        "Type de pièce d'identité invalide."
      );
      return false;
    }

    // --------------------------------------------------------
    // PIÈCE D'IDENTITÉ — NUMÉRO
    // --------------------------------------------------------

    const idNumber = cleanText(
      formData.id_document_number
    );

    if (!idNumber) {
      setError(
        "Le numéro de la pièce d'identité est obligatoire."
      );
      return false;
    }

    if (idNumber.length < 3) {
      setError(
        "Le numéro de pièce d'identité doit contenir " +
          "au moins 3 caractères."
      );
      return false;
    }

    if (idNumber.length > 50) {
      setError(
        "Le numéro de pièce d'identité ne peut pas " +
          "dépasser 50 caractères."
      );
      return false;
    }

    return true;
  };

  // ==========================================================
  // ENREGISTREMENT
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!validateForm()) {
      return;
    }

    // --------------------------------------------------------
    // NETTOYAGE AVANT ENVOI
    // --------------------------------------------------------

    const payload: UpdateProfilePayload = {
      first_name: cleanText(formData.first_name),

      last_name: cleanText(formData.last_name),

      phone: formData.phone
        .replace(/[\s\-()]/g, "")
        .trim(),

      address: cleanText(formData.address),

      driving_license_number:
        cleanAlphanumeric(
          formData.driving_license_number
        ),

      driving_license_expiry:
        formData.driving_license_expiry,

      id_document_type:
        formData.id_document_type as IdDocumentType,

      id_document_number:
        cleanText(formData.id_document_number),
    };

    // ========================================================
    // APPEL API
    // ========================================================

    try {
      setLoading(true);

      const updatedUser =
        await authService.updateProfile(payload);

      // ------------------------------------------------------
      // SYNCHRONISATION AUTH CONTEXT
      // ------------------------------------------------------

      updateUser(updatedUser);

      setSuccess(
        "Votre profil a été complété avec succès."
      );

      // ------------------------------------------------------
      // DESTINATION D'ORIGINE
      // ------------------------------------------------------

      const destination =
        locationState?.from ?? "/dashboard";

      // ------------------------------------------------------
      // PETIT DÉLAI POUR AFFICHER LE MESSAGE DE SUCCÈS
      // ------------------------------------------------------

      setTimeout(() => {
        navigate(destination, {
          replace: true,
        });
      }, 800);
    } catch (err: unknown) {
      console.error(
        "Erreur mise à jour profil :",
        err
      );

      // ======================================================
      // STRUCTURE ERREUR AXIOS / DJANGO
      // ======================================================

      const axiosError = err as {
        response?: {
          status?: number;
          data?: {
            detail?: unknown;
            error?: unknown;
            [key: string]: unknown;
          };
        };
      };

      const data =
        axiosError.response?.data;

      // ======================================================
      // ERREURS DJANGO PAR CHAMP
      // ======================================================

      if (data) {
        const fieldErrors = Object.entries(data)
          .filter(
            ([key]) =>
              key !== "detail" &&
              key !== "error"
          )
          .map(([field, messages]) => {
            const label =
              fieldLabels[field] ?? field;

            let message: string;

            if (Array.isArray(messages)) {
              message = String(messages[0]);
            } else if (
              typeof messages === "object" &&
              messages !== null
            ) {
              message = JSON.stringify(messages);
            } else {
              message = String(messages);
            }

            return `${label} : ${message}`;
          });

        if (fieldErrors.length > 0) {
          setError(
            fieldErrors.join(" — ")
          );
          return;
        }

        // ----------------------------------------------------
        // ERREUR DETAIL
        // ----------------------------------------------------

        if (data.detail) {
          setError(String(data.detail));
          return;
        }

        // ----------------------------------------------------
        // ERREUR ERROR
        // ----------------------------------------------------

        if (data.error) {
          setError(String(data.error));
          return;
        }
      }

      // ======================================================
      // ERREUR PAR DÉFAUT
      // ======================================================

      setError(
        "Impossible de mettre à jour votre profil. " +
          "Veuillez vérifier les informations saisies."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ÉTAT DE CHARGEMENT AUTH
  // ==========================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-red-700"
        />
      </div>
    );
  }

  // ==========================================================
  // UTILISATEUR NON CONNECTÉ
  // ==========================================================

  if (!user) {
    return null;
  }

  // ==========================================================
  // CHAMPS MANQUANTS
  // ==========================================================

  const missingDocs =
    locationState?.missing ?? [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-10 px-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="px-8 pt-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">

              <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center shadow-md">
                <User
                  size={24}
                  className="text-white"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Complétez votre profil
                </h1>

                <p className="text-sm text-gray-600 mt-1">
                  {locationState?.reason ===
                  "profile_incomplete"
                    ? "Ces informations sont requises pour effectuer une réservation."
                    : "Quelques informations sont nécessaires avant de pouvoir effectuer une location."}
                </p>
              </div>

            </div>

            {/* ================================================
                CHAMPS MANQUANTS
            ================================================= */}

            {missingDocs.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">

                <p className="font-semibold mb-1">
                  Informations manquantes :
                </p>

                <ul className="list-disc list-inside space-y-0.5">
                  {missingDocs.map((doc) => (
                    <li key={doc}>
                      {missingLabels[doc] ?? doc}
                    </li>
                  ))}
                </ul>

              </div>
            )}
          </div>

          {/* ==================================================
              FORMULAIRE
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="px-8 py-8 space-y-8"
          >

            {/* =================================================
                ERREUR
            ================================================= */}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">

                <AlertCircle
                  size={17}
                  className="mt-0.5 flex-shrink-0"
                />

                <span>{error}</span>

              </div>
            )}

            {/* =================================================
                SUCCÈS
            ================================================= */}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-start gap-2">

                <CheckCircle
                  size={17}
                  className="mt-0.5 flex-shrink-0"
                />

                <span>{success}</span>

              </div>
            )}

            {/* =================================================
                INFORMATIONS PERSONNELLES
            ================================================= */}

            <section>
              <div className="flex items-center gap-2 mb-5">

                <User
                  size={18}
                  className="text-red-700"
                />

                <h2 className="text-lg font-semibold text-gray-900">
                  Informations personnelles
                </h2>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* PRÉNOM */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Prénom
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    disabled={loading}
                    maxLength={150}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />
                </div>

                {/* NOM */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Nom
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    autoComplete="family-name"
                    disabled={loading}
                    maxLength={150}
                    placeholder="Votre nom"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />
                </div>

                {/* TÉLÉPHONE */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Téléphone
                  </label>

                  <div className="relative">

                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      disabled={loading}
                      placeholder="+50912345678"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />

                  </div>
                </div>

                {/* ADRESSE */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Adresse
                  </label>

                  <div className="relative">

                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      disabled={loading}
                      placeholder="Votre adresse"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />

                  </div>
                </div>

              </div>
            </section>

            {/* =================================================
                PERMIS DE CONDUIRE
            ================================================= */}

            <section className="border-t border-gray-200 pt-8">

              <div className="flex items-center gap-2 mb-5">

                <Car
                  size={18}
                  className="text-red-700"
                />

                <h2 className="text-lg font-semibold text-gray-900">
                  Permis de conduire
                </h2>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* NUMÉRO PERMIS */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Numéro du permis
                  </label>

                  <div className="relative">

                    <CreditCard
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="text"
                      name="driving_license_number"
                      value={
                        formData.driving_license_number
                      }
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={30}
                      placeholder="Numéro du permis"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />

                  </div>
                </div>

                {/* EXPIRATION */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Date d'expiration
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      type="date"
                      name="driving_license_expiry"
                      value={
                        formData.driving_license_expiry
                      }
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />

                  </div>
                </div>

              </div>
            </section>

            {/* =================================================
                PIÈCE D'IDENTITÉ
            ================================================= */}

            <section className="border-t border-gray-200 pt-8">

              <div className="flex items-center gap-2 mb-5">

                <CreditCard
                  size={18}
                  className="text-red-700"
                />

                <h2 className="text-lg font-semibold text-gray-900">
                  Pièce d'identité
                </h2>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* TYPE */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Type de pièce
                  </label>

                  <select
                    name="id_document_type"
                    value={formData.id_document_type}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded bg-white transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  >

                    <option value="">
                      Sélectionner un type
                    </option>

                    <option value="PASSPORT">
                      Passeport
                    </option>

                    <option value="ID_CARD">
                      Carte d'identité
                    </option>

                    <option value="DRIVER_LICENSE">
                      Permis de conduire
                    </option>

                  </select>
                </div>

                {/* NUMÉRO */}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Numéro de la pièce
                  </label>

                  <input
                    type="text"
                    name="id_document_number"
                    value={
                      formData.id_document_number
                    }
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={50}
                    placeholder="Numéro du document"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />
                </div>

              </div>
            </section>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">

              <p>
                Ces informations sont nécessaires pour
                vérifier votre éligibilité à la location
                d'un véhicule. Elles sont conservées de
                manière sécurisée et ne sont utilisées
                qu'à des fins de vérification.
              </p>

            </div>

            {/* =================================================
                BOUTONS
            ================================================= */}

            <div className="flex items-center justify-between pt-2">

              {/* RETOUR */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    locationState?.from ??
                      "/dashboard"
                  )
                }
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-all disabled:opacity-50"
              >

                <ArrowLeft size={16} />

                Retour

              </button>

              {/* ENREGISTRER */}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >

                {loading ? (
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

                    Enregistrer mon profil
                  </>
                )}

              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}