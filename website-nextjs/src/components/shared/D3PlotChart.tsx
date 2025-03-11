import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { SolverType } from "@/types/benchmark";
import { getSolverLabel } from "@/utils/solvers";
import { roundNumber } from "@/utils/number";
import { IResultState } from "@/types/state";
import { getChartColor } from "@/utils/chart";

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

    // Create single zoom controls instance
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

    // Cast svg selection to the correct type for zoom transitions
    const svgSelection = svg as unknown as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;

    // Modify zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        const { transform } = event;

        // Get new scaled axes
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        // Update axes with new scales
        xAxisGroup.call(d3.axisBottom(newXScale).ticks(6).tickSizeOuter(0));
        yAxisGroup.call(d3.axisLeft(newYScale).ticks(6).tickSizeOuter(0));

        // Update all elements using the new scales
        plotArea
          .selectAll<SVGCircleElement, ChartData[number]>("circle")
          .attr("cx", (d) => newXScale(d.runtime))
          .attr("cy", (d) => newYScale(d.memoryUsage))
          .attr("r", 4);

        plotArea
          .selectAll<SVGTextElement, ChartData[number]>(".point-label")
          .attr("x", (d) => newXScale(d.runtime))
          .attr("y", (d) => newYScale(d.memoryUsage))
          .style("font-size", "12px");

        // Update grid with new scales
        const xGridLines = plotArea
          .selectAll(".grid-x")
          .data(newXScale.ticks(6));
        const yGridLines = plotArea
          .selectAll(".grid-y")
          .data(newYScale.ticks(6));

        xGridLines
          .join("line")
          .attr("class", "grid-x grid-line")
          .attr("x1", (d) => newXScale(d))
          .attr("x2", (d) => newXScale(d))
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
          .attr("stroke", "currentColor")
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "4,4");

        yGridLines
          .join("line")
          .attr("class", "grid-y grid-line")
          .attr("y1", (d) => newYScale(d))
          .attr("y2", (d) => newYScale(d))
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("stroke", "currentColor")
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "4,4");
      });

    // Replace zoom controls with updated behavior
    zoomControls.selectAll("*").remove();

    // Add zoom in button
    zoomControls
      .append("button")
      .attr("class", "zoom-button")
      .html("➕")
      .style("cursor", "pointer")
      .style("border", "none")
      .style("background", "none")
      .style("font-size", "16px")
      .on("click", () => {
        svgSelection.transition().duration(300).call(zoom.scaleBy, 1.5);
      });

    // Add zoom out button
    zoomControls
      .append("button")
      .attr("class", "zoom-button")
      .html("➖")
      .style("cursor", "pointer")
      .style("border", "none")
      .style("background", "none")
      .style("font-size", "16px")
      .on("click", () => {
        svgSelection.transition().duration(300).call(zoom.scaleBy, 0.75);
      });

    // Add reset button
    zoomControls
      .append("button")
      .attr("class", "zoom-button")
      .html("↺")
      .style("cursor", "pointer")
      .style("border", "none")
      .style("background", "none")
      .style("font-size", "16px")
      .on("click", () => {
        svgSelection
          .transition()
          .duration(300)
          .call(zoom.transform, d3.zoomIdentity);
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

    // Apply zoom to SVG
    svgSelection.call(zoom);

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
            .attr("class", "point-label")
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
    plotArea
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
