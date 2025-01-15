export enum Sector {
  Power = "Power",
  SectorCoupled = "Sector-coupled",
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

export enum Model {
  PyPSA = "PyPSA",
  PyPSAEur = "PyPSA-Eur",
  Tulipa = "Tulipa",
  PowerModel = "PowerModels",
  Sienna = "Sienna",
  GenX = "GenX",
}

export const MaxRunTime = 600

export const MaxMemoryUsage = 8192
