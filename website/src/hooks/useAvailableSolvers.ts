import { useMemo } from "react";
import { useSelector } from "react-redux";
import { IResultState } from "@/types/state";
import { HIPO_SOLVERS } from "@/utils/solvers";

interface UseAvailableSolversOptions {
  excludeHipo?: boolean;
}

/**
 * Custom hook to get available solvers from Redux state with optional HIPO exclusion
 * @param options - Configuration options
 * @param options.excludeHipo - Whether to filter out HIPO solvers (default: false)
 * @returns Array of available solver names
 */
export function useAvailableSolvers(
  options: UseAvailableSolversOptions = {},
): string[] {
  const { excludeHipo = false } = options;

  const allSolvers = useSelector(
    (state: { results: IResultState }) => state.results.availableSolvers,
  );

  return useMemo(() => {
    if (!excludeHipo) return allSolvers;
    return allSolvers.filter((solver) => !HIPO_SOLVERS.includes(solver));
  }, [allSolvers, excludeHipo]);
}
