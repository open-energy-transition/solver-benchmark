import { IResultState } from "@/types/state";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { UNSPECIFIED_FILTER_VALUE } from "@/constants/filter";

const BenchmarkSummaryTable = () => {
  const metaData = useSelector((state: { results: IResultState }) => {
    return state.results.metaData;
  });

  const availableModellingFrameworksRaw = useSelector(
    (state: { results: IResultState }) => {
      return state.results.availableModellingFrameworks;
    },
  );

  // Push the pseudo "N/A" framework to the end (just before the Total
  // column) rather than wherever it happens to sort alphabetically.
  const availableModellingFrameworks = useMemo(() => {
    const known = availableModellingFrameworksRaw.filter(
      (framework) => framework !== UNSPECIFIED_FILTER_VALUE,
    );
    return availableModellingFrameworksRaw.includes(UNSPECIFIED_FILTER_VALUE)
      ? [...known, UNSPECIFIED_FILTER_VALUE]
      : known;
  }, [availableModellingFrameworksRaw]);

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

  // Build the set of individual MILP features across all entries.
  const availableMilpFeatures = useMemo(() => {
    return Array.from(
      new Set(
        Object.keys(metaData).flatMap(
          (key) => metaData[key].milpFeatures ?? [],
        ),
      ),
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
    const milpFeaturesMap = new Map<string, number>();
    const timeHorizonsMap = new Map<string, number>();
    const realSizesMap = new Map<string, number>();
    let nOfProblemsCount = 0;

    function updateData(data: Map<string, number>, key: string) {
      data.set(key, (data.get(key) || 0) + 1);
    }
    Object.keys(metaData).forEach((key) => {
      const entryFramework =
        metaData[key].modellingFramework || UNSPECIFIED_FILTER_VALUE;
      if (entryFramework === framework) {
        nOfProblemsCount += 1;

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
        availableMilpFeatures.forEach((milpFeature) => {
          if (metaData[key].milpFeatures?.includes(milpFeature)) {
            updateData(milpFeaturesMap, milpFeature);
          }
        });
        availabletimeHorizons.forEach((timeHorizon) => {
          if (metaData[key].timeHorizon?.toLowerCase().includes(timeHorizon)) {
            updateData(timeHorizonsMap, timeHorizon);
          }
        });
        if (metaData[key].realistic) {
          if (metaData[key].problemClass === "MILP") {
            updateData(realSizesMap, "milp");
          }
          updateData(realSizesMap, "real");
        } else {
          updateData(realSizesMap, "other");
        }
      }
    });

    if (applicationsMap.size === 0) {
      availableApplications.forEach((application) => {
        applicationsMap.set(application, -1);
      });
    }
    if (milpFeaturesMap.size === 0) {
      availableMilpFeatures.forEach((milpFeature) => {
        milpFeaturesMap.set(milpFeature, -1);
      });
    }
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
      realSizes: realSizesMap,
      nOfProblems: nOfProblemsCount,
    };
  });

  // Some category values (e.g. the pseudo "N/A" bucket for problems with an
  // unspecified field) never end up with a real, positive count in any
  // framework's column — rendering a row for them would just show zeros/
  // dashes all the way across. Only render rows that have at least one real
  // match somewhere.
  const hasRealData = (
    getValue: (s: (typeof summary)[number]) => number | undefined,
  ) =>
    summary.some((s) => {
      const value = getValue(s);
      return typeof value === "number" && value > 0;
    });

  const displayedProblemClasses = availableProblemClasses.filter(
    (problemClass) => hasRealData((s) => s.problemClasses.get(problemClass)),
  );
  const displayedApplications = availableApplications.filter((application) =>
    hasRealData((s) => s.applications.get(application)),
  );
  const displayedMilpFeatures = availableMilpFeatures.filter((milpFeature) =>
    hasRealData((s) => s.milpFeatures.get(milpFeature)),
  );
  const displayedTimeHorizons = availabletimeHorizons.filter((timeHorizon) =>
    hasRealData((s) => s.timeHorizons.get(timeHorizon)),
  );

  // Each whole section (all its rows, plus its row-spanned label) shares one
  // background, alternating section by section rather than row by row.
  // A row-spanned label td must always get an explicit, opaque background —
  // left transparent, it shows through to whatever its own (first) row's
  // striping happens to be, which may or may not match the section's
  // intended color. TINTED_LABEL_CLASS is the solid color that #BFD8C733
  // (20% alpha) produces over the #F4F6FA card background; PLAIN_LABEL_CLASS
  // is that same card background, opaque, for sections that should read as
  // unshaded regardless of their first row's own tint.
  const TINTED_LABEL_CLASS = "bg-[#E9F0F0]";
  const PLAIN_LABEL_CLASS = "bg-[#F4F6FA]";
  const nOfProblemsRowTinted = true;
  const problemClassRowTinted = false;
  const applicationRowTinted = true;
  const timeHorizonRowTinted = false;
  const milpFeaturesRowTinted = true;
  const realisticRowTinted = false;

  return (
    <div className="bg-[#F4F6FA] p-4 rounded-xl space-y-8 w-full">
      <div>
        {/* Desktop/tablet table */}
        <div className="hidden md:block overflow-x-auto" tabIndex={0}>
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#F4F6FA]">
                <th className=" p-2 text-left tag-line-xs font-extrabold opacity-0">
                  label
                </th>
                <th className=" p-2 text-left tag-line-xs font-extrabold opacity-0">
                  title
                </th>
                {availableModellingFrameworks.map((framework, frameworkIdx) => (
                  <th
                    key={frameworkIdx}
                    className=" p-2 text-left tag-line-xs font-extrabold"
                    colSpan={1}
                  >
                    {framework}
                  </th>
                ))}
                <th className=" p-2 text-left tag-line-xs font-extrabold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Number of Problems */}
              <tr className="odd:bg-[#BFD8C733]">
                <td
                  className={`p-2 text-left tag-line-sm ${
                    nOfProblemsRowTinted
                      ? TINTED_LABEL_CLASS
                      : PLAIN_LABEL_CLASS
                  }`}
                  colSpan={2}
                >
                  Number of Problems
                </td>
                {summary.map((s, sIdx) => (
                  <td key={sIdx} className=" p-2 text-left tag-line-sm">
                    {s.nOfProblems}
                  </td>
                ))}
                <td className=" p-2 text-left tag-line-sm">
                  {summary.reduce((acc, curr) => acc + curr.nOfProblems, 0)}
                </td>
              </tr>
              {/* Problem Class */}
              {displayedProblemClasses.map((problemClass, problemClassIdx) => (
                <tr key={problemClassIdx} className="odd:bg-[#BFD8C733]">
                  {problemClassIdx === 0 && (
                    <td
                      className={`p-2 text-left tag-line-sm ${
                        problemClassRowTinted
                          ? TINTED_LABEL_CLASS
                          : PLAIN_LABEL_CLASS
                      }`}
                      rowSpan={displayedProblemClasses.length}
                    >
                      Problem Class
                    </td>
                  )}
                  <td className=" p-2 text-left tag-line-sm">{problemClass}</td>
                  {summary.map((s, sIdx) => (
                    <td key={sIdx} className=" p-2 text-left tag-line-sm">
                      {s.problemClasses.get(problemClass) || 0}
                    </td>
                  ))}
                  <td className=" p-2 text-left tag-line-sm">
                    {summary.reduce(
                      (acc, curr) =>
                        acc + (curr.problemClasses.get(problemClass) || 0),
                      0,
                    )}
                  </td>
                </tr>
              ))}
              {/* Application */}
              {displayedApplications.map((application, applicationIdx) => (
                <tr key={applicationIdx} className="odd:bg-[#BFD8C733]">
                  {applicationIdx === 0 && (
                    <td
                      className={`p-2 text-left tag-line-sm ${
                        applicationRowTinted
                          ? TINTED_LABEL_CLASS
                          : PLAIN_LABEL_CLASS
                      }`}
                      rowSpan={displayedApplications.length}
                    >
                      Application
                    </td>
                  )}
                  <td className=" p-2 text-left tag-line-sm">
                    {application === UNSPECIFIED_FILTER_VALUE
                      ? "-"
                      : application}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td key={sIdx} className=" p-2 text-left tag-line-sm">
                      {s.applications.get(application) == -1
                        ? "-"
                        : s.applications.get(application) || 0}
                    </td>
                  ))}
                  <td className=" p-2 text-left tag-line-sm">
                    {summary.reduce((acc, curr) => {
                      const a = acc == -1 ? 0 : acc || 0;
                      const b =
                        curr.applications.get(application) == -1
                          ? 0
                          : curr.applications.get(application) || 0;
                      return a + b;
                    }, 0)}
                  </td>
                </tr>
              ))}
              {/* Time Horizon */}
              {displayedTimeHorizons.map((timeHorizon, timeHorizonIdx) => (
                <tr key={timeHorizonIdx} className="odd:bg-[#BFD8C733]">
                  {timeHorizonIdx === 0 && (
                    <td
                      className={`p-2 text-left tag-line-sm ${
                        timeHorizonRowTinted
                          ? TINTED_LABEL_CLASS
                          : PLAIN_LABEL_CLASS
                      }`}
                      rowSpan={displayedTimeHorizons.length}
                    >
                      Time Horizon
                    </td>
                  )}
                  <td className=" p-2 text-left tag-line-sm">
                    {getTimeHorizonLabel(timeHorizon)}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td key={sIdx} className=" p-2 text-left tag-line-sm">
                      {s.timeHorizons.get(timeHorizon) == -1
                        ? "-"
                        : s.timeHorizons.get(timeHorizon) || 0}
                    </td>
                  ))}
                  <td className=" p-2 text-left tag-line-sm">
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
              {displayedMilpFeatures.map((milpFeature, milpFeatureIdx) => (
                <tr key={milpFeatureIdx} className="odd:bg-[#BFD8C733]">
                  {milpFeatureIdx === 0 && (
                    <td
                      className={`p-2 tag-line-sm text-left ${
                        milpFeaturesRowTinted
                          ? TINTED_LABEL_CLASS
                          : PLAIN_LABEL_CLASS
                      }`}
                      rowSpan={displayedMilpFeatures.length}
                    >
                      MILP Features
                    </td>
                  )}
                  <td className=" p-2 tag-line-sm text-left">
                    {milpFeature || "-"}
                  </td>
                  {summary.map((s, sIdx) => (
                    <td key={sIdx} className=" p-2 tag-line-sm text-left">
                      {s.milpFeatures.get(milpFeature) == -1
                        ? "-"
                        : s.milpFeatures.get(milpFeature) || 0}
                    </td>
                  ))}
                  <td className=" p-2 tag-line-sm text-left">
                    {summary.reduce((acc, curr) => {
                      const a = acc == -1 ? 0 : acc || 0;
                      const b =
                        curr.milpFeatures.get(milpFeature) == -1
                          ? 0
                          : curr.milpFeatures.get(milpFeature) || 0;
                      return a + b;
                    }, 0)}
                  </td>
                </tr>
              ))}
              {/* Size Features */}
              {["True (MILP)", "Other"].map((size, sizeIdx) => (
                <tr key={sizeIdx} className="odd:bg-[#BFD8C733]">
                  {sizeIdx === 0 && (
                    <td
                      className={`p-2 text-left tag-line-sm ${
                        realisticRowTinted
                          ? TINTED_LABEL_CLASS
                          : PLAIN_LABEL_CLASS
                      }`}
                      rowSpan={2}
                    >
                      Realistic
                    </td>
                  )}
                  <td className=" p-2 text-left tag-line-sm">{size || "-"}</td>
                  {summary.map((s, sIdx) => (
                    <td key={sIdx} className=" p-2 text-left tag-line-sm">
                      {" "}
                      {size === "Other"
                        ? s.realSizes.get("other") || 0
                        : `${s.realSizes.get("real") || 0} (${
                            s.realSizes.get("milp") || 0
                          })`}
                    </td>
                  ))}
                  <td className=" p-2 text-left tag-line-sm">
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

        {/* Mobile card layout — vertical key/value, no horizontal scroll */}
        <div className="md:hidden space-y-4">
          {/* Number of Problems */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">
              Number of Problems
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {summary.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="flex justify-between items-center py-0.5"
                >
                  <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                    {s.modellingFramework}
                  </span>
                  <span className="tag-line-xs font-medium shrink-0">
                    {s.nOfProblems}
                  </span>
                </div>
              ))}
              <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                <span className="tag-line-xs font-extrabold">Total</span>
                <span className="tag-line-xs font-extrabold">
                  {summary.reduce((acc, curr) => acc + curr.nOfProblems, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Problem Class */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">Problem Class</h3>
            {displayedProblemClasses.map((problemClass, idx) => {
              const total = summary.reduce(
                (acc, curr) =>
                  acc + (curr.problemClasses.get(problemClass) || 0),
                0,
              );
              return (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""
                  }
                >
                  <p className="tag-line-sm font-semibold mb-2">
                    {problemClass}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {summary.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-0.5"
                      >
                        <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                          {s.modellingFramework}
                        </span>
                        <span className="tag-line-xs font-medium shrink-0">
                          {s.problemClasses.get(problemClass) || 0}
                        </span>
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                      <span className="tag-line-xs font-extrabold">Total</span>
                      <span className="tag-line-xs font-extrabold">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Application */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">Application</h3>
            {displayedApplications.map((application, idx) => {
              const total = summary.reduce((acc, curr) => {
                const a = acc == -1 ? 0 : acc || 0;
                const b =
                  curr.applications.get(application) == -1
                    ? 0
                    : curr.applications.get(application) || 0;
                return a + b;
              }, 0);
              return (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""
                  }
                >
                  <p className="tag-line-sm font-semibold mb-2">
                    {application === UNSPECIFIED_FILTER_VALUE
                      ? "-"
                      : application}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {summary.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-0.5"
                      >
                        <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                          {s.modellingFramework}
                        </span>
                        <span className="tag-line-xs font-medium shrink-0">
                          {s.applications.get(application) == -1
                            ? "-"
                            : s.applications.get(application) || 0}
                        </span>
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                      <span className="tag-line-xs font-extrabold">Total</span>
                      <span className="tag-line-xs font-extrabold">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Horizon */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">Time Horizon</h3>
            {displayedTimeHorizons.map((timeHorizon, idx) => {
              const total = summary.reduce((acc, curr) => {
                const a = acc == -1 ? 0 : acc || 0;
                const b =
                  curr.timeHorizons.get(timeHorizon) == -1
                    ? 0
                    : curr.timeHorizons.get(timeHorizon) || 0;
                return a + b;
              }, 0);
              return (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""
                  }
                >
                  <p className="tag-line-sm font-semibold mb-2">
                    {getTimeHorizonLabel(timeHorizon)}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {summary.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-0.5"
                      >
                        <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                          {s.modellingFramework}
                        </span>
                        <span className="tag-line-xs font-medium shrink-0">
                          {s.timeHorizons.get(timeHorizon) == -1
                            ? "-"
                            : s.timeHorizons.get(timeHorizon) || 0}
                        </span>
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                      <span className="tag-line-xs font-extrabold">Total</span>
                      <span className="tag-line-xs font-extrabold">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MILP Features */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">MILP Features</h3>
            {displayedMilpFeatures.map((milpFeature, idx) => {
              const total = summary.reduce((acc, curr) => {
                const a = acc == -1 ? 0 : acc || 0;
                const b =
                  curr.milpFeatures.get(milpFeature) == -1
                    ? 0
                    : curr.milpFeatures.get(milpFeature) || 0;
                return a + b;
              }, 0);
              return (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""
                  }
                >
                  <p className="tag-line-sm font-semibold mb-2">
                    {milpFeature || "-"}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {summary.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-0.5"
                      >
                        <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                          {s.modellingFramework}
                        </span>
                        <span className="tag-line-xs font-medium shrink-0">
                          {s.milpFeatures.get(milpFeature) == -1
                            ? "-"
                            : s.milpFeatures.get(milpFeature) || 0}
                        </span>
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                      <span className="tag-line-xs font-extrabold">Total</span>
                      <span className="tag-line-xs font-extrabold">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Realistic */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="tag-line-xs font-extrabold mb-3">Realistic</h3>
            {(["True (MILP)", "Other"] as const).map((size, idx) => {
              const total =
                size === "Other"
                  ? summary.reduce(
                      (acc, curr) => acc + (curr.realSizes.get("other") || 0),
                      0,
                    )
                  : `${summary.reduce(
                      (acc, curr) => acc + (curr.realSizes.get("real") || 0),
                      0,
                    )} (${summary.reduce(
                      (acc, curr) => acc + (curr.realSizes.get("milp") || 0),
                      0,
                    )})`;
              return (
                <div
                  key={idx}
                  className={
                    idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""
                  }
                >
                  <p className="tag-line-sm font-semibold mb-2">{size}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {summary.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex justify-between items-center py-0.5"
                      >
                        <span className="tag-line-xs text-navy text-opacity-60 truncate pr-2">
                          {s.modellingFramework}
                        </span>
                        <span className="tag-line-xs font-medium shrink-0">
                          {size === "Other"
                            ? s.realSizes.get("other") || 0
                            : `${s.realSizes.get("real") || 0} (${
                                s.realSizes.get("milp") || 0
                              })`}
                        </span>
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-between items-center pt-1.5 mt-0.5 border-t border-gray-200">
                      <span className="tag-line-xs font-extrabold">Total</span>
                      <span className="tag-line-xs font-extrabold">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkSummaryTable;
