import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { ArrowIcon, QuestionLine } from "@/assets/icons"
import { getHighestVersion } from "@/utils/versions"
import { calculateSgm } from "@/utils/calculations"
import { roundNumber } from "@/utils/number"
import { MaxMemoryUsage, MaxRunTime } from "@/constants"
import { ResultState } from "@/redux/results/reducer"
import Popup from "reactjs-popup"
import { getLatestBenchmarkResult } from "@/utils/results"

const ResultsSection = () => {
  const columns = [
    {
      name: "Rank",
      field: "rank",
      width: "flex-1",
      bgColor: "bg-light-grey/50",
      color: "text-dark-grey",
      sort: true,
    },
    {
      name: "Solver",
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
      name: "SGM Memory",
      field: "memory",
      width: "w-1/5",
      bgColor: "bg-lavender/80",
      color: "text-navy font-semibold",
      sort: true,
    },
    {
      name: "Solved Benchmarks",
      field: "solvedBenchmarks",
      width: "w-1/5",
      bgColor: "bg-lavender",
      color: "text-navy font-semibold",
      sort: true,
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
      bgColor: "bg-lime-green",
      color: "text-navy font-semibold",
      sort: true,
    },
  ]

  const benchmarkResults = useSelector((state: { results: ResultState }) => {
    return state.results.benchmarkLatestResults
  })

  const rawBenchmarkResults = useSelector((state: { results: ResultState }) => {
    return state.results.rawBenchmarkResults
  })

  const latestBenchmarkResult = getLatestBenchmarkResult(rawBenchmarkResults)

  const [tableData, setTableData] = useState<
    {
      rank: number
      solver: string
      version: string
      memory: number
      solvedBenchmarks: string
      runtime: number
    }[]
  >([])
  const [sortConfig, setSortConfig] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({ field: "runtime", direction: "asc" })

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
            result.solverVersion ===
              getHighestVersion(solverVersions[solver]) &&
            result.solver === solver
        )
        .map((result) => {
          if (result.status === "warning" && field === "runtime")
            return MaxRunTime
          if (
            ["warning", "TO"].includes(result.status) &&
            field === "memoryUsage"
          )
            return MaxMemoryUsage
          return result[field]
        }),
    [benchmarkResults, solverVersions]
  )

  const calculateSgmBySolver = useCallback(
    (solver: string, field: "memoryUsage" | "runtime" = "memoryUsage") => {
      const minSgm = Math.min(
        ...solverList.map((solver) =>
          calculateSgm(getRelevantResults(solver, field))
        )
      )
      return calculateSgm(getRelevantResults(solver, field)) / minSgm
    },
    [getRelevantResults, solverList]
  )

  const getNumberSolvedBenchmark = useCallback(
    (solver: string) => {
      return benchmarkResults.filter(
        (result) =>
          result.status === "ok" &&
          result.solverVersion === getHighestVersion(solverVersions[solver]) &&
          result.solver === solver
      ).length
    },
    [benchmarkResults, solverVersions]
  )

  const getSolverRanks = () => {
    const combinedRankList = [
      {
        solver: "highs",
        runtime: calculateSgmBySolver("highs", "runtime"),
        memoryUsage: calculateSgmBySolver("highs", "memoryUsage"),
        score: 0,
      },
      {
        solver: "glpk",
        runtime: calculateSgmBySolver("glpk", "runtime"),
        memoryUsage: calculateSgmBySolver("glpk", "memoryUsage"),
        score: 0,
      },
      {
        solver: "scip",
        runtime: calculateSgmBySolver("scip", "runtime"),
        memoryUsage: calculateSgmBySolver("scip", "memoryUsage"),
        score: 0,
      },
    ]

    combinedRankList.forEach((solver) => {
      solver.score = solver.runtime
    })
    return combinedRankList.sort((a, b) => a.score - b.score)
  }

  const uniqueBenchmarkCount = new Set(
    benchmarkResults.map((result) => `${result.benchmark}-${result.size}`)
  ).size

  const uniqueLatestBenchmarkCount = new Set(
    latestBenchmarkResult.map((result) => `${result.benchmark}-${result.size}`)
  ).size

  useEffect(() => {
    setTableData([
      {
        rank:
          getSolverRanks().findIndex((solver) => solver.solver === "highs") + 1,
        solver: "HiGHS",
        version: getHighestVersion(solverVersions.highs),
        memory: roundNumber(calculateSgmBySolver("highs", "memoryUsage"), 2),
        solvedBenchmarks: `${getNumberSolvedBenchmark(
          "highs"
        )} / ${uniqueBenchmarkCount}`,
        runtime: roundNumber(calculateSgmBySolver("highs", "runtime"), 2),
      },
      {
        rank:
          getSolverRanks().findIndex((solver) => solver.solver === "glpk") + 1,
        solver: "GLPK",
        version: getHighestVersion(solverVersions.glpk),
        memory: roundNumber(calculateSgmBySolver("glpk", "memoryUsage"), 2),
        solvedBenchmarks: `${getNumberSolvedBenchmark(
          "glpk"
        )} / ${uniqueBenchmarkCount}`,
        runtime: roundNumber(calculateSgmBySolver("glpk", "runtime"), 2),
      },
      {
        rank:
          getSolverRanks().findIndex((solver) => solver.solver === "scip") + 1,
        solver: "SCIP",
        version: getHighestVersion(solverVersions.scip),
        memory: roundNumber(calculateSgmBySolver("scip", "memoryUsage"), 2),
        solvedBenchmarks: `${getNumberSolvedBenchmark(
          "scip"
        )} / ${uniqueBenchmarkCount}`,
        runtime: roundNumber(calculateSgmBySolver("scip", "runtime"), 2),
      },
    ])
  }, [benchmarkResults, calculateSgmBySolver, getNumberSolvedBenchmark])

  // Sorting logic
  const sortedTableData = useMemo(() => {
    if (!sortConfig.field) return tableData
    const sorted = [...tableData].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof typeof a]
      const bValue = b[sortConfig.field as keyof typeof b]
      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    // Reassign static ranks (1, 2, 3)
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }))
  }, [tableData, sortConfig])

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const [activedIndex, setActivedIndex] = useState(0)

  if (!benchmarkResults.length) return <></>

  return (
    <div>
      <div className="pb-3 pl-3">
        <div className="text-navy font-bold text-xl">
          Results
          {latestBenchmarkResult.length !== benchmarkResults.length && (
            <span className="ml-1">
              (filtered to {uniqueBenchmarkCount}/{uniqueLatestBenchmarkCount}{" "}
              benchmarks)
            </span>
          )}
        </div>
        <div className="text-dark-grey text-sm flex items-center">
          We rank solvers by normalized shifted geometric mean (SGM
          <div className="flex gap-2">
            <Popup
              on={["hover"]}
              trigger={() => <QuestionLine className="w-4 h-4" />}
              position="right center"
              closeOnDocumentClick
              arrowStyle={{ color: "#ebeff2" }}
            >
              <div className="bg-stroke p-2 rounded">
                The shifted geometric mean SGM of the n nonnegative numbers
                v[1],...v[n] is
                <br />
                <span className="ml-4">
                  SGM = exp(sum{"{i in 1..n}"} ln(max(1, v[i] + sh)) / n) - sh,
                  sh nonnegative
                </span>
                <br />
                In our benchmarks, where the v[i] are Wallclock seconds, we use
                sh = 10. Then we scale the means by dividing them by the
                smallest mean.
              </div>
            </Popup>
          </div>
          ) of runtime and memory consumption over all benchmarks
        </div>
      </div>
      <div className="flex text-xs leading-1.5">
        {columns.map((column, i) => (
          <div
            key={column.field}
            className={`first-of-type:rounded-tl-2xl first-of-type:rounded-bl-2xl last-of-type:rounded-tr-2xl last-of-type:rounded-br-2xl ${column.color} ${column.bgColor} ${column.width}`}
          >
            <div
              className="h-9 flex items-center gap-1 pl-3 pr-6 cursor-pointer"
              onClick={() => column.sort && handleSort(column.field)}
            >
              {column.headerContent
                ? column.headerContent(column.name)
                : column.name}
              {column.sort && (
                <ArrowIcon
                  fill="none"
                  stroke={sortConfig.field === column.field ? "black" : "gray"}
                  className={`w-2 h-2 ${
                    sortConfig.direction === "asc" ? "rotate-90" : "-rotate-90"
                  }
                    ${sortConfig.field === column.field ? "block" : "hidden"}`}
                />
              )}
            </div>

            {sortedTableData.map((item, index) => (
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
