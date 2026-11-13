import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useDisplayName } from "../../hooks/useDisplayName";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLayout() {
  const displayName = useDisplayName();
  const { user } = useAuth();
  const roleLabel =
    user?.role === "SUPER_ADMIN" ? "Super administrateur" : "Administrateur";

  return (
    <div className="min-h-screen bg-kjou-mist font-kjou-body text-kjou-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />

        <main className="flex-1 min-w-0">
          <AdminHeader userName={displayName} userRole={roleLabel} />

          <div className="p-4 sm:p-6 xl:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
