import { Bell, Search } from "lucide-react";

export default function TopBar({ userName = "Jean" }) {
  return (
    <header className="fixed top-0 right-0 left-64 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      {/* Search */}
      <div className="relative w-72">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Rechercher..."
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {/* Notification dot */}
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            JB
          </div>
          <span className="text-sm font-medium text-gray-700">{userName} B.</span>
        </div>
      </div>
    </header>
  );
}