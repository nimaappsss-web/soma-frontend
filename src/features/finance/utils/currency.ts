export const formatNaira = (amount: number | null | undefined): string => {
  const value = amount ?? 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatMoneyInput = (value: number | null | undefined): string => {
  const n = Math.floor(value ?? 0);
  if (n <= 0) return "";
  return `₦${n.toLocaleString("en-NG")}`;
};

export const parseMoneyInput = (str: string): number => {
  const digits = str.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};
