/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useSelector } from "react-redux";

import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { ColumnDef } from "@tanstack/react-table";
import { MetaDataEntry } from "@/types/meta-data";
import { IResultState } from "@/types/state";
import { humanizeSeconds } from "@/utils/string";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";

interface IColumnTable extends MetaDataEntry {
  constraints: number;
  numVariables: number;
}

interface ProblemClassTableProps {
  problemClass: string;
}

const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString();
};

const ProblemClassTable = ({ problemClass }: ProblemClassTableProps) => {
  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      {
        header: "Model Framework",
        accessorKey: "modelName",
        size: 180,
        enableColumnFilter: false,
        enableSorting: true,
        sortingFn: "alphanumeric",
        cell: (info) => (
          <div className="text-left">{String(info.getValue())}</div>
        ),
      },
      {
        header: `${problemClass} Benchmark`,
        accessorKey: "problemClass",
        size: 250,
        enableColumnFilter: false,
        enableSorting: false,
        cell: (info) => {
          const fullValue = String(info.getValue());
          const parts = fullValue.split(" ");
          const benchmarkName = parts[0];
          const sizeName = parts.slice(1).join(" ");

          return (
            <div className="py-2 whitespace-normal break-words">
              <Link
                href={getBenchmarksetLink(fullValue)}
                className="font-bold inline-block"
                style={{ lineHeight: "1.5" }}
              >
                {benchmarkName}
              </Link>
              {sizeName && <span className="ml-1">({sizeName})</span>}
            </div>
          );
        },
      },
      {
        header: "Num. variables",
        accessorKey: "numVariables",
        enableColumnFilter: false,
        enableSorting: true,
        size: 150,
        cell: (info) => (
          <div className="text-right">
            {formatNumberWithCommas(info.getValue() as number)}
          </div>
        ),
      },
      {
        header: "Num. constraints",
        accessorKey: "constraints",
        enableColumnFilter: false,
        enableSorting: true,
        size: 180,
        cell: (info) => (
          <div className="text-right">
            {formatNumberWithCommas(info.getValue() as number)}
          </div>
        ),
      },
      {
        header: "Spatial resolution",
        accessorKey: "spatialResolution",
        enableColumnFilter: false,
        enableSorting: false,
        size: 180,
        cell: (info) => (
          <div className="text-left whitespace-normal break-words">
            {String(info.getValue())}
          </div>
        ),
      },
      {
        header: "Temporal resolution",
        accessorKey: "temporalResolution",
        enableColumnFilter: false,
        enableSorting: false,
        size: 180,
        cell: (info) => (
          <div className="text-left whitespace-normal break-words">
            {String(info.getValue())}
          </div>
        ),
      },
      {
        header: "Solver",
        accessorKey: "solver",
        enableColumnFilter: false,
        enableSorting: false,
        size: 150,
        cell: (info) => (
          <div className="text-left whitespace-normal break-words">
            {String(info.getValue())}
          </div>
        ),
      },
      {
        header: "Runtime",
        accessorKey: "runtime",
        enableColumnFilter: false,
        enableSorting: true,
        size: 150,
        cell: (info) => (
          <div className="text-left">
            {humanizeSeconds(info.getValue() as number)}
          </div>
        ),
      },
    ],
    [],
  );

  const getBenchmarksetLink = (benchmark: string) => {
    const benchmarkName = benchmark.split(" ")[0];
    return PATH_DASHBOARD.benchmarkSet.one.replace("{name}", benchmarkName);
  };

  const benchmarkLatestResults = useBenchmarkResults({
    excludeHipo: true,
  }).filter((result) => result.solver !== "gurobi" && result.status === "ok");

  const rawBenchmarkResults = useBenchmarkResults({
    excludeHipo: true,
    useRawResults: true,
  }).filter((result) => result.solver !== "gurobi" && result.status === "ok");

  const listSuccessBenchmark = new Set(
    benchmarkLatestResults.map(
      (result) => `${result.benchmark} ${result.size}`,
    ),
  );

  const listSuccessBenchmarkArray = Array.from(listSuccessBenchmark);

  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const metaDataArray = Object.entries(metaData)
    .map(([key, value]) => ({
      ...value,
      key,
    }))
    .filter((metaData) => metaData.problemClass === problemClass);

  const filteredMetaData = new Set(
    metaDataArray.map((metaDataArr) => {
      return metaDataArr.modellingFramework;
    }),
  );

  const modelFrameworkMaxSizeData = Array.from(filteredMetaData)
    .filter((item) => item !== null)
    .map((modellingFramework) => {
      const entries = metaDataArray.filter(
        (curr) => curr.modellingFramework === modellingFramework,
      );
      let maxEntry: any = null;
      let maxNumVariables = -Infinity;
      let maxSize: any = null;

      entries.forEach((curr) => {
        curr.sizes.forEach((size) => {
          if (
            typeof size.numVariables === "number" &&
            typeof size.numConstraints === "number" &&
            listSuccessBenchmarkArray.includes(`${curr.key} ${size.name}`)
          ) {
            const isBetter =
              size.numVariables > maxNumVariables ||
              (size.numVariables === maxNumVariables &&
                size.numConstraints > (maxSize?.numConstraints || -Infinity));

            if (isBetter) {
              maxNumVariables = size.numVariables;
              maxEntry = curr;
              maxSize = size;
            }
          }
        });
      });

      if (!maxEntry || !maxSize) {
        return null;
      }

      // Find the best benchmark result for this model/size
      const benchmarkResults = rawBenchmarkResults.filter(
        (result: any) =>
          result.benchmark === maxEntry.key &&
          result.size === maxSize.name &&
          result.status === "ok",
      );
      const bestResult = benchmarkResults.reduce(
        (best: any, current: any) =>
          current.runtime < best.runtime ? current : best,
        { runtime: Infinity, solver: "", solverVersion: "", details: "" },
      );

      return {
        modelName: modellingFramework,
        problemClass: `${maxEntry.key} ${maxSize.name}`,
        numVariables: maxSize.numVariables,
        constraints: maxSize.numConstraints,
        spatialResolution: maxSize.spatialResolution?.toString() ?? "",
        modellingFramework: modellingFramework as string,
        temporalResolution: maxSize.temporalResolution?.toString() ?? "",
        solver:
          bestResult && bestResult.solver
            ? `${bestResult.solver} v${bestResult.solverVersion}`
            : "N/A",
        runtime:
          bestResult && bestResult.runtime !== Infinity
            ? bestResult.runtime
            : "N/A",
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => {
      const runtimeA = a.runtime === "N/A" ? 0 : a.runtime;
      const runtimeB = b.runtime === "N/A" ? 0 : b.runtime;
      return runtimeB - runtimeA;
    });

  return (
    <div className="my-4 mt-8 rounded-xl">
      <TanStackTable
        data={modelFrameworkMaxSizeData}
        columns={columns as any}
        showPagination={false}
        rowClassName="tag-line-sm leading-1.4 text-navy text-start p-2 lg:px-6 truncate"
        headerClassName="text-center text-navy p-2 lg:py-4 lg:px-6 cursor-pointer"
      />
    </div>
  );
};

export default ProblemClassTable;
