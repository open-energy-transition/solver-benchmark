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
import { IResultState } from "@/types/state";
import { IFilterBenchmarkDetails } from "@/types/benchmark";
import FilterGroup from "../filters/FilterGroup";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Mobile Menu Button */}
      <button
        className="xl:hidden w-full p-3 text-left text-dark-grey flex items-center justify-between"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span>Filters</span>
        <svg
          className={`w-5 h-5 transition-transform ${
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
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } xl:flex text-dark-grey`}
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
          className="xl:w-auto 4xl:w-1/3 w-full"
          itemClassName="xl:max-w-[70px] 4xl:max-w-full"
          gridClassName="grid-cols-2"
          uppercase={false}
        />
        {/* Technique */}
        <FilterGroup
          title="Technique"
          icon={<ProcessorIcon className="w-5 h-5" />}
          items={availableTechniques}
          selectedItems={localFilters?.technique}
          onItemChange={(value) =>
            handleCheckboxChange({ category: "technique", value })
          }
          onItemOnly={(value) =>
            handleCheckboxChange({ category: "technique", value, only: true })
          }
          onSelectAll={() => handleSelectAll({ category: "technique" })}
          className="xl:w-auto 4xl:w-[10%] w-full"
          gridClassName="grid-cols-2"
          uppercase={false}
        />
        {/* Kind of Problem */}
        <FilterGroup
          title="Kind of Problem"
          icon={<WrenchIcon className="w-5 h-5" />}
          items={availableKindOfProblems}
          selectedItems={localFilters?.kindOfProblem}
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
          className="xl:w-auto w-full"
          gridClassName="grid-cols-2 xl:grid-cols-[max-content_max-content]"
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
          className="xl:w-[40%] !border-r-0 w-full"
          gridClassName="grid-cols-1 2xl:grid-cols-3 grid-cols-2"
          uppercase={false}
        />
      </div>
    </div>
  );
};

export default BenchmarkDetailFilterSection;
