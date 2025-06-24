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

const BenchmarkRuntimeComparison = () => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) =>
    BENCHMARKS_FILTERS.includes(`${result.benchmark}-${result.size}`),
  );

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

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
  const benchmarkWithStatus = BENCHMARKS_FILTERS.map((benchmark) => {
    const data = benchmarkLatestResults.filter(
      (result) => `${result.benchmark}-${result.size}` === benchmark,
    );
    return {
      benchmark,
      data,
    };
  });
  const chartData = benchmarkWithStatus.map((d) => {
    const res: { [solver: string]: number } = {};
    d.data.forEach((d) => {
      res[d.solver] = d.runtime;
    });
    return {
      benchmark: d.benchmark,
      ...res,
    };
  });
  const maxNormalizedRuntime = Math.max(
    ...BENCHMARKS_FILTERS.map((benchmark) => {
      const data = benchmarkLatestResults.filter(
        (result) =>
          `${result.benchmark}-${result.size}` === benchmark &&
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

  const getXAxisTooltipFormat = useCallback(
    (d: string) => {
      const benchmarkData = benchmarkLatestResults.find(
        (result) => `${result.benchmark}-${result.size}` === d,
      );

      if (!benchmarkData) {
        return `Benchmark: ${d}<br/>No benchmark data available`;
      }

      const metaDataEntry =
        metaData[benchmarkData.benchmark as keyof typeof metaData];
      const sizeData = metaDataEntry?.sizes.find(
        (s) => s.name === benchmarkData.size,
      );

      if (!metaDataEntry) {
        return `Benchmark: ${d}<br/>No metadata available`;
      }

      return `
      ${metaDataEntry.shortDescription}<br/><br/>
      Modelling framework: ${metaDataEntry.modellingFramework}<br/>
      Model name: ${metaDataEntry.modelName}<br/>
      Problem class: ${metaDataEntry.problemClass}<br/>
      Application: ${metaDataEntry.application}<br/>
      Sectoral focus: ${metaDataEntry.sectoralFocus}<br/>
      Sectors: ${metaDataEntry.sectors}<br/>
      Time horizon: ${metaDataEntry.timeHorizon}<br/>
      MILP features: ${metaDataEntry.milpFeatures}<br/>
      Size: ${sizeData?.name} (${sizeData?.size})<br/>
      Temporal resolution: ${sizeData?.temporalResolution || "N/A"}<br/>
      Spatial resolution: ${sizeData?.spatialResolution || "N/A"}<br/>
      Realistic: ${
        metaDataEntry.sizes.some((s) => s.realistic) ? "true" : "false"
      }<br/>
      Num. constraints: ${sizeData?.numConstraints || "N/A"}<br/>
      Num. variables: ${sizeData?.numVariables}<br/>
              `;
    },
    [metaData, benchmarkLatestResults],
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
    (category: string) => {
      const solverData = chartData.find((data) => data.benchmark === category);
      const benchmarkData = findBenchmarkData("highs", category);

      const minRuntime = Math.min(
        ...Object.keys(solverData ?? {}).map((key) => {
          if (key !== CATEGORY) {
            const runtime = solverData?.[key as keyof typeof solverData];
            return Number(runtime);
          } else {
            return Number.MAX_VALUE;
          }
        }),
      );
      const [] = category.split("-");
      return `${benchmarkData?.benchmark} \n
      Size: ${benchmarkData?.size} \n
      Fastest solver: ${humanizeSeconds(minRuntime)}`;
    },
    [benchmarkLatestResults],
  );

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
        tooltipFormat={tooltipFormat}
        barOpacity={getBarOpacity}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        xAxisTooltipFormat={getXAxisTooltipFormat}
        xAxisBarTextClassName="text-[8px] fill-dark-grey"
        transformHeightValue={(d) => {
          const dataPoint = Number(d.value);
          const status = benchmarkWithStatus
            .find((b) => b.benchmark === d.category)
            ?.data.find((res) => res.solver === d.key);
          const height =
            status?.status !== "ok" ? maxNormalizedRuntime : dataPoint;
          return Number(height);
        }}
      />
    </div>
  );
};

export default BenchmarkRuntimeComparison;
