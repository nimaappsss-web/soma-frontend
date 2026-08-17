import { useSchoolSettings } from "../../settings/api";

export const usePaystackEnabled = () => {
  const { data: settings } = useSchoolSettings();
  const enabled = (settings ?? []).some(
    (s) => s.key.toLowerCase().includes("paystack") && String(s.value).toLowerCase() === "true",
  );
  return enabled;
};