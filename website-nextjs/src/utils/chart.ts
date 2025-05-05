const presetColors = [
  "#F66C49", // red
  "#43BF94", // green
  "#F9CD5A", // yellow
  "#3B82F6", // blue
  "#7C3AED", // purple
  "#f58231", // orange
  "#46f0f0", // cyan
  "#f032e6", // magenta
  "#d2f53c", // lime
  "#fabebe", // pink
  "#008080", // teal
  "#e6beff", // lavender
  "#aa6e28", // brown
  "#fffac8", // beige
  "#800000", // maroon
  "#aaffc3", // mint
  "#808000", // olive
  "#ffd8b1", // apricot
  "#000080", // navy
  "#808080", // grey
];

export function getChartColor(index: number): string {
  return presetColors[index % presetColors.length];
}
