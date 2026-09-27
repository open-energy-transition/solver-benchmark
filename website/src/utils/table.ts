import { isEmptyStringOrUndefined } from "./calculations";

const filterNumber = (
  row: { getValue: (columnId: string) => string },
  columnId: string,
  filterValues: [number | string, number | string],
) => {
  const value = Number(row.getValue(columnId) || 0);

  // If no filter values are set, show all rows
  if (!filterValues?.length) return true;

  const [min, max] = filterValues;

  // Handle cases where either min or max is empty

  if (isEmptyStringOrUndefined(min) && isEmptyStringOrUndefined(max))
    return true;
  if (isEmptyStringOrUndefined(min)) return value <= Number(max);
  if (isEmptyStringOrUndefined(max)) return value >= Number(min);

  // Normal range check
  return value >= Number(min) && value <= Number(max);
};

// Same matching behavior as TanStack Table's built-in "arrIncludesSome", but
// without its `autoRemove` hook, which treats an empty filter selection as
// "no filter applied" (shows every row) instead of "nothing selected"
// (matches no rows).
const filterCheckboxIncludesSome = (
  row: { getValue: (columnId: string) => string },
  columnId: string,
  filterValues: string[],
) => {
  return filterValues.some((value) => row.getValue(columnId)?.includes(value));
};

export { filterNumber, filterCheckboxIncludesSome };
