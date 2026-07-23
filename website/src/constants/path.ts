const BASE_PATH = "dashboard";

export const PATH_DASHBOARD = {
  root: "/",
  home: `/${BASE_PATH}/solver-ranking`,
  benchmarkSet: {
    list: `/${BASE_PATH}/benchmark-problem-set`,
    one: `/${BASE_PATH}/benchmark-problem-set/{name}`,
  },
  benchmarkSummary: `/${BASE_PATH}/benchmark-summary`,
  featureDistribution: `/${BASE_PATH}/benchmark-problem-set/feature-distribution`,
  compareSolvers: `/${BASE_PATH}/solver-vs-solver`,
  solvers: `/${BASE_PATH}/solver-vs-all`,
  performanceHistory: `/${BASE_PATH}/performance-history`,
};

export const ROOT_PATH = {
  home: "/",
  keyInsights: "/key-insights",
  methodology: "/methodology",
  blog: "/blog",
};
