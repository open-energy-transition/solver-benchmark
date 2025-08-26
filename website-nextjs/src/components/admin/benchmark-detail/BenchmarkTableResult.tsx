import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Popup from "reactjs-popup";
import { Color } from "@/constants/color";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { filterSelect } from "@/utils/table";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { FilterIcon } from "@/assets/icons";

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
          <Link
            className="font-bold inline-block"
            style={{ lineHeight: "1.5" }}
            href={PATH_DASHBOARD.benchmarkSet.one.replace(
              "{name}",
              info.row.original.name,
            )}
          >
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
          </Link>
        ),
      },
      {
        header: "MODEL NAME",
        accessorKey: "modelName",
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
        size: 110,
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
        size: 200,
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
        header: "SECTORAL FOCUS",
        accessorKey: "sectoralFocus",
        size: 125,
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
      },
      {
        header: "SECTORS",
        accessorKey: "sectors",
        size: 100,
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
    ],
    [],
  );

  return (
    <div>
      <div className="flex items-center gap-1 text-xs mb-4">
        To search for a particular benchmark problem by name, click the filter
        icon
        <FilterIcon className="size-4" />
        on the name column and type to search
      </div>
      <div>
        <TanStackTable showAllRows data={memoizedMetaData} columns={columns} />
      </div>
      <div>
        <div className="text-xs my-4">
          <div className="text-dark-grey tag-line-xxs">
            Showing {memoizedMetaData.length} benchmark problems matching the
            filters
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTableResult;
