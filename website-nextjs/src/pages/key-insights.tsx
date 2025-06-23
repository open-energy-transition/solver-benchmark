import React from "react";
import {
  PageLayout,
  TableOfContents,
  ContentSection,
} from "@/components/info-pages";
import SolverRuntimeComparison from "@/components/key-insights/charts/BenchmarkRuntimeComparison";
import ProblemClassTable from "@/components/key-insights/charts/ProblemClassTable";
import { PATH_DASHBOARD } from "@/constants/path";
import Popup from "reactjs-popup";
import RealisticRuntimeComparison from "@/components/key-insights/charts/RealisticRuntimeComparison";
import SolverPerformanceHistory from "@/components/key-insights/SolverPerformanceHistory";
import FactorsAffectingPerformanceInsights from "@/components/key-insights/FactorsAffectingPerformanceInsights";

const KeyInsightsPage = () => {
  const tocItems = [
    {
      hash: "#how-good-is-each-solver-and-for-what-cases",
      label: "How good is each solver, and for what cases?",
    },
    {
      hash: "#what-is-feasible-for-open-source-solvers",
      label: "What is feasible for open source solvers?",
    },
    {
      hash: "#how-are-solvers-evolving-over-time",
      label: "How are solvers evolving over time?",
    },
    {
      hash: "#what-factors-affect-solver-performance",
      label: "What factors affect solver performance?",
    },
  ];

  return (
    <PageLayout title="Key Insights" description="Key insights">
      <TableOfContents items={tocItems} />
      <ContentSection>
        <div className="info-pages-content">
          <div className="info-pages-section">
            <p>
              This platform contains the results of benchmarking 5 optimization
              solvers on 120 problems arising from energy system models. For
              each benchmark run, we measure runtime and memory consumption of
              the solver, along with{" "}
              <a href="https://github.com/open-energy-transition/solver-benchmark/blob/main/docs/Metrics_and_methodology.md#metrics">
                other metrics
              </a>{" "}
              to ensure solution quality across solvers. Note that we run all
              solvers with their default options, with some exceptions – see
              full details on our{" "}
              <a href="https://github.com/open-energy-transition/solver-benchmark/blob/main/docs/Metrics_and_methodology.md">
                Methodology
              </a>{" "}
              page. We also gather information such as the number of variables
              and constraints for each problem instance, along with information
              about the scenario being modelled by each problem, this along with
              download links to each problem can be found on our{" "}
              <a href={PATH_DASHBOARD.benchmarkSet.list}>Benchmark Set</a> page.
            </p>
            <p>
              This page presents the main takeaways from our benchmark platform,
              in an introductory and accessible manner. Advanced users, and
              those wishing to dig into more details can visit the{" "}
              <a href={PATH_DASHBOARD.home}>full results</a> in our interactive
              dashboards.
            </p>
          </div>
          <div className="info-pages-section">
            <h4
              id="how-good-is-each-solver-and-for-what-cases"
              className="info-pages-heading"
            >
              How good is each solver, and for what cases?
            </h4>
            <p>
              The overall summary of our results is shown in the plot below,
              which shows the runtime of each solver, relative to the fastest
              solver, on each subset of our benchmark set. A problem on which a
              solver timed out or errored is assumed to have a runtime equal to
              the timeout with which it was run. We split our set of problems by{" "}
              <Popup
                on={["hover"]}
                trigger={() => <span>problem size*</span>}
                position="right center"
                closeOnDocumentClick
                arrow={false}
              >
                <div className="bg-white border-stroke border px-4 py-2 rounded-lg">
                  (Small: number of variables &lt; 1e4; Medium: 1e4 &lt; number
                  of variables &lt; 1e6; Large 1e6 &lt; number of variables)
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
                    periods by open source solvers, and we encourage the
                    community to contribute more benchmark problems so we can
                    more accurately identify the boundary of feasibility.
                    Clicking on any benchmark problem name takes you to the
                    benchmark details page that contains more information on the
                    model scenario, various size instances, full results on that
                    problem, and download links to the problem LP/MPS file and
                    solver logs and solution files.
                  </p>
                  <ProblemClassTable problemClass="LP" />
                  <p>
                    The main takeaway from the above table is that model size,
                    in terms of number of variables/constraints, has a strong
                    influence on runtime. This is despite the fact that the
                    above problems do not share many features and are built with
                    different spatial/temporal resolutions and time horizons. It
                    is also interesting that a realistic TEMOA-based problem
                    like `temoa-US_9R_TS_NZ 9-12` does not have similar runtime
                    to the largest solved TIMES-based model
                    (Times-Ireland-noco2-counties 26-1ts): despite both having{" "}
                    {">"}1e6 variables.
                  </p>
                  <ProblemClassTable problemClass="MILP" />
                  <p>
                    We note that we do not yet have large problem instances from
                    some modelling frameworks in our benchmark set. We welcome
                    contributions to fill these gaps!
                  </p>
                </div>
                <div className="rounded-xl">
                  <SolverPerformanceHistory />
                </div>
                <div className="rounded-xl">
                  <FactorsAffectingPerformanceInsights />
                </div>
              </Popup>{" "}
              and also categorize certain problems as realistic if they arise
              from, or have similar model features as, models used in real-world
              energy planning studies. Hovering over any bar on the plot above
              will show you the average runtime of that solver on the subset of
              benchmarks, along with the percentage of benchmarks it could solve
              in the time limit.
            </p>
            <div className="my-4">
              <RealisticRuntimeComparison />
            </div>
            <p>
              The next plot shows the concrete performance of each solver on a
              few representative realistic problems from a few modelling
              frameworks in our benchmark set. Hover over the problem name in
              order to see more details about the benchmark features and why we
              consider it as representative for that modelling framework.
              Solvers that timed out or errored on a particular problem are
              indicated by red text above the corresponding bar. 4 out of the 7
              problems can be solved by at least one open source solver, with
              different solvers (HiGHS or SCIP) providing the best performance
              on different problems.
            </p>
            <div className="my-4">
              <SolverRuntimeComparison />
            </div>
            <p>
              ⚠ Note: As with all benchmarks, our results provide only an
              indication of which solvers might be good for your problems. Our
              benchmark set is not yet as diverse and comprehensive as we would
              like, see the What benchmark problems do we have section below to
              view the gaps in our benchmark set. We encourage users to use our
              scripts to benchmark solvers on their own problems before picking
              a solver, and also encourage modellers to contribute problems that
              can help us make our benchmark set more representative and
              diverse. Reach out to us if you&apos;d like to contribute!
            </p>
          </div>
          <div className="info-pages-section">
            <h4
              id="what-is-feasible-for-open-source-solvers"
              className="info-pages-heading"
            >
              What is feasible for open source solvers?
            </h4>
            <p>
              Here are the largest LP and MILP problems that open source solvers
              can solve, from each modelling framework in our set. Please note
              that we did not generate / collect benchmark problems with the
              intention of finding the largest ones solvable by open solvers –
              so there could be larger problems solvable by open solvers than
              those in our set. This section can still be used to get an idea of
              the kinds of spatial and temporal resolutions that are solvable in
              reasonable time periods by open source solvers, and we encourage
              the community to contribute more benchmark problems so we can more
              accurately identify the boundary of feasibility. Clicking on any
              benchmark problem name takes you to the benchmark details page
              that contains more information on the model scenario, various size
              instances, full results on that problem, and download links to the
              problem LP/MPS file and solver logs and solution files.
            </p>
            <ProblemClassTable problemClass="LP" />
            <p>
              The main takeaway from the above table is that model size, in
              terms of number of variables/constraints, has a strong influence
              on runtime. This is despite the fact that the above problems do
              not share many features and are built with different
              spatial/temporal resolutions and time horizons. It is also
              interesting that a realistic TEMOA-based problem like
              `temoa-US_9R_TS_NZ 9-12` does not have similar runtime to the
              largest solved TIMES-based model (Times-Ireland-noco2-counties
              26-1ts): despite both having &gt;1e6 variables.
            </p>
            <ProblemClassTable problemClass="MILP" />
            <p>
              We note that we do not yet have large problem instances from some
              modelling frameworks in our benchmark set. We welcome
              contributions to fill these gaps!
            </p>
          </div>
          <div className="info-pages-section">
            <SolverPerformanceHistory />
          </div>
          <div className="info-pages-section">
            <FactorsAffectingPerformanceInsights />
          </div>
        </div>
      </ContentSection>
    </PageLayout>
  );
};

export default KeyInsightsPage;
