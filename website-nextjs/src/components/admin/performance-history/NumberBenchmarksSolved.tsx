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
      <p className="text-navy font-bold leading-1.5 mb-3 4xl:text-xl">
        Number of Benchmarks Solved (Out of {totalBenchmarks})
      </p>
      <D3LineChart
        className="px-10"
        title="Number of Benchmarks Solved"
        height={300}
        chartData={numSolvedBenchMark}
        xAxisTooltipFormat={(value) =>
          `<strong>Number of Benchmarks Solved:</strong> ${value}`
        }
        yDomain={[0, totalBenchmarks]}
        showMaxLine={true}
      />
    </div>
  );
};
export default NumberBenchmarksSolved;
