import { SgmMode } from "@/constants/filter";
import ResultsSgmModeDropdown from "../home/ResultsSgmModeDropdown";

const SGM_CALCULATION_MODES = [
  {
    optionTitle: "Compute SGM using max values",
    value: SgmMode.COMPUTE_SGM_USING_TO_VALUES,
    optionTooltip:
      "Uses the time-out value for runtime or the maximum value of memory for benchmark instances that time-out or error.",
  },
  {
    optionTitle: "Penalizing TO/OOM/ER by a factor of",
    value: SgmMode.PENALIZING_TO_BY_FACTOR,
    optionTooltip:
      "Uses the time-out value for runtime or the maximum value of memory, multiplied by a factor of X, for benchmark instances that time-out or error.",
  },
];
const SgmModeSection = () => {
  return (
    <div className="relative h-12">
      <ResultsSgmModeDropdown sgmCalculationModes={SGM_CALCULATION_MODES} />
    </div>
  );
};
export default SgmModeSection;
