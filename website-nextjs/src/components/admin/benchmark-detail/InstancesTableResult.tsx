/* eslint-disable */
/* eslint-disable @typescript-eslint/* */

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
} from "@tanstack/react-table"
import { ResultState } from "@/redux/results/reducer"
import { getInstance } from "@/utils/meta-data"

const InstancesTableResult = ({ benchmarkName }: { benchmarkName: string }) => {
  const metaData = useSelector((state: { results: ResultState }) => {
    return state.results.metaData
  })

  const benchmarkDetail = useMemo(
    () => metaData[benchmarkName as string],
    [metaData]
  )

  if (!benchmarkDetail) return <div>Not found</div>

  const columns = useMemo<
    ColumnDef<{
      instance: string,
      spatialResolution: number
      temporalResolution: string | number
      nOfVariables: number | null
      nOfConstraints: number
    }>[]
  >(
    () => [
      {
        header: "INSTANCE",
        accessorKey: "instance",
        size: 200,
        cell: (info) => info.getValue(),
      },
      {
        header: "SPATIAL RESOLUTION",
        accessorKey: "spatialResolution",
        cell: (info) => info.getValue(),
      },
      {
        header: "TEMPORAL RESOLUTION",
        accessorKey: "temporalResolution",
        cell: (info) => info.getValue(),
      },
      {
        header: "No. VARIABLES",
        accessorKey: "nOfVariables",
        cell: (info) => info.getValue(),
      },
      {
        header: "No. CONSTRAINS",
        accessorKey: "nOfConstraints",
        cell: (info) => info.getValue(),
      },
    ],
    []
  )

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data: benchmarkDetail.sizes.map((sizeData) => ({
      spatialResolution: sizeData.spatialResolution,
      temporalResolution: sizeData.temporalResolution,
      nOfVariables: sizeData.nOfVariables,
      nOfConstraints: sizeData.nOfConstraints,
      instance: getInstance(
        sizeData.temporalResolution.toString(),
        sizeData.spatialResolution.toString()
      ),
    })),
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

  return (
    <div className="py-2">
      <div className="text-back text-2xl font-medium mb-7 mt-2 font-league">Instances</div>
      <div className="rounded-xl overflow-auto">
        <table className="table-auto bg-white w-full">
          <thead>
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
      <div className="flex items-center gap-2 mt-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default InstancesTableResult
