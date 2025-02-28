import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { IResultState } from "@/types/state"
import PerformanceBarChart from "@/components/shared/PerformanceBarChart"
import { FaGlobe, FaGithub, FaBalanceScale } from "react-icons/fa"

const SOLVES_DATA = [
  {
    label: "HiGHS",
    name: "highs",
    sourceCode: "https://github.com/ERGO-Code/HiGHS",
    website: "https://highs.dev/",
  },
  {
    label: "SCIP",
    name: "scip",
    sourceCode: "https://github.com/scipopt/scip",
    website: "https://www.scipopt.org/",
  },
  {
    label: "CBC",
    name: "cbc",
    sourceCode: "https://github.com/coin-or/Cbc",
    website: "https://coin-or.github.io/Cbc/intro.html",
  },
  {
    label: "GLPK",
    name: "glpk",
    sourceCode: "https://github.com/firedrakeproject/glpk",
    website: "https://www.gnu.org/software/glpk/",
  },
]

const SolverSection = () => {
  const availableSolvers = useSelector((state: { results: IResultState }) => {
    return state.results.availableSolvers
  })

  const benchmarkLatestResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.benchmarkLatestResults
    }
  )

  const [selectedSolver, setSelectedSolver] = useState("")

  const [solverOptions, setSolverOptions] = useState<string[]>([])

  useEffect(() => {
    if (!availableSolvers.length) return
    setSelectedSolver(availableSolvers[0])
    setSolverOptions(availableSolvers)
  }, [availableSolvers])

  function calculateFactor(baseTime: number, solverTime: number) {
    return Math.log2((solverTime + 10) / (baseTime + 10))
  }

  const chartData = useMemo(() => {
    if (!selectedSolver) return []

    // Get base solver data points (these will show as factor = 0)
    const baseData = benchmarkLatestResults
      .filter((result) => result.solver === selectedSolver)
      .map((result) => ({
        benchmark: result.benchmark,
        solver: result.solver,
        size: result.size,
        status: result.status,
        runtime: result.runtime || 0,
        baseSolverRuntime: result.runtime || 0,
        factor: 0, // log2(1) = 0
      }))

    // Get comparison data points
    const comparisonData = benchmarkLatestResults
      .filter((result) => result.solver !== selectedSolver)
      .map((oData) => {
        const sData = baseData.find(
          (sData) => sData.benchmark === oData.benchmark
        )
        return {
          benchmark: oData.benchmark,
          solver: oData.solver,
          status: oData.status,
          size: oData.size,
          runtime: oData.runtime || 0,
          baseSolverRuntime: sData?.runtime || 0,
          factor: calculateFactor(sData?.runtime || 0, oData.runtime || 0),
        }
      })

    const baseRuntimes = new Map(
      baseData.map((d) => [`${d.benchmark}-${d.size}`, d.runtime])
    )

    // Combine and sort all data
    return [...baseData, ...comparisonData].sort((a, b) => {
      const aBaseRuntime = baseRuntimes.get(`${a.benchmark}-${a.size}`) || 0
      const bBaseRuntime = baseRuntimes.get(`${b.benchmark}-${b.size}`) || 0

      // Sort by base solver runtime
      if (aBaseRuntime !== bBaseRuntime) {
        return aBaseRuntime - bBaseRuntime
      }

      // Put base solver first within each benchmark group
      return a.solver === selectedSolver ? -1 : 1
    })
  }, [selectedSolver, benchmarkLatestResults])

  const selectedSolverInfo = useMemo(() => {
    if (!selectedSolver) return null
    const solverName = selectedSolver.split("--")[0].toLowerCase()
    return SOLVES_DATA.find((s) => s.name.toLowerCase() === solverName)
  }, [selectedSolver])

  return (
    <div>
      <div className="flex gap-4 mt-6 mb-4">
        {/* Solver select */}
        <div className="w-1/2 bg-[#F0F4F2] rounded-lg shadow-sm">
          <div className="p-3 pl-3.5 font-bold font-lato text-lg border-b border-gray-200">
            Solver Selection
          </div>
          <select
            name="solver1"
            value={selectedSolver}
            onChange={(event) => setSelectedSolver(event.target.value)}
            className="w-full font-bold pl-3 bg-[#F0F4F2] px-6 py-4 border-r-[1.5rem]
            border-transparent text-dark-grey text-base rounded-b-lg block focus-visible:outline-none"
          >
            <option disabled>Solver & version</option>
            {solverOptions.map((solver, idx) => (
              <option key={idx} value={solver}>
                {solver}
              </option>
            ))}
          </select>
        </div>

        {/* Enhanced solver info section */}
        {selectedSolverInfo && (
          <div className="w-1/2 bg-[#F0F4F2] rounded-lg shadow-sm">
            <div className="p-3 pl-3.5 font-bold font-lato text-lg border-b border-gray-200">
              Solver Information
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {selectedSolverInfo.label}
              </h3>
              <div className="space-y-3">
                <a
                  href={selectedSolverInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors"
                >
                  <FaGlobe className="w-5 h-5" />
                  <span className="hover:underline">Official Website</span>
                </a>
                <a
                  href={selectedSolverInfo.sourceCode}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors"
                >
                  <FaGithub className="w-5 h-5" />
                  <span className="hover:underline">Source Code</span>
                </a>
                <div className="flex items-center gap-3 transition-colors">
                  <FaBalanceScale className="w-5 h-5" />
                  <span>License: MIT</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <PerformanceBarChart
          data={chartData}
          baseSolver={selectedSolver.split("--")[0]}
          availableSolvers={availableSolvers}
        />
      )}
    </div>
  )
}
export default SolverSection
