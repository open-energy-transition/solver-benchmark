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
import { ArrowToRightIcon, QuestionLineIcon } from "@/assets/icons";
import SortIcon from "@/components/shared/tables/SortIcon";
import InfoPopup from "@/components/common/InfoPopup";

type RowData = {
  instance: string;
  spatialResolution: number;
  temporalResolution: string | number;
  nOfVariables: number | null;
  nOfConstraints: number;
  nOfContinuousVariables: number | null;
  nOfIntegerVariables: number | null;
  realistic: boolean;
  realisticMotivation?: string | undefined;
  url: string;
};

const RealisticTooltip = ({
  isRealistic,
  motivation,
}: {
  isRealistic: boolean;
  motivation?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (isRealistic && motivation && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const tooltipWidth = Math.min(320, viewportWidth - 32);
      const tooltipHeight = 100;

      let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;

      if (left < 16) left = 16;
      if (left + tooltipWidth > viewportWidth - 16)
        left = viewportWidth - tooltipWidth - 16;

      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;

      let top: number;

      if (spaceAbove >= tooltipHeight + 10 || spaceAbove > spaceBelow) {
        top = triggerRect.top - tooltipHeight - 10;
      } else {
        top = triggerRect.bottom + 10;
      }

      setTooltipStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        maxWidth: `${tooltipWidth}px`,
        zIndex: 9999,
      });

      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`px-3 py-2 rounded-full text-sm cursor-default ${
          isRealistic ? "bg-navy text-white" : "bg-gray-100 text-gray-800"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isRealistic ? "Realistic" : "Other"}
      </span>

      {showTooltip && isRealistic && motivation && (
        <div
          style={tooltipStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 whitespace-normal shadow-xl border border-gray-700">
            <div className="font-semibold mb-2 text-gray-200">
              Realistic Motivation:
            </div>
            <div className="leading-relaxed">{motivation}</div>
          </div>
        </div>
      )}
    </>
  );
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
        header: () => (
          <div className="flex items-center gap-1">
            <span>REALISTIC</span>
            <InfoPopup
              trigger={() => (
                <span className="flex items-baseline my-auto cursor-pointer">
                  <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
                </span>
              )}
              position="right center"
              closeOnDocumentClick
              arrow={false}
            >
              <div>
                Benchmark instances are marked as realistic if they come from a
                model that was used, or is similar to a model used in an actual
                energy modelling study. Please note that this is a rather
                subjective and modelling framework-dependent definition, but is
                still useful when estimating solver performance on real-world
                energy models.
              </div>
            </InfoPopup>
          </div>
        ),
        accessorKey: "realistic",
        cell: (info: CellContext<RowData, unknown>) => {
          const rowData = info.row.original;
          return (
            <RealisticTooltip
              isRealistic={rowData.realistic}
              motivation={rowData.realisticMotivation}
            />
          );
        },
      },
      {
        header: "LP/MPS FILE",
        accessorKey: "url",
        enableSorting: false,
        cell: (info: CellContext<RowData, unknown>) => (
          <Link
            href={info.getValue() as string}
            className="text-white bg-green-pop rounded-lg flex gap-1 items-center w-max px-4 py-2"
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
        realisticMotivation: sizeData.realisticMotivation,
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
      <h5 className="font-medium mb-2 mt-2 font-league pl-1.5">Instances</h5>
      <div className="text-navy px-2 lg:px-5 text-l block items-center mt-2 mb-2">
        A benchmark may have multiple size instances, obtained by varying
        parameters such as the spatial or temporal resolution, but which utilize
        the same model features and are presumed to have the same optimization
        problem structure.
      </div>
      <div className="text-navy px-2 lg:px-5 text-l block items-center mt-2 mb-2">
        We categorize a benchmark instance as realistic if it comes from a model
        that was used, or is similar to a model used in an actual energy
        modelling study. Hover over the &ldquo;Realistic&rdquo; button in any
        row to see the justification for why the instance was classified as
        realistic.
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
                      className="flex gap-2 items-center tag-line-xs font-extrabold"
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
                  <td
                    key={cell.id}
                    className="text-navy text-start py-2 px-6 tag-line-sm"
                  >
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
