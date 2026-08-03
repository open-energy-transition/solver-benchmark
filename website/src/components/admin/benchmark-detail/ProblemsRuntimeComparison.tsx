import { useCallback, useMemo } from "react";

import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { MetaData } from "@/types/meta-data";
import { humanizeSeconds } from "@/utils/string";
import { ID3GroupedBarChartData } from "@/types/chart";
import { formatDecimal } from "@/utils/number";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getProblemKey } from "@/utils/results";

interface IProblemsRuntimeComparison {
  problemIds: string[];
  metaData: MetaData;
}

// Same chart as the single-problem "Solver Runtime Comparison" on the
// problem detail page (D3GroupedBarChart normalizes each row/category
// independently, so one row per problem gives each problem its own
// relative-to-fastest-solver scale for free), generalized to accept
// several problems at once instead of being scoped to a single one.
const ProblemsRuntimeComparison = ({
  problemIds,
  metaData,
}: IProblemsRuntimeComparison) => {
  const benchmarkLatestResults = useBenchmarkResults();

  const findBenchmarkData = useCallback(
    (key: string, category: string | number) => {
      return benchmarkLatestResults.find(
        (result) => result.solver === key && getProblemKey(result) === category,
      );
    },
    [benchmarkLatestResults],
  );

  const chartData = useMemo(() => {
    return problemIds
      .map((problemId) => {
        const problemResults = benchmarkLatestResults.filter(
          (result) => getProblemKey(result) === problemId,
        );
        const res: { [key: string]: number | string } = { size: problemId };
        problemResults.forEach((d) => {
          res[d.solver] = d.runtime;
        });
        return res;
      })
      .filter((row) => Object.keys(row).length > 1);
  }, [problemIds, benchmarkLatestResults]);

  // Per-problem fallback bar height for non-"ok" results (timeouts/errors),
  // computed the same way as the single-problem chart, but independently for
  // each problem since every row is normalized to its own fastest solver.
  const nonOkBarHeightByProblem = useMemo(() => {
    const map: { [problemId: string]: number } = {};

    problemIds.forEach((problemId) => {
      const problemResults = benchmarkLatestResults.filter(
        (result) => getProblemKey(result) === problemId,
      );
      const okData = problemResults.filter((r) => r.status === "ok");
      const nonOkData = problemResults.filter((r) => r.status !== "ok");

      const maxNonOkRatio =
        okData.length === 0 || nonOkData.length === 0
          ? 1.1
          : Math.max(
              ...nonOkData.map(
                (r) => r.runtime / Math.min(...okData.map((ok) => ok.runtime)),
              ),
              1.1,
            );

      const maxOkNormalizedRuntime =
        okData.length === 0
          ? 1.0
          : Math.max(
              ...okData.map(
                (d) => d.runtime / Math.min(...okData.map((r) => r.runtime)),
              ),
              1.0,
            );

      map[problemId] =
        maxNonOkRatio > 50
          ? Math.max(1.1, maxOkNormalizedRuntime * 1.1)
          : maxNonOkRatio;
    });

    return map;
  }, [problemIds, benchmarkLatestResults]);

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
      return `Problem: ${d.category}<br/>
              Solver: ${d.key} v${benchmarkData?.solverVersion}<br/>
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

  // Kept short (just the problem id and its size) since, unlike the
  // single-problem chart, several of these labels now share the chart's
  // width side by side — the fuller detail lives in the hover tooltip below
  // instead of always-visible text.
  const getXAxisTickFormat = useCallback(
    (value: string) => {
      const modelSize = metaData[value]?.size;
      return modelSize ? `${value} (${modelSize})` : value;
    },
    [metaData],
  );

  const getXAxisTooltipFormat = useCallback(
    (value: string) => {
      const problemResults = benchmarkLatestResults.filter(
        (result) => getProblemKey(result) === value,
      );
      const modelSize = metaData[value]?.size;
      const minRuntime = Math.min(
        ...problemResults.map((result) => result.runtime),
      );
      return `Problem: ${value} (${modelSize})<br/>
      Fastest solver's runtime: ${humanizeSeconds(minRuntime)}`;
    },
    [benchmarkLatestResults, metaData],
  );

  return (
    <div className="rounded-xl">
      <D3GroupedBarChart
        title="Solver Runtime Comparison"
        outerBgClassName="bg-[#E6ECF5]"
        marginBottom={70}
        chartData={chartData}
        categoryKey="size"
        colors={(d) => getSolverColor(d.key)}
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
        xAxisTooltipFormat={getXAxisTooltipFormat}
        xAxisBarTextClassName="text-[11px] fill-dark-grey"
        useLogScale={true}
        directionalIndicator="lower"
        transformHeightValue={(d) => {
          const dataPoint = Number(d.value);
          const benchmarkData = findBenchmarkData(d.key, d.category);

          if (benchmarkData?.status !== "ok") {
            return nonOkBarHeightByProblem[String(d.category)] ?? 1.1;
          }

          return dataPoint;
        }}
      />
    </div>
  );
};

export default ProblemsRuntimeComparison;
