import { ArrowIcon } from "@/assets/icons"

const ResultsSection = () => {
  return (
    <div>
      <div className="pb-3">
        <div className="text-navy font-bold text-xl">Results</div>
        <div className="text-dark-grey">
          We rank solvers by normalized shifted geometric mean (SGM) of runtime
          and memory consumption over all benchmarks
        </div>
      </div>
      <div className="flex">
        <div
          className="text-left bg-light-grey bg-opacity-50 text-dark-grey pl-3 pr-6 py-1
        rounded-tl-2xl rounded-bl-2xl
        "
        >
          <div className="pr-6">Rank:</div>
          <div>1</div>
          <div>2</div>
          <div>3</div>
        </div>
        <div className="text-left text-dark-grey bg-light-grey w-1/6 pl-3 pr-6 py-1">
          <div>Solver: </div>
          <div>HiGHS</div>
          <div>GLPK</div>
          <div>SCIP</div>
        </div>
        <div className="bg-lavender text-navy text-left bg-opacity-50 font-bold w-1/5 pl-3 pr-6 py-1">
          <div>Version</div>
          <div>1.81</div>
          <div>9.1.1</div>
          <div>5.0</div>
        </div>
        <div className="bg-lavender text-navy text-right bg-opacity-50 font-bold w-1/5 pl-3 pr-6 py-1">
          <div className="text-left flex gap-1 items-center">
            Memory
            <ArrowIcon fill="none" stroke="black" className="w-2 h-2" />
          </div>
          <div>3.4</div>
          <div>1.0</div>
          <div>5.6</div>
        </div>
        <div className="bg-lavender text-navy text-right bg-opacity-80 font-bold w-1/5 pl-3 pr-6 py-1">
          <div className="text-left flex gap-1 items-center">
            Solved Benchmarks
            <ArrowIcon fill="none" stroke="black" className="w-2 h-2" />
          </div>
          <div>28</div>
          <div>18</div>
          <div>8</div>
        </div>
        <div
          className="bg-lime-green text-navy text-right font-bold w-1/5 pl-3 pr-6 py-1
        rounded-tr-2xl rounded-br-2xl
        "
        >
          <div className="text-left flex gap-1 items-center">
            Runtime
            <ArrowIcon fill="none" stroke="black" className="w-2 h-2" />
          </div>
          <div>1.0</div>
          <div>2.1</div>
          <div>3.4</div>
        </div>
      </div>
    </div>
  )
}

export default ResultsSection
