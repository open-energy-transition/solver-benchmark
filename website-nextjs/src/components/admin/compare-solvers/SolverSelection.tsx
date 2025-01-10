const SolverSelection = () => {
  const solvers = [
    {
      label: "GLPK",
    },
    {
      label: "Highs",
    },
  ]

  return (
      <div className="flex gap-4 mt-6 mb-4">
        <select name="solver1" className="w-1/4 px-6 py-4 bg-white border-r-[1.5rem] border-transparent outline outline-stroke outline-1 text-navy text-base rounded-lg focus:ring-white focus:border-white block">
          <option selected>Choose solver 1</option>
          {solvers.map((solver, idx) => (
            <option key={idx} value={solver.label}>
              {solver.label}
            </option>
          ))}
        </select>
        <select name="solver2" className="w-1/4 px-6 py-4 bg-white border-r-[1.5rem] border-transparent outline outline-stroke outline-1 text-navy text-base rounded-lg focus:ring-white focus:border-white block">
          <option selected>Choose solver 2</option>
          {solvers.map((solver, idx) => (
            <option key={idx} value={solver.label}>
              {solver.label}
            </option>
          ))}
        </select>
        <button className=" w-max md:w-52 rounded-lg px-7 py-3 text-base text-white font-bold bg-teal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          SEND
        </button>
      </div>
  )
}
export default SolverSelection
