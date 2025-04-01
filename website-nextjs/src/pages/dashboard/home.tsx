import { useSelector } from "react-redux";
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection";
import DetailSection from "@/components/admin/DetailSection";
import FilterSection from "@/components/admin/FilterSection";
import ResultsSection from "@/components/admin/ResultsSections";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { HomeIcon, PreviousIcon } from "@/assets/icons";
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`px-2 sm:px-6 min-h-[calc(100vh-var(--footer-height))] transition-all ${
            isNavExpanded ? "md:ml-64" : "md:ml-20"
          }`}
        >
          <AdminHeader>
            <div className="flex text-navy text-xs sm:text-sm text-opacity-50 items-center space-x-1">
              <div className="flex items-center gap-1 ml-[-0.45rem]">
                <PreviousIcon width={20} className="fill-navy" />
                <Link href={PATH_DASHBOARD.root}>
                  <HomeIcon className="w-4 sm:w-[1.125rem] h-4 sm:h-[1.125rem]" />
                </Link>
                <span className="self-center font-semibold whitespace-nowrap">
                  Main page
                </span>
              </div>
            </div>
          </AdminHeader>
          <div className="space-y-4 sm:space-y-6">
            <DetailSection />
            <FilterSection />
            {benchmarkResults.length ? <ResultsSection /> : <></>}
            <BenchmarksSection />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
