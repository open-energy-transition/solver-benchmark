const roundNumber = (value: number, digits = 0, defaultValue = 0) => {
  const multiplier = Math.pow(10, digits);
  const result = Math.round(value * multiplier) / multiplier;
  if (isNaN(result)) return defaultValue;
  return Number(result.toFixed(digits));
};

const parseNumberOrNull = (value: string): number | null => {
  if (value === "") return null;
  const parsed = Number(value);
  return !isNaN(parsed) ? parsed : null;
};

/**
 * Format number with thousands separator and 1 decimal place
 * Used for runtime (seconds) and memory (MB)
 * Example: 123456.7 -> "123,456.7"
 */
const formatDecimal = ({
  value,
  fallback = "N/A",
  maximumFractionDigits = 1,
}: {
  value: any;
  fallback?: string;
  maximumFractionDigits?: number;
}): string => {
  const num = Number(value);
  if (isNaN(num)) {
    return fallback;
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

/**
 * Format number in scientific notation with 3 significant digits
 * Used for objective value, duality gap, max int violation
 * Example: 12345678 -> "1.235e+7"
 */
const formatScientific = (value: any, fallback = "N/A"): string => {
  const num = Number(value);
  if (isNaN(num)) {
    return fallback;
  }
  return num.toExponential(3);
};

/**
 * Format integer with thousands separator
 * Used for number of variables and constraints
 * Example: 123456 -> "123,456"
 */
const formatInteger = (value: any, fallback = "N/A"): string => {
  const num = Number(value);
  if (isNaN(num)) {
    return fallback;
  }
  return Math.round(num).toLocaleString("en-US");
};

export {
  roundNumber,
  parseNumberOrNull,
  formatDecimal,
  formatScientific,
  formatInteger,
};
