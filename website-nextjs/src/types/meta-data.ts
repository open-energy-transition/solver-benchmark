type Size = {
  name: string;
  spatialResolution: number;
  temporalResolution: number | string;
  numConstraints: number;
  numVariables: number | null;
  size: string;
  url: string;
  realistic: boolean;
};

interface MetaDataEntry {
  shortDescription: string;
  modelName: string;
  version: string;
  technique: string;
  kindOfProblem: string;
  sectors: string;
  timeHorizon: string;
  milpFeatures: string | null;
  contributorSSource: string | null;
  sizes: Size[];
}

type MetaData = Record<string, MetaDataEntry>;

export type { MetaData, MetaDataEntry, Size };
