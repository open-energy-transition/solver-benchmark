const BASE_PATH = "dashboard";

export const PATH_DASHBOARD = {
  root: "/",
  home: `/${BASE_PATH}/home`,
  benchmarkDetail: {
    list: `/${BASE_PATH}/benchmark-details`,
    one: `/${BASE_PATH}/benchmark-details/{name}`,
  },
  benchmarkSummary: `/${BASE_PATH}/benchmark-summary`,
  compareSolvers: `/${BASE_PATH}/compare-solvers`,
  solvers: `/${BASE_PATH}/solvers`,
  performanceHistory: `/${BASE_PATH}/performance-history`,
  rawResult: `/${BASE_PATH}/raw-result`,
};
