import React from "react";
import Note from "@/components/shared/Note";
import Link from "next/link";
import RealisticRuntimeComparison from "./charts/RealisticRuntimeComparison";
import SolverRuntimeComparison from "./charts/BenchmarkRuntimeComparison";
import { QuestionLineIcon } from "@/assets/icons";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import InfoPopup from "../common/InfoPopup";
import { SgmExplanation } from "@/components/shared";

const HASH = "how-good-is-each-solver-and-for-what-cases";
const HowGoodIsSolver = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  return (
    <>
      <div id={HASH} className="scroll-mt-[9rem]" ref={sectionRef}>
        <div className="text-xl sm:text-[32px] font-lato font-bold sm:leading-1.3 tracking-normal text-navy info-pages-heading">
          How good is each solver, and for what cases?
        </div>
        <p>
          <span>
            To find out how good each solver is overall, we plot below the
            average (SGM
          </span>
          <span className="inline-flex gap-2">
            <InfoPopup
              trigger={() => (
                <span className="flex items-baseline">
                  <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />)
                </span>
              )}
              position="right center"
              closeOnDocumentClick
              arrow={false}
            >
              <div>
                <SgmExplanation />
              </div>
            </InfoPopup>
          </span>{" "}
          runtime of each solver, relative to the fastest solver, on all the LP
          and MILP problems in our benchmark set. A problem on which a solver
          timed out or errored is assumed to have a runtime equal to the timeout
          with which it was run. (More details, and other ways to handle time
          outs and errors, can be found on our{" "}
          <Link className="font-bold" href="/dashboard/main-results">
            main dashboard
          </Link>
          ). We group our set of problems according to problem size
          <span className="inline-flex gap-2">
            <InfoPopup
              trigger={() => (
                <span className="flex items-baseline my-auto cursor-pointer">
                  <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
                </span>
              )}
              position="right center"
              closeOnDocumentClick
              arrow={false}
            >
              <div>
                <b>Small</b>: number of variables &lt; 1e4
                <br />
                <b>Medium</b>: 1e4 ≤; number of variables &lt; 1e6
                <br />
                <b>Large</b> 1e6 ≤; number of variables
              </div>
            </InfoPopup>
          </span>{" "}
          and also categorize certain problems as realistic if they arise from,
          or have similar model features as, models used in real-world energy
          planning studies. Hovering over any bar on the plot above will show
          you the average runtime of that solver on the subset of benchmarks,
          along with the percentage of benchmarks it could solve in the time
          limit.
        </p>
        <div className="my-4">
          <RealisticRuntimeComparison rotateXAxisLabels />
        </div>
        <div className="my-4">
          <RealisticRuntimeComparison problemClass="MILP" rotateXAxisLabels />
        </div>
        <p>
          The next plot shows the concrete performance of each solver on a few
          representative realistic problems from a few modelling frameworks in
          our benchmark set. Hover over the problem name in order to see more
          details about the benchmark features and why we consider it as
          representative for that modelling framework. Solvers that timed out or
          errored on a particular problem are indicated by red text above the
          corresponding bar.
        </p>
        <div className="my-4">
          <SolverRuntimeComparison
            xAxisLabelRotation={-48}
            splitter="  "
            xAxisLabelWrapLength={3}
            extraCategoryLengthMargin={5}
          />
        </div>
        <p>
          {" "}
          4 out of the 7 problems can be solved by at least one open source
          solver, with different solvers (HiGHS or SCIP) providing the best
          performance on different problems.
        </p>

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
    </>
  );
};

export default HowGoodIsSolver;
