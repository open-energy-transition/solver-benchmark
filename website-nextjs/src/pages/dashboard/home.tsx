import { useSelector } from "react-redux"
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection"
import DetailSection from "@/components/admin/DetailSection"
import FilterSection from "@/components/admin/FilterSection"
import ResultsSection from "@/components/admin/ResultsSections"
import { AdminHeader, Navbar } from "@/components/shared"


const LandingPage = () => {
  const isNavExpanded = useSelector((state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded)

  return (
    <div className="bg-light-blue h-screen">
      <Navbar />
      <div className={`px-6 ${isNavExpanded ? 'ml-64' : 'ml-20'}`}>
        <AdminHeader />
        {/* Content */}
        <DetailSection />
        <FilterSection />
        <ResultsSection />
        <BenchmarksSection />
      </div>
    </div>
  )
}

export default LandingPage
