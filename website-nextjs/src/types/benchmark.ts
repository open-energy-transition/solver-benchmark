type SolverType = "glpk" | "scip" | "highs";
type SolverStatusType = "TO" | "ok" | "warning";

type BenchmarkResult = {
  benchmark: string;
  dualityGap: string | null;
  maxIntegralityViolation: string | null;
  memoryUsage: number;
  objectiveValue: string | null;
  problemSize?: string;
  runtime: number;
  size: string;
  solver: SolverType;
  solverReleaseYear: number;
  solverVersion: string;
  status: SolverStatusType;
  terminationCondition: string;
  timeout: number;
};

interface ISolverYearlyMetrics {
  solver: string;
  data: {
    year: number;
    sgm: {
      runtime: number | null;
      memoryUsage?: number | null;
    };
    benchmarkResults: {
      runtime: number;
      memoryUsage: number;
      status: SolverStatusType;
    }[];
    numSolvedBenchmark: number;
  }[];
}

interface ISolverYearlyChartData {
  solver: SolverType;
  year: number;
  value: number;
}

interface OriginBenchmarkResult {
  Benchmark: string;
  Size: string;
  Solver: string;
  "Solver Version": string;
  "Solver Release Year": number;
  Status: string;
  "Termination Condition": string;
  "Runtime (s)": number;
  "Memory Usage (MB)": number;
  "Objective Value": number | null;
  "Max Integrality Violation": number | null;
  "Duality Gap": number | null;
}

type IFilterBenchmarkDetails = {
  sectors: string[];
  technique: string[];
  kindOfProblem: string[];
  problemSize: string[];
  modelName: string[];
};

export type {
  IFilterBenchmarkDetails,
  BenchmarkResult,
  SolverStatusType,
  SolverType,
  ISolverYearlyMetrics,
  ISolverYearlyChartData,
  OriginBenchmarkResult,
};
