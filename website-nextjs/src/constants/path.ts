const BASE_PATH = "dashboard";

export const PATH_DASHBOARD = {
  root: "/",
  home: `/${BASE_PATH}/main-results`,
  benchmarkSet: {
    list: `/${BASE_PATH}/benchmark-set`,
    one: `/${BASE_PATH}/benchmark-set/{name}`,
  },
  benchmarkSummary: `/${BASE_PATH}/benchmark-summary`,
  compareSolvers: `/${BASE_PATH}/compare-solvers`,
  solvers: `/${BASE_PATH}/solvers`,
  performanceHistory: `/${BASE_PATH}/performance-history`,
  fullResults: `/${BASE_PATH}/full-results`,
};

export const ROOT_PATH = {
  home: "/",
  keyInsights: "/key-insights",
  methodology: "/methodology",
};
