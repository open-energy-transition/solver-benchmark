import React from "react";
import { Direction } from "@/components/shared/DirectionalIndicator";

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
  chartHeight?: number;
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
  diagonalXAxisLabelsOnMobile?: boolean;
  axisLabelTitle?: (d: ID3GroupedBarChartData) => string;
  barOpacity?: number | ((d: ID3GroupedBarChartData) => number);
  xAxisTickFormat?: (value: string, data: unknown) => string;
  xAxisLabelWrapLength?: number;
  extraCategoryLengthMargin?: number;
  normalize?: boolean;
  xAxisLabelRotation?: number;
  splitter?: string;
  sortByValue?: boolean;
  showLineAtY1?: boolean;
  useLogScale?: boolean;
  directionalIndicator?: Direction;
  yAxisMax?: number;
  hideLegend?: boolean;
  hideTitle?: boolean;
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
  /** Optional Tailwind class to apply to the inner card background (e.g. 'bg-white' or 'bg-off-white') */
  cardBgClassName?: string;
  /** Optional Tailwind class to apply to text color inside the inner card (e.g. 'text-dark-grey') */
  cardTextClassName?: string;
  /** Color used for size annotation text (hex or CSS color). Defaults to '#555' if not provided. */
  sizeAnnotationTextColor?: string;
  showBarTopLabels?: boolean;
  sizeAnnotations?: string[];
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
  directionalIndicator?: Direction;
}
