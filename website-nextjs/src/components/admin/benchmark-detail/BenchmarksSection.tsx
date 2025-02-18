import { useMemo } from "react"
import { useSelector } from "react-redux"

import { CircleIcon, CloseIcon } from "@/assets/icons"
import D3Chart from "@/components/shared/D3PlotChart"
import { IResultState } from "@/types/state"

const BenchmarksSection = ({ benchmarkName }: { benchmarkName: string }) => {
  const benchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults
    }
  )

  const chartData = useMemo(
    () =>
      benchmarkResults.filter((result) => result.benchmark === benchmarkName),
    [benchmarkResults]
  )

  return (
    <div className="py-4">
      <div className="text-back text-2xl font-medium mb-7 mt-2 font-league pl-1.5">
        Results on this benchmark
      </div>
      <D3Chart chartData={chartData} />
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
