import React, { useMemo, useState } from "react"
import { useSelector } from "react-redux"
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
} from "@tanstack/react-table"
import { BenchmarkResult } from "@/types/benchmark"
import Popup from "reactjs-popup"
import { Color } from "@/constants/color"
import { ArrowToRightIcon } from "@/assets/icons"
import Link from "next/link"
import FilterTable from "@/components/shared/tables/FilterTable"
import PaginationTable from "@/components/shared/tables/PaginationTable"

const TableResult = () => {
  const benchmarkResults = useSelector(
    (state: { results: { rawBenchmarkResults: BenchmarkResult[] } }) => {
      return state.results.rawBenchmarkResults
    }
  )

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
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
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
        // meta: {
        //   filterVariant: "range",
        // },
      },
      {
        header: "Memory",
        accessorKey: "memoryUsage",
        // meta: {
        //   filterVariant: "range",
        // },
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
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
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
    []
  )

  const [sorting, setSorting] = useState<ColumnSort[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])

  const table = useReactTable({
    data: benchmarkResults,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  })

  return (
    <div>
      <div className="text-navy font-bold pb-6 pt-9 flex justify-between items-center">
        Full Results
        <Link
          href="https://github.com/open-energy-transition/solver-benchmark/blob/main/results/benchmark_results.csv"
          className="text-white bg-green-pop px-6 py-3 rounded-lg flex gap-1 items-center"
        >
          Download
          <ArrowToRightIcon className="w-4 h-4 rotate-90" />
        </Link>
      </div>

      <div className="rounded-xl overflow-auto">
        <table className="table-auto bg-white w-full">
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
                      className="flex gap-1"
                      style={{
                        width: header.getSize() + 10,
                      }}
                    >
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                      {/* Filter */}
                      {header.column.getCanFilter() ? (
                        <FilterTable column={header.column} />
                      ) : null}
                      {/* Sort */}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                        ? " ↓"
                        : ""}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="odd:bg-[#BFD8C71A] odd:bg-opacity-10">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    {...{
                      style: {
                        width: cell.column.getSize(),
                      },
                    }}
                    className="text-navy text-start py-2 px-6"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <PaginationTable<BenchmarkResult> table={table} />
    </div>
  )
}

export default TableResult
