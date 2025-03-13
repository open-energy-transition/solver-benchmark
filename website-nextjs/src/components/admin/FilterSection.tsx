import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
import filterActions from "@/redux/filters/actions";
import resultActions from "@/redux/results/actions";
import { getLatestBenchmarkResult } from "@/utils/results";
import { isArray } from "lodash";

const FilterSection = () => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<any>();

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.rawBenchmarkResults;
    },
  );

  const rawMetaData = useSelector((state: { results: IResultState }) => {
    return state.results.rawMetaData;
  });

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

  const [isInit, setIsInit] = useState(false);

  const handleCheckboxChange = ({
    category,
    value,
    only = false,
  }: {
    category: string;
    value: string;
    only?: boolean;
  }) => {
    setIsInit(true);
    dispatch(
      filterAction.toggleFilterAndUpdateResults({ category, value, only }),
    );
  };

  const handleSelectAll = ({ category }: { category: string }) => {
    const availableItems = {
      sectors: availableSectors,
      technique: availableTechniques,
      kindOfProblem: availableKindOfProblems,
      modelName: availableModels,
      problemSize: availableProblemSizes,
    }[category] as string[];

    const selectedItems = (selectedFilters[
      category as keyof typeof selectedFilters
    ] || []) as string[];

    // Toggle all items based on current state
    const shouldSelectAll = selectedItems.length !== availableItems.length;

    // Get items to toggle
    const itemsToToggle = shouldSelectAll
      ? availableItems.filter((item) => !selectedItems.includes(item)) // Select missing items
      : availableItems; // Deselect all items
    // Apply changes
    itemsToToggle.forEach((item) =>
      handleCheckboxChange({
        category,
        value: item,
      }),
    );
  };

  // Add these utility functions
  const encodeValue = (value: string) => {
    return encodeURIComponent(value);
  };

  const decodeValue = (value: string) => {
    return decodeURIComponent(value);
  };

  useEffect(() => {
    if (isInit) {
      updateUrlParams(selectedFilters);
    }
  }, [selectedFilters]);

  const updateUrlParams = (filters: IFilterState) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        queryParams.set(key, values.map(encodeValue).join(";"));
      }
    });

    router.replace(
      {
        pathname: router.pathname,
        query: Object.fromEntries(queryParams),
      },
      undefined,
      { shallow: true },
    );
  };

  const parseUrlParams = () => {
    const filters: Partial<IFilterState> = {};

    [
      "sectors",
      "technique",
      "kindOfProblem",
      "modelName",
      "problemSize",
    ].forEach((key) => {
      const value = router.query[key];
      if (typeof value === "string") {
        // @ts-expect-error Type inference issues with dynamic keys
        filters[key as keyof IFilterState] = value
          ? (value.split(";").map(decodeValue) as string[])
          : [];
      }
    });

    return filters;
  };

  useEffect(() => {
    return () => {
      dispatch(
        filterActions.setFilter({
          sectors: availableSectors,
          technique: availableTechniques,
          kindOfProblem: availableKindOfProblems,
          modelName: availableModels,
          problemSize: availableProblemSizes,
        } as IFilterState),
      );
      dispatch(resultActions.setBenchmarkResults(rawBenchmarkResults));
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(rawBenchmarkResults),
        ),
      );
      dispatch(resultActions.setMetaData(rawMetaData));
    };
  }, []);

  useEffect(() => {
    if (isInit) return;
    if (!router.isReady) return;

    const urlFilters = parseUrlParams();
    console.log(selectedFilters, urlFilters);
    if (Object.keys(urlFilters).length > 0) {
      Object.keys(selectedFilters).forEach((key) => {
        if (
          isArray(urlFilters[key as keyof IFilterState]) &&
          (selectedFilters[key as keyof IFilterState] as string[]).length !==
            (urlFilters[key as keyof IFilterState] as string[]).length
        ) {
          const selectedFilterValues =
            selectedFilters[key as keyof IFilterState];
          if (Array.isArray(selectedFilterValues)) {
            selectedFilterValues
              .filter((filterValue) => {
                const filterArray = urlFilters[key as keyof IFilterState];
                return (
                  Array.isArray(filterArray) &&
                  !filterArray.includes(filterValue)
                );
              })
              .forEach((filterValue) => {
                handleCheckboxChange({
                  category: key,
                  value: filterValue,
                });
              });
          }
        }
      });
    }
  }, [router.query, selectedFilters]);

  return (
    <div className="bg-white rounded-xl my-2">
      <div className="flex text-dark-grey">
        {/* Sectors */}
        <div className="text-xs border-r border-stroke">
          <div className="flex items-center justify-between px-3 border-b border-stroke">
            <div className="flex items-center py-2 gap-1 pr-6 sticky">
              <BrightIcon className="w-5 h-5" />
              <span>Sectors</span>
            </div>
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={availableSectors.every(
                (sector) => selectedFilters?.sectors?.includes(sector),
              )}
              onChange={() =>
                handleSelectAll({
                  category: "sectors",
                })
              }
            />
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
          <div className="flex items-center justify-between px-3 border-b border-stroke">
            <div className="flex items-center border-b border-stroke px-3 py-2 gap-1 pr-6">
              <ProcessorIcon className="w-5 h-5" />
              <span>Technique</span>
            </div>
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={availableTechniques.every(
                (technique) => selectedFilters?.technique?.includes(technique),
              )}
              onChange={() =>
                handleSelectAll({
                  category: "technique",
                })
              }
            />
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
          <div className="flex items-center justify-between px-3 border-b border-stroke">
            <div className="flex items-center border-b border-stroke py-2 gap-1">
              <WrenchIcon className="w-5 h-5" />
              <span>Kind of Problem</span>
            </div>
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={availableKindOfProblems.every(
                (kindOfProblem) =>
                  selectedFilters?.kindOfProblem?.includes(kindOfProblem),
              )}
              onChange={() =>
                handleSelectAll({
                  category: "kindOfProblem",
                })
              }
            />
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
          <div className="flex items-center justify-between pr-3 border-b border-stroke">
            <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
              <WrenchIcon className="w-5 h-5" />
              <span>Problem Size</span>
            </div>
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={availableProblemSizes.every(
                (problemSize) =>
                  selectedFilters?.problemSize?.includes(problemSize),
              )}
              onChange={() =>
                handleSelectAll({
                  category: "problemSize",
                })
              }
            />
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
          <div className="flex items-center justify-between pr-3 border-b border-stroke">
            <div className="flex items-center border-b border-stroke px-3 py-2 gap-1">
              <PolygonIcon className="w-5 h-5" />
              <span>Model</span>
            </div>
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={availableModels.every(
                (modelName) => selectedFilters?.modelName?.includes(modelName),
              )}
              onChange={() =>
                handleSelectAll({
                  category: "modelName",
                })
              }
            />
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
