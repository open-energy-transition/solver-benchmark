import React from "react"
import { ArrowRightIcon } from "@/assets/icons"
import { Table } from "@tanstack/react-table"

interface IPaginationTable<T> {
  table: Table<T>
}

const PaginationTable = <T,>({ table }: IPaginationTable<T>) => {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const maxVisiblePages = 5
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(startItem + pageSize - 1, totalItems)

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
    <div className="flex text-xs items-center gap-2 mt-4 justify-between">
      <div className="text-dark-grey">
        Showing <span className="font-bold">{startItem}</span> to{" "}
        <span className="font-bold">{endItem}</span> of{" "}
        <span className="font-bold">{totalItems}</span>
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
            className={`flex gap-2 items-center rounded p-1 ${
              !table.getCanNextPage() ? " text-dark-grey" : " text-navy"
            }`}
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
      <div />
    </div>
  )
}

export default PaginationTable
