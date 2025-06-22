import { useSelector } from "react-redux";
import { useState } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { CircleIcon } from "@/assets/icons";

interface IRuntimeOfFastestSolver {
  benchmarkList?: string[];
}

interface IDataPoint {
  category: string | number;
  value: number | string;
}

const RuntimeOfFastestSolver = ({
  benchmarkList = [],
}: IRuntimeOfFastestSolver) => {
  const [allSolvers, setallSolvers] = useState(true);

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

  const successfulResults = benchmarkResults.filter((result) => {
    return benchmarkList.includes(`${result.benchmark}-${result.size}`);
  });

  const successfulBenchmarkData = Array.from(
    new Set(
      successfulResults.map((result) => `${result.benchmark} ${result.size}`),
    ),
  ).reduce<Record<string, { runtime: number; solver: string; status: string }>>(
    (acc, instance) => {
      return {
        ...acc,
        [instance]: {
          runtime: Number.MAX_VALUE,
          solver: "",
          status: "unknown",
        },
      };
    },
    {},
  );

  successfulResults.forEach((result) => {
    const key = `${result.benchmark} ${result.size}`;
    if (successfulBenchmarkData[key].runtime > result.runtime) {
      successfulBenchmarkData[key].runtime = result.runtime;
      successfulBenchmarkData[key].solver = result.solver;
      successfulBenchmarkData[key].status = result.status;
    }
  });

  const chartData = Object.keys(successfulBenchmarkData)
    .map((key) => {
      return {
        benchmark: key,
        runtime: successfulBenchmarkData[key].runtime,
      };
    })
    .sort((a, b) => {
      return a.runtime - b.runtime;
    });

  if (chartData.length === 0) {
    return <p className="text-center">No data available</p>;
  }

  const getBarTextClassName = (d: IDataPoint) => {
    const benchmarkData = successfulBenchmarkData[d.category];
    if (benchmarkData?.status !== "ok") {
      return "text-[10px] font-extrabold fill-red-500 mb-2";
    }
    return "text-[10px] fill-dark-grey";
  };

  const getAxisLabelTitle = (d: IDataPoint) => {
    const benchmarkData = successfulBenchmarkData[d.category];
    if (benchmarkData?.status !== "ok") {
      return "TO";
    }
    return humanizeSeconds(Number(d.value));
  };

  const getXAxisTooltipFormat = (d: IDataPoint) => {
    const benchmarkData = successfulBenchmarkData[d.category];
    let solver = "";
    if (benchmarkData?.status === "ok") {
      solver = `Solver: ${benchmarkData?.solver}<br/>
            `;
    }

    return `Benchmark: ${d.category}<br/>
              Runtime: ${humanizeSeconds(Number(d.value))} <br/>
              ${solver}
              Status: ${benchmarkData?.status}<br/>
            `;
  };

  const getTransformHeightValue = (d: IDataPoint) => {
    if (successfulBenchmarkData[d.category].status !== "ok") return 1;
    return Number(d.value);
  };

  const chartLegend = () => (
    <div className="flex flex-col gap-2 border border-stroke rounded-xl px-2 py-1">
      {availableSolvers.map((solverKey) => (
        <div
          key={solverKey}
          className="capitalize text-navy tag-line-xs flex items-center gap-1.5 rounded-md h-max w-max"
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
      <div className="flex items-center gap-4 mb-4 cursor-pointer">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={allSolvers}
            onChange={() => setallSolvers(true)}
          />
          <label className="cursor-pointer" onClick={() => setallSolvers(true)}>
            all solvers
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={!allSolvers}
            onChange={() => setallSolvers(false)}
          />
          <label
            className="cursor-pointer"
            onClick={() => setallSolvers(false)}
            htmlFor="openSolvers"
          >
            open solvers only
          </label>
        </div>
      </div>
      <div>
        <D3GroupedBarChart
          title="Runtime of fastest solver"
          chartData={chartData}
          normalize={false}
          categoryKey="benchmark"
          colors={(d) => {
            if (!d?.category) return "grey";

            if (successfulBenchmarkData[d.category].status !== "ok") {
              return "text-dark-grey";
            }
            return getSolverColor(successfulBenchmarkData[d.category].solver);
          }}
          barOpacity={(d) => {
            if (successfulBenchmarkData[d.category].status !== "ok") {
              return 0.5;
            }
            return 1;
          }}
          xAxisLabel=""
          yAxisLabel="Runtime (s)"
          height={400}
          rotateXAxisLabels={false}
          customLegend={chartLegend}
          barTextClassName={getBarTextClassName}
          xAxisTooltipFormat={getXAxisTooltipFormat}
          axisLabelTitle={getAxisLabelTitle}
          xAxisBarTextClassName="text-[8px] fill-dark-grey"
          transformHeightValue={getTransformHeightValue}
        />
      </div>
    </>
  );
};

export default RuntimeOfFastestSolver;
