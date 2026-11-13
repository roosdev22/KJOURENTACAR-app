import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import notificationService from "../../api/services/notificationService";
import type { Notification } from "../../types/notification";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcon";

type NotificationFilter = "ALL" | "UNREAD" | "READ";
type NotificationIcon =
  | "bell"
  | "check"
  | "check-all"
  | "clock"
  | "loader"
  | "refresh"
  | "shield";

interface NotificationsPageProps {
  variant?: "default" | "admin";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isInternalLink(link: string): boolean {
  return ["/agent", "/admin", "/gestionnaire"].some(
    (prefix) =>
      link === prefix || link.startsWith(`${prefix}/`),
  );
}

export default function NotificationsPage({
  variant = "default",
}: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const result = await notificationService.getAll();
      const items = Array.isArray(result) ? result : result.results;
      setNotifications(items);
    } catch {
      setError("Impossible de charger les notifications. Réessaie.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    notificationService
      .getAll()
      .then((result) => {
        if (!active) return;

        const items = Array.isArray(result) ? result : result.results;
        setNotifications(items);
      })
      .catch(() => {
        if (active) {
          setError("Impossible de charger les notifications. Réessaie.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.est_lue).length,
    [notifications],
  );

  const readCount = notifications.length - unreadCount;
  const adminTheme = variant === "admin";
  const renderIcon = (
    icon: NotificationIcon,
    size: number,
    className?: string,
  ) => {
    if (adminTheme) {
      const adminIcons: Record<NotificationIcon, AdminIconName> = {
        bell: "notifications",
        check: "check-circle",
        "check-all": "check-circle",
        clock: "clock",
        loader: "loader",
        refresh: "refresh",
        shield: "shield",
      };

      return (
        <AdminIcon name={adminIcons[icon]} size={size} className={className} />
      );
    }

    const icons = {
      bell: Bell,
      check: Check,
      "check-all": CheckCheck,
      clock: Clock,
      loader: LoaderCircle,
      refresh: RefreshCw,
      shield: ShieldCheck,
    };
    const Icon = icons[icon];
    return <Icon size={size} className={className} />;
  };

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        if (filter === "UNREAD") return !item.est_lue;
        if (filter === "READ") return item.est_lue;
        return true;
      }),
    [notifications, filter],
  );

  const markAsRead = async (notification: Notification) => {
    if (notification.est_lue || processingId !== null || markingAll) {
      return;
    }

    setProcessingId(notification.id);
    setError(null);

    try {
      const updated = await notificationService.markAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
    } catch {
      setError("Impossible de marquer cette notification comme lue.");
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0 || processingId !== null) {
      return;
    }

    setMarkingAll(true);
    setError(null);

    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          est_lue: true,
          lue_le: item.lue_le ?? new Date().toISOString(),
        })),
      );
    } catch {
      setError("Impossible de marquer toutes les notifications comme lues.");
    } finally {
      setMarkingAll(false);
    }
  };

  const filters: {
    value: NotificationFilter;
    label: string;
    count: number;
  }[] = [
    { value: "ALL", label: "Toutes", count: notifications.length },
    { value: "UNREAD", label: "Non lues", count: unreadCount },
    { value: "READ", label: "Lues", count: readCount },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
              {renderIcon("bell", 23)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Retrouvez les informations importantes de votre activité.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadNotifications(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {renderIcon("refresh", 16, refreshing ? "animate-spin" : "")}
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={markingAll || unreadCount === 0 || processingId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? (
              renderIcon("loader", 16, "animate-spin")
            ) : (
              renderIcon("check-all", 16)
            )}
            Tout marquer comme lu
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total
            </p>
            {renderIcon("bell", 19, "text-gray-400")}
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-gray-900">
            {notifications.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Notifications reçues
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Non lues
            </p>
            {renderIcon("clock", 19, "text-red-600")}
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-red-700">
            {unreadCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            À consulter
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Lues
            </p>
            {renderIcon("shield", 19, "text-green-600")}
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-gray-900">
            {readCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Déjà consultées
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-bold text-gray-900">
              Centre de notifications
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Consultez et gérez vos notifications.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filtrer les notifications">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-red-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                    filter === item.value
                      ? "bg-white/20 text-white"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="font-semibold underline underline-offset-2"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-gray-500">
            {renderIcon("loader", 20, "animate-spin text-red-700")}
            Chargement des notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              {renderIcon("bell", 25)}
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {filter === "UNREAD"
                ? "Aucune notification non lue"
                : filter === "READ"
                  ? "Aucune notification lue"
                  : "Aucune notification"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Les notifications liées à votre activité apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex gap-3 px-4 py-5 transition hover:bg-gray-50/70 sm:gap-4 sm:px-6 ${
                  notification.est_lue ? "bg-white" : "bg-red-50/40"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    notification.est_lue
                      ? "bg-gray-100 text-gray-500"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {renderIcon("bell", 19)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-bold text-gray-900">
                      {notification.titre}
                    </h3>
                    {!notification.est_lue && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                        Nouveau
                      </span>
                    )}
                  </div>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(notification.cree_le)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {isInternalLink(notification.lien) && (
                      <Link
                        to={notification.lien}
                        className="text-xs font-semibold text-red-700 hover:text-red-800 hover:underline"
                      >
                        Voir les détails
                      </Link>
                    )}

                    {!notification.est_lue && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification)}
                        disabled={processingId !== null || markingAll}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === notification.id ? (
                          renderIcon("loader", 14, "animate-spin")
                        ) : (
                          renderIcon("check", 14)
                        )}
                        Marquer comme lue
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredNotifications.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-500 sm:px-6">
            {filteredNotifications.length} notification(s) affichée(s)
          </div>
        )}
      </section>
    </div>
  );
}
