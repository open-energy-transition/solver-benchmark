import D3LineChart from "@/components/shared/D3LineChart";
import { SolverYearlyChartData } from "@/types/performance-history";
import { roundNumber } from "@/utils/number";

interface INormalizedSGMMemoryUsage {
  chartData: SolverYearlyChartData[];
}

const NormalizedSGMMemoryUsage = ({ chartData }: INormalizedSGMMemoryUsage) => {
  return (
    <div>
      <div className="tag-line font-bold mb-2">Normalized SGM Memory Usage</div>
      <D3LineChart
        chartData={chartData}
        title="Normalized SGM Memory Usage"
        xAxisTooltipFormat={(value) =>
          `<strong>(Norm.) SGM Memory Usage:</strong> ${roundNumber(
            Number(value),
            2,
          )}`
        }
      />
    </div>
  );
};
export default NormalizedSGMMemoryUsage;
