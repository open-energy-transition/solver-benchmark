export enum Sector {
  Power = "Power",
  SectorCoupled = "Sector-coupled",
  UpstreamElectricTransportCommercialResidentialIndustrial = "Upstream, Electric, Transport, Commercial, Residential, Industrial",
}

export enum Technique {
  MILP = "MILP",
  LP = "LP",
}

export enum KindOfProblem {
  Infrastructure = "Infrastructure",
  Operational = "Operational",
  DCOptimalPowerFlow = "DC optimal power flow",
  SteadyStateOptimalPowerFlow = "Steady-state optimal power flow",
}

export enum ProblemSize {
  XXS = "xxs",
  XS = "xs",
  M = "m",
  L = "l",
  S = "s",
}

export enum Model {
  PyPSA = "PyPSA",
  PyPSAEur = "PyPSA-Eur",
  Tulipa = "Tulipa",
  PowerModel = "PowerModels",
  Sienna = "Sienna",
  GenX = "GenX",
  TEMOA = "TEMOA",
}

export const MaxRunTime = 600

export const MaxMemoryUsage = 8192
