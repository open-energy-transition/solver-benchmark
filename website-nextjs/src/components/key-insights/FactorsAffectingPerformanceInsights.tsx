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
      <p></p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "pypsa-de-elec-10-1h",
          "pypsa-de-elec-20-1h",
          "pypsa-de-elec-50-1h",
        ]}
        extraCategoryLengthMargin={5}
      />
      <h5>Effect of increasing temporal resolutions on PyPSA models</h5>
      <p></p>
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
        genx-10_IEEE_9_bus_DC_OPF-9-1h is an MILP problem that adds UC as an
        extra model constraint to the power sector model
        genx-10_IEEE_9_bus_DC_OPF-no_uc-9-1h (LP problem). Open source solvers
        are slower on the MILP problem with UC, whereas commercial solvers
        actually have better MILP performance in this case. Recall that we run
        all solvers with their default options except for setting a relative
        duality (MIP) gap tolerance; in particular this means that some solvers
        may choose to run crossover and others not, which could affect
        performance of the UC case.
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
        pypsa-eur-elec-op-ucconv-2-3h is an MILP problem that adds UC as an
        extra model constraint to the power sector operational model
        pypsa-eur-elec-op-2-1h (LP problem). Despite having different temporal
        resolutions (1h VS 3h), open source solvers are slower on the MILP
        problem with UC, whereas commercial solvers have good MILP performance
        and the gap between the LP and MILP is probably due to the LP problem
        having a higher temporal resolution. Recall that we run all solvers with
        their default options except for setting a relative duality (MIP) gap
        tolerance; in particular this means that some solvers may choose to run
        crossover and others not, which could affect performance of the UC case.
      </p>
      {/* Chart  */}
      <RuntimeOfFastestSolver
        benchmarkList={["pypsa-power+ely-1-1h", "pypsa-power+ely-ucgas-1-1h"]}
        xAxisLabelWrapLength={18}
      />
      <h5>
        Effect of transmission expansion and CO2 constraints on GenX models
      </h5>
      <p></p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "genx-elec_trex-15-168h",
          "genx-elec_trex_co2-15-168h",
          "genx-elec_co2-15-168h",
        ]}
      />
      <h5>Effect of increasingly stringent CO2 constraints on TEMOA models</h5>
      <p>
        In this set of TEMOA models, the 1st case has no CO2 constraints, the
        2nd one considers US Nationally Determined Contributions (NDCs), and the
        3rd one enforces net-zero emissions by 2050. It is not surprising here
        to see that, with Gurobi, increasingly stringent CO2 constraints add
        runtime requirements with respect to the base case. However, the case of
        HiGHS needs to be investigated as the 2nd case, despite a less stringent
        CO2 constraint, cannot be solved, while this is not true for the 3rd
        case.
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
