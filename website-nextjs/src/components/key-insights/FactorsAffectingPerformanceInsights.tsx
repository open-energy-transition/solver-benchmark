import { useScrollSpy } from "@/hooks/useScrollSpy";
import PerformanceScalling from "./charts/factors-affecting-performance/PerformanceScalling";
import RuntimeOfFastestSolver from "./charts/factors-affecting-performance/RuntimeOfFastestSolver";

const HASH = "what-factors-affect-solver-performance";
const FactorsAffectingPerformanceInsights = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH}`,
    threshold: 0.1,
  });

  return (
    <div ref={sectionRef} id={HASH} className="scroll-mt-[9rem]">
      {/* Content */}
      <h4 id="what-factors-affect-solver-performance">
        What factors affect solver performance?
      </h4>
      <p>
        The most obvious driver of solver performance is the number of variables
        in the LP/MILP problem, and the plot below shows the correlation between
        runtime and number of variables. The toggle allows you to select open
        source solvers only, or all solvers. Each green dot represents the
        runtime of the fastest (open source) solver on a problem with a given
        number of variables, and a red X denotes that no (open source) solver
        could solve the problem within the timeout (1 hr for small and medium
        problems, and 24 hrs for large problems). The plot gives an indication
        of the order of magnitude at which solvers start to hit the timeout.
      </p>
      <PerformanceScalling />
      <p>
        The rest of this section examines the effect of different model features
        on solver performance. You can use the toggles to select between open
        source solvers only, or all solvers. Hovering over a model name shows
        you the details of the model scenario, including application type,
        constraints, LP/MILP, etc.
      </p>
      <h5>Effect of increasing spatial resolutions on PyPSA models</h5>
      <p>
        While only HiGHS among open solvers is able to solve the smallest
        instance (10-1h), at a higher number of nodes Gurobi highlights the
        expected nonlinear growth in computational effort as model size and
        complexity expand.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "pypsa-de-elec-10-1h",
          "pypsa-de-elec-20-1h",
          "pypsa-de-elec-50-1h",
        ]}
        extraCategoryLengthMargin={5}
      />
      <h5>Effect of increasing temporal resolutions on PyPSA models</h5>
      <p>
        Again, only HiGHS among open solvers can solve the smallest instance
        (50-168h). On the other hand, as temporal resolution increases (from
        168h to 24h and below), Gurobi runtime escalates dramatically: while the
        weekly aggregation solves in seconds, the daily resolution already
        requires nearly an hour, and finer resolutions hit the time limit (1
        hour).
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "pypsa-eur-elec-50-168h",
          "pypsa-eur-elec-50-24h",
          "pypsa-eur-elec-50-12h",
          "pypsa-eur-elec 50-3h",
        ]}
        extraCategoryLengthMargin={5}
      />
      <h5>Effect of unit commitment (UC) on GenX models</h5>
      <p>
        `genx-10_IEEE_9_bus_DC_OPF-9-1h` is an MILP problem that adds UC as an
        extra model constraint to the power sector model
        `genx-10_IEEE_9_bus_DC_OPF-no_uc-9-1h` (LP problem). Adding unit
        commitment (UC) transforms the LP DC-OPF into an MILP and fundamentally
        changes solver performance. In the LP case, runtimes are in the order of
        seconds with HiGHS (which also outperforms Gurobi in this case), while
        the MILP formulation introduces a dramatic increase in computational
        effort. In this benchmark, Gurobi is the fastest solver for the UC case
        (28 seconds), whereas the fastest open-source solver (SCIP) requires
        around 40 minutes, illustrating the substantial performance gap that can
        emerge once integer variables are introduced. All solvers are run with
        default settings except for a fixed relative MIP gap tolerance.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "genx-10_IEEE_9_bus_DC_OPF-no_uc-9-1h",
          "genx-10_IEEE_9_bus_DC_OPF-9-1h",
        ]}
        xAxisLabelRotation={-40}
        xAxisLabelWrapLength={6}
        splitter="_"
      />
      <h5>Effect of unit commitment (UC) on PyPSA models</h5>
      <p>
        `pypsa-power+ely-ucgas-1-1h` is an MILP problem that adds UC as an extra
        model constraint to the power-only model `pypsa-power+ely-1-1h` (LP
        problem). The LP version solves in a few seconds with both Gurobi and
        Highs, while the MILP version requires significantly more time. Gurobi
        maintain relatively strong performance in the UC case, whereas
        open-source solvers exhibit a more pronounced slowdown. All solvers are
        run with default settings except for a fixed relative MIP gap tolerance.
      </p>
      {/* Chart  */}
      <RuntimeOfFastestSolver
        benchmarkList={["pypsa-power+ely-1-1h", "pypsa-power+ely-ucgas-1-1h"]}
        xAxisLabelWrapLength={18}
      />
      <h5>
        Effect of transmission expansion and CO2 constraints on GenX models
      </h5>
      <p>
        Under open-source solvers, all three GenX variants hit the time limit,
        failing in providing any indication about the effect of transmission
        expansion optimization and CO2 constraints. When including Gurobi, the
        models become solvable within reasonable time, but runtimes vary
        significantly: adding both transmission expansion and CO2 constraints
        leads to the longest solve time (2h 45min), while models with only one
        of the features solve faster (around 1h 30min). This highlights how
        stacking structural constraints can materially increase computational
        complexity, even when the formulation remains linear.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "genx-elec_trex-15-168h",
          "genx-elec_trex_co2-15-168h",
          "genx-elec_co2-15-168h",
        ]}
      />
      <h5>Effect of increasingly stringent CO2 constraints on TEMOA models</h5>
      <p>
        Increasing the stringency of CO2 constraints affects solver performance
        differently across solver families. Under open-source solvers, runtime
        increases substantially when moving from the base case to constrained
        scenarios, with the NDC case being particularly challenging. When
        including all solvers, the models solve in a few minutes and runtimes
        increase only moderately as constraints become more stringent. Notably,
        the NDC case exhibits atypical behavior for HiGHS (unsolved under the
        open-only view), despite being less stringent than the net-zero case,
        indicating solver-specific sensitivity to model structure rather than
        constraint stringency alone.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "temoa-US_9R_TS-9-12ts",
          "temoa-US_9R_TS_NDC-9-12ts",
          "temoa-US_9R_TS_SP-9-12ts",
          "temoa-US_9R_TS_NZ-9-12ts",
        ]}
        xAxisLabelWrapLength={18}
      />
    </div>
  );
};

export default FactorsAffectingPerformanceInsights;
