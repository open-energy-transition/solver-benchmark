import { useSelector } from "react-redux";
import { useCallback } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { ID3GroupedBarChartData } from "@/types/chart";
import { formatDecimal, formatInteger } from "@/utils/number";
import { HIPO_SOLVERS } from "@/utils/solvers";
import { getProblemKey } from "@/utils/results";

const PROBLEM_FILTERS = [
  "genx-10_IEEE_9_bus_DC_OPF-no_uc-9-1h",
  // "pypsa-eur-elec-50-1h",
  // "pypsa-eur-elec-100-1h",
  // "pypsa-eur-sec-50-1h",
  // "pypsa-eur-sec-100-1h",
  "temoa-US_9R_TS_SP-9-12ts",
  "TIMES-GEO-global-netzero-31-20ts",
  "SWITCH-China-open-model-32-433ts",
  // "ethos_fine_europe_60tp-175-720ts",
  "genx-10_IEEE_9_bus_DC_OPF-9-1h",
];
const CATEGORY = "problem";

interface IBenchmarkRuntimeComparison {
  xAxisLabelWrapLength?: number;
  splitter?: string;
  xAxisLabelRotation?: number;
  extraCategoryLengthMargin?: number;
  useHipoSolvers?: boolean;
}

const BenchmarkRuntimeComparison = ({
  xAxisLabelWrapLength = undefined,
  splitter = "-",
  xAxisLabelRotation = -45,
  extraCategoryLengthMargin = undefined,
  useHipoSolvers = false,
}: IBenchmarkRuntimeComparison) => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) =>
    useHipoSolvers
      ? PROBLEM_FILTERS.includes(`${result.benchmark}-${result.size}`)
      : PROBLEM_FILTERS.includes(`${result.benchmark}-${result.size}`) &&
        !HIPO_SOLVERS.includes(result.solver),
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
  const problemsWithStatus = PROBLEM_FILTERS.map((problemId) => {
    const data = benchmarkLatestResults.filter(
      (result) => `${result.benchmark}-${result.size}` === problemId,
    );
    return {
      problem: problemId,
      data,
    };
  });
  const chartData = problemsWithStatus.map((d) => {
    const res: { [solver: string]: number } = {};
    d.data.forEach((d) => {
      res[d.solver] = d.runtime;
    });
    return {
      problem: d.problem,
      ...res,
    };
  });
  const maxNormalizedRuntime = Math.max(
    ...PROBLEM_FILTERS.map((problemId) => {
      const data = benchmarkLatestResults.filter(
        (result) =>
          `${result.benchmark}-${result.size}` === problemId &&
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
        return `Problem: ${d}<br/>No result data available`;
      }

      const metaDataEntry = metaData[getProblemKey(benchmarkData)];

      if (!metaDataEntry) {
        return `Problem: ${d}<br/>No metadata available`;
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
      MILP features: ${(metaDataEntry.milpFeatures ?? []).join(", ")}<br/>
      Size: ${benchmarkData.size} (${metaDataEntry.size})<br/>
      Temporal resolution: ${metaDataEntry.temporalResolution || "N/A"}<br/>
      Spatial resolution: ${metaDataEntry.spatialResolution || "N/A"}<br/>
      Realistic: ${metaDataEntry.realistic ? "true" : "false"}<br/>
      Num. constraints: ${
        formatInteger(metaDataEntry.numConstraints) || "N/A"
      }<br/>
      Num. variables: ${formatInteger(metaDataEntry.numVariables) || "N/A"}<br/>
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
              Memory: ${formatDecimal({
                value: benchmarkData?.memoryUsage,
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
    (category: string) => {
      const solverData = chartData.find((data) => data.problem === category);
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
      const metaDataEntry = benchmarkData
        ? metaData[getProblemKey(benchmarkData)]
        : undefined;
      const [] = category.split("-");
      return `${benchmarkData?.benchmark} \n
      Size: ${benchmarkData?.size} \n
      Fastest solver: ${humanizeSeconds(minRuntime)} \n
      Problem class: ${metaDataEntry?.problemClass || "N/A"} \n`;
    },
    [benchmarkLatestResults],
  );

  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title="Runtime relative to fastest solver"
        outerBgClassName="bg-transparent"
        marginBottom={70}
        chartData={chartData}
        categoryKey={CATEGORY}
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        yAxisLabel="Relative runtime (normalized)"
        chartHeight={400}
        rotateXAxisLabels={true}
        barTextClassName={getBarTextClassName}
        tooltipFormat={tooltipFormat}
        barOpacity={getBarOpacity}
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        xAxisTooltipFormat={getXAxisTooltipFormat}
        xAxisBarTextClassName="text-[8px] fill-dark-grey"
        xAxisLabelWrapLength={xAxisLabelWrapLength}
        xAxisLabelRotation={xAxisLabelRotation}
        extraCategoryLengthMargin={extraCategoryLengthMargin}
        splitter={splitter}
        useLogScale={true}
        directionalIndicator="lower"
        transformHeightValue={(d) => {
          const dataPoint = Number(d.value);
          const status = problemsWithStatus
            .find((b) => b.problem === d.category)
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
