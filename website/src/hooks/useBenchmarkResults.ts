import { useMemo } from "react";
import { useSelector } from "react-redux";
import { IResultState } from "@/types/state";
import { BenchmarkResult } from "@/types/benchmark";
import { HIPO_SOLVERS } from "@/utils/solvers";

interface UseBenchmarkResultsOptions {
  excludeHipo?: boolean;
  useRawResults?: boolean;
}

/**
 * Custom hook to get benchmark results from Redux state with optional HIPO filtering
 * @param options - Configuration options
 * @param options.excludeHipo - Whether to filter out HIPO solvers (default: false)
 * @param options.useRawResults - Use rawBenchmarkResults instead of benchmarkLatestResults (default: false)
 * @returns Filtered benchmark results array
 */
export function useBenchmarkResults(
  options: UseBenchmarkResultsOptions = {},
): BenchmarkResult[] {
  const { excludeHipo = false, useRawResults = false } = options;

  const results = useSelector((state: { results: IResultState }) =>
    useRawResults
      ? state.results.rawBenchmarkResults
      : state.results.benchmarkLatestResults,
  );

  return useMemo(() => {
    if (!excludeHipo) return results;
    return results.filter((result) => !HIPO_SOLVERS.includes(result.solver));
  }, [results, excludeHipo]);
}
