import React, { useCallback, useMemo } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { TableRowType } from "@/components/admin/ResultsSections";
import { ID3GroupedBarChartData, StackedBarData } from "@/types/chart";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getLatestBenchmarkResult } from "@/utils/results";

interface ISolverRuntimeComparison {
  sgmData?: TableRowType[];
  uniqueProblemCount?: number;
  uniqueLatestProblemCount?: number;
  timeout?: number;
  chartData?: StackedBarData[];
  categoryKey?: string;
  title?: string;
  mode?: "slowdown" | "solved-pct";
  yAxisMax?: number;
  hideLegend?: boolean;
  hideTitle?: boolean;
  titlePosition?: "top" | "bottom-center";
  categoryProblemCounts?: number[];
  categoryMemoryLabels?: string[];
  showBarTopLabels?: boolean;
  sizeAnnotations?: string[];
  formatProblemsSolved?: (params: {
    solved: number;
    total: number;
    timeout?: number;
  }) => string;
  rightmostGroupNote?: React.ReactNode;
  rightmostGroupOpacity?: number;
}

const SgmRuntimeChart = ({
  sgmData = [],
  uniqueProblemCount,
  uniqueLatestProblemCount,
  timeout,
  chartData,
  categoryKey = "size",
  title = "SGM Runtime Comparison",
  mode = "slowdown",
  yAxisMax,
  hideLegend = false,
  hideTitle = false,
  titlePosition = "top" as const,
  formatProblemsSolved = () => "",
  categoryProblemCounts,
  categoryMemoryLabels,
  showBarTopLabels = false,
  sizeAnnotations,
  rightmostGroupNote,
  rightmostGroupOpacity,
}: ISolverRuntimeComparison) => {
  const rawBenchmarkResults = useBenchmarkResults({ useRawResults: true });

  const latestBenchmarkResult = getLatestBenchmarkResult(rawBenchmarkResults);

  const totalProblems = new Set(
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
        return `Solver: ${d.key} v${solver?.version}`;
      }
      // Look up the runtime for this bar's own category (timeout group)
      // rather than solver's overall aggregate, since a solver has a
      // different average runtime in each group.
      const categoryPoint = computedChartData.find(
        (point) => String(point[categoryKey]) === String(d.category),
      );
      const runtimeForCategory = categoryPoint?.[d.key];
      const runtime =
        typeof runtimeForCategory === "number"
          ? runtimeForCategory
          : (solver?.unnormalizedData.runtime ?? 0);
      return `Solver: ${d.key} v${solver?.version}<br/>
              Average runtime: ${humanizeSeconds(runtime)}`;
    },
    [solverResults, mode, computedChartData, categoryKey],
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
    (category?: string, _data?: unknown) => {
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
        categoryProblemCounts && idx >= 0
          ? categoryProblemCounts[idx]
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
          point?.uniqueProblemCount ?? uniqueProblemCount;
        const countDisplay =
          fixedCount !== undefined ? fixedCount : dynamicCount;

        if (mode === "solved-pct") {
          const lines = [
            formatProblemsSolved({
              solved: Number(countDisplay ?? totalProblems),
              total: totalProblems,
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
          formatProblemsSolved({
            solved: Number(countDisplay ?? totalProblems),
            total: totalProblems,
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
        fixedCount !== undefined ? fixedCount : uniqueProblemCount;
      const baseLines = [
        `${countDisplay}/${totalProblems} benchmark problems`,
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
      uniqueProblemCount,
      uniqueLatestProblemCount,
      timeout,
      totalProblems,
      mode,
      categoryProblemCounts,
      categoryMemoryLabels,
      formatProblemsSolved,
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
        xAxisBarTextClassName="text-[9px] sm:text-[10px] lg:text-xs fill-dark-grey"
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
