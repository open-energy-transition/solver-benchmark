import { DEFAULT_SGM_CALCULATION_MODES, SgmMode } from "@/constants/sgm";
import ResultsSgmModeDropdown from "../home/ResultsSgmModeDropdown";

const SGM_CALCULATION_MODES = DEFAULT_SGM_CALCULATION_MODES.filter(
  (mode) => mode.value !== SgmMode.ONLY_ON_INTERSECTION_OF_SOLVED_BENCHMARKS,
);

const SgmModeSection = () => {
  return (
    <div className="relative h-8 mt-4">
      <ResultsSgmModeDropdown sgmCalculationModes={SGM_CALCULATION_MODES} />
    </div>
  );
};
export default SgmModeSection;
