import { useSelector } from "react-redux"
// local
import DetailSection from "@/components/admin/DetailSection"
import { AdminHeader, Footer, Navbar } from "@/components/shared"
import Head from "next/head"
import FilterSection from "@/components/admin/FilterSection"
import BenchmarkTableResult from "@/components/admin/benchmark-detail/BenchmarkTableResult"

const PageBenchmarkDetail = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  return (
    <>
      <Head>
        <title>Benchmark Detail</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${isNavExpanded ? "ml-64" : "ml-20"}`}>
          <AdminHeader />
          {/* Content */}
          <DetailSection />
          <div className="py-2">
            <div className="text-navy text-xl font-bold">Benchmarks</div>
            <p className="text-[#5D5D5D]">
              On this page you can see details of all the benchmarks on our
              platform, including their source and download links.
            </p>
          </div>
          <FilterSection />
          <BenchmarkTableResult />
        </div>
        <Footer />
      </div>
    </>
  )
}

export default PageBenchmarkDetail
