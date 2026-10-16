import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import vehicleService from "../../api/services/vehicleService";
import reservationService from "../../api/services/reservationService";

import type {
  Vehicle,
  VehicleCategory,
} from "../../api/services/vehicleService";

import type { Reservation } from "../../types/reservation";

import ReservationHero from "../../components/reservation/ReservationHero";
import ReservationDateSelector from "../../components/reservation/ReservationDateSelector";
import ReservationVehicleGrid from "../../components/reservation/ReservationVehicleGrid";
import ReservationNotes from "../../components/reservation/ReservationNotes";
import ReservationSummary from "../../components/reservation/ReservationSummary";
import ReservationSecurityInfo from "../../components/reservation/ReservationSecurityInfo";
import ReservationHotVehicles from "../../components/reservation/ReservationHotVehicles";
import ReservationSuccess from "../../components/reservation/ReservationSuccess";

/* ============================================================
   TYPES
============================================================ */

interface ReservationDates {
  dateDebut: string;
  dateFin: string;
}

interface FormErrors {
  date_debut?: string;
  date_fin?: string;
  vehicules?: string;
  notes_client?: string;
  detail?: string;
}

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

/* ============================================================
   HELPERS
============================================================ */

function getTodayLocalDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function validateDates(
  dateDebut: string,
  dateFin: string
): FormErrors {
  const errors: FormErrors = {};

  const today = getTodayLocalDate();

  if (!dateDebut) {
    errors.date_debut =
      "Veuillez sélectionner une date de début.";
  } else if (dateDebut < today) {
    errors.date_debut =
      "La date de début ne peut pas être dans le passé.";
  }

  if (!dateFin) {
    errors.date_fin =
      "Veuillez sélectionner une date de fin.";
  } else if (dateDebut && dateFin <= dateDebut) {
    errors.date_fin =
      "La date de fin doit être postérieure à la date de début.";
  }

  return errors;
}

function extractApiErrors(error: unknown): {
  fieldErrors: FormErrors;
  globalMessage: string;
} {
  const apiError = error as ApiErrorLike;

  const data = apiError?.response?.data;

  const fieldErrors: FormErrors = {};

  let globalMessage =
    "Une erreur est survenue lors de la création de votre réservation.";

  if (!data) {
    if (apiError?.message) {
      globalMessage = apiError.message;
    }

    return {
      fieldErrors,
      globalMessage,
    };
  }

  if (typeof data === "string") {
    return {
      fieldErrors,
      globalMessage: data,
    };
  }

  if (typeof data !== "object" || data === null) {
    return {
      fieldErrors,
      globalMessage,
    };
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.detail === "string") {
    globalMessage = payload.detail;
  }

  const supportedFields: Array<keyof FormErrors> = [
    "date_debut",
    "date_fin",
    "vehicules",
    "notes_client",
  ];

  for (const field of supportedFields) {
    const value = payload[field];

    if (typeof value === "string") {
      fieldErrors[field] = value;
      continue;
    }

    if (Array.isArray(value)) {
      const messages = value
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .join(" ");

      if (messages) {
        fieldErrors[field] = messages;
      }
    }
  }

  if (Array.isArray(payload.non_field_errors)) {
    const messages = payload.non_field_errors
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .join(" ");

    if (messages) {
      globalMessage = messages;
    }
  }

  const hasFieldError =
    Object.keys(fieldErrors).length > 0;

  if (hasFieldError) {
    const firstError = Object.values(
      fieldErrors
    ).find(Boolean);

    if (firstError) {
      globalMessage = firstError;
    }
  }

  return {
    fieldErrors,
    globalMessage,
  };
}

function normalizeVehicleResponse(
  response: unknown
): Vehicle[] {
  if (Array.isArray(response)) {
    return response as Vehicle[];
  }

  if (
    response &&
    typeof response === "object" &&
    "results" in response
  ) {
    const results = (
      response as {
        results?: unknown;
      }
    ).results;

    if (Array.isArray(results)) {
      return results as Vehicle[];
    }
  }

  return [];
}

