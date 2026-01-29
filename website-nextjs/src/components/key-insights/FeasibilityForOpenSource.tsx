import React from "react";
import ProblemClassTable from "./charts/ProblemClassTable";
import Note from "../shared/Note";
import Link from "next/link";
import { useScrollSpy } from "@/hooks/useScrollSpy";

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
        There are some important caveats to keep in mind when comparing spatial
        and temporal resolutions across different modelling frameworks.
        Concerning spatial resolution, regions and number of nodes do not
        represent the same entity and cannot be compared; in general, some
        models use nodes to disaggregate the spatial scale due to a larger
        detail needed on power sector analysis and/or on the feedback of other
        sectors on the electrical grid, while regions are used to ease data
        aggregation from energy use statistics and for analysis with a broader
        focus on the system itself rather than on the physical structure of the
        (electricity, but not only) network. Furthermore, some nodal models can
        use a hybrid approach to also aggregate nodes to reflect a regional
        focus. Regarding temporal resolution, time slices are aggregations of
        time frames with similar energy production/consumption features.
        Therefore, to give and idea of the correspondence with a 1 hour
        resolution-model, a model adopting time slices should consider 8760 time
        slices per year, with different data (and thus results) associated to
        each of them.
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
          href="dashboard/benchmark-set/times-ireland-noco2-counties"
        >
          Times-Ireland-noco2-counties (26-1ts)
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
