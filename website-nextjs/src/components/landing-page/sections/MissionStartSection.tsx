import { BoldAltIcon, DollarSignIcon, SoftwareDevIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import MissionCard from "@/components/common/MissionCard";

const MissionStart = () => {
  return (
    <div className="text-white bg-navy pt-24 pb-16">
      <div className="mx-auto container px-4 lg:px-6">
        <div className="flex">
          <div className="w-1/3">
            <div className="text-stroke text-lg/1.1 uppercase font-medium font-league mb-4">
              Mission
            </div>
            <div className="text-4.5xl/1.4 font-extrabold font-lato text-stroke">
              WHO IS IT FOR?
            </div>
          </div>
          <h5 className="text-stroke font-lato font-medium text-lg/1.4 my-2 mb-14 w-2/3">
            This website is geared towards providing data and insights to all
            participants in the green energy transition.
          </h5>
        </div>

        <div className="grid gap-8 lg:flex justify-between text-stroke">
          <MissionCard
            Icon={SoftwareDevIcon}
            title="Solver Developers"
            description="Improve your solver algorithms and performance using our realistic and energy planning relevant benchmarks"
            linkText="Benchmark Details"
            linkHref={PATH_DASHBOARD.benchmarkDetail.list}
            wrapperClass="border-opacity-60"
          />
          <MissionCard
            Icon={BoldAltIcon}
            title="Energy Modellers"
            description="Use our performance data to pick the best solver for your application domain, hardware constraints, and budget"
            linkText="Compare Solvers"
            linkHref="/dashboard/compare-solvers"
            linkClass="mb-4"
            wrapperClass="border-opacity-10"
          />
          <MissionCard
            Icon={DollarSignIcon}
            title="Donors and Stakeholders"
            description="Track the evolution of solver performance over time, and maximize the potential return on your investment"
            linkText="Solver Performance History"
            linkHref="/dashboard/performance-history"
            wrapperClass="border-opacity-60"
          />
        </div>
      </div>
    </div>
  );
};
export default MissionStart;
