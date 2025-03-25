import {
  BrightIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons";
import { useSelector, useDispatch } from "react-redux";
import filterAction from "@/redux/filters/actions";
import Popup from "reactjs-popup";
import { IFilterState, IResultState } from "@/types/state";

const FilterSection = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<any>();

  const selectedFilters = useSelector(
    (state: { filters: IFilterState }) => state.filters,
  );

  const availableSectors = useSelector(
    (state: { results: IResultState }) => state.results.availableSectors,
  );

  const availableTechniques = useSelector(
    (state: { results: IResultState }) => state.results.availableTechniques,
  );

  const availableKindOfProblems = useSelector(
    (state: { results: IResultState }) => state.results.availableKindOfProblems,
  );

  const availableModels = useSelector(
    (state: { results: IResultState }) => state.results.availableModels,
  );

  const availableProblemSizes = useSelector(
    (state: { results: IResultState }) => state.results.availableProblemSizes,
  );

  const handleCheckboxChange = ({
    category,
    value,
    only = false,
  }: {
    category: string;
    value: string;
    only?: boolean;
  }) => {
    dispatch(
      filterAction.toggleFilterAndUpdateResults({ category, value, only }),
    );
  };

  return (
    <div className="bg-white rounded-xl my-2">
      <div className="flex text-dark-grey">
        {/* Sectors */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6 sticky">
            <BrightIcon className="w-5 h-5" />
            <span>Sectors</span>
          </div>
          <div className="text-xs max-h-[95px] overflow-y-auto">
            {availableSectors.map((sector) => (
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
                  className="w-max cursor-pointer max-w-[70px] text-ellipsis whitespace-nowrap overflow-hidden"
                >
                  <Popup
                    on={["hover"]}
                    trigger={() => <span>{sector}</span>}
                    position="top right"
                    closeOnDocumentClick
                    arrowStyle={{ color: "#ebeff2" }}
                  >
                    <div className="bg-stroke p-2 rounded">{sector}</div>
                  </Popup>
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
          <div className="text-xs max-h-[95px] overflow-y-auto">
            {availableTechniques.map((technique) => (
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
                  <Popup
                    on={["hover"]}
                    trigger={() => <span>{technique}</span>}
                    position="top right"
                    closeOnDocumentClick
                    arrowStyle={{ color: "#ebeff2" }}
                  >
                    <div className="bg-stroke p-2 rounded">{technique}</div>
                  </Popup>
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
          <div className="grid grid-cols-[max-content_max-content] gap-x-1 text-xs max-h-[95px] overflow-y-auto">
            {availableKindOfProblems.map((problem) => (
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
                  <Popup
                    on={["hover"]}
                    trigger={() => <span>{problem}</span>}
                    position="top right"
                    closeOnDocumentClick
                    arrowStyle={{ color: "#ebeff2" }}
                  >
                    <div className="bg-stroke p-2 rounded">{problem}</div>
                  </Popup>
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
        <div className="text-xs border-r border-stroke  w-[40%]">
          <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
            <WrenchIcon className="w-5 h-5" />
            <span>Problem Size</span>
          </div>
          <div className="grid grid-cols-2 gap-x-1 text-xs max-h-[95px] overflow-y-auto">
            {availableProblemSizes.map((size) => (
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
          <div className="grid grid-cols-3 gap-x-2 text-xs max-h-[95px] overflow-y-auto">
            {availableModels.map((model) => (
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
                  <Popup
                    on={["hover"]}
                    trigger={() => <span>{model}</span>}
                    position="top right"
                    closeOnDocumentClick
                    arrowStyle={{ color: "#ebeff2" }}
                  >
                    <div className="bg-stroke p-2 rounded">{model}</div>
                  </Popup>
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
  );
};

export default FilterSection;
