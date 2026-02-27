const calculateSgm = (dataPoints: number[], sh = 10) => {
  const adjustedDataPoints = dataPoints.map((point: number) =>
    Math.max(1, point + sh),
  );

  // Calculate the geometric mean
  const logSum = adjustedDataPoints.reduce(
    (sum: number, point: number) => sum + Math.log(point),
    0,
  );
  const geometricMean = Math.exp(logSum / adjustedDataPoints.length);

  // Subtract the shift from the result
  const sgm = geometricMean - sh;

  return sgm;
};

const isNullorUndefined = (value: number | null | undefined): boolean => {
  return value === null || value === undefined;
};

function isEmptyStringOrUndefined(params: string | undefined | number) {
  return params === "" || params === undefined;
}

export { calculateSgm, isNullorUndefined, isEmptyStringOrUndefined };
