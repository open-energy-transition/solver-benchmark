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

export function humanizeSeconds(seconds: number): string {
  if (seconds < 1) {
    return "< 1 sec";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} ${seconds === 1 ? "sec" : "secs"}`;
  }
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins} ${mins === 1 ? "min" : "mins"}`;
  }
  if (seconds <= 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    const hourUnit = hours === 1 ? "hr" : "hrs";
    return minutes > 0
      ? `${hours} ${hourUnit} ${minutes} ${minutes === 1 ? "min" : "mins"}`
      : `${hours} ${hourUnit}`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.round((seconds % 86400) / 3600);
  const dayUnit = days === 1 ? "day" : "days";
  return hours > 0
    ? `${days} ${dayUnit} ${hours} ${hours === 1 ? "hr" : "hrs"}`
    : `${days} ${dayUnit}`;
}
