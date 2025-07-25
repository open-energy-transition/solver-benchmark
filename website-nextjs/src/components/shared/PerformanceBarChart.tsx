import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { getSolverColor } from "@/utils/chart";
import { CircleIcon, CloseIcon } from "@/assets/icons";
import { TIMEOUT_VALUES } from "@/constants/filter";
import { SolverStatusType } from "@/types/benchmark";

type PerformanceData = {
  benchmark: string;
  factor: number;
  solver: string;
  size: string;
  status: SolverStatusType;
  runtime: number;
  baseSolverRuntime: number;
  baseSolverStatus: SolverStatusType;
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

  const maxDataRuntime =
    d3.max(data, (d) => Math.max(d.runtime, d.baseSolverRuntime)) || 0;

  const solverColors = useMemo(() => {
    return availableSolvers.reduce(
      (acc, solver) => {
        acc[solver] = getSolverColor(solver);
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
      .domain([
        Math.min(
          minFactor > 0 ? -minFactor : minFactor,
          maxFactor > 0 ? -maxFactor : maxFactor,
        ) - 1,
        Math.max(maxFactor, 2),
      ])
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
    const yAxisRatio = d3.axisLeft(yScaleRatio).tickFormat((d) => {
      if (d === 0) return "1";
      const value = Math.pow(2, Number(d));

      if (value < 1) {
        // For values less than 1, show as 1/n
        const denominator = Math.round(1 / value);
        return `1/${denominator}`;
      } else if (value < 0.0001) {
        // For very small values, use exponential notation
        return `1/${(1 / value).toExponential(1)}`;
      } else {
        // For values greater than or equal to 1
        if (Number.isInteger(value)) {
          return value.toString(); // Show whole numbers as is
        }
        return value.toFixed(2); // Show 2 decimal places for non-integers
      }
    });
    const tickValues = [
      1,
      10,
      100,
      1000,
      TIMEOUT_VALUES.SHORT,
      TIMEOUT_VALUES.LONG,
    ].filter((value) => value <= maxDataRuntime);
    // Add maxDataRuntime to tick values if it's less than the short timeout
    if (maxDataRuntime < TIMEOUT_VALUES.SHORT) {
      tickValues.push(maxDataRuntime);
    }

    const yAxisRuntime = d3
      .axisRight(yScaleRuntime)
      .tickFormat(formatRuntime)
      .ticks(5) // Reduce number of ticks even more
      .tickValues(
        // Explicitly set tick values to avoid overlap
        tickValues,
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
      .attr("class", "secondcary-axis")
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
    if (maxDataRuntime >= TIMEOUT_VALUES.SHORT / 2) {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yScaleRuntime(TIMEOUT_VALUES.SHORT))
        .attr("y2", yScaleRuntime(TIMEOUT_VALUES.SHORT))
        .style("stroke", "#ff6b6b")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "4,4");
    }
    if (maxDataRuntime >= TIMEOUT_VALUES.LONG / 2) {
      // Add 10h timeout line (36000s)
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", yScaleRuntime(TIMEOUT_VALUES.LONG))
        .attr("y2", yScaleRuntime(TIMEOUT_VALUES.LONG))
        .style("stroke", "#ff6b6b")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "4,4");
    }
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
        const offset = (xSubScale.bandwidth() - barWidth) / 2;
        return groupPosition + barPosition + offset;
      })
      .attr("width", barWidth)
      .attr("height", (d) => {
        if (d.status !== "ok" && d.baseSolverStatus !== "ok") {
          return 0; // No bar when both fail
        }
        return Math.abs(yScaleRatio(d.factor) - yScaleRatio(0));
      })
      .attr("y", (d) => {
        if (d.status !== "ok" && d.baseSolverStatus !== "ok") {
          return yScaleRatio(0);
        }
        // When solver fails but base succeeds, bar should go up
        if (d.status !== "ok" && d.baseSolverStatus === "ok") {
          return yScaleRatio(d.factor);
        }
        // When base solver fails but other succeeds, bar should go down
        if (d.baseSolverStatus !== "ok" && d.status === "ok") {
          return yScaleRatio(0);
        }
        // Normal case - bar goes up or down based on factor
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
        if (d.status !== "ok" && d.baseSolverStatus === "ok") {
          ratioText = `Ratio: N/A because ${d.solver} TO`;
        } else if (d.status !== "ok" && d.baseSolverStatus !== "ok") {
          ratioText = "Ratio: N/A (both TO)";
        } else {
          const ratio = Math.pow(2, d.factor);
          ratioText = `Ratio: ${ratio < 0.01 ? ratio.toExponential(1) : ratio}`;
        }

        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size}<br/>` +
              `${d.solver}: ${d.runtime.toFixed(2)}s (${d.status})<br/>` +
              `${baseSolver}: ${d.baseSolverRuntime.toFixed(2)}s (${
                d.baseSolverStatus
              })<br/>` +
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
      });

    // Add failure indicators
    svg
      .selectAll(".failure-indicator")
      .data(
        data.filter(
          (d) => d.solver !== baseSolver && visibleSolvers.has(d.solver),
        ),
      )
      .enter()
      .append("text")
      .attr("class", "failure-indicator")
      .style("cursor", "pointer")
      .attr("x", (d) => {
        const groupPosition = xScale(`${d.benchmark}-${d.size}`) || 0;
        const barPosition = xSubScale(d.solver) || 0;
        const offset = (xSubScale.bandwidth() - barWidth) / 2;
        return groupPosition + barPosition + offset + barWidth / 2;
      })
      .attr("y", (d) => {
        // When both solvers timeout, align to center line
        if (d.status !== "ok" && d.baseSolverStatus !== "ok") {
          return yScaleRatio(0) - 10; // Position X above x-axis
        }
        if (d.status !== "ok" && d.baseSolverStatus === "ok") {
          return yScaleRatio(d.factor) - 5; // Position triangle above bar
        }
        if (d.baseSolverStatus !== "ok" && d.status === "ok") {
          return yScaleRatio(d.factor) + 15; // Position triangle below bar
        }
        return yScaleRatio(0);
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text((d) => {
        if (d.status !== "ok" && d.baseSolverStatus !== "ok") return "❌";
        if (d.status !== "ok") return "🔺";
        if (d.baseSolverStatus !== "ok") return "🔻";
        return "";
      })
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        let ratioText;
        if (d.status !== "ok" && d.baseSolverStatus === "ok") {
          ratioText = `Ratio: N/A because ${d.solver} TO`;
        } else if (d.status !== "ok" && d.baseSolverStatus !== "ok") {
          ratioText = "Ratio: N/A (both TO)";
        } else {
          const ratio = Math.pow(2, d.factor);
          ratioText = `Ratio: ${ratio < 0.01 ? ratio.toExponential(1) : ratio}`;
        }

        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size}<br/>` +
              `${d.solver}: ${d.runtime.toFixed(2)}s (${d.status})<br/>` +
              `${baseSolver}: ${d.baseSolverRuntime.toFixed(2)}s (${
                d.baseSolverStatus
              })<br/>` +
              ratioText,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

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
        if (d.status !== "ok") {
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

        if (d.status !== "ok") {
          // Create X mark for timeout cases
          const size = 4;
          element
            .attr(
              "d",
              `M${x - size},${y - size} L${x + size},${y + size} M${x - size},${
                y + size
              } L${x + size},${y - size}`,
            )
            .attr("stroke", solverColors[baseSolver])
            .attr("fill", "none");
        } else {
          // Regular circle for normal cases
          element
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", solverColors[baseSolver]);
        }

        // Add event listeners for tooltip
        element
          .on("mouseover", (event) => {
            element.attr("opacity", 0.7);

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(
                `Benchmark: ${d.benchmark}-${d.size}<br/>` +
                  `${baseSolver}: ${d.runtime.toFixed(2)}s (${d.status})<br/>`,
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
      .style("fill", "rgb(79 78 78)")
      .text(`Instances sorted by solving time of ${baseSolver}`);

    // Primary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2) + 50)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .style("fill", "rgb(79 78 78)")
      .text("Runtime ratio (log scale)");

    // Secondary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", width - margin.right + 70)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .style("fill", "rgb(79 78 78)")
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
        <span class="text-sm text-dark-grey">${baseSolver}</span>
      `);

    return () => {
      tooltip.remove();
    };
  }, [data, baseSolver, solverColors, visibleSolvers, availableSolvers]);

  return (
    <div className="bg-[#F4F6FA] p-4 rounded-xl">
      <h6 className="mb-2">Relative performance plot</h6>
      <p className="text-navy mb-4 max-w-screen-lg">
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
      <div>
        <div className="flex flex-wrap gap-4 legend-container pb-4">
          {/* Selected solver legend (circle) */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => toggleSolver(baseSolver)}
          >
            <div className="flex items-center justify-center w-4 h-4">
              <div
                className={`w-4 h-4 rounded-full transition-opacity ${
                  visibleSolvers.has(baseSolver) ? "opacity-100" : "opacity-30"
                }`}
                style={{ backgroundColor: solverColors[baseSolver] }}
              />
            </div>
            <span className="text-sm text-navy">{baseSolver}</span>
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
                <span className="text-sm text-navy">{solver}</span>
              </div>
            ))}
        </div>
        <div className="flex justify-between items-start text-sm mb-4">
          <div>
            <p>🔻/🔺: base / other solver failed to solve in time limit</p>
            <p>❌ : both solvers failed to solve in time limit</p>
          </div>
          <div className="mr-24">
            <p className="flex gap-1 items-center">
              <CircleIcon className="size-3" />
              base solver solved successfully
            </p>
            <p className="flex gap-1 items-center">
              <CloseIcon className="size-3" />
              base solver failed to solve in time limit
            </p>
          </div>
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default PerformanceBarChart;
