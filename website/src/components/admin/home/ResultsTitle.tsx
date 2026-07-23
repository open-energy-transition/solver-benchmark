import React from "react";
import { BenchmarkResult } from "@/types/benchmark";

interface ResultsSectionsTitleProps {
  benchmarkResults: BenchmarkResult[];
  latestBenchmarkResultLength: number;
  uniqueProblemCount: number;
  uniqueLatestProblemCount: number;
}
const ResultsSectionsTitle = ({
  benchmarkResults,
  latestBenchmarkResultLength,
  uniqueProblemCount,
  uniqueLatestProblemCount,
}: ResultsSectionsTitleProps) => {
  return (
    <div>
      <div className="relative text-navy font-bold text-xl pl-2 flex justify-between items-end">
        <h6 className="flex">
          Ranking{" "}
          {latestBenchmarkResultLength !== benchmarkResults.length &&
            `(filtered to ${uniqueProblemCount}/${uniqueLatestProblemCount}
              problems)`}
        </h6>
      </div>
    </div>
  );
};

export default ResultsSectionsTitle;
