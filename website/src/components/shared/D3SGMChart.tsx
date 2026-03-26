import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { SolverYearlyChartData } from "@/types/performance-history";
import { createD3Tooltip, getSolverColor } from "@/utils/chart";
import { IResultState } from "@/types/state";
import { useDebouncedWindowWidth } from "@/hooks/useDebouncedWindowWidth";
import { HIPO_SOLVERS } from "@/utils/solvers";

type SolverType = "glpk" | "scip" | "highs";

interface ID3SGMChart {
  title: string;
  height?: number;
  className?: string;
  chartData: SolverYearlyChartData[];
  xAxisTooltipFormat?: (value: number | string) => string;
  excluseHipo?: boolean;
}

const D3SGMChart = ({
  title,
  height = 280,
  className = "",
  chartData = [],
  xAxisTooltipFormat,
  excluseHipo = false,
}: ID3SGMChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);

  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return excluseHipo
      ? state.results.availableSolvers.filter(
          (solver) => !HIPO_SOLVERS.includes(solver),
        )
      : state.results.availableSolvers;
  });
  const windowWidth = useDebouncedWindowWidth(200);

  const solverColors = useMemo<Record<string, string>>(() => {
    return availableSolvers.reduce(
      (acc, solver: string) => {
        acc[solver] = getSolverColor(solver);
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [availableSolvers]);

  // Normalize data by best solver ever measured (global best = 1.0)
  const normalizedChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    // Find the best (minimum) value across all years and solvers
    const bestValueEver = d3.min(chartData, (d) => d.value) || 1;
    // Normalize all values relative to the best ever measured
    const normalizedData: SolverYearlyChartData[] = chartData.map((d) => ({
      ...d,
      value: d.value / bestValueEver,
      originalValue: d.value, // Keep original value for tooltip
    }));

    return normalizedData;
  }, [chartData]);

  useEffect(() => {
    if (normalizedChartData.length === 0) return;

    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const margin = { top: 40, right: 20, bottom: 40, left: 85 };

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
    const tooltip = createD3Tooltip();

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(normalizedChartData.map((d) => d.year.toString()))
      .range([margin.left + 20, width - margin.right]);

    const maxValue = d3.max(normalizedChartData, (d) => d.value) || 1;
    const yDomainMax = Math.max(maxValue + 1, 2);
    const yScale = d3
      .scaleLinear()
      .domain([0, yDomainMax])
      .range([height - margin.bottom, margin.top]);

    // const yTickValues = generateYTicks(Math.ceil(maxValue));

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
        g.selectAll("text").attr("fill", "#A1A9BC").attr("class", "text-xs");
      })
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#8C8C8C")
      .text("Year")
      .attr("class", "text-xs");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("line").attr("stroke", "#A1A9BC");
        g.selectAll("text").attr("fill", "#A1A9BC").attr("class", "text-xs");
      })
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#8C8C8C")
      .text(title)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs -rotate-90");

    // Grid
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

    // Add dotted line at y=1
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScale(1))
      .attr("y2", yScale(1))
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.8);

    // Group data by solver
    const groupedData = d3.group(normalizedChartData, (d) => d.solver);

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
        .attr("stroke", solverColors[solver as SolverType])
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Scatter points
    svg
      .selectAll(".dot")
      .data(normalizedChartData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.year.toString()) ?? 0)
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 6)
      .attr("fill", (d) => solverColors[d.solver])
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Solver:</strong> ${d.solver}<br>
             <strong>Year:</strong> ${d.year}<br>
             <strong>Version:</strong> ${d.version}<br>
             <strong>Normalized Value:</strong> ${d.value.toFixed(2)}x<br>
             ${
               xAxisTooltipFormat && (d as SolverYearlyChartData).originalValue
                 ? xAxisTooltipFormat(
                     (d as SolverYearlyChartData).originalValue ?? 0,
                   )
                 : `<strong>Original Value:</strong> ${
                     (d as SolverYearlyChartData).originalValue || d.value
                   }`
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

    // Add labels on data points with collision detection
    const labels = svg
      .selectAll(".point-label")
      .data(normalizedChartData)
      .enter()
      .append("text")
      .attr("class", "point-label")
      .attr("x", (d) => xScale(d.year.toString()) ?? 0)
      .attr("y", (d) => yScale(d.value) - 12) // Initial position above the point
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d) => `${d.value.toFixed(2)}x`);

    // Adjust overlapping labels
    const labelPadding = 4; // Minimum vertical space between labels
    const labelHeight = 14; // Approximate height of label text

    // Group labels by x position (year)
    const labelsByYear = d3.group(
      normalizedChartData.map((d, i) => ({
        data: d,
        index: i,
        x: xScale(d.year.toString()) ?? 0,
        y: yScale(d.value) - 12,
      })),
      (d) => d.x,
    );

    // Process each year group
    labelsByYear.forEach((yearLabels) => {
      // Sort by y position (top to bottom)
      const sorted = yearLabels.sort((a, b) => a.y - b.y);

      // Detect and resolve overlaps
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const overlap = current.y + labelHeight + labelPadding - next.y;
        if (overlap > 0) {
          // Shift the lower label down
          next.y += overlap;
        }
      }

      // Apply adjusted positions
      sorted.forEach((item) => {
        labels.filter((_, idx) => idx === item.index).attr("y", item.y);
      });
    });

    return () => {
      // Cleanup tooltip on unmount
      tooltip.remove();
    };
  }, [normalizedChartData, solverColors, windowWidth]);

  return (
    <div className={`bg-white p-4 pl-0 lg:pl-4 rounded-xl ${className}`}>
      {/* Legend */}
      <div className="flex gap-2 ml-8">
        <span className="items-start font-semibold text-[#8C8C8C] text-xs mr-1 flex">
          Solver:
        </span>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(solverColors).map((solverKey) => (
            <div
              key={solverKey}
              className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max"
            >
              <CircleIcon
                style={{ color: solverColors[solverKey] }}
                className={"size-2"}
              />
              {solverKey}
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3SGMChart;
