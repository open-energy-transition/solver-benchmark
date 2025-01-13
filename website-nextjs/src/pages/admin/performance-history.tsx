import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Navbar } from "@/components/shared"
import NumberBenchmarksSolved from "@/components/admin/performance-history/NumberBenchmarksSolved"
import NormalizedSection from "@/components/admin/performance-history/NormalizedSection"
import FilterSection from "@/components/admin/FilterSection"

const PagePerformanceHistory = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  return (
    <div className="bg-light-blue h-screen">
      <Navbar />
      <div className={`px-6 ${isNavExpanded ? "ml-64" : "ml-20"}`}>
        <AdminHeader />
        {/* Content */}
        <DetailSection />
        <FilterSection />
        <div className="mt-8 mb-5">
          <div className="text-navy text-xl leading-1.4 font-semibold">Solver Performance History</div>
          <div className="text-sm leading-1.4 text-[#5D5D5D]">
            We use the Shifted Geometric Mean (SGM) of runtime and memory
            consumption overall the benchmarks, and normalize according to the
            best performing solver version.
          </div>
        </div>
        <NormalizedSection />
        <NumberBenchmarksSolved />
      </div>
    </div>
  )
}

export default PagePerformanceHistory
