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

const SolverRuntimeGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Define mock data
  const data: DataPoint[] = [
    { x: 0.4, y: 5 },
    { x: 1.6, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 40 },
    { x: 4.5, y: 100 },
  ];

  const additionalMarkers: DataPoint[] = [
    { x: 1.5, y: 25 },
    { x: 3.5, y: 70 },
  ];

  useEffect(() => {
    // Define chart dimensions
    const width = containerRef.current?.clientWidth || 500;
    const height = 420;
    const margin = { top: 17, right: 16, bottom: 17, left: 22 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Select and initialize the SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "none") // Remove any border on SVG
      .style("background-color", "transparent"); // Transparent background to blend

    // Clear any existing content
    svg.selectAll("*").remove();

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.x)!]) // Non-null assertion since data exists
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y)!]) // Non-null assertion since data exists
      .range([chartHeight, 0]);

    // Gridlines (customized style)
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
          .tickSize(-chartHeight) // Extend gridlines across the chart
          .tickFormat(() => ""), // Remove tick labels
      )
      .selectAll("line")
      .attr("stroke", "#d9d9d9") // Light gray gridlines
      .attr("stroke-dasharray", "3, 3") // Dashed style: 3px dash, 3px gap
      .attr("stroke-opacity", 0.8); // Slightly faded

    // Remove outer border line for the X-axis grid
    grid.select(".x-grid path").remove();
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
          .tickSize(-chartWidth) // Extend gridlines across the chart
          .tickFormat(() => ""), // Remove tick labels
      )
      .selectAll("line")
      .attr("stroke", "#d9d9d9") // Light gray gridlines
      .attr("stroke-dasharray", "3, 3") // Dashed style: 3px dash, 3px gap
      .attr("stroke-opacity", 0.8); // Slightly faded

    // Remove outer border line for the Y-axis grid
    grid.select(".y-grid path").remove();
    grid.select(".y-grid .tick:first-child").remove();
    grid.select(".y-grid .tick:last-child").remove();

    // Area generator
    const area = d3
      .area<DataPoint>()
      .x((d) => xScale(d.x))
      .y0(chartHeight)
      .y1((d) => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(72, 150, 104, 0.8)");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(72, 150, 104, 0)");

    // Draw the area
    chart
      .append("path")
      .datum(data)
      .attr("fill", "url(#gradient)")
      .attr("d", area);

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

    // Remove axes (ensure no border lines remain)
    chart
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(0)) // Hide X-axis ticks and labels
      .selectAll("path, line")
      .remove(); // Remove axis line

    chart
      .append("g")
      .call(d3.axisLeft(yScale).ticks(0)) // Hide Y-axis ticks and labels
      .selectAll("path, line")
      .remove(); // Remove axis line
  }, [additionalMarkers, data]);

  return (
    <div className="flex-1">
      <p className="font-medium font-league text-lg mb-4 ml-6">Runtime graph</p>
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

export default SolverRuntimeGraph;
