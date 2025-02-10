import "@/styles/globals.css"
import { useEffect } from "react"

import type { AppProps } from "next/app"
import { Provider, useDispatch } from "react-redux"

// local
import { fontClasses } from "@/styles/fonts"
import { wrapper } from "@/redux/store"
import resultActions from "@/redux/results/actions"
import AdminLayout from "@/pages/AdminLayout"
import { getBenchmarkResults, getLatestBenchmarkResult } from "@/utils/results"
import { getMetaData } from "@/utils/meta-data"
import { BenchmarkResult } from "@/types/benchmark"
import { MetaData } from "@/types/meta-data"

function App({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch()

  const { store, props } = wrapper.useWrappedStore(pageProps)

  useEffect(() => {
    const initializeData = async () => {
      const results = await getBenchmarkResults()
      const metaData = await getMetaData()
      dispatch(resultActions.setMetaData(metaData as MetaData))
      dispatch(resultActions.setBenchmarkResults(results as BenchmarkResult[]))
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(results as BenchmarkResult[])
        )
      )
      dispatch(resultActions.setRawMetaData(metaData as MetaData))
      dispatch(
        resultActions.setRawBenchmarkResults(results as BenchmarkResult[])
      )
    }

    initializeData()
  }, [])

  const renderLayout = () => {
    return (
      <AdminLayout>
        <main className={`${fontClasses} bg-light-blue overflow-auto h-[calc(100vh-var(--banner-height))]`}>
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
