export interface StackedBarData {
  [key: string]: number | string;
}

export interface ID3GroupedBarChartData {
  key: string;
  value: string | number;
  category: string | number;
}
export interface ID3GroupedBarChart {
  title: string;
  height?: number;
  className?: string;
  chartData: StackedBarData[];
  categoryKey: string;
  barTextClassName?: (d: ID3GroupedBarChartData) => string;
  xAxisTooltipFormat?: (d: ID3GroupedBarChartData) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  rotateXAxisLabels?: boolean;
  showXaxisLabel?: boolean;
  axisLabelTitle?: (value: { value: unknown; key: string }) => string;
  barOpacity?: number | ((d: ID3GroupedBarChartData) => number);
  xAxisTickFormat?: (value: string, data: unknown) => string;
  colors:
    | {
        [key: string]: string;
      }
    | ((d: ID3GroupedBarChartData) => string);
  transformHeightValue?: (d: ID3GroupedBarChartData) => number;
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
