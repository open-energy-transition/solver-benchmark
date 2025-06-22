import { useSelector } from "react-redux";
import { useCallback } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { MetaDataEntry } from "@/types/meta-data";
import { humanizeSeconds } from "@/utils/string";
import { ID3GroupedBarChartData } from "@/types/chart";

interface ISolverRuntimeComparison {
  benchmarkName: string;
  benchmarkDetail: MetaDataEntry;
}

const SolverRuntimeComparison = ({
  benchmarkName,
  benchmarkDetail,
}: ISolverRuntimeComparison) => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => result.benchmark === benchmarkName);

  const findBenchmarkData = useCallback(
    (key: string, category: string | number) => {
      return benchmarkLatestResults.find(
        (result) =>
          result.solver === key &&
          result.benchmark === benchmarkName &&
          result.size === category,
      );
    },
    [benchmarkLatestResults, benchmarkName],
  );

  const chartData = benchmarkDetail.sizes.map((s) => {
    const data = benchmarkLatestResults.filter(
      (result) => result.size === s.name && result.benchmark === benchmarkName,
    );

    const res: { [solver: string]: number } = {};
    data.forEach((d) => {
      res[d.solver] = d.runtime;
    });
    return {
      size: s.name,
      ...res,
    };
  });

  const maxNormalizedRuntime = Math.max(
    ...benchmarkDetail.sizes.map((size) => {
      const data = benchmarkLatestResults.filter(
        (result) =>
          result.size === size.name &&
          result.benchmark === benchmarkName &&
          result.status === "ok",
      );
      const res: { [solver: string]: number } = {};
      const minRuntime = Math.min(...data.map((d) => d.runtime));
      data.forEach((d) => {
        res[d.solver] = d.runtime / minRuntime;
      });
      return Math.max(...Object.values(res));
    }),
  );

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
              Memory: ${benchmarkData?.memoryUsage} MB <br/>
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
        (result) => result.size === value && result.benchmark === benchmarkName,
      );
      const modelSize = benchmarkDetail.sizes.find((s) => s.name === value)
        ?.size;

      const minRuntime = Math.min(
        ...benchmarkData.map((result) => result.runtime),
      );
      return `Size instance: ${value} (${modelSize}) \n
      Fastest solver's runtime: ${humanizeSeconds(minRuntime)}`;
    },
    [benchmarkLatestResults, benchmarkName],
  );

  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title="Solver Runtime Comparison"
        chartData={chartData}
        categoryKey="size"
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        yAxisLabel="Relative runtime (normalized)"
        height={400}
        rotateXAxisLabels={false}
        barTextClassName={getBarTextClassName}
        tooltipFormat={tooltipFormat}
        barOpacity={getBarOpacity}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        xAxisBarTextClassName="text-[8px] fill-dark-grey"
        transformHeightValue={(d) => {
          const dataPoint = Number(d.value);
          const benchmarkData = findBenchmarkData(d.key, d.category);
          const height =
            benchmarkData?.status !== "ok" ? maxNormalizedRuntime : dataPoint;
          return Number(height);
        }}
      />
    </div>
  );
};

export default SolverRuntimeComparison;
