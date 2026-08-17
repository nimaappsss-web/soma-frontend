export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;