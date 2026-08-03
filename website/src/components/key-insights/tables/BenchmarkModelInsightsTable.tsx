/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { ColumnDef } from "@tanstack/react-table";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import InfoPopup from "@/components/common/InfoPopup";

// This table shows static illustrative example data, not the live metadata
// pipeline, so it doesn't need to share MetaDataEntry's shape (which now
// has array-typed `milpFeatures` and boolean `realistic`, incompatible with
// the plain-string demo values used here).
interface IColumnTable {
  framework: string;
  problemClass: string;
  application: string;
  timeHorizon: string;
  milpFeatures: string;
  realistic: string;
  example: string[];
}

const BenchmarkModelInsightsTable = () => {
  const getProblemLink = (problemId: string) => {
    return PATH_DASHBOARD.benchmarkSet.one.replace("{name}", problemId);
  };

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "Framework",
        accessorKey: "framework",
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        sortingFn: "alphanumeric",
        cell: (info) => (
          <div className="text-left">{String(info.getValue())}</div>
        ),
      },
      {
        header: "Problem Class",
        accessorKey: "problemClass",
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "Application",
        accessorKey: "application",
        enableColumnFilter: false,
        enableSorting: false,
        size: 280,
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
        size: 120,
        cell: (info) => (
          <div className="text-left">
            {String(info.getValue()) === "Realistic" ? "Yes" : "No"}
          </div>
        ),
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
            <div className="break-words">
              {examples.map((e) => (
                <div key={e} className="text-left text-ellipsis max-w-[300px]">
                  <Link
                    href={getProblemLink(e)}
                    className="font-bold 0 inline-block"
                    style={{
                      lineHeight: "1.5",
                    }}
                    aira-label={`Navigate to problem detail page for ${e} model`}
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
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "genx-elec_trex-15-168h",
        "genx-elec_trex_co2-15-168h",
        "genx-elec_co2-15-168h",
      ],
    },
    {
      framework: "GenX",
      problemClass: "MILP",
      application: "Infrastructure & Capacity Expansion",
      milpFeatures: "Unit commitment",
      realistic: "Realistic",
      example: ["genx-elec_trex_uc-15-24h"],
    },
    {
      framework: "PyPSA",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "pypsa-eur-elec-50-3h",
        "pypsa-eur-elec-trex_vopt-50-168h",
        "pypsa-eur-elec-trex_copt-50-168h",
        "pypsa-eur-elec-uc-50-1h",
        "pypsa-eur-sec-50-24h",
      ],
    },
    {
      framework: "TEMOA",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "temoa-US_9R_TS-9-12ts",
        "temoa-US_9R_TS_NDC-9-12ts",
        "temoa-US_9R_TS_NZ-9-12ts",
        "temoa-US_9R_TS_SP-9-12ts",
      ],
    },
    {
      framework: "TIMES",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      milpFeatures: "None",
      realistic: "Realistic",
      example: [
        "TIMES-GEO-global-base-31-20ts",
        "TIMES-GEO-global-netzero-31-20ts",
        "times-nz-kea-2-24ts",
      ],
    },
    {
      framework: "Switch",
      problemClass: "LP",
      application: "Infrastructure & Capacity Expansion",
      milpFeatures: "None",
      realistic: "Realistic",
      example: ["SWITCH-China-open-model-32-433ts", "SWITCH-USA-PG-3-168h"],
    },
  ];

  return (
    <div className="my-4 mt-8 rounded-xl">
      {/* Desktop / tablet: keep table */}
      <div className="hidden md:block">
        <TanStackTable
          data={tableData}
          headerClassName="text-center text-navy p-2 cursor-pointer"
          columns={columns as any}
          showPagination={false}
          oddRowClassName="odd:bg-[#BFD8C733]"
        />
      </div>

      {/* Mobile: card UI per framework */}
      <div className="md:hidden space-y-4">
        {tableData.map((item: any, idx: number) => (
          <div
            key={`${item.framework}-${idx}`}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-bold tag-line-sm truncate">
                  {item.framework}
                </div>
                <div className="tag-line-xs text-navy text-opacity-60 mt-1 truncate">
                  <span className="font-semibold">{item.problemClass}</span>
                  <span className="mx-1">—</span>
                  <span>{item.application}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="tag-line-xs font-extrabold">
                  {item.milpFeatures}
                </div>
                <div className="tag-line-xs text-navy text-opacity-60 mt-1">
                  {String(item.realistic) === "Realistic" ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-navy text-opacity-60 text-sm">Examples</div>
              <div className="mt-2 space-y-1">
                {Array.isArray(item.example) ? (
                  item.example.map((e: string) => (
                    <div key={e} className="truncate">
                      <Link
                        href={getProblemLink(e)}
                        className="font-medium text-navy"
                      >
                        {e}
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="font-medium">{String(item.example)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenchmarkModelInsightsTable;
