import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  CameraIcon,
  DownloadAltIcon,
  ArrowsMoveIcon,
  SearchPlusIcon,
  SearchMinusIcon,
} from "@/assets/icons";

interface DataPoint {
  x: number;
  y: number;
}

const MemoryUsageGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Chart dimensions
    const width = containerRef.current?.clientWidth || 500;
    const height = 420;
    const margin = { top: 17, right: 16, bottom: 17, left: 22 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Data points
    const data: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 20 },
      { x: 2, y: 40 },
      { x: 3, y: 60 },
      { x: 4, y: 80 },
      { x: 5, y: 100 },
    ];

    const additionalMarkers: DataPoint[] = [
      { x: 1, y: 40 },
      { x: 3, y: 80 },
    ];

    // Select the SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "none") // No border
      .style("background-color", "transparent"); // Transparent background

    // Clear previous content
    svg.selectAll("*").remove();

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.x)!]) // Non-null assertion
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y)!]) // Non-null assertion
      .range([chartHeight, 0]);

    // Add gridlines
    const grid = chart.append("g").attr("class", "grid");

    // X-axis gridlines
    grid
      .append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickSize(-chartHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#d9d9d9")
      .attr("stroke-dasharray", "3, 3")
      .attr("stroke-opacity", 0.8);

    grid.select(".x-grid path").remove(); // Remove axis path
    grid.select(".x-grid .tick:first-child").remove();
    grid.select(".x-grid .tick:last-child").remove();

    // Y-axis gridlines
    grid
      .append("g")
      .attr("class", "y-grid")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#d9d9d9")
      .attr("stroke-dasharray", "3, 3")
      .attr("stroke-opacity", 0.8);

    grid.select(".y-grid path").remove(); // Remove axis path
    grid.select(".y-grid .tick:first-child").remove();
    grid.select(".y-grid .tick:last-child").remove();

    // Line generator
    const line = d3
      .line<DataPoint>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveLinear); // Use linear interpolation

    // Draw the line
    chart
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Circles (data points)
    chart
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .attr("fill", "#4a7c59");

    // Stars (additional markers)
    chart
      .selectAll(".star")
      .data(additionalMarkers)
      .enter()
      .append("path")
      .attr("class", "star")
      .attr("d", d3.symbol<DataPoint>().type(d3.symbolStar).size(30)())
      .attr("transform", (d) => `translate(${xScale(d.x)},${yScale(d.y)})`)
      .attr("fill", "orange");

    // Hide axes (remove ticks and lines)
    chart
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(0)) // No ticks
      .selectAll("path, line")
      .remove(); // Remove axis lines

    chart
      .append("g")
      .call(d3.axisLeft(yScale).ticks(0)) // No ticks
      .selectAll("path, line")
      .remove(); // Remove axis lines
  }, []);

  return (
    <div className="flex-1">
      <p className="font-medium font-league text-lg mb-4 ml-6">Memory usage graph</p>
      <div className="bg-white rounded-3xl p-2 group">
        <div ref={containerRef} className="bg-[#F4F5F7] rounded-3xl">
          <svg ref={svgRef}></svg>
        </div>
        <div className="hidden group-hover:flex justify-center gap-6 py-3">
          <button className="text-[#A6A6A6] hover:text-green-pop">
            <CameraIcon />
          </button>
          <button className="text-[#A6A6A6] hover:text-green-pop">
            <ArrowsMoveIcon />
          </button>
          <button className="text-[#A6A6A6] hover:text-green-pop">
            <DownloadAltIcon />
          </button>
          <button className="text-[#A6A6A6] hover:text-green-pop">
            <SearchPlusIcon />
          </button>
          <button className="text-[#A6A6A6] hover:text-green-pop">
            <SearchMinusIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryUsageGraph;
