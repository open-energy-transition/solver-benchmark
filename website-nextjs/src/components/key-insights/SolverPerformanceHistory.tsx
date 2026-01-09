import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";

// local
import { IFilterState, IResultState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SolverEvolutionSection from "../admin/performance-history/SolverEvolutionSection";
import NormalizedSGMRuntime from "../admin/performance-history/NormalizedSGMRuntime";
import {
  buildSolverYearlyMetrics,
  generateChartData,
  getNumSolvedBenchMark,
} from "@/utils/performanceHistory";

const HASH = "how-are-solvers-evolving-over-time";

const SolverPerformanceHistory = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkResults;
    },
  );

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const selectedFilters = useSelector(
    (state: { filters: IFilterState }) => state.filters,
  );

  const sgmMode = useSelector((state: { filters: IFilterState }) => {
    return state.filters.sgmMode;
  });
  const xFactor = useSelector((state: { filters: IFilterState }) => {
    return state.filters.xFactor;
  });

  // Get common benchmark instances across all solver versions
  const benchmarksByInstance = rawBenchmarkResults.reduce(
    (acc, result) => {
      const key = `${result.benchmark}-${result.size}`;
      acc[key] = acc[key] || new Set();
      acc[key].add(`${result.solver}-${result.solverVersion}`);
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  const availableSolverVersions = new Set(
    rawBenchmarkResults.map(
      (result) => `${result.solver}-${result.solverVersion}`,
    ),
  );

  const commonInstances: string[] = Object.entries(benchmarksByInstance)
    .filter(([, results]) => {
      return results.size === availableSolverVersions.size;
    })
    .map(([name]) => name);

  // Filter benchmark results to only include common instances
  const filteredBenchmarkResults = rawBenchmarkResults.filter((result) =>
    commonInstances.includes(`${result.benchmark}-${result.size}`),
  );

  const benchmarkResults = useMemo(() => {
    switch (sgmMode) {
      case SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS:
        const benchmarkSuccessMap = new Map<string, number>();
        const yearsWithSolver = new Map<number, Set<string>>();

        // Count successful solves for each benchmark
        filteredBenchmarkResults.forEach((result) => {
          const year = result.solverReleaseYear;
          yearsWithSolver.set(
            year,
            (yearsWithSolver.get(year) || new Set()).add(result.solver),
          );
          if (result.status === "ok") {
            const key = `${result.benchmark}-${result.size}-${result.solverReleaseYear}`;
            benchmarkSuccessMap.set(
              key,
              (benchmarkSuccessMap.get(key) || 0) + 1,
            );
          }
        });

        // Filter results where all solvers succeeded
        return filteredBenchmarkResults.filter((result) => {
          const key = `${result.benchmark}-${result.size}-${result.solverReleaseYear}`;
          return (
            result.status === "ok" &&
            benchmarkSuccessMap.get(key) ===
              yearsWithSolver.get(result.solverReleaseYear)?.size
          );
        });

      case SgmMode.PENALIZING_TO_BY_FACTOR:
        return filteredBenchmarkResults.map((result) => ({
          ...result,
          runtime:
            result.status !== "ok" ? result.runtime * xFactor : result.runtime,
          memoryUsage:
            result.status !== "ok"
              ? result.memoryUsage * xFactor
              : result.memoryUsage,
        }));
      default:
        return filteredBenchmarkResults;
    }
  }, [
    sgmMode,
    xFactor,
    availableSolvers,
    selectedFilters,
    filteredBenchmarkResults,
  ]);

  const years = [
    ...new Set(benchmarkResults.map((result) => result.solverReleaseYear)),
  ];
  const solvers = [...new Set(benchmarkResults.map((result) => result.solver))];

  const solverYearlyMetrics = useMemo(() => {
    // Build initial metrics
    const initialMetrics = buildSolverYearlyMetrics(
      benchmarkResults,
      years,
      solvers,
    );
    return initialMetrics;
  }, [benchmarkResults, years, solvers]);

  const chartData = useMemo(() => {
    // Generate chart data from solver metrics
    return generateChartData(solverYearlyMetrics);
  }, [solverYearlyMetrics]);

  // Build all solver yearly metrics without combining 2024/2025
  const allSolverYearlyMetrics = useMemo(() => {
    return buildSolverYearlyMetrics(benchmarkResults, years, solvers);
  }, [benchmarkResults, years, solvers]);

  // Get number of solved benchmarks
  const numSolvedBenchMark = useMemo(() => {
    return getNumSolvedBenchMark(allSolverYearlyMetrics).sort(
      (a, b) => a.year - b.year,
    );
  }, [allSolverYearlyMetrics]);

  return (
    <div ref={sectionRef} id={HASH} className="scroll-mt-[9rem]">
      <h4>How are solvers evolving over time?</h4>
      <p>
        This plot shows the average runtime of each year’s final-released solver
        version, relative to the best solver ever measured, over all S and M
        size benchmarks in our set. This shows the performance evolution of
        solvers, relative to one another.
      </p>
      <NormalizedSGMRuntime chartData={chartData.runtime} />
      <p>
        The plot below shows the performance evolution of the selected solver
        individually, relative to the first version of that solver that we have
        benchmarked. The bars denote the number of unsolved problems in our
        benchmark set, so the fewer the better. The red line shows the reduction
        in average runtime over the set relative to the first version (i.e.
        speedup factor).
      </p>
      <div>
        <SolverEvolutionSection
          title=""
          description=""
          solverYearlyMetrics={allSolverYearlyMetrics}
          numSolvedBenchMark={numSolvedBenchMark}
          totalBenchmarks={commonInstances.length}
        />
        <p>
          More detailed statistics regarding performance evolution of solvers
          can be seen in our{" "}
          <Link className="font-bold" href={PATH_DASHBOARD.performanceHistory}>
            Performance History
          </Link>{" "}
          dashboard, which also allows calculating performance statistics on any
          subset of benchmarks that are of interest.
        </p>
      </div>
    </div>
  );
};

export default SolverPerformanceHistory;
