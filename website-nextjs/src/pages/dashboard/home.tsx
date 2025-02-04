import { useSelector } from "react-redux"
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection"
import DetailSection from "@/components/admin/DetailSection"
import FilterSection from "@/components/admin/FilterSection"
import ResultsSection from "@/components/admin/ResultsSections"
import { AdminHeader, Footer, Navbar } from "@/components/shared"
import Head from "next/head"

const LandingPage = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`px-6 min-h-[calc(100vh-var(--footer-height))] ${
            isNavExpanded ? "ml-64" : "ml-20"
          }`}
        >
          <AdminHeader />
          {/* Content */}
          <DetailSection />
          <FilterSection />
          <ResultsSection />
          <BenchmarksSection />
        </div>
      </div>
      <Footer />
    </>
  )
}

export default LandingPage
