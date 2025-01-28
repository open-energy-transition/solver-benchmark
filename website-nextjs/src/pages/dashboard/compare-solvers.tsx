import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Navbar } from "@/components/shared"
import SolverSelection from "@/components/admin/compare-solvers/SolverSelection"
import FilterSection from "@/components/admin/compare-solvers/FilterSection"
import SolversGraphSection from "@/components/admin/compare-solvers/SolversGraphSection"
import Head from "next/head"

const PageCompareSolvers = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
      </Head>
      <div className="bg-light-blue h-screen">
        <Navbar />
        <div className={`px-6 ${isNavExpanded ? "ml-64" : "ml-20"}`}>
          <AdminHeader />
          <DetailSection />
          {/* Content */}
          <SolverSelection />
          <FilterSection />
          <SolversGraphSection />
        </div>
      </div>
    </>
  )
}

export default PageCompareSolvers
