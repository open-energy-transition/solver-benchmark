import "@/styles/globals.css"
import { useEffect } from "react"

import type { AppProps } from "next/app"
import { Provider, useDispatch } from "react-redux"

// local
import { fontClasses } from "@/styles/fonts"
import { wrapper } from "@/redux/store"
import resultActions from "@/redux/result/actions"
import AdminLayout from "@/pages/AdminLayout"
import { getBenchmarkResults } from "@/utils/results"

function App({ Component, pageProps }: AppProps) {
  const dispatch = useDispatch()

  const { store, props } = wrapper.useWrappedStore(pageProps)

  const initializeData = async () => {
    const results = await getBenchmarkResults()
    dispatch(resultActions.setBenchmarkResults(results))
  }

  useEffect(() => {
    initializeData()
  }, [])

  const renderLayout = () => {
    return (
      <AdminLayout>
        <main className={`${fontClasses} bg-light-blue overflow-auto h-screen`}>
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
