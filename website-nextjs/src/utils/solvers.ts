const solverLabels = new Map<string, string>([
    ["glpk", "GLPK"],
    ["scip", "SCIP"],
    ["highs", "HiGHS"],
  ]);

  function getSolverLabel(solverName: string): string {
    const normalizedSolverName = solverName.toLowerCase();
    return solverLabels.get(normalizedSolverName) || "Unknown Solver";
  }

  export { getSolverLabel };
