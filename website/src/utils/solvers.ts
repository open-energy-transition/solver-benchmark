const solverLabels = new Map<string, string>([
  ["glpk", "GLPK"],
  ["scip", "SCIP"],
  ["highs", "HiGHS"],
  ["na", "N/A"],
  ["single", "Single"],
  ["multi", "Multi"],
  ["other", "Other"],
  ["realistic", "Realistic"],
]);

const HIPO_SOLVERS = ["highs-hipo", "highs-ipx"];

function getSolverLabel(solverName: string): string {
  if (HIPO_SOLVERS.includes(solverName)) {
    return `${solverName}*`;
  }
  return solverLabels.get(solverName) ?? solverName;
}

function formatSolverWithVersion(solverWithVersion: string) {
  const [solver, version] = solverWithVersion.split("--");
  return `${getSolverLabel(solver)} v${version}`;
}

export { getSolverLabel, formatSolverWithVersion, HIPO_SOLVERS };
