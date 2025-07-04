import { BoldAltIcon, DollarSignIcon, SoftwareDevIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import MissionCard from "@/components/common/MissionCard";

const MissionStart = () => {
  return (
    <div
      id="mission"
      className="text-white bg-navy pt-24 pb-16 scroll-mt-16 lg:scroll-mt-28"
    >
      <div className="mx-auto max-w-8xl px-4 lg:px-[70px]">
        <div className="grid sm:flex">
          <div className="w-full sm:w-1/2 lg:w-1/3">
            <div className="tag-line-lg uppercase font-league mb-4">
              Mission
            </div>
            <h3 className="mb-8 text-stroke">WHO IS IT FOR?</h3>
          </div>
          <h5 className="text-stroke leading-1.4 tag-line-lg my-2 mb-14 w-full sm:w-2/3">
            This website is geared towards providing data and insights to all
            participants in the green energy transition.
          </h5>
        </div>
        <div className="grid gap-8 md:flex justify-between text-stroke">
          <MissionCard
            Icon={SoftwareDevIcon}
            title="Solver Developers"
            description="Improve your solver algorithms and performance using our realistic and energy planning relevant benchmarks"
            linkText="Benchmark Set"
            linkHref={PATH_DASHBOARD.benchmarkSet.list}
          />
          <MissionCard
            Icon={BoldAltIcon}
            title="Energy Modellers"
            description="Use our performance data to pick the best solver for your application domain, hardware constraints, and budget"
            linkText="Compare Solvers"
            linkHref={PATH_DASHBOARD.compareSolvers}
            linkClass="mb-4"
          />
          <MissionCard
            Icon={DollarSignIcon}
            title="Donors & Stakeholders"
            description="Track the evolution of solver performance over time, and maximize the potential return on your investment"
            linkText="Solver Performance History"
            linkHref={PATH_DASHBOARD.performanceHistory}
          />
        </div>
      </div>
    </div>
  );
};
export default MissionStart;
