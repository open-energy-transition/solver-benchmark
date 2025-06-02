import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChartCompare from "./ChartCompare";
import { IResultState } from "@/types/state";
import { formatSolverWithVersion } from "@/utils/solvers";
import { CircleIcon, CloseIcon } from "@/assets/icons";
import { getLogScale } from "@/utils/logscale";
import { SolverMetrics } from "@/types/compare-solver";
import { roundNumber } from "@/utils/number";

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
    const commonInstances = data1.filter((d1) =>
      data2.some((d2) => d2.benchmark === d1.benchmark && d2.size === d1.size),
    );

    setChartData(
      commonInstances.map((d1) => {
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
  <div class="text-sm 4xl:text-lg">
    <strong>Name:</strong> ${d.benchmark}<br>
    <strong>Size:</strong> ${d.size}<br>
    <strong>${solver1.replace("--", " (")}):</strong> ${roundNumber(
      d.d1.memoryUsage,
      2,
    )} MB (${d.d1.status})<br>
    <strong>${solver2.replace("--", " (")}):</strong> ${roundNumber(
      d.d2.memoryUsage,
      2,
    )} MB (${d.d2.status})<br>
  </div>
`;

  return (
    <div>
      <div className="flex flex-row gap-2 sm:gap-0 mb-4">
        <div className="w-full sm:w-1/2 bg-[#F0F4F2] rounded-lg sm:rounded-l-lg sm:rounded-r-none">
          <h6 className="p-2 sm:p-3 pl-3.5">Solver 1</h6>
          <select
            name="solver1"
            value={solver1}
            onChange={(event) => setSolver1(event.target.value)}
            className="w-full text-lg font-bold pl-3 bg-[#F0F4F2] px-4 sm:px-6 py-3 sm:py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-sm sm:text-base rounded-b-lg block focus-visible:outline-none 4xl:text-lg"
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {formatSolverWithVersion(solver)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-1/2 bg-[#E1E5F2] rounded-lg sm:rounded-r-lg sm:rounded-l-none">
          <h6 className="p-2 sm:p-3 pl-3.5">Solver 2</h6>
          <select
            name="solver2"
            value={solver2}
            onChange={(event) => setSolver2(event.target.value)}
            className="w-full text-lg pl-3 font-bold bg-[#E1E5F2] px-4 sm:px-6 py-3 sm:py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-sm sm:text-base rounded-b-lg block focus-visible:outline-none 4xl:text-lg"
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {formatSolverWithVersion(solver)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="py-2">
        <h6 className="text-navy">Comparison</h6>
        <p className="mb-6 mt-4 max-w-screen-lg">
          The benchmarks on the upper triangle of each graph are those where
          Solver 1 performs better, and those in the lower triangle are those
          where Solver 2 performs better. Click on any point in this graph to
          see details of that benchmark instance.
          <p className="flex gap-1 items-center text-dark-grey text-sm">
            <CloseIcon className="size-3" />
            represents benchmark instances where at least one of the solvers
            failed to solve within the time limit, while
            <CircleIcon className="size-3" />
            indicates that both solvers ran successfully.
          </p>
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <ChartCompare
            chartData={chartData.map((d) => ({
              xaxis: d.d1.logRuntime,
              yaxis: d.d2.logRuntime,
              status: d.status,
              size: d.size,
              benchmark: d.benchmark,
              d1: d.d1,
              d2: d.d2,
            }))}
            title={{
              xaxis: `Log runtime (s) of ${solver1.replace("--", " (")})`,
              yaxis: `Log runtime (s) of ${solver2.replace("--", " (")})`,
            }}
            backgroundColor={{
              upper: "#F0F4F2",
              lower: "#E1E5F2",
            }}
            solver1={solver1}
            solver2={solver2}
          />
          <div className="w-full font-league text-[#8C8C8C] text-center mt-4 text-medium-normal">
            Runtime Comparison
          </div>
        </div>
        <div className="w-full lg:w-1/2">
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
            backgroundColor={{
              upper: "#F0F4F2",
              lower: "#E1E5F2",
            }}
            solver1={solver1}
            solver2={solver2}
            tooltipTemplate={memoryUsageTooltipTemplate}
          />
          <div className="w-full font-league text-medium-normal text-[#8C8C8C] text-center mt-4">
            Memory Usage Comparison
          </div>
        </div>
      </div>
    </div>
  );
};
export default SolverSelection;
