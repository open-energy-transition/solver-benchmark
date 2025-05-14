import { useSelector } from "react-redux";
import { useMemo } from "react";

// local
import {
  AdminHeader,
  ContentWrapper,
  Footer,
  Navbar,
} from "@/components/shared";
import NumberBenchmarksSolved from "@/components/admin/performance-history/NumberBenchmarksSolved";
import NormalizedSection from "@/components/admin/performance-history/NormalizedSection";

import {
  BenchmarkResult,
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
  SolverType,
} from "@/types/benchmark";
import { calculateSgm } from "@/utils/calculations";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";

const PagePerformanceHistory = () => {
  const benchmarkResults = useSelector(
    (state: { results: { benchmarkResults: BenchmarkResult[] } }) => {
      return state.results.benchmarkResults;
    },
  );
  const years = [
    ...new Set(benchmarkResults.map((result) => result.solverReleaseYear)),
  ];
  const solvers = [...new Set(benchmarkResults.map((result) => result.solver))];

  const solverYearlyMetrics: ISolverYearlyMetrics[] = solvers.map((solver) => {
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
    const resultGroupedBySolver = solverYearlyMetrics.find(
      (resultGroupedBySolver) => resultGroupedBySolver.solver === result.solver,
    );
    resultGroupedBySolver?.data
      .find((d) => d.year === result.solverReleaseYear)
      ?.benchmarkResults.push({
        runtime: result.runtime,
        memoryUsage: result.memoryUsage,
        status: result.status,
      });
  });

  solverYearlyMetrics.forEach((solverYearlyMetric) => {
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

  solverYearlyMetrics.map((solverYearlyMetric) =>
    solverYearlyMetric.data.map((d) => d.benchmarkResults),
  );

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
                    <span className="self-center font-semibold whitespace-nowrap">
                      Performance History
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <div className="font-lato font-bold text-2xl/1.4">
                Performance History
              </div>
              <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                This page tracks the performance of different solvers over time.
                This can be used to see which solvers are improving, and on what
                kinds of benchmarks. Once again, you can filter the benchmark
                set to your problems of interest and the graphs will
                automatically re-generate to show you the performance history on
                your chosen subset.
              </div>
              <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                We run the latest version of each solver released on conda in
                that year. 2025&apos;s versions were selected if the solver had
                a major or minor release in 2025 as of April 20, 2025. The 2025
                results will be updated with the last version released in 2025
                at the end of this year. Some solver versions are not available
                on coda or have compatibility issues with our benchmarking
                infrastructure, see{" "}
                <a
                  className="underline"
                  href="https://github.com/open-energy-transition/solver-benchmark?tab=readme-ov-file#solver-versions"
                >
                  here
                </a>{" "}
                for more details.
              </div>
            </div>
          }
        >
          {/* Content */}
          <NormalizedSection chartData={chartData} />
          <NumberBenchmarksSolved
            numSolvedBenchMark={chartData.numSolvedBenchMark}
          />
        </ContentWrapper>
      </div>
      <Footer />
    </>
  );
};

export default PagePerformanceHistory;
