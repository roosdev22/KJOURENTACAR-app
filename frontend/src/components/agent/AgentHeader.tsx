import {
  Search,
  ChevronDown,
  User,
} from "lucide-react";
import NotificationBell from "../notifications/NotificationBell";
interface AgentHeaderProps {
  userName: string;
  userRole?: string;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function AgentHeader({
  userName,
  userRole = "Agent de location",
  search,
  onSearchChange,
}: AgentHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#E3E6E8] bg-white/90 backdrop-blur-sm">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4232F] text-sm font-black text-white shadow-sm">
              K
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
                Espace agent
              </p>
              <h1 className="mt-0.5 truncate text-base font-bold text-[#202327] sm:text-lg">
                {userName}
              </h1>
            </div>
          </div>

          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher une réservation, un client..."
                className="h-11 w-full rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] pl-10 pr-4 text-sm text-[#202327] placeholder:text-[#64748B] outline-none transition focus:border-[#B4232F] focus:bg-white focus:ring-2 focus:ring-[#B4232F]/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] px-2 py-1.5 text-left transition hover:border-[#B4232F]/30 hover:bg-white sm:gap-3 sm:px-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B4232F]/10 text-[#B4232F]">
                <User className="h-4 w-4" />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-32 truncate text-sm font-semibold text-[#202327]">
                  {userName}
                </p>
                <p className="max-w-32 truncate text-[11px] text-[#64748B]">
                  {userRole}
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-[#64748B] sm:block" />
            </button>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher..."
              className="h-11 w-full rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] pl-10 pr-4 text-sm text-[#202327] placeholder:text-[#64748B] outline-none transition focus:border-[#B4232F] focus:bg-white focus:ring-2 focus:ring-[#B4232F]/10"
            />
          </div>
        </div>
      </div>
    </header>
  );
}