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
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table"
import { getInstance } from "@/utils/meta-data"
import { MetaDataEntry } from "@/types/meta-data"

const InstancesTableResult = ({
  benchmarkName,
  benchmarkDetail,
}: {
  benchmarkName: string
  benchmarkDetail: MetaDataEntry
}) => {
  const columns = useMemo<
    ColumnDef<{
      instance: string
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
        header: "No. CONSTRAINTS",
        accessorKey: "nOfConstraints",
        cell: (info) => info.getValue(),
      },
    ],
    []
  )

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const tableData = useMemo(
    () =>
      benchmarkDetail.sizes.map((sizeData) => ({
        spatialResolution: sizeData.spatialResolution,
        temporalResolution: sizeData.temporalResolution,
        nOfVariables: sizeData.nOfVariables,
        nOfConstraints: sizeData.nOfConstraints,
        instance: getInstance(
          sizeData.temporalResolution.toString(),
          sizeData.spatialResolution.toString()
        ),
      })),
    [benchmarkDetail.sizes.length]
  )

  const table = useReactTable({
    data: tableData,
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
        Instances
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

export default InstancesTableResult
