# V3 benchmark with current Linopy

This benchmark campaign uses Linopy commit
`26e000d936fb679386535e47191ca0d99aa250f2`.

The V3 dataset contains 348 rows:

- 214 solver runs across 24 optimization problems;
- 134 HiGHS reference-benchmark measurements.

V3 solver-run status:

- 131 `OK`
- 67 `TO`
- 11 `ER`
- 5 `OOM`

## V2 comparison

V2 and V3 rows are compared only when all of the following are identical:

- problem;
- solver;
- solver version;
- VM instance type.

The plots show the absolute values stored in the result CSVs. Missing numeric
values are left missing and annotated where necessary. Problems use the same
ordering in every figure, grouped by modelling framework.

## Gurobi

### Status

![Gurobi status](figures/v3-linopy-current/gurobi_status.png)

### Runtime

![Gurobi runtime](figures/v3-linopy-current/gurobi_runtime.png)

### Memory usage

![Gurobi memory](figures/v3-linopy-current/gurobi_memory.png)

### Objective value

![Gurobi objective](figures/v3-linopy-current/gurobi_objective.png)

### Maximum integrality violation

![Gurobi integrality violation](figures/v3-linopy-current/gurobi_max_integrality_violation.png)

### Duality gap

![Gurobi duality gap](figures/v3-linopy-current/gurobi_duality_gap.png)

## SCIP

### Status

![SCIP status](figures/v3-linopy-current/scip_status.png)

### Runtime

![SCIP runtime](figures/v3-linopy-current/scip_runtime.png)

### Memory usage

![SCIP memory](figures/v3-linopy-current/scip_memory.png)

### Objective value

![SCIP objective](figures/v3-linopy-current/scip_objective.png)

### Maximum integrality violation

![SCIP integrality violation](figures/v3-linopy-current/scip_max_integrality_violation.png)

### Duality gap

![SCIP duality gap](figures/v3-linopy-current/scip_duality_gap.png)

## CBC

### Status

![CBC status](figures/v3-linopy-current/cbc_status.png)

### Runtime

![CBC runtime](figures/v3-linopy-current/cbc_runtime.png)

### Memory usage

![CBC memory](figures/v3-linopy-current/cbc_memory.png)

### Objective value

![CBC objective](figures/v3-linopy-current/cbc_objective.png)

### Maximum integrality violation

![CBC integrality violation](figures/v3-linopy-current/cbc_max_integrality_violation.png)

### Duality gap

![CBC duality gap](figures/v3-linopy-current/cbc_duality_gap.png)

## GLPK

### Status

![GLPK status](figures/v3-linopy-current/glpk_status.png)

### Runtime

![GLPK runtime](figures/v3-linopy-current/glpk_runtime.png)

### Memory usage

![GLPK memory](figures/v3-linopy-current/glpk_memory.png)

### Objective value

![GLPK objective](figures/v3-linopy-current/glpk_objective.png)

### Maximum integrality violation

![GLPK integrality violation](figures/v3-linopy-current/glpk_max_integrality_violation.png)

### Duality gap

![GLPK duality gap](figures/v3-linopy-current/glpk_duality_gap.png)

## HiGHS V3

There is no exact V2 solver-version match for HiGHS 1.15.1, so IPM and HiPO
are compared within V3 only.

### Status

![HiGHS status](figures/v3-linopy-current/highs_v3_status.png)

### Runtime

![HiGHS runtime](figures/v3-linopy-current/highs_v3_runtime.png)

### Memory usage

![HiGHS memory](figures/v3-linopy-current/highs_v3_memory.png)

### Objective value

![HiGHS objective](figures/v3-linopy-current/highs_v3_objective.png)

### Maximum integrality violation

![HiGHS integrality violation](figures/v3-linopy-current/highs_v3_max_integrality_violation.png)

### Duality gap

![HiGHS duality gap](figures/v3-linopy-current/highs_v3_duality_gap.png)

## Reproduce

```bash
python notebooks/analyze_v3_linopy_current.py
```
