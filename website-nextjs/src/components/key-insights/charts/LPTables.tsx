import { useMemo } from "react";
import { useSelector } from "react-redux";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { ColumnDef } from "@tanstack/react-table";
import { MetaDataEntry } from "@/types/meta-data";
import { IResultState } from "@/types/state";

interface IColumnTable extends MetaDataEntry {
  name: string;
}

const LPTable = () => {
  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "MODEL",
        accessorKey: "modelName",
        size: 130,
      },
      {
        header: "LP Benchmark",
        accessorKey: "problemClass",
        size: 120,
      },
      {
        header: "# variables \n #constraints",
        accessorKey: "variables_and_constraints",
      },
      {
        header: "Spatial resolution",
        accessorKey: "spatialResolution",
        size: 100,
      },
      {
        header: "Temporal resolution",
        accessorKey: "temporalResolution",
        size: 100,
      },
      {
        header: "Solver",
        accessorKey: "details",
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "Runtime",
        accessorKey: "details",
        enableColumnFilter: false,
        enableSorting: false,
      },
    ],
    [],
  );

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const metaDataArray = Object.entries(metaData).map(([key, value]) => ({
    ...value,
    key,
  }));

  const filteredMetaData = new Set(
    metaDataArray.map((metaData) => {
      if (metaData.problemClass === "LP") {
        return metaData.modellingFramework;
      } else {
        return null;
      }
    }),
  );
  const a = Array.from(filteredMetaData)
    .filter((item) => item !== null)
    .map((modellingFramework) => {
      const max = metaDataArray.reduce(
        (acc, curr) => {
          if (curr.modellingFramework === modellingFramework) {
            const maxNumVariables = Math.max(
              curr.sizes.map((size) => size.numVariables),
            );
            if (acc.numVariables < maxNumVariables) {
              const key = curr.sizes.find(
                (size) => size.numVariables === maxNumVariables,
              );
              return {
                key: key?.name,
                numVariables: maxNumVariables,
                contraints: key?.numConstraints,
                spatialResolution: key?.spatialResolution,
              };
            }
          }
          return acc;
        },
        { numVariables: 0 },
      );
      console.log(max);
      return {
        modelName: modellingFramework,
        problemClass: `${modellingFramework} ${max.key}`,
        numVariables: max.numVariables,
        constraints: max.constraints,
        spatialResolution: max.spatialResolution,
        modellingFramework: modellingFramework as string,
        temporalResolution: max.temporalResolution,
      };
    });
  console.log("a", a);

  return (
    <div className="my-4 mt-8 rounded-xl">
      <TanStackTable data={a} columns={columns} />
    </div>
  );
};

export default LPTable;
