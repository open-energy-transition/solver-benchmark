import "@/styles/globals.css"

import type { AppProps } from "next/app"
import { Provider } from "react-redux"
import { fontClasses } from "@/styles/fonts"

// local
import { wrapper } from "@/redux/store"
import AdminLayout from "@/pages/AdminLayout"

function App({ Component, pageProps }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(pageProps)

  const renderLayout = () => {

    return (
      <AdminLayout>
        <main className={`${fontClasses}`}>
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
