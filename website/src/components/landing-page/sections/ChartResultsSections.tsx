import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getHighestVersion } from "@/utils/versions";
import { calculateSgm } from "@/utils/calculations";
import { formatDecimal, roundNumber } from "@/utils/number";
import { IFilterState, IResultState } from "@/types/state";
import { SgmMode } from "@/constants/sgm";
import SgmRuntimeComparison from "@/pages/dashboard/main-result/SgmRuntimeComparison";
import { getLatestBenchmarkResult } from "@/utils/results";
import { getSolverColor } from "@/utils/chart";
import { HIPO_SOLVERS } from "@/utils/solvers";
import SgmRuntimeChart from "./SgmRuntimeChart";

type ColumnType = {
  name: string;
  field: string;
  width: string;
  header?: {
    bgStyle?: string;
    textStyle?: string;
  };
  row?: {
    bgStyle?: string;
    textStyle?: string;
  };
  sort?: boolean;
  headerContent?: (header: string) => React.ReactNode;
  sortFunc?: (a: TableRowType, b: TableRowType) => number;
};

export type TableRowType = {
  rank: number;
  solver: string;
  version: string;
  memory: string;
  solvedBenchmarks: string;
  runtime: string;
  unnormalizedData: {
    runtime: number;
    memoryUsage: number;
  };
};

