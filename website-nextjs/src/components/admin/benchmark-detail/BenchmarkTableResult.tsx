import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import SortIcon from "@/components/shared/tables/SortIcon";
import { ArrowRightIcon } from "@/assets/icons";
import PaginationTable from "@/components/shared/tables/PaginationTable";
import { IFilterState } from "@/types/state";

interface IColumnTable extends MetaDataEntry {
  name: string;
}

interface BenchmarkTableResultProps {
  metaData: Record<string, MetaDataEntry>;
}

const BenchmarkTableResult: React.FC<BenchmarkTableResultProps> = ({
  metaData,
}) => {
  const availableProblemSizes = useSelector(
    (state: { filters: IFilterState }) => state.filters.problemSize,
  );

  const memoizedMetaData = useMemo(
    () =>
      Object.entries(metaData)
        .filter(([, value]) => {
          return value.sizes.some((v) =>
            availableProblemSizes.includes(v.size),
          );
        })
        .map(([key, value]) => ({
          ...value,
          name: key,
        })),
    [metaData],
  );

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "BENCHMARK NAME",
        accessorKey: "name",
        size: 200,
        enableSorting: true,
        cell: (info) => (
          <Popup
            on={["hover"]}
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
                {info.getValue() as string}
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
        enableSorting: false,
        cell: (info) => (
          <Link
            className="hover:text-white hover:bg-green-pop text-green-pop border border-green-pop border-opacity-80 rounded-lg py-2 px-4 flex w-max items-center"
            href={PATH_DASHBOARD.benchmarkDetail.one.replace(
              "{name}",
              info.row.original.name,
            )}
          >
            View Details
            <ArrowRightIcon
              className="w-3 h-3 text-navy fill-none stroke-green-pop hover:stroke-white"
              strokeOpacity="0.5"
            />
          </Link>
        ),
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: memoizedMetaData,
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
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

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
      {/* Pagination */}
      <PaginationTable<IColumnTable> table={table} />
    </div>
  );
};

export default BenchmarkTableResult;
