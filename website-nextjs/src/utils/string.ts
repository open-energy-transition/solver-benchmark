export function sortStringArray(
  data: string[],
  direction: "asc" | "desc" = "asc"
): string[] {
  const copy = [...data]
  if (direction === "asc") {
    return copy.sort((a, b) => a.localeCompare(b))
  } else {
    return copy.sort((a, b) => b.localeCompare(a))
  }
}
