# Instructions

## PyPSA-EUR-based sample problems
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html).
- Get the config files for the sample problems from ... and put them in `/pypsa-eur/config`
- Get the <code>solver_benchmark_pypsa_eur.py</code> and place it in the <code>/pypsa-eur</code> folder
- In order to produce the .lp files, the line  <code>kwargs["keep_files"] = cf_solving.get("keep_files", True)</code> must be passed to <code>/pypsa-eur/scripts/solve_network.py</code> (can be added anywhere under <code>def solve_network(n, config, solving, **kwargs):</code> among the several **kwargs extra arguments
- Run the solver_benchmark_pypsa_eur.py file: <code>python solver_benchmark_pypsa_eur.py</code>
- The generateed .lp file will be located in <code>/tmp</code>

## Simpler sample problems
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html) (ignore if already executed, but the <code>pypsa-eur</code> environment is required anyway.
- Run <code>python problem_5.py</code> and <code>python problem_6.py</code>
- The .lp file will be automatically produced thanks to the <code>keep_files=True</code> argument passed to <code>n.optimize()</code> and located in <code>/tmp</code>

## Description of the sample problems

|    | **Kind of model**           | **Type of study** | **Sector**     | **Time resolution** | **Spatial resolution**      | **Transmission expansion** | **Unit commitment**                   | **Specifications**                                         | **Solution time** |                                                                 |
| -- | --------------------------- | ----------------- | -------------- | ------------------- | --------------------------- | -------------------------- | ------------------------------------- | ---------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| 1a | PyPSA-Eur | Infrastructure | Sector coupled | 3 hourly X 1 year   | Country level (IT, 2 nodes) | - | - | Linear, lot of variables, strongly intermeshed constraints | Highs: 3356 s | Constraints: 393568, Variables: 390692, Free variables: 1431 |
| 1b | PyPSA-Eur| Infrastructure | Power system | 3 hourly X 1 year   | Country level (IT, 2 nodes) |  - | - |                                                            | Highs: 245.01 s   | Constraints: 95722, Variables: 127811, Free variables: 0        |
| 2  | PyPSA-Eur | Infrastructure    | Power system   | 3 hourly X 1 year   | Sub-country level (IT, 20 nodes) | Yes | - | MIP, lot of variables, intermeshed constraints             | Highs: 45178 s    | Constraints: 1432032, Variables: 1099126, Free variables: 73000 |
| 3  | PyPSA-Eur | Operational | Power system | Hourly X 1 month    | Sub-country level |  - | -| Linear, lot of variables, less intermeshed constraints     |                   | - |
| 4  | PyPSA-Eur | Operational       | Power system   | Hourly X 1 month    | Sub-country level | | Unit commitment on conventional fleet | MIP, lot of variables, less intermeshed constraint | - | - |
| 5  | Wind + solar + electrolyzer | - | - | Hourly X 1 year | - | - | Unit commitment (onwind, offwind) | MIP, less variables, less intermeshed constraints          | Highs: 13.66 s    | Constraints: 19, Continuous variables: 6, Binary variables: 3   |
| 6  | Wind + solar + electrolyzer | - | - | Hourly X 1 year | - | - | - | Linear, less variables, less intermeshed | Highs: 66.59 s | Constraints: 14, Continuous variables: 6 |