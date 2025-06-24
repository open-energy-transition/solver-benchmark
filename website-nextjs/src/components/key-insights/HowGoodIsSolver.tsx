import React from "react";
import Popup from "reactjs-popup";
import Note from "@/components/shared/Note";
import Link from "next/link";
import RealisticRuntimeComparison from "./charts/RealisticRuntimeComparison";
import SolverRuntimeComparison from "./charts/BenchmarkRuntimeComparison";

const HowGoodIsSolver = () => {
  return (
    <>
      <h4
        id="how-good-is-each-solver-and-for-what-cases"
        className="info-pages-heading"
      >
        How good is each solver, and for what cases?
      </h4>
      <p>
        The overall summary of our results is shown in the plot below, which
        shows the runtime of each solver, relative to the fastest solver, on
        each subset of our benchmark set. A problem on which a solver timed out
        or errored is assumed to have a runtime equal to the timeout with which
        it was run. We split our set of problems by{" "}
        <Popup
          on={["hover"]}
          trigger={() => <span>problem size*</span>}
          position="center center"
          closeOnDocumentClick
          arrow={false}
        >
          <div className="bg-white border-stroke border px-4 py-2 rounded-lg">
            (Small: number of variables &lt; 1e4; Medium: 1e4 &lt; number of
            variables &lt; 1e6; Large 1e6 &lt; number of variables)
          </div>
        </Popup>{" "}
        and also categorize certain problems as realistic if they arise from, or
        have similar model features as, models used in real-world energy
        planning studies. Hovering over any bar on the plot above will show you
        the average runtime of that solver on the subset of benchmarks, along
        with the percentage of benchmarks it could solve in the time limit.
      </p>
      <div className="my-4">
        <RealisticRuntimeComparison />
      </div>
      <p>
        The next plot shows the concrete performance of each solver on a few
        representative realistic problems from a few modelling frameworks in our
        benchmark set. Hover over the problem name in order to see more details
        about the benchmark features and why we consider it as representative
        for that modelling framework. Solvers that timed out or errored on a
        particular problem are indicated by red text above the corresponding
        bar. 4 out of the 7 problems can be solved by at least one open source
        solver, with different solvers (HiGHS or SCIP) providing the best
        performance on different problems.
      </p>
      <div className="my-4">
        <SolverRuntimeComparison />
      </div>

      <p>
        <Note>
          As with all benchmarks, our results provide only an indication of
          which solvers might be good for your problems. Our benchmark set is
          not yet as diverse and comprehensive as we would like, see the{" "}
          <a
            className="font-bold"
            href="#what-benchmark-problems-do-we-have-and-what-are-missing"
          >
            What benchmark problems do we have
          </a>{" "}
          section below to view the gaps in our benchmark set. We encourage
          users to use{" "}
          <a
            className="font-bold"
            href="https://github.com/open-energy-transition/solver-benchmark/"
          >
            our scripts
          </a>{" "}
          to benchmark solvers on their own problems before picking a solver,
          and also encourage modellers to contribute problems that can help us
          make our benchmark set more representative and diverse.{" "}
          <Link className="font-bold" href="/#contact">
            Reach out
          </Link>{" "}
          to us if you&apos;d like to contribute!
        </Note>
      </p>
    </>
  );
};

export default HowGoodIsSolver;
