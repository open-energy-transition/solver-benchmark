const roundNumber = (value: number, digits = 0) => {
  const multiplier = Math.pow(10, digits)
  return Math.round(value * multiplier) / multiplier
}

export { roundNumber }
