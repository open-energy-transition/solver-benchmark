import Popup from "reactjs-popup";
import { QuestionLineIcon } from "@/assets/icons";
// internal
import { ISolverYearlyChartData } from "@/types/benchmark";
import NormalizedSGMMemoryUsage from "./NormalizedSGMMemoryUsage";
import NormalizedSGMRuntime from "./NormalizedSGMRuntime";
import { SgmExplanation } from "@/components/shared";

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
      <p className="max-w-screen-lg">
        <span>The below graphs show the shifted geometric mean (SGM</span>
        <span className="inline-flex gap-2">
          <Popup
            on={["hover"]}
            trigger={() => (
              <span className="flex items-baseline">
                <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />)
              </span>
            )}
            position="right center"
            closeOnDocumentClick
            arrow={false}
          >
            <div className="bg-white border-stroke border px-4 py-2 m-4 rounded-lg break-words">
              <SgmExplanation />
            </div>
          </Popup>
        </span>{" "}
        of the runtime / memory consumption each solver version on all the
        benchmarks in the (filtered) set of instances that all solver versions
        have been run on. The SGMs have been normalized to the fastest /
        least-memory-consuming solver (across all versions), i.e. if a solver
        version has (normalized) SGM runtime of 1.25 it indicates that it is on
        average 25% slower than the best version of the best solver.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mt-2 mb-4">
        <NormalizedSGMRuntime chartData={chartData.runtime} />
        <NormalizedSGMMemoryUsage chartData={chartData.memoryUsage} />
      </div>
    </>
  );
};
export default NormalizedSection;
