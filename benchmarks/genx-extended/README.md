# Generating the GenX problems

1. Install Julia following the [instructions](https://julialang.org/downloads/), and switch to version 1.9, the latest version compatible with GenX:
   - `juliaup status` shows the available versions;
   - `juliaup add 1.9` installs Julia 1.9;
   - `juliaup default 1.9` makes it the default version.
2. Clone the [GenX](https://github.com/GenXProject/GenX.jl) repository.
3. Copy the `case_for_oet` case folder into `GenX.jl/`.
4. Replace `GenX.jl/case_for_oet/settings/genx_settings.yml` with one of the `.yml` files of this folder, renamed to `genx_settings.yml`.
5. Run each case in the GenX.jl Julia project with `include("/path-to-GenX/Run.jl")`, following the [GenX instructions](https://genxproject.github.io/GenX.jl/dev/Getting_Started/examples_casestudies/).

This uses the inputs in `GenX.jl/case_for_oet/TDR_Results`, clustered with a time resolution of 168 h (see `GenX.jl/case_for_oet/settings/time_domain_reduction_settings.yml`). To change the temporal resolution:

1. Delete or rename the `TDR_Results` folder.
2. Set `TimestepsPerRepPeriod` in `GenX.jl/case_for_oet/settings/time_domain_reduction_settings.yml` to the resolution: 1 for hourly, 24 for daily (the only resolution at which `genx-elec_trex_uc` runs) or 168 for weekly. See the [GenX guide](https://genxproject.github.io/GenX.jl/dev/User_Guide/TDR_input/).
3. Run the model again: it creates a new `TDR_Results` folder at the new resolution.
