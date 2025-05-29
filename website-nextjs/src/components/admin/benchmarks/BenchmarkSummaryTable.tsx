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
  const availableModellingFrameworks = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableModellingFrameworks;
    },
  );

  const availableProblemClasses = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableProblemClasses;
    },
  );

  const availableApplications = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableApplications;
    },
  );

  const availableSectoralFocus = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableSectoralFocus;
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

  return (
    <div className="bg-white p-4 rounded-xl mb-6 space-y-8">
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-center"></th>
                <th className="border p-2 text-center"></th>
                {availableModellingFrameworks.map((framework, frameworkIdx) => (
                  <th
                    key={frameworkIdx}
                    className="border p-2 text-center"
                    colSpan={1}
                  >
                    {framework}
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
              {/* Problem Class */}
              {availableProblemClasses.map((problemClass, problemClassIdx) => (
                <tr
                  key={problemClassIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {problemClassIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={availableProblemClasses.length}
                    >
                      Problem Class
                    </td>
                  )}
                  <td className="border p-2 text-left font-medium">
                    {problemClass}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {s.problemClasses.get(problemClass) || 0}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {summary.reduce(
                      (acc, curr) =>
                        acc + (curr.problemClasses.get(problemClass) || 0),
                      0,
                    )}
                  </td>
                </tr>
              ))}
              {/* Application */}
              {availableApplications.map((application, applicationIdx) => (
                <tr
                  key={applicationIdx}
                  className="border-b odd:bg-[#BFD8C71A] odd:bg-opacity-10"
                >
                  {applicationIdx === 0 && (
                    <td
                      className="border p-2 text-left font-medium"
                      rowSpan={availableApplications.length}
                    >
                      Application
                    </td>
                  )}
                  <td className="border p-2 text-left font-medium">
                    {application}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td
                      key={sIdx}
                      className="border p-2 text-right font-medium"
                    >
                      {s.applications.get(application) || 0}
                    </td>
                  ))}
                  <td className="border p-2 text-left font-medium">
                    {summary.reduce(
                      (acc, curr) =>
                        acc + (curr.applications.get(application) || 0),
                      0,
                    )}
                  </td>
                </tr>
              ))}
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
