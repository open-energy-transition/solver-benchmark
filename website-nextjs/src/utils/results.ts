import { MaxMemoryUsage, ProblemSize } from "@/constants"
import {
  BenchmarkResult,
  SolverStatusType,
  SolverType,
} from "@/types/benchmark"
import Papa from "papaparse"
import { getHighestVersion } from "./versions"

/**
 * Fetches and parses a CSV file from the `public` folder
 * @param {string} url - The relative path to the CSV file
 * @param {boolean} header - Whether the first row should be treated as headers (default: true)
 * @returns {Promise<object[]>} - A promise that resolves to a JSON array
 */
export const fetchCsvToJson = async (
  url: string,
  header = true
): Promise<object[]> => {
  try {
    const response = await fetch(url)
    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header,
        delimiter: ",",
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as object[])
        },
        error: (error: { message: unknown }) => {
          reject(error.message)
        },
      })
    })
  } catch (error) {
    console.error("Failed to fetch CSV:", error)
    throw error
  }
}

const getBenchmarkResults = async (): Promise<BenchmarkResult[]> => {
  const res = await fetchCsvToJson("/results/benchmark_results.csv")
  return res.map((rawData) => {
    const data = rawData as { [key: string]: string }
    return {
      benchmark: data["Benchmark"],
      dualityGap: data["Duality Gap"] || null,
      maxIntegralityViolation: data["Max Integrality Violation"] || null,
      memoryUsage: Number(data["Memory Usage (MB)"]),
      objectiveValue: data["Objective Value"] || null,
      runtime: Number(data["Runtime (s)"]),
      size: data["Size"],
      solver: data["Solver"] as SolverType,
      solverReleaseYear: parseInt(data["Solver Release Year"], 10),
      solverVersion: data["Solver Version"],
      status: data["Status"] as SolverStatusType,
      terminationCondition: data["Termination Condition"],
    }
  })
}

const getProblemSize = (runtime: number) => {
  if (runtime <= 10) {
    return ProblemSize.XXS
  } else if (runtime <= 60) {
    return ProblemSize.XS
  } else if (runtime <= 600) {
    return ProblemSize.S
  } else if (runtime <= 3600) {
    return ProblemSize.M
  } else {
    return ProblemSize.L
  }
}

const processBenchmarkResults = (benchmarkResult: BenchmarkResult[] = []) => {
  return benchmarkResult.map((benchmarkResult) => {
    return {
      ...benchmarkResult,
      memoryUsage: !["ok"].includes(benchmarkResult.status)
        ? MaxMemoryUsage
        : benchmarkResult.memoryUsage,
    }
  })
}

const formatBenchmarkName = (benchmarkResult: BenchmarkResult) => {
  return `${benchmarkResult.benchmark} ${benchmarkResult.size}`
}

const getLatestBenchmarkResult = (benchmarkResults: BenchmarkResult[] = []) => {
  function getLatestVersion(solver: string) {
    return getHighestVersion(
      Array.from(
        new Set(
          benchmarkResults
            .filter((result) => result.solver === solver)
            .map((result) => result.solverVersion)
        )
      )
    )
  }

  return benchmarkResults.filter((result) => {
    return result.solverVersion === getLatestVersion(result.solver)
  })
}

export {
  getBenchmarkResults,
  processBenchmarkResults,
  formatBenchmarkName,
  getProblemSize,
  getLatestBenchmarkResult,
}
