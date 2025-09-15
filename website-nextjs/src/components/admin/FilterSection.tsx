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
  QuestionLineIcon,
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
import Popup from "reactjs-popup";

interface FilterSectionProps {
  height?: string;
}

const FilterGroupWithTooltip = ({
  title,
  tooltipText,
  tooltipContent,
  icon,
  items,
  selectedItems,
  onItemChange,
  onItemOnly,
  onSelectAll,
  className,
  gridClassName,
  itemClassName,
  uppercase,
}: {
  title: string;
  tooltipText?: string;
  tooltipContent?: React.ReactNode;
  icon: React.ReactNode;
  items: string[];
  selectedItems?: string[];
  onItemChange: (value: string) => void;
  onItemOnly: (value: string) => void;
  onSelectAll: () => void;
  className?: string;
  gridClassName?: string;
  itemClassName?: string;
  uppercase?: boolean;
}) => {
  const titleWithTooltip = (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <Popup
        on={["hover"]}
        trigger={() => (
          <span className="flex items-baseline my-auto cursor-pointer">
            <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
          </span>
        )}
        position="right center"
        closeOnDocumentClick
        arrow={false}
      >
        <div className="text-white bg-navy border border-stroke px-4 py-2 m-4 rounded-lg max-w-xs">
          {tooltipContent || tooltipText || title}
        </div>
      </Popup>
    </div>
  );

  return (
    <FilterGroup
      title={titleWithTooltip}
      icon={icon}
      items={items}
      selectedItems={selectedItems}
      onItemChange={onItemChange}
      onItemOnly={onItemOnly}
      onSelectAll={onSelectAll}
      className={className}
      gridClassName={gridClassName}
      itemClassName={itemClassName}
      uppercase={uppercase}
    />
  );
};

const FilterSection = ({ height }: FilterSectionProps) => {
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
  const availableModellingFrameworks = useSelector(
    (state: { results: IResultState }) =>
      state.results.availableModellingFrameworks,
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
      modellingFramework: availableModellingFrameworks,
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
      "modellingFramework",
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
    if (isInit || !router.isReady || !selectedFilters.isReady) return;
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
    } else {
      dispatch(
        filterActions.setFilter({
          sectoralFocus: availableSectoralFocus,
          sectors: availableSectors,
          problemClass: availableProblemClasses,
          application: availableApplications,
          modellingFramework: availableModellingFrameworks,
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
          modellingFramework: availableModellingFrameworks,
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
      modellingFramework: availableModellingFrameworks,
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
    <>
      <div className="sm:w-[248px] pt-2.5 px-8 pb-2 flex items-center justify-between gap-1 border-stroke border-b">
        <div className="flex gap-2 items-center">
          <div className="text-navy font-bold text-base">Filter By:</div>
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
            p-2
            px-2
            text-navy
            transition-all
            opacity-100
            overflow-y-auto
            max-h-fit
            md:max-h-full
          "
          style={{
            height: height || "",
          }}
        >
          {/* Modelling Framework */}
          <FilterGroupWithTooltip
            title="Model Framework"
            tooltipText="A modelling framework is a set of tools, rules, methods, and structures that support the development, execution, and management of models."
            icon={<PolygonIcon className="w-5 h-5" />}
            items={availableModellingFrameworks}
            selectedItems={selectedFilters?.modellingFramework}
            onItemChange={(value) =>
              handleCheckboxChange({ category: "modellingFramework", value })
            }
            onItemOnly={(value) =>
              handleCheckboxChange({
                category: "modellingFramework",
                value,
                only: true,
              })
            }
            onSelectAll={() =>
              handleSelectAll({ category: "modellingFramework" })
            }
            className="w-full"
            gridClassName="!flex flex-wrap"
            uppercase={false}
          />
          {/* Application */}
          <FilterGroupWithTooltip
            title="Application"
            tooltipText="What kind of practical question the energy model is used to answer"
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
          {/* Problem Class */}
          <FilterGroupWithTooltip
            title="Problem Class"
            tooltipContent={
              <div>
                <div>
                  Describes the type of mathematical optimization problem
                </div>
                <ul className="list-disc list-outside ml-6">
                  <li>
                    LP: Only continuous variables; all equations and
                    inequalities are linear
                  </li>
                  <li>
                    MILP: Includes integer or binary variables, e.g., for on/off
                    decisions, investment choices
                  </li>
                </ul>
              </div>
            }
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
          {/* Problem Size */}
          <FilterGroupWithTooltip
            title="Problem Size"
            tooltipContent={
              <div>
                <div>
                  Defines the computational scale of the optimization problem
                </div>
                <ul className="list-disc list-outside ml-6">
                  <li>S: num. vars {"<"} 1e4</li>
                  <li>M: 1e4 ≤ num. vars {"<"} 1e6</li>
                  <li>L: 1e6 ≤ num. vars</li>
                </ul>
              </div>
            }
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
          <FilterGroupWithTooltip
            title="Realistic"
            tooltipText="Benchmark instances are marked as realistic if they come from a model that was used, or is similar to a model used in an actual energy modelling study. Please note that this is a rather subjective and modelling framework-dependent definition, but is still useful when estimating solver performance on real-world energy models."
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
          {/* Sectoral Focus */}
          <FilterGroupWithTooltip
            title="Sectoral Focus"
            tooltipText="Categorizes energy models based on whether they focus on the power/electricity sector only, or whether they also consider interactions with other sectors that produce/use energy (e.g., transport, industry, etc.)."
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
            itemClassName=""
            gridClassName="!flex flex-wrap gap-0"
            uppercase={false}
          />
          {/* Sectors */}
          <FilterGroupWithTooltip
            title="Sectors"
            tooltipText="A sector is a set of energy production/consumption technologies/energy services devoted to satisfy the demand for a particular category of human activity (i.e. transport, industry, etc.)."
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
            itemClassName=""
            gridClassName="!flex flex-wrap gap-0"
            uppercase={false}
          />
        </div>
      </div>
    </>
  );
};

export default FilterSection;
