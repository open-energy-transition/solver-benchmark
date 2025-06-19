import { FooterLandingPage, Header } from "@/components/shared";

import SolverRuntimeComparison from "@/components/key-insights/charts/BenchmarkRuntimeComparison";
import ProblemClassTable from "@/components/key-insights/charts/ProblemClassTable";
import { PATH_DASHBOARD } from "@/constants/path";
import Popup from "reactjs-popup";
import React from "react";
import RealisticRuntimeComparison from "@/components/key-insights/charts/RealisticRuntimeComparison";
import Head from "next/head";

const useHash = () => {
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash;
};

const KeyInsightsPage = () => {
  const currentHash = useHash();

  const getLinkStyle = (hash: string) => {
    return `tag-line text-[#006D97] p-2 px-4 ${
      currentHash === hash
        ? "font-bold bg-[#6B90801A] border-r-8 border-[#6B9080] bg-opacity-10 rounded-e-md"
        : ""
    }`;
  };

  return (
    <div>
      <Head>
        <title>Key Insights</title>
        <meta name="description" content="Key insights" />
      </Head>
      <Header />
      <div className="bg-[#F5F4F4] mx-auto max-w-screen-4xl px-4 lg:px-[70px] relative pb-36">
        <h3 className="py-4.5 font-bold">Key Insights</h3>
        <div className="grid grid-cols-6 gap-2">
          <div className="col-start-1 col-end-2 py-8 px-0 bg-[#FAFAFACC] bg-opacity-80 h-max rounded-xl sticky top-[150px]">
            <div className="px-4">
              <h2 className="border-b border-[#D8E3F2] leading-snug">
                Content
              </h2>
            </div>
            <div className="flex flex-col mt-4">
              <div className={`${getLinkStyle("#key-insights")}`}>
                <a href="#key-insights">Key Insights</a>
              </div>
              <div
                className={getLinkStyle(
                  "#how-good-is-each-solver-and-for-what-cases",
                )}
              >
                <a href="#how-good-is-each-solver-and-for-what-cases">
                  How good is each solver, and for what cases?
                </a>
              </div>
              <div
                className={getLinkStyle(
                  "#what-is-feasible-for-open-source-solvers",
                )}
              >
                <a href="#what-is-feasible-for-open-source-solvers">
                  What is feasible for open source solvers?
                </a>
              </div>
            </div>
          </div>
          <div className="col-start-2 col-end-7 ml-4">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl">
                <h4 id="key-insights" className="scroll-mt-[9rem]">
                  Key Insights
                </h4>
                <p>
                  This platform contains the results of benchmarking 5
                  optimization solvers on 120 problems arising from energy
                  system models. For each benchmark run, we measure runtime and
                  memory consumption of the solver, along with{" "}
                  <a href="https://github.com/open-energy-transition/solver-benchmark/blob/main/docs/Metrics_and_methodology.md#metrics">
                    other metrics
                  </a>{" "}
                  to ensure solution quality across solvers. Note that we run
                  all solvers with their default options, with some exceptions –
                  see full details on our{" "}
                  <a href="https://github.com/open-energy-transition/solver-benchmark/blob/main/docs/Metrics_and_methodology.md">
                    Methodology
                  </a>{" "}
                  page. We also gather information such as the number of
                  variables and constraints for each problem instance, along
                  with information about the scenario being modelled by each
                  problem, this along with download links to each problem can be
                  found on our{" "}
                  <a href={PATH_DASHBOARD.benchmarkSet.list}>Benchmark Set</a>{" "}
                  page.
                </p>
                <p>
                  This page presents the main takeaways from our benchmark
                  platform, in an introductory and accessible manner. Advanced
                  users, and those wishing to dig into more details can visit
                  the
                  <a href={PATH_DASHBOARD.home}>full results</a> in our
                  interactive dashboards.
                </p>
              </div>
              <div className="rounded-xl">
                <h4
                  id="how-good-is-each-solver-and-for-what-cases"
                  className="scroll-mt-[9rem]"
                >
                  How good is each solver, and for what cases?
                </h4>
                <p>
                  The overall summary of our results is shown in the plot below,
                  which shows the runtime of each solver, relative to the
                  fastest solver, on each subset of our benchmark set. A problem
                  on which a solver timed out or errored is assumed to have a
                  runtime equal to the timeout with which it was run. We split
                  our set of problems by
                  <Popup
                    on={["hover"]}
                    trigger={() => <span>problem size*</span>}
                    position="right center"
                    closeOnDocumentClick
                    arrow={false}
                  >
                    <div className="bg-white border-stroke border px-4 py-2 rounded-lg">
                      {
                        "(Small: number of variables < 1e4; Medium: 1e4 < number of variables < 1e6; Large 1e6 < number of variables)"
                      }
                    </div>
                  </Popup>
                  and also categorize certain problems as realistic if they
                  arise from, or have similar model features as, models used in
                  real-world energy planning studies. Hovering over any bar on
                  the plot above will show you the average runtime of that
                  solver on the subset of benchmarks, along with the percentage
                  of benchmarks it could solve in the time limit.
                </p>
                <div className="my-4">
                  <RealisticRuntimeComparison />
                </div>
                <p>
                  The next plot shows the concrete performance of each solver on
                  a few representative realistic problems from a few modelling
                  frameworks in our benchmark set. Hover over the problem name
                  in order to see more details about the benchmark features and
                  why we consider it as representative for that modelling
                  framework. Solvers that timed out or errored on a particular
                  problem are indicated by red text above the corresponding bar.
                  4 out of the 7 problems can be solved by at least one open
                  source solver, with different solvers (HiGHS or SCIP)
                  providing the best performance on different problems.
                </p>
                <div className="my-4">
                  <SolverRuntimeComparison />
                </div>
                <p>
                  ⚠ Note: As with all benchmarks, our results provide only an
                  indication of which solvers might be good for your problems.
                  Our benchmark set is not yet as diverse and comprehensive as
                  we would like, see the What benchmark problems do we have
                  section below to view the gaps in our benchmark set. We
                  encourage users to use our scripts to benchmark solvers on
                  their own problems before picking a solver, and also encourage
                  modellers to contribute problems that can help us make our
                  benchmark set more representative and diverse. Reach out to us
                  if you’d like to contribute!
                </p>
              </div>
              <div className="rounded-xl">
                <h4
                  id="what-is-feasible-for-open-source-solvers"
                  className="scroll-mt-[9rem]"
                >
                  What is feasible for open source solvers?
                </h4>
                <p>
                  Here are the largest LP and MILP problems that open source
                  solvers can solve, from each modelling framework in our set.
                  Please note that we did not generate / collect benchmark
                  problems with the intention of finding the largest ones
                  solvable by open solvers – so there could be larger problems
                  solvable by open solvers than those in our set. This section
                  can still be used to get an idea of the kinds of spatial and
                  temporal resolutions that are solvable in reasonable time
                  periods by open source solvers, and we encourage the community
                  to contribute more benchmark problems so we can more
                  accurately identify the boundary of feasibility. Clicking on
                  any benchmark problem name takes you to the benchmark details
                  page that contains more information on the model scenario,
                  various size instances, full results on that problem, and
                  download links to the problem LP/MPS file and solver logs and
                  solution files.
                </p>
                <ProblemClassTable problemClass="LP" />
                <p>
                  The main takeaway from the above table is that model size, in
                  terms of number of variables/constraints, has a strong
                  influence on runtime. This is despite the fact that the above
                  problems do not share many features and are built with
                  different spatial/temporal resolutions and time horizons. It
                  is also interesting that a realistic TEMOA-based problem like
                  `temoa-US_9R_TS_NZ 9-12` does not have similar runtime to the
                  largest solved TIMES-based model (Times-Ireland-noco2-counties
                  26-1ts): despite both having {">"}1e6 variables.
                </p>
                <ProblemClassTable problemClass="MILP" />
                <p>
                  We note that we do not yet have large problem instances from
                  some modelling frameworks in our benchmark set. We welcome
                  contributions to fill these gaps!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterLandingPage
        wrapperClassName="bg-navy text-white"
        textClassName="text-white"
        descriptionTextClassName="text-white"
      />
    </div>
  );
};

export default KeyInsightsPage;
