import SolverRuntimeGraph from "./SolverRuntimeGraph";
import MemoryUsageGraph from "./MemoryUsageGraph";

const SolversGraphSection = () => {
  return (
    <div className="pt-4 pb-4 flex">
      <SolverRuntimeGraph />
      <div className="h-full mx-3"></div>
      <MemoryUsageGraph />
    </div>
  );
};

export default SolversGraphSection;
