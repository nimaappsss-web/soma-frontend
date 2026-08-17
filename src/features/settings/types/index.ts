export interface SettingOption {
  label: string;
  value: string;
}

export interface ManualBankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

export interface SchoolSetting {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "pattern" | "multi-select" | "array" | "bank";
  value: string | string[] | ManualBankDetails | null;
  options?: SettingOption[];
  category: string;
  editable: boolean;
  editableReason: string | null;
}

export interface SchoolSettingsResponse {
  settings: SchoolSetting[];
}
