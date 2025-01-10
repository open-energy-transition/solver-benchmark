import { ArrowIcon } from "@/assets/icons";
import { useState } from "react";

const ResultsSection = () => {
  const columns = [
    {
      name: "Rank:",
      field: "rank",
      width: "flex-1",
      bgColor: "bg-light-grey/50",
      color: "text-dark-grey",
    },
    {
      name: "Solver:",
      field: "solver",
      width: "w-1/6",
      bgColor: "bg-light-grey",
      color: "text-dark-grey",
    },
    {
      name: "Version",
      field: "version",
      width: "w-1/6",
      bgColor: "bg-lavender/50",
      color: "text-navy font-semibold",
    },
    {
      name: "Memory",
      field: "memory",
      width: "w-1/5",
      bgColor: "bg-lavender/80",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
    {
      name: "Solved Benchmarks",
      field: "solvedBenchmarks",
      width: "w-1/5",
      bgColor: "bg-lavender",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
    {
      name: "Runtime",
      field: "runtime",
      width: "w-1/5",
      bgColor: "bg-lime-green",
      color: "text-navy font-semibold",
      hasDropdown: true,
    },
  ];
  // Define mock data
  const mockData = [
    {
      rank: 1,
      solver: "HiGHS",
      version: "1.81",
      memory: "3.4",
      solvedBenchmarks: 28,
      runtime: "1.0",
    },
    {
      rank: 2,
      solver: "GLPK",
      version: "9.1.1",
      memory: "1.0",
      solvedBenchmarks: 18,
      runtime: "2.1",
    },
    {
      rank: 3,
      solver: "SCIP",
      version: "5.0",
      memory: "5.6",
      solvedBenchmarks: 8,
      runtime: "3.4",
    },
  ];

  const [activedIndex, setActivedIndex] = useState(0);

  return (
    <div>
      <div className="pb-3 pl-3">
        <div className="text-navy font-bold text-xl">Results</div>
        <div className="text-dark-grey text-sm">
          We rank solvers by normalized shifted geometric mean (SGM) of runtime
          and memory consumption over all benchmarks
        </div>
      </div>
      <div className="flex text-xs leading-1.5">
        {columns.map((column, i) => (
          <div
            key={column.field}
            className={`first-of-type:rounded-tl-2xl first-of-type:rounded-bl-2xl last-of-type:rounded-tr-2xl last-of-type:rounded-br-2xl ${column.color} ${column.bgColor} ${column.width}`}
          >
            <div className="h-9 flex items-center gap-1 pl-3 pr-6">
              {column.name}
              {column.hasDropdown && (
                <ArrowIcon fill="none" stroke="black" className="w-2 h-2" />
              )}
            </div>

            {mockData.map((item, index) => (
              <div
                key={`${column.field}-${index}`}
                className={`h-6 flex items-center pl-3 pr-6 ${
                  activedIndex === index
                    ? `border-b border-t border-[#CAD3D0] ${
                        i === 0 ? "border-l" : ""
                      } ${i === columns.length - 1 ? "border-r" : ""}`
                    : ""
                }`}
                onClick={() => setActivedIndex(index)}
              >
                {item[column.field as keyof (typeof mockData)[0]]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;
