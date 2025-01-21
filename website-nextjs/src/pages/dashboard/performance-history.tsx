import { useSelector } from "react-redux"
import { useMemo } from "react"

// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Navbar } from "@/components/shared"
import NumberBenchmarksSolved from "@/components/admin/performance-history/NumberBenchmarksSolved"
import NormalizedSection from "@/components/admin/performance-history/NormalizedSection"
import FilterSection from "@/components/admin/FilterSection"

import {
  BenchmarkResult,
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
  SolverType,
} from "@/types/benchmark"
import { calculateSgm } from "@/utils/calculations"

const PagePerformanceHistory = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  const benchmarkResults = useSelector(
    (state: { results: { benchmarkResults: BenchmarkResult[] } }) => {
      return state.results.benchmarkResults
    }
  )
  const years = [
    ...new Set(benchmarkResults.map((result) => result.solverReleaseYear)),
  ]
  const solvers = [...new Set(benchmarkResults.map((result) => result.solver))]

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
      })),
    }
  })

  benchmarkResults.forEach((result) => {
    const resultGroupedBySolver = solverYearlyMetrics.find(
      (resultGroupedBySolver) => resultGroupedBySolver.solver === result.solver
    )
    resultGroupedBySolver?.data
      .find((d) => d.year === result.solverReleaseYear)
      ?.benchmarkResults.push({
        runtime: result.runtime,
        memoryUsage: result.memoryUsage,
        status: result.status,
      })
  })

  solverYearlyMetrics.forEach((solverYearlyMetric) => {
    solverYearlyMetric.data.forEach((d) => {
      d.sgm.runtime = calculateSgm(d.benchmarkResults.map((res) => res.runtime))
      d.sgm.memoryUsage = calculateSgm(
        d.benchmarkResults.map((res) => res.memoryUsage)
      )
      d.numSolvedBenchmark = d.benchmarkResults.filter(
        (res) => res.status === "ok"
      ).length
    })
  })

  solverYearlyMetrics.map((solverYearlyMetric) =>
    solverYearlyMetric.data.map((d) => d.benchmarkResults)
  )

  const getNormalizedData = (
    solverYearlyMetrics: ISolverYearlyMetrics[],
    key: "runtime" | "memoryUsage",
    minValue: number
  ): ISolverYearlyChartData[] => {
    const normalizedData: ISolverYearlyChartData[] = []
    solverYearlyMetrics.forEach((solverYearlyMetric) => {
      solverYearlyMetric.data.forEach((solverData) => {
        const value = solverData.sgm[key]
        if (value !== null && value !== undefined && !isNaN(value)) {
          normalizedData.push({
            solver: solverYearlyMetric.solver as SolverType,
            year: solverData.year,
            value: value / minValue,
          })
        }
      })
    })
    return normalizedData
  }

  const getNumSolvedBenchMark = (): ISolverYearlyChartData[] => {
    const numSolvedBenchMark: ISolverYearlyChartData[] = []
    solverYearlyMetrics.forEach((solverYearlyMetric) => {
      solverYearlyMetric.data.forEach((solverData) => {
        if (solverData.numSolvedBenchmark > 0) {
          numSolvedBenchMark.push({
            solver: solverYearlyMetric.solver as SolverType,
            year: solverData.year,
            value: solverData.numSolvedBenchmark,
          })
        }
      })
    })
    return numSolvedBenchMark
  }

  const chartData = useMemo(() => {
    const minRuntime = Math.min(
      ...(solverYearlyMetrics
        .map((item) => item.data.map((d) => d.sgm.runtime))
        .flat()
        .filter(Number) as number[])
    )

    const minMemoryUsage = Math.min(
      ...(solverYearlyMetrics
        .map((item) => item.data.map((d) => d.sgm.memoryUsage))
        .flat()
        .filter(Number) as number[])
    )

    return {
      runtime: getNormalizedData(solverYearlyMetrics, "runtime", minRuntime),
      memoryUsage: getNormalizedData(
        solverYearlyMetrics,
        "memoryUsage",
        minMemoryUsage
      ),
      numSolvedBenchMark: getNumSolvedBenchMark(),
    }
  }, [solverYearlyMetrics])

  return (
    <div className="bg-light-blue h-screen">
      <Navbar />
      <div className={`px-6 ${isNavExpanded ? "ml-64" : "ml-20"}`}>
        <AdminHeader />
        {/* Content */}
        <DetailSection />
        <FilterSection />
        <div className="mt-8 mb-5">
          <div className="text-navy text-xl leading-1.4 font-semibold">
            Solver Performance History
          </div>
          <div className="text-sm leading-1.4 text-[#5D5D5D]">
            We use the Shifted Geometric Mean (SGM) of runtime and memory
            consumption overall the benchmarks, and normalize according to the
            best performing solver version.
          </div>
        </div>
        <NormalizedSection chartData={chartData} />
        <NumberBenchmarksSolved
          numSolvedBenchMark={chartData.numSolvedBenchMark}
        />
      </div>
    </div>
  )
}

export default PagePerformanceHistory
