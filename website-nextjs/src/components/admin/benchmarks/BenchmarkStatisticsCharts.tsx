import D3BarChart from "@/components/shared/D3BarChart";
import D3StackedBarChart from "@/components/shared/D3StackedBarChart";
import { IResultState } from "@/types/state";
import { getChartColor } from "@/utils/chart";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

const BenchmarkStatisticsCharts = ({
  availableSectors,
  availableTechniques,
  availableKindOfProblems,
  availableModels,
  availableProblemSizes,
}: {
  availableSectors: string[];
  availableTechniques: string[];
  availableKindOfProblems: string[];
  availableModels: string[];
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
  const summary = availableModels.map((model) => {
    const techniquesMap = new Map<string, number>();
    const kindOfProblemsMap = new Map<string, number>();
    const sectorsMap = new Map<string, number>();
    const milpFeaturesMap = new Map<string, number>();
    const timeHorizonsMap = new Map<string, number>();
    const realSizesMap = new Map<string, number>();
    const nOfProblemsMap = new Map<string, number>();

    function updateData(data: Map<string, number>, key: string) {
      data.set(key, (data.get(key) || 0) + 1);
    }
    Object.keys(metaData).forEach((key) => {
      if (metaData[key].modelName === model) {
        // Number of problems
        updateData(nOfProblemsMap, "totalNOfDiffProblems");
        metaData[key].sizes.forEach(() => {
          updateData(nOfProblemsMap, "multipleSizes");
        });

        availableTechniques.forEach((technique) => {
          if (metaData[key].technique === technique) {
            updateData(techniquesMap, technique);
          }
        });
        availableKindOfProblems.forEach((kindOfProblem) => {
          if (metaData[key].kindOfProblem === kindOfProblem) {
            updateData(kindOfProblemsMap, kindOfProblem);
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
        if (metaData[key].sizes.some((instance) => instance.size === "R")) {
          if (metaData[key].technique === "MILP") {
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
      modelName: model,
      techniques: techniquesMap,
      kindOfProblems: kindOfProblemsMap,
      milpFeatures: milpFeaturesMap,
      timeHorizons: timeHorizonsMap,
      sectors: sectorsMap,
      realSizes: realSizesMap,
      nOfProblems: nOfProblemsMap,
    };
  });

  const techniquesChartData = summary.map((data) => ({
    modelName: data.modelName,
    LP: data.techniques.get("LP") || 0,
    MILP: data.techniques.get("MILP") || 0,
  }));

  const timeHorizonsChartData = summary.map((data) => ({
    modelName: data.modelName,
    single: data.timeHorizons.get("single") || 0,
    multi: data.timeHorizons.get("multi") || 0,
  }));
  const sizeData = useMemo(() => {
    const sizeData = availableProblemSizes.map((size) => {
      return {
        size,
        value: 0,
        category: size,
        group: size,
      };
    });
    Object.keys(metaData).forEach((key) => {
      metaData[key].sizes.forEach((s) => {
        const data = sizeData.find((sd) => sd.size === s.size);
        if (data) {
          data.value += 1;
        }
      });
    });
    return sizeData;
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
            data={techniquesChartData}
            xAxisLabel="Model Name"
            yAxisLabel=""
            categoryKey="modelName"
            colors={{ LP: getChartColor(0), MILP: getChartColor(1) }}
            title="By Technique"
            rotateXAxisLabels={true}
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0 xl:w-1/3">
          <D3StackedBarChart
            className="px-0"
            data={timeHorizonsChartData}
            xAxisLabel="Model Name"
            yAxisLabel=""
            categoryKey="modelName"
            colors={{ single: getChartColor(0), multi: getChartColor(1) }}
            rotateXAxisLabels={true}
            title="By Time Horizon"
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0  xl:w-1/3">
          <D3BarChart
            className="px-0"
            data={sizeData}
            colors={sizeData.reduce(
              (acc, d, idx) => {
                acc[d.size] = getChartColor(idx);
                return acc;
              },
              {} as Record<string, string>,
            )}
            tooltipFormat={(d) => `${d.group}: ${d.value}`}
            yAxisLabel=""
            title="By Size"
          />
        </div>
      </div>
    </div>
  );
};

export default BenchmarkStatisticsCharts;
