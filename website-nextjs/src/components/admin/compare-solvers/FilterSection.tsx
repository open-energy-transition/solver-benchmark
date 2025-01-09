import {
  BrightIcon,
  CloseIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons"

const FilterSection = () => {
  return (
    <div className="flex gap-4 my-6">
      {/* Sectors */}
      <div className="bg-white rounded-xl py-2 px-3">
        <div className="flex gap-4">
          Sectors <BrightIcon />
        </div>
        <div className="flex gap-2 my-2">
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-green-pop font-bold bg-green-pop bg-opacity-20 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Sector coupled
            <CloseIcon className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-white font-bold bg-green-pop bg-opacity-40 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Power
            <CloseIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
      {/* Technique */}
      <div className="bg-white rounded-xl py-2 px-3">
        <div className="flex gap-4">
          Technique <ProcessorIcon />
        </div>
        <div className="flex gap-2 my-2">
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-green-pop font-bold bg-green-pop bg-opacity-20 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            LP
            <CloseIcon className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-white font-bold bg-green-pop bg-opacity-40 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            MLIP
            <CloseIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
      {/* Kind of problem */}
      <div className="bg-white rounded-xl py-2 px-3">
        <div className="flex gap-4">
          Kind of problem <WrenchIcon />
        </div>
        <div className="flex gap-2 my-2">
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-green-pop font-bold bg-green-pop bg-opacity-20 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Infrastructure
            <CloseIcon className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-white font-bold bg-green-pop bg-opacity-40 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Operational
            <CloseIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
      {/* Model name */}
      <div className="bg-white rounded-xl py-2 px-3">
        <div className="flex gap-4">
          Model name <PolygonIcon />
        </div>
        <div className="flex gap-2 my-2">
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-green-pop font-bold bg-green-pop bg-opacity-20 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Pypsa
            <CloseIcon className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 w-max rounded-lg px-6 py-3 text-base text-white font-bold bg-green-pop bg-opacity-40 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Pypsa Eur
            <CloseIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
      </div>
    </div>
  )
}
export default FilterSection
