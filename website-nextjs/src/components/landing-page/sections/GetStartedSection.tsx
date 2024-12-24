import { ArrowUpIcon } from "@/assets/icons"

const GetStarted = () => {
  return (
    <div className="text-white bg-navy px-2 md:px-20 py-10 border-t-2 border-solid border-white">
      <div className="mx-auto container px-6">
        <div className="text-dark-grey text-xl uppercase font-bold font-league">
          BENCHMARKS
        </div>
        <div className="text-6xl font-bold font-league my-5">
          WHAT DO WE HAVE?
        </div>
        <h5 className="text-lavender my-2 w-full md:w-7/12">
          Our platform consists of open-source, community-contributed benchmarks
          from leading open energy modelling systems. Our open benchmarking
          infrastructure runs them on multiple versions of leading solvers on
          multiple hardware configurations, to gather insights on how
          performance varies with benchmark size, computational resources, and
          solver evolution.
        </h5>
        <div className="gird md:flex justify-between text-stroke">
          <div className="py-9 text-center">
            <div className="text-9xl font-bold">04</div>
            <h5 className="mt-2">MACHINE CONFIGURATIONS</h5>
          </div>
          <div className="py-9 text-center">
            <div className="text-9xl font-bold">32</div>
            <h5 className="mt-2">BENCHMARKS</h5>
          </div>
          <div className="py-9 text-center">
            <div className="text-9xl font-bold">06</div>
            <h5 className="mt-2">SOLVERS</h5>
          </div>
        </div>
        <div
          className="mt-11 py-4 relative before:border-b before:border-teal before:border-opacity-50
        before:absolute before:bottom-0 before:left-0 before:w-[102%] before:transform before:-translate-x-[1%]
        flex justify-between"
        >
          <h5>GET STARTED</h5>
          <ArrowUpIcon className="text-white rotate-90 w-8 h-8" />
        </div>
      </div>
    </div>
  )
}
export default GetStarted
