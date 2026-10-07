---
title: "Correction: all SCIP results in the 2025 benchmark ran SCIP 9.2.4"
date: "2026-10-06"
excerpt: "Every SCIP result in the 2025 Open Energy Benchmark was produced by SCIP 9.2.4, whichever SCIP version it is labelled with."
tags: ["correction", "solvers", "benchmark"]
---

Every SCIP result in the 2025 Open Energy Benchmark was produced by SCIP 9.2.4, although the results label it as SCIP 8.0.3 (2022), 8.1.0 (2023), 9.2.0 (2024) or 10.0.0 (2025). The results for all other solvers ran the versions they are labelled with and are not affected.

As a result, the comparison of SCIP releases over time in [The State of Solvers for Energy Planning](https://openenergybenchmark.org/blog/state_of_solvers), and in the report on [Zenodo](https://zenodo.org/records/20429905), does not hold. Its finding that "SCIP shows little change in either the fraction of successfully solved problems or average computational runtime over the tracked period" compares SCIP 9.2.4 with itself. The SCIP numbers themselves are valid measurements of SCIP 9.2.4.

## What happened

In the 2025 benchmark, each year's solver versions ran in a software environment that pinned those versions. The environments installed the pinned `scip` package, but installed PySCIPOpt, the Python interface to SCIP, from PyPI. The PyPI release of PySCIPOpt (5.7.1) ships with its own copy of SCIP 9.2.4 and is linked to that copy, so the pinned SCIP was installed but never used.

The benchmark took each result's SCIP version from the installed `scip` package, not from the solver itself, so nothing flagged the difference.

## When it started

Until November 2025, the SCIP environments installed PySCIPOpt from conda-forge, built against the pinned SCIP. The switch to PyPI happened while preparing the 2025 benchmark, and later changes to the environments kept it:

| Date                           | Change                                                                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25 November 2025               | The 2025 environment (SCIP 10.0.0) installs PySCIPOpt 5.7.1 from PyPI, because that release was not yet on conda-forge.                                                                       |
| 3 December 2025                | The 2022 and 2023 environments (SCIP 8.0.3 and 8.1.0) switch from PySCIPOpt 4.3.0 and 4.4.0 on conda-forge to 5.7.1 from PyPI, together with a newer linopy.                                  |
| 8 December 2025                | The 2024 environment (SCIP 9.2.0) is brought back with PySCIPOpt 5.7.1 from PyPI. SCIP 2024 had been left out because no PySCIPOpt build on conda-forge worked with SCIP 9.2.0.               |
| 12 December 2025 to March 2026 | The 2025 benchmark runs, all with SCIP 9.2.4.                                                                                                                                                 |
| 28 January and 4 February 2026 | The changes reach the main branch ([#384](https://github.com/open-energy-transition/solver-benchmark/pull/384), [#405](https://github.com/open-energy-transition/solver-benchmark/pull/405)). |
| 5 August 2026                  | The move to one environment per solver and year keeps PySCIPOpt 5.7.1 from PyPI for all four SCIP versions ([#416](https://github.com/open-energy-transition/solver-benchmark/pull/416)).     |
| 25 September 2026              | The move of the environments to pixi keeps it too ([#581](https://github.com/open-energy-transition/solver-benchmark/pull/581)).                                                              |
| 5 October 2026                 | We found the problem and proposed a fix ([#623](https://github.com/open-energy-transition/solver-benchmark/pull/623)).                                                                        |

## How we confirmed it

- **Code:** all nine versions of the benchmark code recorded by the 2025 SCIP results install PySCIPOpt 5.7.1 from PyPI for all four SCIP versions.
- **Results:** the four SCIP labels behave like a single solver. On the 91 problems solved both under every SCIP label and by four genuine HiGHS releases (1.5 to 1.12), the SCIP labels give the same objective on all 91, with runtimes typically 2% apart. The HiGHS releases give the same objective on 82 of the 91, with runtimes typically 26% apart.
- **Log formats:** SCIP 10 writes some log lines differently from SCIP 9, and SCIP 8 writes others differently again. Of the 815 SCIP logs from the 2025 runs, 801 use SCIP 9's formats, whatever their label, and none uses SCIP 8's or SCIP 10's. The other 14 stop too early to tell.
- **Presolve statistics:** for a given SCIP build these are deterministic, and they can change even between patch releases, such as 9.2.0 and 9.2.4. All 189 problems run under more than one label show the same presolve statistics under every label.

To identify the exact version, we re-solved two of these problems with each genuine SCIP release and the same settings as the benchmark. Only SCIP 9.2.4 reproduces the 2025 logs. Four more problems re-solved with SCIP 9.2.4 match too.

| SCIP release | FINE-water-supply-system-12-8760ts (MILP) | FINE-2-node-electricity-supply-system-2-8760ts (LP) |
| ------------ | ----------------------------------------- | --------------------------------------------------- |
| 8.0.3        | Differs                                   | Differs                                             |
| 9.2.0        | Differs                                   | Differs                                             |
| 9.2.4        | Matches                                   | Matches                                             |
| 10.0.0       | Differs                                   | Differs                                             |

We checked the other solvers too. The CBC, GLPK and HiGHS logs report the versions their results are labelled with, except HiGHS 1.9.0, which does not write its version to the log. For HiGHS 1.9.0, and for Gurobi, whose logs are not public, the environments install the labelled versions, and their results differ between versions as genuine releases do.

## What we did

- **Fixed the environments:** each SCIP environment now runs the SCIP version it pins, by installing PySCIPOpt built against that version ([#623](https://github.com/open-energy-transition/solver-benchmark/pull/623)).
- **Added a check to every run:** before solving, the benchmark now checks that each solver reports the version its results are labelled with, and stops otherwise ([#624](https://github.com/open-energy-transition/solver-benchmark/pull/624)). This check would have caught the problem.
- **Added notes to the website:** the landing page, the key insights page and the performance history dashboard now point to this post.

## What comes next

We will run the v3 benchmark at the end of 2026, with updated solver versions and these fixes. Until its results are published, please do not use the 2025 results to compare SCIP versions with each other.
