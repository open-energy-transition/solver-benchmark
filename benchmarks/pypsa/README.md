# Instructions

## PyPSA-EUR-based sample problems (pypsa-infr-1, pypsa-infr-2, pypsa-infr-3, pypsa-infr-4)
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html).
- Get the config files for the sample problems from ... and put them in `/pypsa-eur/config`
- Get the `solver_benchmark_pypsa_eur.py` and place it in the `/pypsa-eur` folder
- In order to produce the .lp files, the line  `kwargs["keep_files"] = cf_solving.get("keep_files", True)` must be passed to `/pypsa-eur/scripts/solve_network.py` (can be added anywhere under `def solve_network(n, config, solving, **kwargs):` among the several **kwargs extra arguments
- Run the solver_benchmark_pypsa_eur.py file: `python solver_benchmark_pypsa_eur.py`
- The generated .lp file will be located in `/tmp`

## Simpler sample problems (pypsa-infr-5, pypsa-infr-6)
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html) (ignore if already executed, but the `pypsa-eur` environment is required anyway.
- Run `python pypsa-infr-5.py` and `python pypsa-infr-6.py`
- The .lp file will be automatically produced thanks to the `keep_files=True` argument passed to `n.optimize()` and located in `/tmp`

## Description of the sample problems

|    | **Kind of model**           | **Type of study** | **Sector**     | **Time resolution** | **Spatial resolution**      | **Transmission expansion** | **Unit commitment**                   | **Specifications**                                         | **Solution time** |                                                                 |
| -- | --------------------------- | ----------------- | -------------- | ------------------- | --------------------------- | -------------------------- | ------------------------------------- | ---------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| 1a | PyPSA-Eur | Infrastructure | Sector coupled | 3 hourly X 1 year   | Country level (IT, 2 nodes) | - | - | Linear, lot of variables, strongly intermeshed constraints | Highs: 3356 s | Constraints: 393568, Variables: 390692, Free variables: 1431 |
| 2  | PyPSA-Eur | Infrastructure    | Power system   | 3 hourly X 1 year   | Sub-country level (IT, 20 nodes) | Yes | - | MIP, lot of variables, intermeshed constraints             | Highs: 45178 s    | Constraints: 1432032, Variables: 1099126, Free variables: 73000 |
| 3  | PyPSA-Eur | Operational | Power system | 24 hourly X 1 year    | Sub-country level |  - | -| Linear, lot of variables, less intermeshed constraints     | Highs: 19.48 s | Constraints: 82134, Variables: 6935, Free variables: 82803 |
| 4  | PyPSA-Eur | Operational       | Power system   | Hourly X 1 month    | Sub-country level | | Unit commitment on conventional fleet | MIP, lot of variables, less intermeshed constraint | Highs: 56.15 s | Constraints: 108984, Variables: 15998, Free variables: 146571 |
| 5  | Wind + solar + electrolyzer | - | - | Hourly X 1 year | - | - | Unit commitment (onwind, offwind) | MIP, less variables, less intermeshed constraints          | Highs: 13.66 s    | Constraints: 19, Continuous variables: 6, Binary variables: 3   |
| 6  | Wind + solar + electrolyzer | - | - | Hourly X 1 year | - | - | - | Linear, less variables, less intermeshed | Highs: 66.59 s | Constraints: 14, Continuous variables: 6 |
