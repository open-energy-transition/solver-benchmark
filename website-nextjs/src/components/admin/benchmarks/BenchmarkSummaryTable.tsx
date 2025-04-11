import { IResultState } from "@/types/state";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

const BenchmarkSummaryTable = () => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.metaData;
  });

  const nOfProblems = [
    "Total number of benchmark problems",
    "Total number of benchmark size instances",
  ];
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

  return (
    <div className="bg-white p-4 rounded-xl mb-6 space-y-8">
      <div>
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
                <th className="border p-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* N. of problem */}
              {nOfProblems.map((nOfProblem, nOfProblemIdx) => (
                <tr
                  key={nOfProblemIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {nOfProblemIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={2}
                    >
                      <span>N. of Problems</span>
                    </td>
                  )}

                  <td className="border p-2 text-left font-medium">
                    {nOfProblem}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {nOfProblemIdx === 0
                        ? s.nOfProblems.get("totalNOfDiffProblems") || 0
                        : s.nOfProblems.get("multipleSizes")}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {nOfProblemIdx === 0
                      ? summary.reduce(
                          (acc, curr) =>
                            acc +
                            (curr.nOfProblems.get("totalNOfDiffProblems") || 0),
                          0,
                        )
                      : summary.reduce(
                          (acc, curr) =>
                            acc + (curr.nOfProblems.get("multipleSizes") || 0),
                          0,
                        )}
                  </td>
                </tr>
              ))}
              {/* Technique */}
              {availableTechniques.map((technique, techniqueIdx) => (
                <tr
                  key={techniqueIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {techniqueIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={availableTechniques.length}
                    >
                      Technique
                    </td>
                  )}
                  <td className="border p-2 text-left font-medium">
                    {technique}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {s.techniques.get(technique) || 0}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {summary.reduce(
                      (acc, curr) =>
                        acc + (curr.techniques.get(technique) || 0),
                      0,
                    )}
                  </td>
                </tr>
              ))}
              {/* Kind of Problem */}
              {availableKindOfProblems.map(
                (kindOfProblem, kindOfProblemIdx) => (
                  <tr
                    key={kindOfProblemIdx}
                    className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                  >
                    {kindOfProblemIdx === 0 && (
                      <td
                        className="border p-2 text-left font-medium"
                        rowSpan={availableKindOfProblems.length}
                      >
                        Kind Of Problem
                      </td>
                    )}
                    <td className="border p-2 text-left font-medium">
                      {kindOfProblem}
                    </td>
                    {summary.map((s, sIdx) => (
                      <td
                        key={sIdx}
                        className="border p-2 text-right font-medium"
                      >
                        {s.kindOfProblems.get(kindOfProblem) || 0}
                      </td>
                    ))}
                    <td className="border p-2 text-left font-medium">
                      {summary.reduce(
                        (acc, curr) =>
                          acc + (curr.kindOfProblems.get(kindOfProblem) || 0),
                        0,
                      )}
                    </td>
                  </tr>
                ),
              )}
              {/* Time Horizon */}
              {availabletimeHorizons.map((timeHorizon, timeHorizonIdx) => (
                <tr
                  key={timeHorizonIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {timeHorizonIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={availabletimeHorizons.length}
                    >
                      Time Horizon
                    </td>
                  )}
                  <td className="border p-2 text-left font-medium">
                    {getTimeHorizonLabel(timeHorizon)}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {s.timeHorizons.get(timeHorizon) == -1
                        ? "N/A"
                        : s.timeHorizons.get(timeHorizon) || 0}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {summary.reduce((acc, curr) => {
                      // If the value is -1, then it is N/A
                      const a = acc == -1 ? 0 : acc || 0;
                      const b =
                        curr.timeHorizons.get(timeHorizon) == -1
                          ? 0
                          : curr.timeHorizons.get(timeHorizon) || 0;
                      return a + b;
                    }, 0)}
                  </td>
                </tr>
              ))}
              {/* MILP Features */}
              {availableMilpFeatures.map((milpFeature, milpFeatureIdx) => (
                <tr
                  key={milpFeatureIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {milpFeatureIdx === 0 && (
                    <td
                      className="border p-2 font-medium text-left"
                      rowSpan={availableMilpFeatures.length}
                    >
                      MILP Features
                    </td>
                  )}
                  <td className="border p-2 font-medium text-left">
                    {milpFeature || "-"}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 font-medium text-right"
                    >
                      {s.milpFeatures.get(milpFeature as string) || 0}
                    </td>
                  ))}
                  <td className="border p-2 font-medium text-left">
                    {summary.reduce(
                      (acc, curr) =>
                        acc +
                        (curr.milpFeatures.get(milpFeature as string) || 0),
                      0,
                    )}
                  </td>
                </tr>
              ))}
              {/* Size Features */}
              {["Real(MILP)", "Other"].map((size, sizeIdx) => (
                <tr
                  key={sizeIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {sizeIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={2}
                    >
                      Size
                    </td>
                  )}
                  <td className="border p-2 text-left font-medium">
                    {size || "-"}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {" "}
                      {size === "Other"
                        ? s.realSizes.get("other") || 0
                        : `${s.realSizes.get("real") || 0} (${
                            s.realSizes.get("milp") || 0
                          })`}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {size === "Other"
                      ? summary.reduce(
                          (acc, curr) =>
                            acc + (curr.realSizes.get("other") || 0),
                          0,
                        )
                      : `${summary.reduce(
                          (acc, curr) =>
                            acc + (curr.realSizes.get("real") || 0),
                          0,
                        )} (${summary.reduce(
                          (acc, curr) =>
                            acc + (curr.realSizes.get("milp") || 0),
                          0,
                        )})`}
                  </td>
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
