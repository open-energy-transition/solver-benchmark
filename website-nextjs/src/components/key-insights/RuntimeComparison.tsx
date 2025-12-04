import { useSelector } from "react-redux";
import { useCallback } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { calculateSgm } from "@/utils/calculations";

const PROBLEM_SIZE_FILTERS = [
  {
    label: "Small",
    key: "small",
    filter: {
      size: "S",
    },
  },
  {
    label: "Medium & realistic",
    key: "medium_realistic",
    filter: {
      size: "M",
      realistic: true,
    },
  },
  {
    label: "Medium",
    key: "medium",
    filter: {
      size: "M",
    },
  },
  {
    label: "Large",
    key: "large",
    filter: {
      size: "L",
    },
  },
  {
    label: "Large & realistic",
    key: "large_realistic",
    filter: {
      size: "L",
      realistic: true,
    },
  },
];

const RuntimeComparison = () => {
  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  );

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const findData = useCallback(
    (key: string) => {
      return benchmarkLatestResults.find((result) => result.solver === key);
    },
    [benchmarkLatestResults],
  );

  const solverPerformanceBySize = PROBLEM_SIZE_FILTERS.map((filterConfig) => {
    const benchmarkDatas = benchmarkLatestResults.filter((result) => {
      const instances = metaData[result.benchmark].sizes
        .filter(
          (sizeInfo) =>
            sizeInfo.size === filterConfig.filter.size &&
            (filterConfig.filter.realistic
              ? sizeInfo.realistic === filterConfig.filter.realistic
              : true),
        )
        .map((sizeInfo) => sizeInfo.name);
      return instances.includes(result.size);
    });
    const solversData = availableSolvers.map((solver) => {
      const solverResults = benchmarkDatas.filter((d) => d.solver === solver);
      return {
        solver,
        data: calculateSgm(solverResults.map((d) => d.runtime)),
        total: solverResults.length,
        problemText: `${solverResults.length} ${
          solverResults.length === 1 ? "problem" : "problems"
        }`,
        timeout: solverResults.length
          ? humanizeSeconds(solverResults[0]?.timeout)
          : "",
      };
    });
    return {
      key: filterConfig.key,
      solversData,
    };
  });

  const chartData = solverPerformanceBySize.map((filterConfig) => {
    return {
      key: filterConfig.key,
      ...Object.fromEntries(
        filterConfig.solversData
          .filter((solver) => !isNaN(solver.data))
          .map((d) => [d.solver, d.data]),
      ),
    };
  });

  const tooltipFormat = useCallback(
    (d: { key: string; value: string | number; category: string | number }) => {
      const data = chartData.find((data) => data.key === d.category) as
        | Record<string, string | number>
        | undefined;
      return `Solver: ${d.key}<br/>
              Runtime: ${humanizeSeconds(Number(data ? data[d.key] : 0))} <br/>
            `;
    },
    [findData],
  );

  const getAxisLabelTitle = useCallback(
    (d: { key: string; value: unknown }) => {
      const valueNum = typeof d.value === "number" ? d.value : Number(d.value);
      return `${isNaN(valueNum) ? "-" : valueNum.toFixed(1)}x`;
    },
    [findData],
  );

  const getXAxisTickFormat = useCallback(
    (value: string) => {
      const solverData = solverPerformanceBySize.find(
        (solver) => solver.key === value,
      );
      if (!solverData) return value;
      const filteredSolvers = solverData.solversData.filter(
        (solver) => !isNaN(solver.data),
      );
      const maxTotal = Math.max(...filteredSolvers.map((s) => s.total));
      const problemText = `${maxTotal} ${
        maxTotal === 1 ? "problem" : "problems"
      }`;
      const timeout =
        filteredSolvers.find((s) => s.total === maxTotal)?.timeout || "";
      const minRuntime = Math.min(...filteredSolvers.map((s) => s.data));

      return `${
        PROBLEM_SIZE_FILTERS.find((f) => f.key === value)?.label || value
      } (${problemText}; ${timeout} timeout)
      Fastest solver: ${humanizeSeconds(minRuntime)}
      `;
    },
    [benchmarkLatestResults],
  );

  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title="Runtime relative to fastest solver"
        chartData={chartData}
        categoryKey="key"
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        diagonalXAxisLabelsOnMobile
        yAxisLabel="Relative runtime (normalized)"
        chartHeight={400}
        rotateXAxisLabels={false}
        tooltipFormat={tooltipFormat}
        xAxisBarTextClassName="text-[10px] fill-dark-grey"
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        transformHeightValue={(d) => {
          return Number(d.value);
        }}
      />
    </div>
  );
};

export default RuntimeComparison;
