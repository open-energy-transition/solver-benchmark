import { useCallback } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { TableRowType } from "@/components/admin/ResultsSections";
import { ID3GroupedBarChartData } from "@/types/chart";

interface ISolverRuntimeComparison {
  sgmData: TableRowType[];
  uniqueProblemCount: number;
  uniqueLatestProblemCount: number;
  timeout: number;
}

const SgmRuntimeComparison = ({
  sgmData = [],
  uniqueProblemCount,
  uniqueLatestProblemCount,
  timeout,
}: ISolverRuntimeComparison) => {
  const solverResults = sgmData;

  const getChartData = () => {
    const res: { [solver: string]: number } = {};
    solverResults.forEach((d) => {
      res[d.solver] = d.unnormalizedData.runtime;
    });

    return [
      {
        size: "SGM",
        ...res,
      },
    ];
  };
  const chartData = getChartData();

  const tooltipFormat = useCallback(
    (d: ID3GroupedBarChartData) => {
      const solver = solverResults.find((s) => s.solver === d.key);

      return `Solver: ${d.key} v${solver?.version}<br/>
              Average runtime: ${humanizeSeconds(
                solver?.unnormalizedData.runtime ?? 0,
              )} <br/>
              Problems solved: ${solver?.solvedProblems} <br/>`;
    },
    [solverResults],
  );

  const getAxisLabelTitle = useCallback(
    (d: { key: string; value: unknown }) => {
      const valueNum = typeof d.value === "number" ? d.value : Number(d.value);
      return `${isNaN(valueNum) ? "-" : valueNum.toFixed(1)}x`;
    },
    [],
  );

  const getXAxisTickFormat = useCallback(() => {
    return `${uniqueProblemCount}/${uniqueLatestProblemCount} benchmark problems \n
    Fastest solver's average runtime: ${humanizeSeconds(
      Math.min(...solverResults.map((s) => s.unnormalizedData.runtime)),
    )} \n
    Timeout: ${humanizeSeconds(timeout)} \n
    `;
  }, [solverResults]);

  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title="Solver Runtime Comparison"
        marginBottom={70}
        chartData={chartData}
        categoryKey="size"
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        sortByValue
        xAxisLabel=""
        yAxisLabel="Relative average runtime (normalized, log scale)"
        chartHeight={400}
        rotateXAxisLabels={false}
        tooltipFormat={tooltipFormat}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        directionalIndicator="lower"
        useLogScale={true}
        outerBgClassName="bg-[#E6ECF5]"
      />
    </div>
  );
};

export default SgmRuntimeComparison;
