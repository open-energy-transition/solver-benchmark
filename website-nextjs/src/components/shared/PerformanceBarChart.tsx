import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { getChartColor } from "@/utils/chart";
import { Color } from "@/constants/color";
import { CircleIcon, CloseIcon } from "@/assets/icons";

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
  timeout?: number;
}

const PerformanceBarChart = ({
  data,
  baseSolver,
  availableSolvers,
  timeout = 36000,
}: Props) => {
  const MaxRunTime = timeout;
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
    const height = 600 + (margin.bottom - 100);

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
    const maxFactor = d3.max(data, (d) => d.factor) || 0;
    const minFactor = d3.min(data, (d) => d.factor) || 0;
    const yScaleRatio = d3
      .scaleLinear()
      .domain([Math.min(minFactor, -2), Math.max(maxFactor, 2)])
      .range([height - margin.bottom, margin.top]);

    // Scale for secondary y-axis (runtime)
    const yScaleRuntime = d3
      .scaleLog()
      .domain([
        Math.min(
          0.01,
          d3.min(data, (d) => Math.min(d.runtime, d.baseSolverRuntime)) || 0.01,
        ),
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
        [1, 10, 100, 1000, 3600, 36000],
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
      .attr("class", "4xl:text-sm")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisRatio);

    // Add secondary y-axis (runtime)
    svg
      .append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yAxisRuntime)
      .attr("class", "secondcary-axis 4xl:text-sm")
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

    // Add 1h timeout line (3600s)
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScaleRuntime(3600))
      .attr("y2", yScaleRuntime(3600))
      .style("stroke", "#ff6b6b")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4");

    // Add 10h timeout line (36000s)
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScaleRuntime(36000))
      .attr("y2", yScaleRuntime(36000))
      .style("stroke", "#ff6b6b")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4,4");

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
        if (d.status === "TO") {
          // When both solvers timeout, set height to 0
          if (d.status === "TO" && d.baseSolverRuntime == MaxRunTime) {
            return 0;
          }
          return TIMEOUT_BAR_HEIGHT;
        }
        return Math.abs(yScaleRatio(d.factor) - yScaleRatio(0));
      })
      .attr("y", (d) => {
        // When both solvers timeout, align to center line
        if (d.status === "TO" && d.baseSolverRuntime >= MaxRunTime) {
          return yScaleRatio(0);
        }
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

        let ratioText;
        if (d.status !== "ok" && d.baseSolverRuntime < MaxRunTime) {
          ratioText = `Ratio: N/A because ${d.solver} TO`;
        } else if (d.status !== "ok" && d.baseSolverRuntime >= MaxRunTime) {
          ratioText = "Ratio: N/A (both TO)";
        } else {
          const ratio = Math.pow(2, d.factor);
          ratioText = `Ratio: ${
            ratio < 0.01 ? ratio.toExponential(1) : ratio.toPrecision(2)
          }`;
        }

        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size}<br/>` +
              `${d.solver}: ${d.runtime.toFixed(2)}s<br/>` +
              `${baseSolver}: ${d.baseSolverRuntime.toFixed(2)}s<br/>` +
              ratioText,
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
      .append((d) => {
        // Use path for X marks on timeout, circle for normal points
        if (d.status !== "ok" || d.runtime >= MaxRunTime) {
          return document.createElementNS("http://www.w3.org/2000/svg", "path");
        }
        return document.createElementNS("http://www.w3.org/2000/svg", "circle");
      })
      .attr("class", "scatter-point")
      .style("cursor", "pointer")
      .each(function (d) {
        const element = d3.select(this);
        const x =
          (xScale(`${d.benchmark}-${d.size}`) || 0) + xScale.bandwidth() / 2;
        const y = yScaleRuntime(d.runtime);

        if (d.status !== "ok" || d.runtime >= MaxRunTime) {
          // Create X mark for timeout cases
          const size = 4;
          element
            .attr(
              "d",
              `M${x - size},${y - size} L${x + size},${y + size} M${x - size},${
                y + size
              } L${x + size},${y - size}`,
            )
            .attr("stroke", Color.Teal)
            .attr("fill", "none");
        } else {
          // Regular circle for normal cases
          element
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", Color.Teal);
        }

        // Add event listeners for tooltip
        element
          .on("mouseover", (event) => {
            element.attr("opacity", 0.7);

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(
                `Benchmark: ${d.benchmark}-${d.size}<br/>` +
                  `${baseSolver}: ${d.runtime.toFixed(2)}s<br/>` +
                  `Status: ${d.status === "ok" ? "OK" : "TO"}`,
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 28}px`);
          })
          .on("mouseout", () => {
            // Remove hover effect
            element.attr("opacity", 1);
            tooltip.transition().duration(500).style("opacity", 0);
          });
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
      .attr("x", -(height / 2) + 50)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Runtime ratio (log scale)");

    // Secondary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", width - margin.right + 70)
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
        <span class="text-sm text-gray-700 4xl:text-base">${baseSolver}</span>
      `);

    return () => {
      tooltip.remove();
    };
  }, [data, baseSolver, solverColors, visibleSolvers, availableSolvers]);

  return (
    <div className="bg-white p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-2 4xl:text-2xl">
        Relative performance plot
      </h2>
      <p className="text-sm text-gray-600 mb-4 max-w-[755px] 4xl:text-base">
        This plot (inspired by Matthias Miltenberger&apos;s{" "}
        <a href="https://mattmilten.github.io/mittelmann-plots/">
          Mittelmann plots
        </a>
        ) shows the runtime ratios (relative speedup factors) for each benchmark
        instance with respect to the selected base solver&apos;s runtime. Ratios
        above 1 (bars above the x-axis) are instances where the base solver
        performs better, and ratios below 1 (bars below the x-axis) are those
        where the other solver performs better. Instances are sorted by the
        runtime of the base solver.
      </p>

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
          <span className="text-sm text-gray-700 4xl:text-bae">
            {baseSolver}
          </span>
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
              <span className="text-sm text-gray-700 4xl:text-bae">
                {solver}
              </span>
            </div>
          ))}
      </div>

      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
      <div className="pt-1.5 pb-3 pl-3">
        <p className="flex gap-1 items-center text-dark-grey text-sm 4xl:text-base">
          <CloseIcon className="size-3" />
          represents benchmarks that timed out, while
          <CircleIcon className="size-3" />
          indicates a successful run.
        </p>
      </div>
    </div>
  );
};

export default PerformanceBarChart;
