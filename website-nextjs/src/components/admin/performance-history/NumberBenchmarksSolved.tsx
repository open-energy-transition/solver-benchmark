import D3LineChart from "@/components/shared/D3LineChart";
import { ISolverYearlyChartData } from "@/types/benchmark";

interface INumberBenchmarksSolved {
  numSolvedBenchMark: ISolverYearlyChartData[];
}

const NumberBenchmarksSolved = ({
  numSolvedBenchMark,
}: INumberBenchmarksSolved) => {
  return (
    <div className="pb-4">
      <p className="text-navy font-bold leading-1.5 mb-1.5 4xl:text-xl">
        Number of Benchmarks Solved
      </p>
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
