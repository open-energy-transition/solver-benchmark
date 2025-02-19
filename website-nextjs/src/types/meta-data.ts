
type Size = {
  name: string
  spatialResolution: number
  temporalResolution: number | string
  nOfConstraints: number
  nOfVariables: number | null
  size: string
}

interface MetaDataEntry {
  shortDescription: string
  modelName: string
  version: string | null
  technique: string
  kindOfProblem: string
  sectors: string
  timeHorizon: string
  milpFeatures: string | null
  sizes: Size[]
}

type MetaData = Record<string, MetaDataEntry>

export type { MetaData, MetaDataEntry, Size }
