export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type ReportType = "REPORT_CARD" | "CLASS_SUMMARY" | "ATTENDANCE" | "FULL";
export type ReportStatus = "PENDING" | "GENERATED" | "FAILED";

export interface ReportTemplate {
  type: ReportType;
  description: string;
}

export interface AvailableReportsResponse {
  templates: ReportTemplate[];
}

export interface GenerateReportPayload {
  classId: string;
  term: string;
  session: string;
  type: ReportType;
  studentIds?: string[];
  includePosition?: boolean;
  includeAttendance?: boolean;
}

export interface GenerateReportResponse {
  report: {
    id: string;
    status: ReportStatus;
    downloadUrl: string | null;
    generatedAt: string;
  };
}

export interface GeneratedReport {
  id: string;
  classId: string;
  term: string;
  session: string;
  type: ReportType;
  status: ReportStatus;
  downloadUrl: string | null;
  createdAt: string;
}

export interface ReportListResponse {
  reports: GeneratedReport[];
}

export interface ReportHistoryResponse {
  data: GeneratedReport[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReportDownloadResponse {
  reportId: string;
  downloadUrl: string;
  generatedAt: string;
}
