import BenchmarksSection from "@/components/admin/BenchmarksSection"
import DetailSection from "@/components/admin/DetailSection"
import FilterSection from "@/components/admin/FilterSection"
import ResultsSection from "@/components/admin/ResultsSections"
import { AdminHeader, Navbar } from "@/components/shared"

const LandingPage = () => {
  return (
    <div className="bg-light-blue h-screen">
      <Navbar />
      <div className="ml-64 px-6">
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
