import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  LoaderCircle,
  X,
} from "lucide-react";

import notificationService from "../../api/services/notificationService";
import type { Notification } from "../../types/notification";
import AdminIcon, { type AdminIconName } from "../admin/AdminIcon";

interface NotificationBellProps {
  variant?: "default" | "gestionnaire" | "admin";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationBell({
  variant = "default",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gestionnaireTheme = variant === "gestionnaire";
  const adminTheme = variant === "admin";
  const mutedTextClass = gestionnaireTheme ? "text-kjou-muted" : "text-black/50";
  const messageTextClass = gestionnaireTheme ? "text-kjou-text" : "text-black/65";
  const dateTextClass = gestionnaireTheme ? "text-kjou-muted" : "text-black/40";
  const actionTextClass = gestionnaireTheme ? "text-kjou-muted" : "text-black/50";
  const focusClass = gestionnaireTheme
    ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2"
    : "";
  const renderIcon = (
    icon: "bell" | "check" | "check-all" | "loader" | "close",
    size: number,
    className?: string,
  ) => {
    if (adminTheme) {
      const adminIcons: Record<typeof icon, AdminIconName> = {
        bell: "notifications",
        check: "check-circle",
        "check-all": "check-circle",
        loader: "loader",
        close: "close",
      };

      return (
        <AdminIcon name={adminIcons[icon]} size={size} className={className} />
      );
    }

    const icons = {
      bell: Bell,
      check: Check,
      "check-all": CheckCheck,
      loader: LoaderCircle,
      close: X,
    };
    const Icon = icons[icon];
    return <Icon size={size} className={className} />;
  };

  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Une erreur temporaire ne doit pas bloquer le reste du header.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationService.getAll();
      setNotifications(
        Array.isArray(result) ? result : result.results,
      );
      await refreshCount();
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);


 const togglePanel = () => {
  const nextOpen = !open;
  setOpen(nextOpen);

  if (nextOpen) {
    void loadNotifications();
  } else {
    void refreshCount();
  }
};

  const markAsRead = async (notification: Notification) => {
    if (notification.est_lue || processingId !== null) {
      return;
    }

    setProcessingId(notification.id);
    setError(null);

    try {
      const updated = await notificationService.markAsRead(
        notification.id,
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      setError("Impossible de marquer cette notification comme lue.");
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) {
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

      setUnreadCount(0);
    } catch {
      setError("Impossible de marquer toutes les notifications comme lues.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={togglePanel}
        aria-label={`Notifications, ${unreadCount} non lue(s)`}
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-black/5 hover:text-black ${gestionnaireTheme ? "text-kjou-muted" : "text-black/60"} ${focusClass}`}
      >
        {renderIcon("bell", 20)}

        {unreadCount > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white px-1 text-[9px] font-bold text-white ${gestionnaireTheme ? "bg-kjou-red" : "bg-red-700"}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer les notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <section
            aria-label="Centre de notifications"
            className="absolute right-0 z-40 mt-2 w-[min(90vw,24rem)] overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-black">
                  Notifications
                </h2>
                <p className={`mt-0.5 text-xs ${mutedTextClass}`}>
                  {unreadCount} non lue(s)
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  disabled={markingAll || unreadCount === 0}
                  title="Tout marquer comme lu"
                  aria-label="Tout marquer comme lu"
                  className={`rounded-lg p-2 ${actionTextClass} transition hover:bg-black/5 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`}
                >
                  {markingAll ? (
                    renderIcon("loader", 17, "animate-spin")
                  ) : (
                    renderIcon("check-all", 17)
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className={`rounded-lg p-2 ${actionTextClass} transition hover:bg-black/5 hover:text-black ${focusClass}`}
                >
                  {renderIcon("close", 17)}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="px-4 py-3 text-xs text-red-700">
                {error}
              </p>
            )}

            <div className="max-h-[min(65vh,28rem)] overflow-y-auto">
              {loading ? (
                <div className={`flex items-center justify-center gap-2 px-4 py-8 text-sm ${mutedTextClass}`}>
                  {renderIcon("loader", 18, "animate-spin")}
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <p className={`px-4 py-8 text-center text-sm ${mutedTextClass}`}>
                  Aucune notification.
                </p>
              ) : (
                notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`border-b border-black/5 px-4 py-3 last:border-b-0 ${
                      notification.est_lue
                        ? "bg-white"
                        : gestionnaireTheme
                          ? "bg-kjou-red/5"
                          : "bg-red-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          notification.est_lue
                            ? gestionnaireTheme
                              ? "bg-kjou-mist text-kjou-muted"
                              : "bg-gray-100 text-gray-500"
                            : gestionnaireTheme
                              ? "bg-kjou-red/10 text-kjou-red"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {renderIcon("bell", 15)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-black">
                          {notification.titre}
                        </p>

                        <p className={`mt-1 whitespace-pre-wrap break-words text-xs leading-5 ${messageTextClass}`}>
                          {notification.message}
                        </p>

                        <p className={`mt-2 text-xs ${dateTextClass}`}>
                          {formatDate(notification.cree_le)}
                        </p>

                         {["/agent", "/admin", "/gestionnaire"].some(
                                (prefix) =>
                                    notification.lien === prefix ||
                                    notification.lien.startsWith(`${prefix}/`),
                                ) && (
                                <Link
                                    to={notification.lien}
                                    onClick={() => setOpen(false)}
                                    className={`mt-2 inline-block text-xs font-semibold ${gestionnaireTheme ? "text-kjou-red" : "text-red-700"} hover:underline ${focusClass}`}
                                >
                                    Voir les détails
                                </Link>
                                )} 
                      </div>

                      {!notification.est_lue && (
                        <button
                          type="button"
                          onClick={() => void markAsRead(notification)}
                          disabled={processingId !== null}
                          title="Marquer comme lue"
                          aria-label={`Marquer comme lue : ${notification.titre}`}
                          className={`rounded-lg p-2 ${gestionnaireTheme ? "text-kjou-muted" : "text-black/45"} transition hover:bg-white hover:text-red-700 disabled:opacity-40 ${focusClass}`}
                        >
                          {processingId === notification.id ? (
                            renderIcon("loader", 15, "animate-spin")
                          ) : (
                            renderIcon("check", 15)
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
