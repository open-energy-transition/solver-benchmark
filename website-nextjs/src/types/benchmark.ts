type SolverType = "glpk" | "scip" | "highs"
type SolverStatusType = "TO" | "ok" | "warning"

type BenchmarkResult = {
  benchmark: string
  dualityGap: string | null
  maxIntegralityViolation: string | null
  memoryUsage: number
  objectiveValue: string | null
  problemSize?: string
  runtime: number
  size: string
  solver: SolverType
  solverReleaseYear: number
  solverVersion: string
  status: SolverStatusType
  terminationCondition: string
}

interface ISolverYearlyMetrics {
  solver: string
  data: {
    year: number
    sgm: {
      runtime: number | null
      memoryUsage?: number | null
    }
    benchmarkResults: {
      runtime: number
      memoryUsage: number
      status: SolverStatusType
    }[],
    numSolvedBenchmark: number,
  }[]
}

interface ISolverYearlyChartData {
  solver: SolverType,
  year: number,
  value: number,
}

export type {
  BenchmarkResult,
  SolverStatusType,
  SolverType,
  ISolverYearlyMetrics,
  ISolverYearlyChartData,
}
