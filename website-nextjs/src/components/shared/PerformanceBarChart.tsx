import { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import { getChartColor } from "@/utils/chart"

type PerformanceData = {
  benchmark: string
  factor: number
  solver: string
  size: string
  status: "TO" | "ok" | "warning"
  runtime: number
  baseSolverRuntime: number
}

interface Props {
  data: PerformanceData[]
  baseSolver: string
  availableSolvers: string[]
}

const PerformanceBarChart = ({ data, baseSolver, availableSolvers }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef(null)
  const [visibleSolvers, setVisibleSolvers] = useState<Set<string>>(
    new Set([baseSolver, ...availableSolvers.filter((s) => s !== baseSolver)])
  )

  const solverColors = useMemo(() => {
    return availableSolvers.reduce((acc, solver, index) => {
      acc[solver] = getChartColor(index)
      return acc
    }, {} as Record<string, string>)
  }, [availableSolvers])

  const toggleSolver = (solver: string) => {
    setVisibleSolvers((prev) => {
      const next = new Set(prev)
      if (solver === baseSolver) return next // Don't allow toggling base solver
      if (next.has(solver)) {
        next.delete(solver)
      } else {
        next.add(solver)
      }
      return next
    })
  }

  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800

    // Calculate required height for x-axis labels
    const tempSvg = d3.select("body").append("svg")
    const longestLabel = d3.max(data, d => `${d.benchmark}-${d.size}`.length) || 0
    const dummyText = tempSvg
      .append("text")
      .attr("font-size", "12px")
      .text("X".repeat(longestLabel))
    const textHeight = dummyText.node()?.getBBox().width || 0 // Use width since text will be rotated
    tempSvg.remove()

    // Calculate dynamic margins and height
    const margin = {
      top: 40,
      right: 100,
      bottom: Math.max(100, textHeight + 40), // Minimum 100px, or more if needed
      left: 60
    }
    const height = 400 + (margin.bottom - 100) // Increase height to accommodate labels

    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible")

    // Tooltip setup
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("opacity", 0)

    // Scale for x-axis (benchmarks)
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => `${d.benchmark}-${d.size}`))
      .range([margin.left, width - margin.right])
      .padding(0.1)

    // Scale for primary y-axis (ratio/factor)
    const yScaleRatio = d3
      .scaleLinear()
      .domain([-4, 4])
      .range([height - margin.bottom, margin.top])

    // Scale for secondary y-axis (runtime)
    const yScaleRuntime = d3
      .scaleLog()
      .domain([
        d3.min(data, (d) => Math.min(d.runtime, d.baseSolverRuntime)) || 0.1,
        d3.max(data, (d) => Math.max(d.runtime, d.baseSolverRuntime)) || 100,
      ])
      .range([height - margin.bottom, margin.top])

    // Axes
    const xAxis = d3.axisBottom(xScale)
    const yAxisRatio = d3
      .axisLeft(yScaleRatio)
      .tickFormat((d) => (d === 0 ? "1×" : `${Math.pow(2, Number(d))}×`))
    const yAxisRuntime = d3.axisRight(yScaleRuntime).tickFormat((d) => `${d}s`)

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -5)
      .attr("x", -10)
      .style("text-anchor", "end")
      .style("font-size", "12px")

    // Add primary y-axis (ratio)
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisRatio)

    // Add secondary y-axis (runtime)
    svg
      .append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(yAxisRuntime)
      .attr("class", "secondary-axis")
      .selectAll("text")
      .style("fill", "#666")

    // Add center line (ratio = 1)
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScaleRatio(0))
      .attr("y2", yScaleRatio(0))
      .style("stroke", "#ccc")
      .style("stroke-dasharray", "4,4")

    // Update bars to use ratio scale (excluding base solver and hidden solvers)
    svg
      .selectAll(".bar")
      .data(
        data.filter(
          (d) => d.solver !== baseSolver && visibleSolvers.has(d.solver)
        )
      )
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(`${d.benchmark}-${d.size}`) || 0)
      .attr("y", (d) => (d.factor > 0 ? yScaleRatio(d.factor) : yScaleRatio(0)))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => Math.abs(yScaleRatio(d.factor) - yScaleRatio(0)))
      .attr("fill", (d) => solverColors[d.solver])
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9)
        tooltip
          .html(
            `Benchmark:  ${d.benchmark}-${d.size} <br/>` +
              `${d.solver}: ${d.runtime.toFixed(2)}s<br/>` +
              `${baseSolver}: ${d.baseSolverRuntime.toFixed(2)}s<br/>` +
              `Ratio: ${Math.pow(2, d.factor).toFixed(2)}×`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0)
      })

    // Update scatter points to use runtime scale (only if base solver is visible)
    svg
      .selectAll(".scatter-point")
      .data(
        data.filter(
          (d) => d.solver === baseSolver && visibleSolvers.has(d.solver)
        )
      )
      .enter()
      .append("circle")
      .attr("class", "scatter-point")
      .attr(
        "cx",
        (d) => xScale(`${d.benchmark}-${d.size}`)! + xScale.bandwidth() / 2
      )
      .attr("cy", (d) => yScaleRuntime(d.runtime))
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", (d) => solverColors[d.solver])
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9)
        tooltip
          .html(
            `Benchmark: ${d.benchmark}-${d.size} <br/>` +
              `${baseSolver}: ${d.runtime.toFixed(2)}s`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0)
      })

    // Update axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("")

    // Primary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text("Runtime Ratio (log scale")

    // Secondary y-axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", width - margin.right + 45)
      .attr("text-anchor", "middle")
      .style("fill", "#666")
      .text(`Runtime of ${baseSolver} (s)`)

    // Add a legend entry for scatter points
    const legendContainer = d3
      .select(containerRef.current)
      .select(".legend-container")

    legendContainer.append("div").attr("class", "flex items-center gap-2")
      .html(`
        <div class="flex items-center justify-center w-4 h-4">
          <div class="w-3 h-3 rounded-full bg-white border-2"
               style="border-color: ${solverColors[baseSolver]}"></div>
        </div>
        <span class="text-sm text-gray-700">${baseSolver}</span>
      `)

    return () => {
      tooltip.remove()
    }
  }, [data, baseSolver, solverColors, visibleSolvers])

  return (
    <div className="bg-white p-4 rounded-xl">
      <div className="flex flex-wrap gap-4 mb-4 legend-container">
        {/* Selected solver legend (circle) */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => toggleSolver(baseSolver)}
        >
          <div className="flex items-center justify-center w-4 h-4">
            <div
              className="w-3 h-3 rounded-full bg-white border-2"
              style={{
                borderColor: solverColors[baseSolver],
                opacity: visibleSolvers.has(baseSolver) ? 1 : 0.3,
              }}
            />
          </div>
          <span className="text-sm text-gray-700">{baseSolver}</span>
        </div>

        {/* Other solvers legend (squares) */}
        {availableSolvers
          .filter((solver) => solver !== baseSolver)
          .map((solver) => (
            <div
              key={solver}
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => toggleSolver(solver)}
            >
              <div
                className="w-4 h-4 rounded-sm transition-opacity"
                style={{
                  backgroundColor: solverColors[solver],
                  opacity: visibleSolvers.has(solver) ? 0.8 : 0.2,
                }}
              />
              <span className="text-sm text-gray-700">{solver}</span>
            </div>
          ))}
      </div>

      <div ref={containerRef}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  )
}

export default PerformanceBarChart
