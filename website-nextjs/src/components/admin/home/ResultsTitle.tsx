import React from "react";
import { useSelector } from "react-redux";
import { getLatestBenchmarkResult } from "@/utils/results";
import { IResultState } from "@/types/state";
import { BenchmarkResult } from "@/types/benchmark";

interface ResultsSectionsTitleProps {
  benchmarkResults: BenchmarkResult[];
}
const ResultsSectionsTitle = ({
  benchmarkResults,
}: ResultsSectionsTitleProps) => {
  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.rawBenchmarkResults;
    },
  );

  const latestBenchmarkResult = getLatestBenchmarkResult(rawBenchmarkResults);

  const uniqueBenchmarkCount = new Set(
    benchmarkResults.map((result) => `${result.benchmark}-${result.size}`),
  ).size;

  const uniqueLatestBenchmarkCount = new Set(
    latestBenchmarkResult.map((result) => `${result.benchmark}-${result.size}`),
  ).size;

  return (
    <div>
      <div className="relative text-navy font-bold text-xl pl-2 flex justify-between items-end">
        <h6 className="flex">
          Ranking
          {latestBenchmarkResult.length !== benchmarkResults.length && (
            <span className="ml-1">
              (filtered to {uniqueBenchmarkCount}/{uniqueLatestBenchmarkCount}{" "}
              benchmark instances)
            </span>
          )}
        </h6>
      </div>
    </div>
  );
};

export default ResultsSectionsTitle;
