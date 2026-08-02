export type ReportTemplate = "classic" | "modern" | "compact";
export type ReportTheme = "slate" | "emerald" | "indigo" | "amber";

export interface ReportSettings {
  template: ReportTemplate;
  theme: ReportTheme;
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string; error?: string };
    status?: number;
  };
  message?: string;
};
