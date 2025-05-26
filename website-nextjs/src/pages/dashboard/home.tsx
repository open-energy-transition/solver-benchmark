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
import { TIMEOUT_VALUES } from "@/constants/filter";

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("short");
  const timeout =
    activeTab === "short" ? TIMEOUT_VALUES.SHORT : TIMEOUT_VALUES.LONG;
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults;
  });

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  const Caveats = () => {
    return (
      <div className="pt-1.5 pb-3 px-5">
        <div className="text-navy font-bold text-xl 4xl:text-2xl">Caveats</div>
        <div className="text-navy text-sm block items-center mt-2">
          <span>
            Here are some key points to keep in mind when interpreting these
            results:
            <ul className="list-disc pl-5">
              <li>
                We run benchmarks on commercial cloud virtual machines (VMs) for
                efficiency and cost reasons. The shared nature of cloud
                resources means there is some error in our runtime measurements,
                which we estimate as a coefficient of variation of no larger
                than 4%. More details on this{" "}
                <a
                  href="https://github.com/open-energy-transition/solver-benchmark/blob/main/docs/Metrics_and_methodology.md"
                  className="underline"
                >
                  here
                </a>
                .
              </li>
              <li>
                All solvers are run with their default options, except for the
                duality gap tolerance for mixed integer benchmarks (MILPs),
                which we set to 1e-4. You can check the duality gaps for each
                solver in the benchmark details page corresponding to each
                benchmark instance.
              </li>
              <li>
                All results on this website use the runtime measured by our
                benchmarking script. This may not be the same as the runtime of
                the solving algorithm as reported by the solver, and it may
                include things like time for input file parsing and license
                checks. See more details and join the discussion on whether to
                use reported or measured runtime{" "}
                <a
                  href="https://github.com/open-energy-transition/solver-benchmark/issues/159"
                  className="underline"
                >
                  here
                </a>
                .
              </li>
              <li>
                Some solvers returned errors when running on some benchmark
                instances. For more details, please see the{" "}
                <a
                  href="https://github.com/open-energy-transition/solver-benchmark/issues/193"
                  className="underline"
                >
                  tracking issue
                </a>
                .
              </li>
            </ul>
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Main Results</title>
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
                      Main Results
                    </span>
                  </div>
                </div>
              </AdminHeader>
              <div className="font-lato font-bold text-2xl/1.4">
                Main Results
              </div>
              <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
                We run our benchmarks on 2 different configurations: The{" "}
                <b>Short</b> tab below contains results of the smaller
                benchmarks (less than a million variables), run with a 1 hour
                timeout on a smaller machine (c4-standard-2). The <b>Long</b>{" "}
                tab contains larger benchmarks (more than a million variables),
                run with a 10 hour timeout on a larger machine (c4-highmem-8).
                Select the desired tab to view a summary of the results on that
                configuration.
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
                      <div className="pt-2 text-xs/1.4 font-normal">
                        <b>🔔 Note:</b> As with all benchmarks, our results
                        provide only an indication of which solvers might be
                        good for your problems. We recommend using{" "}
                        <span className="underline">
                          <a href="https://github.com/open-energy-transition/solver-benchmark/">
                            our scripts
                          </a>
                        </span>{" "}
                        to benchmark on your own problems before picking a
                        solver See also the section on{" "}
                        <span className="underline">Caveats</span> below.
                      </div>
                    </div>
                    <BenchmarksSection timeout={timeout} />
                    <Caveats />
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
