import { AnyAction } from "redux"

import actions from "./actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData } from "@/types/meta-data"
import { formatBenchmarkName, processBenchmarkResults } from "@/utils/results"

const {
  SET_BENCHMARK_RESULTS,
  SET_BENCHMARK_LATEST_RESULTS,
  SET_META_DATA,
  SET_RAW_BENCHMARK_RESULTS,
  SET_RAW_META_DATA,
} = actions

export type ResultState = {
  benchmarkResults: BenchmarkResult[]
  benchmarkLatestResults: BenchmarkResult[]
  metaData: MetaData
  rawBenchmarkResults: BenchmarkResult[]
  rawMetaData: MetaData
  years: number[]
  solvers: string[]
  availableBenchmarksAndSizes: string[]
  availableBenchmarks: string[]
  availableSolves: string[]
  solversData: {
    solver: string
    versions: string[]
  }[]
  availableStatuses: string[]
}

const initialState: ResultState = {
  benchmarkResults: [],
  benchmarkLatestResults: [],
  metaData: {},
  rawBenchmarkResults: [],
  rawMetaData: {},
  years: [],
  solvers: [],
  availableBenchmarksAndSizes: [],
  availableBenchmarks: [],
  availableSolves: [],
  solversData: [],
  availableStatuses: [],
}

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULTS:
      return {
        ...state,
        benchmarkResults: processBenchmarkResults(action.payload.results),
      }
    case SET_BENCHMARK_LATEST_RESULTS:
      return {
        ...state,
        benchmarkLatestResults: processBenchmarkResults(action.payload.results),
      }
    case SET_RAW_BENCHMARK_RESULTS:
      const availableSolves = Array.from(
        new Set(
          action.payload.results.map((result: BenchmarkResult) => result.solver)
        )
      )
      const solversData = availableSolves.map((solver) => {
        const versions = Array.from(
          new Set(
            action.payload.results
              .filter((result: BenchmarkResult) => solver === result.solver)
              .map((result: BenchmarkResult) => result.solverVersion)
              .reverse()
          )
        )
        return {
          solver,
          versions,
        }
      })
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
        availableSolves,
        solversData,
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
