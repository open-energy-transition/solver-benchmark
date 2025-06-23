/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import {
  benchmarkModelCasesData,
  IBenchmarkModelCases,
} from "@/data/benchmarkModelCasesData";

const BenchmarkModelCasesTable = () => {
  const renderModelData = (model: string | boolean) => {
    switch (model) {
      case "true":
        return (
          <div className="flex justify-center">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "false":
        return <div className="flex justify-center">✕</div>;
      case "N.A":
        return <div className="flex justify-center">N.A</div>;
      case "":
        return <div className="flex justify-center"></div>;
      default:
        return <div className="flex justify-center">{String(model)}</div>;
    }
  };
  const renderHeader = (header: CellContext<IBenchmarkModelCases, string>) => {
    const isMain = Object.keys(header.row.original)
      .filter((key) => key !== "header")
      .every((key) => {
        return header.row.original[key] === "";
      });
    return (
      <div className={`text-left ${isMain ? "font-bold" : ""}`}>
        {header.getValue()}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<IBenchmarkModelCases>[]>(
    () => [
      {
        header: "",
        accessorKey: "header",
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info: CellContext<IBenchmarkModelCases, unknown>) =>
          renderHeader(info as CellContext<IBenchmarkModelCases, string>),
      },
      ...[
        "DCOPF",
        "GenX",
        "PowerModels",
        "PyPSA",
        "Sienna",
        "TEMOA",
        "TIMES",
        "Tulipa",
      ].map((framework) => ({
        header: framework,
        accessorKey: framework,
        size: 50,
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info: CellContext<IBenchmarkModelCases, unknown>) =>
          renderModelData(info.getValue() as string | boolean),
      })),
    ],
    [],
  );

  return (
    <div className="my-4 mt-8 rounded-xl">
      <TanStackTable
        data={benchmarkModelCasesData}
        headerClassName="text-center text-navy p-2 cursor-pointer"
        columns={columns as any}
        showPagination={false}
      />
    </div>
  );
};

export default BenchmarkModelCasesTable;
