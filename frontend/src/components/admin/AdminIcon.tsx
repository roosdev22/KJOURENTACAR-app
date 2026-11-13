import type { ReactNode, SVGProps } from "react";

export type AdminIconName =
  | "dashboard"
  | "reservation"
  | "rental"
  | "vehicle"
  | "payment"
  | "contract"
  | "invoice"
  | "users"
  | "maintenance"
  | "reports"
  | "notifications"
  | "settings"
  | "logout"
  | "menu"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "user"
  | "trend-up"
  | "trend-down"
  | "wallet"
  | "calendar-check"
  | "check-circle"
  | "clock"
  | "wrench"
  | "ban"
  | "car-front"
  | "arrow-up-right"
  | "refresh"
  | "file"
  | "search"
  | "plus"
  | "x"
  | "edit"
  | "trash"
  | "user-check"
  | "user-x"
  | "chevron-up"
  | "x-circle"
  | "shield"
  | "crown"
  | "briefcase"
  | "user-round"
  | "mail"
  | "phone"
  | "loader"
  | "alert"
  | "alert-triangle"
  | "save"
  | "building"
  | "spark"
  | "download"
  | "spreadsheet"
  | "arrow-left"
  | "arrow-right"
  | "gauge"
  | "fuel"
  | "door-open"
  | "snowflake"
  | "check"
  | "send"
  | "message"
  | "database"
  | "lock"
  | "server"
  | "sparkles"
  | "eye"
  | "clipboard-check"
  | "credit-card"
  | "info"
  | "plus-circle"
  | "map-pin"
  | "help-circle";

interface AdminIconProps extends SVGProps<SVGSVGElement> {
  name: AdminIconName;
  size?: number;
}

