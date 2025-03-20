import { useSelector } from "react-redux";
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection";
import DetailSection from "@/components/admin/DetailSection";
import FilterSection from "@/components/admin/FilterSection";
import ResultsSection from "@/components/admin/ResultsSections";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IResultState } from "@/types/state";

const LandingPage = () => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults;
  });

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
          <AdminHeader>
            <div className="flex text-navy text-sm text-opacity-50 items-center space-x-1">
              <div className="flex items-center gap-1">
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-[1.125rem] h-[1.125rem" />
                </Link>
                <ArrowIcon fill="none" className="size-3 stroke-navy" />
                <span className="self-center font-semibold whitespace-nowrap">
                  Main page
                </span>
              </div>
            </div>
          </AdminHeader>
          {/* Content */}
          <DetailSection />
          <FilterSection />
          {benchmarkResults.length ? <ResultsSection /> : <></>}
          <BenchmarksSection />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
