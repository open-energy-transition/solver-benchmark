import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
// local
import ResultsSection from "@/components/admin/ResultsSections";
import { AdminHeader, Footer, Navbar } from "@/components/shared";
import Head from "next/head";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { IResultState } from "@/types/state";
import ConfigurationSection from "@/components/admin/ConfigurationSection";
import FilterSection from "@/components/admin/FilterSection";
import { TIMEOUT_VALUES } from "@/constants/filter";
import BenchmarkSet from "@/components/admin/home/BenchmarkSet";
import { useIsMobile } from "@/hooks/useIsMobile";

const LandingPage = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState("short");

  // Set tab from URL on mount or when query changes
  useEffect(() => {
    if (typeof tab === "string") {
      setActiveTab(tab);
    }
  }, [tab]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: newTab },
      },
      undefined,
      { shallow: true },
    );
  };
  const timeout =
    activeTab === "short" ? TIMEOUT_VALUES.SHORT : TIMEOUT_VALUES.LONG;
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults;
  });
  const isMobile = useIsMobile();

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  const Caveats = () => {
    return (
      <div className="pt-1.5 pb-3 px-2 md:px-5" id="caveats">
        <h6>Caveats</h6>
        <div className="text-navy tag-line-xs leading-1.4 block items-center">
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
                <Link className="font-bold" href="/methodology">
                  here
                </Link>
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
                <Link
                  className="font-bold"
                  href="https://github.com/open-energy-transition/solver-benchmark/issues/159"
                >
                  here
                </Link>
                .
              </li>
              <li>
                Some solvers returned errors when running on some benchmark
                instances. For more details, please see the{" "}
                <Link
                  className="font-bold"
                  href="https://github.com/open-energy-transition/solver-benchmark/issues/193"
                >
                  tracking issue
                </Link>
                .
              </li>
            </ul>
            For more details, please see our{" "}
            <Link
              href="/methodology"
              className="hover:underline underline-offset-4 font-bold"
            >
              Methodology
            </Link>{" "}
            page.
          </span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight - 40);
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateHeight);
    }, 0);

    // Add window resize listener
    window.addEventListener("resize", updateHeight);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateHeight);
    };
  }, [benchmarkResults, timeout, isMobile]);

  return (
    <>
      <Head>
        <title>Main Results | Open Energy Benchmark</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="bg-light-blue">
        <Navbar />
        <div
          className={`
          min-h-[calc(100vh-var(--footer-height))]
          mt-16
          md:mt-10
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
                <div className="flex text-navy text-opacity-70 items-center space-x-1">
                  <div className="flex items-center gap-1">
                    <Link
                      href={PATH_DASHBOARD.root}
                      aria-label="Dashboard home"
                    >
                      <HomeIcon className="w-4 sm:w-[1.125rem] h-4 sm:h-[1.125rem]" />
                    </Link>
                    <ArrowIcon fill="none" className="size-3 stroke-navy" />
                    <p className="self-center font-semibold whitespace-nowrap text-opacity-70">
                      Main Results
                    </p>
                  </div>
                </div>
              </AdminHeader>
              <h5>Main Results</h5>
              <p className="mb-6 mt-4 max-w-screen-lg">
                We run our benchmarks on 2 different configurations: The{" "}
                <b>Short</b> tab below contains results of the smaller
                benchmarks (less than a million variables), run with a 1 hour
                timeout on a less powerful machine. The <b>Long</b> tab contains
                larger benchmarks (more than a million variables), run with a 10
                hour timeout on a more powerful machine. Select the desired tab
                to view a summary of the results on that configuration, along
                with the technical specifications of the machine used.
              </p>
            </div>
            <div className="flex">
              <div
                onClick={() => handleTabChange("short")}
                className={`w-1/3 tag-line cursor-pointer text-center border border-stroke border-b-0 py-3.5 rounded-se-[32px] rounded-ss-[32px] ${
                  activeTab === "short"
                    ? "bg-[#E6ECF5] font-semibold"
                    : "bg-white font-normal text-dark-grey"
                }`}
              >
                Short
              </div>
              <div
                onClick={() => handleTabChange("long")}
                className={`w-1/3 tag-line cursor-pointer text-center border border-stroke border-b-0 py-3.5 rounded-se-[32px] rounded-ss-[32px] ${
                  activeTab === "long"
                    ? "bg-[#E6ECF5] font-semibold"
                    : "bg-white font-normal text-dark-grey"
                }`}
              >
                Long
              </div>
            </div>
            <div className="gap-6 flex flex-col bg-[#E6ECF5] border border-stroke border-t-0 pb-6 px-4 rounded-r-lg">
              <div className="pt-6">
                <ConfigurationSection timeout={timeout} />
              </div>
              <div className="sm:flex justify-between gap-5">
                <div className="mb-4 md:mb-0 md:max-w-[255px] bg-[#F4F6FA] rounded-xl">
                  <FilterSection height={`${contentHeight}px`} />
                </div>
                <div
                  id="benchmark-results"
                  className="3xl:mx-auto sm:w-4/5 h-max"
                  ref={contentRef}
                >
                  <div className="space-y-4 sm:space-y-6 min-h-96">
                    {benchmarkResults.length ? (
                      <ResultsSection timeout={timeout} />
                    ) : (
                      <div className="px-6 py-4 text-navy font-lato border border-[#CAD9EF] bg-[#F4F6FA] rounded-2xl flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-navy"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <h6 className="font-semibold mb-1">
                            No benchmark instances match the selected filters.
                          </h6>
                        </div>
                      </div>
                    )}
                    <div className="px-2 md:px-5 py-2 text-navy font-lato border border-[#CAD9EF] bg-[#F7F7F9] rounded-2xl">
                      <div className="tag-line-xs leading-1.5">
                        <b>Note:</b> As with all benchmarks, our results provide
                        only an indication of which solvers might be good for
                        your problems.
                        <br />
                        We recommend using{" "}
                        <span className="hover:underline underline-offset-4  font-bold">
                          <Link
                            className="font-bold"
                            href="https://github.com/open-energy-transition/solver-benchmark/?tab=readme-ov-file#running-benchmarks"
                          >
                            our scripts
                          </Link>
                        </span>{" "}
                        to benchmark on your own problems before picking a
                        solver. See also the section on{" "}
                        <Link
                          href="#caveats"
                          className="hover:underline underline-offset-4 font-bold"
                        >
                          Caveats
                        </Link>{" "}
                        below.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <BenchmarkSet />
              <Caveats />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
