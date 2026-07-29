export const financeKeys = {
  all: ["finance"] as const,
  feeStructures: () => [...financeKeys.all, "fee-structures"] as const,
  invoices: () => [...financeKeys.all, "invoices"] as const,
  payments: () => [...financeKeys.all, "payments"] as const,
  summary: () => [...financeKeys.all, "summary"] as const,
};
