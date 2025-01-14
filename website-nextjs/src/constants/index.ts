// src/redux/enums.ts

export enum Sector {
  Power = "Power",
  SectorCoupled = "Sector coupled",
}

export enum Technique {
  MLIP = "MLIP",
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
  PyPSAEur = "PyPSA - Eur",
  PowerModel = "Power - Model",
  Tulipa = "Tulipa",
  Sienna = "Sienna",
  GenX = "Gen X",
}
