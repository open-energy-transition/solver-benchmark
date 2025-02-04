import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { CircleIcon } from "@/assets/icons"
import { SolverType } from "@/types/benchmark"
import { getSolverLabel } from "@/utils/solvers"
import { roundNumber } from "@/utils/number"
import { PATH } from "@/constants/path"

type ChartData = {
  runtime: number
  memoryUsage: number
  status: "TO" | "ok" | "warning"
  solver: SolverType
  benchmark: string
  size: string
}[]

interface D3ChartProps {
  chartData: ChartData
}

const D3Chart = ({ chartData = [] }: D3ChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const data = chartData

    // Solvers with colors
    const solvers = {
      glpk: "#00CC96",
      scip: "#629BF8",
      highs: "#B42318",
    }

    // Dimensions
    const width = containerRef.current?.clientWidth || 600
    const height = 400
    const margin = { top: 40, right: 20, bottom: 50, left: 70 }

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove()

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible")

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
      .domain([0, (d3.max(data, (d) => d.runtime) ?? 0) + 1])
      .range([margin.left, width - margin.right])

    const yScale = d3
      .scaleLinear()
      .domain([0, (d3?.max(data, (d) => d.memoryUsage) ?? 0) + 50])
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
      .text("Runtime (s)")
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
      .text("Peak Memory Usage (MB)")
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

        if (["TO", "warning"].includes(d.status)) {
          // Render an "X" for status 'TO'
          group
            .append("text")
            .attr("x", xScale(d.runtime))
            .attr("y", yScale(d.memoryUsage))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text("✕")
            .style("fill", solvers[d.solver])
            .style("font-size", "12px")
            .style("font-family", "'Lato', sans-serif")
        } else {
          // Render a circle for other statuses
          group
            .append("circle")
            .attr("cx", xScale(d.runtime))
            .attr("cy", yScale(d.memoryUsage))
            .attr("r", 4)
            .attr("fill", solvers[d.solver])
        }

        group
          .on("click", () => {
            window.location.href = PATH.benchmarkDetail.one.replace('{name}',d.benchmark)
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
                <strong>Solver:</strong> ${getSolverLabel(d.solver)}<br>
                 <strong>Runtime:</strong> ${roundNumber(d.runtime, 1)} s<br>
                 <strong>Memory:</strong> ${roundNumber(d.memoryUsage)} MB`
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
          Solver:
        </span>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="size-2 text-[#00CC96]" />
          GLPK
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="size-2 text-[#629BF8]" />
          SCIP
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-[9px] flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="size-2 text-[#B42318]" />
          HIGHS
        </div>
      </div>
      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  )
}

export default D3Chart
