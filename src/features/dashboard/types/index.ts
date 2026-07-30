export interface DashboardStats {
  students: { total: number; active: number; male: number; female: number };
  teachers: { total: number; active: number; pendingInvites: number };
  classes: { total: number };
  parents: { total: number; active: number; pending: number };
  subjects: { total: number };
  attendance: { today: { present: number; absent: number; percentage: number; dayOfWeek: string }; isHoliday: boolean };
  finance: { collectedThisTerm: number; outstanding: number; paymentRate: number };
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};
