import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CircleIcon, XIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import { createD3Tooltip, getSolverColor } from "@/utils/chart";
import { parseSolverInfo } from "@/utils/string";
import { SolverMetrics } from "@/types/compare-solver";
import { formatDecimal } from "@/utils/number";
import { useDebouncedWindowWidth } from "@/hooks/useDebouncedWindowWidth";

type ChartData = {
  d1: SolverMetrics;
  d2: SolverMetrics;
  xaxis: number;
  yaxis: number;
  status: "TO-TO" | "ok-ok" | "ok-TO" | "TO-ok";
  benchmark: string;
  size: string;
};

interface D3ChartProps {
  chartData: ChartData[];
  title: {
    xaxis: string;
    yaxis: string;
  };
  backgroundColor?: {
    upper?: string;
    lower?: string;
    upperOpacity?: string;
    lowerOpacity?: string;
  };
  solver1: string;
  solver2: string;
  scaleType?: "linear" | "log";
  scaleRange?: {
    min: number;
    max: number;
  };
  tickValues?: number[];
  tooltipTemplate?: (d: ChartData, solver1: string, solver2: string) => string;
  /** If true, force linear axes to include 0 and log axes to include smallest positive datapoint */
  safeAxes?: boolean;
  /** If true, render textual helper labels on the plot corners */
  showSolverFasterLabels?: boolean;
}

const getColorForSolver = (solver: string): string => {
  if (solver === "cbc") return "orange";
  return getSolverColor(solver);
};

const defaultTooltipTemplate = (
  d: ChartData,
  solver1: string,
  solver2: string,
) => `
  <div class="text-sm">
    <strong>Name:</strong> ${d.benchmark}<br>
    <strong>Size:</strong> ${d.size}<br>
    <strong>Runtime of ${solver1.replace(
      "--",
      " (",
    )}):</strong> ${formatDecimal({ value: d.d1.runtime })}s (${
      d.d1.status
    })<br>
    <strong>Runtime of ${solver2.replace(
      "--",
      " (",
    )}):</strong> ${formatDecimal({ value: d.d2.runtime })}s (${
      d.d2.status
    })<br>
  </div>
`;

