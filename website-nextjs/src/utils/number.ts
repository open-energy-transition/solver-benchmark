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

export { roundNumber, parseNumberOrNull };
