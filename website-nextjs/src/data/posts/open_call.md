---
title: "Open Call for Energy System Optimization Benchmarks"
date: "2026-03-03"
excerpt: "Invitation to submit new optimization benchmarks to the Open Energy Benchmark platform."
tags: ["announcement", "benchmarks", "community"]
---

We invite the community to contribute **optimization benchmark problems** to the [Open Energy Benchmark](https://openenergybenchmark.org) platform. Together, we aim to build a transparent, well-documented, and diverse benchmark set covering different **energy system models, formulations, scales, and applications**.

This open call runs from today to **July 15, 2026**. Contributions will be tested, selected, and added to the platform in time for the December 2026 release.

## Why Contribute?

The Open Energy Benchmark platform helps you as energy modellers select the best solver and algorithms for your modelling application, and also helps solver developers focus their efforts on improving performance on models that are used in real applications. Contributing the models and applications you care about makes solvers better for your use-cases, and the platform more useful for you!

## What Benchmarks Do We Need?

An overview of the model and feature coverage of the current benchmark set and identified gaps is available [here](https://openenergybenchmark.org/key-insights#what-benchmark-problems-do-we-have-and-what-are-missing).

We particularly encourage contributions that add:

- Benchmarks used in real-world studies or published research
- Large-scale LP/MILP instances that can be solved within our limits (see below, typically 1-10 million variables)—though smaller instances are also welcome, especially if they showcase model features not covered by our current set
- New modelling frameworks, particularly PowerModels.jl, oemof-solph, Calliope, URBS, OSeMOSYS, and ReEDS

To fill specific gaps in our existing collection, we are particularly looking for:

- MILP benchmarks in TIMES and TEMOA
- Operational (and production cost modelling, if applicable) problems in GenX, Sienna, PowerModels, and Tulipa
- Large-scale benchmarks in GenX

### Size Limits

We execute large benchmarks (> 1 million variables) on a machine with 128 GB RAM and 8 vCPUs using default solver options and a 24-hour timeout. We are interested in finding the largest model sizes that can be solved within our limits, particularly by open-source solvers.

### Selection Criteria

All submissions are subject to review. We reserve the right to accept or reject benchmark contributions based on metadata completeness, licensing compliance, technical quality, and suitability for inclusion in the benchmark set (see instructions below).

To ensure the benchmark set remains relevant and up-to-date, we prioritize instances from modelling frameworks that are actively maintained and widely used, such as those tracked by the [Open Energy Modelling Tool Tracker](https://openmod-tracker.org/). Benchmark instances from outdated or deprecated models may be removed over time, reflecting the balance between maintaining comprehensive coverage and managing infrastructure costs.

## What You Need to Submit

A benchmark contribution consists of:

1. One or more **LP or MPS files** (MPS preferred), either building on the same case with different sizes (e.g., varying spatial/temporal resolutions) or representing different problems (in terms of features and/or constraints).
2. A **metadata YAML file** describing the benchmark and its size instances, following the provided [template](https://github.com/open-energy-transition/solver-benchmark/blob/main/benchmarks/_template_metadata.yaml).

Each benchmark entry must document:

- The modelling framework and specific model used
- The problem class (LP/MILP) and application type
- Sectoral scope and time horizon
- Key MILP features (if applicable)
- For each size instance: spatial resolution, temporal resolution, and a justification if the problem is considered realistic (e.g., it was used in a real-world study, or its spatial and temporal resolution are refined enough for policy-relevant analyses)

The metadata template provides the required structure and naming conventions.

## How to Submit

If you are comfortable with GitHub, follow the steps below to submit via pull request. Otherwise, contact us via our website's contact form or by opening a GitHub issue, and we'll guide you through the process.

1. **Generate the optimization instance(s)**
   - Export your model as an **MPS file** (preferred) or **LP file**
   - Verify that the instance can be solved to optimality with at least one solver of your choice, ideally within our timeouts (1 hour for small/medium benchmarks, 24 hours for large benchmarks)

2. **Prepare the metadata file**
   - Use the provided metadata template and fill in all required fields
   - The benchmark description must include:
     - Link to the model code or modelling framework repository
     - Reference to any paper describing the model and its equations (if available)
     - Data sources and instructions used to construct the model
     - Reference to any real-world study or published paper where the model was used

3. **Host the LP/MPS files**
   - Upload the optimization files to a file-sharing service of your choice
   - The files do not need to be committed to the repository; a stable download URL is sufficient. The benchmark team will transfer the submitted benchmark to our hosting service

4. **Open a Pull Request**
   - Add the metadata YAML file under `benchmarks/<model-framework-or-source>/`
   - Complete the PR submission template, confirming:
     - Consent to release the benchmark instances under **CC BY 4.0**
     - Compliance with benchmark and size-instance naming conventions
     - Solver used, time to optimality, solver options, and machine specifications used for testing

After submission, the benchmark team will review your contribution and validate the metadata. Once accepted, the LP/MPS files will be uploaded to benchmark storage, tested, and integrated into the platform.

## Licensing

All benchmark instances are distributed under the open **CC BY 4.0** license. Note that this license applies only to the optimization problem (the LP/MPS file itself), not to the model code or underlying data used to generate it. See the FAQs below for more details.

## FAQs

**Can benchmark instances be copyrighted?**

Note that while raw data cannot in general be copyrighted, structured collections of data ("database" in legal terms) can. Under European law, even databases that cannot be copyrighted per se can be protected if someone had to go through some effort to create them (sui generis copyright—the effort for assembling the dataset is protected). In summary, adding a license provides clarity: if someone disagrees that benchmark problems can be copyrighted, they can simply ignore the license. Our intent in adding a CC BY license is to encourage people to use the problem set in an open way.


**What if the modelling framework or input datasets have a different license?**

While the code used to create a benchmark model instance or the input data sources may have different licenses (e.g., PyPSA is MIT licensed), the benchmark instance itself is a "database" created through your effort in running the model code and assembling the LP/MPS file. As the creator of this instance, you have the right to license the LP/MPS file under CC BY 4.0, independent of the licenses of the tools and data used to create it.


**Does the LP/MPS file divulge sensitive information from the model’s input data?**

The LP/MPS files are LP/MILP problems represented as a set of canonicalized mathematical equations (i.e., all variables are of the form x1, x2, …). While confidential data (e.g., generator capacities) is present in the equations as constants, it is difficult to reverse-engineer the model and figure out which constant corresponds to which real-world asset or property. This means the risk of sensitive data leakage is lower compared to releasing the input datasets directly.

Obfuscation of variable and constraint names can be done using the Python library `pyscipopt` with a script that looks something like:
```python
from pyscipopt import Model
scip = Model()
scip.readProblem("path_to_non_obfuscated_mps")
scip.writeProblem("path_to_obfuscated_mps", genericnames=True)
```

For JuMP models, use `set_string_names_on_creation(model, false)` or `write_to_model(model, "model.rmps"; generic_names = true)`.