export default function AdminIcon({
  name,
  size = 20,
  ...props
}: AdminIconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
  };

  const glyphs: Record<AdminIconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
        <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    reservation: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16h6" />
      </>
    ),
    rental: (
      <>
        <circle cx="8" cy="16.5" r="2.5" />
        <path d="M10.5 16.5h8a2 2 0 0 0 0-4h-1.25a2.25 2.25 0 1 1 2.25-2.25" />
      </>
    ),
    vehicle: (
      <>
        <path d="m4 14 1.7-5.2A2.5 2.5 0 0 1 8.1 7h7.8a2.5 2.5 0 0 1 2.4 1.8L20 14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        <path d="M5 14h14M7 11h10" />
        <circle cx="7.5" cy="15.5" r=".75" />
        <circle cx="16.5" cy="15.5" r=".75" />
      </>
    ),
    payment: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h4" />
      </>
    ),
    contract: (
      <>
        <path d="M6 3.5h8l4 4v13H6z" />
        <path d="M14 3.5v4h4M9 12h6M9 15h6M9 18h3" />
      </>
    ),
    invoice: (
      <>
        <path d="M6 3.5h12v17l-2.5-1.5L12 20.5l-3.5-1.5L6 20.5z" />
        <path d="M9 8h6M9 11.5h6M9 15h3" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.25A4.75 4.75 0 0 1 8.25 13h1.5a4.75 4.75 0 0 1 4.75 4.75V19zM15 5.5a3 3 0 0 1 0 5.8M16 13h.5a4 4 0 0 1 4 4v2h-4" />
      </>
    ),
    maintenance: (
      <>
        <path d="M14.5 6.5a4.5 4.5 0 0 0-5.8 5.8l-5.2 5.2a1.8 1.8 0 0 0 2.5 2.5l5.2-5.2a4.5 4.5 0 0 0 5.8-5.8L14 12l-2-2z" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20V11M10 20V5M16 20v-7M22 20H2" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" fill="currentColor" />
        <circle cx="15" cy="12" r="2" fill="currentColor" />
        <circle cx="8" cy="18" r="2" fill="currentColor" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M15 16l4-4-4-4M19 12H9" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    "chevron-left": <path d="m14.5 5-7 7 7 7" />,
    "chevron-right": <path d="m9.5 5 7 7-7 7" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0z" />
      </>
    ),
    "trend-up": <path d="m3 17 6-6 4 4 8-9M15 6h6v6" />,
    "trend-down": <path d="m3 7 6 6 4-4 8 9M15 18h6v-6" />,
    wallet: (
      <>
        <path d="M4 6.5h14a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h13" />
        <path d="M16 12h4M16.5 12a.5.5 0 1 0 0 .01" />
      </>
    ),
    "calendar-check": (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 14l2 2 4-4" />
      </>
    ),
    "check-circle": (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8 12 2.5 2.5 5.5-5.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    wrench: (
      <>
        <path d="M14.5 6.5a4.5 4.5 0 0 0-5.8 5.8l-5.2 5.2a1.8 1.8 0 0 0 2.5 2.5l5.2-5.2a4.5 4.5 0 0 0 5.8-5.8L14 12l-2-2z" />
      </>
    ),
    ban: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m6 6 12 12" />
      </>
    ),
    "car-front": (
      <>
        <path d="m5 17 1-6 2-4h8l2 4 1 6v2h-2v-2H7v2H5zM6 11h12M8 14h.01M16 14h.01" />
      </>
    ),
    "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" />
      </>
    ),
    file: (
      <>
        <path d="M6 3.5h8l4 4v13H6z" />
        <path d="M14 3.5v4h4M9 12h6M9 15h6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.5 15.5 5 5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    edit: (
      <>
        <path d="m14 5 5 5M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2z" />
      </>
    ),
    trash: (
      <>
        <path d="M4.5 7h15M9 7V4.5h6V7M7 7l.8 13h8.4L17 7M10 10v7M14 10v7" />
      </>
    ),
    "user-check": (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.25A4.75 4.75 0 0 1 8.25 13h1.5a4.75 4.75 0 0 1 3.8 1.9M15 17l2 2 4-4" />
      </>
    ),
    "user-x": (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.25A4.75 4.75 0 0 1 8.25 13h1.5a4.75 4.75 0 0 1 2.5.7M15 15l5 5M20 15l-5 5" />
      </>
    ),
    "chevron-up": <path d="m6 15 6-6 6 6" />,
    "x-circle": (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m9 9 6 6m0-6-6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 19 6v5c0 4.5-2.8 7.7-7 10-4.2-2.3-7-5.5-7-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    crown: <path d="m3.5 8 4.5 4 4-6 4 6 4.5-4-2 11h-13zM5 21h14" />,
    briefcase: (
      <>
        <rect x="3.5" y="7" width="17" height="13" rx="2" />
        <path d="M8 7V4h8v3M3.5 12h17M10 12v2h4v-2" />
      </>
    ),
    "user-round": (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    phone: (
      <>
        <path d="M7 3.5h3l1.5 4-2 1.5a14 14 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 5.7 2 2 0 0 1 7 3.5z" />
      </>
    ),
    loader: (
      <>
        <path d="M20 12a8 8 0 1 1-2.3-5.7" />
        <path d="M20 4v5h-5" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3.5 9 16H3z" />
        <path d="M12 9v4.5M12 17h.01" />
      </>
    ),
    "alert-triangle": (
      <>
        <path d="m12 3.5 9 16H3z" />
        <path d="M12 9v4.5M12 17h.01" />
      </>
    ),
    save: (
      <>
        <path d="M4 4h13l3 3v13H4z" />
        <path d="M8 4v6h8V4M8 20v-6h8v6" />
      </>
    ),
    building: (
      <>
        <path d="M4 20V5l8-2 8 2v15M2.5 20h19" />
        <path d="M8 7h1M15 7h1M8 11h1M15 11h1M10 20v-4h4v4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 6.6L20 12l-6.6 1.4L12 20l-1.4-6.6L4 12l6.6-2.4z" />
        <path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6z" />
      </>
    ),
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 19h16" />,
    spreadsheet: (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
        <path d="M4 9h16M4 14.5h16M9.5 9v11.5M15 9v11.5" />
      </>
    ),
    "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
    "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
    gauge: (
      <>
        <path d="M4.5 18a9 9 0 1 1 15 0" />
        <path d="m12 13 4-4M7.5 18h9" />
        <circle cx="12" cy="13" r="1" />
      </>
    ),
    fuel: (
      <>
        <path d="M5 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M4 20h12M7.5 6.5h5v5h-5z" />
        <path d="M15 8h1.5l2 2.5V17a1.5 1.5 0 0 0 3 0v-4" />
      </>
    ),
    "door-open": (
      <>
        <path d="M5 20V4.5a1.5 1.5 0 0 1 1.2-1.47l10-2A1.5 1.5 0 0 1 18 2.5V20" />
        <path d="M3 20h18M14 11h.01" />
      </>
    ),
    snowflake: (
      <>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 3 3-3M9 19l3-3 3 3M5 11l4-1-1-4M19 13l-4 1 1 4M5 13l4 1-1 4M19 11l-4-1 1-4" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    send: (
      <>
        <path d="m21 3-7.5 18-3.5-7-7-3.5z" />
        <path d="M21 3 10 14" />
      </>
    ),
    message: (
      <>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.2-.6L4 20l1.5-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z" />
        <path d="M8 11.5h8M8 14.5h5" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    server: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
      </>
    ),
    sparkles: (
      <>
        <path d="m10 3 1.5 5.5L17 10l-5.5 1.5L10 17l-1.5-5.5L3 10l5.5-1.5z" />
        <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    "clipboard-check": (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1M8 12l2.5 2.5L16 9" />
      </>
    ),
    "credit-card": (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    "plus-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    "map-pin": (
      <>
        <path d="M19 10.2c0 5-7 10.3-7 10.3S5 15.2 5 10.2a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    "help-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.4-1.8 3M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...common}
      {...props}
    >
      {glyphs[name]}
    </svg>
  );
}
