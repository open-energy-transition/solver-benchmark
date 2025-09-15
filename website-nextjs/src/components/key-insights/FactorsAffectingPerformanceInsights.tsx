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
        problems, and 10 hrs for large problems). The plot gives an indication
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
      <h5>
        Effect of increasing spatial and temporal resolutions on PyPSA models
      </h5>
      <p>
        This is a series of different size instances of a PyPSA-Eur
        sector-coupled model, where the spatial and temporal resolution are
        varied to create increasingly larger LP problems. One can see the
        runtime of solvers increasing as either resolution is made more fine
        grained.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "pypsa-eur-sec-2-24h",
          "pypsa-eur-sec-6-24h",
          "pypsa-eur-sec-5-12h",
          "pypsa-eur-sec-2-3h",
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
          "genx-10_IEEE_9_bus_DC_OPF-9-1h",
          "genx-10_IEEE_9_bus_DC_OPF-no_uc-9-1h",
        ]}
        xAxisLabelRotation={-35}
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
        benchmarkList={[
          "pypsa-eur-elec-op-2-1h",
          "pypsa-eur-elec-op-ucconv-2-3h",
        ]}
        xAxisLabelWrapLength={18}
      />
      <h5>
        Effect of UC, transmission expansion, and CO2 constraints on GenX models
      </h5>
      <p>
        The set of GenX benchmarks below compares solver performance on 1) a
        case with optimal transmission expansion, 2) a case with both optimal
        transmission expansion and a CO2 constraint, 3) a case with transmission
        expansion and UC, and 4) a case with CO2 emission constraints. All the
        benchmarks except for genx-elec_trex_uc-15-24h share the same spatial
        and temporal resolution, except for genx-elec-trex_uc-15-24h (the
        corresponding 168h instance fails due to memory issues).{" "}
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "genx-elec_trex-15-168h",
          "genx-elec_trex_co2-15-168h",
          "genx-elec_trex_uc-15-24h",
          "genx-elec_co2-15-168h",
        ]}
      />
      <p>
        Stacking transmission expansion optimality and CO2 constraint leads to
        almost 2X the solution time of the cases taking into account one of the
        two features at a time. As in the PyPSA-Eur case above, the effect of UC
        on Gurobi solution time looks negligible with respect to the different
        time resolution, though for a better comparison a case with UC and the
        same time resolution as for the other benchmarks listed here would be
        needed.
      </p>
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
          "temoa-US_9R_TS-9-12",
          "temoa-US_9R_TS_NDC-9-12",
          "temoa-US_9R_TS_NZ-9-12",
        ]}
        xAxisLabelWrapLength={18}
      />
      <h5>Effect of time horizons on TIMES models</h5>
      <p>
        The comparison on two eTIMES-EU benchmarks highlights how the addition
        of multi-stage analysis (in this case 8 optimization periods) in perfect
        foresight has a large impact on runtime in Gurobi. Though one could
        expect an increase in runtime comparable to the increase in solution
        stages, proprietary solvers take approximately 180x more time on the
        multi-stage problem.
      </p>
      <RuntimeOfFastestSolver
        benchmarkList={[
          "times-etimeseu-europe-elec+heat-co2-single_stage-29-64ts",
          "times-etimeseu-europe-elec+heat-co2-multi_stage-29-64ts",
        ]}
        xAxisLabelRotation={-45}
        xAxisLabelWrapLength={5}
      />
    </div>
  );
};

export default FactorsAffectingPerformanceInsights;
