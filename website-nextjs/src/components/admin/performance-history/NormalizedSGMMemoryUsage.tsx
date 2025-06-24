import D3SGMChart from "@/components/shared/D3SGMChart";
import { SolverYearlyChartData } from "@/types/performance-history";
import { roundNumber } from "@/utils/number";

interface INormalizedSGMMemoryUsage {
  chartData: SolverYearlyChartData[];
}

const NormalizedSGMMemoryUsage = ({ chartData }: INormalizedSGMMemoryUsage) => {
  return (
    <div>
      <div className="tag-line font-bold mb-2">
        SGM Memory Usage (Relative to Best per Year)
      </div>
      <D3SGMChart
        chartData={chartData}
        title="Performance Ratio"
        xAxisTooltipFormat={(value) =>
          `<strong>Original SGM Memory Usage:</strong> ${roundNumber(
            Number(value),
            2,
          )}`
        }
      />
    </div>
  );
};

export default NormalizedSGMMemoryUsage;
