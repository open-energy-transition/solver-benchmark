import {
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
  SolverStatusType,
  SolverType,
} from "@/types/benchmark";
import { calculateSgm } from "./calculations";
import { yearSort } from "./chart";

/**
 * Builds solver yearly metrics from benchmark results
 * @param benchmarkResults - The benchmark results to process
 * @param years - The list of years to include
 * @param solvers - The list of solvers to include
 * @returns The processed solver yearly metrics
 */
export const buildSolverYearlyMetrics = (
  benchmarkResults: {
    solver: string;
    solverVersion: string;
    solverReleaseYear: number;
    runtime: number;
    memoryUsage: number;
    status: string;
  }[],
  years: number[],
  solvers: string[],
): ISolverYearlyMetrics[] => {
  // Initialize metrics structure
  const initialMetrics: ISolverYearlyMetrics[] = solvers.map((solver) => {
    return {
      solver,
      data: years.map((year) => ({
        year,
        benchmarkResults: [],
        sgm: {
          runtime: null,
          memoryUsage: null,
        },
        numSolvedBenchmark: 0,
        version:
          benchmarkResults.find(
            (result) =>
              result.solver === solver && result.solverReleaseYear === year,
          )?.solverVersion ?? "-",
      })),
    };
  });

  // Populate with benchmark results
  benchmarkResults.forEach((result) => {
    const resultGroupedBySolver = initialMetrics.find(
      (resultGroupedBySolver) => resultGroupedBySolver.solver === result.solver,
    );
    resultGroupedBySolver?.data
      .find((d) => d.year === result.solverReleaseYear)
      ?.benchmarkResults.push({
        runtime: result.runtime,
        memoryUsage: result.memoryUsage,
        status: result.status as SolverStatusType,
      });
  });

  // Process SGM and other statistics
  initialMetrics.forEach((solverYearlyMetric) => {
    solverYearlyMetric.data.forEach((d) => {
      d.sgm.runtime = calculateSgm(
        d.benchmarkResults.map((res) => res.runtime),
      );
      d.sgm.memoryUsage = calculateSgm(
        d.benchmarkResults.map((res) => res.memoryUsage),
      );
      d.numSolvedBenchmark = d.benchmarkResults.filter(
        (res) => res.status === "ok",
      ).length;
    });
  });

  return initialMetrics;
};

/**
 * Processes metrics
 * @param metrics - The metrics to process
 * @returns The processed metrics with 2024/2025 handling
 */
export const processCombinedYearMetrics = (
  metrics: ISolverYearlyMetrics[],
): ISolverYearlyMetrics[] => {
  return metrics.map((solverYearlyMetric) => {
    const maxYear = Math.max(...solverYearlyMetric.data.map((d) => d.year));

    let solverMetric = solverYearlyMetric.data.filter((d) => d.year <= 2024);
    if (maxYear > 2024) {
      const maxYearData = solverYearlyMetric.data.find(
        (d) => d.year === maxYear,
      );
      // Replace 2024 data with max year data
      if (maxYearData?.benchmarkResults.length) {
        solverMetric = solverMetric.filter((d) => d.year !== 2024);
        solverMetric.push(maxYearData);
      }
    }
    // Change year 2024 to 2025 to indicate combined year
    solverMetric.forEach((d) => {
      if (d.year === 2024) {
        d.year = 2025;
      }
    });
    return { ...solverYearlyMetric, data: solverMetric };
  });
};

/**
 * Gets normalized data for a specific metric
 * @param solverYearlyMetrics - The metrics to process
 * @param key - The key to normalize (runtime or memoryUsage)
 * @param minValue - The minimum value for normalization
 * @returns Normalized chart data
 */
export const getNormalizedData = (
  solverYearlyMetrics: ISolverYearlyMetrics[],
  key: "runtime" | "memoryUsage",
  minValue: number,
): ISolverYearlyChartData[] => {
  const normalizedData: ISolverYearlyChartData[] = [];
  solverYearlyMetrics.forEach((solverYearlyMetric) => {
    solverYearlyMetric.data.forEach((solverData) => {
      const value = solverData.sgm[key];
      if (value !== null && value !== undefined && !isNaN(value)) {
        normalizedData.push({
          solver: solverYearlyMetric.solver as SolverType,
          year: solverData.year,
          value: value / minValue,
          version: solverData.version,
        });
      }
    });
  });
  return normalizedData;
};

/**
 * Gets the number of solved benchmarks data
 * @param solverYearlyMetrics - The metrics to process
 * @returns Chart data with solved benchmark counts
 */
export const getNumSolvedBenchMark = (
  solverYearlyMetrics: ISolverYearlyMetrics[],
): ISolverYearlyChartData[] => {
  const numSolvedBenchMark: ISolverYearlyChartData[] = [];
  solverYearlyMetrics.forEach((solverYearlyMetric) => {
    solverYearlyMetric.data.forEach((solverData) => {
      if (solverData.numSolvedBenchmark > 0) {
        numSolvedBenchMark.push({
          solver: solverYearlyMetric.solver as SolverType,
          year: solverData.year,
          value: solverData.numSolvedBenchmark,
          version: solverData.version,
        });
      }
    });
  });
  return numSolvedBenchMark;
};

/**
 * Generates chart data with 2024-2025 combined data
 * @param solverYearlyMetrics - The metrics to process
 * @returns Chart data for runtime, memory usage, and solved benchmarks
 */
export const generateChartData = (
  solverYearlyMetrics: ISolverYearlyMetrics[],
) => {
  const minRuntime = Math.min(
    ...(solverYearlyMetrics
      .map((item) => item.data.map((d) => d.sgm.runtime))
      .flat()
      .filter(Number) as number[]),
  );

  const minMemoryUsage = Math.min(
    ...(solverYearlyMetrics
      .map((item) => item.data.map((d) => d.sgm.memoryUsage))
      .flat()
      .filter(Number) as number[]),
  );

  return {
    runtime: getNormalizedData(solverYearlyMetrics, "runtime", minRuntime)
      .map((d) => ({
        ...d,
        year: d.year,
      }))
      .sort(yearSort),
    memoryUsage: getNormalizedData(
      solverYearlyMetrics,
      "memoryUsage",
      minMemoryUsage,
    )
      .map((d) => ({
        ...d,
        year: d.year,
      }))
      .sort(yearSort),
    numSolvedBenchMark: getNumSolvedBenchMark(solverYearlyMetrics)
      .map((d) => ({
        ...d,
        year: d.year,
      }))
      .sort(yearSort),
  };
};
