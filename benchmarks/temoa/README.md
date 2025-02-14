# Instructions to generate TEMOA benchmarks

- Clone the [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0) repository (release v2.0 was preferred over the latest v3.0 due to modifications on input .sql files to be performed for using v3.0)
- Follow the instructions to create a TEMOA environment at [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0)
- Copy the .sqlite files at [TemoaProject/oeo](https://github.com/TemoaProject/oeo) in the local folder `temoa/data_files`
- Modify `temoa/temoa_model/config_sample` 1) providing the name of the `--input` and `--output` .sqlite dataset you wish to run (i.e. `--input=data_files/temoa_utopia.sqlite` and `--output=data_files/temoa_utopia.sqlite` if you wish to run `temoa_utopia.sqlite`) and 2) uncommenting the `--keep_pyomo_lp_file` option to generate Pyomo-compatible LP files (by default, they are store in `temoa/data_files/debug_logs/lp_files`)
- Run TEMOA using `$ python  temoa_model/  --config=temoa_model/config_sample`
