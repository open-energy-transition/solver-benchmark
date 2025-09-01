import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowIcon, QuestionLineIcon } from "@/assets/icons";
import { getHighestVersion } from "@/utils/versions";
import { calculateSgm } from "@/utils/calculations";
import { roundNumber } from "@/utils/number";
import Popup from "reactjs-popup";
import { IFilterState, IResultState } from "@/types/state";
import ResultsSectionsTitle from "./home/ResultsTitle";
import { extractNumberFromFormattedString } from "@/utils/string";
import { SgmMode } from "@/constants/sgm";
import { SgmExplanation, SolverVersions } from "@/components/shared";
import ResultsSgmModeDropdown from "./home/ResultsSgmModeDropdown";
import SgmRuntimeComparison from "@/pages/dashboard/main-result/SgmRuntimeComparison";
import { getLatestBenchmarkResult } from "@/utils/results";

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

interface ResultsSectionProps {
  timeout: number;
}

const ResultsSection = ({ timeout }: ResultsSectionProps) => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => result.timeout === timeout);

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

  const benchmarkResults = useMemo(() => {
    switch (sgmMode) {
      case SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS:
        const benchmarkSuccessMap = new Map<string, number>();

        // Count successful solves for each benchmark
        benchmarkLatestResults
          .filter((result) => result.status === "ok")
          .forEach((result) => {
            const key = `${result.benchmark}-${result.size}`;
            benchmarkSuccessMap.set(
              key,
              (benchmarkSuccessMap.get(key) || 0) + 1,
            );
          });

        // Filter results where all solvers succeeded
        return benchmarkLatestResults.filter((result) => {
          const key = `${result.benchmark}-${result.size}`;
          return (
            result.status === "ok" &&
            benchmarkSuccessMap.get(key) === availableSolvers.length
          );
        });

      case SgmMode.PENALIZING_TO_BY_FACTOR:
        return benchmarkLatestResults.map((result) => ({
          ...result,
          runtime:
            result.status !== "ok" ? result.runtime * xFactor : result.runtime,
          memoryUsage:
            result.status !== "ok"
              ? result.memoryUsage * xFactor
              : result.memoryUsage,
        }));
      default:
        return benchmarkLatestResults;
    }
  }, [sgmMode, xFactor, availableSolvers, timeout, selectedFilters]);
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

  const columns: ColumnType[] = useMemo(
    () => [
      {
        name: "Rank",
        field: "rank",
        width: "flex-1",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        sort: false,
      },
      {
        name: "Solver",
        field: "solver",
        width: "w-1/6",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        sortFunc: (a, b) => a.solver.localeCompare(b.solver),
      },
      {
        name: "Version",
        field: "version",
        width: "w-1/6",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        sortFunc: (a, b) => a.version.localeCompare(b.version),
      },
      {
        name: "SGM Memory",
        field: "memory",
        width: "w-1/5",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        row: {
          textStyle: "justify-end",
        },
        sort: true,
        sortFunc: (a, b) => {
          return (
            extractNumberFromFormattedString(a.memory) -
            extractNumberFromFormattedString(b.memory)
          );
        },
      },
      {
        name: "Solved Benchmarks",
        field: "solvedBenchmarks",
        width: "w-1/5",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        row: {
          textStyle: "justify-end",
        },
        sort: true,
        sortFunc: (a, b) => {
          return (
            extractNumberFromFormattedString(a.solvedBenchmarks) -
            extractNumberFromFormattedString(b.solvedBenchmarks)
          );
        },
        headerContent: (header: string) => (
          <div className="flex items-center w-max">
            {header}
            <Popup
              on={["hover"]}
              trigger={() => (
                <div>
                  <QuestionLineIcon className="w-4 h-4" />
                </div>
              )}
              position="right center"
              closeOnDocumentClick
              arrow={false}
            >
              <div className="bg-white border-stroke border px-4 py-2 rounded-lg">
                Solved benchmarks is the number of benchmarks where the solver
                returns an &apos;ok&apos; status
              </div>
            </Popup>
          </div>
        ),
      },
      {
        name: "SGM Runtime",
        field: "runtime",
        width:
          sgmMode !== SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS
            ? "w-1/5"
            : "w-2/6",
        header: {
          bgStyle: "bg-[#F4F6FA]",
          textStyle: "text-navy font-semibold",
        },
        row: {
          textStyle: "justify-end",
        },
        sort: true,
        sortFunc: (a, b) => {
          return (
            extractNumberFromFormattedString(a.runtime) -
            extractNumberFromFormattedString(b.runtime)
          );
        },
        headerContent: (header: string) => (
          <div className="flex gap-2 w-max">
            {header}
            {sgmMode === SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS && (
              <>
                {" "}
                on {uniqueBenchmarkCount}{" "}
                {uniqueBenchmarkCount > 1 ? "benchmarks" : "benchmark"}
              </>
            )}
          </div>
        ),
      },
    ],
    [sgmMode, uniqueBenchmarkCount],
  );

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
          memory: `${memorySgm === minMemory ? "<b>" : ""}${roundNumber(
            memorySgm,
            2,
          )} (${roundNumber(
            calculateSgm(getRelevantResults(solverData, "memoryUsage")),
            2,
          )})${memorySgm === minMemory ? "</b>" : ""}`,
          solvedBenchmarks: `${
            solvedCount === maxSolved ? "<b>" : ""
          }${getSolvedBenchmarksLabel(solverData, uniqueBenchmarkCount)}${
            solvedCount === maxSolved ? "</b>" : ""
          }`,
          runtime: `${runtimeSgm === minRuntime ? "<b>" : ""}${roundNumber(
            runtimeSgm,
            2,
          )} (${roundNumber(
            calculateSgm(getRelevantResults(solverData, "runtime")),
            2,
          )})${runtimeSgm === minRuntime ? "</b>" : ""}`,
        };
      }),
    );
  }, [benchmarkResults, calculateSgmBySolver, getNumberSolvedBenchmark]);

  // Sorting logic
  const sortedTableData = useMemo(() => {
    if (!sortConfig.field) return tableData;

    const column = columns.find((col) => col.field === sortConfig.field);
    if (!column) return tableData;

    const sorted = [...tableData].sort((a, b) => {
      // Custom sort function
      if (column.sortFunc) {
        return sortConfig.direction === "asc"
          ? column.sortFunc(a, b)
          : column.sortFunc(b, a);
      }
      // Default sort
      const field = sortConfig.field as keyof typeof a;
      const aValue = a[field];
      const bValue = b[field];

      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    // Reassign static ranks (1, 2, 3)
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [tableData, sortConfig, columns]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileView = windowWidth < 1024;

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.rawBenchmarkResults;
    },
  );

  const latestBenchmarkResult = getLatestBenchmarkResult(rawBenchmarkResults);

  const uniqueLatestBenchmarkCount = new Set(
    latestBenchmarkResult.map((result) => `${result.benchmark}-${result.size}`),
  ).size;

  return (
    <div>
      <div className="pb-3">
        <ResultsSectionsTitle
          benchmarkResults={benchmarkResults}
          latestBenchmarkResultLength={latestBenchmarkResult.length}
          uniqueBenchmarkCount={uniqueBenchmarkCount}
          uniqueLatestBenchmarkCount={uniqueLatestBenchmarkCount}
        />
        <div className="pl-2 mt-2 max-w-screen-lg">
          <p>
            <span>
              This table summarizes the benchmark results of the latest version
            </span>
            <span className="inline-flex gap-2">
              <Popup
                on={["hover"]}
                trigger={() => (
                  <span className="flex items-baseline">
                    <QuestionLineIcon
                      className="size-3.5"
                      viewBox="0 0 24 20"
                    />
                  </span>
                )}
                position="right center"
                closeOnDocumentClick
                arrow={false}
              >
                <div className="bg-white border-stroke border px-4 py-2 m-4 rounded-lg break-words">
                  <SolverVersions />
                </div>
              </Popup>
            </span>
            <span> of each solver on the selected configuration.</span>
          </p>
          <p>
            You can rank the solvers by the normalized shifted geometric mean
            (SGM
            <span className="inline-flex gap-2">
              <Popup
                on={["hover"]}
                trigger={() => (
                  <span className="flex items-baseline">
                    <QuestionLineIcon
                      className="size-3.5"
                      viewBox="0 0 24 20"
                    />
                    )
                  </span>
                )}
                position="right center"
                closeOnDocumentClick
                arrow={false}
              >
                <div className="bg-white border-stroke border px-4 py-2 m-4 rounded-lg break-words">
                  <SgmExplanation />
                </div>
              </Popup>
            </span>
            <span>
              &nbsp; of runtime or memory consumption over all benchmarks, or by
              the number of solved benchmark instances. Click on any column
              header to sort the results by that column.
            </span>
          </p>
        </div>
      </div>
      <div className="flex justify-end items-center gap-2 mb-2">
        <ResultsSgmModeDropdown />
      </div>

      {isMobileView ? (
        // Mobile view
        <div className="flex flex-col gap-4 px-2 lg:px-4 text-navy">
          {sortedTableData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">#{item.rank}</span>
                <span className="text-navy font-bold">{item.solver}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.keys(item).map(
                  (key) =>
                    key !== "rank" &&
                    key !== "solver" && (
                      <div key={key}>
                        <div>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                        <div
                          className="font-medium"
                          dangerouslySetInnerHTML={{
                            __html: item[key as keyof typeof item] ?? "-",
                          }}
                        />
                      </div>
                    ),
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop view
        <div className="flex text-sm leading-1.5 text-navy">
          {columns.map((column) => (
            <div
              key={column.field}
              className={`first-of-type:rounded-tl-2xl first-of-type:overflow-hidden first-of-type:rounded-bl-2xl first:!border-l odd:border-x-0 border border-stroke last-of-type:overflow-hidden last-of-type:rounded-tr-2xl last-of-type:rounded-br-2xl
                ${column?.header?.textStyle ?? ""} ${
                  column?.header?.bgStyle ?? ""
                } ${column.width}`}
            >
              <div
                className="py-2.5 tag-line-xs leading-1.5 font-bold flex items-center gap-1 px-3 cursor-pointer justify-center"
                onClick={() => column.sort && handleSort(column.field)}
              >
                {column.headerContent
                  ? column.headerContent(column.name)
                  : column.name}
                {column.sort && (
                  <ArrowIcon
                    fill="none"
                    stroke={
                      sortConfig.field === column.field ? "black" : "gray"
                    }
                    className={`w-2 h-2 ${
                      sortConfig.direction === "asc"
                        ? "rotate-90"
                        : "-rotate-90"
                    }
                    ${sortConfig.field === column.field ? "block" : "hidden"}`}
                  />
                )}
              </div>

              {sortedTableData.map((item, index) => (
                <p
                  key={`${column.field}-${index}`}
                  className={`py-2.5 my-0 flex even:border-y last:!border-b-0 border-x-0 border-stroke items-center pl-3 pr-6 odd:bg-[#E0E6F1] even:bg-[#EEF2F2]
                    ${column.row?.textStyle ?? "justify-center"} ${
                      column.row?.bgStyle ?? ""
                    }`}
                  dangerouslySetInnerHTML={{
                    __html:
                      item[column.field as keyof (typeof tableData)[0]] ?? "-",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <SgmRuntimeComparison
        timeout={timeout}
        sgmData={tableData}
        uniqueBenchmarkCount={uniqueBenchmarkCount}
        uniqueLatestBenchmarkCount={uniqueLatestBenchmarkCount}
      />
    </div>
  );
};

export default ResultsSection;
