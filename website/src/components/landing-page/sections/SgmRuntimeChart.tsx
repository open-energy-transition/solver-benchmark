import React, { useCallback, useMemo } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { TableRowType } from "@/components/admin/ResultsSections";
import { ID3GroupedBarChartData, StackedBarData } from "@/types/chart";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getLatestBenchmarkResult } from "@/utils/results";
import { TIMEOUT_VALUES } from "@/constants/filter";

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
  hideTitle?: boolean;
  titlePosition?: "top" | "bottom-center";
  categoryBenchmarkCounts?: number[];
  categoryMemoryLabels?: string[];
  showBarTopLabels?: boolean;
  sizeAnnotations?: string[];
  formatBenchmarkSolved?: (params: {
    solved: number;
    total: number;
    timeout?: number;
  }) => string;
  rightmostGroupNote?: React.ReactNode;
  rightmostGroupOpacity?: number;
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
  hideTitle = false,
  titlePosition = "top" as const,
  formatBenchmarkSolved = () => "",
  categoryBenchmarkCounts,
  categoryMemoryLabels,
  showBarTopLabels = false,
  sizeAnnotations,
  rightmostGroupNote,
  rightmostGroupOpacity,
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

  const rightmostCategory = useMemo(() => {
    if (!computedChartData.length) return null;
    return String(computedChartData[computedChartData.length - 1][categoryKey]);
  }, [computedChartData, categoryKey]);

  const barOpacity = useMemo(() => {
    if (rightmostGroupOpacity === undefined) return undefined;
    return (d: ID3GroupedBarChartData) =>
      String(d.category) === rightmostCategory ? rightmostGroupOpacity : 1;
  }, [rightmostCategory, rightmostGroupOpacity]);

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
      const isNumericCategory =
        category !== undefined && !isNaN(Number(category));

      // Find the sorted index of this category among all unique timeouts
      const uniqueTimeoutsSorted = Array.from(
        new Set(computedChartData.map((d) => String(d[categoryKey]))),
      ).sort((a, b) => Number(a) - Number(b));
      const idx = uniqueTimeoutsSorted.findIndex(
        (t) => String(t) === String(category),
      );

      const fixedCount =
        categoryBenchmarkCounts && idx >= 0
          ? categoryBenchmarkCounts[idx]
          : undefined;
      const memoryLabel =
        categoryMemoryLabels && idx >= 0
          ? categoryMemoryLabels[idx]
          : undefined;

      if (computedChartData && computedChartData.length && category) {
        const point = computedChartData.find(
          (d) => String(d[categoryKey]) === String(category),
        );
        const dynamicCount =
          point?.uniqueBenchmarkCount ?? uniqueBenchmarkCount;
        const countDisplay =
          fixedCount !== undefined ? fixedCount : dynamicCount;

        if (mode === "solved-pct") {
          const lines = [
            formatBenchmarkSolved({
              solved: Number(countDisplay ?? totalBenchmarks),
              total: totalBenchmarks,
              timeout: Number(category),
            }),
          ];
          if (isNumericCategory) {
            lines.push(`Timeout: ${humanizeSeconds(Number(category))}`);
          } else {
            lines.push(String(category));
          }
          if (memoryLabel) lines.push(memoryLabel);
          return lines.join("\n");
        }

        // slowdown mode — removed "Fastest solver's average runtime" line
        const lines = [
          formatBenchmarkSolved({
            solved: Number(countDisplay ?? totalBenchmarks),
            total: totalBenchmarks,
            timeout: Number(category),
          }),
        ];
        if (isNumericCategory) {
          lines.push(`Timeout: ${humanizeSeconds(Number(category))}`);
        } else {
          lines.push(String(category));
        }
        if (memoryLabel) lines.push(memoryLabel);
        return lines.join("\n");
      }

      // Fallback (no chart data)
      const countDisplay =
        fixedCount !== undefined ? fixedCount : uniqueBenchmarkCount;
      const baseLines = [
        `${countDisplay}/${totalBenchmarks} benchmark problems`,
      ];
      if (isNumericCategory)
        baseLines.push(`Timeout: ${humanizeSeconds(timeout ?? 0)}`);
      if (memoryLabel) baseLines.push(memoryLabel);
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
      categoryBenchmarkCounts,
      categoryMemoryLabels,
      formatBenchmarkSolved,
    ],
  );

  return (
    <div className="my-4 rounded-2xl border-8 border-[#E6ECF5]">
      <D3GroupedBarChart
        sizeAnnotationTextColor="#022B3B"
        cardBgClassName="bg-page-bg"
        cardTextClassName="text-navy"
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
        hideTitle={hideTitle}
        titlePosition={titlePosition}
        showBarTopLabels={showBarTopLabels}
        sizeAnnotations={sizeAnnotations}
        rightmostGroupNote={rightmostGroupNote}
        barOpacity={barOpacity}
      />
    </div>
  );
};

export default SgmRuntimeChart;
