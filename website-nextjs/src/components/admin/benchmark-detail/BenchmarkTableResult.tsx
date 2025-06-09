import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { ArrowRightIcon } from "@/assets/icons";
import { filterSelect } from "@/utils/table";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";

interface IColumnTable extends MetaDataEntry {
  name: string;
}

interface BenchmarkTableResultProps {
  metaData: Record<string, MetaDataEntry>;
}

const BenchmarkTableResult: React.FC<BenchmarkTableResultProps> = ({
  metaData,
}) => {
  const memoizedMetaData = useMemo(
    () =>
      Object.entries(metaData).map(([key, value]) => ({
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
        filterFn: filterSelect,
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
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
        size: 130,
      },
      {
        header: "PROBLEM CLASS",
        accessorKey: "problemClass",
        filterFn: filterSelect,
        size: 120,
        cell: (info) => info.getValue(),
      },
      {
        header: "APPLICATION",
        accessorKey: "application",
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
      },
      {
        header: "SECTORAL FOCUS",
        accessorKey: "sectoralFocus",
        size: 100,
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
      },
      {
        header: "SECTORS",
        accessorKey: "sectors",
        size: 100,
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
      },
      {
        header: "DETAILS",
        accessorKey: "details",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info) => (
          <Link
            className="hover:text-white hover:bg-green-pop text-green-pop border border-green-pop border-opacity-80 rounded-lg py-2 px-4 flex w-max items-center"
            href={PATH_DASHBOARD.benchmarkSet.one.replace(
              "{name}",
              info.row.original.name,
            )}
          >
            <div className="hover:underline underline-offset-4">
              View Details
            </div>
            <ArrowRightIcon className="size-2 ml-1 fill-none stroke-green-pop hover:stroke-white" />
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <TanStackTable data={memoizedMetaData} columns={columns} />
    </div>
  );
};

export default BenchmarkTableResult;
