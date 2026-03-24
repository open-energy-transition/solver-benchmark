/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterIcon } from "@/assets/icons";
import React, { useRef, useState } from "react";
import { SelectInstance } from "react-select";
import Popup from "reactjs-popup";
import DebouncedInput from "./DebouncedInput";
import { Column } from "@tanstack/react-table";
import { isEmptyStringOrUndefined } from "@/utils/calculations";

interface FilterRangeProps<T> {
  column: Column<T, unknown>;
  columnFilterValue: [number, number];
}

const FilterRange = <T,>({
  column,
  columnFilterValue,
}: FilterRangeProps<T>) => {
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false);

  const ref = useRef<SelectInstance>(null);

  const toggleMenuIsOpen = (isClose: boolean = false) => {
    if (isClose) {
      setMenuIsOpen(false);
      const selectEl = ref.current;
      if (!selectEl) return;
      selectEl.focus();
    } else {
      setMenuIsOpen((value) => !value);
      const selectEl = ref.current;
      if (!selectEl) return;
      if (menuIsOpen) selectEl.blur();
      else selectEl.focus();
    }
  };
  const isFilterActive =
    columnFilterValue &&
    !(
      isEmptyStringOrUndefined(columnFilterValue[0]) &&
      isEmptyStringOrUndefined(columnFilterValue[1])
    );

  return (
    <Popup
      onClose={() => toggleMenuIsOpen(true)}
      onOpen={() => toggleMenuIsOpen()}
      trigger={
        <div className="flex gap-2 w-max items-center z-50 relative">
          <div className="relative">
            <FilterIcon className="size-4" />
            {isFilterActive && (
              <div className="absolute -top-0.5 -right-0.5 size-1.5 bg-green-500 rounded-full" />
            )}
          </div>
        </div>
      }
      position="bottom center"
    >
      <div className="bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex space-x-2">
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={(columnFilterValue as [number, number])?.[0] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => [
                value,
                old?.[1],
              ])
            }
            placeholder={`Min ${
              column.getFacetedMinMaxValues()?.[0] !== undefined
                ? `(${column.getFacetedMinMaxValues()?.[0]})`
                : ""
            }`}
            className="w-24 border rounded px-2 h-8"
          />
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={(columnFilterValue as [number, number])?.[1] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                value,
              ])
            }
            placeholder={`Max ${
              column.getFacetedMinMaxValues()?.[1]
                ? `(${column.getFacetedMinMaxValues()?.[1]})`
                : ""
            }`}
            className="w-24 border rounded px-2 h-8"
          />
        </div>
        <div className="h-1" />
        <button
          onClick={() => column.setFilterValue(undefined)}
          disabled={!isFilterActive}
          className="w-full text-sm py-1 px-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Filter
        </button>
      </div>
    </Popup>
  );
};

export default FilterRange;
