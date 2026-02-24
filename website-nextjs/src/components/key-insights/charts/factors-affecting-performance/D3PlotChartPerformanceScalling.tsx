import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { SolverStatusType } from "@/types/benchmark";
import { applyTooltipStyles, getSolverColor } from "@/utils/chart";
import { humanizeSeconds } from "@/utils/string";
import { TIMEOUT_VALUES } from "@/constants/filter";

type ChartData = {
  runtime: number;
  numVariables: number;
  status: SolverStatusType;
  benchmark: string;
};

interface PerformanceScalingProps {
  chartData: ChartData[];
  onPointClick?: (benchmark: ChartData) => void;
  solverColor: string;
  minYaxis?: number;
}

const D3PlotChartPerformanceScaling = ({
  chartData,
  minYaxis,
  onPointClick,
  solverColor = "highs",
}: PerformanceScalingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!chartData.length) return;

    // Setup dimensions
    const width = Math.min(
      containerRef.current?.clientWidth || 600,
      window.innerWidth - 40,
    );
    const height = 400;
    const margin = { top: 40, right: 60, bottom: 50, left: 80 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    // Create scales
    const xScale = d3
      .scaleLog()
      .domain([100, 5e7])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLog()
      .domain([minYaxis || d3.min(chartData, (d) => d.runtime) || 0, 1e6])
      .range([height - margin.bottom, margin.top]);

    // Add timeout lines
    const timeouts = [
      {
        value: TIMEOUT_VALUES.SHORT,
        label: humanizeSeconds(TIMEOUT_VALUES.SHORT) + " timeout",
      },
      {
        value: TIMEOUT_VALUES.LONG,
        label: humanizeSeconds(TIMEOUT_VALUES.LONG) + " timeout",
      },
    ];

    timeouts.forEach(({ value, label }) => {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yScale(value))
        .attr("y2", yScale(value))
        .attr("stroke", "grey")
        .attr("stroke-dasharray", "4,4");

      svg
        .append("text")
        .attr("x", margin.left + 150)
        .attr("y", yScale(value) - 5)
        .attr("fill", "grey")
        .attr("text-anchor", "end")
        .text(label);
    });

    const formatPower = (d: number) => {
      return `${Math.round(Math.log10(d))}`;
    };
    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll("text")
      .html("") // Clear existing text
      .append("tspan")
      .text("10")
      .append("tspan")
      .attr("dy", "-5")
      .attr("font-size", "8px")
      .text((d) => formatPower(d as number));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .html("")
      .append("tspan")
      .text("10")
      .append("tspan")
      .attr("dy", "-5")
      .attr("font-size", "8px")
      .text((d) => formatPower(d as number));

    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        // Add horizontal grid lines
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(yScale.ticks(5))
            .join("line")
            .attr("y1", (d) => yScale(d))
            .attr("y2", (d) => yScale(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("stroke-dasharray", "4,4"),
        );

    svg.append("g").call(grid);

    // Add labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .text("Number of Variables");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .text("Runtime of fastest solver (s)");

    // Create tooltip div
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute hidden bg-white p-2 rounded text-sm pointer-events-none",
      );
    applyTooltipStyles(tooltip);

    const showTooltip = (event: MouseEvent, d: ChartData) => {
      const formatRuntime = (runtime: number) => {
        return humanizeSeconds(runtime);
      };

      tooltip
        .html(
          `Benchmark: ${d.benchmark.replace(" ", "<br/> Size: ")}
          <br/>Runtime: ${formatRuntime(d.runtime)}
          <br/>Number of Variables: ${d.numVariables}`,
        )
        .style("left", `${event.offsetX + 10}px`)
        .style("top", `${event.offsetY - 10}px`)
        .classed("hidden", false);
    };

    const hideTooltip = () => {
      tooltip.classed("hidden", true);
    };

    // Add points
    chartData.forEach((d) => {
      const group = svg.append("g");

      if (d.status === "TO") {
        group
          .append("text")
          .attr("x", xScale(d.numVariables))
          .attr("y", yScale(d.runtime))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text("✕")
          .attr("fill", "red")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("cursor", "pointer")
          .on("mouseover", (event) => showTooltip(event, d))
          .on("mouseout", hideTooltip)
          .on("click", () => onPointClick?.(d));
      } else {
        group
          .append("circle")
          .attr("cx", xScale(d.numVariables))
          .attr("cy", yScale(d.runtime))
          .attr("r", 4)
          .attr("fill", getSolverColor(solverColor))
          .style("cursor", "pointer")
          .on("mouseover", (event) => showTooltip(event, d))
          .on("mouseout", hideTooltip)
          .on("click", () => onPointClick?.(d));
      }
    });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [chartData, onPointClick]);

  return (
    <div className="relative">
      <div className="justify-end flex gap-4 items-center text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: getSolverColor(solverColor) }}
          ></div>
          <span>fastest solver</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold">✕</span>
          <span>all solvers timed out</span>
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3PlotChartPerformanceScaling;
