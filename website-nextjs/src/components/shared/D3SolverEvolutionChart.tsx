import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { getSolverColor, roundUpToNearest } from "@/utils/chart";

interface SolverEvolutionData {
  year: number;
  version: string;
  unsolvedCount: number;
  speedUp: number;
  sgmRuntime: number;
}

interface ID3SolverEvolutionChart {
  solverName: string;
  data: SolverEvolutionData[];
  height?: number;
  className?: string;
  colorIndex: number;
  totalBenchmarks: number;
  yRightDomain?: [number, number];
}

const D3SolverEvolutionChart = ({
  solverName,
  data,
  height = 300,
  totalBenchmarks = 105,
  yRightDomain,
  className = "",
}: ID3SolverEvolutionChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);

  const solverColor = useMemo(() => getSolverColor(solverName), [solverName]);

  useEffect(() => {
    if (data.length === 0) return;

    // Dimensions
    const width = containerRef.current?.clientWidth || 600;
    const margin = { top: 20, right: 60, bottom: 60, left: 60 };

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

    // Scales - ensure chronological order
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const xScale = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.version))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    // Left Y-axis (unsolved count)
    const yLeftScale = d3
      .scaleLinear()
      .domain([0, roundUpToNearest(totalBenchmarks)])
      .range([height - margin.bottom, margin.top]);

    // Right Y-axis (speed-up) - ensure reasonable range even for flat lines
    const validSpeedUps = sortedData
      .filter((d) => !isNaN(d.speedUp))
      .map((d) => d.speedUp);
    const maxSpeedUp =
      validSpeedUps.length > 0 ? Math.max(...validSpeedUps) : 1;
    const minSpeedUp =
      validSpeedUps.length > 0 ? Math.min(...validSpeedUps) : 1;

    // Add padding to make flat lines visible
    const yRightScale = d3
      .scaleLinear()
      .domain([
        Math.floor((yRightDomain ? yRightDomain[0] : minSpeedUp) * 10) / 10,
        Math.ceil((yRightDomain ? yRightDomain[1] : maxSpeedUp) * 16) / 10,
      ])
      .range([height - margin.bottom, margin.top]);

    // X-axis
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .attr("class", "text-xs")
          .style("text-anchor", "middle");
      });

    // Left Y-axis (unsolved)
    const yLeftAxis = d3.axisLeft(yLeftScale).ticks(10).tickSizeOuter(0);
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yLeftAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text").attr("fill", "#A1A9BC").attr("class", "text-xs");
      });

    // Right Y-axis (speed-up)
    const yRightAxis = d3
      .axisRight(yRightScale)
      .tickSize(0)
      .ticks(5)
      .tickValues(
        d3.range(
          yRightScale.domain()[0],
          yRightScale.domain()[1] + 0.1,
          (yRightScale.domain()[1] - yRightScale.domain()[0]) / 5,
        ),
      );
    svg
      .append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yRightAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text").attr("fill", "#DC2626").attr("class", "text-xs");
      });

    // Grid lines
    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(yLeftScale.ticks())
            .join("line")
            .attr("y1", (d) => 0.5 + yLeftScale(d))
            .attr("y2", (d) => 0.5 + yLeftScale(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("stroke-dasharray", "2,2"),
        );
    svg.append("g").call(grid);

    // Colored bars (unsolved count) - use sorted data
    svg
      .selectAll(".bar")
      .data(sortedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.version) ?? 0)
      .attr("y", (d) => yLeftScale(d.unsolvedCount))
      .attr("width", xScale.bandwidth())
      .attr(
        "height",
        (d) => height - margin.bottom - yLeftScale(d.unsolvedCount),
      )
      .attr("fill", solverColor)
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Version:</strong> ${d.version}<br>
             <strong>Year:</strong> ${d.year}<br>
             <strong>Unsolved:</strong> ${d.unsolvedCount}<br>
             <strong>Speed-up:</strong> ${
               isNaN(d.speedUp) ? "N/A" : d.speedUp.toFixed(2) + "x"
             }<br>
             <strong>SGM Runtime:</strong> ${
               isNaN(d.sgmRuntime) ? "N/A" : d.sgmRuntime.toFixed(2)
             }`,
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

    // Bar value labels
    svg
      .selectAll(".bar-label")
      .data(sortedData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (d) => (xScale(d.version) ?? 0) + xScale.bandwidth() / 2)
      .attr("y", (d) => yLeftScale(d.unsolvedCount) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", solverColor)
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d) => d.unsolvedCount);

    // Red line (speed-up) - use sorted data and filter valid values
    const validSpeedUpData = sortedData.filter(
      (d) => !isNaN(d.speedUp) && isFinite(d.speedUp),
    );

    if (validSpeedUpData.length > 0) {
      const line = d3
        .line<SolverEvolutionData>()
        .x((d) => (xScale(d.version) ?? 0) + xScale.bandwidth() / 2)
        .y((d) => yRightScale(d.speedUp))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(validSpeedUpData)
        .attr("fill", "none")
        .attr("stroke", "#DC2626")
        .attr("stroke-width", 3)
        .attr("d", line);
    }

    // Red dots (speed-up points) - use sorted data
    svg
      .selectAll(".speed-dot")
      .data(validSpeedUpData)
      .enter()
      .append("circle")
      .attr("class", "speed-dot")
      .attr("cx", (d) => (xScale(d.version) ?? 0) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yRightScale(d.speedUp))
      .attr("r", 4)
      .attr("fill", "#DC2626")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Version:</strong> ${d.version}<br>
             <strong>Year:</strong> ${d.year}<br>
             <strong>Unsolved:</strong> ${d.unsolvedCount}<br>
             <strong>Speed-up:</strong> ${
               isNaN(d.speedUp) ? "N/A" : d.speedUp.toFixed(2) + "x"
             }<br>
             <strong>SGM Runtime:</strong> ${
               isNaN(d.sgmRuntime) ? "N/A" : d.sgmRuntime.toFixed(2)
             }`,
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

    // Axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#8C8C8C")
      .attr("font-size", "12px")
      .text("Version");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", solverColor)
      .attr("font-size", "12px")
      .attr("transform", `translate(20, ${height / 2}) rotate(-90)`)
      .text("Unsolved Problems");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#DC2626")
      .attr("font-size", "12px")
      .attr("transform", `translate(${width - 20}, ${height / 2}) rotate(90)`)
      .text("Speed-up");

    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yLeftScale(totalBenchmarks))
      .attr("y2", yLeftScale(totalBenchmarks))
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0.8);
    svg
      .append("text")
      .attr("x", margin.left + 50)
      .attr("y", yLeftScale(totalBenchmarks + 2))
      .attr("text-anchor", "end")
      .attr("fill", "#FF6B6B")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(`Max: 105`);

    return () => {
      tooltip.remove();
    };
  }, [data, solverColor, solverName]);

  return (
    <div className={`bg-white p-4 rounded-xl ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {solverName.toUpperCase()} Performance Evolution
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 opacity-80"
              style={{ backgroundColor: solverColor }}
            ></div>
            <span className="text-gray-600">Unsolved Problems</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-600"></div>
            <span className="text-gray-600">Speed-up (vs first version)</span>
          </div>
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3SolverEvolutionChart;
