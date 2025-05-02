import { useSelector } from "react-redux";
// local
import BenchmarksSection from "@/components/admin/BenchmarksSection";
import ResultsSection from "@/components/admin/ResultsSections";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { HomeIcon, PreviousIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IResultState } from "@/types/state";
import ConfigurationSection from "@/components/admin/ConfigurationSection";
import FilterSection from "@/components/admin/FilterSection";
import { useState } from "react";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("short");
  const timeout = activeTab === "short" ? 3600 : 36000;
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults;
  });

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

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
          className={`
          min-h-[calc(100vh-var(--footer-height))]
          px-2
          sm:px-6
          transition-all
          text-navy
          ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
          `}
        >
          <div className="max-w-8xl mx-auto">
            <div>
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
              <div className="font-lato font-bold text-2xl/1.4">
                Main Results
              </div>
              <div className="font-lato font-normal/1.4 text-xs max-w-screen-lg">
                We run our benchmarks using 2 different configurations: Small
                benchmarks are run with a smaller timeout on a smaller machine,
                and Large benchmarks are run with a larger timeout on a larger
                machine. Select the appropriate tab below to view the results
                for each configuration.
              </div>
            </div>
            <div className="flex mt-6">
              <div
                onClick={() => setActiveTab("short")}
                className={`w-1/3 font-lato text-lg/1.5 cursor-pointer text-center border border-stroke border-b-0 py-3.5 rounded-se-[32px] rounded-ss-[32px] ${
                  activeTab === "short"
                    ? "bg-[#E6ECF5] font-semibold"
                    : "bg-white font-normal"
                }`}
              >
                Short
              </div>
              <div
                onClick={() => setActiveTab("long")}
                className={`w-1/3 font-lato text-lg/1.5 cursor-pointer text-center border border-stroke border-b-0 py-3.5 rounded-se-[32px] rounded-ss-[32px] ${
                  activeTab === "long"
                    ? "bg-[#E6ECF5] font-semibold"
                    : "bg-white font-normal"
                }`}
              >
                Long
              </div>
            </div>
            <div className="bg-[#E6ECF5] border border-stroke border-t-0 pb-6 px-8">
              <div className="pt-6 pb-8">
                <ConfigurationSection timeout={timeout} />
              </div>
              <div className="sm:flex justify-between">
                <div className="sm:x-0 sm:w-[224px] overflow-hidden bg-[#F4F6FA] rounded-xl h-max">
                  <FilterSection />
                </div>
                <div
                  className={`
                  pd:mx-0
                  3xl:mx-auto
                  sm:w-4/5 px-4
                  `}
                >
                  <div className="space-y-4 sm:space-y-6">
                    {benchmarkResults.length ? (
                      <ResultsSection timeout={timeout} />
                    ) : (
                      <></>
                    )}
                    <div className="px-5 py-2 text-navy font-lato border border-[#CAD9EF] bg-[#F7F7F9] rounded-2xl">
                      <div className="text-xl/1.4 font-bold">Note 🔔 ️</div>
                      <div className="pt-2 text-xs/1.4 font-normal">
                        As with all benchmarks, our results provide only an
                        indication of which solvers might be good for your
                        problems. We recommend using our scripts to benchmark on
                        your own problems before picking a solver See also the
                        section on <span className="underline">Caveats</span>{" "}
                        below.
                      </div>
                    </div>
                    <BenchmarksSection timeout={timeout} />
                    <div className="px-5">
                      <div className="pt-1.5 pb-3">
                        <div className="text-navy font-bold text-xl 4xl:text-2xl">
                          Caveats
                        </div>
                        <div className="text-navy text-sm block items-center mt-2">
                          <span>
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit, sed do eiusmod tempor incididunt ut labore et
                            dolore magna aliqua. Ut enim ad minim veniam, quis
                            nostrud
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
