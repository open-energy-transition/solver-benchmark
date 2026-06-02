import React from "react";
import { BenchmarkResult } from "@/types/benchmark";

interface ResultsSectionsTitleProps {
  benchmarkResults: BenchmarkResult[];
  latestBenchmarkResultLength: number;
  uniqueBenchmarkCount: number;
  uniqueLatestBenchmarkCount: number;
}
const ResultsSectionsTitle = ({
  benchmarkResults,
  latestBenchmarkResultLength,
  uniqueBenchmarkCount,
  uniqueLatestBenchmarkCount,
}: ResultsSectionsTitleProps) => {
  return (
    <div>
      <div className="relative text-navy font-bold text-xl pl-2 flex justify-between items-end">
        <h6 className="flex">
          Ranking{" "}
          {latestBenchmarkResultLength !== benchmarkResults.length &&
            `(filtered to ${uniqueBenchmarkCount}/${uniqueLatestBenchmarkCount}
              benchmark instances)`}
        </h6>
      </div>
    </div>
  );
};

export default ResultsSectionsTitle;
