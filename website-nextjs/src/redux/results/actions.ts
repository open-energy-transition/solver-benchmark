import { BenchmarkResult } from "@/types/benchmark"
import { MetaData } from "@/types/meta-data"

const actions = {
  SET_BENCHMARK_RESULTS: "SET_BENCHMARK_RESULTS",
  SET_BENCHMARK_LATEST_RESULTS: "SET_BENCHMARK_LATEST_RESULTS",
  SET_META_DATA: "SET_META_DATA",
  SET_RAW_BENCHMARK_RESULTS: "SET_RAW_BENCHMARK_RESULTS",
  SET_RAW_META_DATA: "SET_RAW_META_DATA",

  setBenchmarkResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_BENCHMARK_RESULTS,
      payload: { results },
    }
  },
  setBenchmarkLatestResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_BENCHMARK_LATEST_RESULTS,
      payload: { results },
    }
  },
  setMetaData: (results: MetaData) => {
    return {
      type: actions.SET_META_DATA,
      payload: { results },
    }
  },
  setRawBenchmarkResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_RAW_BENCHMARK_RESULTS,
      payload: { results },
    }
  },
  setRawMetaData: (results: MetaData) => {
    return {
      type: actions.SET_RAW_META_DATA,
      payload: { results },
    }
  },
}

export default actions
