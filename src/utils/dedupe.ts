export const normalizeName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "");

export const namesMatch = (a: string, b: string): boolean =>
  normalizeName(a) === normalizeName(b);
