import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

import { useSelector } from "react-redux";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  useReactTable,
  ColumnSort,
  ColumnFilter,
  VisibilityState,
} from "@tanstack/react-table";
import { BenchmarkResult, OriginBenchmarkResult } from "@/types/benchmark";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import { ArrowToRightIcon } from "@/assets/icons";
import FilterTable from "@/components/shared/tables/FilterTable";
import PaginationTable from "@/components/shared/tables/PaginationTable";
import DownloadButton from "@/components/shared/buttons/DownloadButton";
import { IResultState } from "@/types/state";
import SortIcon from "@/components/shared/tables/SortIcon";

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
        filterFn: "arrIncludesSome",
        cell: (info) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden 4xl:text-lg">
                {info.getValue() as string}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div className="bg-stroke p-2 rounded">
              {" "}
              {info.getValue() as string}{" "}
            </div>
          </Popup>
        ),
      },
      {
        header: "Instance",
        accessorKey: "size",
        filterFn: "arrIncludesSome",
        size: 70,
      },
      {
        header: "Solver",
        accessorKey: "solver",
        filterFn: "arrIncludesSome",
        size: 50,
      },
      {
        header: "Solver Version",
        accessorKey: "solverVersion",
        size: 130,
        filterFn: "arrIncludesSome",
      },
      {
        header: "Solver Release Year",
        accessorKey: "solverReleaseYear",
        size: 170,
        filterFn: "arrIncludesSome",
      },
      {
        header: "Status",
        accessorKey: "status",
        filterFn: "equals",
        size: 50,
      },
      {
        header: "Termination Condition",
        accessorKey: "terminationCondition",
        size: 200,
        cell: (info) => (
          <div className="w-[7.75rem] whitespace-nowrap overflow-hidden">
            {info.getValue() as string}
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
        cell: (info) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden 4xl:text-lg">
                {info.getValue() as string}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div className="bg-stroke p-2 rounded">
              {" "}
              {info.getValue() as string}{" "}
            </div>
          </Popup>
        ),
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const table = useReactTable({
    data: benchmarkResults,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });
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

  // Convert filtered data to CSV and download
  const downloadFilteredResults = () => {
    const filteredRows = table
      .getFilteredRowModel()
      .rows.map((row) => row.original);
    if (filteredRows.length === 0) {
      alert("No data to download!");
      return;
    }

    const csvData = originalData.filter((data) =>
      filteredRows.find(
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
    <div className="w-full max-w-full overflow-hidden">
      <div className="text-navy font-bold pb-6 pt-9 flex flex-col md:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl 4xl:text-2xl">Full Results</h2>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="text-white bg-navy px-4 sm:px-6 py-2 sm:py-3 rounded-lg cursor-pointer w-full sm:w-auto text-sm sm:text-base 4xl:text-lg"
          >
            Select Columns
          </button>
          <button
            onClick={downloadFilteredResults}
            className="text-white bg-navy px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex gap-1 items-center justify-center cursor-pointer w-full sm:w-auto text-sm sm:text-base 4xl:text-lg"
          >
            Download Filtered
            <ArrowToRightIcon className="w-4 h-4 rotate-90" />
          </button>
          <DownloadButton url={CSV_URL} fileName={"benchmark_results.csv"}>
            <div className="text-white bg-green-pop px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex gap-1 items-center justify-center cursor-pointer w-full sm:w-auto text-sm sm:text-base 4xl:text-lg">
              Download
              <ArrowToRightIcon className="w-4 h-4 rotate-90" />
            </div>
          </DownloadButton>
        </div>
      </div>

      {showColumnSelector && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="font-bold mb-2">Select columns to display:</div>
          <div className="flex flex-wrap gap-3">
            {table.getAllColumns().map((column) => {
              return (
                <div key={column.id} className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="form-checkbox w-4 h-4 accent-navy rounded"
                    />
                    <span className="ml-2 text-sm">{column.id}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-x-auto">
            <table className="table-auto bg-white w-full min-w-[800px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="text-center text-navy py-4 px-6 cursor-pointer"
                      >
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex gap-1 items-center justify-between w-full max-w-[200px] mx-auto truncate 4xl:text-lg"
                          style={{
                            width: header.getSize() + 10,
                            maxWidth: header.getSize()
                              ? header.getSize() + 10
                              : 200,
                          }}
                        >
                          <div className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {/* Filter */}
                            {header.column.getCanFilter() ? (
                              <FilterTable column={header.column} />
                            ) : null}
                            {/* Sort */}
                            <SortIcon
                              sortDirection={header.column.getIsSorted()}
                              canSort={header.column.getCanSort()}
                            />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          maxWidth: cell.column.getSize()
                            ? cell.column.getSize()
                            : 200,
                        }}
                        className="text-navy text-start py-2 px-6 truncate"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Pagination */}
      <div className="mt-4">
        <PaginationTable<BenchmarkResult> table={table} />
      </div>
    </div>
  );
};

export default TableResult;
