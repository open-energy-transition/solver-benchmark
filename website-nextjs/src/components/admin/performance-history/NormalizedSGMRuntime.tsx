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
      <div className="tag-line font-bold mb-2 text-navy">
        SGM Runtime (Relative to Best per Year)
      </div>
      <D3SGMChart
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
