import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { ID3StackedBarChart } from "@/types/chart";

const D3StackedBarChart = ({
  title,
  height = 200,
  className = "",
  data = [],
  categoryKey,
  xAxisTooltipFormat,
  colors,
  xAxisLabel = "Category",
  yAxisLabel = "Value",
  rotateXAxisLabels = false,
  showXaxisLabel = true,
}: ID3StackedBarChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data.length) return;

    const width = containerRef.current?.clientWidth || 400;
    const margin = { top: 20, right: 10, bottom: 60, left: 20 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

    // Get keys for stacking (excluding category key)
    const keys = Object.keys(data[0]).filter((key) => key !== categoryKey);

    // Stack the data
    const stack = d3.stack().keys(keys);
    const stackedData = stack(data as Iterable<{ [key: string]: number }>);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[categoryKey].toString()))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedData[stackedData.length - 1], (d) => d[1]) || 0,
      ])
      .range([height - margin.bottom, margin.top]);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Create bars
    svg
      .selectAll("g.stack")
      .data(stackedData)
      .join("g")
      .attr("class", "stack")
      .attr("fill", (d) => colors[d.key])
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => xScale(d.data[categoryKey].toString()) || 0)
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .on("mouseover", (event, d) => {
        const key = (
          d3.select(event.target.parentNode).datum() as { key: string }
        ).key;
        const value = d.data[key];
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${xAxisLabel}:</strong> ${d.data[categoryKey]}<br>
             <strong>Category:</strong> ${key}<br>
             <strong>Value:</strong> ${
               xAxisTooltipFormat ? xAxisTooltipFormat(value) : value
             }`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Add axes
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);
    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text")
          .attr("fill", "#A1A9BC")
          .style("text-anchor", rotateXAxisLabels ? "end" : "middle")
          .attr("transform", rotateXAxisLabels ? "rotate(-45)" : "rotate(0)");
      });

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text").attr("fill", "#A1A9BC");
      });
    if (showXaxisLabel) {
      // Update axis labels
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#8C8C8C")
        .style("font-size", "12px")
        .text(xAxisLabel);
    }
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
      .attr("fill", "#8C8C8C")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(yAxisLabel);

    return () => {
      tooltip.remove();
    };
  }, [
    data,
    height,
    colors,
    xAxisTooltipFormat,
    title,
    xAxisLabel,
    yAxisLabel,
    categoryKey,
    rotateXAxisLabels,
  ]);

  return (
    <div className={`bg-white rounded-xl ${className}`}>
      <div className="flex justify-between items-center">
        <div className="tag-line-xs text-center text-dark-grey ">{title}</div>
        <div className="flex gap-2 border border-stroke rounded-xl px-2 py-1">
          {Object.keys(colors).map((solverKey) => (
            <div
              key={solverKey}
              className="capitalize text-navy tag-line-xs flex items-center gap-1 rounded-md h-max w-max"
            >
              <CircleIcon
                style={{ color: colors[solverKey] }}
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

export default D3StackedBarChart;
