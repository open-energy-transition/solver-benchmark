import { AnyAction } from "redux";

import actions from "./actions";
import { BenchmarkResult } from "@/types/benchmark";
import { formatBenchmarkName, processBenchmarkResults } from "@/utils/results";
import { IResultState, RealisticOption } from "@/types/state";
import { sortStringArray } from "@/utils/string";

const {
  SET_BENCHMARK_RESULTS,
  SET_BENCHMARK_LATEST_RESULTS,
  SET_META_DATA,
  SET_RAW_BENCHMARK_RESULTS,
  SET_RAW_META_DATA,
  SET_AVAILABLE_FILTER_DATA,
  SET_FULL_META_DATA,
} = actions;

const initialState: IResultState = {
  availableBenchmarks: [],
  availableBenchmarksAndSizes: [],
  availableApplications: [],
  availableModels: [],
  availableModellingFrameworks: [],
  availableProblemSizes: [],
  availableSectoralFocus: [],
  availableSectors: [],
  availableSolvers: [],
  availableStatuses: [],
  availableProblemClasses: [],
  benchmarkLatestResults: [],
  benchmarkResults: [],
  fullMetaData: {},
  metaData: {},
  rawBenchmarkResults: [],
  rawMetaData: {},
  realisticOptions: [RealisticOption.Realistic, RealisticOption.Other],
  solvers: [],
  solversData: [],
  years: [],
};

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULTS:
      return {
        ...state,
        benchmarkResults: processBenchmarkResults(
          action.payload.results,
          state.fullMetaData,
        ),
      };
    case SET_BENCHMARK_LATEST_RESULTS:
      return {
        ...state,
        benchmarkLatestResults: processBenchmarkResults(
          action.payload.results,
          state.fullMetaData,
        ),
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
        availableSectoralFocus,
        availableSectors,
        availableProblemClasses,
        availableApplications,
        availableModels,
        availableModellingFrameworks,
        availableProblemSizes,
      } = action.payload.availableFilterData;
      return {
        ...state,
        availableSectoralFocus: sortStringArray(availableSectoralFocus),
        availableSectors: sortStringArray(availableSectors),
        availableProblemClasses: sortStringArray(availableProblemClasses),
        availableApplications: sortStringArray(availableApplications),
        availableModels: sortStringArray(availableModels),
        availableModellingFrameworks: sortStringArray(
          availableModellingFrameworks,
        ),
        availableProblemSizes: sortStringArray(availableProblemSizes, "desc"),
      };

    case SET_FULL_META_DATA:
      return {
        ...state,
        fullMetaData: action.payload.metaData,
      };
    default:
      return state;
  }
};

export default benchmarkResultsReducer;
