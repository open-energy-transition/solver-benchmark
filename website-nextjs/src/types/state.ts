import { SgmMode } from "@/constants/sgm";
import { BenchmarkResult } from "./benchmark";
import { MetaData } from "./meta-data";

export enum RealisticOption {
  Realistic = "Realistic",
  Other = "Other",
}

export type IFilterState = {
  benchmarks: string[];
  application: string[];
  modelName: string[];
  problemSize: string[];
  realistic: RealisticOption[];
  sectoralFocus: string[];
  sectors: string[];
  sgmMode: SgmMode;
  solvers: string[];
  statuses: string[];
  problemClass: string[];
  xFactor: 5;
  isReady: boolean;
};

export interface IAvailableFilterData {
  availableSectoralFocus: string[];
  availableSectors: string[];
  availableProblemClasses: string[];
  availableApplications: string[];
  availableProblemSizes: string[];
  availableModels: string[];
  realisticOptions: RealisticOption[];
}

export interface IResultState extends IAvailableFilterData {
  benchmarkResults: BenchmarkResult[];
  benchmarkLatestResults: BenchmarkResult[];
  fullMetaData: MetaData;
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
