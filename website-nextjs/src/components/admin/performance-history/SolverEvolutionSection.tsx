import { useMemo } from "react";
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
}

const SolverEvolutionSection = ({
  solverYearlyMetrics,
  numSolvedBenchMark,
  totalBenchmarks,
}: ISolverEvolutionSection) => {
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

  if (sortedSolverNames.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 mb-6">
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">
          Individual Solver Performance Evolution
        </h4>
        <p className="text-gray-600 max-w-4xl">
          The charts below show the performance evolution for each solver
          individually. The blue bars represent the number of unsolved problems
          in the benchmark set, while the red line shows the SGM runtime
          speed-up relative to the first version we have data for (higher values
          indicate better performance).
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {sortedSolverNames.map((solverName, index) => (
          <D3SolverEvolutionChart
            key={solverName}
            solverName={solverName}
            data={solverEvolutionData[solverName]}
            colorIndex={index}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
};

export default SolverEvolutionSection;
