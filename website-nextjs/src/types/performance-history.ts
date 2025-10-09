import { SolverType } from "./benchmark";

interface SolverYearlyChartData {
  year: number;
  value: number;
  solver: SolverType;
  version: string;
  originalValue?: number;
}

export type { SolverYearlyChartData };
