import { AnyAction } from "redux"

import actions from "./actions"
import { BenchmarkResult } from "@/types/benchmarkResult"
import { getMetaData } from "@/utils/meta-data"

const { SET_BENCHMARK_RESULSTS } = actions

export type FilterState = {
  benchmarkResults: BenchmarkResult[],
  metaData: [],
}

const initialState: FilterState = {
  benchmarkResults: [],
  metaData: getMetaData(),
}

const benchmarkResultsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case SET_BENCHMARK_RESULSTS:
      const { results } = action.payload
      return {
        ...state,
        benchmarkResults: results,
      }

    default:
      return state
  }
}

export default benchmarkResultsReducer
