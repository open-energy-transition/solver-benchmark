import Popup from "reactjs-popup";
import { QuestionLineIcon } from "@/assets/icons";
// internal
import { ISolverYearlyChartData } from "@/types/benchmark";
import NormalizedSGMMemoryUsage from "./NormalizedSGMMemoryUsage";
import NormalizedSGMRuntime from "./NormalizedSGMRuntime";

interface INormalizedSection {
  chartData: {
    runtime: ISolverYearlyChartData[];
    memoryUsage: ISolverYearlyChartData[];
    numSolvedBenchMark: ISolverYearlyChartData[];
  };
}
const NormalizedSection = ({ chartData }: INormalizedSection) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mb-1.5">
        <NormalizedSGMRuntime chartData={chartData.runtime} />
        <NormalizedSGMMemoryUsage chartData={chartData.memoryUsage} />
      </div>
      <div className="font-lato font-normal/1.4 text-l max-w-screen-lg">
        <span>The above graphs show the shifted geometric mean (SGM</span>
        {/* TODO refactor this SGM popup and share the code with the home dashboard */}
        <span className="inline-flex gap-2">
          <Popup
            on={["hover"]}
            trigger={() => (
              <span className="flex items-baseline">
                <QuestionLineIcon
                  className="size-3.5 4xl:size-5"
                  viewBox="0 0 24 20"
                />
                )
              </span>
            )}
            position="right center"
            closeOnDocumentClick
            arrow={false}
          >
            <div className="bg-white border-stroke border px-4 py-2 m-4 rounded-lg break-words">
              The shifted geometric mean SGM of n non-negative numbers
              v[1],...v[n] is
              <br />
              <span className="ml-4">
                SGM = exp(sum{"{i in 1..n}"} ln(max(1, v[i] + sh)) / n) - sh
              </span>
              <br />
              We use sh = 10, and then we normalize the means by dividing them
              by the smallest mean.
            </div>
          </Popup>
        </span>{" "}
        of the runtime / memory consumption each solver version on all the
        benchmarks in the (filtered) set of instances that all solver versions
        have been run on. The SGMs have been normalized to the fastest /
        least-memory-consuming solver (across all versions), i.e. if a solver
        version has (normalized) SGM runtime of 1.25 it indicates that it is on
        average 25% slower than the best solver.
      </div>
    </>
  );
};
export default NormalizedSection;
