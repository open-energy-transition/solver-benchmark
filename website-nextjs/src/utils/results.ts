import { ProblemSize } from "@/constants";
import {
  BenchmarkResult,
  SolverStatusType,
  SolverType,
} from "@/types/benchmark";
import Papa from "papaparse";
import { getHighestVersion } from "./versions";
import { MetaData, Size } from "@/types/meta-data";
import { parseNumberOrNull } from "./number";
import { IFilterState, RealisticOption } from "@/types/state";

/**
 * Fetches and parses a CSV file from the `public` folder
 * @param {string} url - The relative path to the CSV file
 * @param {boolean} header - Whether the first row should be treated as headers (default: true)
 * @returns {Promise<object[]>} - A promise that resolves to a JSON array
 */
export const fetchCsvToJson = async (
  url: string,
  header = true,
): Promise<object[]> => {
  try {
    const response = await fetch(url);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header,
        delimiter: ",",
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as object[]);
        },
        error: (error: { message: unknown }) => {
          reject(error.message);
        },
      });
    });
  } catch (error) {
    console.error("Failed to fetch CSV:", error);
    throw error;
  }
};

const getMaxMemoryUsage = (
  benchmarkResult: BenchmarkResult,
  rawMetaData: MetaData,
): number => {
  const benchmarkMetadata = rawMetaData[benchmarkResult.benchmark];
  const benchmarkSize = benchmarkMetadata.sizes.find(
    (size) => size.name === benchmarkResult.size,
  );
  if (benchmarkSize?.size === "L") {
    return 62 * 1024;
  }
  return 7 * 1024;
};

const getBenchmarkResults = async (): Promise<BenchmarkResult[]> => {
  const res = await fetchCsvToJson("/results/benchmark_results.csv");
  return res.map((rawData) => {
    const data = rawData as { [key: string]: string };
    return {
      benchmark: data["Benchmark"],
      dualityGap: parseNumberOrNull(data["Duality Gap"]),
      maxIntegralityViolation: parseNumberOrNull(
        data["Max Integrality Violation"],
      ),
      memoryUsage: Number(data["Memory Usage (MB)"]),
      objectiveValue: parseNumberOrNull(data["Objective Value"]),
      runtime: Number(data["Runtime (s)"]),
      size: data["Size"],
      solver: data["Solver"] as SolverType,
      solverReleaseYear: parseInt(data["Solver Release Year"], 10),
      solverVersion: data["Solver Version"],
      status: data["Status"] as SolverStatusType,
      terminationCondition: data["Termination Condition"],
      runId: data["Run ID"],
      timeout: Number(data["Timeout"]),
    };
  });
};

const getProblemSize = (runtime: number) => {
  if (runtime <= 10) {
    return ProblemSize.XXS;
  } else if (runtime <= 60) {
    return ProblemSize.XS;
  } else if (runtime <= 600) {
    return ProblemSize.S;
  } else if (runtime <= 3600) {
    return ProblemSize.M;
  } else {
    return ProblemSize.L;
  }
};

const processBenchmarkResults = (
  benchmarkResult: BenchmarkResult[] = [],
  rawMetaData: MetaData,
) => {
  return benchmarkResult.map((benchmarkResult) => {
    return {
      ...benchmarkResult,
      runtime:
        benchmarkResult.status === "ok"
          ? benchmarkResult.runtime
          : benchmarkResult.timeout,
      memoryUsage:
        benchmarkResult.status === "ok"
          ? benchmarkResult.memoryUsage
          : getMaxMemoryUsage(benchmarkResult, rawMetaData),
    };
  });
};

const formatBenchmarkName = (benchmarkResult: BenchmarkResult) => {
  return `${benchmarkResult.benchmark} ${benchmarkResult.size}`;
};

const getLatestBenchmarkResult = (benchmarkResults: BenchmarkResult[] = []) => {
  const solvers = Array.from(
    new Set(benchmarkResults.map((result) => result.solver)),
  );
  if (solvers.length === 0) {
    return [];
  }
  const latestVersions = solvers.map((solver) => {
    const versions = Array.from(
      new Set(
        benchmarkResults
          .filter((result) => result.solver === solver)
          .map((result) => result.solverVersion),
      ),
    );

    return {
      solver,
      version: getHighestVersion(versions),
    };
  });

  return benchmarkResults.filter((result) => {
    const latestVersion = latestVersions.find(
      (v) => v.solver === result.solver,
    );
    return latestVersion && result.solverVersion === latestVersion.version;
  });
};

// Helper function to for filtering benchmarks based on realistic options
const checkRealisticFilter = (size: Size, filters: IFilterState): boolean => {
  return (
    (filters.realistic.includes(RealisticOption.Realistic) && size.realistic) ||
    (filters.realistic.includes(RealisticOption.Other) && !size.realistic)
  );
};

export {
  getBenchmarkResults,
  processBenchmarkResults,
  formatBenchmarkName,
  getProblemSize,
  getLatestBenchmarkResult,
  checkRealisticFilter,
  getMaxMemoryUsage,
};
