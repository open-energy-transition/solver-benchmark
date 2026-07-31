/**
 * Enumeration for different SGM calculation modes
 */
enum SgmMode {
  COMPUTE_SGM_USING_TO_VALUES = "Compute SGM using TO values",
  PENALIZING_TO_BY_FACTOR = "Penalizing TO by a factor of",
  ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS = "Only on intersection of solved benchmarks",
}

const DEFAULT_SGM_CALCULATION_MODES = [
  {
    optionTitle: "Compute SGM using max values",
    value: SgmMode.COMPUTE_SGM_USING_TO_VALUES,
    optionTooltip:
      "Uses the time-out value for runtime or the maximum value of memory for benchmark instances that time-out or error.",
  },
  {
    optionTitle: "Penalizing TO/OOM/ER by a factor of",
    value: SgmMode.PENALIZING_TO_BY_FACTOR,
    optionTooltip:
      "Uses the time-out value for runtime or the maximum value of memory, multiplied by a factor of X, for benchmark instances that time-out or error.",
  },
  {
    optionTitle: "Only on intersection of solved benchmarks",
    value: SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS,
    optionTooltip:
      "Filters the benchmark instances to those that are solved by all solvers before computing SGM, so that there are no error or time-out instances to consider.",
  },
];

const DEFAULT_X_FACTOR = 5;

export { SgmMode, DEFAULT_SGM_CALCULATION_MODES, DEFAULT_X_FACTOR };
