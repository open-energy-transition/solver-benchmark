import React, { useMemo } from "react";
import Papa from "papaparse";
import { useSelector } from "react-redux";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { BenchmarkResult } from "@/types/benchmark";
import { IResultState } from "@/types/state";
import { CellContext } from "@tanstack/react-table";
import { Technique } from "@/constants";
import Link from "next/link";

type DataTableProps = {
  benchmarkName: string;
};

type TableData = {
  size?: string;
  solver: string;
  solverVersion: string;
  status: string;
  terminationCondition: string;
  runtime: number;
  memoryUsage: number;
  objectiveValue: string | null;
  maxIntegralityViolation: string | null;
  dualityGap: string | null;
  log: string | null;
  solution: string | null;
};

const BASE_STORAGE_URL = "https://storage.googleapis.com/solver-benchmarks";

const DataTable = ({ benchmarkName }: DataTableProps) => {
  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkResults;
  });
  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });
  const isMilp = useMemo(() => {
    const benchmarkDetail = rawMetaData[benchmarkName as string];
    return benchmarkDetail && benchmarkDetail.technique === Technique.MILP;
  }, [benchmarkName]);

  const getLogDownloadUrl = (row: BenchmarkResult) => {
    const urlPathSegment = `${row.runId}/${row.benchmark}-${row.size}-${row.solver}-${row.solverVersion}`;
    return `${BASE_STORAGE_URL}/logs/${urlPathSegment}.log.gz`;
  };

  const getSolutionDownloadUrl = (row: BenchmarkResult) => {
    const urlPathSegment = `${row.runId}/${row.benchmark}-${row.size}-${row.solver}-${row.solverVersion}`;
    return `${BASE_STORAGE_URL}/solutions/${urlPathSegment}.sol.gz`;
  };

  const tableData: TableData[] = useMemo(
    () =>
      benchmarkResults.filter((result) => result.benchmark === benchmarkName),
    [benchmarkName],
  ).map((result) => ({
    solver: result.solver,
    solverVersion: result.solverVersion,
    status: result.status,
    terminationCondition: result.terminationCondition,
    runtime: result.runtime,
    memoryUsage: result.memoryUsage,
    objectiveValue: result.objectiveValue,
    maxIntegralityViolation: result.maxIntegralityViolation,
    dualityGap: result.dualityGap,
    log: getLogDownloadUrl(result),
    solution: getSolutionDownloadUrl(result),
    size: rawMetaData[benchmarkName as string].sizes.find(
      (size) => size.name === result.size,
    )?.size,
  }));

  const columns = useMemo(
    () => [
      {
        header: "Size",
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
        header: "Status",
        accessorKey: "status",
        filterFn: "equals" as const,
        size: 80,
      },
      {
        header: "Termination Condition",
        accessorKey: "terminationCondition",
        size: 200,
        cell: (info: CellContext<TableData, unknown>) => (
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
      },
      {
        header: "Log",
        accessorKey: "log",
        size: 105,
        cell: (info: CellContext<TableData, unknown>) => (
          <Link
            href={info.getValue() as string}
            className="text-white bg-green-pop p-2 py-1.5 rounded-lg text-sm"
          >
            Download Log
          </Link>
        ),
      },
      {
        header: "Solution",
        accessorKey: "solution",
        size: 135,
        cell: (info: CellContext<TableData, unknown>) => (
          <Link
            href={info.getValue() as string}
            className="text-white bg-navy p-2 py-1.5 rounded-lg text-sm"
          >
            Download Solution
          </Link>
        ),
      },
    ],
    [],
  );

  const columnVisibility = {
    maxIntegralityViolation: isMilp,
    dualityGap: isMilp,
  };

  const handleDownload = (filteredData: TableData[]) => {
    if (filteredData.length === 0) {
      alert("No data to download!");
      return;
    }

    const csvData = tableData.map((row) => {
      const orderedData = columns.reduce((acc, column) => {
        const key = column.accessorKey as keyof TableData;
        return {
          ...acc,
          [key]: row[key],
        };
      }, {} as TableData);

      return orderedData;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    console.log(csv, csvData);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${benchmarkName}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TanStackTable
      data={tableData}
      columns={columns}
      enableDownload
      enableColumnSelector
      onDownload={handleDownload}
      initialColumnVisibility={columnVisibility}
    />
  );
};

export default DataTable;
