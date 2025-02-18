const roundNumber = (value: number, digits = 0, defaultValue = 0) => {
  const multiplier = Math.pow(10, digits)
  const result = Math.round(value * multiplier) / multiplier;
  if (isNaN(result)) return defaultValue
  return Math.round(value * multiplier) / multiplier
}

export { roundNumber }
