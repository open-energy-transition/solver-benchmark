import { AnyAction } from "redux"
import { RootState } from "@/redux/store"
import { ThunkAction } from "redux-thunk"
import resultActions from "@/redux/results/actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData, MetaDataEntry } from "@/types/meta-data"
import { Sector } from "@/constants"

const toggleFilter = (category: string, value: string) => {
  return {
    type: actions.TOGGLE_FILTER,
    payload: { category, value },
  }
}
const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",

  toggleFilter,
  toggleFilterAndUpdateResults:
    (payload: {
      category: string
      value: string
    }): ThunkAction<void, RootState, unknown, AnyAction>  =>
    (dispatch, getState) => {
      dispatch(toggleFilter(payload.category, payload.value))

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

      const benchmarkResults = results.rawBenchmarkResults.filter(
        (benchmark: BenchmarkResult) =>
          (metaData[benchmark.benchmark] as MetaDataEntry)?.sizes?.find((size) => {
            const temporalResolution =
              size.temporalResolution === "NA"
                ? size.temporalResolution
                : `${size.temporalResolution}h`
            return (
              `${size.spatialResolution}-${temporalResolution}` ===
              benchmark.size
            )
          })
      )

      dispatch(resultActions.setMetaData(metaData as MetaData))

      dispatch(resultActions.setBenchmarkResults(benchmarkResults))
    },
}

export default actions
