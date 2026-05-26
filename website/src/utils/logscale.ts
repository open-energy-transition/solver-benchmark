/**
 * Converts a number to its logarithmic scale
 * @param value The input value to convert
 * @param base The logarithm base (default: 10)
 * @returns The log-scaled value
 */
export function getLogScale(value: number, base: number = 10): number {
  if (value <= 0) return 0;
  return Math.log(value) / Math.log(base);
}
