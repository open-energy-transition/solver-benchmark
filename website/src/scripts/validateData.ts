/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import yaml from "js-yaml";

// Type definitions
interface MetaData {
  [key: string]: any;
}

interface BenchmarkResult {
  Benchmark: string;
  Size: string;
  benchmarkId: string;
  [key: string]: any;
}

interface Size {
  size: string;
  [key: string]: any;
}

// Path constants
const RESULTS_DIR = path.resolve(process.cwd(), "../results");
const METADATA_PATH = path.join(RESULTS_DIR, "metadata.yaml");
const RESULTS_PATH = path.join(RESULTS_DIR, "benchmark_results.csv");

/**
 * Reads and parses the metadata YAML file
 * @returns The parsed metadata or null on error
 */
const getMetaData = async (): Promise<{ benchmarks: MetaData } | null> => {
  try {
    const yamlText = await fs.readFile(METADATA_PATH, "utf-8");
    const rawData = yaml.load(yamlText) as { benchmarks: MetaData };
    return rawData;
  } catch (error) {
    console.error("Error reading metadata:", error);
    return null;
  }
};

/**
 * Reads and parses the benchmark results CSV file
 * @returns Array of benchmark results
 */
async function getBenchmarkResults(): Promise<BenchmarkResult[]> {
  try {
    const fileContent = await fs.readFile(RESULTS_PATH, "utf-8");
    const parsedResults = Papa.parse<BenchmarkResult>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    return parsedResults.data;
  } catch (error) {
    console.error("Error reading benchmark results:", error);
    throw error;
  }
}

/**
 * Validates that all benchmark results have corresponding metadata entries
 */
export async function validateData(): Promise<void> {
  try {
    const [results, metaData] = await Promise.all([
      getBenchmarkResults(),
      getMetaData(),
    ]);

    if (!metaData) {
      throw new Error("Failed to load metadata");
    }
    const invalidResults = results.filter((result) => {
      const benchmark = metaData.benchmarks[result.Benchmark];
      return (
        !benchmark ||
        !benchmark.Sizes?.some((s: Size) => s.Name === result.Size)
      );
    });

    if (invalidResults.length > 0) {
      invalidResults.forEach((result) => {
        console.error(
          `Validation failed for benchmark: ${result.Benchmark} with size: ${result.Size}`,
        );
      });
      throw new Error(
        `${invalidResults.length} benchmark results failed validation`,
      );
    }
  } catch (error) {
    console.error("Error validating data:", error);
    throw error;
  }
}
