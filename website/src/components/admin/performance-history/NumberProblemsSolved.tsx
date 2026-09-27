import D3LineChart from "@/components/shared/D3LineChart";
import { ISolverYearlyChartData } from "@/types/benchmark";

interface INumberProblemsSolved {
  numSolvedProblems: ISolverYearlyChartData[];
  totalProblems: number;
}

const NumberProblemsSolved = ({
  numSolvedProblems,
  totalProblems,
}: INumberProblemsSolved) => {
  return (
    <div className="pb-4">
      <div className="text-xl font-bold text-gray-800 mb-2">
        Number of Problems Solved (Out of {totalProblems})
      </div>
      <D3LineChart
        className="pl-0 lg:px-10"
        title="Number of Problems Solved"
        height={300}
        chartData={numSolvedProblems}
        showHipoSolvers={false}
        maxYValue={totalProblems}
        showMaxLine={true}
        xAxisTooltipFormat={(value) =>
          `<strong>Number of Problems Solved:</strong> ${value}`
        }
      />
    </div>
  );
};
export default NumberProblemsSolved;
