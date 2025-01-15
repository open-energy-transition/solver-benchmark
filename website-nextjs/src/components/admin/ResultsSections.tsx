import { useSelector } from "react-redux"
import { ArrowIcon } from "@/assets/icons"
import { BenchmarkResult } from "@/types/benchmark"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getHighestVersion } from "@/utils/versions"
import { calculateSgm } from "@/utils/calculations"
import { roundNumber } from "@/utils/number"
import { MaxMemoryUsage, MaxRunTime } from "@/constants"

const ResultsSection = () => {
  const columns = [
    {
      name: "Rank:",
      field: "rank",
      width: "flex-1",
      bgColor: "bg-light-grey/50",
      color: "text-dark-grey",
    },
    {
      name: "Solver:",
      field: "solver",
      width: "w-1/6",
      bgColor: "bg-light-grey",
      color: "text-dark-grey",
    },
    {
      name: "Version",
      field: "version",
      width: "w-1/6",
      bgColor: "bg-lavender/50",
      color: "text-navy font-semibold",
    },
    {
      name: "Memory",
      field: "memory",
      width: "w-1/5",
      bgColor: "bg-lavender/80",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
    {
      name: "Solved Benchmarks",
      field: "solvedBenchmarks",
      width: "w-1/5",
      bgColor: "bg-lavender",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
    {
      name: "Runtime",
      field: "runtime",
      width: "w-1/5",
      bgColor: "bg-lime-green",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
  ]

  const benchmarkResults = useSelector(
    (state: { results: { benchmarkResults: BenchmarkResult[] } }) => {
      return state.results.benchmarkResults
    }
  )

  const [tableData, setTableData] = useState<
    {
      rank: number
      solver: string
      version: string
      memory: number
      solvedBenchmarks: number
      runtime: number
    }[]
  >([])

  const solverList = useMemo(
    () => Array.from(new Set(benchmarkResults.map((result) => result.solver))),
    [benchmarkResults]
  )

  const solverVersions = useMemo(() => {
    const versions: { [key: string]: string[] } = {
      glpk: [],
      highs: [],
      scip: [],
    }
    benchmarkResults.forEach((benchmarkResult) => {
      if (
        !versions[benchmarkResult.solver].includes(
          benchmarkResult.solverVersion
        )
      ) {
        versions[benchmarkResult.solver].push(benchmarkResult.solverVersion)
      }
    })
    return versions
  }, [benchmarkResults])

  const getRelevantResults = useCallback(
    (solver: string, field: "memoryUsage" | "runtime") =>
      benchmarkResults
        .filter(
          (result) =>
            result.solverVersion === getHighestVersion(solverVersions[solver]) &&
            result.solver === solver
        )
        .map((result) => {
          if (result.status === "warning" && field === "runtime") return MaxRunTime;
          if (["warning", "TO"].includes(result.status) && field === "memoryUsage")
            return MaxMemoryUsage;
          return result[field];
        }),
    [benchmarkResults, solverVersions]
  );


  const calculateSgmBySolver = useCallback(
    (solver: string, field: "memoryUsage" | "runtime" = "memoryUsage") => {
      const minSgm = Math.min(
        ...solverList.map((solver) => calculateSgm(getRelevantResults(solver, field)))
      );
      return calculateSgm(getRelevantResults(solver, field)) / minSgm;
    },
    [getRelevantResults, solverList]
  );

  const getNumberSolvedBenchmark = useCallback(
  (solver: string) =>
    benchmarkResults.filter(
      (result) =>
        result.status === "ok" &&
        result.solverVersion === getHighestVersion(solverVersions[solver]) &&
        result.solver === solver
    ).length,
  [benchmarkResults, solverVersions]
);


  useEffect(() => {
    benchmarkResults.forEach((benchmarkResult) => {
      if (
        !solverVersions[benchmarkResult.solver].includes(
          benchmarkResult.solverVersion
        )
      ) {
        solverVersions[benchmarkResult.solver].push(
          benchmarkResult.solverVersion
        )
      }
    })

    setTableData([
      {
        rank: 1,
        solver: "HiGHS",
        version: getHighestVersion(solverVersions.highs),
        memory: roundNumber(
          calculateSgmBySolver("highs", "memoryUsage"),
          2
        ),
        solvedBenchmarks: getNumberSolvedBenchmark("highs"),
        runtime: roundNumber(
          calculateSgmBySolver("highs", "runtime"),
          2
        ),
      },
      {
        rank: 2,
        solver: "GLPK",
        version: getHighestVersion(solverVersions.glpk),
        memory: roundNumber(
          calculateSgmBySolver("glpk", "memoryUsage"),
          2
        ),
        solvedBenchmarks: getNumberSolvedBenchmark("glpk"),
        runtime: roundNumber(
          calculateSgmBySolver("glpk", "runtime"),
          2
        ),
      },
      {
        rank: 3,
        solver: "SCIP",
        version: getHighestVersion(solverVersions.scip),
        memory: roundNumber(
          calculateSgmBySolver("scip", "memoryUsage"),
          2
        ),
        solvedBenchmarks: getNumberSolvedBenchmark("scip"),
        runtime: roundNumber(
          calculateSgmBySolver("scip", "runtime"),
          2
        ),
      },
    ])
  }, [benchmarkResults])

  const [activedIndex, setActivedIndex] = useState(0)

  if (!benchmarkResults.length) return <></>

  return (
    <div>
      <div className="pb-3 pl-3">
        <div className="text-navy font-bold text-xl">Results</div>
        <div className="text-dark-grey text-sm">
          We rank solvers by normalized shifted geometric mean (SGM) of runtime
          and memory consumption over all benchmarks
        </div>
      </div>
      <div className="flex text-xs leading-1.5">
        {columns.map((column, i) => (
          <div
            key={column.field}
            className={`first-of-type:rounded-tl-2xl first-of-type:rounded-bl-2xl last-of-type:rounded-tr-2xl last-of-type:rounded-br-2xl ${column.color} ${column.bgColor} ${column.width}`}
          >
            <div className="h-9 flex items-center gap-1 pl-3 pr-6">
              {column.name}
              {column.hasDropdown && (
                <ArrowIcon fill="none" stroke="black" className="w-2 h-2" />
              )}
            </div>

            {tableData.map((item, index) => (
              <div
                key={`${column.field}-${index}`}
                className={`h-6 flex items-center pl-3 pr-6 ${
                  activedIndex === index
                    ? `border-b border-t border-[#CAD3D0] ${
                        i === 0 ? "border-l" : ""
                      } ${i === columns.length - 1 ? "border-r" : ""}`
                    : ""
                }`}
                onClick={() => setActivedIndex(index)}
              >
                {item[column.field as keyof (typeof tableData)[0]]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultsSection
