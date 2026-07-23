import { MetaDataEntry } from "@/types/meta-data";
import { formatInteger } from "@/utils/number";
import { FieldBlock, SectionCard } from "./ProblemDetailBlocks";

const ProblemClassAndSize = ({
  problemDetail,
}: {
  problemDetail: MetaDataEntry;
}) => {
  const isMILP = problemDetail.problemClass === "MILP";

  return (
    <SectionCard title="Problem Class & Size" hasContent>
      <FieldBlock label="Problem Class" value={problemDetail.problemClass ?? "-"} />
      <FieldBlock label="Size" value={problemDetail.size ?? "-"} />
      <FieldBlock
        label="Num. Variables"
        value={formatInteger(problemDetail.numVariables)}
      />
      <FieldBlock
        label="Num. Constraints"
        value={formatInteger(problemDetail.numConstraints)}
      />
      <FieldBlock
        label="Num. Non-zeros"
        value={formatInteger(problemDetail.numNonzeros)}
      />
      {isMILP && (
        <>
          <FieldBlock
            label="Num. Continuous Variables"
            value={formatInteger(problemDetail.numContinuousVariables)}
          />
          <FieldBlock
            label="Num. Integer Variables"
            value={formatInteger(problemDetail.numIntegerVariables)}
          />
        </>
      )}
      {problemDetail.shareIntegerVariables != null && (
        <FieldBlock
          label="Share Integer Variables"
          value={`${(problemDetail.shareIntegerVariables * 100).toFixed(1)}%`}
        />
      )}
    </SectionCard>
  );
};

export default ProblemClassAndSize;
