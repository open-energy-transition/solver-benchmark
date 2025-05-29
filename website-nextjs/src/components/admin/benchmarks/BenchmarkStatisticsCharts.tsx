import D3StackedBarChart from "@/components/shared/D3StackedBarChart";
import { IResultState } from "@/types/state";
import { getChartColor } from "@/utils/chart";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

const BenchmarkStatisticsCharts = ({
  availableSectoralFocus,
  availableSectors,
  availableProblemClasses,
  availableApplications,
  availableModellingFrameworks,
  availableProblemSizes,
}: {
  availableSectoralFocus: string[];
  availableSectors: string[];
  availableProblemClasses: string[];
  availableApplications: string[];
  availableModellingFrameworks: string[];
  availableProblemSizes: string[];
}) => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.fullMetaData;
  });

  const availableMilpFeatures = useMemo(() => {
    return Array.from(
      new Set(Object.keys(metaData).map((key) => metaData[key].milpFeatures)),
    );
  }, [metaData]);

  const availabletimeHorizons = ["single", "multi"];
  const summary = availableModellingFrameworks.map((framework) => {
    const problemClassesMap = new Map<string, number>();
    const applicationsMap = new Map<string, number>();
    const sectoralFocusMap = new Map<string, number>();
    const sectorsMap = new Map<string, number>();
    const milpFeaturesMap = new Map<string, number>();
    const timeHorizonsMap = new Map<string, number>();
    const realSizesMap = new Map<string, number>();
    const nOfProblemsMap = new Map<string, number>();

    function updateData(data: Map<string, number>, key: string) {
      data.set(key, (data.get(key) || 0) + 1);
    }

    Object.keys(metaData).forEach((key) => {
      if (metaData[key].modellingFramework === framework) {
        // Number of problems
        updateData(nOfProblemsMap, "totalNOfDiffProblems");
        metaData[key].sizes.forEach(() => {
          updateData(nOfProblemsMap, "multipleSizes");
        });

        availableProblemClasses.forEach((problemClass) => {
          if (metaData[key].problemClass === problemClass) {
            updateData(problemClassesMap, problemClass);
          }
        });
        availableApplications.forEach((application) => {
          if (metaData[key].application === application) {
            updateData(applicationsMap, application);
          }
        });
        availableSectoralFocus.forEach((focus) => {
          if (metaData[key].sectoralFocus === focus) {
            updateData(sectoralFocusMap, focus);
          }
        });
        availableSectors.forEach((sector) => {
          if (metaData[key].sectors === sector) {
            updateData(sectorsMap, sector);
          }
        });
        availableMilpFeatures.forEach((milpFeature) => {
          if (metaData[key].milpFeatures === milpFeature) {
            updateData(milpFeaturesMap, milpFeature as string);
          }
        });
        availabletimeHorizons.forEach((timeHorizon) => {
          if (metaData[key].timeHorizon.toLowerCase().includes(timeHorizon)) {
            updateData(timeHorizonsMap, timeHorizon as string);
          }
        });
        if (metaData[key].sizes.some((instance) => instance.realistic)) {
          if (metaData[key].problemClass === "MILP") {
            updateData(realSizesMap, "milp" as string);
          }
          updateData(realSizesMap, "real" as string);
        } else {
          updateData(realSizesMap, "other" as string);
        }
      }
    });

    if (timeHorizonsMap.size === 0) {
      timeHorizonsMap.set("single", -1);
      timeHorizonsMap.set("multi", -1);
    }
    return {
      modellingFramework: framework,
      problemClasses: problemClassesMap,
      applications: applicationsMap,
      milpFeatures: milpFeaturesMap,
      timeHorizons: timeHorizonsMap,
      sectoralFocus: sectoralFocusMap,
      sectors: sectorsMap,
      realSizes: realSizesMap,
      nOfProblems: nOfProblemsMap,
    };
  });

  const problemClassesChartData = summary
    .filter(
      (data) =>
        data.modellingFramework && data.modellingFramework.trim() !== "",
    )
    .map((data) => ({
      modellingFramework: data.modellingFramework,
      LP: data.problemClasses.get("LP") || 0,
      MILP: data.problemClasses.get("MILP") || 0,
    }));

  const timeHorizonsChartData = summary
    .filter(
      (data) =>
        data.modellingFramework && data.modellingFramework.trim() !== "",
    )
    .map((data) => ({
      modellingFramework: data.modellingFramework,
      single: data.timeHorizons.get("single") || 0,
      multi: data.timeHorizons.get("multi") || 0,
    }));

  const sizeChartData = useMemo(() => {
    const sizeData = availableProblemSizes.map((size) => {
      return {
        size,
        total: 0,
        realistic: 0,
        other: 0,
      };
    });
    Object.keys(metaData).forEach((key) => {
      metaData[key].sizes.forEach((s) => {
        const data = sizeData.find((sd) => sd.size === s.size);
        if (data) {
          data.total += 1;
          if (s.realistic) {
            data.realistic += 1;
          }
        }
      });
    });
    return sizeData.map((data) => {
      return {
        other: data.total - data.realistic,
        realistic: data.realistic,
        size: data.size,
      };
    });
  }, [metaData, availableProblemSizes]);

  return (
    <div className="bg-white p-4 pl-8 rounded-xl mb-6 space-y-8 relative 4xl:py-16">
      <div className="-rotate-90 absolute left-[-85px] 4xl:left-[-130px] text-xs text-center ml-5 font-bold text-dark-grey top-1/2 -translate-y-1/2 4xl:text-lg">
        Number of benchmark instances
      </div>
      <div className="xl:flex xl:flex-row justify-between">
        <div className="flex-1 w-full xl:w-1/3">
          <D3StackedBarChart
            className="px-0"
            data={problemClassesChartData}
            xAxisLabel="Modelling Framework"
            yAxisLabel=""
            categoryKey="modellingFramework"
            colors={{ LP: getChartColor(0), MILP: getChartColor(1) }}
            title="By Modelling Framework"
            rotateXAxisLabels={true}
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0 xl:w-1/3">
          <D3StackedBarChart
            className="px-0"
            data={timeHorizonsChartData}
            xAxisLabel="Modelling Framework"
            yAxisLabel=""
            categoryKey="modellingFramework"
            colors={{ single: getChartColor(0), multi: getChartColor(1) }}
            rotateXAxisLabels={true}
            title="By Time Horizon"
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0  xl:w-1/3">
          <D3StackedBarChart
            className="px-0"
            data={sizeChartData}
            xAxisLabel="Size"
            yAxisLabel=""
            categoryKey="size"
            colors={{
              realistic: getChartColor(0),
              other: getChartColor(1),
            }}
            rotateXAxisLabels={false}
            title="By Size"
            showXaxisLabel={false}
          />
        </div>
      </div>
    </div>
  );
};

export default BenchmarkStatisticsCharts;
