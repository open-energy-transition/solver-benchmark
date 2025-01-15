import { AnyAction } from "redux"

import actions from "./actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData } from "@/types/meta-data"

const {
  SET_BENCHMARK_RESULSTS,
  SET_META_DATA,
  SET_RAW_BENCHMARK_RESULSTS,
  SET_RAW_META_DATA,
} = actions

export type FilterState = {
  benchmarkResults: BenchmarkResult[]
  metaData: MetaData
  rawBenchmarkResults: BenchmarkResult[]
  rawMetaData: MetaData
}

const initialState: FilterState = {
  benchmarkResults: [],
  metaData: {},
  rawBenchmarkResults: [],
  rawMetaData: {},
}

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULSTS:
      return {
        ...state,
        benchmarkResults: action.payload.results,
      }
    case SET_RAW_BENCHMARK_RESULSTS:
      return {
        ...state,
        rawBenchmarkResults: action.payload.results,
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
