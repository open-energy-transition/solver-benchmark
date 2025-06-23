/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { CellContext, ColumnDef } from "@tanstack/react-table";

interface IColumnTable {
  header: string;
  dcopf: string;
  genkX: string;
  powerModels: string;
  pypsa: string;
  sienna: string;
  temoa: string;
  times: string;
  tulipa: string;
  [key: string]: string;
}

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
  const renderHeader = (header: CellContext<IColumnTable, string>) => {
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

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "",
        accessorKey: "header",
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info: CellContext<IColumnTable, unknown>) =>
          renderHeader(info as CellContext<IColumnTable, string>),
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
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info: CellContext<IColumnTable, unknown>) =>
          renderModelData(info.getValue() as string | boolean),
      })),
    ],
    [],
  );

  const dataTable = [
    {
      header: "Problem Classes",
      DCOPF: "",
      GenX: "",
      PowerModels: "",
      PyPSA: "",
      Sienna: "",
      TEMOA: "",
      TIMES: "",
      Tulipa: "",
    },
    {
      header: "LP",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "true",
      TIMES: "true",
      Tulipa: "false",
    },
    {
      header: "MILP",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "true",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "true",
    },
    {
      header: "Applications",
      DCOPF: "",
      GenX: "",
      PowerModels: "",
      PyPSA: "",
      Sienna: "",
      TEMOA: "",
      TIMES: "",
      Tulipa: "",
    },

    {
      header: "DC Optimal Power Flow",
      DCOPF: "false",
      GenX: "true",
      PowerModels: "false",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "N.A",
      TIMES: "N.A",
      Tulipa: "false",
    },
    {
      header: "Resource Adequacy",
      DCOPF: "true",
      GenX: "false",
      PowerModels: "false",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "false",
    },
    {
      header: "Infrastructure & Capacity Expansion",
      DCOPF: "N.A",
      GenX: "true",
      PowerModels: "false",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "false",
    },
    {
      header: "Operational",
      DCOPF: "false",
      GenX: "false",
      PowerModels: "N.A",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "N.A",
      TIMES: "N.A",
      Tulipa: "false",
    },
    {
      header: "Steady-state Optimal Power Flow",
      DCOPF: "N.A",
      GenX: "false",
      PowerModels: "true",
      PyPSA: "false",
      Sienna: "N.A",
      TEMOA: "N.A",
      TIMES: "N.A",
      Tulipa: "N.A",
    },
    {
      header: "Production cost modelling",
      DCOPF: "false",
      GenX: "false",
      PowerModels: "N.A",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "false",
    },
    {
      header: "Time Horizons",
      DCOPF: "",
      GenX: "",
      PowerModels: "",
      PyPSA: "",
      Sienna: "",
      TEMOA: "",
      TIMES: "",
      Tulipa: "",
    },
    {
      header: "Single Period",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "true",
      TEMOA: "true",
      TIMES: "false",
      Tulipa: "true",
    },
    {
      header: "Multi Period",
      DCOPF: "false",
      GenX: "true",
      PowerModels: "false",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "true",
      TIMES: "true",
      Tulipa: "false",
    },
    {
      header: "MILP Features",
      DCOPF: "",
      GenX: "",
      PowerModels: "",
      PyPSA: "",
      Sienna: "",
      TEMOA: "",
      TIMES: "",
      Tulipa: "",
    },
    {
      header: "None",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "false",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "true",
      TIMES: "true",
      Tulipa: "false",
    },
    {
      header: "Unit commitment",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "true",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "true",
    },
    {
      header: "Piecewise fuel usage",
      DCOPF: "false",
      GenX: "true",
      PowerModels: "false",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "false",
    },
    {
      header: "Transmission switching",
      DCOPF: "false",
      GenX: "false",
      PowerModels: "true",
      PyPSA: "false",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "false",
    },
    {
      header: "Modularity",
      DCOPF: "false",
      GenX: "false",
      PowerModels: "false",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "false",
      TIMES: "false",
      Tulipa: "true",
    },
    {
      header: "Realistic",
      DCOPF: "",
      GenX: "",
      PowerModels: "",
      PyPSA: "",
      Sienna: "",
      TEMOA: "",
      TIMES: "",
      Tulipa: "",
    },
    {
      header: "Realistic",
      DCOPF: "true",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "false",
      TEMOA: "true",
      TIMES: "true",
      Tulipa: "true",
    },
    {
      header: "Other",
      DCOPF: "false",
      GenX: "true",
      PowerModels: "true",
      PyPSA: "true",
      Sienna: "true",
      TEMOA: "true",
      TIMES: "true",
      Tulipa: "false",
    },
  ];
  return (
    <div className="my-4 mt-8 rounded-xl">
      <TanStackTable
        data={dataTable}
        columns={columns as any}
        showPagination={false}
      />
    </div>
  );
};

export default BenchmarkModelCasesTable;
