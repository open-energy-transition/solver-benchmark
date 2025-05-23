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
};

interface MetaDataEntry {
  shortDescription: string;
  modelName: string;
  version: string;
  problemClass: string;
  application: string;
  sectors: string;
  timeHorizon: string;
  milpFeatures: string | null;
  contributorSSource: string | null;
  sizes: Size[];
}

type MetaData = Record<string, MetaDataEntry>;

export type { MetaData, MetaDataEntry, Size };
