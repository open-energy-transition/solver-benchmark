import { useSelector } from "react-redux";
import { useCallback, useMemo } from "react";

import { IResultState } from "@/types/state";
import D3GroupedBarChart from "@/components/shared/D3GroupedBarChart";
import { getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { calculateSgm } from "@/utils/calculations";
import { ID3GroupedBarChartData } from "@/types/chart";
import { getHighestVersion } from "@/utils/versions";
import { BenchmarkResult } from "@/types/benchmark";

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
    label: "Large & realistic",
    key: "large_realistic",
    filter: {
      size: "L",
      realistic: true,
    },
  },
  {
    label: "Large",
    key: "large",
    filter: {
      size: "L",
    },
  },
];

const RealisticRuntimeComparison = ({
  xAxisLabelWrapLength,
  splitter = "-",
  rotateXAxisLabels = false,
  problemClass = "LP",
  dataSource = "default",
}: {
  xAxisLabelWrapLength?: number;
  splitter?: string;
  rotateXAxisLabels?: boolean;
  problemClass?: "LP" | "MILP";
  dataSource?: "default" | "hipo";
}) => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      if (dataSource === "hipo") {
        return state.results.benchmarkHipoResults;
      }
      return state.results.benchmarkLatestResults;
    },
  ).filter((result) => {
    return metaData[result.benchmark]?.problemClass === problemClass;
  });

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return [...state.results.availableSolvers, "highs-hipo", "highs-ipm"];
  });

  const findData = useCallback(
    (key: string) => {
      return benchmarkLatestResults.find((result) => result.solver === key);
    },
    [benchmarkLatestResults],
  );

  const solverVersions = useMemo(() => {
    const versions: { [key: string]: string[] } = {};
    benchmarkLatestResults.forEach((benchmarkResult) => {
      if (!versions[benchmarkResult.solver]) {
        versions[benchmarkResult.solver] = [];
      }

      if (
        !versions[benchmarkResult.solver].includes(
          benchmarkResult.solverVersion,
        )
      ) {
        versions[benchmarkResult.solver].push(benchmarkResult.solverVersion);
      }
    });
    return versions;
  }, [benchmarkLatestResults]);

  const getNumberSolvedBenchmark = useCallback(
    (solver: string, categoryData: BenchmarkResult[]) => {
      return categoryData.filter(
        (result) => result.status === "ok" && result.solver === solver,
      ).length;
    },
    [],
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
      const solvedCount = getNumberSolvedBenchmark(solver, benchmarkDatas);
      const runtimeSgm = calculateSgm(solverResults.map((d) => d.runtime));

      return {
        solver,
        data: runtimeSgm,
        total: solverResults.length,
        solvedBenchmarks: solvedCount,
        version: getHighestVersion(solverVersions[solver] || []),
        unnormalizedData: {
          runtime: runtimeSgm,
        },
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

  const solverResults = solverPerformanceBySize.flatMap((filterConfig) =>
    filterConfig.solversData
      .filter((solver) => !isNaN(solver.data))
      .map((solverData) => ({
        solver: solverData.solver,
        version: solverData.version,
        unnormalizedData: {
          runtime: solverData.unnormalizedData.runtime,
        },
        solvedBenchmarks: solverData.solvedBenchmarks,
        totalBenchmarks: solverData.total,
        category: filterConfig.key,
      })),
  );

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
    (d: ID3GroupedBarChartData) => {
      const solver = solverResults.find(
        (s) => s.solver === d.key && s.category === d.category,
      );
      const successRate = solver
        ? ((solver.solvedBenchmarks / solver.totalBenchmarks) * 100).toFixed(1)
        : "0";

      return `Solver: ${d.key}${
        solver?.version ? ` v${solver.version}` : ""
      }<br/>
              Average runtime: ${humanizeSeconds(
                solver?.unnormalizedData.runtime ?? 0,
              )} <br/>
              Benchmarks solved: ${solver?.solvedBenchmarks} <br/>
              Success rate: ${successRate}% (${solver?.solvedBenchmarks}/${solver?.totalBenchmarks}) <br/>`;
    },
    [solverResults],
  );

  const getAxisLabelTitle = useCallback(
    (d: { key: string; value: unknown; category: string | number }) => {
      const valueNum = typeof d.value === "number" ? d.value : Number(d.value);
      const solver = solverResults.find(
        (s) => s.solver === d.key && s.category === d.category,
      );
      const successRate = solver
        ? ((solver.solvedBenchmarks / solver.totalBenchmarks) * 100).toFixed(0)
        : "0";

      return `${isNaN(valueNum) ? "-" : valueNum.toFixed(1)}x\n${successRate}%`;
    },
    [solverResults],
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
      }
      (${problemText}; ${timeout} timeout)
      Fastest solver: ${humanizeSeconds(minRuntime)}
      `;
    },
    [benchmarkLatestResults],
  );
  return (
    <div className="my-4 mt-8 rounded-xl">
      <D3GroupedBarChart
        title={`Runtime relative to fastest solver - ${problemClass}${
          dataSource === "hipo" ? " (including HiPO)" : ""
        }`}
        chartData={chartData}
        categoryKey="key"
        colors={(d) => {
          return getSolverColor(d.key);
        }}
        xAxisLabel=""
        yAxisLabel="Relative runtime (normalized)"
        chartHeight={400}
        tooltipFormat={tooltipFormat}
        xAxisBarTextClassName="text-[10px] fill-dark-grey"
        axisLabelTitle={getAxisLabelTitle}
        xAxisTickFormat={getXAxisTickFormat}
        xAxisLabelWrapLength={xAxisLabelWrapLength}
        splitter={splitter}
        rotateXAxisLabels={rotateXAxisLabels}
      />
    </div>
  );
};

export default RealisticRuntimeComparison;
