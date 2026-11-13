import NotificationBell from "../notifications/NotificationBell";
import AdminIcon from "./AdminIcon";

interface AdminHeaderProps {
  userName: string;
  userRole: string;
}

export default function AdminHeader({
  userName,
  userRole,
}: AdminHeaderProps) {
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="w-full border-b border-kjou-border bg-white">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-kjou-muted">
            Administration
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-kjou-text">
            Bonjour, {userName}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell variant="admin" />

          <div className="hidden h-8 w-px bg-kjou-border sm:block" />

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kjou-carbon text-xs font-bold text-white">
              {initials || <AdminIcon name="user" size={17} />}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="max-w-40 truncate text-xs font-semibold text-kjou-text">
                {userName}
              </p>
              <p className="mt-0.5 text-[11px] text-kjou-muted">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}