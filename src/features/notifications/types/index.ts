export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type NotificationType =
  | "ANNOUNCEMENT"
  | "CALENDAR_EVENT"
  | "HOLIDAY"
  | "ATTENDANCE"
  | "INVITE"
  | "EXAM"
  | "FEE";

export interface NotificationItem {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  route: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}