export const compactSearch = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, "");