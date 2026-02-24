import React from "react";
import ProblemClassTable from "./charts/ProblemClassTable";
import Note from "../shared/Note";
import Link from "next/link";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { PATH_DASHBOARD } from "@/constants/path";

const HASH = "what-is-feasible-for-open-source-solvers";
const FeasibilityForOpenSource = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
  });

  return (
    <div ref={sectionRef} id={HASH} className="scroll-mt-[9rem]">
      <div className="h4 info-pages-heading">
        What is feasible for open source solvers?
      </div>
      <p>
        Here are the largest LP and MILP problems that open source solvers can
        solve, from each modelling framework in our set. Please note that we did
        not generate / collect benchmark problems with the intention of finding
        the largest ones solvable by open solvers – so there could be larger
        problems solvable by open solvers than those in our set. This section
        can still be used to get an idea of the kinds of spatial and temporal
        resolutions that are solvable in reasonable time periods by open source
        solvers, and we encourage the community to contribute more benchmark
        problems so we can more accurately identify the boundary of feasibility.
      </p>
      <p>
        Clicking on any benchmark problem name takes you to the benchmark
        details page that contains more information on the model scenario,
        various size instances, full results on that problem, and download links
        to the problem LP/MPS file and solver logs and solution files.
      </p>
      <ProblemClassTable problemClass="LP" />
      <Note>
        There are several important caveats to consider when comparing spatial
        and temporal resolutions across different modelling frameworks. With
        respect to spatial resolution, regions and nodes do not represent the
        same concept and therefore cannot be directly compared. In general, some
        models use nodes to disaggregate the spatial scale when a higher level
        of detail is required, particularly for power sector analyses and for
        capturing feedbacks from other sectors on the electricity grid. By
        contrast, regions are often employed to facilitate data aggregation from
        energy-use statistics and to support analyses with a broader
        system-level focus, rather than on the physical structure of the
        (electricity, and more broadly energy) network. Moreover, some nodal
        models adopt hybrid approaches in which nodes are partially aggregated
        to reflect a regional perspective. Regarding temporal resolution, time
        slices represent aggregations of time periods with similar energy
        production and consumption characteristics. Consequently, to establish
        an equivalence with a model operating at an hourly resolution, a
        time-slice-based model would, in principle, require 8,760 time slices
        per year, each associated with distinct input data and, therefore,
        potentially different results.
      </Note>
      <p>
        Given the limitations of our benchmark set, the strongest observable
        influence on runtime is model size, in terms of number of
        variables/constraints (see more details in{" "}
        <a className="font-bold" href="#what-factors-affect-solver-performance">
          What factors affect solver performance
        </a>{" "}
        below). This is despite the fact that the above problems do not share
        many features and are built with different spatial/temporal resolutions
        and time horizons. It is also interesting that a realistic TEMOA-based
        problem like{" "}
        <Link
          className="font-bold"
          href="/dashboard/benchmark-set/temoa-US_9R_TS_SP"
        >
          temoa-US_9R_TS_SP (9-12)
        </Link>{" "}
        does not have similar runtime to the largest solved TIMES-based model,{" "}
        <Link
          className="font-bold"
          href={PATH_DASHBOARD.benchmarkSet.one.replace(
            "{name}",
            "TIMES-GEO-global-netzero",
          )}
        >
          TIMES-GEO-global-netzero (31-20ts)
        </Link>
        , despite both having &gt; 1e6 variables.
      </p>
      <ProblemClassTable problemClass="MILP" />
      <p>
        We note that we do not yet have large problem instances from some
        modelling frameworks in our benchmark set. We welcome contributions to
        fill these gaps!
      </p>
    </div>
  );
};

export default FeasibilityForOpenSource;
