# Instructions to generate TEMOA benchmarks

- Clone the [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0) repository (release v2.0 was preferred over the latest v3.0 due to modifications on input .sql files to be performed for using v3.0)
- Follow the instructions to create a TEMOA environment at [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0)
- Copy the .sqlite files at [TemoaProject/oeo](https://github.com/TemoaProject/oeo) in the local folder `temoa/data_files`
- Modify `temoa/temoa_model/config_sample` providing the name of the `--input` and `--output` .sqlite dataset you wish to run (i.e. `--input=data_files/temoa_utopia.sqlite` and `--output=data_files/temoa_utopia.sqlite` if you wish to run `temoa_utopia.sqlite)
- Run TEMOA using *Option 1* at [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0)
