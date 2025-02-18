import { useSelector } from "react-redux"
// internal
import {
  AppIcon,
  DatabaseIcon,
  GraphBarIcon,
  LayoutGroupIcon,
  VectorSquareIcon,
} from "@/assets/icons"
import { useMemo } from "react"
import { IResultState } from "@/types/state"

const DetailSection = () => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults
  })

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData
  })

  const availableBenchmarksCount = Object.keys(rawMetaData).length

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers
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
      value: availableSolvers.length,
      icon: <VectorSquareIcon />,
      generateLabel: () => (
        <>
          Solvers:{" "}
          <span className="font-bold">
            {availableSolvers.length} {`(${avaliableVersion.length}`} versions
            {")"}
          </span>
        </>
      ),
    },
    {
      label: "Iteration",
      value: "1",
      icon: <LayoutGroupIcon />,
    },
    {
      label: "Benchmarks",
      value: availableBenchmarksCount,
      icon: <GraphBarIcon />,
      generateLabel: () => (
        <>
          Benchmarks:{" "}
          <span className="font-bold">
            {availableBenchmarksCount} {`(${avaliableInstance.length}`} instances
            {")"}
          </span>
        </>
      ),
    },
    {
      label: "Memory",
      value: "16 GB",
      icon: <DatabaseIcon />,
    },
    {
      label: "Timeout",
      value: "10 min",
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
