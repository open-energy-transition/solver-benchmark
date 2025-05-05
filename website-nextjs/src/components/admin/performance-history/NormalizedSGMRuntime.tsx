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
      <p className="text-navy font-bold leading-1.5 mb-3 4xl:text-xl">
        Normalized SGM Runtime
      </p>
      <D3LineChart
        title="Normalized SGM Runtime"
        chartData={chartData}
        xAxisTooltipFormat={(value) =>
          `<strong>Runtime:</strong> ${roundNumber(Number(value), 2)}`
        }
      />
    </div>
  );
};
export default NormalizedSGMRuntime;
