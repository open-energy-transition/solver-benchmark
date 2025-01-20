import { AnyAction } from "redux"

import actions from "./actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData } from "@/types/meta-data"
import { formatBenchmarkName, processBenchmarkResults } from "@/utils/results"

const {
  SET_BENCHMARK_RESULSTS,
  SET_META_DATA,
  SET_RAW_BENCHMARK_RESULSTS,
  SET_RAW_META_DATA,
} = actions

export type ResultState = {
  benchmarkResults: BenchmarkResult[]
  metaData: MetaData
  rawBenchmarkResults: BenchmarkResult[]
  rawMetaData: MetaData
  years: number[]
  solvers: string[]
  availableBenchmarksAndSizes: string[]
  availableBenchmarks: string[]
  availableSolves: string[]
  availableStatuses: string[]
}

const initialState: ResultState = {
  benchmarkResults: [],
  metaData: {},
  rawBenchmarkResults: [],
  rawMetaData: {},
  years: [],
  solvers: [],
  availableBenchmarksAndSizes: [],
  availableBenchmarks: [],
  availableSolves: [],
  availableStatuses: [],
}

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULSTS:
      return {
        ...state,
        benchmarkResults: processBenchmarkResults(action.payload.results),
      }
    case SET_RAW_BENCHMARK_RESULSTS:
      return {
        ...state,
        rawBenchmarkResults: action.payload.results,
        availableBenchmarksAndSizes: Array.from(
          new Set(
            action.payload.results.map((result: BenchmarkResult) =>
              formatBenchmarkName(result)
            )
          )
        ),
        availableBenchmarks: Array.from(
          new Set(
            action.payload.results.map(
              (result: BenchmarkResult) => result.benchmark
            )
          )
        ),
        availableSolves: Array.from(
          new Set(
            action.payload.results.map(
              (result: BenchmarkResult) => result.solver
            )
          )
        ),
        availableStatuses: Array.from(
          new Set(
            action.payload.results.map(
              (result: BenchmarkResult) => result.status
            )
          )
        ),
      }
    case SET_META_DATA:
      return {
        ...state,
        metaData: action.payload.results,
      }
    case SET_RAW_META_DATA:
      return {
        ...state,
        rawMetaData: action.payload.results,
      }

    default:
      return state
  }
}

export default benchmarkResultsReducer
