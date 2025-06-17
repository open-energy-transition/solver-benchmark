import { useSelector } from "react-redux";
import { useCallback } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { ID3GroupedBarChartData } from "@/types/chart";

const BENCHMARKS_FILTERS = [
  "genx-10_IEEE_9_bus_DC_OPF-9-1h",
  "tulipa-1_EU_investment_simple-28-1h",
  "temoa-US_9R_TS_SP-9-12",
  "genx-elec_trex_uc-15-24h",
  "pypsa-eur-sec-5-12h",
  "pypsa-eur-elec-op-10-3h",
  "TIMES-GEO-global-netzero-31-20ts",
];
const CATEGORY = "benchmark";

const SolverRuntimeComparison = () => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) =>
    BENCHMARKS_FILTERS.includes(`${result.benchmark}-${result.size}`),
  );

  const findBenchmarkData = useCallback(
    (key: string, category: string | number) => {
      return benchmarkLatestResults.find(
        (result) =>
          result.solver === key &&
          `${result.benchmark}-${result.size}` === category,
      );
    },
    [benchmarkLatestResults],
  );

  const chartData = BENCHMARKS_FILTERS.map((benchmark) => {
    const data = benchmarkLatestResults.filter(
      (result) => `${result.benchmark}-${result.size}` === benchmark,
    );
    const res: { [solver: string]: number } = {};
    data.forEach((d) => {
      res[d.solver] = d.runtime;
    });
    return {
      benchmark,
      ...res,
    };
  });

  const getBarTextClassName = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      if (benchmarkData?.status !== "ok") {
        return "font-extrabold fill-red-500";
      }
      return "fill-dark-grey";
    },
    [findBenchmarkData],
  );

  const getXAxisTooltipFormat = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      return `Solver: ${d.key} v${benchmarkData?.solverVersion}<br/>
              Runtime: ${humanizeSeconds(benchmarkData?.runtime ?? 0)} <br/>
              `;
    },
    [findBenchmarkData],
  );

  const getBarOpacity = useCallback(
    (d: ID3GroupedBarChartData) => {
      const benchmarkData = findBenchmarkData(d.key, d.category);
      if (!benchmarkData) return 1;
      if (benchmarkData.status !== "ok") return 1;
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
      const benchmarkData = chartData.find((data) => data.benchmark === value);

      const minRuntime = Math.min(
        ...Object.keys(benchmarkData ?? {}).map((key) => {
          if (key !== CATEGORY) {
            return Number(benchmarkData[key]);
          } else {
            return Number.MAX_VALUE;
          }
        }),
      );
      return `${value} \n
      Fastest solver's runtime: ${humanizeSeconds(minRuntime)}`;
    },
    [benchmarkLatestResults],
  );
  console.log(chartData);

  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title="Runtime relative to fastest solver"
        chartData={chartData}
        categoryKey={CATEGORY}
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        yAxisLabel="Relative runtime (normalized)"
        height={400}
        rotateXAxisLabels={false}
        barTextClassName={getBarTextClassName}
        xAxisTooltipFormat={getXAxisTooltipFormat}
        barOpacity={getBarOpacity}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        transformHeightValue={(d) => {
          const benchmarkData = findBenchmarkData(d.key, d.category);
          if (benchmarkData?.status !== "ok") return 1;
          return Number(d.value);
        }}
      />
    </div>
  );
};

export default SolverRuntimeComparison;
