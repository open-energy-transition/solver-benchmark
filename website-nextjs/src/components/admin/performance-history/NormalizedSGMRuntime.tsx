// internal
import D3SGMChart from "@/components/shared/D3SGMChart";
import { SolverYearlyChartData } from "@/types/performance-history";
import { roundNumber } from "@/utils/number";

interface INormalizedSGMRuntime {
  chartData: SolverYearlyChartData[];
}

const NormalizedSGMRuntime = ({ chartData }: INormalizedSGMRuntime) => {
  return (
    <div>
      <div className="tag-line font-bold mb-2">
        SGM Runtime (Relative to Best Ever Measured)
      </div>
      <D3SGMChart
        excluseHipo
        title="Performance Ratio"
        chartData={chartData}
        xAxisTooltipFormat={(value) =>
          `<strong>Original SGM Runtime:</strong> ${roundNumber(
            Number(value),
            2,
          )}`
        }
      />
    </div>
  );
};

export default NormalizedSGMRuntime;
