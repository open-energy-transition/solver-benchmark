type SolverType = "glpk" | "scip" | "highs"
type SolverStatusType = "TO" | "ok"

type BenchmarkResult = {
  benchmark: string
  dualityGap: string | null
  maxIntegralityViolation: string | null
  memoryUsage: number
  objectiveValue: string | null
  runtime: number
  size: string
  solver: SolverType
  solverReleaseYear: number
  solverVersion: string
  status: SolverStatusType
  terminationCondition: string
}

export type { BenchmarkResult, SolverStatusType, SolverType }
