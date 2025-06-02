import FilterAutoComplete from "@/components/admin/raw-result/FilterAutoComplete";
import FilterRange from "@/components/admin/raw-result/FilterRange";
import { Column } from "@tanstack/react-table";
import { useMemo } from "react";

export default function Filter<T>({ column }: { column: Column<T, unknown> }) {
  const { filterVariant } =
    (column.columnDef.meta as { filterVariant?: string }) ?? {};

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = useMemo(
    () =>
      filterVariant === "range"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000),
    [column.getFacetedUniqueValues(), filterVariant],
  );

  return filterVariant === "range" ? (
    <FilterRange
      column={column}
      columnFilterValue={columnFilterValue as [number, number]}
    />
  ) : filterVariant === "select" ? (
    <select
      onChange={(e) => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      <option value="">All</option>
      {sortedUniqueValues.map((value) => (
        <option value={value} key={value}>
          {value}
        </option>
      ))}
    </select>
  ) : (
    <>
      <FilterAutoComplete
        options={sortedUniqueValues.map((val) => ({
          value: val,
          label: val,
        }))}
        setFilterValue={column.setFilterValue}
      />
    </>
  );
}
