import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { SolverType } from "@/types/benchmark";
import { getSolverLabel } from "@/utils/solvers";
import { roundNumber } from "@/utils/number";
import { PATH_DASHBOARD } from "@/constants/path";
import { IResultState } from "@/types/state";
import { getChartColor } from "@/utils/chart";
import { ZoomInIcon, ZoomOutIcon, ResetIcon } from "@/assets/icons"; // Add these icons to your project

type ChartData = {
  runtime: number;
  memoryUsage: number;
  status: "TO" | "ok" | "warning";
  solver: SolverType;
  benchmark: string;
  size: string;
}[];

interface D3ChartProps {
  chartData: ChartData;
}

const D3Chart = ({ chartData = [] }: D3ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers;
  });

  const solverColors = useMemo<Record<string, string>>(() => {
    return availableSolvers.reduce(
      (acc, solver: string, index: number) => {
        acc[solver] = getChartColor(index);
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [availableSolvers]);

  useEffect(() => {
    const data = chartData;

    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 50, left: 70 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

    // Replace reset button with zoom controls
    const zoomControls = d3
      .select(containerRef.current)
      .insert("div", ":first-child")
      .style("position", "absolute")
      .style("right", "20px")
      .style("top", "20px")
      .style("display", "flex")
      .style("gap", "8px")
      .style("background", "white")
      .style("padding", "4px")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    zoomControls
      .append("button")
      .attr("class", "zoom-in")
      .html(
        '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zM9 21l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zM21 15l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"/></svg>',
      )
      .style("cursor", "pointer")
      .style("border", "none")
      .style("background", "none")
      .on("click", () => {
        const newScale = Math.min(zoomLevel * 1.5, 20);
        setZoomLevel(newScale);
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(newScale)
              .translate(-width / 2, -height / 2),
          );
      });

    zoomControls
      .append("button")
      .attr("class", "zoom-out")
      .html(
        '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zM9 21l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zM21 15l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"/></svg>',
      )
      .style("cursor", "pointer")
      .style("border", "none")
      .style("background", "none")
      .on("click", () => {
        const newScale = Math.max(zoomLevel / 1.5, 0.5);
        setZoomLevel(newScale);
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(newScale)
              .translate(-width / 2, -height / 2),
          );
      });

    // Create clip path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // Create main group for zoom
    const mainGroup = svg.append("g");

    // Create plot area group first (will be behind axes)
    const plotArea = mainGroup.append("g").attr("clip-path", "url(#clip)");

    // Move axes creation after plot area and outside mainGroup to keep them on top
    const xAxisGroup = svg
      .append("g")
      .attr("class", "axis-layer")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = svg
      .append("g")
      .attr("class", "axis-layer")
      .attr("transform", `translate(${margin.left},0)`);

    // Add CSS styles for axes to ensure they're always on top
    svg
      .selectAll(".axis-layer")
      .style("pointer-events", "none") // Prevent axes from intercepting mouse events
      .raise(); // Bring axes to front

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
      .domain([0, (d3.max(data, (d) => d.runtime) ?? 0) + 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, (d3?.max(data, (d) => d.memoryUsage) ?? 0) + 50])
      .range([height - margin.bottom, margin.top]);

    // Store original scales for reset
    const xScaleOriginal = xScale.copy();
    const yScaleOriginal = yScale.copy();

    // Function to update axes
    const updateAxes = () => {
      xAxisGroup.call(d3.axisBottom(xScale).ticks(6).tickSizeOuter(0));
      yAxisGroup.call(d3.axisLeft(yScale).ticks(6).tickSizeOuter(0));
    };

    // Initial axes render
    updateAxes();

    // Add axes labels
    xAxisGroup
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#8C8C8C")
      .text("Runtime (s)")
      .style("font-size", "12px")
      .style("font-family", "'Lato', sans-serif");

    yAxisGroup
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#8C8C8C")
      .text("Peak Memory Usage (MB)")
      .style("font-size", "12px")
      .style("font-family", "'Lato', sans-serif")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle");

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 20])
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("zoom", (event) => {
        const { transform } = event;
        setZoomLevel(transform.k);

        // Update scales
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        // Update axes
        xAxisGroup.call(d3.axisBottom(newXScale).ticks(6).tickSizeOuter(0));
        yAxisGroup.call(d3.axisLeft(newYScale).ticks(6).tickSizeOuter(0));

        // Update plot elements
        plotArea.attr("transform", transform);

        // Keep point sizes consistent during zoom
        plotArea.selectAll("circle").attr("r", 4 / transform.k);

        plotArea.selectAll("text").style("font-size", `${12 / transform.k}px`);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Scatter points (now inside plotArea)
    plotArea
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("g")
      .each(function (d) {
        const group = d3.select(this);

        if (["TO", "warning"].includes(d.status)) {
          group
            .append("text")
            .attr("x", xScale(d.runtime))
            .attr("y", yScale(d.memoryUsage))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text("✕")
            .style("fill", solverColors[d.solver])
            .style("font-size", "12px")
            .style("font-family", "'Lato', sans-serif");
        } else {
          group
            .append("circle")
            .attr("cx", xScale(d.runtime))
            .attr("cy", yScale(d.memoryUsage))
            .attr("r", 4)
            .attr("fill", solverColors[d.solver]);
        }

        // Update tooltip events to work with zoom
        group
          .on("mouseover", (event) => {
            const [x, y] = d3.pointer(event, containerRef.current);
            tooltip
              .style("opacity", 1)
              .html(
                `<strong>Name:</strong> ${d.benchmark}<br>
                <strong>Size:</strong> ${d.size}<br>
                <strong>Solver:</strong> ${getSolverLabel(d.solver)}<br>
                <strong>Runtime:</strong> ${roundNumber(d.runtime, 1)} s<br>
                <strong>Memory:</strong> ${roundNumber(d.memoryUsage)} MB`,
              )
              .style("left", `${x + 10}px`)
              .style("top", `${y - 30}px`);
          })
          .on("mousemove", (event) => {
            const [x, y] = d3.pointer(event, containerRef.current);
            tooltip.style("left", `${x + 10}px`).style("top", `${y - 30}px`);
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      });

    // Grid (now inside plotArea)
    const grid = plotArea
      .append("g")
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

    return () => {
      tooltip.remove();
      zoomControls.remove();
    };
  }, [chartData]);

  return (
    <div className="bg-white py-4 px-10 rounded-xl relative">
      {/* Legend */}
      <div className="flex gap-2 ml-8">
        {}
        <span className="font-semibold text-dark-grey text-xs mr-1 flex items-end">
          Solver:
        </span>
        {Object.keys(solverColors).map((solverKey) => (
          <div
            key={solverKey}
            className="py-1 px-5 uppercase bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max"
          >
            <CircleIcon
              style={{ color: solverColors[solverKey] }}
              className={"size-2"}
            />
            {solverKey}
          </div>
        ))}
      </div>
      <div ref={containerRef} className="overflow-hidden">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3Chart;
