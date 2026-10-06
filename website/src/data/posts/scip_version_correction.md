---
title: "Correction: all SCIP results in the 2025 benchmark ran SCIP 9.2.4"
date: "2026-10-06"
excerpt: "Every SCIP result in the 2025 Open Energy Benchmark was produced by SCIP 9.2.4, whichever SCIP version it is labelled with."
tags: ["correction", "solvers", "benchmark"]
---

Every SCIP result in the 2025 Open Energy Benchmark was produced by SCIP 9.2.4, although the results label it as SCIP 8.0.3 (2022), 8.1.0 (2023), 9.2.0 (2024) or 10.0.0 (2025). The results for all other solvers ran the versions they are labelled with and are not affected.

As a result, the comparison of SCIP releases over time in [The State of Solvers for Energy Planning](https://openenergybenchmark.org/blog/state_of_solvers), and in the report on [Zenodo](https://zenodo.org/records/20429905), does not hold. Its finding that "SCIP shows little change in either the fraction of successfully solved problems or average computational runtime over the tracked period" compares SCIP 9.2.4 with itself. The SCIP numbers themselves are valid measurements of SCIP 9.2.4.

## What happened

The benchmark runs each solver version in its own software environment, which pins that version. The SCIP environments installed the pinned `scip` package, but installed PySCIPOpt, the Python interface to SCIP, from PyPI. The PyPI release of PySCIPOpt (5.7.1) ships with its own copy of SCIP 9.2.4 and loads it instead of the pinned version.

The benchmark labels each result with the version its environment is set up for, not the version the solver reports, so nothing flagged the difference.

## How we confirmed it

- **Code:** every version of the benchmark code used for the 2025 runs installs PySCIPOpt 5.7.1 from PyPI.
- **Results:** the four SCIP labels behave like a single solver. All 96 problems solved under every label have the same objective under each, with runtimes within 2% of each other. For comparison, three genuine HiGHS releases agree on 89 of the same 96 problems, with runtimes about 8% apart.
- **Solver logs:** SCIP's presolve statistics are deterministic for a given SCIP build and change between releases. In the 815 SCIP logs from the 2025 runs, all 189 problems run under more than one label have identical presolve statistics under every label.

To identify the version, we re-solved two of these problems with each genuine SCIP release and the same settings as the benchmark. Only SCIP 9.2.4 reproduces the 2025 logs:

| SCIP release | FINE-water-supply-system-12-8760ts (MILP) | FINE-2-node-electricity-supply-system-2-8760ts (LP) |
| ------------ | ----------------------------------------- | --------------------------------------------------- |
| 8.0.3        | Differs                                   | Differs                                             |
| 9.2.0        | Differs                                   | Differs                                             |
| 9.2.4        | Matches                                   | Matches                                             |
| 10.0.0       | Differs                                   | Differs                                             |

## What we are doing

- **Fixing the environments:** each SCIP environment will run the SCIP version it pins, by installing PySCIPOpt built against that version ([#623](https://github.com/open-energy-transition/solver-benchmark/pull/623)).
- **Checking every run:** before solving, the benchmark will check that each solver reports the version its results are labelled with, and stop otherwise ([#624](https://github.com/open-energy-transition/solver-benchmark/pull/624)). This check would have caught the problem.
- **Re-running SCIP:** we will re-run the SCIP benchmarks for 2022 to 2025 and update the results and the report.

Until then, please do not use the 2025 results to compare SCIP versions with each other.
