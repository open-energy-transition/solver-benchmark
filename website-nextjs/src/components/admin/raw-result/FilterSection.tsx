import { useSelector } from "react-redux"
// internal
import { ResultState } from "@/redux/results/reducer"

const FilterSection = () => {
  const availableBenchmarksAndSizes = useSelector((state: { results: ResultState }) => {
    return state.results.availableBenchmarksAndSizes
  })

  const availableSolves = useSelector((state: { results: ResultState }) => {
    return state.results.availableSolves
  })

  const availableStatuses = useSelector((state: { results: ResultState }) => {
    return state.results.availableStatuses
  })

  return (
    <div className="rounded-xl bg-white p-6 pt-0">
      <div className="text-navy py-4 flex justify-between border-b border-grey">
        <div>Filter</div>
        <div className="text-dark-grey">Clear all</div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Benchmarks</div>
        <div className="grid gap-1 pt-2 max-h-40 overflow-y-auto">
          {availableBenchmarksAndSizes.map((benchmark) => (
            <div key={benchmark} className="flex items-center gap-1">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max text-dark-grey text-sm">{benchmark}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Solver</div>
        <div className="grid gap-1 pt-2">
          {availableSolves.map((solves) => (
            <div key={solves} className="flex items-center gap-1">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max text-dark-grey text-sm">{solves}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Status</div>
        <div className="grid gap-1 pt-2">
          {availableStatuses.map((status) => (
            <div key={status} className="flex items-center gap-1">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max text-dark-grey text-sm">{status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Status</div>
        <div className="flex gap-1 pt-2">
          <select
            name="solver1"
            className="w-full px-3 py-1 bg-white border-r-4 border-transparent outline outline-stroke outline-1 text-dark-grey text-base rounded-lg focus:ring-white focus:border-white block"
          >
            <option selected>Logic</option>
          </select>
          <button className="border flex items-center rounded-lg px-3 py-1 text-base text-dark-grey bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            seconds
          </button>
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Runtime</div>
        <div className="flex gap-1 pt-2">
          <select
            name="solver1"
            className="w-full px-3 py-1 bg-white border-r-4 border-transparent outline outline-stroke outline-1 text-dark-grey text-base rounded-lg focus:ring-white focus:border-white block"
          >
            <option selected>Logic</option>
          </select>
          <button className="border flex items-center rounded-lg px-3 py-1 text-base text-dark-grey bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            MB
          </button>
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Objective Value</div>
        <div className="flex gap-1 pt-2">
          <select
            name="solver1"
            className="w-full px-3 py-1 bg-white border-r-4 border-transparent outline outline-stroke outline-1 text-dark-grey text-base rounded-lg focus:ring-white focus:border-white block"
          >
            <option selected>Logic</option>
          </select>
          <button className="border flex items-center rounded-lg px-3 py-1 text-base text-dark-grey bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            MB
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterSection
