import {
  Search,
  Bell,
  ChevronDown,
  User,
} from "lucide-react";

interface AdminHeaderProps {
  userName: string;
  userRole?: string;
  search: string;
  onSearchChange: (value: string) => void;
  notificationCount?: number;
}

export default function AdminHeader({
  userName,
  userRole = "Administrateur",
  search,
  onSearchChange,
  notificationCount = 0,
}: AdminHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-black/10">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">

        <div className="min-w-0">
          <p className="text-xs text-black/45 mb-0.5">
            BIENVENUS,
          </p>
          <h1 className="text-base sm:text-lg font-bold text-black truncate">
            {userName}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">

          {/* Recherche */}
          <div className="relative hidden sm:block w-56 md:w-64 lg:w-72">
            <Search size={17} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-lg text-sm text-black placeholder:text-black/35 outline-none transition focus:bg-white focus:border-red-700 focus:ring-2 focus:ring-red-700/10"
            />
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative w-10 h-10 flex items-center justify-center rounded-lg text-black/60 hover:bg-black/5 hover:text-black transition"
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.8} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-red-700 text-white text-[9px] font-bold rounded-full">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block h-8 w-px bg-black/10" />

          {/* Profil */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/5 transition"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
              <User size={17} strokeWidth={1.8} />
            </div>

            <div className="hidden md:block text-left max-w-28">
              <p className="text-xs font-semibold text-black truncate">
                {userName}
              </p>
              <p className="text-[10px] text-black/40">
                {userRole}  {/* ← dynamique */}
              </p>
            </div>

            <ChevronDown size={15} className="hidden md:block text-black/40" />
          </button>
        </div>
      </div>

      {/* Recherche mobile */}
      <div className="sm:hidden px-4 pb-4">
        <div className="relative">
          <Search size={16} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-lg text-sm outline-none focus:bg-white focus:border-red-700 focus:ring-2 focus:ring-red-700/10"
          />
        </div>
      </div>
    </header>
  );
}