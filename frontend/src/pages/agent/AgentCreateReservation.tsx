import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import reservationService from "../../api/services/reservationService";
import { getApiErrorMessage } from "../../utils/apiError";

import {
  authService,
  type User,
} from "../../api/services/authService";

import {
  vehicleService,
  type Vehicle,
} from "../../api/services/vehicleService";

import AgentClientSelector from "../../components/agent/reservation/AgentClientSelector";
import AgentClientForm from "../../components/agent/reservation/AgentClientForm";
import AgentReservationDates from "../../components/agent/reservation/AgentReservationDates";
import AgentReservationVehicleSelector from "../../components/agent/reservation/AgentReservationVehicleSelector";
import AgentReservationSummary from "../../components/agent/reservation/AgentReservationSummary";

export default function AgentCreateReservation() {
  const navigate = useNavigate();

  // ============================================================
  // CLIENT
  // ============================================================

  const [clients, setClients] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] =
    useState<User | null>(null);

  const [clientSearch, setClientSearch] = useState("");
  const [isLoadingClients, setIsLoadingClients] =
    useState(true);
  const [clientsError, setClientsError] =
    useState<string | null>(null);

  const [showClientForm, setShowClientForm] =
    useState(false);

  // ============================================================
  // DATES
  // ============================================================

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // ============================================================
  // VÉHICULES
  // ============================================================

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] =
    useState<string[]>([]);

 

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isLoadingVehicles, setIsLoadingVehicles] =
    useState(false);
  const [vehiclesError, setVehiclesError] =
    useState<string | null>(null);

  // ============================================================
  // NOTES
  // ============================================================

  const [notesClient, setNotesClient] = useState("");
  const [notesAgent, setNotesAgent] = useState("");


const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);
  // ============================================================
  // CHARGEMENT DES CLIENTS
  // ============================================================



