import { Outlet } from "react-router-dom";
import { useState } from "react";

import AgentSidebar from "./AgentSidebar";
import AgentHeader from "./AgentHeader";
import { useDisplayName } from "../../hooks/useDisplayName";

export default function AgentLayout() {
  const [search, setSearch] = useState("");
  const displayName = useDisplayName();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 min-w-0">
          <AgentHeader
            userName={displayName}
            search={search}
            onSearchChange={setSearch}
            notificationCount={3}
          />

          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}