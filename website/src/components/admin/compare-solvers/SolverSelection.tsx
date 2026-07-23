import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChartCompare from "./ChartCompare";
import { IResultState } from "@/types/state";
import { formatSolverWithVersion } from "@/utils/solvers";
import { CircleIcon, CloseIcon } from "@/assets/icons";
import { getLogScale } from "@/utils/logscale";
import { SolverMetrics } from "@/types/compare-solver";
import { formatDecimal } from "@/utils/number";
import { calculateScaleRangeAndTicks } from "@/utils/chart";
import CustomDropdown from "@/components/common/CustomDropdown";
import BasicVsFeasible from "@/components/shared/BasicVsFeasible";

const SolverSelection = () => {
  const solversData = useSelector((state: { results: IResultState }) => {
    return state.results.solversData;
  });

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkResults;
  });

  const [solver1, setSolver1] = useState("");
  const [solver2, setSolver2] = useState("");

  const [solverOptions, setSolverOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!solversData.length) return;
    setSolver1(`${solversData[0].solver}--${solversData[0].versions[0]}`);
    setSolver2(`${solversData[1].solver}--${solversData[1].versions[0]}`);
    setSolverOptions(
      solversData.flatMap((s) =>
        s.versions.map((version) => `${s.solver}--${version}`),
      ),
    );
  }, [solversData]);

  interface ChartData {
    d1: SolverMetrics;
    d2: SolverMetrics;
    status: "TO-TO" | "ok-ok" | "ok-TO" | "TO-ok";
    benchmark: string;
    size: string;
  }

  const [chartData, setChartData] = useState<ChartData[]>([]);

  function formatStatus(status: string) {
    if (status !== "ok") {
      return "TO";
    }
    return status;
  }

  useEffect(() => {
    const [s1, v1] = solver1.split("--");
    const [s2, v2] = solver2.split("--");

    const data1 = benchmarkResults.filter(
      (result) => result.solver === s1 && result.solverVersion === v1,
    );
    const data2 = benchmarkResults.filter(
      (result) => result.solver === s2 && result.solverVersion === v2,
    );

    // Find common benchmark-size pairs
    const commonProblems = data1.filter((d1) =>
      data2.some((d2) => d2.benchmark === d1.benchmark && d2.size === d1.size),
    );

    setChartData(
      commonProblems.map((d1) => {
        const d2 = data2.find(
          (d2) => d2.benchmark === d1.benchmark && d2.size === d1.size,
        )!;
        return {
          d1: {
            runtime: d1.runtime,
            logRuntime: getLogScale(d1.runtime),
            memoryUsage: d1.memoryUsage,
            status: d1.status,
          },
          d2: {
            runtime: d2.runtime,
            logRuntime: getLogScale(d2.runtime),
            memoryUsage: d2.memoryUsage,
            status: d2.status,
          },
          status: `${formatStatus(d1.status)}-${formatStatus(d2.status)}`,
          benchmark: d1.benchmark,
          size: d1.size,
        };
      }),
    );
  }, [solver1, solver2, benchmarkResults]);

  const memoryUsageTooltipTemplate = (
    d: ChartData,
    solver1: string,
    solver2: string,
  ) => `
  <div class="text-sm">
    <strong>Problem ID:</strong> ${d.benchmark}-${d.size}<br>
    <strong>${solver1.replace("--", " (")}):</strong> ${formatDecimal({
      value: d.d1.memoryUsage,
    })} MB (${d.d1.status})<br>
    <strong>${solver2.replace("--", " (")}):</strong> ${formatDecimal({
      value: d.d2.memoryUsage,
    })} MB (${d.d2.status})<br>
  </div>
`;

  const runtimeLogScale = calculateScaleRangeAndTicks(
    chartData.map((d) => ({
      xaxis: d.d1.runtime,
      yaxis: d.d2.runtime,
    })),
  );

  const memoryUsageLogScale = calculateScaleRangeAndTicks(
    chartData.map((d) => ({
      xaxis: d.d1.memoryUsage,
      yaxis: d.d2.memoryUsage,
    })),
  );

  const compareBackground = {
    upper: "#F0F4F2",
    lower: "#E1E5F2",
  };

  return (
    <div>
      <div className="flex flex-row gap-2 sm:gap-0 mb-4">
        <div className="w-full sm:w-1/2 bg-[#F0F4F2] rounded-lg sm:rounded-l-lg sm:rounded-r-none">
          <h6 className="p-2 sm:p-3 pl-3.5">Solver 1</h6>
          <CustomDropdown
            value={solver1}
            onChange={setSolver1}
            options={solverOptions}
            formatOption={formatSolverWithVersion}
            label="Solver & version"
            bgColor="bg-[#F0F4F2]"
          />
        </div>
        <div className="w-full sm:w-1/2 bg-lavender rounded-lg sm:rounded-r-lg sm:rounded-l-none">
          <h6 className="p-2 sm:p-3 pl-3.5">Solver 2</h6>
          <CustomDropdown
            value={solver2}
            onChange={setSolver2}
            options={solverOptions}
            formatOption={formatSolverWithVersion}
            label="Solver & version"
            bgColor="bg-lavender"
            optionActiveBg="bg-lavender"
          />
        </div>
      </div>
      <div className="py-2">
        <h6>Comparison</h6>
        <p className="mb-6 mt-4 w-full">
          The problems on the upper triangle of each graph are those where
          Solver 1 performs better, and those in the lower triangle are those
          where Solver 2 performs better. Note that we ran problems with two
          different timeout values: smaller problems (S and M) were run with a
          timeout of 1h, while larger problems (L) were run with a timeout of
          24h. Thus, the{" "}
          <span className="mt-1 relative">
            <span className="text-lg leading-none opacity-0">×</span>
            <span className="text-lg absolute top-[-5px] left-0">
              <CloseIcon className="size-3 mt-[9px]" />
            </span>
          </span>{" "}
          s in the graph below might appear at 2 different time values. Click on
          any point in this graph to see details of that benchmark problem.
        </p>
        <p className="mb-1 mt-4 max-w-screen-lg">
          <p className="flex-col gap-1 items-center text-navy text-sm">
            <div className="inline-flex gap-1 items-start">
              <CloseIcon className="size-3 mt-1.5" />
              represents benchmark problems where at least one of the solvers
              failed to solve within the time limit, while
            </div>
            <div className="flex gap-1 items-center">
              <CircleIcon className="size-3" />
              indicates that both solvers ran successfully.
            </div>
          </p>
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <div className="w-full font-league text-navy text-center mt-4 text-medium-normal">
            Runtime
          </div>
          <ChartCompare
            chartData={chartData.map((d) => ({
              xaxis: d.d1.runtime,
              yaxis: d.d2.runtime,
              status: d.status,
              size: d.size,
              benchmark: d.benchmark,
              d1: d.d1,
              d2: d.d2,
            }))}
            title={{
              xaxis: `Runtime (s) of ${solver1.replace("--", " (")})`,
              yaxis: `Runtime (s) of ${solver2.replace("--", " (")})`,
            }}
            backgroundColor={compareBackground}
            solver1={solver1}
            solver2={solver2}
            scaleType="log"
            scaleRange={runtimeLogScale.scaleRange}
            tickValues={runtimeLogScale.tickValues}
          />
        </div>
        <div className="w-full lg:w-1/2">
          <div className="w-full font-league text-medium-normal text-navy text-center mt-4">
            Memory Usage
          </div>
          <ChartCompare
            chartData={chartData.map((d) => ({
              xaxis: d.d1.memoryUsage,
              yaxis: d.d2.memoryUsage,
              status: d.status,
              size: d.size,
              benchmark: d.benchmark,
              d1: d.d1,
              d2: d.d2,
            }))}
            title={{
              xaxis: solver1.replace("--", " (") + ") memory usage (MB)",
              yaxis: solver2.replace("--", " (") + ") memory usage (MB)",
            }}
            backgroundColor={compareBackground}
            solver1={solver1}
            solver2={solver2}
            safeAxes={false}
            showSolverFasterLabels={true}
            tooltipTemplate={memoryUsageTooltipTemplate}
            scaleType="log"
            scaleRange={memoryUsageLogScale.scaleRange}
            tickValues={memoryUsageLogScale.tickValues}
          />
        </div>
      </div>
      <div className="mt-8">
        <BasicVsFeasible />
      </div>
    </div>
  );
};
export default SolverSelection;
