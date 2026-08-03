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
  getNumSolvedProblems,
} from "@/utils/performanceHistory";
import { HIPO_SOLVERS } from "@/utils/solvers";

const HASH = "how-are-solvers-evolving-over-time";

const SolverPerformanceHistory = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  const allBenchmarkResults = useSelector(
    (state: { results: IResultState }) => state.results.benchmarkResults,
  );
  const rawBenchmarkResults = useMemo(
    () =>
      allBenchmarkResults.filter(
        (result) => !HIPO_SOLVERS.includes(result.solver),
      ),
    [allBenchmarkResults],
  );

  const allAvailableSolvers = useSelector(
    (state: { results: IResultState }) => state.results.availableSolvers,
  );
  const availableSolvers = useMemo(
    () =>
      allAvailableSolvers.filter((solver) => !HIPO_SOLVERS.includes(solver)),
    [allAvailableSolvers],
  );
  const selectedFilters = useSelector(
    (state: { filters: IFilterState }) => state.filters,
  );

  const sgmMode = useSelector((state: { filters: IFilterState }) => {
    return state.filters.sgmMode;
  });
  const xFactor = useSelector((state: { filters: IFilterState }) => {
    return state.filters.xFactor;
  });

  // Get problems common across all solver versions
  const solverVersionsByProblem = rawBenchmarkResults.reduce(
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

  const commonProblems: string[] = Object.entries(solverVersionsByProblem)
    .filter(([, results]) => {
      return results.size === availableSolverVersions.size;
    })
    .map(([name]) => name);

  // Filter results to only include common problems
  const filteredBenchmarkResults = rawBenchmarkResults.filter((result) =>
    commonProblems.includes(`${result.benchmark}-${result.size}`),
  );

  const benchmarkResults = useMemo(() => {
    switch (sgmMode) {
      case SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS:
        const problemSuccessMap = new Map<string, number>();
        const yearsWithSolver = new Map<number, Set<string>>();

        // Count successful solves for each problem
        filteredBenchmarkResults.forEach((result) => {
          const year = result.solverReleaseYear;
          yearsWithSolver.set(
            year,
            (yearsWithSolver.get(year) || new Set()).add(result.solver),
          );
          if (result.status === "ok") {
            const key = `${result.benchmark}-${result.size}-${result.solverReleaseYear}`;
            problemSuccessMap.set(key, (problemSuccessMap.get(key) || 0) + 1);
          }
        });

        // Filter results where all solvers succeeded
        return filteredBenchmarkResults.filter((result) => {
          const key = `${result.benchmark}-${result.size}-${result.solverReleaseYear}`;
          return (
            result.status === "ok" &&
            problemSuccessMap.get(key) ===
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

  // Get number of solved problems
  const numSolvedProblems = useMemo(() => {
    return getNumSolvedProblems(allSolverYearlyMetrics).sort(
      (a, b) => a.year - b.year,
    );
  }, [allSolverYearlyMetrics]);

  return (
    <div ref={sectionRef} id={HASH} className="scroll-mt-[9rem]">
      <div className="h4">How are solvers evolving over time?</div>
      <p>
        This plot shows the average runtime of each year’s final-released solver
        version, relative to the best solver ever measured, over all S and M
        size problems in our set. This shows the performance evolution of
        solvers, relative to one another.
      </p>
      <NormalizedSGMRuntime
        chartData={chartData.runtime.filter((s) => s.solver !== "glpk")}
      />
      <p>
        The plot below shows the performance evolution of the selected solver
        individually, relative to the first version of that solver that we have
        benchmarked. The bars denote the number of unsolved problems in our
        benchmark problem set, so the fewer the better. The red line shows the
        reduction in average runtime over the set relative to the first version
        (i.e. speedup factor).
      </p>
      <div>
        <SolverEvolutionSection
          title=""
          description=""
          solverYearlyMetrics={allSolverYearlyMetrics}
          numSolvedProblems={numSolvedProblems}
          totalProblems={commonProblems.length}
        />
        <p>
          More detailed statistics regarding performance evolution of solvers
          can be seen in our{" "}
          <Link
            className="font-bold"
            href={PATH_DASHBOARD.performanceHistory}
            aria-label="Navigate to solver performance history dashboard"
          >
            Performance History
          </Link>{" "}
          dashboard, which also allows calculating performance statistics on any
          subset of problems that are of interest.
        </p>
      </div>
    </div>
  );
};

export default SolverPerformanceHistory;
