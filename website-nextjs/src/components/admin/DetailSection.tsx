import { useSelector } from "react-redux"
// internal
import {
  AppIcon,
  DatabaseIcon,
  GraphBarIcon,
  LayoutGroupIcon,
  VectorSquareIcon,
} from "@/assets/icons"
import { ResultState } from "@/redux/results/reducer"
import { useMemo } from "react"

const DetailSection = () => {
  const benchmarkResults = useSelector(
    (state: { results: ResultState }) => {
      return state.results.benchmarkResults
    }
  )

  const availableBenchmarks = useSelector((state: { results: ResultState }) => {
    return state.results.availableBenchmarks
  })

  const availableSolves = useSelector((state: { results: ResultState }) => {
    return state.results.availableSolves
  })

  const avaliableVersion = useMemo(
    () =>
      Array.from(
        new Set(benchmarkResults.map((result) => result.solverVersion))
      ),
    [benchmarkResults]
  )

  const avaliableInstance = useMemo(
    () =>
      Array.from(
        new Set(
          benchmarkResults.map((result) => `${result.benchmark}-${result.size}`)
        )
      ),
    [benchmarkResults]
  )

  const detailData = [
    {
      label: "Solvers",
      value: availableSolves.length,
      icon: <VectorSquareIcon />,
      generateLabel: () =>
        `Solvers: ${availableSolves.length} (${avaliableVersion.length} versions)`,
    },
    {
      label: "Iteration",
      value: "1",
      icon: <LayoutGroupIcon />,
    },
    {
      label: "Benchmarks",
      value: availableBenchmarks.length,
      icon: <GraphBarIcon />,
      generateLabel: () =>
        `Benchmarks: ${availableSolves.length} (${avaliableInstance.length} instances)`,
    },
    {
      label: "Memory",
      value: "16 GB",
      icon: <DatabaseIcon />,
    },
    {
      label: "Timeout",
      value: "15 min",
      icon: <DatabaseIcon />,
    },
    {
      label: "vCPUs",
      value: "2 (1 core)",
      icon: <AppIcon />,
    },
  ]

  return (
    <div className="bg-white rounded-xl py-4 px-12">
      <ul className="flex justify-between text-dark-grey">
        {detailData.map((data, idx) => (
          <li key={idx} className="text-base flex items-center">
            {data.icon}
            {data.generateLabel ? (
              <div className="ml-1">{data.generateLabel()}</div>
            ) : (
              <div className="ml-1">
                <span className="ml-1">
                  {data.label}
                  {":"}
                </span>
                <span className="font-bold ml-1">{data.value}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
export default DetailSection
