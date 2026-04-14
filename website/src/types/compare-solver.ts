import { SolverStatusType } from "./benchmark";

export interface SolverMetrics {
  runtime: number;
  memoryUsage: number;
  logRuntime: number;
  status: SolverStatusType;
}
