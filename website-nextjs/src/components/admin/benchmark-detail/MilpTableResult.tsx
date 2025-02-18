/* eslint-disable */
/* eslint-disable @typescript-eslint/* */

import React, { useEffect, useMemo, useState } from "react"
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
} from "@tanstack/react-table"
import { IResultState } from "@/types/state"

const MilpTableResult = ({ benchmarkName }: { benchmarkName: string }) => {
  const columns = useMemo<
    ColumnDef<{
      solver: string
      size: string
      maxIntegrailty: string | null
      dualityFap: string | null
    }>[]
  >(
    () => [
      {
        header: "SOLVER",
        accessorKey: "solver",
        size: 200,
        cell: (info) => info.getValue(),
      },
      {
        header: "SIZE",
        accessorKey: "size",
        cell: (info) => info.getValue(),
      },
      {
        header: "MAX INTEGRAILTY",
        accessorKey: "maxIntegrailty",
        cell: (info) => info.getValue(),
      },
      {
        header: "DUALITY GAP",
        accessorKey: "dualityFap",
        cell: (info) => info.getValue(),
      },
    ],
    []
  )

  const benchmarkResults = useSelector((state: { results: IResultState }) => {
    return state.results.benchmarkLatestResults
  })

  const curBenchmarkResult = useMemo(
    () =>
      benchmarkResults
        .filter((resulst) => resulst.benchmark === benchmarkName)
        .map((benchmark) => ({
          solver: benchmark.solver,
          size: benchmark.size,
          maxIntegrailty: benchmark.maxIntegralityViolation,
          dualityFap: benchmark.dualityGap,
        })),
    [benchmarkResults.length]
  )

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data: curBenchmarkResult,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting as any,
    onColumnFiltersChange: setColumnFilters as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: false,
  })

  useEffect(() => {
    table.setPageSize(table.getPrePaginationRowModel().rows.length)
  }, [table.getPrePaginationRowModel().rows.length])

  return (
    <div className="py-2">
      <div className="text-back text-2xl font-medium mb-7 mt-2 font-league pl-1.5">
        MILP Features
      </div>
      <div className="rounded-xl max-h-[280px] overflow-auto">
        <table className="table-auto bg-white w-full">
          <thead className="sticky top-0 bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-start text-navy py-4 px-6 cursor-pointer"
                  >
                    <div onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
                  <td key={cell.id} className="text-navy text-start py-2 px-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MilpTableResult
