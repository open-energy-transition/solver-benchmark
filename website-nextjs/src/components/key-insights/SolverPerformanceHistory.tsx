import { useSelector } from "react-redux";
import { useMemo } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";

// local

import {
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
  SolverType,
} from "@/types/benchmark";
import { calculateSgm } from "@/utils/calculations";
import { IFilterState, IResultState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SolverEvolutionSection from "../admin/performance-history/SolverEvolutionSection";
import NormalizedSGMRuntime from "../admin/performance-history/NormalizedSGMRuntime";

const SolverPerformanceHistory = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: "#how-are-solvers-evolving-over-time",
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
    const metrics: ISolverYearlyMetrics[] = solvers.map((solver) => {
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

    benchmarkResults.forEach((result) => {
      const resultGroupedBySolver = metrics.find(
        (resultGroupedBySolver) =>
          resultGroupedBySolver.solver === result.solver,
      );
      resultGroupedBySolver?.data
        .find((d) => d.year === result.solverReleaseYear)
        ?.benchmarkResults.push({
          runtime: result.runtime,
          memoryUsage: result.memoryUsage,
          status: result.status,
        });
    });

    metrics.forEach((solverYearlyMetric) => {
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

    metrics.map((solverYearlyMetric) =>
      solverYearlyMetric.data.map((d) => d.benchmarkResults),
    );
    return metrics;
  }, [benchmarkResults]);

  const getNormalizedData = (
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

  const getNumSolvedBenchMark = (): ISolverYearlyChartData[] => {
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

  const chartData = useMemo(() => {
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
      runtime: getNormalizedData(
        solverYearlyMetrics,
        "runtime",
        minRuntime,
      ).sort((a, b) => a.year - b.year),
      memoryUsage: getNormalizedData(
        solverYearlyMetrics,
        "memoryUsage",
        minMemoryUsage,
      ).sort((a, b) => a.year - b.year),
      numSolvedBenchMark: getNumSolvedBenchMark().sort(
        (a, b) => a.year - b.year,
      ),
    };
  }, [solverYearlyMetrics]);

  return (
    <div ref={sectionRef}>
      <h4 id="how-are-solvers-evolving-over-time" className="scroll-mt-[9rem]">
        How are solvers evolving over time?
      </h4>
      <p>
        This plot shows the average runtime of each year’s final-released solver
        version, relative to that year’s fastest solver, over all S and M size
        benchmarks in our set. This shows the performance evolution of solvers,
        relative to one another.
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
          solverYearlyMetrics={solverYearlyMetrics}
          numSolvedBenchMark={chartData.numSolvedBenchMark}
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
