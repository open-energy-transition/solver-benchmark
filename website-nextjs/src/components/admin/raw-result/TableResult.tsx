import FilterSection from "./FilterSection"

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
      field: "terminational-condition",
      sort: true,
      className: "w-[7.75rem] whitespace-nowrap overflow-hidden",
    },
    {
      name: "Objective Value",
      field: "objective-value",
    },
    {
      name: "Runtime",
      field: "runtime",
    },
    {
      name: "Memory",
      field: "memory",
    },
  ]
  return (
    <div>
      <div className="text-navy font-bold pb-6 pt-9">Raw results data</div>
      <div className="flex gap-2">
        <div className="rounded-xl w-max overflow-auto">
          <table className="table-auto bg-white">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.field}
                    className="text-center text-navy py-4 px-6"
                  >
                    <div className={col.className}>{col.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">GLPK</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">GLPK</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">SCIP</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
              <tr className="odd:bg-grey">
                <td className="text-[#666666] text-start py-4 px-6">HiGHS</td>
                <td className="text-[#666666] text-start py-4 px-6">OK</td>
                <td className="text-[#666666] text-start py-4 px-6">TIMEOUT</td>
                <td className="text-[#666666] text-start py-4 px-6">
                  18723872
                </td>
                <td className="text-[#666666] text-start py-4 px-6">308</td>
                <td className="text-[#666666] text-start py-4 px-6">32</td>
              </tr>
            </tbody>
          </table>
        </div>
        <FilterSection />
      </div>
    </div>
  )
}

export default TableResult
