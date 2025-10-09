import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { IResultState } from "@/types/state";
import PerformanceBarChart from "@/components/shared/PerformanceBarChart";
import { FaGlobe, FaGithub, FaBalanceScale } from "react-icons/fa";
import { getLogScale } from "@/utils/logscale";
import { SolverStatusType } from "@/types/benchmark";
import CustomDropdown from "@/components/common/CustomDropdown";

const SOLVES_DATA = [
  {
    label: "HiGHS",
    name: "highs",
    sourceCode: "https://github.com/ERGO-Code/HiGHS",
    website: "https://highs.dev/",
    license: "MIT License",
  },
  {
    label: "SCIP",
    name: "scip",
    sourceCode: "https://github.com/scipopt/scip",
    website: "https://www.scipopt.org/",
    license: "Apache License 2.0",
  },
  {
    label: "CBC",
    name: "cbc",
    sourceCode: "https://github.com/coin-or/Cbc",
    website: "https://coin-or.github.io/Cbc/intro.html",
    license: "Eclipse Public License 2.0",
  },
  {
    label: "GLPK",
    name: "glpk",
    sourceCode: "https://github.com/firedrakeproject/glpk",
    website: "https://www.gnu.org/software/glpk/",
    license: "GNU General Public License v3.0",
  },
  {
    label: "Gurobi",
    name: "gurobi",
    website: "https://www.gurobi.com/solutions/gurobi-optimizer/",
    license: "Commercial License",
  },
];

const SolverSection = () => {
  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const rawBenchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults;
    },
  );

  const benchmarkSuccessMap = new Map<string, number>();

  // Count successful solves for each benchmark
  rawBenchmarkLatestResults.forEach((result) => {
    const key = `${result.benchmark}-${result.size}`;
    benchmarkSuccessMap.set(key, (benchmarkSuccessMap.get(key) || 0) + 1);
  });

  // Filter results where all solvers succeeded
  const benchmarkLatestResults = rawBenchmarkLatestResults;

  const [selectedSolver, setSelectedSolver] = useState("");

  const [solverOptions, setSolverOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!availableSolvers.length) return;
    setSelectedSolver(availableSolvers[0]);
    setSolverOptions(availableSolvers);
  }, [availableSolvers]);

  function calculateFactor(baseTime: number, solverTime: number) {
    return Math.log2((solverTime + 10) / (baseTime + 10));
  }

  const chartData = useMemo(() => {
    if (!selectedSolver) return [];

    // Get base solver data points (these will show as factor = 0)
    const baseData = benchmarkLatestResults
      .filter((result) => result.solver === selectedSolver)
      .map((result) => ({
        benchmark: result.benchmark,
        solver: result.solver,
        size: result.size,
        status: result.status,
        runtime: result.runtime || 0,
        baseSolverRuntime: result.runtime || 0,
        baseSolverStatus: result.status,
        factor: 0, // log2(1) = 0,
        logRuntime: getLogScale(result.runtime || 0),
      }));

    // Get comparison data points
    const comparisonData = benchmarkLatestResults
      .filter((result) => result.solver !== selectedSolver)
      .map((oData) => {
        const sData = baseData.find(
          (sData) =>
            sData.benchmark === oData.benchmark && sData.size === oData.size,
        );
        if (!sData) {
          // If no base solver data exists for this benchmark/size,
          // set factor to 1 to hide it in the chart
          return {
            benchmark: oData.benchmark,
            solver: oData.solver,
            status: oData.status,
            size: oData.size,
            runtime: oData.runtime || 0,
            baseSolverRuntime: 1,
            baseSolverStatus: "TO" as SolverStatusType,
            factor: 1,
            logRuntime: 1,
          };
        }
        return {
          benchmark: oData.benchmark,
          solver: oData.solver,
          status: oData.status,
          size: oData.size,
          runtime: oData.runtime || 0,
          baseSolverRuntime: sData?.runtime || 0,
          baseSolverStatus: sData?.status,
          factor: calculateFactor(sData?.runtime || 0, oData.runtime || 0),
          logRuntime: getLogScale(oData.runtime || 0),
        };
      });

    const baseRuntimes = new Map(
      baseData.map((d) => [`${d.benchmark}-${d.size}`, d.runtime]),
    );

    // Combine and sort all data
    return [...baseData, ...comparisonData].sort((a, b) => {
      const aBaseRuntime = baseRuntimes.get(`${a.benchmark}-${a.size}`) || 0;
      const bBaseRuntime = baseRuntimes.get(`${b.benchmark}-${b.size}`) || 0;

      // Sort by base solver runtime
      if (aBaseRuntime !== bBaseRuntime) {
        return aBaseRuntime - bBaseRuntime;
      }

      // Put base solver first within each benchmark group
      return a.solver === selectedSolver ? -1 : 1;
    });
  }, [selectedSolver, benchmarkLatestResults]);

  const selectedSolverInfo = useMemo(() => {
    if (!selectedSolver) return null;
    const solverName = selectedSolver.split("--")[0].toLowerCase();
    return SOLVES_DATA.find((s) => s.name.toLowerCase() === solverName);
  }, [selectedSolver]);

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Solver select */}
        <div className="w-full lg:w-1/2 bg-[#F0F4F2] rounded-lg shadow-sm">
          <h6 className="p-3 pl-3.5 border-b border-gray-200">Select Solver</h6>
          <CustomDropdown
            value={selectedSolver}
            onChange={setSelectedSolver}
            options={solverOptions}
            formatOption={(solver: string) => solver}
            label="Solver"
            bgColor="bg-[#F0F4F2]"
            optionActiveBg="bg-[#F0F4F2]"
            className="font-bold text-navy tag-line-lg"
          />
        </div>

        {/* Enhanced solver info section */}
        {selectedSolverInfo && (
          <div className="w-full lg:w-1/2 bg-[#F0F4F2] rounded-lg shadow-sm">
            <h6 className="p-3 pl-3.5 border-b border-gray-200">
              Solver Information
            </h6>
            <div className="p-4">
              <div className="mb-4 text-navy tag-line-lg font-bold">
                {selectedSolverInfo.label}
              </div>
              <div className="space-y-3">
                <a
                  href={selectedSolverInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors"
                >
                  <FaGlobe className="w-5 h-5" />
                  <span className="hover:underline underline-offset-4">
                    Official Website
                  </span>
                </a>
                {selectedSolverInfo.sourceCode && (
                  <a
                    href={selectedSolverInfo.sourceCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 transition-colors"
                  >
                    <FaGithub className="w-5 h-5" />
                    <span className="hover:underlineunderline-offset-4">
                      Source Code
                    </span>
                  </a>
                )}
                <div className="flex items-center gap-3 transition-colors">
                  <FaBalanceScale className="w-5 h-5" />
                  <span>{selectedSolverInfo.license}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <PerformanceBarChart
          key={solverOptions.join("-")}
          data={chartData}
          baseSolver={selectedSolver.split("--")[0]}
          availableSolvers={availableSolvers}
        />
      )}
    </div>
  );
};
export default SolverSection;
