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
      <div className="text-xl font-bold text-gray-800 mb-2">
        Number of Benchmarks Solved (Out of {totalBenchmarks})
      </div>
      <D3LineChart
        className="pl-0 lg:px-10"
        title="Number of Benchmarks Solved"
        height={300}
        chartData={numSolvedBenchMark}
        showHipoSolvers={false}
        maxYValue={totalBenchmarks}
        showMaxLine={true}
        xAxisTooltipFormat={(value) =>
          `<strong>Number of Benchmarks Solved:</strong> ${value}`
        }
      />
    </div>
  );
};
export default NumberBenchmarksSolved;
