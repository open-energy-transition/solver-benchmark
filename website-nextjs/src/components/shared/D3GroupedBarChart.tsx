import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { ID3GroupedBarChart } from "@/types/chart";
import { CircleIcon } from "@/assets/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

const D3GroupedBarChart = ({
  title,
  chartHeight = 200,
  chartData = [],
  categoryKey,
  customLegend,
  axisLabelTitle,
  xAxisTooltipFormat,
  tooltipFormat,
  xAxisTickFormat,
  colors,
  xAxisLabel = "Category",
  yAxisLabel = "Value",
  barTextClassName,
  rotateXAxisLabels = false,
  barOpacity = 1,
  showXaxisLabel = true,
  transformHeightValue,
  xAxisBarTextClassName = "text-xs fill-dark-grey",
  normalize = true,
}: ID3GroupedBarChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);
  const isMobile = useIsMobile();
  const [height, setHeight] = useState(chartHeight);

  useEffect(() => {
    if (isMobile) {
      setHeight(chartHeight + 50);
    } else {
      setHeight(chartHeight);
    }
  }, [isMobile]);

  useEffect(() => {
    const data = chartData.map((d) => ({ ...d }));
    if (!data.length) return;

    // Find minimum value for normalization
    if (normalize) {
      data.forEach((d) => {
        const minValue = Math.min(
          ...Object.keys(d)
            .filter((key) => key !== categoryKey)
            .map((key) => Number(d[key] || 0)),
        );
        Object.keys(d).forEach((key) => {
          if (d[key] !== null && d[key] !== undefined && key !== categoryKey) {
            d[key] = Number(d[key]) / minValue;
          }
        });
      });
    }

    const width = containerRef.current?.clientWidth || 400;
    const margin = {
      top: 30,
      right: 30,
      bottom: isMobile ? 130 : 90,
      left: 60,
    };

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible");

    const keys = Object.keys(data[0])
      .filter((key) => key !== categoryKey)
      .sort((a, b) => {
        const avgA = d3.mean(data, (d) => Number(d[a])) || 0;
        const avgB = d3.mean(data, (d) => Number(d[b])) || 0;
        return avgA - avgB;
      });

    // Scales for side-by-side bars
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[categoryKey].toString()))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const xScaleInner = d3
      .scaleBand()
      .domain(keys)
      .range([0, xScale.bandwidth()])
      .padding(0.05);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) =>
          d3.max(keys, (key) =>
            transformHeightValue
              ? transformHeightValue({
                  key,
                  value: d[key],
                  category: d[categoryKey],
                })
              : Number(d[key]),
          ),
        ) || 0,
      ])
      .nice()
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
    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        // Add horizontal grid lines
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(yScale.ticks())
            .join("line")
            .attr("y1", (d) => yScale(d))
            .attr("y2", (d) => yScale(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right)
            .attr("stroke-dasharray", "4,4"),
        );
    svg.append("g").call(grid);
    // Create bars side by side
    const barGroups = svg
      .selectAll(".barGroup")
      .data(data)
      .join("g")
      .attr("class", "barGroup")
      .attr(
        "transform",
        (d) => `translate(${xScale(d[categoryKey].toString())},0)`,
      );

    barGroups
      .selectAll("rect")
      .data((d) => {
        // Get keys for this specific data item and sort them by value
        const itemKeys = Object.keys(d)
          .filter((key) => key !== categoryKey)
          .sort((a, b) => -Number(d[b]) + Number(d[a]));

        // Create a separate xScale for each group
        const groupXScale = d3
          .scaleBand()
          .domain(itemKeys)
          .range([0, xScale.bandwidth()])
          .padding(0.05);

        return itemKeys.map((key) => ({
          key,
          value: d[key],
          category: d[categoryKey],
          xScale: groupXScale,
        }));
      })
      .join("rect")
      .attr("x", (d) => d.xScale(d.key) || 0)
      .attr("y", (d) =>
        yScale(
          transformHeightValue ? transformHeightValue(d) : Number(d.value),
        ),
      )
      .attr("width", xScaleInner.bandwidth())
      .attr("height", (d) => {
        const transformedValue = transformHeightValue
          ? transformHeightValue(d)
          : d.value;
        return height - margin.bottom - yScale(Number(transformedValue));
      })
      .attr("fill", (d) =>
        typeof colors === "function" ? colors(d) : colors[d.key],
      )
      .style("opacity", (d) =>
        typeof barOpacity === "function" ? barOpacity(d) : barOpacity ?? 1,
      )
      .style("stroke", "white")
      .style("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html((tooltipFormat ? tooltipFormat(d) : d.value) as string)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Add text labels above bars
    barGroups
      .selectAll(".bar-text")
      .data((d) => {
        const itemKeys = Object.keys(d)
          .filter((key) => key !== categoryKey)
          .sort((a, b) => -Number(d[b]) + Number(d[a]));

        const groupXScale = d3
          .scaleBand()
          .domain(itemKeys)
          .range([0, xScale.bandwidth()])
          .padding(0.05);

        return itemKeys.map((key) => ({
          key,
          value: d[key],
          category: d[categoryKey],
          xScale: groupXScale,
        }));
      })
      .join("text")
      .attr("x", (d) => d.xScale(d.key)! + d.xScale.bandwidth() / 2)
      .attr(
        "class",
        (d) =>
          `text-[10px] bar-text ${barTextClassName ? barTextClassName(d) : ""}`,
      )
      .attr("y", (d) =>
        yScale(
          (transformHeightValue ? transformHeightValue(d) : Number(d.value)) +
            0.05,
        ),
      )
      .attr("text-anchor", "middle")
      .text((d) => (axisLabelTitle ? axisLabelTitle(d) : d.value))
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html((tooltipFormat ? tooltipFormat(d) : d.value) as string)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale).tickFormat((category: string) => {
          const dataPoint = data.find(
            (item) => item[categoryKey].toString() === category,
          );
          return xAxisTickFormat
            ? xAxisTickFormat(category, dataPoint)
            : category;
        }),
      )
      .call((g) => {
        g.selectAll(".domain")
          .attr("stroke", "currentColor")
          .attr("d", `M${margin.left},0H${width - margin.right}`);
        g.selectAll("text")
          .attr("dy", "2em")
          .attr("class", xAxisBarTextClassName)
          .attr("fill", "#666")
          .style("text-anchor", isMobile ? "end" : "middle")
          .style("cursor", xAxisTooltipFormat ? "pointer" : "default")
          .attr("transform", isMobile ? "rotate(-45)" : null)
          .attr("x", isMobile ? "-10" : null)
          .attr("y", isMobile ? "10" : null)
          .on("mouseover", (event, d) => {
            const dataPoint = data.find(
              (item) => item[categoryKey].toString() === d,
            );
            if (xAxisTooltipFormat && dataPoint) {
              tooltip
                .style("opacity", 1)
                .html(xAxisTooltipFormat(d as string))
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`);
            }
          })
          .on("mouseout", () => tooltip.style("opacity", 0))
          .each(function () {
            const text = d3.select(this);
            const lines = text.text().split("\n");
            text.text(null); // Clear existing text
            lines.forEach((line, i) => {
              text
                .append("tspan")
                .attr("x", 0)
                .attr("dy", i === 0 ? "1em" : "1.2em")
                .text(line);
            });
          });
      });
    // Add reference line at y = 1
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScale(1))
      .attr("y2", yScale(1))
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(10))
      .call((g) => {
        g.selectAll(".domain")
          .attr("stroke", "currentColor")
          .attr("d", `M0,${height - margin.bottom}V${margin.top}`);

        g.selectAll("text").attr("fill", "#666");
      });

    // Update axis labels position
    if (showXaxisLabel) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(xAxisLabel);
    }

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs fill-dark-grey")
      .text(yAxisLabel);

    return () => {
      tooltip.remove();
    };
  }, [
    chartData,
    height,
    colors,
    xAxisTooltipFormat,
    title,
    xAxisLabel,
    yAxisLabel,
    categoryKey,
    rotateXAxisLabels,
    xAxisBarTextClassName,
  ]);

  const defaultLegend = () => (
    <div className="flex gap-2 border border-stroke rounded-xl px-2 py-1">
      {Object.keys(chartData[0] || {})
        .filter((key) => key !== categoryKey)
        .map((solverKey) => (
          <div
            key={solverKey}
            className="capitalize text-navy tag-line-xs flex items-center gap-1.5 rounded-md h-max w-max"
          >
            <CircleIcon
              style={{
                color:
                  typeof colors === "function"
                    ? colors({
                        key: solverKey,
                        value: "",
                        category: "",
                      })
                    : colors[solverKey],
              }}
              className="size-2"
            />
            {solverKey}
          </div>
        ))}
    </div>
  );

  return (
    <div className="relative bg-[#F4F6FA] rounded-2xl p-2">
      <div className="bg-white rounded-2xl p-1">
        <div className="flex px-5 mt-2 text-dark-grey justify-between flex-wrap gap-2">
          {/* Title */}
          <div className="text-sm text-center text-dark-grey ">{title}</div>
          {/* Legend */}
          {customLegend
            ? customLegend({ chartData, categoryKey })
            : defaultLegend()}
        </div>
        <div className="">
          <div ref={containerRef} className="overflow-hidden min-h-[300px]">
            <svg ref={svgRef}></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D3GroupedBarChart;
