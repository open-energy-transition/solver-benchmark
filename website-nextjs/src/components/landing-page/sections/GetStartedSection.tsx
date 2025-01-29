import { ArrowUpIcon } from "@/assets/icons"

const GetStarted = () => {
  return (
    <div className="text-white bg-navy border-t-2 border-solid border-white">
      <div className="mx-auto container px-4 lg:px-6 pt-[67px] pb-16">
        <div className="text-dark-grey text-xl uppercase font-bold font-league mb-4">
          BENCHMARKS
        </div>
        <div className="text-[4rem] leading-1.1 font-bold font-league mb-2">
          WHAT DO WE HAVE?
        </div>
        <h5 className="text-lavender leading-1.4 max-w-4xl mb-2.5">
          Our platform consists of open-source, community-contributed benchmarks
          from leading open energy modelling systems. Our open benchmarking
          infrastructure runs them on multiple versions of leading solvers on
          multiple hardware configurations, to gather insights on how
          performance varies with benchmark size, computational resources, and
          solver evolution.
        </h5>
        <div className="gird md:flex justify-between text-stroke">
          <div className="py-9 text-center flex-1">
            <div className="text-9xl leading-1.2 font-league font-bold">04</div>
            <h5 className="text-lavender leading-1.4">
              MACHINE CONFIGURATIONS
            </h5>
          </div>
          <div className="py-9 text-center flex-1">
            <div className="text-9xl leading-1.2 font-league font-bold">32</div>
            <h5 className="text-lavender leading-1.4">BENCHMARKS</h5>
          </div>
          <div className="py-9 text-center flex-1">
            <div className="text-9xl leading-1.2 font-league font-bold">06</div>
            <h5 className="text-lavender leading-1.4">SOLVERS</h5>
          </div>
        </div>
        <div className="mt-9 py-1.5 px-2 relative border-b border-teal/50 flex justify-between items-center">
          <h5 id="contribution-section" className="text-lavender leading-1.4">
            GET STARTED
          </h5>
          <ArrowUpIcon className="text-white rotate-90 size-6" />
        </div>
      </div>
    </div>
  )
}
export default GetStarted
