import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowIcon, QuestionLine } from "@/assets/icons";
import { getHighestVersion } from "@/utils/versions";
import { calculateSgm } from "@/utils/calculations";
import { roundNumber } from "@/utils/number";
import { MaxMemoryUsage } from "@/constants";
import Popup from "reactjs-popup";
import { IFilterState, IResultState } from "@/types/state";
import ResultsSectionsTitle from "./home/ResultsTitle";
import { SgmMode } from "@/constants/filter";

type ColumnType = {
  name: string;
  field: string;
  width: string;
  bgColor: string;
  color: string;
  sort?: boolean;
  headerContent?: (header: string) => React.ReactNode;
  sortFunc?: (a: TableRowType, b: TableRowType) => number;
};

type TableRowType = {
  rank: number;
  solver: string;
  version: string;
  memory: string;
  solvedBenchmarks: string;
  runtime: string;
};

const ResultsSection = () => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  );

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

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
          runtime: result.runtime * xFactor,
          memoryUsage: MaxMemoryUsage * xFactor,
        }));
      default:
        return benchmarkLatestResults;
    }
  }, [sgmMode, xFactor, benchmarkLatestResults, availableSolvers]);

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
          if (
            ["warning", "TO"].includes(result.status) &&
            field === "memoryUsage"
          )
            return MaxMemoryUsage;
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
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sort: false,
      },
      {
        name: "Solver",
        field: "solver",
        width: "w-1/6",
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sortFunc: (a, b) => a.solver.localeCompare(b.solver),
      },
      {
        name: "Version",
        field: "version",
        width: "w-1/6",
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sortFunc: (a, b) => a.version.localeCompare(b.version),
      },
      {
        name: "SGM Memory",
        field: "memory",
        width: "w-1/5",
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sort: true,
        sortFunc: (a, b) => {
          const extractValue = (str: string) => {
            const numMatch = str.match(/^[\d.]+/);
            return numMatch ? parseFloat(numMatch[0]) : 0;
          };
          return extractValue(a.memory) - extractValue(b.memory);
        },
      },
      {
        name: "Solved Benchmarks",
        field: "solvedBenchmarks",
        width: "w-1/5",
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sort: true,
        sortFunc: (a, b) => {
          const extractValue = (str: string) => {
            const numMatch = str.match(/^[\d.]+/);
            return numMatch ? parseFloat(numMatch[0]) : 0;
          };
          return (
            extractValue(a.solvedBenchmarks) - extractValue(b.solvedBenchmarks)
          );
        },
        headerContent: (header: string) => (
          <div className="flex gap-2">
            {header}
            <Popup
              on={["hover"]}
              trigger={() => <QuestionLine className="w-4 h-4" />}
              position="right center"
              closeOnDocumentClick
              arrowStyle={{ color: "#ebeff2" }}
            >
              <div className="bg-stroke p-2 rounded">
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
        width: "w-1/5",
        bgColor: "bg-[#F4F6FA]",
        color: "text-navy font-semibold",
        sort: true,
        sortFunc: (a, b) => {
          const extractValue = (str: string) => {
            const numMatch = str.match(/^[\d.]+/);
            return numMatch ? parseFloat(numMatch[0]) : 0;
          };
          return extractValue(a.runtime) - extractValue(b.runtime);
        },
        headerContent: (header: string) => (
          <div className="flex gap-2">
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
    setTableData(
      solverList.map((solverData) => ({
        rank:
          getSolverRanks().findIndex((solver) => solver.solver === solverData) +
          1,
        solver: solverData,
        version: getHighestVersion(solverVersions[solverData]),
        memory: `${roundNumber(
          calculateSgmBySolver(solverData, "memoryUsage"),
          2,
        )} (${roundNumber(
          calculateSgm(getRelevantResults(solverData, "memoryUsage")),
          2,
        )})`,
        solvedBenchmarks: getSolvedBenchmarksLabel(
          solverData,
          uniqueBenchmarkCount,
        ),
        runtime: `${roundNumber(
          calculateSgmBySolver(solverData, "runtime"),
          2,
        )} (${roundNumber(
          calculateSgm(getRelevantResults(solverData, "runtime")),
          2,
        )})`,
      })),
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

  const [activedIndex, setActivedIndex] = useState(0);
  console.log(activedIndex);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileView = windowWidth < 1024;

  return (
    <div>
      <div className="pb-3">
        <ResultsSectionsTitle benchmarkResults={benchmarkResults} />
        <div className="text-navy text-sm block items-center lg:max-w-[70%] 4xl:text-xl">
          <span>
            You can rank the latest version of each solver by number of solved
            benchmark instances, or by the normalized shifted geometric mean
            (SGM
          </span>
          <span className="inline-flex gap-2">
            <Popup
              on={["hover"]}
              trigger={() => (
                <span className="flex items-baseline">
                  <QuestionLine
                    className="size-3.5 4xl:size-5"
                    viewBox="0 0 24 20"
                  />
                  )
                </span>
              )}
              position="right center"
              closeOnDocumentClick
              arrowStyle={{ color: "#ebeff2" }}
            >
              <div className="bg-stroke p-2 rounded">
                The shifted geometric mean SGM of n non-negative numbers
                v[1],...v[n] is
                <br />
                <span className="ml-4">
                  SGM = exp(sum{"{i in 1..n}"} ln(max(1, v[i] + sh)) / n) - sh
                </span>
                <br />
                We use sh = 10, and then we normalize the means by dividing them
                by the smallest mean.
              </div>
            </Popup>
          </span>
          <span> of runtime and memory consumption over all benchmarks</span>
        </div>
      </div>

      {isMobileView ? (
        // Mobile view
        <div className="flex flex-col gap-4 px-4 text-navy">
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
                <div>
                  <div>Version</div>
                  <div className="font-medium">{item.version}</div>
                </div>
                <div>
                  <div>SGM Memory</div>
                  <div className="font-medium">{item.memory}</div>
                </div>
                <div>
                  <div>Solved Benchmarks</div>
                  <div className="font-medium">{item.solvedBenchmarks}</div>
                </div>
                <div>
                  <div>SGM Runtime</div>
                  <div className="font-medium">{item.runtime}</div>
                </div>
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
              className={`first-of-type:rounded-tl-2xl first-of-type:rounded-bl-2xl first:!border-l odd:border-x-0 border border-stroke last-of-type:rounded-tr-2xl last-of-type:rounded-br-2xl ${column.color} ${column.bgColor} ${column.width}`}
            >
              <div
                className="h-9 flex items-center gap-1 pl-3 pr-6 cursor-pointer justify-center 4xl:text-xl"
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
                <div
                  key={`${column.field}-${index}`}
                  className={`h-6 flex even:border-y last:!border-b-0 border-x-0 border-stroke justify-center items-center pl-3 pr-6 4xl:text-xl 4xl:py-4`}
                  onClick={() => setActivedIndex(index)}
                >
                  {item[column.field as keyof (typeof tableData)[0]] ?? "-"}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsSection;
