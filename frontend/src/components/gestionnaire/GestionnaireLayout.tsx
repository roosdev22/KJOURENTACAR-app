import { useState } from "react";
import { Outlet } from "react-router-dom";

import GestionnaireSidebar from "./GestionnaireSidebar";
import AdminHeader from "../admin/AdminHeader";
import { useDisplayName } from "../../hooks/useDisplayName";
import { useAuth } from "../../hooks/useAuth";

export default function GestionnaireLayout() {
  const [search, setSearch] = useState("");
  const displayName = useDisplayName();
  const { user } = useAuth();

  const roleLabel =
    user?.role === "GESTIONNAIRE" ? "Gestionnaire du parc" :
    user?.role === "ADMIN"        ? "Administrateur"       :
                                    "Utilisateur";

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <div className="flex h-full">

        <GestionnaireSidebar />

        <div className="flex flex-1 flex-col min-w-0">

          <AdminHeader
            userName={displayName}
            userRole={roleLabel}
            search={search}
            onSearchChange={setSearch}
            notificationCount={2}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}