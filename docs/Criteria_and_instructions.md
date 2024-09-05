## Criteria for the selection of model benchmarks

Based on the classification in *M. G. Prina et al., ["Classification and challenges of bottom-up energy system models - A review"](https://www.sciencedirect.com/science/article/pii/S1364032120302082), Renewable and Sustainable Energy Reviews, vol. 129, 2020, 109917* and the [results of the survey recently conducted by OET](https://zenodo.org/records/13354034), the list of models targeted for the solver benchmark website considers either short- or long-term bottom-up models including but not limited to [^1]:
- PyPSA
- Switch
- oemof
- energyRt
- PLEXOS
- Dolphyin
- GenX
- IDEEA
- Pandapower
- Calliope
- Genesys
- DESSTinEE
- GAMAMOD
- Ficus
- REMod
- REMix
- TIMES
- OSeMOSYS
- TEMOA

[^1]: Based on the response from the respective modelling community concerning the generation of sample problems.

The features of the sample problems to be collected should meet any combinations of those mentioned in the following table (with a solution time under 1h using Gurobi - **not sure if we want to include this, may strongly depend on the capabilities of the modelling framework, on the machine used to run the model, etc., while any combination of the ones proposed below should provide results in a relatively reasonable time**):

**NOTE 1: my idea is that this table should be filled in selecting the corresponding features of each problem provided by the involved modellers, see "Sample problem description"**

||||||||
| -- | -- | -- | -- | -- | -- | -- |
| **Model name** |
| **Version** | 
| **Problem name** |
| **Technique** | LP | MILP |
| **Kind of problem** | Infrastructure (capacity expansion) | Operational (dispatch only) | 
| **Sectors** | Sector-coupled (power + heating, industry, transport) | Power sector |
| **Time horizon** | Single-period | Multi-period (indicate n. of periods)) |
| **Temporal resolution** | Hourly | 3 hourly | Daily | Yearly |  
| **Spatial resolution** | Single node / 2 nodes (indicate countries/regions) | Multi-nodal (10 $\div$ 20) (indicate countries/regions) |
| **MILP features** | None | Unit commitment | Transmission expansion | Other (please indicate) |
| **N. of constraints** | <100| 100-1'000| 1'000-10'000| 10'000-100'000| 100'000-1'000'000 | 1'000'000-10'000'000 |
| **N. of variables** | <100| 100-1'000| 1'000-10'000| 10'000-100'000| 100'000-1'000'000 | 1'000'000-10'000'000 |

## Benchmarks metadata

### PyPSA

| **Model name**   | **Version** | **Problem name** |  **Technique** | **Kind of problem** | **Sectors** | **Time horizon** | **Time resolution** | **Spatial resolution** | **MILP features** | **N.of constraints** | **N. of variables** |                                                                |
| -- | --------------------------- | ----------------- | -------------- | ------------------- | --------------------------- | -------------------------- | ------------------------------------- | ---------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | ------------ | --------- |
| PyPSA-EUR | v0.12.0 | pypsa-eur-sec-2-lv1-3h | LP | Infrastructure | Sector coupled (power, transport, heating, biomass, industry, agriculture) | Single-period | 3 hourly | 2 nodes (Italy) | - | 100'000-1'000'000 | 100'000-1'000'000 |

### Modelling framework

| **Model name**   | **Version** | **Problem name** |  **Technique** | **Kind of problem** | **Sectors** | **Time horizon** | **Time resolution** | **Spatial resolution** | **MILP features** | **N.of constraints** | **N. of variables** |                                                                |
| -- | --------------------------- | ----------------- | -------------- | ------------------- | --------------------------- | -------------------------- | ------------------------------------- | ---------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | ------------ | --------- |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Instructions for submitting sample problems

- Submitted via Github? What to submit? Are .lp files sufficient?

**NOTE 2: Model name and version could be sufficient to replicate fully open-source models like PyPSA stored in Github repos. However, this could be harder for models like, e.g., TIMES, whose datasets are hardly disclosed and require expensive licenses for their use. How are we dealing with that?**
