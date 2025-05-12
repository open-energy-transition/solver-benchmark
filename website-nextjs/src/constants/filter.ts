/**
 * Enumeration for different SGM calculation modes
 */
export enum SgmMode {
  COMPUTE_SGM_USING_TO_VALUES = "Compute SGM using TO values",
  PENALIZING_TO_BY_FACTOR = "Penalizing TO by a factor of",
  ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS = "Only on intersection of solved benchmarks",
}

/**
 * Timeout values in seconds for different benchmark configurations
 */
export const TIMEOUT_VALUES = {
  SHORT: 3600, // 1 hour
  LONG: 36000, // 10 hours
} as const;
