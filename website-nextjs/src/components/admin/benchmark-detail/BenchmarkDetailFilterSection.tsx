/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  BrightIcon,
  PolygonIcon,
  ProcessorIcon,
  WrenchIcon,
  ProblemSizeIcon,
  GlobeSearchIcon,
  ForkIcon,
  QuestionLineIcon,
} from "@/assets/icons";
import { useSelector } from "react-redux";
import { IResultState, RealisticOption } from "@/types/state";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import FilterGroup from "../filters/FilterGroup";
import { decodeValue, encodeValue } from "@/utils/urls";
import Popup from "reactjs-popup";

interface IBenchmarkDetailFilterSectionProps {
  setLocalFilters: React.Dispatch<
    React.SetStateAction<IFilterBenchmarkDetails>
  >;
  localFilters: IFilterBenchmarkDetails;
  availableSectoralFocus: string[];
  availableSectors: string[];
  availableProblemClasses: string[];
  availableApplications: string[];
  availableProblemSizes: string[];
  availableModellingFrameworks: string[];
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
        <div className="bg-navy text-white px-4 py-2 m-4 rounded-lg max-w-xs">
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

const BenchmarkDetailFilterSection = ({
  setLocalFilters,
  localFilters,
  availableSectoralFocus,
  availableSectors,
  availableProblemClasses,
  availableApplications,
  availableProblemSizes,
  availableModellingFrameworks,
}: IBenchmarkDetailFilterSectionProps) => {
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
      sectoralFocus: availableSectoralFocus,
      sectors: availableSectors,
      problemClass: availableProblemClasses,
      application: availableApplications,
      modellingFramework: availableModellingFrameworks,
      problemSize: availableProblemSizes,
      realistic: [RealisticOption.Realistic, RealisticOption.Other],
    }[category] as string[];

    const selectedItems = (localFilters[categoryKey] as string[]) || [];

    const shouldSelectAll = selectedItems.length !== availableItems.length;

    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [categoryKey]: shouldSelectAll ? availableItems : [],
    }));
  };

  const initialFilters = {
    sectoralFocus: availableSectoralFocus.length,
    sectors: availableSectors.length,
    problemClass: availableProblemClasses.length,
    application: availableApplications.length,
    problemSize: availableProblemSizes.length,
    modellingFramework: availableModellingFrameworks.length,
    realistic: [RealisticOption.Realistic, RealisticOption.Other].length,
  };

  useEffect(() => {
    const areFiltersEqualToInitial = Object.entries(initialFilters).every(
      ([key, value]) => {
        const currentValue = localFilters[key as keyof typeof localFilters];
        return Array.isArray(currentValue) && currentValue.length === value;
      },
    );

    if (isInit && !areFiltersEqualToInitial) {
      updateUrlParams(localFilters);
      applyFiltersToResults();
    }
  }, [localFilters]);

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
        filters[key as keyof IFilterBenchmarkDetails] = value
          ? (value.split(";").map(decodeValue) as string[])
          : [];
      }
    });

    return filters;
  };

  useEffect(() => {
    if (isInit || !router.isReady || isInit) return;

    const urlFilters = parseUrlParams();
    if (Object.keys(urlFilters).length > 0) {
      setLocalFilters((prevFilters) => ({
        ...prevFilters,
        ...urlFilters,
      }));
    } else {
      // If no filters in URL, set to default values
      setLocalFilters({
        sectoralFocus: availableSectoralFocus,
        sectors: availableSectors,
        problemClass: availableProblemClasses,
        application: availableApplications,
        modellingFramework: availableModellingFrameworks,
        problemSize: availableProblemSizes,
        realistic: [RealisticOption.Realistic, RealisticOption.Other],
      });
    }
    setIsInit(true);
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
        sectoralFocus: availableSectoralFocus,
        sectors: availableSectors,
        problemClass: availableProblemClasses,
        application: availableApplications,
        modellingFramework: availableModellingFrameworks,
        problemSize: availableProblemSizes,
        realistic: [RealisticOption.Realistic, RealisticOption.Other],
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
      sectoralFocus: availableSectoralFocus,
      sectors: availableSectors,
      problemClass: availableProblemClasses,
      application: availableApplications,
      modellingFramework: availableModellingFrameworks,
      problemSize: availableProblemSizes,
      realistic: [RealisticOption.Realistic, RealisticOption.Other],
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
    <div>
      <div className="pt-2.5 px-8 pb-2 flex items-center justify-between gap-1 border-stroke border-b">
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
            overflow-y-auto
            p-2
            px-2
            text-navy
            transition-all
            max-h-[80vh] opacity-100
          "
        >
          {/* Modelling Framework */}
          <FilterGroupWithTooltip
            title="Modelling Framework"
            tooltipText="A modelling framework is a set of tools, rules, methods, and structures that support the development, execution, and management of models."
            icon={<PolygonIcon className="w-5 h-5" />}
            items={availableModellingFrameworks}
            selectedItems={localFilters?.modellingFramework}
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
            selectedItems={localFilters?.application}
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
            selectedItems={localFilters?.problemClass}
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
            selectedItems={localFilters?.problemSize}
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
            items={[RealisticOption.Realistic, RealisticOption.Other]}
            selectedItems={localFilters?.realistic}
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
            uppercase={false}
          />
          {/* Sectoral Focus */}
          <FilterGroupWithTooltip
            title="Sectoral Focus"
            tooltipText="Categorizes energy models based on whether they focus on the power/electricity sector only, or whether they also consider interactions with other sectors that produce/use energy (e.g., transport, industry, etc.)."
            icon={<ForkIcon className="w-5 h-5" />}
            items={availableSectoralFocus}
            selectedItems={localFilters?.sectoralFocus}
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
            selectedItems={localFilters?.sectors}
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
    </div>
  );
};

export default BenchmarkDetailFilterSection;
