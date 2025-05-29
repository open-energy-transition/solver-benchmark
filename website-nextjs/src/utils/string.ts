export function sortStringArray(
  data: string[],
  direction: "asc" | "desc" = "asc",
): string[] {
  const copy = [...data];
  if (direction === "asc") {
    return copy.sort((a, b) => a.localeCompare(b));
  } else {
    return copy.sort((a, b) => b.localeCompare(a));
  }
}

export const extractNumberFromFormattedString = (str: string): number => {
  const cleanStr = str.replace(/<\/?b>/g, "");
  const numMatch = cleanStr.match(/^[\d.]+/);
  return numMatch ? parseFloat(numMatch[0]) : 0;
};

interface SolverInfo {
  name: string;
  version?: string;
}

/**
 * Parses a solver string in the format "name--version" into separate name and version components
 * @param solverString - String containing solver name and optional version (e.g. "Gurobi--10.0.0" or "SCIP")
 * @returns {SolverInfo} Object containing parsed name and optional version
 * @example
 * parseSolverInfo("Gurobi--10.0.0") // returns { name: "Gurobi", version: "10.0.0" }
 * parseSolverInfo("SCIP") // returns { name: "SCIP", version: undefined }
 */
export const parseSolverInfo = (solverString: string): SolverInfo => {
  const [name, version] = solverString.split("--");
  return { name, version };
};
