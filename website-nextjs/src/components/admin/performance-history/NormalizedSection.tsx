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
    <div className="grid grid-cols-2 gap-4 w-full mb-1.5">
      <NormalizedSGMRuntime chartData={chartData.runtime} />
      <NormalizedSGMMemoryUsage chartData={chartData.memoryUsage} />
    </div>
  );
};
export default NormalizedSection;
