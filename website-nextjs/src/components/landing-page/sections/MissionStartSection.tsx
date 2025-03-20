import {
  ArrowUpIcon,
  LampOnIcon,
  LayoutGroupIcon,
  UsersAltIcon,
} from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";

const MissionStart = () => {
  return (
    <div className="text-white bg-navy pt-24 pb-16">
      <div className="mx-auto container px-4 lg:px-6">
        <div className="text-white text-xl leading-1.1 uppercase font-bold font-league mb-4">
          Mission
        </div>
        <div className="text-6.5xl leading-1.2 font-bold font-league">
          WHO IS IT FOR?
        </div>
        <h5 className="text-lavender my-2 mb-14">
          This website is geared towards providing data and insights to all
          participants in the green energy transition.
        </h5>
        <div className="grid gap-8 lg:flex justify-between text-stroke">
          <div className="py-6 lg:py-3 px-6 rounded-lg bg-white bg-opacity-30 w-full lg:w-96 flex flex-col">
            <div>
              <LayoutGroupIcon />
            </div>
            <h5 className="my-4 font-league font-bold text-2xl uppercase">
              Solver Developers
            </h5>
            <div className="flex-1">
              <h6>
                Improve your solver algorithms and performance using our
                realistic and energy planning relevant benchmarks
              </h6>
            </div>
            <Link
              href={PATH_DASHBOARD.benchmarkDetail.list}
              className="mt-6 px-3 pt-7 lg:py-7 relative flex justify-between"
            >
              <div>
                <h6 className="font-bold">Benchmark Details</h6>
              </div>
              <ArrowUpIcon className="text-white rotate-90 w-6 h-6" />
            </Link>
          </div>
          <div className="py-6 lg:py-3 px-6 rounded-lg bg-white bg-opacity-20 w-full lg:w-96 flex flex-col">
            <div>
              <LampOnIcon />
            </div>
            <h5 className="my-4 font-league font-bold text-2xl uppercase">
              Energy Modellers
            </h5>
            <div className="flex-1">
              <h6>
                Use our performance data to pick the best solver for your
                application domain, hardware constraints, and budget
              </h6>
            </div>
            <Link
              href="/dashboard/compare-solvers"
              className="mt-6 px-3 pt-7 lg:py-7 relative flex justify-between"
            >
              <h6 className="font-bold">Compare Solvers</h6>
              <ArrowUpIcon className="text-white rotate-90 w-6 h-6" />
            </Link>
          </div>
          <div className="py-6 lg:py-3 px-6 rounded-lg bg-white bg-opacity-20 w-full lg:w-96 flex flex-col">
            <div>
              <UsersAltIcon />
            </div>
            <h5 className="my-4 font-league font-bold text-2xl uppercase">
              Donors and Stakeholders
            </h5>
            <div className="flex-1">
              <h6>
                Track the evolution of solver performance over time, and
                maximize the potential return on your investment
              </h6>
            </div>
            <Link
              href="/dashboard/performance-history"
              id="faq-section"
              className="mt-6 px-3 pt-7 lg:py-7 relative flex justify-between"
            >
              <h6 className="font-bold">Solver Performance History</h6>
              <ArrowUpIcon className="text-white rotate-90 w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MissionStart;
