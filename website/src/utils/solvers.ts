const solverLabels = new Map<string, string>([
  ["glpk", "GLPK"],
  ["scip", "SCIP"],
  ["highs", "HiGHS"],
]);

const HIPO_SOLVERS = ["highs-hipo", "highs-ipx"];

function getSolverLabel(solverName: string): string {
  if (HIPO_SOLVERS.includes(solverName)) {
    return `${solverName}*`;
  }
  return solverName;
}

function formatSolverWithVersion(solverWithVersion: string) {
  const [solver, version] = solverWithVersion.split("--");
  return `${getSolverLabel(solver)} v${version}`;
}

export { getSolverLabel, formatSolverWithVersion, HIPO_SOLVERS };
