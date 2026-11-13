import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import clientService, {
  type AgentClient,
} from "../../api/services/clientService";

export default function AgentClients() {
  const [clients, setClients] = useState<AgentClient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch {
      setError("Impossible de charger la liste des clients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

   useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (cancelled) return;
      await loadClients();
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    if (!query) return clients;

    return clients.filter((client) => {
      const fullName =
        `${client.first_name} ${client.last_name}`.toLocaleLowerCase();

      return (
        fullName.includes(query) ||
        client.email.toLocaleLowerCase().includes(query) ||
        (client.phone ?? "").toLocaleLowerCase().includes(query)
      );
    });
  }, [clients, search]);

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E3E6E8] bg-white p-5 shadow-[0_12px_28px_rgba(23,25,28,0.04)] sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
            Clients
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#202327]">
            Gestion des clients
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Consultez les coordonnées et le statut des clients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadClients(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B4232F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#941C27] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E3E6E8] bg-white p-5 shadow-[0_10px_24px_rgba(23,25,28,0.04)]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#B4232F]/10 p-3 text-[#B4232F]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Total des clients</p>
              <p className="text-2xl font-bold text-[#202327]">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E3E6E8] bg-white p-5 shadow-[0_10px_24px_rgba(23,25,28,0.04)]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Comptes actifs</p>
              <p className="text-2xl font-bold text-[#202327]">{clients.filter((client) => client.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E3E6E8] bg-white shadow-[0_12px_28px_rgba(23,25,28,0.04)]">
        <div className="border-b border-[#E3E6E8] p-4 sm:p-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
              className="w-full rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] py-2.5 pl-10 pr-4 text-sm text-[#202327] outline-none transition focus:border-[#B4232F] focus:bg-white focus:ring-2 focus:ring-[#B4232F]/10"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => void loadClients()}
              className="font-semibold underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Chargement des clients...
          </div>
        ) : !error && filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              {search ? "Aucun résultat" : "Aucun client enregistré"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Essayez un autre nom, email ou numéro."
                : "Les clients apparaîtront ici lorsqu'ils seront enregistrés."}
            </p>
          </div>
        ) : !error ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-5 py-3 font-semibold">Téléphone</th>
                    <th className="px-5 py-3 font-semibold">Adresse</th>
                    <th className="px-5 py-3 font-semibold">Inscription</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const fullName =
                      `${client.first_name} ${client.last_name}`.trim();

                    return (
                      <tr
                        key={client.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 font-bold text-red-700">
                              {(
                                client.first_name?.[0] ??
                                client.email[0] ??
                                "C"
                              ).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {fullName || "Nom non renseigné"}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {client.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {client.phone || "Non renseigné"}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-5 py-4 text-slate-600">
                          <span className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {client.address || "Non renseignée"}
                            </span>
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(client.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              client.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {client.is_active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
              {filteredClients.length} client
              {filteredClients.length > 1 ? "s" : ""} affiché
              {filteredClients.length > 1 ? "s" : ""}
              {search && ` sur ${clients.length}`}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}