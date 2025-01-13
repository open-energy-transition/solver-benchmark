import D3LineChart from "@/components/shared/D3LineChart"

const NormalizedSGMRuntime = () => {
    return (
        <div>
          <p className="text-navy font-bold leading-1.5 mb-3">Normalized SGM Runtime</p>
          <D3LineChart title="Normalized SGM Runtime" />
        </div>
    )
  }
  export default NormalizedSGMRuntime
