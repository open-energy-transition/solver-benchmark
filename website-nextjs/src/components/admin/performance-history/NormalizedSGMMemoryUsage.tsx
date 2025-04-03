import D3LineChart from "@/components/shared/D3LineChart";
import { SolverYearlyChartData } from "@/types/performance-history";
import { roundNumber } from "@/utils/number";

interface INormalizedSGMMemoryUsage {
  chartData: SolverYearlyChartData[];
}

const NormalizedSGMMemoryUsage = ({ chartData }: INormalizedSGMMemoryUsage) => {
  return (
    <div>
      <p className="text-navy font-bold leading-1.5 mb-3">
        Normalized SGM Memory Usage
      </p>
      <D3LineChart
        chartData={chartData}
        title="Normalized SGM Memory Usage"
        xAxisTooltipFormat={(value) =>
          `<strong>Memory Usage:</strong> ${roundNumber(Number(value), 2)}`
        }
      />
    </div>
  );
};
export default NormalizedSGMMemoryUsage;
