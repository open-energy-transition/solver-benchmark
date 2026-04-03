import { TIMEOUT_VALUES } from "./filter";

export enum ProblemSize {
  XXS = "xxs",
  XS = "xs",
  M = "m",
  L = "l",
  S = "s",
}

export const MaxRunTime = TIMEOUT_VALUES.LONG;

export enum ProblemClass {
  MILP = "MILP",
  LP = "LP",
}