const ChartResultsSections = ({
  problemClass = "LP",
}: {
  problemClass?: string;
}) => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.metaData;
  });
  const isLP = (benchmarkname: string) => {
    return metaData?.[benchmarkname]?.problemClass === problemClass;
  };

  const benchmarkLatestResultsRaw = useSelector(
    (state: { results: IResultState }) => state.results.benchmarkLatestResults,
  );

  const benchmarkLatestResultsAll = useMemo(
    () =>
      benchmarkLatestResultsRaw.filter(
        (result) =>
          !HIPO_SOLVERS.includes(result.solver) && isLP(result.benchmark),
      ),
    [benchmarkLatestResultsRaw],
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

  const applySgmModeTo = useCallback(
    (results: any[]) => {
      switch (sgmMode) {
        case SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS: {
          const benchmarkSuccessMap = new Map<string, number>();
          results
            .filter((result) => result.status === "ok")
            .forEach((result) => {
              const key = `${result.benchmark}-${result.size}`;
              benchmarkSuccessMap.set(
                key,
                (benchmarkSuccessMap.get(key) || 0) + 1,
              );
            });

          return results.filter((result) => {
            const key = `${result.benchmark}-${result.size}`;
            return (
              result.status === "ok" &&
              benchmarkSuccessMap.get(key) === availableSolvers.length
            );
          });
        }
        case SgmMode.PENALIZING_TO_BY_FACTOR:
          return results.map((result) => ({
            ...result,
            runtime:
              result.status !== "ok"
                ? result.runtime * xFactor
                : result.runtime,
            memoryUsage:
              result.status !== "ok"
                ? result.memoryUsage * xFactor
                : result.memoryUsage,
          }));
        default:
          return results;
      }
    },
    [sgmMode, xFactor, availableSolvers],
  );

  const benchmarkResults = useMemo(() => {
    return applySgmModeTo(benchmarkLatestResultsAll);
  }, [applySgmModeTo, benchmarkLatestResultsAll, selectedFilters]);
  const [tableData, setTableData] = useState<TableRowType[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({ field: "runtime", direction: "asc" });

  const solverList = useMemo(
    () => Array.from(new Set(benchmarkResults.map((result) => result.solver))),
    [benchmarkResults],
  );

  const solverVersions = useMemo(() => {
    const versions: { [key: string]: string[] } = {};
    benchmarkResults.forEach((benchmarkResult) => {
      if (!versions[benchmarkResult.solver]) {
        versions[benchmarkResult.solver] = [];
      }

      if (
        !versions[benchmarkResult.solver].includes(
          benchmarkResult.solverVersion,
        )
      ) {
        versions[benchmarkResult.solver].push(benchmarkResult.solverVersion);
      }
    });
    return versions;
  }, [benchmarkResults]);

  const getRelevantResults = useCallback(
    (solver: string, field: "memoryUsage" | "runtime") =>
      benchmarkResults
        .filter(
          (result) =>
            result.solverVersion ===
              getHighestVersion(solverVersions[solver]) &&
            result.solver === solver,
        )
        .map((result) => {
          return result[field];
        }),
    [benchmarkResults, solverVersions],
  );

  const calculateSgmBySolver = useCallback(
    (solver: string, field: "memoryUsage" | "runtime" = "memoryUsage") => {
      const minSgm = Math.min(
        ...solverList.map((solver) =>
          calculateSgm(getRelevantResults(solver, field)),
        ),
      );
      return calculateSgm(getRelevantResults(solver, field)) / minSgm;
    },
    [getRelevantResults, solverList],
  );

  const getNumberSolvedBenchmark = useCallback(
    (solver: string) => {
      return benchmarkResults.filter(
        (result) => result.status === "ok" && result.solver === solver,
      ).length;
    },
    [benchmarkResults, solverVersions],
  );

  const getSolverRanks = () => {
    const combinedRankList = solverList.map((solver) => ({
      solver: solver,
      runtime: calculateSgmBySolver(solver, "runtime"),
      memoryUsage: calculateSgmBySolver(solver, "memoryUsage"),
      score: 0,
    }));

    combinedRankList.forEach((solver) => {
      solver.score = solver.runtime;
    });
    return combinedRankList.sort((a, b) => a.score - b.score);
  };

  const uniqueBenchmarkCount = new Set(
    benchmarkResults.map((result) => `${result.benchmark}-${result.size}`),
  ).size;

  const getSolvedBenchmarksLabel = (
    solver: string,
    uniqueBenchmarkCount: number,
  ) => {
    const numberSolvedBenchmark = getNumberSolvedBenchmark(solver);
    const percentage = (numberSolvedBenchmark * 100) / uniqueBenchmarkCount;
    return `${roundNumber(
      percentage,
      0,
    )} % (${numberSolvedBenchmark} / ${uniqueBenchmarkCount})`;
  };

  useEffect(() => {
    // Find best values
    const minRuntime = Math.min(
      ...solverList.map((solver) => calculateSgmBySolver(solver, "runtime")),
    );
    const minMemory = Math.min(
      ...solverList.map((solver) =>
        calculateSgmBySolver(solver, "memoryUsage"),
      ),
    );
    const maxSolved = Math.max(
      ...solverList.map((solver) => getNumberSolvedBenchmark(solver)),
    );

    setTableData(
      solverList.map((solverData) => {
        const runtimeSgm = calculateSgmBySolver(solverData, "runtime");
        const memorySgm = calculateSgmBySolver(solverData, "memoryUsage");
        const solvedCount = getNumberSolvedBenchmark(solverData);

        return {
          rank:
            getSolverRanks().findIndex(
              (solver) => solver.solver === solverData,
            ) + 1,
          solver: solverData,
          unnormalizedData: {
            runtime: calculateSgm(getRelevantResults(solverData, "runtime")),
            memoryUsage: calculateSgm(
              getRelevantResults(solverData, "memoryUsage"),
            ),
          },
          version: getHighestVersion(solverVersions[solverData]),
          memory: `${memorySgm === minMemory ? "<b>" : ""}${formatDecimal({
            value: memorySgm,
          })} (${formatDecimal({
            value: calculateSgm(getRelevantResults(solverData, "memoryUsage")),
          })})${memorySgm === minMemory ? "</b>" : ""}`,
          solvedBenchmarks: `${
            solvedCount === maxSolved ? "<b>" : ""
          }${getSolvedBenchmarksLabel(solverData, uniqueBenchmarkCount)}${
            solvedCount === maxSolved ? "</b>" : ""
          }`,
          runtime: `${runtimeSgm === minRuntime ? "<b>" : ""}${formatDecimal({
            value: runtimeSgm,
          })} (${formatDecimal({
            value: calculateSgm(getRelevantResults(solverData, "runtime")),
          })})${runtimeSgm === minRuntime ? "</b>" : ""}`,
        };
      }),
    );
  }, [benchmarkResults, calculateSgmBySolver, getNumberSolvedBenchmark]);

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.rawBenchmarkResults;
    },
  );

  // Build grouped chart data by timeout
  const uniqueTimeouts = useMemo(() => {
    return Array.from(
      new Set(benchmarkLatestResultsAll.map((r) => r.timeout)),
    ).sort((a, b) => Number(a) - Number(b));
  }, [benchmarkLatestResultsAll]);

  const groupedChartData = useMemo(() => {
    const data: any[] = [];
    uniqueTimeouts.forEach((t) => {
      const resultsForT = applySgmModeTo(
        benchmarkLatestResultsAll.filter((r) => r.timeout === t),
      );

      const entry: any = {
        timeout: t,
      };

      solverList.forEach((solver) => {
        const highestVersion = getHighestVersion(solverVersions[solver]);
        const values = resultsForT
          .filter(
            (r) => r.solver === solver && r.solverVersion === highestVersion,
          )
          .map((r) => r.runtime);
        const sgm = values && values.length ? calculateSgm(values) : undefined;
        if (sgm !== undefined && Number.isFinite(sgm)) {
          entry[solver] = sgm;
        }
      });

      data.push(entry);
    });
    return data;
  }, [
    uniqueTimeouts,
    solverList,
    solverVersions,
    benchmarkLatestResultsAll,
    applySgmModeTo,
  ]);
  return (
    <div>
      <SgmRuntimeChart
        title={
          problemClass === "LP"
            ? "Linear programming problems "
            : "Mixed-integer linear programming problems"
        }
        chartData={groupedChartData}
        categoryKey="timeout"
        sgmData={tableData}
        uniqueBenchmarkCount={uniqueBenchmarkCount}
        uniqueLatestBenchmarkCount={uniqueBenchmarkCount}
      />
    </div>
  );
};

export default ChartResultsSections;
