export type NotificationType =
  | "RESERVATION"
  | "PAYMENT"
  | "CONTRACT"
  | "MAINTENANCE"
  | "SYSTEM";

export interface Notification {
  id: string;
  type: NotificationType;
  titre: string;
  message: string;
  lien: string;
  est_lue: boolean;
  lue_le: string | null;
  cree_le: string;
}

export interface NotificationListResponse {
  results: Notification[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface NotificationUnreadCountResponse {
  count: number;
}

