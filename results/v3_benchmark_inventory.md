# Benchmark inventory: v2 vs potential v3

As of 2026-09-24 (`origin/main` @ 28a8552).

- **Run in v2**: problems with results in `results/benchmark_results.csv` (last updated 2026-03-13, #314).
- **Potential for v3**: all problems in `results/metadata.yaml` on `main`.
- **v3 without skipped**: excludes problems with a non-empty `Skip because` field.

## Summary

| | Problems |
|---|---:|
| **Run in v2** | **213** |
| Added since v2 | +150 |
| In v2 metadata but not run | +15 |
| **Potential for v3** | **378** |
| v3 without skipped | 353 |

## By modelling framework

| Framework | Run in v2 | Added since v2 | In v2 metadata but not run | Potential for v3 | v3 without skipped |
|---|---:|---:|---:|---:|---:|
| PyPSA | 80 | **113** | – | 193 | 179 |
| Sienna | 36 | – | – | 36 | 36 |
| GenX | 20 | – | – | 20 | 20 |
| MIPLIB | – | **19** | – | 19 | 19 |
| TIMES | 15 | – | 3 | 18 | 15 |
| SWITCH | 10 | **6** | – | 16 | 16 |
| ETHOS.FINE | 13 | – | 1 | 14 | 13 |
| OEMOF | 13 | – | – | 13 | 13 |
| ReEDS | – | **10** | – | 10 | 10 |
| ZEN-garden | 2 | – | 7 | 9 | 2 |
| IESA-Opt | 3 | – | 4 | 7 | 7 |
| TEMOA | 6 | – | – | 6 | 6 |
| Tulipa | 6 | – | – | 6 | 6 |
| PowerModels | 5 | – | – | 5 | 5 |
| DCOPF | 4 | – | – | 4 | 4 |
| SpineOpt | – | **1** | – | 1 | 1 |
| openTEPES | – | **1** | – | 1 | 1 |
| **Total** | **213** | **150** | **15** | **378** | **353** |

## Problems added since v2, by PR

| Framework | New problems | PR | Problem class | Marked to skip |
|---|---:|---|---|---:|
| PyPSA | 86 | #426 Add PyPSA-Eur and PyPSA-DE MILPs | MILP | 14 |
| PyPSA | 27 | #469 PyPSA-DE-elec scaling study for HiPO blog post | LP | – |
| MIPLIB | 19 | #560 Add MIPLIB benchmarks | MILP | – |
| ReEDS | 10 | #569 Add ReEDS instances | LP | – |
| SWITCH | 3 | #381 SWITCH-USA-PG with reduced load zones | LP | – |
| SWITCH | 3 | #382 SWITCH-China with reduced load zones | LP | – |
| SpineOpt | 1 | #377 Add SpineOpt instances | LP | – |
| openTEPES | 1 | #483 Add openTEPES benchmark | MILP | – |
| **Total** | **150** | | 106 MILP, 44 LP | 14 |

## Notes

- 32 of the new PyPSA problems (27 pypsa-de-elec, 5 pypsa-de-elec-uc) already have results in
  `results/benchmark_results_pypsa_de_elec_scaling.csv` and `..._uc_scaling.csv`, but not in the
  main results CSV.
- Of the 15 problems that were in the v2 metadata but not run, 11 are marked to skip (OOM or
  timeout: JRC-EU-TIMES, TIMES-STEM, ETHOS.FINE Europe, ZEN-garden PI). The other 4 are large
  IESA-Opt-NL problems (`IESA-Opt-NL-5-3h`, `-10-1h`, `-20-3h`, `-25-3h`) that are not marked to
  skip but have no results.
- MIPLIB problems have no `Modelling framework` value in the metadata; they are listed as MIPLIB here.
- No open PR adds new benchmark problems.
