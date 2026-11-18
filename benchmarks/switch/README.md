# Generating the SWITCH problems

- Set up the modelling software, download the PowerGenome input data, configure PowerGenome to use it and generate the Switch inputs, following the instructions on the [Switch-USA repository](https://github.com/switch-model/Switch-USA-PG).
- Solve the case used for these problems (`base_short_2050`) with `switch solve --inputs-dir 26-zone/in/2050/base_short --outputs-dir 26-zone/out/2050/base_2050_short --keepfiles`, which keeps the LP file in your local `tmp` folder.

## Smaller models, with fewer load zones

To generate smaller LP files:

- Create input folders with fewer load zones (e.g. `15-zone`, `10-zone`, `5-zone`), reducing only the data of the load zones and keeping the structure and formulation of the model.
- Run the same commands as for the original LP files of `SWITCH-USA` and `SWITCH-China`, with the reduced input folders.
