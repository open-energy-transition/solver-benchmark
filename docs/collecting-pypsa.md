# Collecting PyPSA Benchmarks

Here are some (subject-to-change) instructions on how to collect benchmarks from PyPSA as NC files:

First, follow the instructions from the [PyPSA docs](https://pypsa-eur.readthedocs.io/en/latest/installation.html) on how to install PyPSA.
We recommend using [Micromamba](https://mamba.readthedocs.io/en/latest/installation/micromamba-installation.html) to install the dependencies of PyPSA.

In order to generate an NC file instead of solving the model directly, we need to use the `oetc` branch of OET's fork of `linopy`. Install it in the conda environment as follows:
```bash
micromamba activate pypsa-eur
git clone https://github.com/open-energy-transition/linopy.git
cd linopy
git checkout 7777506  # This is the commit containing the code to dump NC files
pip install -e . --no-deps
```

To collect an NC file from, for example, the [Tutorial](https://pypsa-eur.readthedocs.io/en/latest/tutorial.html) run of PyPSA:
```bash
cd /path/to/pypsa-eur/
micromamba activate pypsa-eur
snakemake -call results/test-elec/networks/elec_s_6_ec_lcopt_.nc --configfile config/test/config.electricity.yaml
```
Eventually, you will see output similar to the following:
```
WARNING:linopy.remote:Ignoring these kwargs for now: {'solver_name': 'glpk', 'io_api': None, 'problem_fn': None, 'solution_fn': None, 'log_fn': 'results/test-elec/logs/solve_network/elec_s_6_ec_lcopt__solver.log', 'basis_fn': None, 'warmstart_fn': None, 'keep_files': False, 'sanitize_zeros': True}
INFO:linopy.remote:Model written to: /tmp/linopy-vujkr592.nc
Call OETC on the above file, then place result file from OETC at /tmp/linopy-vujkr592.sol.nc, and press Enter to continue: 
```
At this point, you can copy the file `/tmp/linopy-vujkr592.nc` (this is the model dumped just before solving) and then exit the run by pressing Ctrl-C. (If you exit the run before copying, the file will be automatically deleted!)
