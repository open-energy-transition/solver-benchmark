import { useSelector } from "react-redux"

import { CircleIcon, CloseIcon } from "@/assets/icons"
import D3Chart from "../shared/D3PlotChart"
import { BenchmarkResult } from "@/types/benchmark"

const BenchmarksSection = () => {
  const benchmarkResults = useSelector(
    (state: { results: { benchmarkResults: BenchmarkResult[] } }) => {
      return state.results.benchmarkResults
    }
  )

  return (
    <div className="py-4">
      <D3Chart chartData={benchmarkResults} />
      <div className="pt-1.5 pb-3 pl-3">
        <p className="flex gap-1 items-center text-dark-grey text-sm">
          <CloseIcon className="size-3" />
          represents benchmarks that timed out, while
          <CircleIcon className="size-3" />
          indicates a successful run.
        </p>
      </div>
    </div>
  )
}

export default BenchmarksSection
