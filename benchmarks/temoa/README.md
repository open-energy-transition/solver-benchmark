# Generating the TEMOA problems

- Clone the [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0) repository (v3.0 would need changes to the input `.sql` files).
- Create a TEMOA environment, following the instructions of [TEMOA v2.0](https://github.com/TemoaProject/temoa/tree/v2.0).
- Copy the `.sqlite` files of [TemoaProject/oeo](https://github.com/TemoaProject/oeo) into `temoa/data_files`, which already has `temoa_utopia.sqlite` for the `temoa-utopia` problem:
  - `US_9R_TS.sqlite`: `temoa-US_9R_TS`
  - `US_9R_TS_SP.sqlite`: `temoa-US_9R_TS_SP`
  - `US_9R_TS_NDC.sqlite`: `temoa-US_9R_TS_NDC`
  - `US_9R_TS_NZ.sqlite`: `temoa-US_9R_TS_NZ`
  - `US_9R_TS_NZ_trunc_4periods.sqlite`: `temoa-US_9R_TS_NZ_trunc_4periods`
- In `temoa/temoa_model/config_sample`, set `--input` and `--output` to the database to run (e.g. `--input=data_files/temoa_utopia.sqlite` and `--output=data_files/temoa_utopia.sqlite`), and uncomment `--keep_pyomo_lp_file` to write the LP file, to `temoa/data_files/debug_logs/lp_files` by default.
- Run TEMOA with `python temoa_model/ --config=temoa_model/config_sample`.
