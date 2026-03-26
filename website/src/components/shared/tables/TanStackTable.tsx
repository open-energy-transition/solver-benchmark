/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useId } from "react";
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
import { useVirtualizer } from "@tanstack/react-virtual";
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
  showPagination?: boolean;
  showAllRows?: boolean; // Enable virtualization for large datasets
  headerClassName?: string;
  rowClassName?: string;
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
  showPagination = true,
  showAllRows = false,
  headerClassName = "text-center text-navy py-4 px-6 cursor-pointer",
  rowClassName = "tag-line-sm leading-1.4 text-navy text-start py-2 px-6 truncate",
}: TanStackTableProps<T>) {
  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility,
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Generate a unique ID for this table instance
  const tableId = useId();
  const tableLabel = title || `Data table ${tableId}`;

  // Reference for the container that holds the table for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
    ...(showPagination && !showAllRows
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
  });

  // Set up virtualization for large datasets when showAllRows is enabled
  const { rows } = table.getRowModel();

  // Set up the virtualizer with dynamic row height measurement
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36, // Estimated row height
    overscan: 20,
    enabled: showAllRows,
  });

  // Re-render virtualizer on window resize to ensure correct calculations
  useEffect(() => {
    const handleResize = () => {
      if (showAllRows) {
        rowVirtualizer.measure();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rowVirtualizer, showAllRows]);

  const handleDownload = () => {
    if (onDownload) {
      const filteredRows = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);
      onDownload(filteredRows);
    }
  };

  return (
    <div className="w-full">
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
                <ArrowToRightIcon
                  className="w-4 h-4 rotate-90"
                  aria-hidden="true"
                />
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

      <div className="rounded-xl sm:mx-0 overflow-auto">
        {/* Table implementation */}
        <div className="min-w-full align-middle">
          {showAllRows ? (
            // Virtualized table for large datasets
            <div
              ref={tableContainerRef}
              style={{
                height: data?.length > 12 ? "525px" : "auto",
                overflow: "auto",
                position: "relative",
              }}
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={tableLabel}
            >
              <table
                className="bg-[#F4F6FA] w-full min-w-[800px]"
                style={{ tableLayout: "fixed" }}
              >
                <thead className="sticky top-0 bg-[#F4F6FA] shadow-sm z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const headerContent = flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        );
                        const hasContent =
                          headerContent && String(headerContent).trim();

                        return (
                          <th
                            key={header.id}
                            colSpan={header.colSpan}
                            className={headerClassName}
                            style={{
                              width: header.getSize() ? header.getSize() : 200,
                              minWidth: header.getSize()
                                ? header.getSize()
                                : 200,
                              maxWidth: header.getSize()
                                ? header.getSize()
                                : 200,
                            }}
                            aria-label={
                              !hasContent ? "Column actions" : undefined
                            }
                          >
                            <div
                              onClick={header.column.getToggleSortingHandler()}
                              className="tag-line-xs leading-1.4 font-extrabold flex gap-1 items-center justify-between w-full"
                            >
                              <div
                                className={`${
                                  (header.column.columnDef.meta as any)
                                    ?.headerClassName || "truncate"
                                } w-full`}
                              >
                                {headerContent}
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
                        );
                      })}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {/* Spacer row for total scroll height */}
                  <tr>
                    <td
                      colSpan={table.getAllColumns().length}
                      style={{ height: 0 }}
                    >
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                        }}
                      />
                    </td>
                  </tr>

                  {/* Virtualized rows */}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        data-index={virtualRow.index}
                        className={
                          virtualRow.index % 2
                            ? "bg-[#BFD8C71A] bg-opacity-10 !w-max"
                            : ""
                        }
                        style={{
                          position: "absolute",
                          top: 48.8,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{
                              width: cell.column.getSize()
                                ? cell.column.getSize()
                                : 200,
                              minWidth: cell.column.getSize()
                                ? cell.column.getSize()
                                : 200,
                              maxWidth: cell.column.getSize()
                                ? cell.column.getSize()
                                : 200,
                            }}
                            className={rowClassName}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Standard table for smaller datasets or paginated view
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={tableLabel}
            >
              <table
                className="bg-[#F4F6FA] w-full min-w-[800px]"
                style={{ tableLayout: "fixed" }}
              >
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const headerContent = flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        );
                        const hasContent =
                          headerContent && String(headerContent).trim();

                        return (
                          <th
                            key={header.id}
                            colSpan={header.colSpan}
                            className={headerClassName}
                            style={{
                              width: header.getSize(),
                              maxWidth: header.getSize()
                                ? header.getSize()
                                : 200,
                              minWidth: header.getSize()
                                ? header.getSize()
                                : 150,
                            }}
                            aria-label={
                              !hasContent ? "Column actions" : undefined
                            }
                          >
                            <div
                              onClick={header.column.getToggleSortingHandler()}
                              className="tag-line-xs leading-1.4 font-extrabold flex gap-1 items-center justify-between w-full truncate"
                            >
                              <div
                                className={`${
                                  (header.column.columnDef.meta as any)
                                    ?.headerClassName || "truncate"
                                } w-full`}
                              >
                                {headerContent}
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
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table
                    .getRowModel()
                    .rows.slice(0, 500)
                    .map((row) => (
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
                              minWidth: cell.column.getSize()
                                ? cell.column.getSize()
                                : 150,
                            }}
                            className={rowClassName}
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
          )}
        </div>
      </div>
      {showPagination && !showAllRows && (
        <div className="mt-4">
          <PaginationTable table={table} />
        </div>
      )}
    </div>
  );
}
