# Instructions to generate GenX benchmakrs

- Install Julia following the [instructions](https://julialang.org/downloads/) and switch to version 1.9 (the latest version to be compatible with GenX)
    - `juliaup status`shows the available versions
    - `juliaup add 1.9` installs Julia 1.9
    - `juliaup default 1.9` sets Julia 1.9 as default version
- Clone the [GenX](https://github.com/GenXProject/GenX.jl) repository
- Copy the [`case_for_oet`](N.A.) benchmark folder in /GenX.jl
- Subsitute `GenX.jl/case_for_oet/settings/genx_settings.yml` with any of the .yml at [solver-benchmark](https://github.com/open-energy-transition/solver-benchmark/tree/daniele/genx-extended-benchmarks/benchmarks/genx-extended) and rename it to `genx_settings.yml`
- Run each case in the GenX.jl Julia project (follow instructions [here](https://genxproject.github.io/GenX.jl/dev/Getting_Started/examples_casestudies/)) using the command `include("/path-to-GenX/Run.jl")`

The abovementioned workflow takes advantage of the content of the `GenX.jl/case_for_oet/TDR_Results` folder for inputs clustered according to a time resolution of 168 h (as reported in `GenX.jl/case_for_oet/settings/time_domain_reduction_settings.yml`)
Whenever the temporal resolution of the model requires changes one should adopt a simple workflow:
- If already present, the `TDR_Results` folder should be deleted (or its name should be modified)
- The TimestepsPerRepPeriod entry in `GenX.jl/case_for_oet/settings/time_domain_reduction_settings.yml` should be adjusted according to the desired temporal resolution (e.g. 1 for hourly resolution, 24 for daily resolution - the `genx-elec_trex_uc` benchmark only runs with such resolution - 168 for weekly resolution, etc.). For more information, follow the [GenX project Guide](https://genxproject.github.io/GenX.jl/dev/User_Guide/TDR_input/)
- The model can be run using again and a new `TDR_Results` folder will generated according to the new temporal resolution
