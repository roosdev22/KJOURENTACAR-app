import {
  Check,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

import type { User } from "../../../api/services/authService";

interface AgentClientSelectorProps {
  clients: User[];
  selectedClientId: string | null;
  search: string;
  isLoading: boolean;
  error: string | null;

  onSearchChange: (value: string) => void;
  onSelectClient: (client: User) => void;
  onCreateClient: () => void;
}

function getClientName(client: User) {
  const name = `${client.first_name || ""} ${
    client.last_name || ""
  }`.trim();

  return name || client.email;
}

export default function AgentClientSelector({
  clients,
  selectedClientId,
  search,
  isLoading,
  error,
  onSearchChange,
  onSelectClient,
  onCreateClient,
}: AgentClientSelectorProps) {
  const filteredClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const name = getClientName(client).toLowerCase();
    const email = client.email.toLowerCase();
    const phone = client.phone?.toLowerCase() || "";

    return (
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query)
    );
  });

  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <UserRound size={20} className="text-red-600" />

            <h2 className="text-lg font-bold text-slate-950">
              Client
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Sélectionnez un client existant ou enregistrez un nouveau client.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <Plus size={17} />
          Nouveau client
        </button>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
        />
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Chargement */}
      {isLoading && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            Chargement des clients...
          </p>
        </div>
      )}

      {/* Liste */}
      {!isLoading && !error && (
        <>
          {filteredClients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <UserRound
                size={28}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="text-sm font-semibold text-slate-700">
                Aucun client trouvé
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Vous pouvez enregistrer un nouveau client.
              </p>
            </div>
          ) : (
            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {filteredClients.map((client) => {
                const selected = client.id === selectedClientId;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectClient(client)}
                    className={[
                      "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        selected
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {getClientName(client)
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getClientName(client)}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={13} />
                          {client.email}
                        </span>

                        {client.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={13} />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {selected && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                        <Check size={15} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}