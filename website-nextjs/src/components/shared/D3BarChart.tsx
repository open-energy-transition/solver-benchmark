import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  category: string;
  group: string;
  value: number;
}

interface ID3BarChart {
  title: string;
  height?: number;
  className?: string;
  data: DataPoint[];
  colors?: Record<string, string>;
  tooltipFormat?: (d: DataPoint) => string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

const D3BarChart = ({
  title,
  height = 200,
  className = "",
  data = [],
  colors = {},
  tooltipFormat,
  yAxisLabel = "",
  xAxisLabel = "",
}: ID3BarChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const width = containerRef.current?.clientWidth || 400;
    const margin = { top: 20, right: 10, bottom: 40, left: 40 };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

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
      .scaleBand()
      .domain(Array.from(new Set(data.map((d) => d.category))))
      .range([margin.left + 20, width - margin.right])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.value) ?? 0) + 1])
      .range([height - margin.bottom, margin.top]);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text").attr("fill", "#A1A9BC");
      });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("display", "none");
        g.selectAll(".tick line").attr("display", "none");
        g.selectAll("text").attr("fill", "#A1A9BC");
      });

    // Group data by group
    const groupedData = d3.group(data, (d) => d.group);

    // Create bars for each group
    groupedData.forEach((values, group, groups) => {
      const groupIndex = Array.from(groups.keys()).indexOf(group);
      const barWidth = xScale.bandwidth();

      svg
        .selectAll(`.bar-${group}`)
        .data(values)
        .join("rect")
        .attr("class", `bar-${group}`)
        .attr("x", (d) => xScale(d.category) ?? 0)
        .attr("y", (d) => yScale(d.value))
        .attr("width", barWidth)
        .attr("height", (d) => height - margin.bottom - yScale(d.value))
        .attr(
          "fill",
          colors[group] || `hsl(${(groupIndex * 360) / groups.size}, 70%, 50%)`,
        )
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(
              tooltipFormat?.(d) ||
                `<strong>${d.group}</strong><br>
               ${d.category}: ${d.value}`,
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
    });

    // Add grid lines
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
        );
    svg.append("g").call(grid);

    // Add axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#8C8C8C")
      .text(xAxisLabel);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#8C8C8C")
      .text(yAxisLabel);

    return () => {
      tooltip.remove();
    };
  }, [data, height, colors, tooltipFormat, xAxisLabel, yAxisLabel]);

  return (
    <div className={`bg-white rounded-xl ${className}`}>
      <div className="text-xs text-center pb-2 ml-4 font-bold text-dark-grey">
        {title}
      </div>
      {/* Legend */}
      <div className="flex gap-2 ml-4">
        {Array.from(new Set(data.map((d) => d.group))).map((group) => (
          <div
            key={group}
            className="py-1 px-2 uppercase bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  colors[group] ||
                  `hsl(${
                    (Array.from(new Set(data.map((d) => d.group))).indexOf(
                      group,
                    ) *
                      360) /
                    new Set(data.map((d) => d.group)).size
                  }, 70%, 50%)`,
              }}
            />
            {group}
          </div>
        ))}
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default D3BarChart;
