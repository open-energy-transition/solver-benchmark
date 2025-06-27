import { useEffect, useMemo, useState } from "react";
import D3SolverEvolutionChart from "@/components/shared/D3SolverEvolutionChart";
import {
  ISolverYearlyChartData,
  ISolverYearlyMetrics,
} from "@/types/benchmark";

interface SolverEvolutionData {
  year: number;
  version: string;
  unsolvedCount: number;
  speedUp: number;
  sgmRuntime: number;
}

interface ISolverEvolutionSection {
  solverYearlyMetrics: ISolverYearlyMetrics[];
  numSolvedBenchMark: ISolverYearlyChartData[];
  totalBenchmarks: number;
  title?: string;
  description?: string;
}

const SolverEvolutionSection = ({
  solverYearlyMetrics,
  numSolvedBenchMark,
  totalBenchmarks,
  title = "Individual Solver Performance Evolution",
  description = "The chart below shows the performance evolution for the selected solver. The bars represent the number of unsolved problems in the benchmark set, while the red line shows the SGM runtime speed-up relative to the first version we have data for (higher values indicate better performance).",
}: ISolverEvolutionSection) => {
  const [selectedSolver, setSelectedSolver] = useState("");

  const solverEvolutionData = useMemo(() => {
    const result: Record<string, SolverEvolutionData[]> = {};

    solverYearlyMetrics.forEach((solverMetric) => {
      const solverName = solverMetric.solver;

      // Get solved benchmark data for this solver
      const solvedDataForSolver = numSolvedBenchMark.filter(
        (item) => item.solver === solverName,
      );

      // Sort years to ensure we get the first year correctly
      const sortedData = solverMetric.data
        .filter((d) => {
          const runtime = d.sgm.runtime;
          return (
            runtime !== null &&
            runtime !== undefined &&
            !isNaN(runtime) &&
            runtime > 0
          );
        })
        .sort((a, b) => a.year - b.year);

      if (sortedData.length === 0) {
        return;
      }

      // Get first year's SGM runtime for normalization
      const firstYearSgmRuntime = sortedData[0].sgm.runtime!;

      const solverData: SolverEvolutionData[] = [];

      sortedData.forEach((yearData) => {
        const year = yearData.year;
        const sgmRuntime = yearData.sgm.runtime!;

        // Find solved count for this year
        const solvedData = solvedDataForSolver.find(
          (item) => item.year === year,
        );
        const solvedCount = solvedData?.value || 0;
        const unsolvedCount = Math.max(0, totalBenchmarks - solvedCount);

        // Calculate speed-up relative to first year (higher = better)
        const speedUp = firstYearSgmRuntime / sgmRuntime;

        solverData.push({
          year,
          version: yearData.version,
          unsolvedCount,
          speedUp,
          sgmRuntime,
        });
      });

      if (solverData.length > 0) {
        result[solverName] = solverData;
      }
    });

    return result;
  }, [solverYearlyMetrics, numSolvedBenchMark, totalBenchmarks]);

  // Sort solvers by number of data points (descending), then alphabetically
  const sortedSolverNames = useMemo(() => {
    return Object.keys(solverEvolutionData).sort((a, b) => {
      const aPoints = solverEvolutionData[a].length;
      const bPoints = solverEvolutionData[b].length;

      // Sort by number of data points (descending)
      if (aPoints !== bPoints) {
        return bPoints - aPoints;
      }

      // If same number of points, sort alphabetically
      return a.localeCompare(b);
    });
  }, [solverEvolutionData]);

  // Set default selected solver when data changes
  useEffect(() => {
    if (sortedSolverNames.length > 0 && !selectedSolver) {
      setSelectedSolver(sortedSolverNames[0]);
    }
  }, [sortedSolverNames, selectedSolver]);

  if (sortedSolverNames.length === 0) {
    return null;
  }

  const domain = Object.values(solverEvolutionData).reduce<[number, number]>(
    (domain, solverData) => {
      const speedUps = solverData.map((item) => item.speedUp);
      return [
        Math.min(domain[0], ...speedUps),
        Math.max(domain[1], ...speedUps),
      ];
    },
    [Number.MAX_SAFE_INTEGER, 0],
  );

  const selectedSolverData = selectedSolver
    ? solverEvolutionData[selectedSolver]
    : null;

  return (
    <div className="mt-8 mb-6">
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600 max-w-4xl mb-4">{description}</p>

        {/* Solver Dropdown */}
        <div className="w-1/4 bg-[#F0F4F2] rounded-lg shadow-sm mb-6">
          <h6 className="p-3 pl-3.5 border-b border-gray-200">Select Solver</h6>
          <select
            name="solver"
            value={selectedSolver}
            onChange={(event) => setSelectedSolver(event.target.value)}
            className="w-full text-lg font-bold pl-3 bg-[#F0F4F2] px-6 py-4 border-r-[1.5rem]
            border-transparent text-navy sm:text-base rounded-b-lg block focus-visible:outline-none"
          >
            <option disabled value="">
              Select a solver
            </option>
            {sortedSolverNames.map((solverName) => (
              <option key={solverName} value={solverName}>
                {solverName.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Single Chart Display */}
      {selectedSolver && selectedSolverData && (
        <D3SolverEvolutionChart
          key={selectedSolver}
          totalBenchmarks={totalBenchmarks}
          yRightDomain={domain}
          solverName={selectedSolver}
          data={selectedSolverData}
          colorIndex={0} // Can be 0 since we're only showing one chart
          className="w-full"
        />
      )}

      {/* No data message */}
      {selectedSolver && !selectedSolverData && (
        <div className="text-center text-gray-500 py-8">
          No data available for the selected solver.
        </div>
      )}
    </div>
  );
};

export default SolverEvolutionSection;
