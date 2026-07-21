# Instructions to generate ReEDS benchmarks
- Follow the instructions in the [Installation Guide](https://reeds-model.github.io/ReEDS/setup.html#installation-guide) to install [ReEDS](https://github.com/ReEDS-Model/ReEDS).
- In `postprocessing/diagnose/diagnose.gms`, add the following line before `$offecho`
```
fixedmps outputs%ds%model_diagnose%ds%model_diagnose_%cur_year%.mps
```
- You can solve the cases used for this benchmark by creating a CSV with the contents below, saving it as `cases_benchmark.csv` in the root directory of ReEDS, and then running `python runreeds.py` and entering "benchmark" as the case suffix when prompted:
```
,Default Value,USA_defaults,USA_default_z90,USA_defaults_40_yr_step,USA_CC,USA_fast,USA_365_3hrs,USA_decarb_H2,PJM_county,WECC_county,ISONE_full_year,ERCOT_full_year,ISONE_d365_h1,ERCOT_d365_h1
ignore,1,,,,,,0,,0,,,,,
diagnose,1,,,,,,,,,,,,,
diagnose_year,2030,,,,,,,,,,,,,
GSw_Region,country/USA,,,,,,,,transreg/PJM,interconnect/western,transreg/ISONE,transreg/ERCOT,transreg/ISONE,transreg/ERCOT
yearset,,,,2010_2050,,,,,,,2010_2050,2010_2050,2010_2050,2010_2050
GSw_ZoneSet,z132,,z90,,,z54,z54,,z3109,z3109,,,,
GSw_GasCurve,1,,,,,,,2,2,2,2,2,2,2
distpvscen,,,,,,,,stscen2023_mid_case_95_by_2035,,,,,,
GSw_AnnualCap,,,,,,,,2,,,,,,
GSw_AnnualCapScen,,,,,,,,start2024_90pct2035_100pct2045,,,,,,
GSw_LoadProfiles,,,,,,,,EER2025_100by2050,,,,,,
GSw_NG_CRF_penalty,,,,,,,,ramp_2045,,,,,,
GSw_PRM_NetImportLimit,,,,,,,,0,,,,,,
GSw_RetirePenalty,,,,,,,,0,,,,,,
GSw_HourlyType,,,,,,,year,,,,year,year,,
GSw_HourlyChunkLengthRep,,,,,,4,,,,,1,1,1,1
GSw_HourlyChunkLengthStress,,,,,,4,,,,,1,1,1,1
GSw_HourlyClusterAlgorithm,,,,,,,,,,,,,hierarchical,hierarchical
GSw_HourlyNumClusters,,,,,,,,,,,,,365,365
GSw_StartCost,,,,,,0,,,,,,,,
GSw_H2,,,,,,0,,,,,,,,
GSw_H2_PTC,,,,,,0,,,,,,,,
pras_samples,,,,,,10,,,,,,,,
GSw_CCS,,,,,,,,0,,,,,,
GSw_BECCS,,,,,,,,0,,,,,,
GSw_Nuclear,,,,,,,,0,,,,,,
GSw_NoFossilOffsetCDR,,,,,,,,1,,,,,,
GSw_PRM_StressIterateMax,,,,,0,,,,0,0,,,,
GSw_PRM_CapCredit,,,,,1,,,,,,,,,
GSw_PRM_scenario,,,,,static,,,,,,,,,
```
