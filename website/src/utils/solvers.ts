const solverLabels = new Map<string, string>([
  ["glpk", "GLPK"],
  ["scip", "SCIP"],
  ["highs", "HiGHS"],
  ["cbc", "CBC"],
  ["gurobi", "Gurobi"],
  ["highs-hipo", "HiGHS-HiPO"],
  ["highs-ipx", "HiGHS-IPX"],
  ["na", "N/A"],
  ["single", "Single"],
  ["multi", "Multi"],
  ["other", "Other"],
  ["realistic", "Realistic"],
]);

const HIPO_SOLVERS = ["highs-hipo", "highs-ipx"];

function getSolverLabel(solverName: string): string {
  const label = solverLabels.get(solverName) ?? solverName;
  return HIPO_SOLVERS.includes(solverName) ? `${label}*` : label;
}

function formatSolverWithVersion(solverWithVersion: string) {
  const [solver, version] = solverWithVersion.split("--");
  return `${getSolverLabel(solver)} v${version}`;
}

export { getSolverLabel, formatSolverWithVersion, HIPO_SOLVERS };
