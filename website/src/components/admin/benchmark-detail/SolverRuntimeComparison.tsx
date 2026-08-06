import { useCallback } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { MetaDataEntry } from "@/types/meta-data";
import { humanizeSeconds } from "@/utils/string";
import { ID3GroupedBarChartData } from "@/types/chart";
import { formatDecimal } from "@/utils/number";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getProblemKey } from "@/utils/results";

interface ISolverRuntimeComparison {
  problemId: string;
  problemDetail: MetaDataEntry;
}

const SolverRuntimeComparison = ({
  problemId,
  problemDetail,
}: ISolverRuntimeComparison) => {
  const benchmarkLatestResults = useBenchmarkResults();

  const findBenchmarkData = useCallback(
    (key: string, category: string | number) => {
      return benchmarkLatestResults.find(
        (result) => result.solver === key && getProblemKey(result) === category,
      );
    },
    [benchmarkLatestResults],
  );

  // The chart has a single category: this problem itself.
  const problemResults = benchmarkLatestResults.filter(
    (result) => getProblemKey(result) === problemId,
  );

  const chartData = (() => {
    const res: { [solver: string]: number } = {};
    problemResults.forEach((d) => {
      res[d.solver] = d.runtime;
    });
    // Filter out the case where there's no solver data at all
    return Object.keys(res).length > 0
      ? [
          {
            size: problemId,
            ...res,
          },
        ]
      : [];
  })();

  const okData = problemResults.filter((r) => r.status === "ok");
  const nonOkData = problemResults.filter((r) => r.status !== "ok");

  // Calculate the maximum ratio across all non-OK bars
  const maxNonOkRatio =
    okData.length === 0 || nonOkData.length === 0
      ? 1.1
      : Math.max(
          ...nonOkData.map(
            (r) => r.runtime / Math.min(...okData.map((ok) => ok.runtime)),
          ),
          1.1, // Ensure minimum of 1.1
        );

  // Calculate the maximum normalized runtime across all OK statuses
  const maxOkNormalizedRuntime =
    okData.length === 0
      ? 1.0
      : Math.max(
          ...okData.map(
            (d) => d.runtime / Math.min(...okData.map((r) => r.runtime)),
          ),
          1.0,
        );

  // If the non-OK ratio is too extreme (>50x), fall back to using the worst OK performance + buffer
  // This prevents charts from becoming unreadable due to extreme timeout values
  const nonOkBarHeight =
    maxNonOkRatio > 50
      ? Math.max(1.1, maxOkNormalizedRuntime * 1.1) // 10% above worst OK performance, min 1.1
      : maxNonOkRatio;

  const getBarTextClassName = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      if (benchmarkData?.status !== "ok") {
        return "text-[7px] font-extrabold fill-red-500";
      }
      return "text-[8px] fill-dark-grey";
    },
    [findBenchmarkData],
  );

  const tooltipFormat = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      return `Solver: ${d.key} v${benchmarkData?.solverVersion}<br/>
              Runtime: ${humanizeSeconds(benchmarkData?.runtime ?? 0)} <br/>
              Memory: ${formatDecimal({
                value: benchmarkData?.memoryUsage as number,
              })} MB <br/>
              Status: ${benchmarkData?.status} <br/>`;
    },
    [findBenchmarkData],
  );

  const getBarOpacity = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      if (!benchmarkData) return 1;
      if (benchmarkData.status !== "ok") return 0.3;
      return 1;
    },
    [findBenchmarkData],
  );

  const getAxisLabelTitle = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      if (benchmarkData?.status !== "ok") {
        return benchmarkData?.status ?? "-";
      }
      const valueNum = typeof d.value === "number" ? d.value : Number(d.value);
      return `${isNaN(valueNum) ? "-" : valueNum.toFixed(1)}x`;
    },
    [findBenchmarkData],
  );

  const getXAxisTickFormat = useCallback(
    (value: string) => {
      const benchmarkData = benchmarkLatestResults.filter(
        (result) => getProblemKey(result) === value,
      );
      const modelSize = problemDetail.size;

      const minRuntime = Math.min(
        ...benchmarkData.map((result) => result.runtime),
      );
      return `Problem: ${value} (${modelSize}) \n
      Fastest solver's runtime: ${humanizeSeconds(minRuntime)}`;
    },
    [benchmarkLatestResults, problemDetail],
  );

  return (
    <div className="my-4 rounded-xl">
      <D3GroupedBarChart
        title="Solver Runtime Comparison"
        outerBgClassName="bg-[#E6ECF5]"
        marginBottom={70}
        chartData={chartData}
        categoryKey="size"
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        yAxisLabel="Relative runtime (normalized, log scale)"
        chartHeight={400}
        extraCategoryLengthMargin={-50}
        rotateXAxisLabels={false}
        barTextClassName={getBarTextClassName}
        tooltipFormat={tooltipFormat}
        barOpacity={getBarOpacity}
        axisLabelTitle={getAxisLabelTitle}
        sortByValue
        xAxisTickFormat={getXAxisTickFormat}
        xAxisBarTextClassName="text-[11px] fill-dark-grey"
        useLogScale={true}
        directionalIndicator="lower"
        transformHeightValue={(d) => {
          const dataPoint = Number(d.value);
          const benchmarkData = findBenchmarkData(d.key, d.category);

          if (benchmarkData?.status !== "ok") {
            return nonOkBarHeight;
          }

          return dataPoint;
        }}
      />
    </div>
  );
};

export default SolverRuntimeComparison;
