import { Bell, Search } from "lucide-react";

export default function TopBar({ userName = "Jean" }) {
  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-[#E3E6E8] bg-white/90 px-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Rechercher..."
          className="h-11 w-full rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] pl-9 pr-4 text-sm text-[#202327] placeholder:text-[#64748B] transition focus:border-[#B4232F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4232F]/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] text-[#64748B] transition hover:border-[#B4232F]/30 hover:bg-white hover:text-[#17191C]"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#B4232F]" />
        </button>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#E3E6E8] bg-[#F4F5F6] px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B4232F] text-[10px] font-bold text-white">
            JB
          </div>
          <span className="text-sm font-semibold text-[#202327]">{userName}</span>
        </div>
      </div>
    </header>
  );
}