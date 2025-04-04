/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  BrightIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons";
import { useSelector } from "react-redux";
import Popup from "reactjs-popup";
import { IResultState } from "@/types/state";
import { IFilterBenchmarkDetails } from "@/types/benchmark";

const BenchmarkDetailFilterSection = ({
  setLocalFilters,
  localFilters,
  availableSectors,
  availableTechniques,
  availableKindOfProblems,
  availableModels,
  availableProblemSizes,
}: {
  setLocalFilters: React.Dispatch<
    React.SetStateAction<IFilterBenchmarkDetails>
  >;
  localFilters: IFilterBenchmarkDetails;
  availableSectors: string[];
  availableTechniques: string[];
  availableKindOfProblems: string[];
  availableModels: string[];
  availableProblemSizes: string[];
}) => {
  const router = useRouter();

  const rawBenchmarkResults = useSelector(
    (state: { results: IResultState }) => {
      return state.results.rawBenchmarkResults;
    },
  );

  const [filteredResults, setFilteredResults] =
    useState<any>(rawBenchmarkResults);

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

    setLocalFilters((prevFilters) => {
      const categoryKey = category as keyof IFilterBenchmarkDetails;
      const currentFilters = Array.isArray(prevFilters[categoryKey])
        ? [...prevFilters[categoryKey]]
        : [];

      if (only) {
        const newFilters = { ...prevFilters };
        newFilters[categoryKey] = [value];
        return newFilters;
      } else {
        const index = currentFilters.indexOf(value);
        if (index > -1) {
          currentFilters.splice(index, 1);
        } else {
          currentFilters.push(value);
        }

        return {
          ...prevFilters,
          [categoryKey]: currentFilters,
        };
      }
    });
  };

  const handleSelectAll = ({ category }: { category: string }) => {
    const categoryKey = category as keyof IFilterBenchmarkDetails;
    const availableItems = {
      sectors: availableSectors,
      technique: availableTechniques,
      kindOfProblem: availableKindOfProblems,
      modelName: availableModels,
      problemSize: availableProblemSizes,
    }[category] as string[];

    const selectedItems = (localFilters[categoryKey] as string[]) || [];

    const shouldSelectAll = selectedItems.length !== availableItems.length;

    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [categoryKey]: shouldSelectAll ? availableItems : [],
    }));
  };

  const encodeValue = (value: string) => {
    return encodeURIComponent(value);
  };

  const decodeValue = (value: string) => {
    return decodeURIComponent(value);
  };

  useEffect(() => {
    if (isInit) {
      updateUrlParams(localFilters);
      applyFiltersToResults();
    }
  }, [localFilters, isInit]);

  const applyFiltersToResults = () => {};

  const updateUrlParams = (filters: IFilterBenchmarkDetails) => {
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
    const filters: Partial<IFilterBenchmarkDetails> = {};

    [
      "sectors",
      "technique",
      "kindOfProblem",
      "modelName",
      "problemSize",
    ].forEach((key) => {
      const value = router.query[key];
      if (typeof value === "string") {
        filters[key as keyof IFilterBenchmarkDetails] = value
          ? (value.split(";").map(decodeValue) as string[])
          : [];
      }
    });

    return filters;
  };

  useEffect(() => {
    if (isInit) return;
    if (!router.isReady) return;

    const urlFilters = parseUrlParams();
    if (Object.keys(urlFilters).length > 0) {
      setLocalFilters((prevFilters) => ({
        ...prevFilters,
        ...urlFilters,
      }));
      setIsInit(true);
    }
  }, [router.query, router.isReady]);

  useEffect(() => {
    const handleRequestFilteredResults = () => {
      const filterEvent = new CustomEvent("benchmarkFiltersChanged", {
        detail: {
          filteredResults,
        },
      });
      window.dispatchEvent(filterEvent);
    };

    window.addEventListener(
      "requestBenchmarkFilteredResults",
      handleRequestFilteredResults,
    );

    return () => {
      window.removeEventListener(
        "requestBenchmarkFilteredResults",
        handleRequestFilteredResults,
      );

      const resetEvent = new CustomEvent("benchmarkFiltersChanged", {
        detail: {
          filteredResults: rawBenchmarkResults,
        },
      });
      window.dispatchEvent(resetEvent);
    };
  }, [filteredResults, rawBenchmarkResults]);

  const handleResetAllFilters = () => {
    if (isInit) {
      const resetFilters = {
        sectors: availableSectors,
        technique: availableTechniques,
        kindOfProblem: availableKindOfProblems,
        modelName: availableModels,
        problemSize: availableProblemSizes,
      };

      setLocalFilters(resetFilters);

      setFilteredResults(rawBenchmarkResults);

      const resetEvent = new CustomEvent("benchmarkFiltersChanged", {
        detail: {
          filteredResults: rawBenchmarkResults,
        },
      });
      window.dispatchEvent(resetEvent);

      router.replace(
        {
          pathname: router.pathname,
          query: {},
        },
        undefined,
        { shallow: true },
      );
    }
  };

  const isAnyFilterActive = () => {
    const allAvailableFilters = {
      sectors: availableSectors,
      technique: availableTechniques,
      kindOfProblem: availableKindOfProblems,
      modelName: availableModels,
      problemSize: availableProblemSizes,
    };

    return Object.entries(allAvailableFilters).some(
      ([key, availableValues]) => {
        const selectedValues =
          localFilters[key as keyof typeof localFilters] || [];
        return (
          Array.isArray(selectedValues) &&
          selectedValues.length < availableValues.length
        );
      },
    );
  };

  return (
    <div
      className={`bg-white rounded-xl my-2 relative ${
        isAnyFilterActive() ? "mt-10" : ""
      }`}
    >
      <div className="flex justify-end mb-2 absolute -top-8 left-0">
        {isAnyFilterActive() && (
          <button
            onClick={handleResetAllFilters}
            className="bg-navy text-white px-3 py-1 rounded text-xs hover:bg-opacity-80 transition-colors"
          >
            Reset All Filters
          </button>
        )}
      </div>
      <div className="flex text-dark-grey">
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
                (sector) => localFilters?.sectors?.includes(sector),
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
                  checked={localFilters?.sectors?.includes(sector)}
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
                (technique) => localFilters?.technique?.includes(technique),
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
                  checked={localFilters?.technique?.includes(technique)}
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
                  localFilters?.kindOfProblem?.includes(kindOfProblem),
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
                  checked={localFilters?.kindOfProblem?.includes(problem)}
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
                (modelName) => localFilters?.modelName?.includes(modelName),
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
                  checked={localFilters?.modelName?.includes(model)}
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

export default BenchmarkDetailFilterSection;
