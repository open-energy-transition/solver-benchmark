import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import BenchMarkDetailSection from "@/components/admin/benchmark-detail/DetailSection"
import { AdminHeader, Footer, Navbar } from "@/components/shared"
import GraphSection from "@/components/admin/benchmark-detail/GraphSection"
import Head from "next/head"

const PageBenchmarkDetail = () => {
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
          {/* Content */}
          <DetailSection />
          <BenchMarkDetailSection />
          <GraphSection />
        </div>
        <Footer />
      </div>
    </>
  )
}

export default PageBenchmarkDetail
