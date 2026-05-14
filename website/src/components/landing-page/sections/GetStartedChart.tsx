import ChartResultsSections from "./ChartResultsSections";
import ChartResultsSectionsVarians from "./ChartResultsSectionsVarians";

const GetStartedChart = () => {
  return (
    <div className="text-navy w-full mx-auto max-w-8xl py-16">
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-1 pl-4 md:pl-12">
        <div className="md:absolute top-1/2 left-8 md:-translate-x-1/2 md:-rotate-90">
          Slowdown relative to the fastest solver
        </div>
        <ChartResultsSections />
        <ChartResultsSections problemClass="MILP" />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-1 pl-4 md:pl-12">
        <div className="md:absolute top-1/2 left-8 md:-translate-x-1/2 md:-rotate-90">
          Problems solved within time and memory limits (%)
        </div>
        <ChartResultsSectionsVarians />
        <ChartResultsSectionsVarians problemClass="MILP" />
      </div>
    </div>
  );
};

export default GetStartedChart;
