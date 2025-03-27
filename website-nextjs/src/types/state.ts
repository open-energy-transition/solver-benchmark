import { SgmMode } from "@/constants/filter";
import { BenchmarkResult } from "./benchmark";
import { MetaData } from "./meta-data";

export type IFilterState = {
  sectors: string[];
  technique: string[];
  kindOfProblem: string[];
  problemSize: string[];
  modelName: string[];
  benchmarks: string[];
  solvers: string[];
  statuses: string[];
  sgmMode: SgmMode;
  xFactor: 5;
};

export interface IAvailableFilterData {
  availableSectors: string[];
  availableTechniques: string[];
  availableKindOfProblems: string[];
  availableProblemSizes: string[];
  availableModels: string[];
}

export interface IResultState extends IAvailableFilterData {
  benchmarkResults: BenchmarkResult[];
  benchmarkLatestResults: BenchmarkResult[];
  metaData: MetaData;
  rawBenchmarkResults: BenchmarkResult[];
  rawMetaData: MetaData;
  years: number[];
  solvers: string[];
  availableBenchmarksAndSizes: string[];
  availableBenchmarks: string[];
  availableSolvers: string[];

  solversData: {
    solver: string;
    versions: string[];
  }[];
  availableStatuses: string[];
}
