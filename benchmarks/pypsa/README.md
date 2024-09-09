# Instructions

## PyPSA-EUR-based sample problems (pypsa-eur-sec-2-lv1-3h, pypsa-eur-elec-20-lvopt-3h, pypsa-eur-elec-20-lv1-3h-op, pypsa-eur-elec-20-lv1-3h-op-ucconv)
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html).
- Get the config files for the sample problems from ... and put them in `/pypsa-eur/config`
- Get the `solver_benchmark_pypsa_eur.py` and place it in the `/pypsa-eur` folder
- In order to produce the .lp files, the line  `kwargs["keep_files"] = cf_solving.get("keep_files", True)` must be added to `/pypsa-eur/scripts/solve_network.py` (can be added anywhere under `def solve_network(n, config, solving, **kwargs):` among the several **kwargs extra arguments
- Run the solver_benchmark_pypsa_eur.py file: `python solver_benchmark_pypsa_eur.py --configfile config/your_config_file.yaml` (where `your_config_file` has to be replaced with either `pypsa-infr-1`, `pypsa-infr-2`, `pypsa-infr-3` or `pypsa-infr-4`)
- The generated .lp file will be located in `/tmp`

## Simpler sample problems (pypsa-wind+sol+ely-1h-ucwind, pypsa-wind+sol+ely-1h)
- First, follow the traditional steps for PyPSA-EUR [installation](https://pypsa-eur.readthedocs.io/en/latest/installation.html) (ignore if already executed, but the `pypsa-eur` environment is required anyway.
- Run `python pypsa-infr-5.py` and `python pypsa-infr-6.py`
- The .lp file will be automatically produced thanks to the `keep_files=True` argument passed to `n.optimize()` and located in `/tmp`
