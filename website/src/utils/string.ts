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

/**
 * Sorts filter options for display. With no `priorityOrder`, sorts
 * alphabetically but always places `lastValue` (e.g. "N/A") at the end.
 * With a `priorityOrder`, items are ordered by their position in it (e.g.
 * Problem Size's S/M/L, or Realistic's Realistic/Other), and any item not
 * listed falls back after it, alphabetically.
 */
export function sortFilterOptions(
  items: string[],
  { priorityOrder, lastValue }: { priorityOrder?: string[]; lastValue?: string } = {},
): string[] {
  if (priorityOrder) {
    const indexOf = (item: string) => {
      const idx = priorityOrder.indexOf(item);
      return idx === -1 ? priorityOrder.length : idx;
    };
    return [...items].sort((a, b) => {
      const diff = indexOf(a) - indexOf(b);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }

  return [...items].sort((a, b) => {
    const aIsLast = a === lastValue;
    const bIsLast = b === lastValue;
    if (aIsLast !== bIsLast) return aIsLast ? 1 : -1;
    return a.localeCompare(b);
  });
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
