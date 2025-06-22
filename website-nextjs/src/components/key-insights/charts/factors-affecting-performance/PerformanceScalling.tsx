import { useSelector } from "react-redux";
import { useState } from "react";

import { SolverStatusType } from "@/types/benchmark";
import { IResultState } from "@/types/state";
import { MetaData } from "@/types/meta-data";
import D3PlotChartPerformanceScaling from "./D3PlotChartPerformanceScalling";

const PerformanceScalling = () => {
  const [allSolvers, setallSolvers] = useState(false);

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.rawBenchmarkResults;
  }).filter((result) => (allSolvers ? true : result.solver !== "gurobi"));

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const successfulResults = benchmarkResults.filter((result) => {
    return result.status === "ok";
  });

  const successfulBenchmarkData = Array.from(
    new Set(
      successfulResults.map((result) => `${result.benchmark} ${result.size}`),
    ),
  ).reduce<Record<string, { runtime: number; numVariables: number }>>(
    (acc, instance) => {
      const [benchmark, size] = instance.split(" ");
      const numVariables =
        metaData[benchmark as keyof MetaData].sizes.find((s) => s.name === size)
          ?.numVariables ?? 0;
      return {
        ...acc,
        [instance]: {
          runtime: Number.MAX_VALUE,
          numVariables: numVariables || 0,
        },
      };
    },
    {},
  );

  successfulResults.forEach((result) => {
    const key = `${result.benchmark} ${result.size}`;
    if (successfulBenchmarkData[key].runtime > result.runtime) {
      successfulBenchmarkData[key].runtime = result.runtime;
    }
  });

  const benchmarkInstances = new Set(
    benchmarkResults.map((result) => `${result.benchmark} ${result.size}`),
  );

  const timedOutBenchmarkData: {
    key: string;
    numVariables: number | null | undefined;
    runtime: number | undefined;
  }[] = [];

  Array.from(benchmarkInstances).forEach((key) => {
    const [benchmark, size] = key.split(" ");
    const statuses = benchmarkResults
      .filter((result) => {
        return result.benchmark === benchmark && result.size === size;
      })
      .map((result) => result.status);
    if (statuses.every((status) => status === "TO")) {
      timedOutBenchmarkData.push({
        key: key,
        numVariables: metaData[benchmark as keyof MetaData].sizes.find(
          (s) => s.name === size,
        )?.numVariables,
        runtime: benchmarkResults.find((result) => {
          return (
            result.benchmark === benchmark &&
            result.size === size &&
            result.status !== "ok"
          );
        })?.timeout,
      });
    }
  });

  const chartData = [
    ...Object.keys(successfulBenchmarkData).map((key) => {
      const d = successfulBenchmarkData[key];
      return {
        benchmark: key,
        numVariables: d.numVariables,
        runtime: d.runtime,
        status: "ok" as SolverStatusType,
      };
    }),
    ...timedOutBenchmarkData.map((d) => ({
      benchmark: d.key,
      numVariables: d.numVariables ?? 0,
      runtime: d.runtime ?? 0,
      status: "TO" as SolverStatusType,
    })),
  ];

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={!allSolvers}
            onChange={() => setallSolvers(false)}
          />
          <p className="cursor-pointer" onClick={() => setallSolvers(false)}>
            Open solvers only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={allSolvers}
            onChange={() => setallSolvers(true)}
          />
          <p className="cursor-pointer" onClick={() => setallSolvers(true)}>
            All solvers
          </p>
        </div>
      </div>
      <div>
        <D3PlotChartPerformanceScaling
          chartData={chartData}
          solverColor={allSolvers ? "gurobi" : "highs"}
        />
      </div>
    </>
  );
};

export default PerformanceScalling;
