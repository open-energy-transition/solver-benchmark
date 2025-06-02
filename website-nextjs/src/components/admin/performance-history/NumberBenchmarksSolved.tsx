import D3LineChart from "@/components/shared/D3LineChart";
import { ISolverYearlyChartData } from "@/types/benchmark";

interface INumberBenchmarksSolved {
  numSolvedBenchMark: ISolverYearlyChartData[];
  totalBenchmarks: number;
}

const NumberBenchmarksSolved = ({
  numSolvedBenchMark,
  totalBenchmarks,
}: INumberBenchmarksSolved) => {
  return (
    <div className="pb-4">
      <div className="tag-line font-bold mb-2">
        Number of Benchmarks Solved (Out of {totalBenchmarks})
      </div>
      <D3LineChart
        className="px-10"
        title="Number of Benchmarks Solved"
        height={300}
        chartData={numSolvedBenchMark}
        xAxisTooltipFormat={(value) =>
          `<strong>Number of Benchmarks Solved:</strong> ${value}`
        }
      />
    </div>
  );
};
export default NumberBenchmarksSolved;
