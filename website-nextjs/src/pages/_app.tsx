import "@/styles/globals.css"
import { useEffect } from "react"

import type { AppProps } from "next/app"
import { Provider, useDispatch } from "react-redux"

// local
import { fontClasses } from "@/styles/fonts"
import { wrapper } from "@/redux/store"
import resultActions from "@/redux/results/actions"
import filterActions from "@/redux/filters/actions"
import AdminLayout from "@/pages/AdminLayout"
import { getBenchmarkResults, getLatestBenchmarkResult } from "@/utils/results"
import { getMetaData } from "@/utils/meta-data"
import { BenchmarkResult } from "@/types/benchmark"
import { IFilterState } from "@/types/state"

function App({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch()

  const { store, props } = wrapper.useWrappedStore(pageProps)

  useEffect(() => {
    const initializeData = async () => {
      const results = await getBenchmarkResults()
      const metaData = await getMetaData()

      const problemSizeResult: { [key: string]: string } = {}
      Object.keys(metaData).forEach((metaDataKey) => {
        metaData[metaDataKey].sizes.forEach((s) => {
          problemSizeResult[
            `${metaDataKey}'-'${s.name}`
          ] = s.size
        })
      })

      const uniqueValues = {
        sectors: new Set<string>(),
        techniques: new Set<string>(),
        kindOfProblems: new Set<string>(),
        models: new Set<string>(),
      }

      Object.keys(metaData).forEach((key) => {
        const { sectors, technique, kindOfProblem, modelName } = metaData[key]
        uniqueValues.sectors.add(sectors)
        uniqueValues.techniques.add(technique)
        uniqueValues.kindOfProblems.add(kindOfProblem)
        uniqueValues.models.add(modelName)
      })

      const availableSectors = Array.from(uniqueValues.sectors)
      const availableTechniques = Array.from(uniqueValues.techniques)
      const availableKindOfProblems = Array.from(uniqueValues.kindOfProblems)
      const availableModels = Array.from(uniqueValues.models)
      const availableProblemSizes = Array.from(
        new Set(
          Object.keys(problemSizeResult).map((key) => problemSizeResult[key])
        )
      )

      dispatch(resultActions.setMetaData(metaData))
      dispatch(resultActions.setBenchmarkResults(results as BenchmarkResult[]))
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(results as BenchmarkResult[])
        )
      )

      dispatch(resultActions.setRawMetaData(metaData))
      dispatch(
        resultActions.setAvailableFilterData({
          availableSectors,
          availableTechniques,
          availableKindOfProblems,
          availableModels,
          availableProblemSizes,
        })
      )
      dispatch(
        resultActions.setRawBenchmarkResults(results as BenchmarkResult[])
      )

      dispatch(
        filterActions.setFilter({
          sectors: availableSectors,
          technique: availableTechniques,
          kindOfProblem: availableKindOfProblems,
          modelName: availableModels,
          problemSize: availableProblemSizes,
        } as IFilterState)
      )
    }

    initializeData()
  }, [])

  const renderLayout = () => {
    return (
      <AdminLayout>
        <main
          className={`${fontClasses} bg-light-blue overflow-auto h-[calc(100vh-var(--banner-height))]`}
        >
          <Component {...props} />
        </main>
      </AdminLayout>
    )
  }
  return (
    <>
      <Provider store={store}>{renderLayout()}</Provider>
    </>
  )
}

export default wrapper.withRedux(App)
