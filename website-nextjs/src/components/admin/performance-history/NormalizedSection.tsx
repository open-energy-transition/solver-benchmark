import NormalizedSGMMemoryUsage from "./NormalizedSGMMemoryUsage"
import NormalizedSGMRuntime from "./NormalizedSGMRuntime"

const NormalizedSection = () => {
  return (
    <div className="flex gap-4 w-full">
      <div className="w-1/2">
        <NormalizedSGMRuntime />
      </div>
      <div className="w-1/2">
        <NormalizedSGMMemoryUsage />
      </div>
    </div>
  )
}
export default NormalizedSection
