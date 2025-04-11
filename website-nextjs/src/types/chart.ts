export interface StackedBarData {
  [key: string]: number | string;
}

export interface ID3StackedBarChart {
  title: string;
  height?: number;
  className?: string;
  data: StackedBarData[];
  categoryKey: string; // key to use for x-axis
  xAxisTooltipFormat?: (value: number | string) => string;
  colors: Record<string, string>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  rotateXAxisLabels?: boolean;
  showXaxisLabel?: boolean;
}
