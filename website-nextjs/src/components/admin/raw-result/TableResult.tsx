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
  Column,
} from "@tanstack/react-table"
import { BenchmarkResult } from "@/types/benchmark"
import FilterAutoComplete from "./FilterAutoComplete"
import Popup from "reactjs-popup"
import { Color } from "@/constants/color"
import { ArrowRightIcon, ArrowToRightIcon } from "@/assets/icons"
import Link from "next/link"

function Filter({ column }: { column: Column<any, unknown> }) {
  const { filterVariant } = (column.columnDef.meta as any) ?? {}

  const columnFilterValue = column.getFilterValue()

  const sortedUniqueValues = useMemo(
    () =>
      filterVariant === "range"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000),
    [column.getFacetedUniqueValues(), filterVariant]
  )

  return filterVariant === "range" ? (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0] !== undefined
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
          }`}
          className="w-24 border rounded px-2 h-8"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
          }`}
          className="w-24 border rounded px-2 h-8"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : filterVariant === "select" ? (
    <select
      onChange={(e) => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      <option value="">All</option>
      {sortedUniqueValues.map((value) => (
        <option value={value} key={value}>
          {value}
        </option>
      ))}
    </select>
  ) : (
    <>
      <FilterAutoComplete
        options={sortedUniqueValues.map((val) => ({
          value: val,
          label: val,
        }))}
        setFilterValue={column.setFilterValue}
        columnFilterValue={columnFilterValue as any[]}
        column={column as any}
      />
    </>
  )
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

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
        size: 200,
        cell: (info) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
                {info.getValue() as any}
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
        cell: (info) => info.getValue(),
      },
      {
        header: "Solver",
        accessorKey: "solver",
        filterFn: "arrIncludesSome",
        cell: (info) => info.getValue(),
      },
      {
        header: "Solver Version",
        accessorKey: "solverVersion",
        filterFn: "arrIncludesSome",
        cell: (info) => info.getValue(),
      },
      {
        header: "Solver Release Year",
        accessorKey: "solverReleaseYear",
        filterFn: "arrIncludesSome",
        cell: (info) => info.getValue(),
      },
      {
        header: "Status",
        accessorKey: "status",
        filterFn: "equals",
        cell: (info) => info.getValue(),
      },
      {
        header: "Termination Condition",
        accessorKey: "terminationCondition",
        cell: (info) => (
          <div className="w-[7.75rem] whitespace-nowrap overflow-hidden">
            {info.getValue() as string}
          </div>
        ),
      },

      {
        header: "Runtime",
        accessorKey: "runtime",
        meta: {
          filterVariant: "range",
        },
      },
      {
        header: "Memory",
        accessorKey: "memoryUsage",
        meta: {
          filterVariant: "range",
        },
      },
      {
        header: "Objective Value",
        accessorKey: "objectiveValue",
      },
      {
        header: "Max Integrality Violation",
        accessorKey: "maxIntegralityViolation",
      },
      {
        header: "Duality Gap",
        accessorKey: "dualityGap",
      },
    ],
    []
  )

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data: benchmarkResults,
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
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  })

  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const maxVisiblePages = 5
  // Generate the pagination range
  const getPaginationRange = () => {
    const range = []
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (startPage > 1) range.push(1)
    if (startPage > 2) range.push("...")

    for (let i = startPage; i <= endPage; i++) {
      range.push(i)
    }

    if (endPage < totalPages - 1) range.push("...")
    if (endPage < totalPages) range.push(totalPages)

    return range
  }

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
                    className="text-center text-navy py-4 px-6 cursor-pointer"
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
                    {header.column.getCanFilter() ? (
                      <div>
                        <Filter column={header.column} />
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="odd:bg-[#BFD8C71A] odd:bg-opacity-10">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="text-navy text-start py-4 px-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex text-xs items-center gap-2 mt-4 justify-between">
        <div className="text-dark-grey">
          Showing{" "}
          <span className="font-bold">
            {" "}
            {currentPage === totalPages
              ? benchmarkResults.length
              : table.getState().pagination.pageSize * currentPage}
          </span>{" "}
          of <span className="font-bold"> {benchmarkResults.length} </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button
              className={`flex gap-2 items-center rounded p-1 ${
                !table.getCanPreviousPage() ? " text-dark-grey" : " text-navy"
              }`}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ArrowRightIcon
                className={`h-3 w-3 rotate-180 ${
                  !table.getCanPreviousPage() ? "stroke-dark-grey" : ""
                }`}
                fill="none"
              />
              Previous
            </button>
            {/* Page Numbers */}
            {getPaginationRange().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  className={`border border-stroke rounded py-1 px-2.5 ${
                    page === currentPage
                      ? "bg-navy text-white"
                      : "text-dark-green"
                  }`}
                  onClick={() => table.setPageIndex(page - 1)}
                  disabled={page === currentPage}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="text-dark-grey">
                  ...
                </span>
              )
            )}
            <button
              className={`flex gap-2 items-center rounded p-1
                ${!table.getCanNextPage() ? " text-dark-grey" : " text-navy"}
                `}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ArrowRightIcon
                className={`h-3 w-3 rotate-145 ${
                  !table.getCanNextPage() ? "stroke-dark-grey" : "stroke-navy"
                }`}
                fill="none"
              />
            </button>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  )
}

export default TableResult
