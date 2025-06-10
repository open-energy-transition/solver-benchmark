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

export const calculateScaleRangeAndTicks = (
  data: { xaxis: number; yaxis: number }[],
) => {
  if (data.length === 0) {
    return {
      scaleRange: { min: 1, max: 10000 },
      tickValues: [1, 10, 100, 1000, 10000],
    };
  }

  // Find min and max values from both axes
  const values = data.flatMap((d) => [d.xaxis, d.yaxis]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Get the order of magnitude
  const minOrder = Math.floor(Math.log10(minValue));
  const maxOrder = Math.ceil(Math.log10(maxValue));

  // Generate scale range
  const scaleMin = Math.pow(10, minOrder);
  const scaleMax = Math.pow(10, maxOrder);

  // Generate tick values
  const ticks = [];
  for (let i = minOrder; i <= maxOrder; i++) {
    ticks.push(Math.pow(10, i));
  }
  return {
    scaleRange: { min: scaleMin, max: scaleMax },
    tickValues: ticks,
  };
};

export const formatTick = (d: number) => {
  if (d >= 1000) {
    // Format with spaces instead of commas (e.g., "10 000" instead of "10,000")
    return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  return d.toString();
};
