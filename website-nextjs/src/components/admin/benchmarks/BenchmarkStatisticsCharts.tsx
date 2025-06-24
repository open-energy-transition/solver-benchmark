import D3StackedBarChart from "@/components/shared/D3StackedBarChart";
import { IResultState } from "@/types/state";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { QuestionLineIcon } from "@/assets/icons";
import Popup from "reactjs-popup";

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

  const timeHorizonTitleWithTooltip = (
    <div className="flex items-center gap-1">
      <span>By Time Horizon</span>
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
        <div className="bg-white border border-stroke px-4 py-2 m-4 rounded-lg max-w-xs">
          Defines how far in the future the model optimizes and the number of
          optimization stages
          <ul className="list-disc list-outside ml-6">
            <li>
              Single-stage: solution in a single step assuming full foresight,
              i.e. that all future weather and demand assumptions are known in
              advance (the evolution of decision variables cannot be observed
              over time). The model does not account for the temporal evolution
              of decisions or new information over time.
            </li>
            <li>
              Multi-stage: The optimization is solved sequentially over
              different time steps, allowing decisions to evolve over time.
              Indeed, multi-stage models can be formulated with:
              <ul className="list-disc list-outside ml-6">
                <li>
                  <b>Perfect foresight</b>: assuming full knowledge of future
                  conditions, but decisions are optimized over several periods.
                </li>
                <li>
                  <b>Myopic</b>: only current and possibly short-term future
                  information is available at each step.
                </li>
                <li>
                  <b>Stochastic</b>: future conditions are uncertain and
                  represented via scenarios or probability distributions;
                  decisions adapt as uncertainty resolves over time.
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </Popup>
    </div>
  );

  return (
    <div className="p-1 rounded-xl space-y-8 relative">
      <div className="xl:flex xl:flex-row justify-between gap-2 ">
        <div className="flex-1 w-full xl:w-1/3">
          <D3StackedBarChart
            className="p-3"
            data={problemClassesChartData}
            xAxisLabel="Modelling Framework"
            yAxisLabel=""
            categoryKey="modellingFramework"
            colors={{ LP: "#004B69", MILP: "#6B9080" }}
            title="By Modelling Framework"
            rotateXAxisLabels={true}
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0 xl:w-1/3">
          <D3StackedBarChart
            className="p-3"
            data={timeHorizonsChartData}
            xAxisLabel="Modelling Framework"
            yAxisLabel=""
            categoryKey="modellingFramework"
            colors={{ single: "#004B69", multi: "#6B9080" }}
            rotateXAxisLabels={true}
            title={timeHorizonTitleWithTooltip}
            showXaxisLabel={false}
          />
        </div>
        <div className="flex-1 w-full mt-4 lg:mt-0  xl:w-1/3">
          <D3StackedBarChart
            className="p-3"
            data={sizeChartData}
            xAxisLabel="Size"
            yAxisLabel=""
            categoryKey="size"
            colors={{
              realistic: "#004B69",
              other: "#6B9080",
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
