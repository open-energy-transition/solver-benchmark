# Supported Solvers

We support the following versions of solvers: (We use the last released solver version in each calendar year.)

| Solver | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
| ------ | ---- | ---- | ---- | ---- | ---- | ---- |
| HiGHS | | [Not on PyPI](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L16) | 1.5.0 | 1.6.0 | 1.9.0 | 1.10.0 |
| SCIP | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L13) | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L12) | 8.0.3 | 8.1.0 | [Error](https://github.com/open-energy-transition/solver-benchmark/blob/main/runner/envs/benchmark-2024.yaml) | 9.2.2 |
| CBC | [Bug](https://github.com/coin-or/Cbc/issues/708) | | [Bug](https://github.com/coin-or/Cbc/issues/708) | 2.10.11 | 2.10.12 | |
| GLPK | 5.0.0 |  |  |  |  |  |
| Gurobi | [Incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2020.yaml#L16) | [Incompatible](https://github.com/open-energy-transition/solver-benchmark/blob/aa32f81d523295d308733841428b4199eaf2f1ff/runner/envs/benchmark-2021.yaml#L14) | 10.0.0 | 11.0.0 | 12.0.0 | |


When determining which is the most recent version released in a particular year, we use the following resources:
- https://github.com/ERGO-Code/HiGHS/releases
- https://github.com/coin-or/Cbc/releases
- https://github.com/scipopt/scip/releases and https://pypi.org/project/PySCIPOpt/#history
- https://support.gurobi.com/hc/en-us/articles/360048138771-Gurobi-release-and-support-history