import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { CircleIcon } from "@/assets/icons"

type SolverType = "GLPK" | "SCIP" | "HiGHS";

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
    const margin = { top: 40, right: 20, bottom: 50, left: 70 }

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove()

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("overflow", "visible")

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, ((d3.max(data, (d) => d.runtime) ?? 0) + 1)])
      .range([margin.left, width - margin.right])

    const yScale = d3
      .scaleLinear()
      .domain([0, (d3?.max(data, (d) => d.memory) ?? 0) + 50])
      .range([height - margin.bottom, margin.top])

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6)
    const yAxis = d3.axisLeft(yScale).ticks(6)

    svg
      .append("g")
      .call(d3.axisBottom(xScale).ticks(width))
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", "#828898")
          .style("font-size", "12px")
      )
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(width / 80))
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("y2", -height)
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "1.5,2")
      )
      .call(xAxis)
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#022B3B")
      .text("Runtime (s)")
      .style("font-size", "12px")

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(null, "$.2f"))
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1)
          .attr("stroke-dasharray", "1.5,2")
      )
      .call(yAxis)
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "#8C8C8C")
      .text("Peak Memory Usage (MB)")
      .style("font-size", "12px")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")

    // Scatter points
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.runtime))
      .attr("cy", (d) => yScale(d.memory))
      .attr("r", 6)
      .attr("fill", (d) => solvers[d.solver])

    svg.selectAll(".tick").attr("color", "#828898")

    svg.selectAll(".domain").attr("color", "#828898")
  }, [])

  return (
    <div className="bg-white py-4 px-10">
      {/* legend */}
      <div className="flex gap-2 ml-8">
        <span className="font-bold text-dark-grey test-sm mr-1">Solver:</span>
        <div className="py-1 px-4 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#00CC96]" />
          GLPK
        </div>
        <div className="py-1 px-4 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#629BF8]" />
          SCIP
        </div>
        <div className="py-1 px-4 bg-stroke text-dark-grey text-xs flex items-center gap-1 rounded-md h-max w-max">
          <CircleIcon className="w-3 h-3 text-[#B42318]" />
          HIGHS
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  )
}

export default D3Chart
