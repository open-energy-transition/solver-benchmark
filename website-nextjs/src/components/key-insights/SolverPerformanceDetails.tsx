import React from "react";
import Note from "@/components/shared/Note";
import Link from "next/link";
import SolverRuntimeComparison from "./charts/BenchmarkRuntimeComparison";

const SolverPerformanceDetails = () => {
  return (
    <div className="info-pages-section">
      <div className="my-4">
        <SolverRuntimeComparison />
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
        <SolverRuntimeComparison
          extraCategoryLengthMargin={5}
          xAxisLabelWrapLength={2}
          splitter="_"
        />
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
    </div>
  );
};

export default SolverPerformanceDetails;
