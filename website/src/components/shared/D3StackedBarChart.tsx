import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { CircleIcon } from "@/assets/icons";
import { ID3StackedBarChart } from "@/types/chart";
import { createD3Tooltip } from "@/utils/chart";
import { useDebouncedWindowWidth } from "@/hooks/useDebouncedWindowWidth";
import DirectionalIndicator from "@/components/shared/DirectionalIndicator";
import { getSolverLabel } from "@/utils/solvers";

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
  directionalIndicator = undefined,
  yDomainMax,
  yTickCount = 4,
}: ID3StackedBarChart) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef(null);
  const windowWidth = useDebouncedWindowWidth(200);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Observe container width changes (e.g. gap/layout changes in the parent
  // flex row, or the sidebar nav expanding/collapsing) so the chart's SVG
  // width never goes stale relative to its actual rendered container size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width || el.clientWidth;
        setContainerWidth(Math.floor(w));
      }
    });
    ro.observe(el);

    setContainerWidth(el.clientWidth || 0);

    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const width = containerWidth || containerRef.current?.clientWidth || 400;
    const margin = {
      top: 20,
      right: 10,
      bottom: rotateXAxisLabels ? 75 : 60,
      // Rotated labels are anchored at their end and swing up-and-left of
      // the tick, so the first tick needs extra left margin or its label
      // gets clipped by the container's left edge. Kept the same for
      // non-rotated labels too, so charts placed side by side line up.
      left: 40,
    };

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
      .domain(data.map((d) => d[categoryKey]?.toString()))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        yDomainMax ??
          d3.max(stackedData[stackedData.length - 1], (d) => d[1]) ??
          0,
      ])
      .range([height - margin.bottom, margin.top])
      // Snap the domain to "nice" round numbers for the requested tick
      // count — without this, d3's tick-count hint is only a suggestion and
      // can silently collapse to fewer ticks than asked for when the data
      // max doesn't divide evenly.
      .nice(yTickCount);

    // Gridlines: very light horizontal lines at each y-tick, drawn first so
    // bars paint on top of them.
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(yTickCount))
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#EEF1F6")
      .attr("stroke-width", 1);

    // Tooltip
    const tooltip = createD3Tooltip();

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
      .attr("x", (d) => xScale((d.data[categoryKey] || "").toString()) || 0)
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
             <strong>Category:</strong> ${getSolverLabel(key)}<br>
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
    const yAxis = d3.axisLeft(yScale).ticks(yTickCount).tickSizeOuter(0);
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
          .attr("dx", rotateXAxisLabels ? "-0.6em" : null)
          .attr("dy", rotateXAxisLabels ? "0.15em" : null)
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
        .attr("fill", "#575757")
        .style("font-size", "12px")
        .text(xAxisLabel);
    }
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
      .attr("fill", "#575757")
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
    windowWidth,
    containerWidth,
    yDomainMax,
    yTickCount,
  ]);

  return (
    <div className={`bg-white rounded-xl ${className}`}>
      <div className="">
        <div className="flex items-center gap-2">
          <div className="tag-line-xs text-center text-dark-grey">
            {typeof title === "string" ? title : title}
          </div>
          {directionalIndicator && (
            <DirectionalIndicator direction={directionalIndicator} size="sm" />
          )}
        </div>
        <div className="w-max flex gap-2 border border-stroke rounded-xl px-2 py-1 ml-auto mt-2">
          {Object.keys(colors).map((solverKey) => (
            <div
              key={solverKey}
              className="capitalize text-navy tag-line-xs flex items-center gap-1 rounded-md h-max w-max"
            >
              <CircleIcon
                style={{ color: colors[solverKey] }}
                className={"size-2"}
              />
              {getSolverLabel(solverKey)}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full overflow-x-auto" ref={containerRef}>
        <div className="min-w-[200px]">
          <svg ref={svgRef}></svg>
        </div>
      </div>
    </div>
  );
};

export default D3StackedBarChart;
