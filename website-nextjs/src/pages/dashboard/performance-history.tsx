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

import {
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
  SolverType,
} from "@/types/benchmark";
import { calculateSgm } from "@/utils/calculations";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IFilterState, IResultState } from "@/types/state";
import SgmModeSection from "@/components/admin/performance-history/SgmModeSection";
import { SgmMode } from "@/constants/sgm";

const PagePerformanceHistory = () => {
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
    <>
      <Head>
        <title>Performance History</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <ContentWrapper
          header={
            <div className="max-w-8xl mx-auto">
              <AdminHeader>
                <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1 4xl:text-lg">
                  <div className="flex items-center gap-1">
                    <Link href={PATH_DASHBOARD.root}>
                      <HomeIcon className="w-[1.125rem] h-[1.125rem 4xl:size-5" />
                    </Link>
                    <ArrowIcon
                      fill="none"
                      className="size-3 4xl:size-4 stroke-navy"
                    />
                    <p className="self-center font-semibold whitespace-nowrap">
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
          <SgmModeSection />
          <NormalizedSection chartData={chartData} />
          <NumberBenchmarksSolved
            numSolvedBenchMark={chartData.numSolvedBenchMark}
            totalBenchmarks={commonInstances.length}
          />
          <div className="pt-1.5 pb-3 px-5">
            <h6>Caveats</h6>
            <p className="text-navy block items-center mt-2">
              <span>
                {" "}
                Some solvers returned errors when running on some benchmark
                instances. For more details, please see the{" "}
                <a
                  href="https://github.com/open-energy-transition/solver-benchmark/issues/193"
                  className="underline"
                >
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
