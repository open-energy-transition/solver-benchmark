export const encodeValue = (value: string) => {
  return encodeURIComponent(value);
};

export const decodeValue = (value: string) => {
  return decodeURIComponent(value);
};
