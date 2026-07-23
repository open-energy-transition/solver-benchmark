import { MetaDataEntry } from "@/types/meta-data";
import {
  FieldBlock,
  TextFieldBlock,
  ChipFieldBlock,
  SectionCard,
  RealisticTag,
} from "./ProblemDetailBlocks";

const ProblemMetadataSections = ({
  problemDetail,
}: {
  problemDetail: MetaDataEntry;
}) => {
  const {
    modellingFramework,
    version,
    milpFeatures,
    realistic,
    realisticMotivation,
    geographicScope,
    spatialResolution,
    temporalInterval,
    temporalSampling,
    temporalResolution,
    optimizationPeriods,
    energyCarriers,
    demandSectors,
    supplyAndTransformation,
    storageAndNetworks,
    application,
    sectoralFocus,
    sectors,
    timeHorizon,
    policy,
    notes,
    skipBecause,
  } = problemDetail;

  const hasModelFramework =
    !!modellingFramework || !!version || !!milpFeatures?.length || !!realistic;
  const hasGeographicScope = !!geographicScope || !!spatialResolution;
  const hasTemporalScope =
    !!temporalInterval ||
    !!temporalSampling ||
    !!temporalResolution ||
    !!optimizationPeriods;
  const hasTaxonomy =
    !!energyCarriers?.length ||
    !!demandSectors?.length ||
    !!supplyAndTransformation?.length ||
    !!storageAndNetworks?.length;
  const hasLegacyClassification =
    !!application || !!sectoralFocus || !!sectors || !!timeHorizon;
  const hasPolicyAndNotes = !!policy || !!notes || !!skipBecause;

  return (
    <>
      <SectionCard title="Model & Framework" hasContent={hasModelFramework}>
        {realistic && <RealisticTag motivation={realisticMotivation} />}
        {modellingFramework && (
          <FieldBlock label="Modelling Framework" value={modellingFramework} />
        )}
        {version && <FieldBlock label="Version" value={version} />}
        {!!milpFeatures?.length && (
          <ChipFieldBlock label="MILP Features" values={milpFeatures} />
        )}
      </SectionCard>

      <SectionCard
        title="Geographic & Spatial Information"
        hasContent={hasGeographicScope}
      >
        {geographicScope && (
          <FieldBlock label="Geographic Scope" value={geographicScope} />
        )}
        {spatialResolution && (
          <FieldBlock label="Spatial Resolution" value={spatialResolution} />
        )}
      </SectionCard>

      <SectionCard title="Temporal Information" hasContent={hasTemporalScope}>
        {temporalInterval && (
          <FieldBlock label="Temporal Interval" value={temporalInterval} />
        )}
        {temporalSampling && (
          <FieldBlock label="Temporal Sampling" value={temporalSampling} />
        )}
        {temporalResolution && (
          <FieldBlock label="Temporal Resolution" value={temporalResolution} />
        )}
        {!!optimizationPeriods && (
          <FieldBlock
            label="Optimization Periods"
            value={optimizationPeriods}
          />
        )}
      </SectionCard>

      <SectionCard title="Energy-System Taxonomy" hasContent={hasTaxonomy}>
        {!!energyCarriers?.length && (
          <ChipFieldBlock label="Energy Carriers" values={energyCarriers} />
        )}
        {!!demandSectors?.length && (
          <ChipFieldBlock label="Demand Sectors" values={demandSectors} />
        )}
        {!!supplyAndTransformation?.length && (
          <ChipFieldBlock
            label="Supply and Transformation"
            values={supplyAndTransformation}
          />
        )}
        {!!storageAndNetworks?.length && (
          <ChipFieldBlock
            label="Storage and Networks"
            values={storageAndNetworks}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Legacy Classification"
        infoText="These fields are being phased out in favor of a new Energy-System Taxonomy fields above, but are still shown here since they remain populated on existing problems."
        hasContent={hasLegacyClassification}
      >
        {application && <FieldBlock label="Application" value={application} />}
        {sectoralFocus && (
          <FieldBlock label="Sectoral Focus" value={sectoralFocus} />
        )}
        {sectors && <FieldBlock label="Sectors" value={sectors} />}
        {timeHorizon && <FieldBlock label="Time Horizon" value={timeHorizon} />}
      </SectionCard>

      <SectionCard title="Policy & Notes" hasContent={hasPolicyAndNotes}>
        {policy && <TextFieldBlock label="Policy" value={policy} />}
        {notes && <TextFieldBlock label="Notes" value={notes} />}
        {skipBecause && (
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-sm text-navy bg-[#F7F7F9] border border-[#CAD9EF] rounded-2xl px-4 py-3">
            <span className="font-semibold">
              Excluded from solver evaluation runs:
            </span>{" "}
            {skipBecause}
          </div>
        )}
      </SectionCard>
    </>
  );
};

export default ProblemMetadataSections;
