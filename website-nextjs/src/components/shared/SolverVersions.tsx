const SolverVersions = ({}) => {
  return (
    <div>
      Our platform includes the highest version of each solver released on conda
      each year since 2020. For 2025, we include a solver version if the solver
      had a major or minor release in 2025 as of April 20, 2025. The 2025
      results will be updated with the last version released in 2025 at the end
      of this year. Some solver versions are not available on conda or have
      compatibility issues with our benchmarking infrastructure, see{" "}
      <a
        className="underline"
        href="https://github.com/open-energy-transition/solver-benchmark?tab=readme-ov-file#solver-versions"
      >
        here
      </a>{" "}
      for more details. (GLPK has not had a release since 2020.)
    </div>
  );
};

export default SolverVersions;
