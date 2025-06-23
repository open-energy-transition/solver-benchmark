import React from "react";

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
  xAxisTooltipFormat?: (category: string) => string;
  tooltipFormat?: (d: ID3GroupedBarChartData) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  rotateXAxisLabels?: boolean;
  showXaxisLabel?: boolean;
  axisLabelTitle?: (d: ID3GroupedBarChartData) => string;
  barOpacity?: number | ((d: ID3GroupedBarChartData) => number);
  xAxisTickFormat?: (value: string, data: unknown) => string;
  normalize?: boolean;
  colors:
    | {
        [key: string]: string;
      }
    | ((d: ID3GroupedBarChartData) => string);
  transformHeightValue?: (d: ID3GroupedBarChartData) => number;
  xAxisBarTextClassName?: string;
  customLegend?: (props: {
    chartData: StackedBarData[];
    categoryKey: string;
  }) => React.ReactNode;
}

export interface ID3StackedBarChart {
  title: string | React.ReactNode;
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
