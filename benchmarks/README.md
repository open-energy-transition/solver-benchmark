# Benchmark problems

Each folder holds the metadata of the problems of one modelling framework or source, in a `metadata.yaml` file (or several `metadata_*.yaml` files) that follows [`metadata_schema.yaml`](metadata_schema.yaml). Where a folder has a README, it describes how to reproduce the problems.

| Folder | Framework | Contributors |
|---|---|---|
| [`ethos.fine`](ethos.fine/metadata.yaml) | ETHOS.FINE | Open Energy Transition, from the [FINE](https://github.com/FZJ-IEK3-VSA/FINE) examples; Forschungszentrum Jülich |
| [`genx-extended`](genx-extended/README.md) | GenX | Princeton University and Open Energy Transition |
| [`genx-lp`](genx-lp/metadata.yaml) | GenX | Open Energy Transition, from [jump-dev/open-energy-modeling-benchmarks](https://github.com/jump-dev/open-energy-modeling-benchmarks) |
| [`iesa-opt`](iesa-opt/README.md) | IESA-Opt | TNO and Utrecht University |
| [`jump_highs_platform`](jump_highs_platform) | GenX, PowerModels, Sienna, Tulipa | [jump-dev/open-energy-modeling-benchmarks](https://github.com/jump-dev/open-energy-modeling-benchmarks), which hosts the files |
| [`miplib`](miplib/metadata.yaml) | | Energy problems of [MIPLIB 2017](https://miplib.zib.de/) |
| [`oemof`](oemof/metadata.yaml) | oemof-solph | Open Energy Transition, from the [oemof-solph](https://github.com/oemof/oemof-solph) examples |
| [`opentepes`](opentepes/README.md) | openTEPES | Universidad Pontificia Comillas |
| [`plain_pypsa`](plain_pypsa/README.md) | PyPSA | Open Energy Transition |
| [`pypsa`](pypsa/README.md) | PyPSA-Eur | Open Energy Transition |
| [`reeds`](reeds/README.md) | ReEDS | National Laboratory of the Rockies |
| [`spineopt`](spineopt/README.md) | SpineOpt | Alvaro Porras and Diego Tejada |
| [`switch`](switch/README.md) | SWITCH | Open Energy Transition, from the SWITCH models |
| [`temoa`](temoa/README.md) | TEMOA | Open Energy Transition, from the TEMOA databases |
| [`times`](times/metadata.yaml) | TIMES | E4SMA, Mines Paris, Paul Scherrer Institut, UC Berkeley and Olexandr Balyk |
| [`zen_garden`](zen_garden/metadata.yaml) | ZEN-garden | ETH Zürich |

The `Contributor(s)/Source` field of each problem gives its contributors and the model it comes from. To contribute problems, see [CONTRIBUTING.md](../CONTRIBUTING.md#contributing-benchmark-problems).

## Scripts

- `merge_metadata.py` merges the metadata of all folders into `results/metadata.yaml`, which the runner, the campaign generator and the website read. Run it after changing any metadata: `pixi run -e benchmarks python benchmarks/merge_metadata.py`.
- `categorize_benchmarks.py` downloads the problems that have no statistics yet, and adds their numbers of variables, constraints and nonzeros, their problem class and their size category to the metadata.
- `create_benchmark_campaign.py` creates benchmark campaigns: see [CAMPAIGNS.md](CAMPAIGNS.md).
