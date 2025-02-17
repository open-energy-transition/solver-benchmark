import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { CircleIcon, XIcon } from "@/assets/icons"
import { PATH_DASHBOARD } from "@/constants/path"

type ChartData = {
  xaxis: number
  yaxis: number
  status: "TO-TO" | "ok-ok" | "ok-TO" | "TO-ok"
  benchmark: string
  size: string
}[]

interface D3ChartProps {
  chartData: ChartData
  title: {
    xaxis: string
    yaxis: string
  }
  backgroundColor?: {
    upper?: string
    lower?: string
    upperOpacity?: string
    lowerOpacity?: string
  }
}

const ChartCompare = ({
  chartData = [],
  title = { xaxis: "", yaxis: "" },
  backgroundColor,
}: D3ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const data = chartData

    // Solvers with colors
    const statusColor = {
      "TO-TO": "#4C5C51",
      "ok-ok": "#E31937",
      "ok-TO": "#0F62FE",
      "TO-ok": "#E75134",
    }

    // Dimensions
    const width = containerRef.current?.clientWidth || 600
    const height = 400
    const margin = { top: 40, right: 20, bottom: 50, left: 70 }

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove()

    // Find min and max values
    const minX = d3.min(data, (d) => d.xaxis) ?? 0
    const maxX = d3.max(data, (d) => d.xaxis) ?? 1
    const minY = d3.min(data, (d) => d.yaxis) ?? 0
    const maxY = d3.max(data, (d) => d.yaxis) ?? 1

    // Use a common min/max range to make x=y line work correctly
    const minValue = Math.min(minX, minY)
    const maxValue = Math.max(maxX, maxY)

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible")

    // Add background split by x = y line
    if (backgroundColor?.lower) {
      svg
        .append("polygon")
        .attr(
          "points",
          `${margin.left},${height - margin.bottom} ${width - margin.right},${
            height - margin.bottom
          } ${width - margin.right},${margin.top}`
        )
        .attr("fill", backgroundColor.lower)
        .attr("fill-opacity", backgroundColor?.lowerOpacity ?? '')
    }
    if (backgroundColor?.upper) {
      svg
        .append("polygon")
        .attr(
          "points",
          `${margin.left},${height - margin.bottom} ${margin.left},${
            margin.top
          } ${width - margin.right},${margin.top}`
        )
        .attr("fill", backgroundColor.upper)
        .attr("fill-opacity", 0.2)
        .attr("fill-opacity", backgroundColor?.upperOpacity ?? '')
    }

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
      .style("font-family", "'Lato', sans-serif")
      .style("color", "#333")
      .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)")
      .style("pointer-events", "none")
      .style("opacity", 0)

    // Scales
    const xScale = d3
      .scaleLinear()
      // .domain([0, (d3.max(data, (d) => d.xaxis) ?? 0) + 1])
      .domain([minValue, maxValue])
      .range([margin.left, width - margin.right])

    const yScale = d3
      .scaleLinear()
      // .domain([0, (d3?.max(data, (d) => d.yaxis) ?? 0) + 50])
      .domain([minValue, maxValue])
      .range([height - margin.bottom, margin.top])

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickSizeOuter(0)
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0)
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("fill", "#022B3B")
      .call(xAxis)
      .call((g) => {
        g.selectAll(".domain").attr("stroke", "#A1A9BC")
        g.selectAll("line").attr("stroke", "#A1A9BC")
        g.selectAll("text").attr("fill", "#A1A9BC")
      })
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#8C8C8C")
      .text(title.xaxis)
      .style("font-size", "12px")
      .style("font-family", "'Lato', sans-serif")

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => {
        g.selectAll(".domain").attr("stroke", "#A1A9BC")
        g.selectAll("line").attr("stroke", "#A1A9BC")
        g.selectAll("text").attr("fill", "#A1A9BC")
      })
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#8C8C8C")
      .text(title.yaxis)
      .style("font-size", "12px")
      .style("font-family", "'Lato', sans-serif")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")

    // Scatter points
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("g")
      .each(function (d) {
        const group = d3.select(this)

        if (["TO-TO", "ok-TO", "TO-ok"].includes(d.status)) {
          // Render an "X" for status 'TO'
          group
            .append("text")
            .attr("x", xScale(d.xaxis))
            .attr("y", yScale(d.yaxis))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text("✕")
            .style("fill", statusColor[d.status])
            .style("font-size", "12px")
            .style("font-family", "'Lato', sans-serif")
        } else {
          // Render a circle for other statuses
          group
            .append("circle")
            .attr("cx", xScale(d.xaxis))
            .attr("cy", yScale(d.yaxis))
            .attr("r", 4)
            .attr("fill", statusColor[d.status])
        }

        group
          .on("click", () => {
            window.location.href = PATH_DASHBOARD.benchmarkDetail.one.replace(
              "{name}",
              d.benchmark
            )
          })
          .style("cursor", "pointer")

        // Add tooltip event listeners
        group
          .on("mouseover", (event) => {
            tooltip
              .style("opacity", 1)
              .html(
                `<strong>Name:</strong> ${d.benchmark}<br>
                <strong>Size:</strong> ${d.size}<br>
                 `
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 30}px`)
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 30}px`)
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0)
          })
      })

    // Draw x = y line
    svg
      .append("line")
      .attr("x1", xScale(minValue))
      .attr("y1", yScale(minValue))
      .attr("x2", xScale(maxValue))
      .attr("y2", yScale(maxValue))
      .attr("stroke", "#8B8B8B")
      .attr("stroke-width", 2)

    const grid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .append("g")
            .selectAll("line")
            .data(xScale.ticks())
            .join("line")
            .attr("x1", (d) => 0.5 + xScale(d))
            .attr("x2", (d) => 0.5 + xScale(d))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke-dasharray", "4,4")
        )
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
            .attr("stroke-dasharray", "4,4")
        )
        .call((g) => {
          // Hide last grid line
          g.selectAll("line:last-of-type").attr("display", "none")
        })
    svg.append("g").call(grid)

    return () => {
      // Cleanup tooltip on unmount
      tooltip.remove()
    }
  }, [chartData])
  return (
    <div className="bg-white py-4 px-10 rounded-xl">
      {/* Legend */}
      <div className="flex gap-2 ml-8">
        <span className="font-semibold text-dark-grey text-xs mr-1 flex items-end">
          Legend:
        </span>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="size-2 text-[#E31937]" />
          ok-ok
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon className="size-2 text-[#0F62FE]" />
          ok-TO
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon className="size-2 text-[#E75134]" />
          TO-ok
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <XIcon className="size-2 text-[#4C5C51]" />
          TO-TO
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  )
}

export default ChartCompare
