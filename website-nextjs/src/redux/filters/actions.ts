import { AnyAction } from "redux"
import { RootState } from "@/redux/store"
import { ThunkAction } from "redux-thunk"
import resultActions from "@/redux/results/actions"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData, MetaDataEntry } from "@/types/meta-data"
import { getLatestBenchmarkResult } from "@/utils/results"
import { IFilterState } from "@/types/state"
import { getInstance } from "@/utils/meta-data"

const toggleFilter = (category: string, value: string, only: boolean) => {
  return {
    type: actions.TOGGLE_FILTER,
    payload: { category, value, only },
  }
}

const setFilter = (filterState: IFilterState) => {
  return {
    type: actions.SET_FILTER,
    payload: filterState,
  }
}

const actions = {
  TOGGLE_FILTER: "TOGGLE_FILTER",
  SET_FILTER: "SET_FILTER",
  setFilter,
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
          return (
            filters.kindOfProblem.includes(metaData.kindOfProblem) &&
            filters.technique.includes(metaData.technique) &&
            filters.sectors.includes(metaData.sectors) &&
            filters.modelName.includes(metaData.modelName)
          )
        })
      )

      const problemSizeResult: { [key: string]: string } = {}
      Object.keys(metaData).forEach((metaDataKey) => {
        if (!results.rawMetaData[metaDataKey]) {
          console.error(`Missing: ${metaDataKey}`);
          return
        };
        results.rawMetaData[metaDataKey].sizes.forEach((s) => {
          problemSizeResult[
            `${metaDataKey}'-'${getInstance(
              s.temporalResolution.toString(),
              s.spatialResolution.toString()
            )}`
          ] = s.size
        })
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
                filters.problemSize.includes(
                  problemSizeResult[
                    `${benchmark.benchmark}'-'${benchmark.size}`
                  ]
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
