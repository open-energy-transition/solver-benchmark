import { useSelector } from "react-redux";
import { useMemo } from "react";

// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
  SolverVersions,
} from "@/components/shared";
import NumberBenchmarksSolved from "@/components/admin/performance-history/NumberBenchmarksSolved";
import NormalizedSection from "@/components/admin/performance-history/NormalizedSection";
import SolverEvolutionSection from "@/components/admin/performance-history/SolverEvolutionSection";

import {
  buildSolverYearlyMetrics,
  generateChartData,
  getNumSolvedBenchMark,
} from "@/utils/performanceHistory";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IFilterState, IResultState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";
import { HIPO_SOLVERS } from "@/utils/solvers";

const PagePerformanceHistory = () => {
  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkResults.filter(
        (result) => !HIPO_SOLVERS.includes(result.solver),
      );
    },
  );

  const allSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const availableSolvers = useMemo(
    () => allSolvers.filter((solver) => !HIPO_SOLVERS.includes(solver)),
    [allSolvers],
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
    <>
      <Head>
        <title>Performance History | Open Energy Benchmark</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div className="max-w-8xl mx-auto">
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root} aria-label="Home">
                      <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-70">
                      Performance History
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h5>Performance History</h5>
              <p className="mt-4 max-w-screen-lg">
                This page tracks the performance of different solvers over time.
                This can be used to see which solvers are improving, and on what
                kinds of benchmarks. Once again, you can filter the benchmark
                set to your problems of interest and the graphs will
                automatically re-generate to show you the performance history on
                your chosen subset.
              </p>
              <SolverVersions />
            </div>
          }
        >
          {/* Content */}
          <NumberBenchmarksSolved
            numSolvedBenchMark={chartData.numSolvedBenchMark}
            totalBenchmarks={commonInstances.length}
          />
          <NormalizedSection chartData={chartData} />
          <SolverEvolutionSection
            solverYearlyMetrics={allSolverYearlyMetrics}
            numSolvedBenchMark={numSolvedBenchMark}
            totalBenchmarks={commonInstances.length}
          />
          <div className="pt-1.5 pb-3 px-5">
            <h6>Caveats</h6>
            <p className="text-navy block items-center mt-2">
              <span>
                {" "}
                Some solvers returned errors when running on some benchmark
                instances. For more details, please see the{" "}
                <a href="https://github.com/open-energy-transition/solver-benchmark/issues/193">
                  tracking issue
                </a>
                .
              </span>
            </p>
          </div>
        </ContentWrapper>
      </div>
      <Footer />
    </>
  );
};

export default PagePerformanceHistory;
