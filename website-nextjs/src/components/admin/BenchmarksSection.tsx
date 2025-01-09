import { CircleIcon, CloseIcon } from "@/assets/icons"
import D3Chart from "../shared/D3PlotChart"

const BenchmarksSection = () => {
  return (
    <div>
      <div className="py-3 pl-3">
        <h6 className="text-navy font-bold text-xl">Benchmarks</h6>
        <p className="flex gap-1 items-center text-dark-grey">
          <CloseIcon className="h-4 w-4" />
          represents benchmarks that timed out, while
          <CircleIcon className="h-3 w-3" />
          indicates a successful run.
        </p>
      </div>
      <D3Chart />
    </div>
  )
}

export default BenchmarksSection
