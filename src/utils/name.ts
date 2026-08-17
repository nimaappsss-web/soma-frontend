const HONORIFICS = /^(mr\.?|mrs\.?|miss|ms\.?|dr\.?|prof\.?|rev\.?|sir|madam|pastor)\s+/i;

export const givenName = (name?: string | null): string => {
  if (!name) return "";
  return name.replace(HONORIFICS, "").split(" ")[0] ?? "";
};
