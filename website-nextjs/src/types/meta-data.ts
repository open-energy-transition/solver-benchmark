import { KindOfProblem, Model, Sector, Technique } from "@/constants"

type Size = {
  spatialResolution: number
  temporalResolution: number | string
  nOfConstraints: number
  nOfVariables: number | null
}

interface MetaDataEntry {
  shortDescription: string
  modelName: Model
  version: string | null
  technique: Technique
  kindOfProblem: KindOfProblem
  sectors: Sector
  timeHorizon: string
  milpFeatures: string | null
  sizes: Size[]
}

type MetaData = Record<string, MetaDataEntry>

export type { MetaData, MetaDataEntry, Size }
