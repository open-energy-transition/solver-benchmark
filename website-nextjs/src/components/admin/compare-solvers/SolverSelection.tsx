import { getSolverLabel } from "@/utils/solvers"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import ChartCompare from "./ChartCompare"
import { IResultState } from "@/types/state"

const SolverSelection = () => {
  const solversData = useSelector((state: { results: IResultState }) => {
    return state.results.solversData
  })
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkResults
  })

  const [solver1, setSolver1] = useState("")
  const [solver2, setSolver2] = useState("")

  const [solverOptions, setSolverOptions] = useState<string[]>([])

  useEffect(() => {
    if (!solversData.length) return
    setSolver1(`${solversData[0].solver}--${solversData[0].versions[0]}`)
    setSolver2(`${solversData[1].solver}--${solversData[1].versions[0]}`)
    setSolverOptions(
      solversData.flatMap((s) =>
        s.versions.map((version) => `${s.solver}--${version}`)
      )
    )
  }, [solversData])

  function getOptionLabel(solverWithVersion: string) {
    const [solver, version] = solverWithVersion.split("--")
    return `${getSolverLabel(solver)} v${version}`
  }

  interface ChartData {
    d1: {
      runtime: number
      memoryUsage: number
    }
    d2: {
      runtime: number
      memoryUsage: number
    }
    status: "TO-TO" | "ok-ok" | "ok-TO" | "TO-ok"
    benchmark: string
    size: string
  }

  const [chartData, setChartData] = useState<ChartData[]>([])

  function formatStatus(status: string) {
    if (status !== "ok") {
      return "TO"
    }
    return status
  }

  useEffect(() => {
    const [s1, v1] = solver1.split("--")
    const [s2, v2] = solver2.split("--")

    const data1 = benchmarkResults.filter(
      (result) => result.solver === s1 && result.solverVersion === v1
    )
    const data2 = benchmarkResults.filter(
      (result) => result.solver === s2 && result.solverVersion === v2
    )

    setChartData(
      data1.map((d1) => {
        const d2 = data2.find(
          (d2) => d2.benchmark === d1.benchmark && d2.size === d1.size
        )
        if (!d2) {
          throw new Error(
            `Result not found for Benchmark: ${d1.benchmark} Size: ${d1.size}`
          )
        }
        return {
          d1: {
            runtime: d1.runtime,
            memoryUsage: d1.memoryUsage,
          },
          d2: {
            runtime: d2.runtime,
            memoryUsage: d2.memoryUsage,
          },
          status: `${formatStatus(d1.status)}-${formatStatus(d2.status)}`,
          benchmark: d1.benchmark,
          size: d1.size,
        }
      })
    )
  }, [solver1, solver2, benchmarkResults])

  return (
    <div>
      <div className="flex gap-0 mt-6 mb-4">
        <div className="w-1/2 bg-[#F0F4F2] rounded-l-lg">
          <div className="p-3 pl-3.5 font-bold font-lato text-lg">Solver 1</div>
          <select
            name="solver1"
            value={solver1}
            onChange={(event) => setSolver1(event.target.value)}
            className="w-full font-bold pl-3 bg-[#F0F4F2] px-6 py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-base rounded-b-lg block focus-visible:outline-none"
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {getOptionLabel(solver)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-1/2 bg-[#E1E5F2] rounded-r-lg">
          <div className="p-3 pl-3.5 font-bold font-lato text-lg ">
            Solver 2
          </div>
          <select
            name="solver2"
            value={solver2}
            onChange={(event) => setSolver2(event.target.value)}
            className="w-full pl-3 font-bold bg-[#E1E5F2] px-6 py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-base rounded-b-lg block focus-visible:outline-none"
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {getOptionLabel(solver)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="py-2">
        <div className="text-navy text-xl font-bold">Graphs</div>
        <p className="text-[#5D5D5D]">
          The benchmarks on the upper triangle of each graph are those where
          Solver 1 performs better, and those in the lower triangle are those
          where Solver 2 performs better
        </p>
      </div>
      <div className="flex gap-4">
        <div className="w-1/2">
          <ChartCompare
            chartData={chartData.map((d) => ({
              xaxis: d.d1.runtime,
              yaxis: d.d2.runtime,
              status: d.status,
              size: d.size,
              benchmark: d.benchmark,
            }))}
            title={{
              xaxis: solver1.replace("--", " (") + ") runtime (s)",
              yaxis: solver2.replace("--", " (") + ") runtime (s)",
            }}
            backgroundColor={{
              upper: "#F0F4F2",
              lower: "#E1E5F2",
            }}
          />
          <div className="w-full font-league text-lg text-dark-grey font-medium text-center mt-4">
            Runtime graph
          </div>
        </div>
        <div className="w-1/2">
          <ChartCompare
            chartData={chartData.map((d) => ({
              xaxis: d.d1.memoryUsage,
              yaxis: d.d2.memoryUsage,
              status: d.status,
              size: d.size,
              benchmark: d.benchmark,
            }))}
            title={{
              xaxis: solver1.replace("--", " (") + ") memory usage (MB)",
              yaxis: solver2.replace("--", " (") + ") memory usage (MB)",
            }}
            backgroundColor={{
              upper: "#F0F4F2",
              lower: "#E1E5F2",
            }}
          />
          <div className="w-full font-league text-lg text-dark-grey font-medium text-center mt-4">
            Memory usage graph
          </div>
        </div>
      </div>
    </div>
  )
}
export default SolverSelection
