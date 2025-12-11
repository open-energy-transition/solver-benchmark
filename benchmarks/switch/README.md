# Instructions to generate Switch-USA benchmarks

- Setup the modelling software; download PowerGenome input data and configure PowerGenome to use it; and generate Switch inputs following the instructions on the [Switch-USA repository](https://github.com/switch-model/Switch-USA-PG).
- You can solve the specific case (`base_short_2050`) used for this benchmark running `switch solve --inputs-dir 26-zone/in/2050/base_short --outputs-dir 26-zone/out/2050/base_2050_short --keepfiles` (the `--keepfiles` argument allows to store the .lp file in your local `tmp` folder)
