import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  BrightIcon,
  ForkIcon,
  GlobeSearchIcon,
  PolygonIcon,
  ProblemSizeIcon,
  ProcessorIcon,
  WrenchIcon,
} from "@/assets/icons";
import { useSelector, useDispatch } from "react-redux";
import filterAction from "@/redux/filters/actions";
import { IFilterState, IResultState, RealisticOption } from "@/types/state";
import filterActions from "@/redux/filters/actions";
import resultActions from "@/redux/results/actions";
import { getLatestBenchmarkResult } from "@/utils/results";
import { isArray } from "lodash";
import FilterGroup from "./filters/FilterGroup";
import { decodeValue, encodeValue } from "@/utils/urls";

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

  const availableSectoralFocus = useSelector(
    (state: { results: IResultState }) => state.results.availableSectoralFocus,
  );

  const availableSectors = useSelector(
    (state: { results: IResultState }) => state.results.availableSectors,
  );

  const availableProblemClasses = useSelector(
    (state: { results: IResultState }) => state.results.availableProblemClasses,
  );

  const availableApplications = useSelector(
    (state: { results: IResultState }) => state.results.availableApplications,
  );

  const availableModels = useSelector(
    (state: { results: IResultState }) => state.results.availableModels,
  );

  const availableProblemSizes = useSelector(
    (state: { results: IResultState }) => state.results.availableProblemSizes,
  );

  const realisticOptions = useSelector(
    (state: { results: IResultState }) => state.results.realisticOptions,
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
    dispatch(
      filterAction.toggleFilterAndUpdateResults({ category, value, only }),
    );
  };

  const handleSelectAll = ({ category }: { category: string }) => {
    const availableItems = {
      sectoralFocus: availableSectoralFocus,
      sectors: availableSectors,
      problemClass: availableProblemClasses,
      application: availableApplications,
      modelName: availableModels,
      problemSize: availableProblemSizes,
      realistic: realisticOptions,
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
      "sectoralFocus",
      "sectors",
      "problemClass",
      "application",
      "modelName",
      "problemSize",
      "realistic",
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
          sectoralFocus: availableSectoralFocus,
          sectors: availableSectors,
          problemClass: availableProblemClasses,
          application: availableApplications,
          modelName: availableModels,
          problemSize: availableProblemSizes,
          realistic: [RealisticOption.Realistic, RealisticOption.Other],
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
    if (isInit || !selectedFilters.isReady) return;
    if (!router.isReady) return;

    const urlFilters = parseUrlParams();

    if (Object.keys(urlFilters).length > 0) {
      Object.keys(selectedFilters).forEach((key) => {
        if (
          isArray(urlFilters[key as keyof IFilterState]) &&
          (selectedFilters[key as keyof IFilterState] as string[]).length !==
            (urlFilters[key as keyof IFilterState] as string[]).length
        ) {
          // If the selected filter values are not in the URL, remove them
          const selectedFilterValues =
            selectedFilters[key as keyof IFilterState];

          if (Array.isArray(selectedFilterValues)) {
            selectedFilterValues
              .filter((filterValue) => {
                // Check if the filter value is not in the URL
                const filterArray = urlFilters[key as keyof IFilterState];
                return (
                  Array.isArray(filterArray) &&
                  !(filterArray as RealisticOption[]).includes(
                    filterValue as RealisticOption,
                  )
                );
              })
              .forEach((filterValue) => {
                // Remove the filter value
                handleCheckboxChange({
                  category: key,
                  value: filterValue,
                });
              });
          }
        }
      });
    }
    setIsInit(true);
  }, [router.isReady, selectedFilters.isReady]);

  // Reset all filters function
  const handleResetAllFilters = () => {
    if (isInit) {
      // Reset all filters to include all available options
      dispatch(
        filterActions.setFilter({
          sectoralFocus: availableSectoralFocus,
          sectors: availableSectors,
          problemClass: availableProblemClasses,
          application: availableApplications,
          modelName: availableModels,
          problemSize: availableProblemSizes,
          realistic: [RealisticOption.Realistic, RealisticOption.Other],
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
      sectoralFocus: availableSectoralFocus,
      sectors: availableSectors,
      problemClass: availableProblemClasses,
      application: availableApplications,
      modelName: availableModels,
      problemSize: availableProblemSizes,
      realistic: [RealisticOption.Realistic, RealisticOption.Other],
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
        <div className="flex gap-2 items-center">
          <div className="text-navy font-bold text-base">Filters</div>
        </div>

        <div className="flex justify-end ml-2">
          {isAnyFilterActive() && (
            <button
              onClick={handleResetAllFilters}
              className="text-[9px]/1.4 text-[#444444] font-normal font-lato px-3 py-1 rounded hover:bg-opacity-80 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          className="
            duration-300
            flex
            flex-col
            gap-2
            overflow-y-auto
            p-2
            px-2
            text-navy
            transition-all
            opacity-100
          "
        >
          {/* Sectoral Focus */}
          <FilterGroup
            title="Sectoral Focus"
            icon={<ForkIcon className="w-5 h-5" />}
            items={availableSectoralFocus}
            selectedItems={selectedFilters?.sectoralFocus}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "sectoralFocus", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "sectoralFocus",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "sectoralFocus" })}
            className="w-full"
            itemClassName="4xl:text-xl"
            gridClassName="!flex flex-wrap gap-0"
            uppercase={false}
          />
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
            gridClassName="!flex flex-wrap gap-0"
            uppercase={false}
          />
          {/* Problem Class */}
          <FilterGroup
            title="Problem Class"
            icon={<ProcessorIcon className="w-5 h-5" />}
            items={availableProblemClasses}
            selectedItems={selectedFilters?.problemClass}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "problemClass", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "problemClass",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "problemClass" })}
            className="w-full"
            gridClassName="!flex flex-wrap"
            uppercase={false}
          />
          {/* Application */}
          <FilterGroup
            title="Application"
            icon={<WrenchIcon className="w-5 h-5" />}
            items={availableApplications}
            selectedItems={selectedFilters?.application}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "application", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "application",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "application" })}
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
            gridClassName="grid-cols-3"
            uppercase={true}
          />
          {/* Realistic */}
          <FilterGroup
            title="Realistic"
            icon={<GlobeSearchIcon className="w-5 h-5" />}
            items={realisticOptions}
            selectedItems={selectedFilters?.realistic}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "realistic", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "realistic",
                value,
                only: true,
              })
            }
            onSelectAll={() => handleSelectAll({ category: "realistic" })}
            className="w-full"
            gridClassName="grid-cols-2"
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
            gridClassName="grid-cols-2"
            uppercase={false}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
