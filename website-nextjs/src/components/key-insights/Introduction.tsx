import React from "react";
import { PATH_DASHBOARD } from "@/constants/path";

const Introduction = () => {
  return (
    <>
      <p>
        This platform contains the results of benchmarking 5 optimization
        solvers on 120 problems arising from energy system models. For each
        benchmark run, we measure runtime and memory consumption of the solver,
        along with{" "}
        <a className="font-bold" href="/methodology/#metrics">
          other metrics
        </a>{" "}
        to ensure solution quality across solvers.
      </p>
      <p>
        Note that we run all solvers with their default options, with some
        exceptions – see full details on our{" "}
        <a className="font-bold" href="/methodology/">
          Methodology
        </a>{" "}
        page. We also gather information such as the number of variables and
        constraints for each problem instance, along with information about the
        scenario being modelled by each problem, this along with download links
        to each problem can be found on our{" "}
        <a className="font-bold" href={PATH_DASHBOARD.benchmarkSet.list}>
          Benchmark Set
        </a>{" "}
        page.
      </p>
      <p>
        This page presents the main takeaways from our benchmark platform, in an
        introductory and accessible manner. Advanced users, and those wishing to
        dig into more details can visit the{" "}
        <a className="font-bold" href={PATH_DASHBOARD.home}>
          full results
        </a>{" "}
        in our interactive dashboards.
      </p>
    </>
  );
};

export default Introduction;