function checkClientEligibility(user: unknown): {
  eligible: boolean;
  reasons: string[];
} {
  if (!user || typeof user !== "object") {
    return {
      eligible: false,
      reasons: ["Utilisateur non connecté."],
    };
  }

  const client = user as Record<string, unknown>;

  const reasons: string[] = [];

  if (!client.phone) {
    reasons.push("Numéro de téléphone manquant.");
  }

  if (!client.address) {
    reasons.push("Adresse manquante.");
  }

  if (!client.driving_license_number) {
    reasons.push("Numéro de permis manquant.");
  }

  if (!client.driving_license_expiry) {
    reasons.push(
      "Date d'expiration du permis manquante."
    );
  } else {
    const expiry = new Date(
      `${String(
        client.driving_license_expiry
      )}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (
      !Number.isNaN(expiry.getTime()) &&
      expiry <= today
    ) {
      reasons.push(
        "Votre permis de conduire est expiré."
      );
    }
  }

  if (!client.id_document_type) {
    reasons.push(
      "Type de pièce d'identité manquant."
    );
  }

  if (!client.id_document_number) {
    reasons.push(
      "Numéro de pièce d'identité manquant."
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ReservationPage() {
  const navigate = useNavigate();

  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  /* ----------------------------------------------------------
     FORM REFERENCE
  ---------------------------------------------------------- */

  const reservationFormRef =
    useRef<HTMLDivElement | null>(null);

  /* ----------------------------------------------------------
     DATES
  ---------------------------------------------------------- */

  const [dates, setDates] =
    useState<ReservationDates>({
      dateDebut: "",
      dateFin: "",
    });

  /* ----------------------------------------------------------
     VEHICLES
  ---------------------------------------------------------- */

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState<string | null>(null);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<VehicleCategory | "ALL">(
    "ALL"
  );

  const [
    vehiclesLoading,
    setVehiclesLoading,
  ] = useState(true);

  /* ----------------------------------------------------------
     NOTES
  ---------------------------------------------------------- */

  const [notesClient, setNotesClient] =
    useState("");

  /* ----------------------------------------------------------
     FORM STATE
  ---------------------------------------------------------- */

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [globalError, setGlobalError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* ----------------------------------------------------------
     CREATED RESERVATION
  ---------------------------------------------------------- */

  const [
    createdReservation,
    setCreatedReservation,
  ] = useState<Reservation | null>(null);

  /* ==========================================================
     AUTHENTICATION
  ========================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate(
        `/login?next=${encodeURIComponent(
          "/reservation"
        )}`,
        {
          replace: true,
        }
      );
    }
  }, [
    authLoading,
    user,
    navigate,
  ]);

  /* ==========================================================
     CLIENT ELIGIBILITY
  ========================================================== */

  const eligibility = useMemo(
    () => checkClientEligibility(user),
    [user]
  );

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    if (!eligibility.eligible) {
      navigate(
        `/profile/complete?next=${encodeURIComponent(
          "/reservation"
        )}`,
        {
          replace: true,
        }
      );
    }
  }, [
    authLoading,
    user,
    eligibility.eligible,
    navigate,
  ]);

  /* ==========================================================
     LOAD VEHICLES
  ========================================================== */

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setGlobalError("");

    try {
      const response =
        await vehicleService.getVehicles();

      const normalized =
        normalizeVehicleResponse(response);

      const available = normalized.filter(
        (vehicle) =>
          vehicle.status === "AVAILABLE"
      );

      setVehicles(available);

      setSelectedVehicleId((current) => {
        if (!current) {
          return null;
        }

        const stillExists = available.some(
          (vehicle) =>
            vehicle.id === current
        );

        return stillExists
          ? current
          : null;
      });
    } catch (error) {
      console.error(
        "Erreur lors du chargement des véhicules :",
        error
      );

      setVehicles([]);

      setGlobalError(
        "Impossible de charger les véhicules disponibles. Veuillez réessayer."
      );
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

 /* ==========================================================
   LOAD VEHICLES
========================================================== */

useEffect(() => {
  if (authLoading || !user || !eligibility.eligible) {
    return;
  }

  const timer = window.setTimeout(() => {
    void loadVehicles();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [authLoading, user, eligibility.eligible, loadVehicles]);

  /* ==========================================================
     SELECTED VEHICLE
  ========================================================== */

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) {
      return null;
    }

    return (
      vehicles.find(
        (vehicle) =>
          vehicle.id === selectedVehicleId
      ) ?? null
    );
  }, [
    vehicles,
    selectedVehicleId,
  ]);

  const selectedVehicles = useMemo(
    () =>
      selectedVehicle
        ? [selectedVehicle]
        : [],
    [selectedVehicle]
  );

  /* ==========================================================
     DATE HANDLERS
  ========================================================== */

  const handleDateDebutChange =
    useCallback((value: string) => {
      setDates((current) => ({
        ...current,
        dateDebut: value,
      }));

      setErrors((current) => ({
        ...current,
        date_debut: undefined,
        date_fin: undefined,
      }));

      setGlobalError("");
    }, []);

  const handleDateFinChange =
    useCallback((value: string) => {
      setDates((current) => ({
        ...current,
        dateFin: value,
      }));

      setErrors((current) => ({
        ...current,
        date_fin: undefined,
      }));

      setGlobalError("");
    }, []);

  /* ==========================================================
     VEHICLE HANDLER
  ========================================================== */

  const handleVehicleSelect =
    useCallback(
      (vehicle: Vehicle) => {
        if (isSubmitting) {
          return;
        }

        setSelectedVehicleId(
          (current) =>
            current === vehicle.id
              ? null
              : vehicle.id
        );

        setErrors((current) => ({
          ...current,
          vehicules: undefined,
        }));

        setGlobalError("");
      },
      [isSubmitting]
    );

  /* ==========================================================
     NOTES HANDLER
  ========================================================== */

  const handleNotesChange =
    useCallback((value: string) => {
      setNotesClient(value);

      setErrors((current) => ({
        ...current,
        notes_client: undefined,
      }));

      setGlobalError("");
    }, []);

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateForm =
    useCallback((): boolean => {
      const dateErrors =
        validateDates(
          dates.dateDebut,
          dates.dateFin
        );

      const nextErrors: FormErrors = {
        ...dateErrors,
      };

      if (!selectedVehicleId) {
        nextErrors.vehicules =
          "Veuillez sélectionner un véhicule.";
      }

      if (notesClient.length > 1000) {
        nextErrors.notes_client =
          "Les notes ne peuvent pas dépasser 1000 caractères.";
      }

      setErrors(nextErrors);

      if (
        Object.keys(nextErrors).length > 0
      ) {
        const firstErrorElement =
          reservationFormRef.current?.querySelector(
            '[aria-invalid="true"]'
          );

        if (
          firstErrorElement instanceof
          HTMLElement
        ) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          firstErrorElement.focus();
        }

        return false;
      }

      return true;
    }, [
      dates.dateDebut,
      dates.dateFin,
      selectedVehicleId,
      notesClient,
    ]);

  /* ==========================================================
     CAN SUBMIT
  ========================================================== */

  const canSubmit = useMemo(() => {
    if (
      !dates.dateDebut ||
      !dates.dateFin ||
      !selectedVehicleId
    ) {
      return false;
    }

    const dateErrors =
      validateDates(
        dates.dateDebut,
        dates.dateFin
      );

    return (
      Object.keys(dateErrors).length === 0 &&
      notesClient.length <= 1000
    );
  }, [
    dates.dateDebut,
    dates.dateFin,
    selectedVehicleId,
    notesClient,
  ]);

  /* ==========================================================
     CREATE RESERVATION
  ========================================================== */

  const handleSubmit =
    useCallback(async () => {
      setGlobalError("");

      if (!validateForm()) {
        return;
      }

      if (!user) {
        navigate(
          `/login?next=${encodeURIComponent(
            "/reservation"
          )}`,
          {
            replace: true,
          }
        );

        return;
      }

      if (!eligibility.eligible) {
        navigate(
          `/profile/complete?next=${encodeURIComponent(
            "/reservation"
          )}`,
          {
            replace: true,
          }
        );

        return;
      }

      if (!selectedVehicleId) {
        setErrors({
          vehicules:
            "Veuillez sélectionner un véhicule.",
        });

        return;
      }

      const selectedVehicleExists =
        vehicles.some(
          (vehicle) =>
            vehicle.id ===
              selectedVehicleId &&
            vehicle.status === "AVAILABLE"
        );

      if (!selectedVehicleExists) {
        setErrors({
          vehicules:
            "Ce véhicule n'est plus disponible. Veuillez en sélectionner un autre.",
        });

        await loadVehicles();

        return;
      }

      setIsSubmitting(true);

      try {
        const payload = {
          date_debut: dates.dateDebut,
          date_fin: dates.dateFin,
          vehicules: [selectedVehicleId],
          notes_client: notesClient.trim(),
        };

        const reservation =
          await reservationService.createReservation(
            payload
          );

        setCreatedReservation(
          reservation
        );
      } catch (error) {
        console.error(
          "Erreur lors de la création de la réservation :",
          error
        );

        const {
          fieldErrors,
          globalMessage,
        } = extractApiErrors(error);

        setErrors(fieldErrors);
        setGlobalError(globalMessage);

        const apiError =
          error as ApiErrorLike;

        const status =
          apiError?.response?.status;

        if (
          status === 400 ||
          status === 409
        ) {
          await loadVehicles();
        }

        requestAnimationFrame(() => {
          reservationFormRef.current?.scrollIntoView(
            {
              behavior: "smooth",
              block: "start",
            }
          );
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [
      validateForm,
      user,
      eligibility.eligible,
      navigate,
      selectedVehicleId,
      vehicles,
      dates.dateDebut,
      dates.dateFin,
      notesClient,
      loadVehicles,
    ]);

  /* ==========================================================
     NEW RESERVATION
  ========================================================== */

  const handleNewReservation =
    useCallback(() => {
      setCreatedReservation(null);

      setDates({
        dateDebut: "",
        dateFin: "",
      });

      setSelectedVehicleId(null);
      setSelectedCategory("ALL");
      setNotesClient("");
      setErrors({});
      setGlobalError("");

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }, []);

  /* ==========================================================
     HERO CTA
  ========================================================== */

  const handleStartReservation =
    useCallback(() => {
      document
        .getElementById(
          "reservation-dates"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, []);

  /* ==========================================================
     AUTH LOADING
  ========================================================== */

  if (authLoading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div
            className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm"
            role="status"
            aria-live="polite"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Loader2
                size={28}
                className="animate-spin text-red-600"
              />
            </div>

            <p className="mt-5 text-sm font-black text-neutral-950">
              Vérification de votre compte
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Nous préparons votre espace de
              réservation.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     NOT AUTHENTICATED
  ========================================================== */

  if (!user) {
    return null;
  }

  /* ==========================================================
     INCOMPLETE PROFILE
  ========================================================== */

  if (!eligibility.eligible) {
    return (
      <main className="min-h-screen bg-neutral-50 px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <div className="h-1.5 bg-red-600" />

            <div className="px-7 py-9 text-center sm:px-10 sm:py-11">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldCheck size={30} />
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                Profil requis
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
                Complétez votre profil
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Certaines informations sont nécessaires
                avant de pouvoir effectuer une
                réservation.
              </p>

              {eligibility.reasons.length >
                0 && (
                <div className="mt-7 rounded-2xl bg-neutral-50 p-5 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                    Informations manquantes
                  </p>

                  <ul className="mt-3 space-y-2">
                    {eligibility.reasons.map(
                      (reason) => (
                        <li
                          key={reason}
                          className="flex items-start gap-2 text-xs leading-5 text-neutral-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                          {reason}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/profile/complete?next=${encodeURIComponent(
                      "/reservation"
                    )}`
                  )
                }
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_rgba(204,0,0,0.18)] transition hover:bg-red-700"
              >
                Compléter mon profil
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  if (createdReservation) {
    return (
      <ReservationSuccess
        reservation={createdReservation}
        onNewReservation={
          handleNewReservation
        }
      />
    );
  }

  /* ==========================================================
     MAIN PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-white">
      {/* ======================================================
          HERO
      ====================================================== */}

      <ReservationHero
        onStartReservation={
          handleStartReservation
        }
      />

      {/* ======================================================
          GLOBAL ERROR
      ====================================================== */}

      {globalError && (
        <div className="border-b border-red-100 bg-red-50">
          <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-10">
            <div
              role="alert"
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <AlertCircle size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-neutral-950">
                  Impossible de créer la réservation
                </p>

                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  {globalError}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          RECOMMENDED VEHICLES
      ====================================================== */}

      {!vehiclesLoading &&
        vehicles.length > 0 && (
          <ReservationHotVehicles
            vehicles={vehicles}
            selectedVehicleIds={
              selectedVehicleId
                ? [selectedVehicleId]
                : []
            }
            onVehicleSelect={
              handleVehicleSelect
            }
            disabled={isSubmitting}
          />
        )}

      {/* ======================================================
          FORM
      ====================================================== */}

      <div ref={reservationFormRef}>
        {/* ----------------------------------------------------
            DATES
        ---------------------------------------------------- */}

        <ReservationDateSelector
          dateDebut={dates.dateDebut}
          dateFin={dates.dateFin}
          onDateDebutChange={
            handleDateDebutChange
          }
          onDateFinChange={
            handleDateFinChange
          }
          disabled={isSubmitting}
        />

        {/* ----------------------------------------------------
            VEHICLES
        ---------------------------------------------------- */}

        <ReservationVehicleGrid
          vehicles={vehicles}
          selectedCategory={selectedCategory}
          selectedVehicleIds={
            selectedVehicleId
              ? [selectedVehicleId]
              : []
          }
          onVehicleSelect={
            handleVehicleSelect
          }
          loading={vehiclesLoading}
          disabled={isSubmitting}
        />

        {/* ----------------------------------------------------
            VEHICLE ERROR
        ---------------------------------------------------- */}

        {errors.vehicules && (
          <div className="bg-white">
            <div className="mx-auto max-w-7xl px-5 pb-5 sm:px-8 lg:px-10">
              <div
                role="alert"
                className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700"
              >
                <AlertCircle
                  size={17}
                  className="shrink-0"
                />

                <span>
                  {errors.vehicules}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            NOTES + SUMMARY
        ==================================================== */}

        <section className="border-t border-neutral-100 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:px-10">
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                Dernière étape
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
                Finalisez votre demande
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Ajoutez vos éventuelles précisions puis
                vérifiez le récapitulatif avant d'envoyer
                votre demande.
              </p>
            </div>

            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
              {/* ==================================================
                  LEFT COLUMN
              ================================================== */}

              <div className="space-y-6">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                  <ReservationNotes
                    value={notesClient}
                    onChange={
                      handleNotesChange
                    }
                    disabled={isSubmitting}
                    maxLength={1000}
                  />

                  {errors.notes_client && (
                    <div
                      role="alert"
                      className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700"
                    >
                      <AlertCircle
                        size={15}
                        className="shrink-0"
                      />

                      <span>
                        {errors.notes_client}
                      </span>
                    </div>
                  )}
                </div>

                <ReservationSecurityInfo />
              </div>

              {/* ==================================================
                  RIGHT COLUMN
              ================================================== */}

              <div className="lg:sticky lg:top-6 lg:self-start">
                <ReservationSummary
                  dateDebut={
                    dates.dateDebut
                  }
                  dateFin={dates.dateFin}
                  selectedVehicles={
                    selectedVehicles
                  }
                  canSubmit={canSubmit}
                  isSubmitting={
                    isSubmitting
                  }
                  onSubmit={
                    handleSubmit
                  }
                />

                {(errors.date_debut ||
                  errors.date_fin) && (
                  <div
                    role="alert"
                    className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <AlertCircle
                          size={16}
                        />
                      </div>

                      <div className="space-y-1.5">
                        {errors.date_debut && (
                          <p className="text-xs font-semibold leading-5 text-red-700">
                            {errors.date_debut}
                          </p>
                        )}

                        {errors.date_fin && (
                          <p className="text-xs font-semibold leading-5 text-red-700">
                            {errors.date_fin}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ======================================================
          INFORMATION FOOTER
      ====================================================== */}

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <CheckCircle2
                  size={17}
                />
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-800">
                  Demande sécurisée
                </p>

                <p className="mt-0.5 max-w-xl text-xs leading-5 text-neutral-500">
                  Votre demande sera vérifiée par notre
                  équipe avant sa confirmation définitive.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-neutral-500 transition hover:text-red-600"
            >
              <ArrowLeft size={14} />
              Retour en haut
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

