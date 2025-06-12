import { BenchmarkResult } from "@/types/benchmark";
const solverLabels = new Map<string, string>([
  ["glpk", "GLPK"],
  ["scip", "SCIP"],
  ["highs", "HiGHS"],
]);

function getSolverLabel(solverName: string): string {
  const normalizedSolverName = solverName.toLowerCase();
  return solverLabels.get(normalizedSolverName) || "Unknown Solver";
}

function formatSolverWithVersion(solverWithVersion: string) {
  const [solver, version] = solverWithVersion.split("--");
  return `${solver} v${version}`;
}

function getAvgRuntime({
  solver,
  benchmarkResults,
  version,
}: {
  solver: string;
  benchmarkResults: BenchmarkResult[];
  version: string;
}): number {
  const filteredResults = benchmarkResults.filter(
    (result) => result.solver === solver && result.solverVersion === version,
  );

  if (filteredResults.length === 0) {
    return 0;
  }
  const totalRuntime = filteredResults.reduce((sum, result) => {
    return sum + (result.status === "ok" ? result.runtime : result.timeout);
  }, 0);
  const avgRuntime = totalRuntime / filteredResults.length;

  return avgRuntime;
}

export { getSolverLabel, formatSolverWithVersion, getAvgRuntime };
