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

const filterSelect = (
  row: { getValue: (columnId: string) => string },
  columnId: string,
  filterValues: string[],
) => {
  const status = row.getValue(columnId);

  if (!filterValues?.length) return true;
  // Check if the row's status is included in the filter values
  return filterValues.includes(status);
};

export { filterNumber, filterSelect };
