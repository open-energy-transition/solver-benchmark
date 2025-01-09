const FilterSection = () => {
  return (
    <div className="rounded-xl bg-white p-6">
      <div className="text-navy py-4 flex justify-between border-b border-grey">
        <div>Filter</div>
        <div className="text-dark-grey">Clear all</div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Benchmarks</div>
        <div className="grid gap-1 pt-2">
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA eur-sec-2-24h
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA-eur-elec-trex-3-24h
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA-eur-elec-op-3-24h
            </span>
          </div>

          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA eur-elec-op-unconv-3-24h
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA eur-gas+sol+ely-1-1h
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">
              PyPSA eur-gas+sol+ely-ucgas-1-1h
            </span>
          </div>
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Solver</div>
        <div className="grid gap-1 pt-2">
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">Highs</span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">SCIP</span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">GLPK</span>
          </div>
        </div>
      </div>
      <div className="text-navy py-4 border-b border-grey">
        <div>Status</div>
        <div className="grid gap-1 pt-2">
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">Time out</span>
          </div>
          <div className="flex items-center gap-1">
            <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
            <span className="w-max text-dark-grey text-sm">OK</span>
          </div>
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
