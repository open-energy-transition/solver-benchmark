import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  BrightIcon,
  PolygonIcon,
  ProblemSizeIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons";
import { useSelector, useDispatch } from "react-redux";
import filterAction from "@/redux/filters/actions";
import { IFilterState, IResultState } from "@/types/state";
import filterActions from "@/redux/filters/actions";
import resultActions from "@/redux/results/actions";
import { getLatestBenchmarkResult } from "@/utils/results";
import { isArray } from "lodash";
import FilterGroup from "./filters/FilterGroup";

const FilterSection = () => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<any>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Reset all filters function
  const handleResetAllFilters = () => {
    if (isInit) {
      // Reset all filters to include all available options
      dispatch(
        filterActions.setFilter({
          sectors: availableSectors,
          technique: availableTechniques,
          kindOfProblem: availableKindOfProblems,
          modelName: availableModels,
          problemSize: availableProblemSizes,
        } as IFilterState),
      );

      // Update results with new filters
      dispatch(resultActions.setBenchmarkResults(rawBenchmarkResults));
      dispatch(
        resultActions.setBenchmarkLatestResults(
          getLatestBenchmarkResult(rawBenchmarkResults),
        ),
      );

      // Clear URL parameters
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

  // Check if any filter is active
  const isAnyFilterActive = () => {
    const allAvailableFilters = {
      sectors: availableSectors,
      technique: availableTechniques,
      kindOfProblem: availableKindOfProblems,
      modelName: availableModels,
      problemSize: availableProblemSizes,
    };

    // Check if any filter category has fewer selected items than available items
    return Object.entries(allAvailableFilters).some(
      ([key, availableValues]) => {
        const selectedValues =
          selectedFilters[key as keyof typeof selectedFilters] || [];
        return (
          Array.isArray(selectedValues) &&
          selectedValues.length < availableValues.length
        );
      },
    );
  };

  return (
    <div>
      <div className="pt-2.5 px-8 pb-2 flex items-center justify-between gap-1 border-stroke border-b">
        <div className="flex gap-1 items-center">
          <div className="text-navy font-bold text-base pl-2">Filter</div>
        </div>

        <div className="flex justify-end ml-2">
          {isAnyFilterActive() && (
            <button
              onClick={handleResetAllFilters}
              className="text-[9px]/1.4 text-[#444444] font-normal font-lato px-3 py-1 rounded hover:bg-opacity-80 transition-colors"
            >
              select all
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Mobile Menu Button */}
        <button
          className="xl:hidden w-full p-3 text-left text-dark-grey flex items-center justify-between 4xl:text-xl"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span>Filters</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isMobileMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div
          className={`
            duration-300
            flex
            flex-col
            gap-2
            overflow-y-auto
            p-2
            px-4
            text-dark-grey
            transition-all
            xl:h-[calc(100vh-5rem-var(--banner-height))]
            ${
              isMobileMenuOpen
                ? "max-h-[80vh] opacity-100"
                : "max-h-0 xl:max-h-none opacity-0 xl:opacity-100 overflow-hidden"
            }`}
        >
          {/* Sectors */}
          <FilterGroup
            title="Sectors"
            icon={<BrightIcon className="w-5 h-5" />}
            items={availableSectors}
            selectedItems={selectedFilters?.sectors}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "sectors", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({ category: "sectors", value, only: true })
            }
            onSelectAll={() => handleSelectAll({ category: "sectors" })}
            className="w-full"
            itemClassName="4xl:text-xl"
            gridClassName="grid-cols-1"
            uppercase={false}
          />
          {/* Technique */}
          <FilterGroup
            title="Technique"
            icon={<ProcessorIcon className="w-5 h-5" />}
            items={availableTechniques}
            selectedItems={selectedFilters?.technique}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "technique", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({ category: "technique", value, only: true })
            }
            onSelectAll={() => handleSelectAll({ category: "technique" })}
            className="w-full"
            gridClassName="grid-cols-1"
            uppercase={false}
          />
          {/* Kind of Problem */}
          <FilterGroup
            title="Kind of Problem"
            icon={<WrenchIcon className="w-5 h-5" />}
            items={availableKindOfProblems}
            selectedItems={selectedFilters?.kindOfProblem}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "kindOfProblem", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "kindOfProblem",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "kindOfProblem" })}
            className="w-full"
            gridClassName="grid-cols-1"
            uppercase={false}
          />
          {/* Problem Size */}
          <FilterGroup
            title="Problem Size"
            icon={<ProblemSizeIcon className="w-5 h-5" />}
            items={availableProblemSizes}
            selectedItems={selectedFilters?.problemSize}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "problemSize", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "problemSize",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "problemSize" })}
            className="w-full"
            gridClassName="grid-cols-1"
            uppercase={true}
          />
          {/* Model */}
          <FilterGroup
            title="Model"
            icon={<PolygonIcon className="w-5 h-5" />}
            items={availableModels}
            selectedItems={selectedFilters?.modelName}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "modelName", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({ category: "modelName", value, only: true })
            }
            onSelectAll={() => handleSelectAll({ category: "modelName" })}
            className="w-full"
            gridClassName="grid-cols-1"
            uppercase={false}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
