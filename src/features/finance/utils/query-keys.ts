export const financeKeys = {
  all: ["finance"] as const,
  feeStructures: () => [...financeKeys.all, "fee-structures"] as const,
  feeStructure: (id: string) => [...financeKeys.feeStructures(), id] as const,
  invoices: () => [...financeKeys.all, "invoices"] as const,
  invoice: (id: string) => [...financeKeys.invoices(), id] as const,
  payments: () => [...financeKeys.all, "payments"] as const,
  summary: () => [...financeKeys.all, "summary"] as const,
};
