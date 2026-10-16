import {
  Search,
  Bell,
  ChevronDown,
  User,
} from "lucide-react";

interface AgentHeaderProps {
  userName: string;
  userRole?: string;
  search: string;
  onSearchChange: (value: string) => void;
  notificationCount?: number;
}

export default function AgentHeader({
  userName,
  userRole = "Agent de location",
  search,
  onSearchChange,
  notificationCount = 0,
}: AgentHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-black/10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* ========================================================
              WELCOME
          ======================================================== */}
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-black/40">
              BIENVENUE,
            </p>

            <h1 className="mt-0.5 text-base sm:text-lg font-bold text-black truncate">
              {userName}
            </h1>
          </div>

          {/* ========================================================
              DESKTOP SEARCH
          ======================================================== */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="relative w-full max-w-xl">
              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  w-4
                  h-4
                  text-black/35
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  onSearchChange(event.target.value)
                }
                placeholder="Rechercher une réservation, un client..."
                className="
                  w-full
                  h-10
                  pl-9
                  pr-4
                  rounded-lg
                  bg-black/[0.02]
                  border border-black/10
                  text-sm
                  text-black
                  placeholder:text-black/35
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-red-300
                  focus:ring-2
                  focus:ring-red-100
                "
              />
            </div>
          </div>

          {/* ========================================================
              RIGHT ACTIONS
          ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="
                relative
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                text-black/60
                hover:bg-black/[0.04]
                hover:text-black
                transition
              "
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />

              {notificationCount > 0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    min-w-4
                    h-4
                    px-1
                    rounded-full
                    bg-red-700
                    text-white
                    text-[9px]
                    font-bold
                    flex
                    items-center
                    justify-center
                    border-2
                    border-white
                  "
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              type="button"
              className="
                flex
                items-center
                gap-2
                sm:gap-3
                px-2
                sm:px-3
                py-1.5
                rounded-lg
                hover:bg-black/[0.03]
                transition
              "
            >
              <div
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-red-50
                  text-red-700
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <User className="w-4 h-4" />
              </div>

              <div className="hidden sm:block text-left min-w-0">
                <p className="text-sm font-semibold text-black truncate max-w-32">
                  {userName}
                </p>

                <p className="text-[11px] text-black/40 truncate max-w-32">
                  {userRole}
                </p>
              </div>

              <ChevronDown className="hidden sm:block w-4 h-4 text-black/40" />
            </button>
          </div>
        </div>

        {/* ==========================================================
            MOBILE SEARCH
        ========================================================== */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                text-black/35
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Rechercher..."
              className="
                w-full
                h-10
                pl-9
                pr-4
                rounded-lg
                bg-black/[0.02]
                border border-black/10
                text-sm
                text-black
                placeholder:text-black/35
                outline-none
                focus:bg-white
                focus:border-red-300
                focus:ring-2
                focus:ring-red-100
                transition
              "
            />
          </div>
        </div>
      </div>
    </header>
  );
}