import FilterSection from "./FilterSection"

const TableResult = () => {
  return (
    <div>
      <div className="text-navy font-bold pb-6 pt-9">Raw results data</div>
      <div className="flex gap-2">
        <div className="rounded-xl w-max overflow-auto">
          <table className="table-auto bg-white">
            <thead>
              <tr>
                <th className="text-center text-navy py-4 px-6">Solver</th>
                <th className="text-center text-navy py-4 px-6">Status</th>
                <th className="text-center text-navy py-4 px-6 ">
                  <div className="w-[7.75rem] whitespace-nowrap overflow-hidden">
                    Terminational Condition
                  </div>
                </th>
                <th className="text-center text-navy py-4 px-6">
                  Objective Value
                </th>
                <th className="text-center text-navy py-4 px-6">Runtime</th>
                <th className="text-center text-navy py-4 px-6">Memory</th>
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
