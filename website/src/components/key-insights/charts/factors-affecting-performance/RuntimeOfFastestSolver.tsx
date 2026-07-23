import { useSelector } from "react-redux";
import { useState, useId } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { CircleIcon } from "@/assets/icons";
import { formatInteger } from "@/utils/number";
import { useAvailableSolvers } from "@/hooks/useAvailableSolvers";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getSolverLabel } from "@/utils/solvers";

interface IRuntimeOfFastestSolver {
  problemList?: string[];
  xAxisLabelRotation?: number;
  xAxisLabelWrapLength?: number;
  splitter?: string;
  extraCategoryLengthMargin?: number;
  excludeHipo?: boolean;
}

interface IDataPoint {
  category: string | number;
  value: number | string;
}

const RuntimeOfFastestSolver = ({
  problemList = [],
  xAxisLabelRotation = -45,
  xAxisLabelWrapLength = undefined,
  splitter = "-",
  extraCategoryLengthMargin = undefined,
  excludeHipo = true,
}: IRuntimeOfFastestSolver) => {
  const [allSolvers, setallSolvers] = useState(false);
  const radioGroupId = useId();

  const availableSolvers = useAvailableSolvers({ excludeHipo });

  const rawResults = useBenchmarkResults({
    excludeHipo,
    useRawResults: true,
  });

  const benchmarkResults = rawResults
    .filter((result) => (allSolvers ? true : result.solver !== "gurobi"))
    .map((result) => ({
      ...result,
      runtime: result.status === "ok" ? result.runtime : result.timeout,
    }));

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const successfulResults = benchmarkResults.filter((result) => {
    return problemList.includes(`${result.benchmark}-${result.size}`);
  });

  const fastestRuntimeByProblem = Array.from(
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
  >((acc, problemId) => {
    return {
      ...acc,
      [problemId]: {
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
    if (fastestRuntimeByProblem[key].runtime > result.runtime) {
      fastestRuntimeByProblem[key].runtime = result.runtime;
      fastestRuntimeByProblem[key].solver = result.solver;
      fastestRuntimeByProblem[key].status = result.status;
      fastestRuntimeByProblem[key].size = result.size;
      fastestRuntimeByProblem[key].benchmark = result.benchmark;
    }
  });

  const chartData = problemList.map((problemId) => {
    return {
      problem: problemId,
      runtime: fastestRuntimeByProblem[problemId]?.runtime || 0,
    };
  });

  if (chartData.length === 0) {
    return <p className="text-center">No data available</p>;
  }

  const getBarTextClassName = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByProblem[d.category];
    if (benchmarkData?.status !== "ok") {
      return "text-[10px] font-extrabold fill-red-500 mb-2";
    }
    return "text-[10px] fill-dark-grey";
  };

  const getAxisLabelTitle = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByProblem[d.category];
    if (benchmarkData?.status !== "ok") {
      return "TO";
    }
    return humanizeSeconds(Number(d.value));
  };

  const getXAxisTooltipFormat = (d: string) => {
    const benchmarkData = fastestRuntimeByProblem[d];
    const metaDataEntry = benchmarkData
      ? metaData[`${benchmarkData.benchmark}-${benchmarkData.size}`]
      : undefined;

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
    Size: ${benchmarkData?.size} (${metaDataEntry.size})<br/>
    Temporal resolution: ${metaDataEntry.temporalResolution || "N/A"}<br/>
    Spatial resolution: ${metaDataEntry.spatialResolution || "N/A"}<br/>
    Realistic: ${metaDataEntry.realistic ? "true" : "false"}<br/>
    Num. constraints: ${
      formatInteger(metaDataEntry.numConstraints) || "N/A"
    }<br/>
    Num. variables: ${formatInteger(metaDataEntry.numVariables) || "N/A"}<br/>
            `;
  };

  const tooltipFormat = (d: IDataPoint) => {
    const benchmarkData = fastestRuntimeByProblem[d.category];
    let solver = "";
    if (benchmarkData?.status === "ok") {
      solver = `Solver: ${benchmarkData?.solver}<br/>
            `;
    }
    return `
    Problem: ${d.category}<br/>
              Runtime: ${humanizeSeconds(Number(d.value))} <br/>
              ${solver}
              Status: ${benchmarkData?.status}<br/>
            `;
  };

  const getTransformHeightValue = (d: IDataPoint) => {
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
          {getSolverLabel(solverKey)}
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
          outerBgClassName="bg-transparent"
          marginBottom={45}
          chartData={chartData}
          directionalIndicator="lower"
          normalize={false}
          categoryKey="problem"
          colors={(d) => {
            if (!d?.category) return "grey";

            if (fastestRuntimeByProblem[d.category]?.status !== "ok") {
              return "text-dark-grey";
            }
            return getSolverColor(fastestRuntimeByProblem[d.category].solver);
          }}
          barOpacity={(d) => {
            if (fastestRuntimeByProblem[d.category]?.status !== "ok") {
              return 0.5;
            }
            return 1;
          }}
          xAxisLabel=""
          yAxisLabel="Runtime (s, log scale)"
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
          useLogScale={true}
          showLineAtY1={false}
        />
      </div>
    </>
  );
};

export default RuntimeOfFastestSolver;
