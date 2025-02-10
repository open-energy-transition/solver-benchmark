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
import Popup from "reactjs-popup"
import { Color } from "@/constants/color"
import { ResultState } from "@/redux/results/reducer"
import { MetaData, MetaDataEntry, Size } from "@/types/meta-data"
import { KindOfProblem, Model, Sector, Technique } from "@/constants"
import Link from "next/link"
import { PATH, PATH_DASHBOARD } from "@/constants/path"
import { ArrowIcon, ArrowRightIcon, SortVerticalIcon } from "@/assets/icons"
import PaginationTable from "@/components/shared/tables/PaginationTable"

interface IColumnTable extends MetaDataEntry {
  name: string
}

const BenchmarkTableResult = () => {
  const metaData = useSelector((state: { results: ResultState }) => {
    return state.results.metaData
  })

  const memoizedMetaData = useMemo(
    () =>
      Object.entries(metaData).map(([key, value]) => ({
        ...value,
        name: key,
      })),
    [metaData]
  )

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "BENCHMARK NAME",
        accessorKey: "name",
        size: 200,
        enableSorting: false,
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
        header: "MODEL NAME",
        accessorKey: "modelName",
        cell: (info) => info.getValue(),
      },
      {
        header: "TECHNIQUE",
        accessorKey: "technique",
        cell: (info) => info.getValue(),
      },
      {
        header: "PROBLEM KIND",
        accessorKey: "kindOfProblem",
        cell: (info) => info.getValue(),
      },
      {
        header: "SECTORS",
        accessorKey: "sectors",
        cell: (info) => info.getValue(),
      },
      {
        header: "DETAILS",
        accessorKey: "details",
        cell: (info) => (
          <Link
            className="hover:text-white hover:bg-green-pop text-green-pop border border-green-pop border-opacity-80 rounded-lg py-2 px-4 flex w-max items-center"
            href={PATH_DASHBOARD.benchmarkDetail.one.replace(
              "{name}",
              info.row.original.name
            )}
          >
            View Details
            <ArrowRightIcon
              className="w-3 h-3 text-navy fill-none stroke-green-pop hover:stroke-white"
              stroke-opacity="0.5"
            />
          </Link>
        ),
      },
    ],
    []
  )

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data: memoizedMetaData,
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

  return (
    <div className="py-2">
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
                    <div
                      className="flex gap-2 items-center"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() &&
                      !header.column.getIsSorted() ? (
                        <div>
                          <SortVerticalIcon
                            fill="none"
                            className="stroke-dark-green"
                          />
                        </div>
                      ) : (
                        ""
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
      {/* Pagination */}
      <PaginationTable<IColumnTable> table={table} />
    </div>
  )
}

export default BenchmarkTableResult
