import { useCallback, useMemo } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { TableRowType } from "@/components/admin/ResultsSections";
import { ID3GroupedBarChartData, StackedBarData } from "@/types/chart";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getLatestBenchmarkResult } from "@/utils/results";

interface ISolverRuntimeComparison {
  sgmData?: TableRowType[];
  uniqueBenchmarkCount?: number;
  uniqueLatestBenchmarkCount?: number;
  timeout?: number;
  chartData?: StackedBarData[];
  categoryKey?: string;
  title?: string;
  mode?: "slowdown" | "solved-pct";
  yAxisMax?: number;
  hideLegend?: boolean;
}

const SgmRuntimeChart = ({
  sgmData = [],
  uniqueBenchmarkCount,
  uniqueLatestBenchmarkCount,
  timeout,
  chartData,
  categoryKey = "size",
  title = "SGM Runtime Comparison",
  mode = "slowdown",
  yAxisMax,
  hideLegend = false,
}: ISolverRuntimeComparison) => {
  const rawBenchmarkResults = useBenchmarkResults({ useRawResults: true });

  const latestBenchmarkResult = getLatestBenchmarkResult(rawBenchmarkResults);

  const totalBenchmarks = new Set(
    latestBenchmarkResult.map((result) => `${result.benchmark}-${result.size}`),
  ).size;

  const solverResults = sgmData;

  const computedChartData = useMemo(() => {
    if (chartData && chartData.length) return chartData;
    const res: { [solver: string]: number } = {};
    solverResults.forEach((d) => {
      res[d.solver] = d.unnormalizedData.runtime;
    });

    return [
      {
        [categoryKey]: "SGM",
        ...res,
      },
    ];
  }, [chartData, solverResults, categoryKey]);

  const tooltipFormat = useCallback(
    (d: ID3GroupedBarChartData) => {
      const solver = solverResults.find((s) => s.solver === d.key);
      if (mode === "solved-pct") {
        return `Solver: ${d.key} v${solver?.version}<br/>
                Timeout: ${humanizeSeconds(Number(d.category))}<br/>
                Problems solved: ${Number(d.value).toFixed(1)}%`;
      }
      return `Solver: ${d.key} v${solver?.version}<br/>
              Average runtime: ${humanizeSeconds(
                solver?.unnormalizedData.runtime ?? 0,
              )} <br/>
              Benchmarks solved: ${solver?.solvedBenchmarks} <br/>`;
    },
    [solverResults, mode],
  );

  const getAxisLabelTitle = useCallback(
    (d: { key: string; value: unknown }) => {
      const valueNum = typeof d.value === "number" ? d.value : Number(d.value);
      if (mode === "solved-pct") {
        return `${isNaN(valueNum) ? "-" : valueNum.toFixed(0)}%`;
      }
      return `${isNaN(valueNum) ? "-" : valueNum.toFixed(1)}x`;
    },
    [mode],
  );

  const getXAxisTickFormat = useCallback(
    (category?: string, data?: any) => {
      // If grouped chart data is provided, try to extract per-category info
      const isNumericCategory =
        category !== undefined && !isNaN(Number(category));
      if (computedChartData && computedChartData.length && category) {
        const point = computedChartData.find(
          (d) => String(d[categoryKey]) === String(category),
        );
        const uniqueCount = point?.uniqueBenchmarkCount ?? uniqueBenchmarkCount;

        if (mode === "solved-pct") {
          const lines = [
            `${uniqueCount ?? totalBenchmarks} benchmark problems`,
          ];
          if (isNumericCategory) {
            lines.push(`Timeout: ${humanizeSeconds(Number(category))}`);
          } else {
            lines.push(String(category));
          }
          return lines.join("\n");
        }

        const solverKeys = Object.keys(point || {}).filter(
          (k) => k !== categoryKey,
        );
        const values = solverKeys.map(
          (k) => Number((point as StackedBarData)[k]) || Infinity,
        );
        const fastest = Math.min(...values);

        const lines = [
          `${uniqueCount}/${totalBenchmarks} benchmark problems `,
          `Fastest solver's average runtime: ${humanizeSeconds(
            isFinite(fastest)
              ? fastest
              : Math.min(
                  ...solverResults.map((s) => s.unnormalizedData.runtime),
                ),
          )} `,
        ];

        if (isNumericCategory) {
          lines.push(`Timeout: ${humanizeSeconds(Number(category))} `);
        } else {
          // For non-numeric categories (e.g. variable buckets), show the category label instead
          lines.push(String(category));
        }

        return lines.join("\n");
      }

      const baseLines = [
        `${uniqueBenchmarkCount}/${totalBenchmarks} benchmark problems `,
        `Fastest solver's average runtime: ${humanizeSeconds(
          Math.min(...solverResults.map((s) => s.unnormalizedData.runtime)),
        )} `,
      ];
      if (isNumericCategory)
        baseLines.push(`Timeout: ${humanizeSeconds(timeout ?? 0)} `);
      return baseLines.join("\n");
    },
    [
      computedChartData,
      categoryKey,
      solverResults,
      uniqueBenchmarkCount,
      uniqueLatestBenchmarkCount,
      timeout,
      totalBenchmarks,
      mode,
    ],
  );

  return (
    <div className="my-4 mt-0 rounded-xl">
      <D3GroupedBarChart
        title={title}
        chartData={computedChartData}
        categoryKey={categoryKey}
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        sortByValue
        xAxisLabel=""
        yAxisLabel=""
        chartHeight={400}
        rotateXAxisLabels={false}
        tooltipFormat={tooltipFormat}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        directionalIndicator={mode === "solved-pct" ? "higher" : "lower"}
        useLogScale={mode !== "solved-pct"}
        normalize={mode !== "solved-pct"}
        showLineAtY1={mode !== "solved-pct"}
        yAxisMax={yAxisMax}
        hideLegend={hideLegend}
        hideTitle={hideLegend}
      />
    </div>
  );
};

export default SgmRuntimeChart;
