import { useSelector } from "react-redux";
import { useMemo, useState } from "react";

import { SolverStatusType } from "@/types/benchmark";
import { IResultState } from "@/types/state";
import { MetaData } from "@/types/meta-data";
import D3PlotChartPerformanceScaling from "./D3PlotChartPerformanceScalling";

const PerformanceScalling = () => {
  const [allSolvers, setallSolvers] = useState(false);

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => state.results.rawBenchmarkResults,
  );

  const minRuntime = useMemo(() => {
    const value = rawBenchmarkResults
      .filter((element) => element.status === "ok")
      .reduce(
        (min, element) => Math.min(min, element.runtime),
        Number.MAX_SAFE_INTEGER,
      );

    // Floor to nearest 0.01
    return Math.floor(value * 100) / 100;
  }, [rawBenchmarkResults]);

  const benchmarkResults = useMemo(
    () =>
      rawBenchmarkResults.filter((result) =>
        allSolvers ? true : result.solver !== "gurobi",
      ),
    [rawBenchmarkResults, allSolvers],
  );
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const successfulResults = benchmarkResults.filter((result) => {
    return result.status === "ok";
  });

  const successfulProblemsData = Array.from(
    new Set(
      successfulResults.map((result) => `${result.benchmark} ${result.size}`),
    ),
  ).reduce<Record<string, { runtime: number; numVariables: number }>>(
    (acc, problemKey) => {
      const [benchmark, size] = problemKey.split(" ");
      const numVariables =
        metaData[`${benchmark}-${size}` as keyof MetaData]?.numVariables ?? 0;
      return {
        ...acc,
        [problemKey]: {
          runtime: Number.MAX_VALUE,
          numVariables: numVariables || 0,
        },
      };
    },
    {},
  );

  successfulResults.forEach((result) => {
    const key = `${result.benchmark} ${result.size}`;
    if (successfulProblemsData[key].runtime > result.runtime) {
      successfulProblemsData[key].runtime = result.runtime;
    }
  });

  const problemKeys = new Set(
    benchmarkResults.map((result) => `${result.benchmark} ${result.size}`),
  );

  const timedOutProblemsData: {
    key: string;
    numVariables: number | null | undefined;
    runtime: number | undefined;
  }[] = [];

  Array.from(problemKeys).forEach((key) => {
    const [benchmark, size] = key.split(" ");
    const statuses = benchmarkResults
      .filter((result) => {
        return result.benchmark === benchmark && result.size === size;
      })
      .map((result) => result.status);
    if (statuses.every((status) => status === "TO")) {
      timedOutProblemsData.push({
        key: key,
        numVariables:
          metaData[`${benchmark}-${size}` as keyof MetaData]?.numVariables,
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
    ...Object.keys(successfulProblemsData).map((key) => {
      const d = successfulProblemsData[key];
      return {
        problem: key,
        numVariables: d.numVariables,
        runtime: d.runtime,
        status: "ok" as SolverStatusType,
      };
    }),
    ...timedOutProblemsData.map((d) => ({
      problem: d.key,
      numVariables: d.numVariables ?? 0,
      runtime: d.runtime ?? 0,
      status: "TO" as SolverStatusType,
    })),
  ];

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="solver-filter"
            checked={!allSolvers}
            onChange={() => setallSolvers(false)}
          />
          <span className="text-sm text-navy">Open solvers only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="solver-filter"
            checked={allSolvers}
            onChange={() => setallSolvers(true)}
          />
          <span className="text-sm text-navy">All solvers</span>
        </label>
      </div>
      <div className="bg-white p-4 rounded-xl">
        <D3PlotChartPerformanceScaling
          chartData={chartData}
          minYaxis={minRuntime}
          solverColor={allSolvers ? "gurobi" : "highs"}
        />
      </div>
    </>
  );
};

export default PerformanceScalling;
