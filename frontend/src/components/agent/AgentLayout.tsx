import { Outlet } from "react-router-dom";
import { useState } from "react";

import AgentSidebar from "./AgentSidebar";
import AgentHeader from "./AgentHeader";
import { useDisplayName } from "../../hooks/useDisplayName";

export default function AgentLayout() {
  const [search, setSearch] = useState("");
  const displayName = useDisplayName();

  return (
    <div className="min-h-screen bg-[#F4F5F6] text-[#202327]">
      <div className="flex">
        <AgentSidebar />

        <main className="min-w-0 flex-1 bg-[#F4F5F6]">
          <AgentHeader
            userName={displayName}
            search={search}
            onSearchChange={setSearch}
          />

          <div className="mx-auto w-full max-w-[1700px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
