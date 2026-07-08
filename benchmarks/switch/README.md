# Instructions to generate Switch-USA benchmarks

- Setup the modelling software; download PowerGenome input data and configure PowerGenome to use it; and generate Switch inputs following the instructions on the [Switch-USA repository](https://github.com/switch-model/Switch-USA-PG).
- You can solve the specific case (`base_short_2050`) used for this benchmark running `switch solve --inputs-dir 26-zone/in/2050/base_short --outputs-dir 26-zone/out/2050/base_2050_short --keepfiles` (the `--keepfiles` argument allows to store the .lp file in your local `tmp` folder)


# Reduced-size models (fewer load zones)

To generate smaller LP files:

- Create modified input directories with a reduced number of load zones (e.g., `15-zone`, `10-zone`, `5-zone`).

- Ensure that:
   - The model structure and formulation remain unchanged.
   - Only the load zone–associated data are reduced.

- Run the same commands used to generate the original LP files for each model type (`SWITCH-China` and `SWITCH-USA`), respectively, using the corresponding reduced input directories.
