import NormalizedSGMMemoryUsage from "./NormalizedSGMMemoryUsage";
import NormalizedSGMRuntime from "./NormalizedSGMRuntime";

const NormalizedSection = () => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full mb-1.5">
      <NormalizedSGMRuntime />
      <NormalizedSGMMemoryUsage />
    </div>
  );
};
export default NormalizedSection;
