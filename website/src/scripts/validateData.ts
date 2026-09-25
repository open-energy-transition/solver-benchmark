import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import yaml from "js-yaml";

// Type definitions
// Metadata entries are keyed by problem ID: the `Problem` column in current
// CSVs, or `${Benchmark}-${Size}` in historical ones.
interface RawMetaData {
  problems: Record<string, unknown>;
}

interface CsvBenchmarkResult {
  Problem?: string;
  Benchmark?: string;
  Size?: string;
}

// Path constants
const RESULTS_DIR = path.resolve(process.cwd(), "../results");
const METADATA_PATH = path.join(RESULTS_DIR, "metadata.yaml");
const RESULTS_PATH = path.join(RESULTS_DIR, "benchmark_results.csv");

/**
 * Reads and parses the metadata YAML file
 * @returns The parsed metadata or null on error
 */
const getMetaData = async (): Promise<RawMetaData | null> => {
  try {
    const yamlText = await fs.readFile(METADATA_PATH, "utf-8");
    const rawData = yaml.load(yamlText) as RawMetaData;
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
async function getBenchmarkResults(): Promise<CsvBenchmarkResult[]> {
  try {
    const fileContent = await fs.readFile(RESULTS_PATH, "utf-8");
    const parsedResults = Papa.parse<CsvBenchmarkResult>(fileContent, {
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

const getProblemKey = (result: CsvBenchmarkResult): string =>
  result.Problem ?? `${result.Benchmark}-${result.Size}`;

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
      return !metaData.problems[getProblemKey(result)];
    });

    if (invalidResults.length > 0) {
      invalidResults.forEach((result) => {
        console.error(
          `Validation failed for problem: ${getProblemKey(result)}`,
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
