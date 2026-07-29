export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type AnnouncementAudience = "ALL_STAFF" | "TEACHING_ONLY" | "NON_TEACHING_ONLY" | "ALL_PARENTS" | "ALL_USERS";

export type AnnouncementPriority = "NORMAL" | "IMPORTANT" | "URGENT";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  message?: string;
  audience?: AnnouncementAudience;
  priority?: AnnouncementPriority;
}