const ChartCompare = ({
  chartData = [],
  title = { xaxis: "", yaxis: "" },
  backgroundColor,
  solver1 = "",
  solver2 = "",
  tooltipTemplate = defaultTooltipTemplate,
  scaleType = "linear",
  scaleRange = { min: 1, max: 100000 },
  tickValues = [1, 10, 100, 1000, 10000, 100000],
  safeAxes = true,
  showSolverFasterLabels = true,
}: D3ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);
  const windowWidth = useDebouncedWindowWidth(200);
  // Solver colors (match other dashboards)
  const solverColor1 = getColorForSolver(solver1.split("--")[0]);
  const solverColor2 = getColorForSolver(solver2.split("--")[0]);

  // Cross/failure colors (choose colors distinct from solver palette)
  const crossColors: Record<string, string> = {
    "ok-TO": "#EF4444", // solver2 failed
    "TO-ok": "#3cfb52", // solver1 failed
    "TO-TO": "#6B7280", // both failed
  };
  useEffect(() => {
    const data = chartData;

    // Solvers with colors
    const statusColor = {
      "ok-ok": "#4C5C51",
      "TO-TO": crossColors["TO-TO"],
      "ok-TO": crossColors["ok-TO"],
      "TO-ok": crossColors["TO-ok"],
    };

    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const isMobile = width < 640; // Add mobile breakpoint check
    const height = isMobile ? 300 : 400; // Adjust height for mobile
    const margin = isMobile
      ? { top: 30, right: 25, bottom: 40, left: 60 }
      : { top: 40, right: 30, bottom: 50, left: 80 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Find min and max values
    const minX = d3.min(data, (d) => d.xaxis) ?? 0;
    const maxX = d3.max(data, (d) => d.xaxis) ?? 1;
    const minY = d3.min(data, (d) => d.yaxis) ?? 0;
    const maxY = d3.max(data, (d) => d.yaxis) ?? 1;

    // Use a common min/max range to make x=y line work correctly
    const minValue = Math.min(minX, minY);
    const maxValue = Math.max(maxX, maxY);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

    // Add background split by x = y line
    if (backgroundColor?.lower) {
      svg
        .append("polygon")
        .attr(
          "points",
          `${margin.left},${height - margin.bottom} ${width - margin.right},${
            height - margin.bottom
          } ${width - margin.right},${margin.top}`,
        )
        .attr("fill", backgroundColor.lower)
        .attr("fill-opacity", backgroundColor?.lowerOpacity ?? "");
    }
    if (backgroundColor?.upper) {
      svg
        .append("polygon")
        .attr(
          "points",
          `${margin.left},${height - margin.bottom} ${margin.left},${
            margin.top
          } ${width - margin.right},${margin.top}`,
        )
        .attr("fill", backgroundColor.upper)
        .attr("fill-opacity", 0.2)
        .attr("fill-opacity", backgroundColor?.upperOpacity ?? "");
    }

    // Tooltip container
    const tooltip = createD3Tooltip();

    // Scales
    // Optionally ensure axes include zero for linear scales and include the smallest
    // positive data point for log scales so points don't fall outside the plot.
    const minPositiveX = d3.min(data, (d) =>
      d.xaxis > 0 ? d.xaxis : undefined,
    );
    const minPositiveY = d3.min(data, (d) =>
      d.yaxis > 0 ? d.yaxis : undefined,
    );
    const minPositive = Math.min(
      ...([minPositiveX, minPositiveY].filter(
        (v) => typeof v === "number",
      ) as number[]),
    );

    const safeMinPositive =
      typeof minPositive === "number" && isFinite(minPositive)
        ? Math.max(minPositive, 1e-3)
        : scaleRange.min;

    const xDomain: number[] = (() => {
      if (scaleType === "log") {
        if (safeAxes) {
          return [
            Math.min(scaleRange.min, safeMinPositive),
            Math.max(scaleRange.max, maxValue || scaleRange.max),
          ];
        }
        return [
          Math.min(scaleRange.min, minValue || scaleRange.min),
          Math.max(scaleRange.max, maxValue || scaleRange.max),
        ];
      }
      // linear
      if (safeAxes) {
        return [0, maxValue === minValue ? maxValue + 1 : maxValue];
      }
      return [minValue, maxValue === minValue ? maxValue + 1 : maxValue];
    })();

    const yDomain: number[] = (() => {
      if (scaleType === "log") {
        if (safeAxes) {
          return [
            Math.min(scaleRange.min, safeMinPositive),
            Math.max(scaleRange.max, maxValue || scaleRange.max),
          ];
        }
        return [
          Math.min(scaleRange.min, minValue || scaleRange.min),
          Math.max(scaleRange.max, maxValue || scaleRange.max),
        ];
      }
      if (safeAxes) {
        return [0, maxValue === minValue ? maxValue + 1 : maxValue];
      }
      return [minValue, maxValue === minValue ? maxValue + 1 : maxValue];
    })();

    const xScale =
      scaleType === "log"
        ? d3
            .scaleLog()
            .base(10)
            .domain(xDomain)
            .range([margin.left, width - margin.right])
        : d3
            .scaleLinear()
            .domain(xDomain)
            .range([margin.left, width - margin.right]);

    const yScale =
      scaleType === "log"
        ? d3
            .scaleLog()
            .base(10)
            .domain(yDomain)
            .range([height - margin.bottom, margin.top])
        : d3
            .scaleLinear()
            .domain(yDomain)
            .range([height - margin.bottom, margin.top]);

    // Axes
    const useExponential = scaleType === "log" && scaleRange.max > 1000;
    const formatTick = (d: number) => {
      if (useExponential) {
        // Return empty string - we'll format with tspan after
        return "";
      }
      if (d < 1) {
        return d3.format(".1f")(d); // Show 1 decimal place for numbers < 1
      }
      return d3.format(",.0f")(d); // Show thousands separator for numbers >= 1
    };
    const xAxis =
      scaleType === "log"
        ? d3
            .axisBottom(xScale)
            .tickValues(tickValues)
            .tickFormat((d) => formatTick(+d))
            .tickSizeOuter(0)
        : d3
            .axisBottom(xScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickFormat((d) => formatTick(+d));
    const yAxis =
      scaleType === "log"
        ? d3
            .axisLeft(yScale)
            .tickValues(tickValues)
            .tickFormat((d) => formatTick(+d))
            .tickSizeOuter(0)
        : d3
            .axisLeft(yScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickFormat((d) => formatTick(+d));
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("fill", "#022B3B")
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("stroke", "#A1A9BC");
        g.selectAll("line").attr("stroke", "#A1A9BC");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .attr("class", "font-lato text-xs")
          .each(function (d) {
            if (useExponential && typeof d === "number" && d > 0) {
              const exponent = Math.round(Math.log10(d));
              // Hide 10^-2 and 10^-3 ticks (and their tick lines) when using exponential formatting
              if (exponent === -2 || exponent === -3) {
                d3.select(this).attr("visibility", "hidden");
                const parent = (this as Element).parentNode as Element | null;
                if (parent)
                  d3.select(parent).select("line").attr("display", "none");
              } else {
                d3.select(this)
                  .html("") // Clear existing text
                  .append("tspan")
                  .text("10")
                  .append("tspan")
                  .attr("baseline-shift", "super")
                  .attr("font-size", "8px")
                  .text(exponent.toString());
              }
            }
          });
        // Hide tick labels that fall at or left of the left plot margin
        // (protect against accidentally hiding a large-value tick like 10^4)
        g.selectAll(".tick").each(function () {
          const t = d3.select(this).attr("transform") || "";
          const m = t.match(/translate\(([^,]+),?/);
          const tx = m ? parseFloat(m[1]) : NaN;
          if (!isNaN(tx) && tx <= margin.left + 1) {
            d3.select(this).select("text").attr("visibility", "hidden");
          }
        });
      });
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("stroke", "#A1A9BC");
        g.selectAll("line").attr("stroke", "#A1A9BC");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .attr("class", "font-lato text-xs")
          .each(function (d) {
            if (useExponential && typeof d === "number" && d > 0) {
              const exponent = Math.round(Math.log10(d));
              if (exponent === -2 || exponent === -3) {
                d3.select(this).attr("visibility", "hidden");
                const parent = (this as Element).parentNode as Element | null;
                if (parent)
                  d3.select(parent).select("line").attr("display", "none");
              } else {
                d3.select(this)
                  .html("") // Clear existing text
                  .append("tspan")
                  .text("10")
                  .append("tspan")
                  .attr("baseline-shift", "super")
                  .attr("font-size", "8px")
                  .text(exponent.toString());
              }
            }
          });
      });

    // Comparison arrows & labels are rendered later so they appear on top.

    // Scatter points
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("g")
      .each(function (d) {
        const group = d3.select(this);

        if (["TO-TO", "ok-TO", "TO-ok"].includes(d.status)) {
          // Render an "X" for status 'TO'
          group
            .append("text")
            .attr("x", xScale(d.xaxis))
            .attr("y", yScale(d.yaxis))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text("✕")
            .style("fill", statusColor[d.status])
            .style("font-size", "12px");
        } else {
          // Render a circle for other statuses
          group
            .append("circle")
            .attr("cx", xScale(d.xaxis))
            .attr("cy", yScale(d.yaxis))
            .attr("r", 4)
            .attr("fill", statusColor[d.status]);
        }

        group
          .on("click", () => {
            window.location.href = PATH_DASHBOARD.benchmarkSet.one.replace(
              "{name}",
              d.benchmark,
            );
          })
          .style("cursor", "pointer");

        // Add tooltip event listeners
        group
          .on("mouseover", (event) => {
            tooltip
              .style("opacity", 1)
              .html(tooltipTemplate(d, solver1, solver2))
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 30}px`);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 30}px`);
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      });

    // Draw x = y line with appropriate scale values
    // Use the actual computed domain boundaries so the line always spans the full plot area
    const lineStart = scaleType === "log" ? xDomain[0] : minValue;
    const lineEnd = scaleType === "log" ? xDomain[1] : maxValue;

    svg
      .append("line")
      .attr("x1", xScale(lineStart))
      .attr("y1", yScale(lineStart))
      .attr("x2", xScale(lineEnd))
      .attr("y2", yScale(lineEnd))
      .attr("stroke", "#8B8B8B")
      .attr("stroke-width", 2);

    // Grid
    const gridValues = scaleType === "log" ? tickValues : xScale.ticks();
    const filteredGridValues = gridValues.filter((d) => {
      return !(
        useExponential &&
        typeof d === "number" &&
        (Math.round(Math.log10(d)) === -2 || Math.round(Math.log10(d)) === -3)
      );
    });
    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(filteredGridValues)
            .join("line")
            .attr("x1", (d) => 0.5 + xScale(d))
            .attr("x2", (d) => 0.5 + xScale(d))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke-dasharray", "4,4"),
        )
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(filteredGridValues)
            .join("line")
            .attr("y1", (d) => 0.5 + yScale(d))
            .attr("y2", (d) => 0.5 + yScale(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("stroke-dasharray", "4,4"),
        )
        .call((g) => {
          // Hide last grid line
          g.selectAll("line:last-of-type").attr("display", "none");
        });
    svg.append("g").call(grid);

    // Draw comparison arrows/labels on top of points and grid
    if (showSolverFasterLabels) {
      try {
        const solver1Info = parseSolverInfo(solver1);
        const solver2Info = parseSolverInfo(solver2);

        const plotLeft = margin.left;
        const plotRight = width - margin.right;
        const plotTop = margin.top;
        const plotBottom = height - margin.bottom;
        const plotW = plotRight - plotLeft;
        const plotH = plotBottom - plotTop;

        const arrowLen = isMobile ? 36 : 50;
        const color1 = solverColor1;
        const color2 = solverColor2;
        const labelFontSize = isMobile ? 9 : 11;

        // Arrowhead markers
        const defs = svg.append("defs");
        defs
          .append("marker")
          .attr("id", "arrowhead-s1")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 9)
          .attr("refY", 0)
          .attr("markerWidth", 5)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-4L10,0L0,4Z")
          .attr("fill", color1)
          .attr("pointer-events", "none");
        defs
          .append("marker")
          .attr("id", "arrowhead-s2")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 9)
          .attr("refY", 0)
          .attr("markerWidth", 5)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-4L10,0L0,4Z")
          .attr("fill", color2)
          .attr("pointer-events", "none");

        // 45-degree half-components for arrow endpoints
        const c = (arrowLen / 2) * Math.SQRT1_2;
        // Gap between the arrow line and the text label (px)
        const po = (isMobile ? 6 : 9) * Math.SQRT1_2;

        // Perpendicular unit vectors from the diagonal
        const diagLen = Math.sqrt(plotW * plotW + plotH * plotH);
        const perpULX = -plotH / diagLen; // upper-left direction
        const perpULY = -plotW / diagLen;
        const perpLRX = plotH / diagLen; // lower-right direction
        const perpLRY = plotW / diagLen;
        const diagOffset = isMobile ? 30 : 22;

        // Solver 1 better — center at t=0.4 along diagonal, shifted upper-left
        const t1 = 0.4;
        const c1x = plotLeft + t1 * plotW + diagOffset * perpULX;
        const c1y = plotBottom - t1 * plotH + diagOffset * perpULY;
        const c1xText = c1x - 50;
        const c1yText = c1y - 5;
        svg
          .append("line")
          .attr("x1", c1x + c - po)
          .attr("y1", c1y + c + po)
          .attr("x2", c1x - c - po)
          .attr("y2", c1y - c + po)
          .attr("stroke", color1)
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#arrowhead-s1)")
          .attr("pointer-events", "none");
        svg
          .append("text")
          .attr("x", c1xText)
          .attr("y", c1yText)
          .attr("text-anchor", "middle")
          .attr("transform", `rotate(0, ${c1xText}, ${c1yText})`)
          .attr("fill", color1)
          .attr("font-size", `${labelFontSize + 3}px`)
          .attr("class", "font-lato")
          .attr("font-weight", "700")
          .attr("dy", "-7")
          .attr("pointer-events", "none")
          .text(`${solver1Info.name} is better`);

        // Solver 2 better — center at t=0.6 along diagonal, shifted lower-right
        const t2 = 0.6;
        const c2x = plotLeft + t2 * plotW + diagOffset * perpLRX;
        const c2y = plotBottom - t2 * plotH + diagOffset * perpLRY;
        const c2xText = c2x + 45;
        const c2yText = c2y + 15;
        svg
          .append("line")
          .attr("x1", c2x - c - po)
          .attr("y1", c2y - c + po)
          .attr("x2", c2x + c - po)
          .attr("y2", c2y + c + po)
          .attr("stroke", color2)
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#arrowhead-s2)")
          .attr("pointer-events", "none");
        svg
          .append("text")
          .attr("x", c2xText)
          .attr("y", c2yText)
          .attr("text-anchor", "middle")
          .attr("transform", `rotate(0, ${c2xText}, ${c2yText})`)
          .attr("fill", color2)
          .attr("font-size", `${labelFontSize + 3}px`)
          .attr("class", "font-lato")
          .attr("font-weight", "700")
          .attr("dy", "15")
          .attr("pointer-events", "none")
          .text(`${solver2Info.name} is better`);
      } catch {
        // ignore parsing errors
      }
    }

    return () => {
      // Cleanup tooltip on unmount
      tooltip.remove();
    };
  }, [chartData, windowWidth]);

  const formatLegend = (status: string): string => {
    const [status1, status2] = status.split("-");
    const solver1Info = parseSolverInfo(solver1);
    const solver2Info = parseSolverInfo(solver2);

    return `${solver1Info.name} ${status1} - ${solver2Info.name} ${status2}`;
  };
  return (
    <div className="bg-white py-4 p-4 sm:pl-10 rounded-xl relative">
      {/* yaxis Title */}
      <div
        className="
          -rotate-90
          -translate-y-1/2
          absolute
          font-lato
          left-6
          origin-[0]
          text-[#575757]
          text-xs
          top-3/4
          "
      >
        {title.yaxis}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="size-2 text-[#4C5C51]" />
          {formatLegend("ok-ok")}
        </div>
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon fill={crossColors["ok-TO"]} className="size-2" />
          {formatLegend("ok-fail")}
        </div>
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon fill={crossColors["TO-ok"]} className="size-2" />
          {formatLegend("fail-ok")}
        </div>
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon fill={crossColors["TO-TO"]} className="size-2" />
          {formatLegend("fail-fail")}
        </div>
      </div>
      <div
        className="w-full overflow-x-auto"
        ref={containerRef}
        role="region"
        tabIndex={0}
        aria-label={`Scrollable ${title.xaxis} vs ${title.yaxis} comparison chart`}
      >
        <div className="min-w-[300px]">
          <svg ref={svgRef}></svg>
        </div>
      </div>
      {/* xaxis Title */}
      <div
        className="
          -translate-y-1/2
          -translate-x-1/2
          absolute
          font-lato
          left-1/2
          text-[#575757]
          text-xs
          bottom-0
          w-full
          text-center
          pl-4
          "
      >
        {title.xaxis}
      </div>
    </div>
  );
};

export default ChartCompare;
