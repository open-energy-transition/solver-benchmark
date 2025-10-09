type Size = {
  name: string;
  spatialResolution: number;
  temporalResolution: number | string;
  numConstraints: number;
  numVariables: number | null;
  numContinuousVariables: number | null;
  numIntegerVariables: number | null;
  size: string;
  url: string;
  realistic: boolean;
  realisticMotivation?: string | undefined;
};

interface MetaDataEntry {
  shortDescription: string;
  modelName: string;
  modellingFramework: string;
  version: string;
  problemClass: string;
  application: string;
  sectoralFocus: string;
  sectors: string;
  timeHorizon: string;
  milpFeatures: string | null;
  contributorSSource: string | null;
  sizes: Size[];
}

type MetaData = Record<string, MetaDataEntry>;

export type { MetaData, MetaDataEntry, Size };
