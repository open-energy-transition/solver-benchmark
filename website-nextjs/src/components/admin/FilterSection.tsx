import {
  BrightIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons"
import { useSelector, useDispatch } from "react-redux"
import {
  Sector,
  Technique,
  KindOfProblem,
  Model,
  ProblemSize,
} from "@/constants"
import filterAction from "@/redux/filters/actions"
import { FilterState } from "@/redux/filters/reducer"

const FilterSection = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<any>()

  const selectedFilters = useSelector(
    (state: { filters: FilterState }) => state.filters
  )

  const handleCheckboxChange = ({
    category,
    value,
    only = false,
  }: {
    category: string
    value: string
    only?: boolean
  }) => {
    dispatch(
      filterAction.toggleFilterAndUpdateResults({ category, value, only })
    )
  }

  const getLabel = (type: string, value: string) => {
    switch (type) {
      case "sectors":
        switch (value) {
          case Sector.SectorCoupled:
            return "Sector coupled"

          default:
            return value
        }
      case "model":
        switch (value) {
          case Model.GenX:
            return "Gen X"
          case Model.PowerModel:
            return "Power Model"
          case Model.PyPSAEur:
            return "PyPSA - Eur"
          default:
            return value
        }
      case "kindOfProblem":
        switch (value) {
          case KindOfProblem.SteadyStateOptimalPowerFlow:
            return "Steady-state power flow "
          default:
            return value
        }
      default:
        throw Error("Invalid value")
    }
  }

  return (
    <div className="bg-white rounded-xl my-2">
      <div className="flex text-dark-grey">
        {/* Sectors */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6">
            <BrightIcon className="w-5 h-5" />
            <span>Sectors</span>
          </div>
          <div className="text-xs">
            {Object.values(Sector).map((sector) => (
              <div
                className="flex items-center gap-1 p-3 relative group"
                key={sector}
              >
                <input
                  className="w-4 h-4 accent-navy rounded"
                  type="checkbox"
                  checked={selectedFilters?.sectors?.includes(sector)}
                  onChange={() =>
                    handleCheckboxChange({
                      category: "sectors",
                      value: sector,
                    })
                  }
                />
                <span
                  onClick={() =>
                    handleCheckboxChange({
                      category: "sectors",
                      value: sector,
                    })
                  }
                  className="w-max cursor-pointer max-w-[30px]"
                >
                  {getLabel("sectors", sector)}
                </span>

                <span
                  className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
                  onClick={() =>
                    handleCheckboxChange({
                      category: "sectors",
                      value: sector,
                      only: true,
                    })
                  }
                >
                  only
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Technique */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6">
            <ProcessorIcon className="w-5 h-5" />
            <span>Technique</span>
          </div>
          <div className="text-xs">
            {Object.values(Technique).map((technique) => (
              <div
                className="flex items-center gap-1 p-3 relative group"
                key={technique}
              >
                <input
                  className="w-4 h-4 accent-navy rounded"
                  type="checkbox"
                  checked={selectedFilters?.technique?.includes(technique)}
                  onChange={() =>
                    handleCheckboxChange({
                      category: "technique",
                      value: technique,
                    })
                  }
                />
                <span
                  onClick={() =>
                    handleCheckboxChange({
                      category: "technique",
                      value: technique,
                    })
                  }
                  className="w-max cursor-pointer"
                >
                  {technique}
                </span>
                <span
                  className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
                  onClick={() =>
                    handleCheckboxChange({
                      category: "technique",
                      value: technique,
                      only: true,
                    })
                  }
                >
                  only
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kind of Problem */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <WrenchIcon className="w-5 h-5" />
            <span>Kind of Problem</span>
          </div>
          <div className="grid grid-cols-[max-content_max-content] gap-x-1 text-xs">
            {Object.values(KindOfProblem).map((problem) => (
              <div
                className="flex items-center gap-1 p-3 relative group"
                key={problem}
              >
                <input
                  className="w-4 h-4 accent-navy rounded"
                  type="checkbox"
                  checked={selectedFilters?.kindOfProblem?.includes(problem)}
                  onChange={() =>
                    handleCheckboxChange({
                      category: "kindOfProblem",
                      value: problem,
                    })
                  }
                />
                <span
                  onClick={() =>
                    handleCheckboxChange({
                      category: "kindOfProblem",
                      value: problem,
                    })
                  }
                  className="w-max cursor-pointer"
                >
                  {getLabel("kindOfProblem", problem)}
                </span>
                <span
                  className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
                  onClick={() =>
                    handleCheckboxChange({
                      category: "kindOfProblem",
                      value: problem,
                      only: true,
                    })
                  }
                >
                  only
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Problem Size */}
        <div className="text-xs border-r border-stroke  w-[60%]">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <WrenchIcon className="w-5 h-5" />
            <span>Problem Size</span>
          </div>
          <div className="grid grid-cols-3 gap-x-1 text-xs">
            {Object.values(ProblemSize).map((size) => (
              <div
                className="flex items-center gap-1 p-3 relative group"
                key={size}
              >
                <input
                  className="w-4 h-4 accent-navy rounded"
                  type="checkbox"
                  checked={selectedFilters?.problemSize?.includes(size)}
                  onChange={() =>
                    handleCheckboxChange({
                      category: "problemSize",
                      value: size,
                    })
                  }
                />
                <span
                  onClick={() =>
                    handleCheckboxChange({
                      category: "problemSize",
                      value: size,
                    })
                  }
                  className="w-max cursor-pointer uppercase"
                >
                  {size}
                </span>
                <span
                  className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
                  onClick={() =>
                    handleCheckboxChange({
                      category: "problemSize",
                      value: size,
                      only: true,
                    })
                  }
                >
                  only
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Model */}
        <div className="text-xs border-r border-stroke w-full">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <PolygonIcon className="w-5 h-5" />
            <span>Model</span>
          </div>
          <div className="grid grid-cols-3 gap-x-2 text-xs">
            {Object.values(Model).map((model) => (
              <div
                className="flex items-center gap-1 p-3 relative group"
                key={model}
              >
                <input
                  className="w-4 h-4 accent-navy rounded"
                  type="checkbox"
                  checked={selectedFilters?.modelName?.includes(model)}
                  onChange={() =>
                    handleCheckboxChange({
                      category: "modelName",
                      value: model,
                    })
                  }
                />
                <span
                  onClick={() =>
                    handleCheckboxChange({
                      category: "modelName",
                      value: model,
                    })
                  }
                  className="w-max cursor-pointer"
                >
                  {getLabel("model", model)}
                </span>
                <span
                  className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
                  onClick={() =>
                    handleCheckboxChange({
                      category: "modelName",
                      value: model,
                      only: true,
                    })
                  }
                >
                  only
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterSection
