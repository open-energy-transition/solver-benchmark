import { CircleIcon, CloseIcon } from "@/assets/icons"
import D3Chart from "../shared/D3PlotChart"

const BenchmarksSection = () => {
  return (
    <div>
      <div className="pt-1.5 pb-3 pl-3">
        <h6 className="text-navy font-bold text-xl">Benchmarks</h6>
        <p className="flex gap-1 items-center text-dark-grey text-sm">
          <CloseIcon className="size-3" />
          represents benchmarks that timed out, while
          <CircleIcon className="size-3" />
          indicates a successful run.
        </p>
      </div>
      <D3Chart />
    </div>
  )
}

export default BenchmarksSection
