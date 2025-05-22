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
} from "@/assets/icons";
import { useSelector } from "react-redux";
import { IResultState, RealisticOption } from "@/types/state";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import FilterGroup from "../filters/FilterGroup";

const BenchmarkDetailFilterSection = ({
  setLocalFilters,
  localFilters,
  availableSectors,
  availableProblemClasses,
  availableApplications,
  availableModels,
  availableProblemSizes,
}: {
  setLocalFilters: React.Dispatch<
    React.SetStateAction<IFilterBenchmarkDetails>
  >;
  localFilters: IFilterBenchmarkDetails;
  availableSectors: string[];
  availableProblemClasses: string[];
  availableApplications: string[];
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
      problemClass: availableProblemClasses,
      application: availableApplications,
      modelName: availableModels,
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
      "problemClass",
      "application",
      "modelName",
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
        problemClass: availableProblemClasses,
        application: availableApplications,
        modelName: availableModels,
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
      sectors: availableSectors,
      problemClass: availableProblemClasses,
      application: availableApplications,
      modelName: availableModels,
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
          <div className="text-navy font-bold text-base">Filter</div>
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
          {/* Sectors */}
          <FilterGroup
            title="Sectors"
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
            itemClassName="4xl:text-xl"
            gridClassName="!flex flex-wrap gap-0"
            uppercase={false}
          />
          {/* Problem Class */}
          <FilterGroup
            title="Problem Class"
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
          {/* Application */}
          <FilterGroup
            title="Application"
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
          {/* Problem Size */}
          <FilterGroup
            title="Problem Size"
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
          <FilterGroup
            title="Realistic"
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
          {/* Model */}
          <FilterGroup
            title="Model"
            icon={<PolygonIcon className="w-5 h-5" />}
            items={availableModels}
            selectedItems={localFilters?.modelName}
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

export default BenchmarkDetailFilterSection;
