import {
  BrightIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons"

const FilterSection = () => {
  return (
    <div className="bg-white rounded-xl my-4">
      <div className="flex text-dark-grey">
        <div className="text-green-pop px-6 flex items-center border-r border-stroke gap-1">
          <svg
            width="18"
            height="12"
            viewBox="0 0 18 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.9234 6.00033L14.0772 6.00032M1.66699 1.41699L16.3337 1.41699M7.30802 10.5837L10.6926 10.5837"
              stroke="#6B9080"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Filter
        </div>
        {/* Sectors */}
        <div className="text-xs">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6">
            <BrightIcon className="w-5 h-5" />
            <span>Sectors</span>
          </div>
          <div className="text-xs">
            {/* Power */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Power</span>
            </div>
            {/* Sector coupled */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Sector coupled</span>
            </div>
          </div>
        </div>
        {/* Technique */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6">
            <ProcessorIcon className="w-5 h-5" />
            <span>Technique</span>
          </div>
          <div className="text-xs">
            {/* MILP */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">MILP</span>
            </div>
            {/* LP */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">LP</span>
            </div>
          </div>
        </div>
        {/* Kind of Problem */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <WrenchIcon className="w-5 h-5" />
            <span>Kind of Problem</span>
          </div>
          <div className="grid grid-cols-[max-content_max-content] gap-x-1 text-xs">
            {/* Infrastructure */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Infrastructure</span>
            </div>
            {/* Operational */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Operational</span>
            </div>
            {/* DC optimal power flow */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">DC optimal power flow</span>
            </div>
            {/* Steady-state optimal power flow  */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Steady-state optimal power flow </span>
            </div>
          </div>
        </div>
        {/* Model */}
        <div className="text-xs border-r border-stroke w-full">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <PolygonIcon className="w-5 h-5" />
            <span>Model</span>
          </div>
          <div className="grid grid-cols-3 gap-x-2 text-xs">
            {/* PyPSA */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">PyPSA</span>
            </div>
            {/* PyPSA - Eur */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">PyPSA - Eur</span>
            </div>
            {/* Power Model */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Power Model</span>
            </div>
            {/* Tulipa */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Tulipa</span>
            </div>
            {/* Sienna */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Sienna</span>
            </div>
            {/* Gen X */}
            <div className="flex items-center gap-1 p-3">
              <input className="w-4 h-4 accent-navy rouned" type="checkbox" />
              <span className="w-max">Gen X</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default FilterSection
