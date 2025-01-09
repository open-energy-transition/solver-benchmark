import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { CircleIcon } from "@/assets/icons"

type SolverType = "GLPK" | "SCIP" | "HiGHS"

const D3Chart = () => {
  const svgRef = useRef(null)

  useEffect(() => {
    // Sample Data
    const data: { runtime: number; memory: number; solver: SolverType }[] = [
      { runtime: 1, memory: 100, solver: "GLPK" },
      { runtime: 2, memory: 200, solver: "GLPK" },
      { runtime: 4, memory: 300, solver: "SCIP" },
      { runtime: 6, memory: 400, solver: "HiGHS" },
      { runtime: 8, memory: 500, solver: "SCIP" },
      { runtime: 10, memory: 600, solver: "GLPK" },
      { runtime: 10, memory: 550, solver: "HiGHS" },
    ]

    // Solvers with colors
    const solvers = {
      GLPK: "#00CC96",
      SCIP: "#629BF8",
      HiGHS: "#B42318",
    }

    // Dimensions
    const width = 600
    const height = 400
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove()

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "100%")
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
      .domain([0, (d3?.max(data, (d) => d.memory) ?? 0) + 50])
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
      .text("Year")
      .style("font-size", "12px")

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
      .text("Normalized SGM Runtime")
      .style("font-size", "12px")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")

    // Group data by solver
    const groupedData = d3.group(data, (d) => d.solver)

    // Line generator
    const line = d3
      .line<{ runtime: number; memory: number }>()
      .x((d) => xScale(d.runtime))
      .y((d) => yScale(d.memory))

    // Draw lines for each solver group
    groupedData.forEach((values, solver) => {
      svg
        .append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", solvers[solver as SolverType]) // Use solver color
        .attr("stroke-width", 2)
        .attr("d", line)
    })

    // Scatter points
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.runtime))
      .attr("cy", (d) => yScale(d.memory))
      .attr("r", 6)
      .attr("fill", (d) => solvers[d.solver]) // Use solver color for points
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Solver:</strong> ${d.solver}<br>
             <strong>Runtime:</strong> ${d.runtime}s<br>
             <strong>Memory:</strong> ${d.memory}MB`
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
  }, [])

  return (
    <div className="bg-white py-4 px-10 rounded-xl">
      {/* Legend */}
      <div className="flex gap-2 ml-8">
        <span className="font-bold text-dark-grey text-sm mr-1 flex items-end">
          Solver:
        </span>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#00CC96]" />
          GLPK
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#629BF8]" />
          SCIP
        </div>
        <div className="py-1 px-5 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#B42318]" />
          HIGHS
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  )
}

export default D3Chart
