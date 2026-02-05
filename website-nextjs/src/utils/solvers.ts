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

const HIPO_SOLVERS = ["highs-hipo", "highs-ipm"];

export { getSolverLabel, formatSolverWithVersion, HIPO_SOLVERS };