useEffect(() => {
  let isMounted = true;

  async function loadClients() {
    try {
      setIsLoadingClients(true);
      setClientsError(null);

      const data = await authService.getClients();

      if (!isMounted) {
        return;
      }

      const clientUsers = data.filter(
        (user) => user.role === "CLIENT"
      );

      setClients(clientUsers);
    
    } catch (error: unknown) {
      if (!isMounted) {
        return;
      }

      console.error("Erreur lors du chargement des clients.");

      setClientsError(
        getApiErrorMessage(
          error,
          "Impossible de charger la liste des clients."
        )
      );
    } finally {
      if (isMounted) {
        setIsLoadingClients(false);
      }
    }

  }

  loadClients();

  return () => {
    isMounted = false;
  };
}, []);

  // ============================================================
  // CHARGEMENT DES VÉHICULES
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      try {
        setIsLoadingVehicles(true);
        setVehiclesError(null);

        const data = await vehicleService.getVehicles();

        if (!isMounted) {
          return;
        }

        setVehicles(data);
       
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        console.error("Erreur lors du chargement des véhicules.");

        setVehiclesError(
          getApiErrorMessage(
            error,
            "Impossible de charger les véhicules."
          )
        );
      } finally {
        if (isMounted) {
          setIsLoadingVehicles(false);
        }
      }

    }

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // CLIENT SÉLECTIONNÉ
  // ============================================================

  function handleSelectClient(client: User) {
    setSelectedClient(client);

    // On réinitialise les véhicules lorsqu'on change de client.
    setSelectedVehicleIds([]);

    // On ferme le formulaire de création s'il était ouvert.
    setShowClientForm(false);
  }

  // ============================================================
  // CLIENT CRÉÉ
  // ============================================================

  function handleClientCreated(client: User) {
    // Ajouter le nouveau client à la liste.
    setClients((currentClients) => {
      const alreadyExists = currentClients.some(
        (item) => item.id === client.id
      );

      if (alreadyExists) {
        return currentClients;
      }

      return [client, ...currentClients];
    });

    // Sélectionner automatiquement le nouveau client.
    setSelectedClient(client);

    // Fermer le formulaire.
    setShowClientForm(false);

    // Réinitialiser les véhicules sélectionnés.
    setSelectedVehicleIds([]);

    // Nettoyer la recherche.
    setClientSearch("");
  }

  // ============================================================
  // SÉLECTION DES VÉHICULES
  // ============================================================

  function handleToggleVehicle(vehicleId: string) {
    setSelectedVehicleIds((currentIds) => {
      if (currentIds.includes(vehicleId)) {
        return currentIds.filter(
          (id) => id !== vehicleId
        );
      }

      return [...currentIds, vehicleId];
    });
  }

  // ============================================================
  // VÉHICULES SÉLECTIONNÉS
  // ============================================================

  const selectedVehicles = useMemo(() => {
    return vehicles.filter((vehicle) =>
      selectedVehicleIds.includes(String(vehicle.id))
    );
  }, [vehicles, selectedVehicleIds]);

  const canSubmit =
  !!selectedClient &&
  !!dateDebut &&
  !!dateFin &&
  selectedVehicleIds.length > 0 &&
  !isSubmitting;

  // ============================================================
  // RETOUR AUX RÉSERVATIONS
  // ============================================================

  function handleDateDebutChange(value: string) {
  setDateDebut(value);

  if (dateFin && value && dateFin <= value) {
    setDateFin("");
  }

  setSubmitError(null);
}

 async function handleCreateReservation() {
  if (!selectedClient) {
    setSubmitError("Veuillez sélectionner un client.");
    return;
  } 

  if (!dateDebut || !dateFin) {
    setSubmitError(
      "Veuillez sélectionner les dates de réservation."
    );
    return;
  }

  if (dateFin <= dateDebut) {
  setSubmitError(
    "La date de fin doit être strictement postérieure à la date de début."
  );
  return;
}

  if (selectedVehicleIds.length === 0) {
    setSubmitError(
      "Veuillez sélectionner au moins un véhicule."
    );
    return;
  }

  try {
    setIsSubmitting(true);
    setSubmitError(null);

    const reservation =
      await reservationService.createReservationAsAgent({
        client_id: String(selectedClient.id),
        date_debut: dateDebut,
        date_fin: dateFin,
        vehicules: selectedVehicleIds,
        notes_client: notesClient.trim() || undefined,
        notes_agent: notesAgent.trim() || undefined,
      });

    navigate(`/agent/reservations/${reservation.id}`);
  
  
  } catch (error: unknown) {
    let backendData: Record<string, unknown> | null = null;

    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const response = error.response;

      if (
        typeof response === "object" &&
        response !== null &&
        "data" in response
      ) {
        const data = response.data;

        if (
          typeof data === "object" &&
          data !== null &&
          !Array.isArray(data)
        ) {
          backendData = data as Record<string, unknown>;
        }
      }
    }

    // Garder la réponse réelle du backend pour le diagnostic.
    console.error(
      "Erreur de création de réservation :",
      backendData ?? error
    );

    let message: string;

    if (
      backendData?.code === "VEHICLE_RESERVATION_CONFLICT"
    ) {
      message =
        "Le véhicule sélectionné n’est pas disponible pour cette période. Veuillez choisir un autre véhicule ou modifier les dates.";
    } else if (
      backendData?.code === "VEHICLE_UNAVAILABLE"
    ) {
      message =
        "Le véhicule sélectionné n’est plus disponible. Veuillez en choisir un autre.";
    } else {
      message = getApiErrorMessage(
        error,
        "Impossible de créer la réservation. Vérifiez les dates, le client et les véhicules sélectionnés."
      );
    }

    setSubmitError(message);
  } finally {
    setIsSubmitting(false);
  }
}


  function handleBack() {
    navigate("/agent/reservations");
  }

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />

            Retour aux réservations
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Nouvelle réservation
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Créez une réservation pour un client.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENU
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ====================================================
            COLONNE PRINCIPALE
        ==================================================== */}

        <div className="space-y-6">
          {/* ==================================================
              CLIENT
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <UserRound size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Client
                </h2>

                <p className="text-sm text-slate-500">
                  Sélectionnez un client ou créez-en un nouveau.
                </p>
              </div>
            </div>

            {showClientForm ? (
              <AgentClientForm
                onCancel={() =>
                  setShowClientForm(false)
                }
                onClientCreated={handleClientCreated}
              />
            ) : (
              <AgentClientSelector
                clients={clients}
                selectedClientId={
                  selectedClient?.id
                    ? String(selectedClient.id)
                    : null
                }
                search={clientSearch}
                isLoading={isLoadingClients}
                error={clientsError}
                onSearchChange={setClientSearch}
                onSelectClient={handleSelectClient}
                onCreateClient={() =>
                  setShowClientForm(true)
                }
              />
            )}
          </section>

          {/* ==================================================
              DATES
          ================================================== */}

          {selectedClient && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            
              <AgentReservationDates
                dateDebut={dateDebut}
                dateFin={dateFin}
                onDateDebutChange={handleDateDebutChange}
                onDateFinChange={(value) => {
                  setDateFin(value);
                  setSubmitError(null);
                }}
              />

            </section>
          )}

          {/* ==================================================
              VÉHICULES
          ================================================== */}

          {selectedClient &&
            dateDebut &&
            dateFin && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <AgentReservationVehicleSelector
                  vehicles={vehicles}
                  selectedVehicleIds={
                    selectedVehicleIds
                  }
                  search={vehicleSearch}
                  isLoading={isLoadingVehicles}
                  error={vehiclesError}
                  onSearchChange={setVehicleSearch}
                  onToggleVehicle={
                    handleToggleVehicle
                  }
                />
              </section>
            )}
        </div>

        {/* ====================================================
            RÉSUMÉ
        ==================================================== */}

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <AgentReservationSummary
              client={selectedClient}
              dateDebut={dateDebut}
              dateFin={dateFin}
              vehicles={selectedVehicles}
              notesClient={notesClient}
              notesAgent={notesAgent}
              onNotesClientChange={setNotesClient}
              onNotesAgentChange={setNotesAgent}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleCreateReservation}
            />
        </aside>
      </div>
    </div>
  );
}