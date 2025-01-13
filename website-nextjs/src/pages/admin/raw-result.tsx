import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Navbar } from "@/components/shared"
import TableResult from "@/components/admin/raw-result/TableResult"

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
        <TableResult />
      </div>
    </div>
  )
}

export default PagePerformanceHistory
