interface MetaDataEntry {
  // Strictly required
  shortDescription: string;
  contributorSSource: string | null;
  license: string | null;
  url: string;

  // Calculated after submission
  problemClass?: string;
  size?: string;
  numConstraints?: number;
  numVariables?: number | null;
  numNonzeros?: number | null;
  numContinuousVariables?: number | null;
  numIntegerVariables?: number | null;
  shareIntegerVariables?: number | null;

  // Optional
  notes?: string;
  milpFeatures?: string[];
  modellingFramework?: string;
  version?: string;
  geographicScope?: string;
  spatialResolution?: string;
  temporalInterval?: string;
  temporalSampling?: string;
  temporalResolution?: string | number;
  optimizationPeriods?: number;
  policy?: string;
  realistic?: boolean;
  realisticMotivation?: string;
  skipBecause?: string;
  energyCarriers?: string[];
  demandSectors?: string[];
  supplyAndTransformation?: string[];
  storageAndNetworks?: string[];

  // Old categories (deprecated, superseded by the fields above, but still
  // populated on existing entries and shown/filtered on in the UI for now)
  application?: string;
  sectoralFocus?: string;
  sectors?: string;
  timeHorizon?: string;
  modelName?: string;
}

type MetaData = Record<string, MetaDataEntry>;

export type { MetaData, MetaDataEntry };
