// internal
import D3LineChart from "@/components/shared/D3LineChart";
import { SolverYearlyChartData } from "@/types/performance-history";
import { roundNumber } from "@/utils/number";

interface INormalizedSGMRuntime {
  chartData: SolverYearlyChartData[];
}

const NormalizedSGMRuntime = ({ chartData }: INormalizedSGMRuntime) => {
  return (
    <div>
      <div className="tag-line font-bold mb-2">Normalized SGM Runtime</div>
      <D3LineChart
        title="Normalized SGM Runtime"
        chartData={chartData}
        xAxisTooltipFormat={(value) =>
          `<strong>(Norm.) SGM Runtime:</strong> ${roundNumber(
            Number(value),
            2,
          )}`
        }
      />
    </div>
  );
};
export default NormalizedSGMRuntime;
