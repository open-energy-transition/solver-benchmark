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
