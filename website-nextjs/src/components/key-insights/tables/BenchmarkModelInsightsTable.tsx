/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { ColumnDef } from "@tanstack/react-table";
import { MetaDataEntry } from "@/types/meta-data";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import InfoPopup from "@/components/common/InfoPopup";

interface IColumnTable extends MetaDataEntry {
  framework: string;
  problemClass: string;
  application: string;
  timeHorizon: string;
  milpFeatures: string;
  realistic: string;
  example: string[];
}

const BenchmarkModelInsightsTable = () => {
  const getBenchmarksetLink = (benchmark: string) => {
    return PATH_DASHBOARD.benchmarkSet.one.replace("{name}", benchmark);
  };

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "Framework",
        accessorKey: "framework",
        size: 180,
        enableColumnFilter: false,
        enableSorting: true,
        sortingFn: "alphanumeric",
        cell: (info) => (
          <div className="text-left">{String(info.getValue())}</div>
        ),
      },
      {
        header: "Problem Class",
        accessorKey: "problemClass",
        size: 230,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "Application",
        accessorKey: "application",
        enableColumnFilter: false,
        enableSorting: true,
        size: 100,
        cell: (info) => (
          <InfoPopup
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
                {info.getValue() as string}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
          >
            <div> {info.getValue() as string} </div>
          </InfoPopup>
        ),
      },
      {
        header: "Time Horizon",
        accessorKey: "timeHorizon",
        enableColumnFilter: false,
        enableSorting: true,
        size: 120,
      },
      {
        header: "MILP Features",
        accessorKey: "milpFeatures",
        enableColumnFilter: false,
        enableSorting: false,
        size: 120,
      },
      {
        header: "Realistic",
        accessorKey: "realistic",
        enableColumnFilter: false,
        enableSorting: false,
        size: 80,
      },
      {
        header: "Example",
        accessorKey: "example",
        enableColumnFilter: false,
        enableSorting: false,
        size: 300,
        cell: (info) => {
          const examples = info.getValue() as string[];

          return (
            <div className=" px-4 py-2 m-4 break-words">
              {examples.map((e) => (
                <div key={e} className="text-left text-ellipsis max-w-[300px]">
                  <Link
                    href={getBenchmarksetLink(e)}
                    className="font-bold 0 inline-block"
                    style={{
                      lineHeight: "1.5",
                    }}
                  >
                    {e}
                  </Link>
                </div>
              ))}
            </div>
          );
        },
      },
    ],
    [],
  );

  const tableData = [
    {
      framework: "GenX",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      timeHorizon: "Single Period",
      milpFeatures: "None",
      realistic: "Realistic",
      example: ["genx-elec_trex, genx-elec_trex_co2", "genx-elec_co2"],
    },
    {
      framework: "GenX",
      problemClass: "MILP",
      application: "Infrastructure & Capacity Expansion",
      timeHorizon: "Single Period",
      milpFeatures: "Unit commitment",
      realistic: "Realistic",
      example: ["genx-elec_trex_uc"],
    },
    {
      framework: "PyPSA",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      timeHorizon: "Single Period",
      milpFeatures: "None",
      realistic: "Realistic",
      example: ["pypsa-eur-sec", "pypsa-eur-elec-trex"],
    },
    {
      framework: "TEMOA",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      timeHorizon: "Multi Period",
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "temoa-US_9R_TS",
        "temoa-US_9R_TS_NDC",
        "temoa-US_9R_TS_NZ",
        "temoa-US_9R_TS_SP",
        "temoa-US_9R_TS_NZ_trunc_4periods",
      ],
    },
    {
      framework: "TIMES",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      timeHorizon: "Multi Period",
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "TIMES-GEO-global-base",
        "TIMES-GEO-global-netzero",
        "times-nz-kea",
      ],
    },
  ];

  return (
    <div className="my-4 mt-8 rounded-xl">
      <TanStackTable
        data={tableData}
        headerClassName="text-center text-navy p-2 cursor-pointer"
        columns={columns as any}
        showPagination={false}
      />
    </div>
  );
};

export default BenchmarkModelInsightsTable;
