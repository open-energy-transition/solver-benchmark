type SolverType = "glpk" | "scip" | "highs" | "gurobi" | "cbc";
type SolverStatusType = "TO" | "ok" | "warning" | "ER" | "OOM";

type BenchmarkResult = {
  benchmark: string;
  dualityGap: number | null;
  maxIntegralityViolation: number | null;
  memoryUsage: number;
  objectiveValue: number | null;
  problemSize?: string;
  runtime: number;
  size: string;
  solver: SolverType;
  solverReleaseYear: number;
  solverVersion: string;
  status: SolverStatusType;
  terminationCondition: string;
  runId: string | null;
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
    version: string;
  }[];
}

interface ISolverYearlyChartData {
  solver: SolverType;
  year: number;
  value: number;
  version: string;
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
  sectoralFocus: string[];
  sectors: string[];
  problemClass: string[];
  application: string[];
  problemSize: string[];
  realistic: string[];
  modellingFramework: string[];
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
