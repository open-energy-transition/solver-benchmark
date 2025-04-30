import { useSelector } from "react-redux";
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection";
import DetailSection from "@/components/admin/DetailSection";
import ResultsSection from "@/components/admin/ResultsSections";
import {
  AdminHeader,
  Footer,
  Navbar,
  ContentWrapper,
} from "@/components/shared";
import Head from "next/head";
import { HomeIcon, PreviousIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IResultState } from "@/types/state";
import ConfigurationSection from "@/components/admin/ConfigurationSection";

const LandingPage = () => {
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
        <ContentWrapper
          header={
            <AdminHeader>
              <div className="flex text-navy text-xs sm:text-sm text-opacity-50 items-center space-x-1">
                <div className="flex items-center gap-1 ml-[-0.45rem] 4xl:text-xl">
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
          }
        >
          <div className="space-y-4 sm:space-y-6">
            <ConfigurationSection />
            {benchmarkResults.length ? <ResultsSection /> : <></>}
            <BenchmarksSection />
          </div>
        </ContentWrapper>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
