import { AnyAction } from "redux"
import { RootState } from "@/redux/store"
import { ThunkAction } from "redux-thunk"
import resultActions from "@/redux/results/actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData, MetaDataEntry } from "@/types/meta-data"
import { ProblemSize, Sector } from "@/constants"
import { getHighestVersion } from "@/utils/versions"
import { getLatestBenchmarkResult, getProblemSize } from "@/utils/results"

const toggleFilter = (category: string, value: string, only: boolean) => {
  return {
    type: actions.TOGGLE_FILTER,
    payload: { category, value, only },
  }
}
const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",

  toggleFilter,
  toggleFilterAndUpdateResults:
    (payload: {
      category: string
      value: string
      only: boolean
    }): ThunkAction<void, RootState, unknown, AnyAction> =>
    (dispatch, getState) => {
      dispatch(toggleFilter(payload.category, payload.value, payload.only))
      const { filters, results } = getState()

      const metaData = Object.fromEntries(
        Object.entries(results.rawMetaData).filter(([, _metaData]) => {
          const metaData = _metaData as MetaDataEntry
          const filterSector = metaData.sectors.includes("Sector-coupled")
            ? "Sector-coupled"
            : metaData.sectors
          return (
            filters.kindOfProblem.includes(metaData.kindOfProblem) &&
            filters.technique.includes(metaData.technique) &&
            filters.sectors.includes(filterSector as Sector) &&
            filters.modelName.includes(metaData.modelName)
          )
        })
      )

      const latestHighVersion = getHighestVersion(
        Array.from(
          new Set(
            results.benchmarkResults
              .filter((result) => result.solver === "highs")
              .map((result) => result.solverVersion)
          )
        )
      )

      const problemSizeResult: { [key: string]: ProblemSize } = {}
      results.rawBenchmarkResults
        .filter(
          (result: BenchmarkResult) =>
            result.solver === "highs" &&
            result.solverVersion === latestHighVersion
        )
        .forEach((result: BenchmarkResult) => {
          problemSizeResult[`${result.benchmark}'-'${result.size}`] =
            getProblemSize(result.runtime)
        })

      const benchmarkResults: BenchmarkResult[] =
        results.rawBenchmarkResults.filter((benchmark: BenchmarkResult) =>
          (metaData[benchmark.benchmark] as MetaDataEntry)?.sizes?.find(
            (size) => {
              const temporalResolution =
                size.temporalResolution === "NA"
                  ? size.temporalResolution
                  : `${size.temporalResolution}h`
              return (
                `${size.spatialResolution}-${temporalResolution}` ===
                  benchmark.size &&
                // filters.problemSize.includes(getProblemSize(benchmark.runtime))
                filters.problemSize.includes(
                  problemSizeResult[`${benchmark.benchmark}'-'${benchmark.size}`]
                )
              )
            }
          )
        )

      dispatch(resultActions.setMetaData(metaData as MetaData))

      dispatch(resultActions.setBenchmarkResults(benchmarkResults))
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(benchmarkResults)
        )
      )
    },
}

export default actions
