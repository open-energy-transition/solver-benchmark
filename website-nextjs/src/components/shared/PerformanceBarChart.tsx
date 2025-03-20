import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { getChartColor } from "@/utils/chart";
import { Color } from "@/constants/color";
import { MaxRunTime } from "@/constants";

type PerformanceData = {
  benchmark: string;
  factor: number;
  solver: string;
  size: string;
  status: "TO" | "ok" | "warning";
  runtime: number;
  baseSolverRuntime: number;
};

interface Props {
  data: PerformanceData[];
  baseSolver: string;
  availableSolvers: string[];
}

const PerformanceBarChart = ({ data, baseSolver, availableSolvers }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);
  const [visibleSolvers, setVisibleSolvers] = useState<Set<string>>(
    new Set([baseSolver, ...availableSolvers.filter((s) => s !== baseSolver)]),
  );

  const solverColors = useMemo(() => {
    return availableSolvers.reduce(
      (acc, solver, index) => {
        acc[solver] = getChartColor(index);
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [availableSolvers]);

  const toggleSolver = (solver: string) => {
    setVisibleSolvers((prev) => {
      const next = new Set(prev);
      if (solver === baseSolver) return next; // Don't allow toggling base solver
      if (next.has(solver)) {
        next.delete(solver);
      } else {
        next.add(solver);
      }
      return next;
    });
  };

  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;

    const margin = {
      top: 40,
      right: 100,
      bottom: 100,
      left: 60,
    };
    const height = 400 + (margin.bottom - 100);

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    // Tooltip setup
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("opacity", 0)
      .style("pointer-events", "none") // Prevent tooltip from interfering with hover
      .style("z-index", "100");

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => `${d.benchmark}-${d.size}`))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    // Add sub-band scale for bars with more spacing
    const xSubScale = d3
      .scaleBand()
      .domain(availableSolvers.filter((s) => s !== baseSolver))
      .range([0, xScale.bandwidth()])
      .padding(0.4); // Increased padding between bars within group
    const barWidth = Math.min(xSubScale.bandwidth(), 15);

    // Scale for primary y-axis (ratio/factor)
    const yScaleRatio = d3
      .scaleLinear()
      .domain([-4, 4])
      .range([height - margin.bottom, margin.top]);

    // Scale for secondary y-axis (runtime)
    const yScaleRuntime = d3
      .scaleLog()
      .domain([
        d3.min(data, (d) => Math.min(d.runtime, d.baseSolverRuntime)) || 0.1,
        d3.max(data, (d) => Math.max(d.runtime, d.baseSolverRuntime)) || 100,
      ])
      .range([height - margin.bottom, margin.top]);

    // Format runtime values to avoid overlap
    const formatRuntime = (d: d3.NumberValue) => {
      const value = d.valueOf();
      if (value >= 100) return `${Math.round(value)}s`;
      if (value >= 10) return `${value.toFixed(0)}s`;
      if (value >= 1) return `${value.toFixed(1)}s`;
      return `${value.toFixed(2)}s`;
    };

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxisRatio = d3
      .axisLeft(yScaleRatio)
      .tickFormat((d) => (d === 0 ? "1" : `${Math.pow(2, Number(d))}`));
    const yAxisRuntime = d3
      .axisRight(yScaleRuntime)
      .tickFormat(formatRuntime)
      .ticks(5) // Reduce number of ticks even more
      .tickValues(
        // Explicitly set tick values to avoid overlap
        [1, 10, 100, 600],
      );

    // Add x-axis without labels
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => g.selectAll(".tick text").remove()); // Remove tick labels but keep the axis line

    // Add primary y-axis (ratio)
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisRatio);

    // Add secondary y-axis (runtime)
    svg
      .append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yAxisRuntime)
      .attr("class", "secondary-axis")
      .selectAll("text")
      .style("fill", "#666")
      .attr("dx", "10px")
      .attr("dy", "0.3em");

    // Add center line (ratio = 1)
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScaleRatio(0))
      .attr("y2", yScaleRatio(0))
      .style("stroke", "#ccc")
      .style("stroke-dasharray", "4,4");

    // Add maximum runtime line (600s)
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScaleRuntime(600))
      .attr("y2", yScaleRuntime(600))
      .style("stroke", "#ff6b6b")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4");

    // Add maximum runtime label - moved to right side
    svg
      .append("text")
      .attr("x", width - margin.right + 35) // Move to right side
      .attr("y", yScaleRuntime(600))
      .attr("dy", "0.32em")
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .style("fill", "#ff6b6b");

    // Calculate the maximum bar height from the y-scale
    const TIMEOUT_BAR_HEIGHT = Math.abs(yScaleRatio(4) - yScaleRatio(0));

    // Update bars positioning with adjusted width
    svg
      .selectAll(".bar")
      .data(
        data.filter(
          (d) => d.solver !== baseSolver && visibleSolvers.has(d.solver),
        ),
      )
      .enter()
      .append("rect")
      .attr("class", "bar")
      .style("cursor", "pointer")
      .attr("x", (d) => {
        const groupPosition = xScale(`${d.benchmark}-${d.size}`) || 0;
        const barPosition = xSubScale(d.solver) || 0;
        // Center the bar within its allocated space if it's thinner than the space
        const offset = (xSubScale.bandwidth() - barWidth) / 2;
        return groupPosition + barPosition + offset;
      })
      .attr("width", barWidth)
      .attr("height", (d) => {
        // Use maximum height for timeout cases
        if (d.status === "TO" || d.runtime >= MaxRunTime) {
          return TIMEOUT_BAR_HEIGHT;
        }
        return Math.abs(yScaleRatio(d.factor) - yScaleRatio(0));
      })
      .attr("y", (d) => {
        // Align timeout bars to the top
        if (d.status === "TO" || d.runtime >= MaxRunTime) {
          return yScaleRatio(4); // Top of the scale
        }
        return d.factor > 0 ? yScaleRatio(d.factor) : yScaleRatio(0);
      })
      .attr("fill", (d) => solverColors[d.solver])
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        // Add hover effect
        d3.select(event.currentTarget)
          .transition()
          .duration(100)
          .attr("opacity", 1);

        tooltip.transition().duration(200).style("opacity", 0.9);

        const ratio = Math.pow(2, d.factor);
        const formattedRatio =
          ratio < 0.01 ? ratio.toExponential(1) : ratio.toPrecision(2);
        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size}<br/>` +
              `${d.solver}: ${d.runtime.toFixed(2)}s<br/>` +
              `${baseSolver}: ${d.baseSolverRuntime.toFixed(2)}s<br/>` +
              `Ratio: ${formattedRatio}`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", (event) => {
        // Remove hover effect
        d3.select(event.currentTarget)
          .transition()
          .duration(100)
          .attr("opacity", 0.8);

        tooltip.transition().duration(500).style("opacity", 0);
      })
      .append("title")
      .text((d) => `${d.solver}: ${d.runtime.toFixed(2)}s`);

    // Center scatter points in their group
    svg
      .selectAll(".scatter-point")
      .data(
        data.filter(
          (d) => d.solver === baseSolver && visibleSolvers.has(d.solver),
        ),
      )
      .enter()
      .append("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => {
        const groupPosition = xScale(`${d.benchmark}-${d.size}`) || 0;
        return groupPosition + xScale.bandwidth() / 2;
      })
      .attr("cy", (d) => yScaleRuntime(d.runtime))
      .attr("r", 4)
      .attr("fill", Color.Teal)
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size} <br/>` +
              `${baseSolver}: ${d.runtime.toFixed(2)}s`,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Update axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text(`Instances sorted by solving time of ${baseSolver}`);

    // Primary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Runtime Ratio (log scale)");

    // Secondary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", width - margin.right + 60)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .style("fill", "#666")
      .text(`Runtime of ${baseSolver} (s)`);

    // Add a legend entry for scatter points
    const legendContainer = d3
      .select(containerRef.current)
      .select(".legend-container");

    legendContainer.append("div").attr("class", "flex items-center gap-2")
      .html(`
        <div class="flex items-center justify-center w-4 h-4">
          <div class="w-3 h-3 rounded-full bg-white border-2"
               style="border-color: ${solverColors[baseSolver]}"></div>
        </div>
        <span class="text-sm text-gray-700">${baseSolver}</span>
      `);

    return () => {
      tooltip.remove();
    };
  }, [data, baseSolver, solverColors, visibleSolvers, availableSolvers]);

  return (
    <div className="bg-white p-4 rounded-xl">
      <div className="flex flex-wrap gap-4 mb-4 legend-container pb-4">
        {/* Selected solver legend (circle) */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => toggleSolver(baseSolver)}
        >
          <div className="flex items-center justify-center w-4 h-4">
            <div
              className={`w-4 h-4 rounded-full bg-teal ${
                visibleSolvers.has(baseSolver) ? "opacity-100" : "opacity-30"
              }`}
            />
          </div>
          <span className="text-sm text-gray-700">{baseSolver}</span>
        </div>

        {/* Other solvers legend (squares) */}
        {availableSolvers
          .filter((solver) => solver !== baseSolver)
          .map((solver) => (
            <div
              key={solver}
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => toggleSolver(solver)}
            >
              <div
                className="w-4 h-4 rounded-sm transition-opacity"
                style={{
                  backgroundColor: solverColors[solver],
                  opacity: visibleSolvers.has(solver) ? 0.8 : 0.2,
                }}
              />
              <span className="text-sm text-gray-700">{solver}</span>
            </div>
          ))}
      </div>

      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default PerformanceBarChart;
