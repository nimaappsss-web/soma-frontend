import { useMemo } from "react";

import { useAcademicTerms } from "./useAcademicTerms";
import { resolveActiveTerm } from "../utils/term";

export const useActiveTerm = () => {
  const { data, isLoading, error } = useAcademicTerms();
  const terms = data?.terms ?? [];

  const activeTerm = useMemo(() => resolveActiveTerm(terms), [terms]);

  return { activeTerm, terms, isLoading, error };
};
