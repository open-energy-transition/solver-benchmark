import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
// internal
import FilterSection from "./FilterSection";
import { BenchmarkResult } from "@/types/benchmark";

const TableResult = () => {
  const columns = [
    {
      name: "Solver",
      field: "solver",
      sort: true,
    },
    {
      name: "Status",
      field: "status",
      sort: true,
    },
    {
      name: "Terminational Condition",
      field: "terminationCondition",
      sort: true,
      className: "w-[7.75rem] whitespace-nowrap overflow-hidden",
    },
    {
      name: "Objective Value",
      field: "objectiveValue",
    },
    {
      name: "Runtime",
      field: "runtime",
    },
    {
      name: "Memory",
      field: "memoryUsage",
    },
  ];

  const benchmarkResults = useSelector(
    (state: { results: { rawBenchmarkResults: BenchmarkResult[] } }) => {
      return state.results.rawBenchmarkResults;
    }
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "" });
  const [filterQuery, setFilterQuery] = useState("");

  // Filter results based on query
  const filteredResults = useMemo(() => {
    return benchmarkResults.filter((benchmark) =>
      Object.values(benchmark).some((value) =>
        String(value).toLowerCase().includes(filterQuery.toLowerCase())
      )
    );
  }, [benchmarkResults, filterQuery]);

  // Sort results based on configuration
  const sortedResults = useMemo(() => {
    if (sortConfig.field) {
      return [...filteredResults].sort((a, b) => {
        if (a[sortConfig.field] < b[sortConfig.field]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.field] > b[sortConfig.field]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredResults;
  }, [filteredResults, sortConfig]);

  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage, rowsPerPage]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { field, direction: "asc" };
    });
  };

  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);

  return (
    <div>
      <div className="text-navy font-bold pb-6 pt-9">Raw results data</div>
      <div className="flex gap-2">
        <div className="w-3/4">
          <div className="rounded-xl overflow-auto">
            <table className="table-auto bg-white w-full">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.field}
                      className="text-center text-navy py-4 px-6 cursor-pointer"
                      onClick={() => col.sort && handleSort(col.field)}
                    >
                      <div className={col.className || ""}>
                        {col.name}
                        {sortConfig.field === col.field &&
                          (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((benchmark, idx) => (
                  <tr key={idx} className="odd:bg-grey">
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.solver}
                    </td>
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.status}
                    </td>
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.terminationCondition}
                    </td>
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.objectiveValue}
                    </td>
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.runtime}
                    </td>
                    <td className="text-[#666666] text-start py-4 px-6">
                      {benchmark.memoryUsage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              className="px-4 py-2 bg-navy text-white rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-4 py-2 bg-navy text-white rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
        <div className="w-1/4">
        <FilterSection />
        </div>
      </div>
    </div>
  );
};

export default TableResult;
