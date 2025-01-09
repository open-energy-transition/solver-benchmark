import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Navbar } from "@/components/shared"
import SolverSelection from "@/components/admin/compare-solvers/SolverSelection"
import FilterSection from "@/components/admin/compare-solvers/FilterSection"


const PageCompareSolvers = () => {
  const isNavExpanded = useSelector((state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded)

  return (
    <div className="bg-light-blue h-screen">
      <Navbar />
      <div className={`px-6 ${isNavExpanded ? 'ml-64' : 'ml-20'}`}>
        <AdminHeader />
        <DetailSection />
        {/* Content */}
        <SolverSelection />
        <FilterSection />
      </div>
    </div>
  )
}

export default PageCompareSolvers
