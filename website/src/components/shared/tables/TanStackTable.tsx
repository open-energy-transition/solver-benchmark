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
  virtualizedHeight?: string; // Height of the scroll area when virtualized
  headerClassName?: string;
  rowClassName?: string;
  oddRowClassName?: string;
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
  virtualizedHeight = "525px",
  headerClassName = "text-center text-navy py-4 px-6 cursor-pointer",
  rowClassName = "tag-line-sm leading-1.4 text-navy text-start py-2 px-6 truncate",
  oddRowClassName = "odd:bg-[#BFD8C71A]",
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

  // Reference to the outermost element, used to measure the available width
  // so the table can stretch its columns to fill it (see tableWidth below).
  const rootRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
  const HEADER_HEIGHT = 48.8;

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

  // With table-layout:fixed, letting the browser stretch a table wider than
  // the sum of its own column widths (e.g. via a "w-full" class) causes it
  // to proportionally stretch the in-flow header cells to fill the gap,
  // while body cells inside virtualized (position:absolute) rows ignore
  // that redistribution, desyncing the two. Instead, we compute the target
  // width ourselves (the greater of the available container width or the
  // columns' own total) and scale every column's width by the same factor,
  // then apply that identical per-column width to both header and body.
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const baseTotalWidth = headers.reduce(
    (sum, header) => sum + header.getSize(),
    0,
  );
  const tableWidth = Math.max(800, containerWidth || 0, baseTotalWidth);
  const widthScale = baseTotalWidth > 0 ? tableWidth / baseTotalWidth : 1;
  const columnWidthById = new Map(
    headers.map((header) => [header.column.id, header.getSize() * widthScale]),
  );
  const getColumnWidth = (columnId: string) =>
    columnWidthById.get(columnId) ?? 150;

  return (
    <div className="w-full" ref={rootRef}>
      {(title || enableDownload || enableColumnSelector) && (
        <div
          className={`
          text-navy font-bold pb-4 pt-2 flex flex-col md:flex-row items-start sm:items-center gap-4
            ${title ? "justify-between" : "justify-end"}
          `}
        >
          {title && <div className="h6">{title}</div>}
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

      <div className="rounded-xl sm:mx-0 max-h-[50vh] sm:max-h-none overflow-auto">
        {/* Table implementation */}
        <div className="min-w-full align-middle">
          {/* Desktop / Tablet: table visible */}
          <div className="hidden sm:block">
            {showAllRows ? (
              // Virtualized table for large datasets
              <div
                ref={tableContainerRef}
                style={{
                  // Cap at virtualizedHeight, but shrink to fit when the
                  // (filtered) data is short enough not to need it.
                  height: `min(${virtualizedHeight}, ${
                    rowVirtualizer.getTotalSize() + HEADER_HEIGHT
                  }px)`,
                  overflow: "auto",
                  position: "relative",
                }}
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={tableLabel}
              >
                <table
                  className="bg-[#F4F6FA]"
                  style={{ tableLayout: "fixed", width: tableWidth }}
                >
                  {/* Virtualized rows are position:absolute (out of normal
                      flow), so table-layout:fixed can't infer column widths
                      from them. An explicit colgroup forces the browser to
                      use the same widths for header and body regardless. */}
                  <colgroup>
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                      <col
                        key={header.id}
                        style={{ width: getColumnWidth(header.column.id) }}
                      />
                    ))}
                  </colgroup>
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
                                width: getColumnWidth(header.column.id),
                                minWidth: getColumnWidth(header.column.id),
                                maxWidth: getColumnWidth(header.column.id),
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
                              ? `${oddRowClassName} !w-max`
                              : ""
                          }
                          style={{
                            position: "absolute",
                            top: HEADER_HEIGHT,
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
                                width: getColumnWidth(cell.column.id),
                                minWidth: getColumnWidth(cell.column.id),
                                maxWidth: getColumnWidth(cell.column.id),
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
                  className="bg-[#F4F6FA]"
                  style={{ tableLayout: "fixed", width: tableWidth }}
                >
                  <colgroup>
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                      <col
                        key={header.id}
                        style={{ width: getColumnWidth(header.column.id) }}
                      />
                    ))}
                  </colgroup>
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
                                width: getColumnWidth(header.column.id),
                                maxWidth: getColumnWidth(header.column.id),
                                minWidth: getColumnWidth(header.column.id),
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
                        <tr key={row.id} className={oddRowClassName}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              style={{
                                width: getColumnWidth(cell.column.id),
                                maxWidth: getColumnWidth(cell.column.id),
                                minWidth: getColumnWidth(cell.column.id),
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

          {/* Mobile: render as cards */}
          <div className="block sm:hidden p-2 space-y-3">
            {rows.slice(0, 500).map((row) => {
              const cells = row.getVisibleCells();
              const titleCell = cells[0];

              return (
                <div
                  key={row.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-navy font-extrabold tag-line-sm">
                      {titleCell
                        ? flexRender(
                            titleCell.column.columnDef.cell,
                            titleCell.getContext(),
                          )
                        : row.id}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-navy text-sm">
                    {cells.slice(1).map((cell) => (
                      <div key={cell.id}>
                        <div className="font-semibold">
                          {typeof cell.column.columnDef.header === "string"
                            ? cell.column.columnDef.header
                            : cell.column.id}
                        </div>
                        <div className="tag-line-sm mt-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
