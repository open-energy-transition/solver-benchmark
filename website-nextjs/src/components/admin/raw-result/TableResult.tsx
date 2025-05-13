import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

import { useSelector } from "react-redux";
import { BenchmarkResult, OriginBenchmarkResult } from "@/types/benchmark";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { IResultState } from "@/types/state";

const CSV_URL =
  "https://raw.githubusercontent.com/open-energy-transition/solver-benchmark/main/results/benchmark_results.csv";

const TableResult = () => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkResults;
  });

  const columns = useMemo<ColumnDef<BenchmarkResult>[]>(
    () => [
      {
        header: "Benchmark",
        accessorKey: "benchmark",
        filterFn: "arrIncludesSome" as const,
        cell: (info: CellContext<BenchmarkResult, unknown>) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden 4xl:text-lg">
                {String(info.getValue())}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div className="bg-stroke p-2 rounded">
              {" "}
              {String(info.getValue())}{" "}
            </div>
          </Popup>
        ),
      },
      {
        header: "Instance",
        accessorKey: "size",
        filterFn: "arrIncludesSome" as const,
        size: 100,
      },
      {
        header: "Solver",
        accessorKey: "solver",
        filterFn: "arrIncludesSome" as const,
        size: 80,
      },
      {
        header: "Solver Version",
        accessorKey: "solverVersion",
        size: 130,
        filterFn: "arrIncludesSome" as const,
      },
      {
        header: "Solver Release Year",
        accessorKey: "solverReleaseYear",
        size: 170,
        filterFn: "arrIncludesSome" as const,
      },
      {
        header: "Status",
        accessorKey: "status",
        filterFn: "equals" as const,
        size: 80,
      },
      {
        header: "Termination Condition",
        accessorKey: "terminationCondition",
        size: 200,
        cell: (info: CellContext<BenchmarkResult, unknown>) => (
          <div className="w-[7.75rem] whitespace-nowrap overflow-hidden">
            {String(info.getValue())}
          </div>
        ),
      },

      {
        header: "Runtime",
        accessorKey: "runtime",
      },
      {
        header: "Memory",
        accessorKey: "memoryUsage",
      },
      {
        header: "Objective Value",
        accessorKey: "objectiveValue",
      },
      {
        header: "Max Integrality Violation",
        accessorKey: "maxIntegralityViolation",
        size: 210,
      },
      {
        header: "Duality Gap",
        accessorKey: "dualityGap",
        cell: (info: CellContext<BenchmarkResult, unknown>) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden 4xl:text-lg">
                {String(info.getValue())}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div className="bg-stroke p-2 rounded">
              {" "}
              {String(info.getValue())}{" "}
            </div>
          </Popup>
        ),
      },
    ],
    [],
  );

  const [originalData, setOriginalData] = useState<OriginBenchmarkResult[]>([]);

  // Fetch CSV and parse using PapaParse
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        Papa.parse<OriginBenchmarkResult>(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (result) => {
            setOriginalData(result.data);
          },
          error: (error: unknown) => console.error("Error parsing CSV:", error),
        });
      } catch (error) {
        console.error("Error fetching CSV:", error);
      }
    };

    fetchCSV();
  }, []);

  const handleDownload = (filteredData: BenchmarkResult[]) => {
    if (filteredData.length === 0) {
      alert("No data to download!");
      return;
    }

    const csvData = originalData.filter((data) =>
      filteredData.find(
        (row) =>
          row.benchmark === data["Benchmark"] &&
          row.size === data["Size"] &&
          row.solver === data["Solver"] &&
          row.solverReleaseYear === data["Solver Release Year"],
      ),
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered_benchmark_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TanStackTable
      data={benchmarkResults}
      columns={columns}
      title="Full Results"
      downloadTitle="Download Filtered"
      enableDownload
      enableColumnSelector
      onDownload={handleDownload}
    />
  );
};

export default TableResult;
