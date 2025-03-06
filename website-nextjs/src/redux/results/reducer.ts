import { AnyAction } from "redux";

import actions from "./actions";
import { BenchmarkResult } from "@/types/benchmark";
import { formatBenchmarkName, processBenchmarkResults } from "@/utils/results";
import { IResultState } from "@/types/state";
import { sortStringArray } from "@/utils/string";

const {
  SET_BENCHMARK_RESULTS,
  SET_BENCHMARK_LATEST_RESULTS,
  SET_META_DATA,
  SET_RAW_BENCHMARK_RESULTS,
  SET_RAW_META_DATA,
  SET_AVAILABLE_FILTER_DATA,
} = actions;

const initialState: IResultState = {
  availableBenchmarks: [],
  availableBenchmarksAndSizes: [],
  availableKindOfProblems: [],
  availableModels: [],
  availableProblemSizes: [],
  availableSectors: [],
  availableSolvers: [],
  availableStatuses: [],
  availableTechniques: [],
  benchmarkLatestResults: [],
  benchmarkResults: [],
  metaData: {},
  rawBenchmarkResults: [],
  rawMetaData: {},
  solvers: [],
  solversData: [],
  years: [],
};

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULTS:
      return {
        ...state,
        benchmarkResults: processBenchmarkResults(action.payload.results),
      };
    case SET_BENCHMARK_LATEST_RESULTS:
      return {
        ...state,
        benchmarkLatestResults: processBenchmarkResults(action.payload.results),
      };
    case SET_RAW_BENCHMARK_RESULTS:
      const availableSolvers = Array.from(
        new Set(
          action.payload.results.map(
            (result: BenchmarkResult) => result.solver,
          ),
        ),
      );
      const solversData = availableSolvers.map((solver) => {
        const versions = Array.from(
          new Set(
            action.payload.results
              .filter((result: BenchmarkResult) => solver === result.solver)
              .map((result: BenchmarkResult) => result.solverVersion)
              .reverse(),
          ),
        );
        return {
          solver,
          versions,
        };
      });
      return {
        ...state,
        rawBenchmarkResults: action.payload.results,
        availableBenchmarksAndSizes: Array.from(
          new Set(
            action.payload.results.map((result: BenchmarkResult) =>
              formatBenchmarkName(result),
            ),
          ),
        ),
        availableBenchmarks: Array.from(
          new Set(
            action.payload.results.map(
              (result: BenchmarkResult) => result.benchmark,
            ),
          ),
        ),
        availableSolvers,
        solversData,
        availableStatuses: Array.from(
          new Set(
            action.payload.results.map(
              (result: BenchmarkResult) => result.status,
            ),
          ),
        ),
      };
    case SET_META_DATA:
      return {
        ...state,
        metaData: action.payload.metaData,
      };
    case SET_RAW_META_DATA:
      return {
        ...state,
        rawMetaData: action.payload.metaData,
      };

    case SET_AVAILABLE_FILTER_DATA:
      const {
        availableSectors,
        availableTechniques,
        availableKindOfProblems,
        availableModels,
        availableProblemSizes,
      } = action.payload.availableFilterData;
      return {
        ...state,
        availableSectors: sortStringArray(availableSectors),
        availableTechniques: sortStringArray(availableTechniques),
        availableKindOfProblems: sortStringArray(availableKindOfProblems),
        availableModels: sortStringArray(availableModels),
        availableProblemSizes: sortStringArray(availableProblemSizes, "desc"),
      };

    default:
      return state;
  }
};

export default benchmarkResultsReducer;
