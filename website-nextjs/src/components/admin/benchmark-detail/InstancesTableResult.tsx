import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  CellContext,
} from "@tanstack/react-table";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { ArrowToRightIcon } from "@/assets/icons";
import SortIcon from "@/components/shared/tables/SortIcon";

type RowData = {
  instance: string;
  spatialResolution: number;
  temporalResolution: string | number;
  nOfVariables: number | null;
  nOfConstraints: number;
  nOfContinuousVariables: number | null;
  nOfIntegerVariables: number | null;
  realistic: boolean;
  url: string;
};

const InstancesTableResult = ({
  benchmarkDetail,
}: {
  benchmarkDetail: MetaDataEntry;
}) => {
  const isMILP = useMemo(() => {
    return benchmarkDetail.problemClass === "MILP";
  }, [benchmarkDetail]);

  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    const baseColumns: ColumnDef<RowData>[] = [
      {
        header: "INSTANCE",
        accessorKey: "instance",
        size: 200,
        cell: (info: CellContext<RowData, unknown>) => info.getValue(),
      },
      {
        header: "SPATIAL RESOLUTION",
        accessorKey: "spatialResolution",
        cell: (info: CellContext<RowData, unknown>) => info.getValue(),
      },
      {
        header: "TEMPORAL RESOLUTION",
        accessorKey: "temporalResolution",
        cell: (info: CellContext<RowData, unknown>) => info.getValue(),
      },
      {
        header: "No. VARIABLES",
        accessorKey: "nOfVariables",
        cell: (info: CellContext<RowData, unknown>) => info.getValue(),
      },
      {
        header: "No. CONSTRAINTS",
        accessorKey: "nOfConstraints",
        cell: (info: CellContext<RowData, unknown>) => info.getValue(),
      },
    ];

    if (isMILP) {
      baseColumns.push(
        {
          header: "No. CONTINUOUS VARIABLES",
          accessorKey: "nOfContinuousVariables",
          cell: (info: CellContext<RowData, unknown>) => info.getValue(),
        },
        {
          header: "No. INTEGER VARIABLES",
          accessorKey: "nOfIntegerVariables",
          cell: (info: CellContext<RowData, unknown>) => info.getValue(),
        },
      );
    }

    baseColumns.push(
      {
        header: "REALISTIC",
        accessorKey: "realistic",
        cell: (info: CellContext<RowData, unknown>) => (
          <span
            className={`px-3 py-2 rounded-full text-sm ${
              info.getValue()
                ? "bg-navy text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {info.getValue() ? "Realistic" : "Other"}
          </span>
        ),
      },
      {
        header: "LP/MPS FILE",
        accessorKey: "url",
        enableSorting: false,
        cell: (info: CellContext<RowData, unknown>) => (
          <Link
            href={info.getValue() as string}
            className="text-white bg-green-pop px-6 py-3 rounded-lg flex gap-1 items-center w-max"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
            <ArrowToRightIcon className="w-4 h-4 rotate-90" />
          </Link>
        ),
      },
    );

    return baseColumns;
  }, [isMILP]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tableData = useMemo(
    () =>
      benchmarkDetail.sizes.map((sizeData) => ({
        spatialResolution: sizeData.spatialResolution,
        temporalResolution: sizeData.temporalResolution,
        nOfVariables: sizeData.numVariables,
        nOfConstraints: sizeData.numConstraints,
        nOfContinuousVariables: sizeData.numContinuousVariables,
        nOfIntegerVariables: sizeData.numIntegerVariables,
        instance: sizeData.name,
        url: sizeData.url,
        realistic: sizeData.realistic,
      })),
    [benchmarkDetail.sizes.length],
  );

  const table = useReactTable({
    data: tableData,
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
    manualPagination: false,
  });

  useEffect(() => {
    table.setPageSize(table.getPrePaginationRowModel().rows.length);
  }, [table.getPrePaginationRowModel().rows.length]);

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
                    <div
                      className="flex gap-2 items-center"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {/* Sort */}
                      <SortIcon
                        canSort={header.column.getCanSort()}
                        sortDirection={header.column.getIsSorted()}
                      />
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
  );
};

export default InstancesTableResult;
