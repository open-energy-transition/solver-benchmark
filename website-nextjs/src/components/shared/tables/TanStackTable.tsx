import React, { useState } from "react";
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
import { ArrowToRightIcon } from "@/assets/icons";
import FilterTable from "./FilterTable";
import PaginationTable from "./PaginationTable";
import SortIcon from "./SortIcon";

interface TanStackTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  downloadTitle?: string;
  enableDownload?: boolean;
  onDownload?: (filteredData: T[]) => void;
  enableColumnSelector?: boolean;
  initialColumnVisibility?: VisibilityState;
}

export function TanStackTable<T>({
  data,
  columns,
  title = "",
  downloadTitle = "",
  enableDownload = false,
  onDownload,
  enableColumnSelector = false,
  initialColumnVisibility = {},
}: TanStackTableProps<T>) {
  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility,
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const table = useReactTable({
    data,
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
  });

  const handleDownload = () => {
    if (onDownload) {
      const filteredRows = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);
      onDownload(filteredRows);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {(title || enableDownload || enableColumnSelector) && (
        <div
          className={`
          text-navy font-bold pb-4 pt-2 flex flex-col md:flex-row items-start sm:items-center gap-4
            ${title ? "justify-between" : "justify-end"}
          `}
        >
          {title && <h6>{title}</h6>}
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {enableColumnSelector && (
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="text-white bg-green-pop px-4 py-2 rounded-lg cursor-pointer w-full sm:w-auto tag-line-xs"
              >
                Select Columns
              </button>
            )}
            {enableDownload && onDownload && (
              <button
                onClick={handleDownload}
                className="text-white bg-navy px-4 py-2 rounded-lg flex gap-1 items-center justify-center cursor-pointer w-full sm:w-auto tag-line-xs"
              >
                {downloadTitle || "Download"}
                <ArrowToRightIcon className="w-4 h-4 rotate-90" />
              </button>
            )}
          </div>
        </div>
      )}

      {showColumnSelector && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="font-bold mb-2">Select columns to display:</div>
          <div className="flex flex-wrap gap-3">
            {table.getAllColumns().map((column) => (
              <div key={column.id} className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="form-checkbox w-4 h-4 accent-navy rounded"
                  />
                  <span className="ml-2 text-sm">
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-auto -mx-4 sm:mx-0">
        {/* Table implementation */}
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-x-auto">
            <table className="table-auto bg-[#F4F6FA] w-full min-w-[800px]">
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
                          className="tag-line-xs leading-1.4 font-extrabold flex gap-1 items-center justify-between w-full max-w-[200px] mx-auto truncate"
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
                            {header.column.getCanFilter() && (
                              <FilterTable column={header.column} />
                            )}
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
                        className="tag-line-sm leading-1.4 text-navy text-start py-2 px-6 truncate"
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
      <div className="mt-4">
        <PaginationTable table={table} />
      </div>
    </div>
  );
}
