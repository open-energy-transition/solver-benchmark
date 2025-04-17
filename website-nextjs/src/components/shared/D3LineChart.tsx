import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { SolverYearlyChartData } from "@/types/performance-history";
import { getChartColor } from "@/utils/chart";
import { IResultState } from "@/types/state";

type SolverType = "glpk" | "scip" | "highs";

interface ID3ChartLineChart {
  title: string;
  height?: number;
  className?: string;
  chartData: SolverYearlyChartData[];
  xAxisTooltipFormat?: (value: number | string) => string;
}

const D3ChartLineChart = ({
  title,
  height = 280,
  className = "",
  chartData = [],
  xAxisTooltipFormat,
}: ID3ChartLineChart) => {
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
    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 85 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

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
      .style("color", "#333")
      .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(chartData.map((d) => d.year.toString()))
      .range([margin.left + 20, width - margin.right]);
    const yScale = d3
      .scaleLinear()
      .domain([0, (d3?.max(chartData, (d) => d.value) ?? 0) + 1])
      .range([height - margin.bottom, margin.top]);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("fill", "#022B3B")
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("line").attr("stroke", "#A1A9BC");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .attr("class", "text-xs 4xl:text-base");
      })
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#8C8C8C")
      .text("Year")
      .attr("class", "text-xs 4xl:text-base");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("line").attr("stroke", "#A1A9BC");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .attr("class", "text-xs 4xl:text-base");
      })
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#8C8C8C")
      .text(title)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs 4xl:text-base -rotate-90");

    // Group data by solver
    const groupedData = d3.group(chartData, (d) => d.solver);

    // Line generator
    const line = d3
      .line<{ year: number; value: number }>()
      .x((d) => xScale(d.year.toString()) ?? 0)
      .y((d) => yScale(d.value));

    // Draw lines for each solver group
    groupedData.forEach((values, solver) => {
      svg
        .append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", solverColors[solver as SolverType]) // Use solver color
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Scatter points
    svg
      .selectAll(".dot")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year.toString()) ?? 0)
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 6)
      .attr("fill", (d) => solverColors[d.solver]) // Use solver color for points
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Solver:</strong> ${d.solver}<br>
             <strong>Year:</strong> ${d.year}<br>
             ${
               xAxisTooltipFormat
                 ? xAxisTooltipFormat(d.value)
                 : `<strong>Value:</strong> ${d.value}`
             }
             `,
          )
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

    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
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

  return (
    <div className={`bg-white p-4 rounded-xl ${className}`}>
      {/* Legend */}
      <div className="flex gap-2 ml-8">
        <span className="font-semibold text-[#8C8C8C] text-xs 4xl:text-base mr-1 flex items-end">
          Solver:
        </span>
        {Object.keys(solverColors).map((solverKey) => (
          <div
            key={solverKey}
            className="py-1 px-5 uppercase bg-stroke 4xl:text-sm text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max"
          >
            <CircleIcon
              style={{ color: solverColors[solverKey] }}
              className={"size-2"}
            />
            {solverKey}
          </div>
        ))}
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3ChartLineChart;
