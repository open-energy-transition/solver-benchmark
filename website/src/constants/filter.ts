/**
 * Timeout values in seconds for different benchmark configurations
 */
export const TIMEOUT_VALUES = {
  SHORT: 3600, // 1 hour
  LONG: 86400, // 24 hours
} as const;

/**
 * Pseudo-value used to represent a missing/unpopulated metadata field in
 * filter option lists, so problems lacking that field remain filterable
 * (as "N/A") instead of silently disappearing whenever a filter is applied.
 */
export const UNSPECIFIED_FILTER_VALUE = "N/A";
