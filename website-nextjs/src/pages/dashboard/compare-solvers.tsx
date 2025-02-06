import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Footer, Navbar } from "@/components/shared"
import SolverSelection from "@/components/admin/compare-solvers/SolverSelection"
import Head from "next/head"
import FilterSection from "@/components/admin/FilterSection"
import { ResultState } from "@/redux/results/reducer"
import { NoSolverPage } from "@/components/admin/compare-solvers/NoSolverPage"

const PageCompareSolvers = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  const solversData = useSelector((state: { results: ResultState }) => {
    return state.results.solversData
  })

  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))]
           ${isNavExpanded ? "ml-64" : "ml-20"}`}
        >
          <AdminHeader />

          {/* Content */}
          {(solversData.length < 2) ? (
            <NoSolverPage />
          ) : (
            <>
              <DetailSection />
              <FilterSection />
              <SolverSelection />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default PageCompareSolvers
