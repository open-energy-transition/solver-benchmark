import D3LineChart from "@/components/shared/D3LineChart"

const NormalizedSGMMemoryUsage = () => {
    return (
        <div>
          <p className="text-navy font-bold leading-1.5 mb-3">Normalized SGM Memory Usage</p>
          <D3LineChart title="Normalized SGM Memory Usage" />
        </div>
    )
  }
  export default NormalizedSGMMemoryUsage
