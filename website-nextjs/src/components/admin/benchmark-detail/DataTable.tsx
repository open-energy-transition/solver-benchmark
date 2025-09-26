import React, { useMemo } from "react";
import Papa from "papaparse";
import { useSelector } from "react-redux";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { BenchmarkResult } from "@/types/benchmark";
import { IResultState } from "@/types/state";
import { CellContext } from "@tanstack/react-table";
import { ProblemClass } from "@/constants";
import Link from "next/link";
import { roundNumber } from "@/utils/number";
import { isNullorUndefined } from "@/utils/calculations";

type DataTableProps = {
  benchmarkName: string;
};

type TableData = {
  instance: string;
  size?: string;
  solver: string;
  solverVersion: string;
  status: string;
  terminationCondition: string;
  runtime: number;
  memoryUsage: number;
  objectiveValue: number | string;
  maxIntegralityViolation: number | string;
  dualityGap: number | string;
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
    return (
      benchmarkDetail && benchmarkDetail.problemClass === ProblemClass.MILP
    );
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
    instance: result.size,
    solver: result.solver,
    solverVersion: result.solverVersion,
    status: result.status,
    terminationCondition: result.terminationCondition,
    runtime: roundNumber(result.runtime, 2),
    memoryUsage: roundNumber(result.memoryUsage, 2),
    objectiveValue: isNullorUndefined(result.objectiveValue)
      ? ""
      : roundNumber(result.objectiveValue || 0, 2),
    maxIntegralityViolation: isNullorUndefined(result.maxIntegralityViolation)
      ? ""
      : roundNumber(result.maxIntegralityViolation || 0, 2),
    dualityGap: isNullorUndefined(result.dualityGap)
      ? ""
      : roundNumber(result.dualityGap || 0, 2),
    log: getLogDownloadUrl(result),
    solution: getSolutionDownloadUrl(result),
    size: rawMetaData[benchmarkName as string].sizes.find(
      (size) => size.name === result.size,
    )?.size,
  }));

  const columns = useMemo(
    () => [
      {
        header: "Instance",
        accessorKey: "instance",
        size: 100,
      },
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
        filterFn: "arrIncludesSome" as const,
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
        header: "Runtime (s)",
        accessorKey: "runtime",
        size: 100,
        cell: (info: CellContext<TableData, "runtime">) => (
          <div className="text-end">{String(info.getValue())}</div>
        ),
      },
      {
        header: "Memory (MB)",
        accessorKey: "memoryUsage",
        size: 100,
        cell: (info: CellContext<TableData, "memoryUsage">) => (
          <div className="text-end">{String(info.getValue())}</div>
        ),
      },
      {
        header: "Objective Value",
        accessorKey: "objectiveValue",
        size: 100,
        cell: (info: CellContext<TableData, "objectiveValue">) => (
          <div className="text-end">{String(info.getValue())}</div>
        ),
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
        cell: (info: CellContext<TableData, unknown>) => {
          const solver = info.row.original?.solver;
          if (solver === "gurobi") {
            return <></>;
          }
          return (
            <Link
              href={info.getValue() as string}
              className="text-white bg-green-pop p-2 py-1.5 rounded-lg text-sm"
            >
              Download Log
            </Link>
          );
        },
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
