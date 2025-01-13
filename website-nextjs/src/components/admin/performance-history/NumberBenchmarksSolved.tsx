import D3LineChart from "@/components/shared/D3LineChart"

const NumberBenchmarksSolved = () => {
    return (
        <div className="pb-4">
          <p className="text-navy font-bold leading-1.5 mb-1.5">Number of Benchmarks Solved</p>
          <D3LineChart className="px-10" title="Number of Benchmarks Solved" height={220} />
        </div>
    )
  }
  export default NumberBenchmarksSolved
