import { useSelector } from "react-redux";
import { useState, useId } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { CircleIcon } from "@/assets/icons";

interface IRuntimeOfFastestSolver {
  benchmarkList?: string[];
  xAxisLabelRotation?: number;
  xAxisLabelWrapLength?: number;
  splitter?: string;
  extraCategoryLengthMargin?: number;
}

interface IDataPoint {
  category: string | number;
  value: number | string;
}

const RuntimeOfFastestSolver = ({
  benchmarkList = [],
  xAxisLabelRotation = -45,
  xAxisLabelWrapLength = undefined,
  splitter = "-",
  extraCategoryLengthMargin = undefined,
}: IRuntimeOfFastestSolver) => {
  const [allSolvers, setallSolvers] = useState(false);
  const radioGroupId = useId();

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults;
  })
    .filter((result) => (allSolvers ? true : result.solver !== "gurobi"))
    .map((result) => ({
      ...result,
      runtime: result.status === "ok" ? result.runtime : result.timeout,
    }));

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const successfulResults = benchmarkResults.filter((result) => {
    return benchmarkList.includes(`${result.benchmark}-${result.size}`);
  });

  const fastestRuntimeByBenchmark = Array.from(
    new Set(
      successfulResults.map((result) => `${result.benchmark}-${result.size}`),
    ),
  ).reduce<
    Record<
      string,
      {
        runtime: number;
        solver: string;
        status: string;
        size: string;
        benchmark: string;
      }
    >
  >((acc, instance) => {
    return {
      ...acc,
      [instance]: {
        runtime: Number.MAX_VALUE,
        solver: "",
        status: "unknown",
        size: "",
        benchmark: "",
      },
    };
  }, {});

  successfulResults.forEach((result) => {
    const key = `${result.benchmark}-${result.size}`;
    if (fastestRuntimeByBenchmark[key].runtime > result.runtime) {
      fastestRuntimeByBenchmark[key].runtime = result.runtime;
      fastestRuntimeByBenchmark[key].solver = result.solver;
      fastestRuntimeByBenchmark[key].status = result.status;
      fastestRuntimeByBenchmark[key].size = result.size;
      fastestRuntimeByBenchmark[key].benchmark = result.benchmark;
    }
  });

  const chartData = benchmarkList.map((benchmark) => {
    return {
      benchmark,
      runtime: fastestRuntimeByBenchmark[benchmark]?.runtime || 0,
    };
  });

  if (chartData.length === 0) {
    return <p className="text-center">No data available</p>;
  }

  const getBarTextClassName = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByBenchmark[d.category];
    if (benchmarkData?.status !== "ok") {
      return "text-[10px] font-extrabold fill-red-500 mb-2";
    }
    return "text-[10px] fill-dark-grey";
  };

  const getAxisLabelTitle = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByBenchmark[d.category];
    if (benchmarkData?.status !== "ok") {
      return "TO";
    }
    return humanizeSeconds(Number(d.value));
  };

  const getXAxisTooltipFormat = (d: string) => {
    const benchmarkData = fastestRuntimeByBenchmark[d];
    const metaDataEntry =
      metaData[benchmarkData?.benchmark as keyof typeof metaData];
    const sizeData = metaDataEntry?.sizes.find(
      (s) => s.name === benchmarkData?.size,
    );

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
  };

  const tooltipFormat = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByBenchmark[d.category];
    let solver = "";
    if (benchmarkData?.status === "ok") {
      solver = `Solver: ${benchmarkData?.solver}<br/>
            `;
    }
    return `
    Benchmark: ${d.category}<br/>
              Runtime: ${humanizeSeconds(Number(d.value))} <br/>
              ${solver}
              Status: ${benchmarkData?.status}<br/>
            `;
  };

  const getTransformHeightValue = (d: IDataPoint) => {
    if (fastestRuntimeByBenchmark[d.category]?.status !== "ok") return 1;
    return Number(d.value);
  };

  const chartLegend = () => (
    <div className="flex gap-2 border border-stroke rounded-xl px-2 py-1">
      {availableSolvers.map((solverKey) => (
        <div
          key={solverKey}
          className="text-navy tag-line-xs flex items-center gap-1.5 rounded-md h-max w-max"
        >
          <CircleIcon
            style={{
              color: getSolverColor(solverKey),
            }}
            className="size-2"
          />
          {solverKey}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`solver-filter-runtime-${radioGroupId}`}
            checked={!allSolvers}
            onChange={() => setallSolvers(false)}
          />
          <span className="text-sm text-navy">Open solvers only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`solver-filter-runtime-${radioGroupId}`}
            checked={allSolvers}
            onChange={() => setallSolvers(true)}
          />
          <span className="text-sm text-navy">All solvers</span>
        </label>
      </div>
      <div>
        <D3GroupedBarChart
          title="Runtime of fastest solver"
          chartData={chartData}
          normalize={false}
          categoryKey="benchmark"
          colors={(d) => {
            if (!d?.category) return "grey";

            if (fastestRuntimeByBenchmark[d.category]?.status !== "ok") {
              return "text-dark-grey";
            }
            return getSolverColor(fastestRuntimeByBenchmark[d.category].solver);
          }}
          barOpacity={(d) => {
            if (fastestRuntimeByBenchmark[d.category]?.status !== "ok") {
              return 0.5;
            }
            return 1;
          }}
          xAxisLabel=""
          yAxisLabel="Runtime (s)"
          chartHeight={400}
          customLegend={chartLegend}
          barTextClassName={getBarTextClassName}
          xAxisTooltipFormat={getXAxisTooltipFormat}
          tooltipFormat={tooltipFormat}
          axisLabelTitle={getAxisLabelTitle}
          xAxisLabelRotation={xAxisLabelRotation}
          xAxisLabelWrapLength={xAxisLabelWrapLength}
          xAxisBarTextClassName="text-xs fill-dark-grey"
          transformHeightValue={getTransformHeightValue}
          extraCategoryLengthMargin={extraCategoryLengthMargin}
          rotateXAxisLabels={true}
          splitter={splitter}
        />
      </div>
    </>
  );
};

export default RuntimeOfFastestSolver;
