import { IResultState } from "@/types/state";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

const BenchmarkSummaryTable = () => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.metaData;
  });

  const availableModels = useSelector((state: { results: IResultState }) => {
    return state.results.availableModels;
  });

  const availableTechniques = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableTechniques;
    },
  );

  const availableKindOfProblems = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableKindOfProblems;
    },
  );

  const availableSectors = useSelector((state: { results: IResultState }) => {
    return state.results.availableSectors;
  });

  const availableMilpFeatures = useMemo(() => {
    return Array.from(
      new Set(Object.keys(metaData).map((key) => metaData[key].milpFeatures)),
    );
  }, [metaData]);

  const availabletimeHorizons = ["single", "multi"];
  function getTimeHorizonLabel(key: string) {
    switch (key) {
      case "single":
        return "Single Period";
      case "multi":
        return "Multi Period";
      default:
        break;
    }
  }

  const summary = availableModels.map((model) => {
    const techniquesMap = new Map<string, number>();
    const kindOfProblemsMap = new Map<string, number>();
    const sectorsMap = new Map<string, number>();
    const milpFeaturesMap = new Map<string, number>();
    const timeHorizonsMap = new Map<string, number>();

    function updateData(data: Map<string, number>, key: string) {
      data.set(key, (data.get(key) || 0) + 1);
    }

    Object.keys(metaData).forEach((key) => {
      if (metaData[key].modelName === model) {
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
    };
  });

  return (
    <div className="bg-white p-4 rounded-xl mb-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-4">Model Distribution Matrix</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-center"></th>
                <th className="border p-2 text-center"></th>
                {availableModels.map((model, modelIdx) => (
                  <th
                    key={modelIdx}
                    className="border p-2 text-center"
                    colSpan={1}
                  >
                    {model}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* N. of problem */}
              {/* Technique */}
              {availableTechniques.map((technique, techniqueIdx) => (
                <tr
                  key={techniqueIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  <td className="border p-2 text-center font-medium">
                    {techniqueIdx === 0 ? "Technique" : ""}
                  </td>
                  <td className="border p-2 text-center font-medium">
                    {technique}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-center font-medium"
                    >
                      {s.techniques.get(technique) || 0}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Kind of Problem */}
              {availableKindOfProblems.map(
                (kindOfProblem, kindOfProblemIdx) => (
                  <tr
                    key={kindOfProblemIdx}
                    className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                  >
                    <td className="border p-2 text-center font-medium">
                      {kindOfProblemIdx === 0 ? "Kind Of Problem" : ""}
                    </td>
                    <td className="border p-2 text-center font-medium">
                      {kindOfProblem}
                    </td>
                    {summary.map((s, sIdx) => (
                      <td
                        key={sIdx}
                        className="border p-2 text-center font-medium"
                      >
                        {s.kindOfProblems.get(kindOfProblem) || 0}
                      </td>
                    ))}
                  </tr>
                ),
              )}
              {/* Time Horizon */}
              {availabletimeHorizons.map((timeHorizon, timeHorizonIdx) => (
                <tr
                  key={timeHorizonIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  <td className="border p-2 text-center font-medium">
                    {timeHorizonIdx === 0 ? "Time Horizon" : ""}
                  </td>
                  <td className="border p-2 text-center font-medium">
                    {getTimeHorizonLabel(timeHorizon)}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-center font-medium"
                    >
                      {s.timeHorizons.get(timeHorizon) == -1
                        ? "N/A"
                        : s.timeHorizons.get(timeHorizon) || 0}
                    </td>
                  ))}
                </tr>
              ))}
              {/* MILP Features */}
              {availableMilpFeatures.map((milpFeature, milpFeatureIdx) => (
                <tr
                  key={milpFeatureIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  <td className="border p-2 text-center font-medium">
                    {milpFeatureIdx === 0 ? "MILP Feature" : ""}
                  </td>
                  <td className="border p-2 text-center font-medium">
                    {milpFeature || "-"}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-center font-medium"
                    >
                      {s.milpFeatures.get(milpFeature as string) || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkSummaryTable;
