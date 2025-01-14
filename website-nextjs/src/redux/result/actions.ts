import { BenchmarkResult } from "@/types/benchmarkResult"

const actions = {
  SET_BENCHMARK_RESULSTS: "SET_BENCHMARK_RESULSTS",

  setBenchmarkResults: (results: BenchmarkResult[]) => {
    return {
      type: actions.SET_BENCHMARK_RESULSTS,
      payload: { results },
    }
  },
}

export default actions
