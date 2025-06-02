import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CircleIcon, XIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import { getChartColor } from "@/utils/chart";
import { parseSolverInfo } from "@/utils/string";
import { SolverMetrics } from "@/types/compare-solver";
import { roundNumber } from "@/utils/number";

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
  tooltipTemplate?: (d: ChartData, solver1: string, solver2: string) => string;
}

const defaultTooltipTemplate = (
  d: ChartData,
  solver1: string,
  solver2: string,
) => `
  <div class="text-sm 4xl:text-lg">
    <strong>Name:</strong> ${d.benchmark}<br>
    <strong>Size:</strong> ${d.size}<br>
    <strong>Runtime of ${solver1.replace("--", " (")}):</strong> ${roundNumber(
      d.d1.runtime,
      2,
    )}s (${d.d1.status})<br>
    <strong>Runtime of ${solver2.replace("--", " (")}):</strong> ${roundNumber(
      d.d2.runtime,
      2,
    )}s (${d.d2.status})<br>
    <strong>Log Runtime (s) of ${solver1.replace(
      "--",
      " (",
    )}):</strong> ${roundNumber(d.d1.logRuntime, 1)} (${d.d1.status})<br>
    <strong>Log Runtime (s) of ${solver2.replace(
      "--",
      " (",
    )}):</strong> ${roundNumber(d.d2.logRuntime, 1)} (${d.d2.status})<br>
  </div>
`;

const ChartCompare = ({
  chartData = [],
  title = { xaxis: "", yaxis: "" },
  backgroundColor,
  solver1 = "",
  solver2 = "",
  tooltipTemplate = defaultTooltipTemplate,
}: D3ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const data = chartData;

    // Solvers with colors
    const statusColor = {
      "ok-ok": "#4C5C51",
      "TO-TO": getChartColor(2),
      "ok-TO": getChartColor(3),
      "TO-ok": getChartColor(0),
    };

    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const isMobile = width < 640; // Add mobile breakpoint check
    const height = isMobile ? 300 : 400; // Adjust height for mobile
    const margin = isMobile
      ? { top: 30, right: 15, bottom: 40, left: 50 }
      : { top: 40, right: 20, bottom: 50, left: 70 };

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
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("font-family", "'Lato', sans-serif")
      .style("color", "#333")
      .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([height - margin.bottom, margin.top]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);

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
          .attr("class", "font-lato text-xs 4xl:text-lg");
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
          .attr("class", "font-lato text-xs 4xl:text-lg");
      });
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
            window.location.href = PATH_DASHBOARD.benchmarkDetail.one.replace(
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

    // Draw x = y line
    svg
      .append("line")
      .attr("x1", xScale(minValue))
      .attr("y1", yScale(minValue))
      .attr("x2", xScale(maxValue))
      .attr("y2", yScale(maxValue))
      .attr("stroke", "#8B8B8B")
      .attr("stroke-width", 2);

    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(xScale.ticks())
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
            .data(yScale.ticks())
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

    return () => {
      // Cleanup tooltip on unmount
      tooltip.remove();
    };
  }, [chartData]);

  const formatLegend = (status: string): string => {
    const [status1, status2] = status.split("-");
    const solver1Info = parseSolverInfo(solver1);
    const solver2Info = parseSolverInfo(solver2);

    return `${solver1Info.name} ${status1} - ${solver2Info.name} ${status2}`;
  };
  return (
    <div className="bg-white py-4 px-4 sm:px-10 rounded-xl relative">
      {/* yaxis Title */}
      <div
        className="
          -rotate-90
          -translate-y-1/2
          4xl:text-lg
          absolute
          font-lato
          left-6
          origin-[0]
          text-[#8c8c8c]
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
          <XIcon fill={getChartColor(3)} className="size-2" />
          {formatLegend("ok-fail")}
        </div>
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon fill={getChartColor(0)} className="size-2" />
          {formatLegend("fail-ok")}
        </div>
        <div className="py-1 px-2 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon fill={getChartColor(2)} className="size-2" />
          {formatLegend("fail-fail")}
        </div>
      </div>
      <div className="w-full overflow-x-auto" ref={containerRef}>
        <div className="min-w-[300px]">
          <svg ref={svgRef}></svg>
        </div>
      </div>
      {/* xaxis Title */}
      <div
        className="
          -translate-y-1/2
          -translate-x-1/2
          4xl:text-lg
          absolute
          font-lato
          left-1/2
          text-[#8c8c8c]
          text-xs
          bottom-0
          "
      >
        {title.xaxis}
      </div>
    </div>
  );
};

export default ChartCompare;
