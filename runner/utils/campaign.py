"""Allocate benchmark problems across cloud VMs for a campaign, and scaffold
the Terraform/OpenTofu files to launch it.

VM/cloud campaign allocation only -- loading problem metadata now lives in
`metadata.py`, since it's also needed by the CLI/orchestrator.
"""

from pathlib import Path

import pandas as pd
import yaml


def allocate_vms_greedy(
    problem_ids: list[str], problem_weights: dict[str, float], num_vms: int
) -> tuple[list[list[str]], list[float]]:
    """Split problems across VMs with longest-processing-time-first greedy bin-packing.

    Parameters
    ----------
    problem_ids : list[str]
        Problem identifiers to allocate.
    problem_weights : dict[str, float]
        Estimated runtime (or other cost) per problem identifier.
    num_vms : int
        Number of VMs (bins) to split `problem_ids` across.

    Returns
    -------
    tuple[list[list[str]], list[float]]
        `(allocation, weights)`: `allocation[i]` is the list of problem
        identifiers assigned to VM `i`; `weights[i]` is their total weight.
    """
    allocation = [[] for _ in range(num_vms)]
    weights = [0 for _ in range(num_vms)]

    problems_and_runtimes = sorted(
        [(problem_weights[p], p) for p in problem_ids], reverse=True
    )

    for t, p in problems_and_runtimes:
        lightest_vm = min(enumerate(weights), key=lambda x: x[1])[0]
        allocation[lightest_vm].append(p)
        weights[lightest_vm] += t

    print(f"Allocated. Estimated runtime: {max(weights) / 3600:.1f}h")
    for i in range(num_vms):
        print(f"  VM {i:02d}: {len(allocation[i])} problems, {weights[i] / 3600:.1f}h")
    return allocation, weights


def allocate_problems(
    problems_df: pd.DataFrame,
    weight_col: str,
    num_vms: int,
    machine_type: str = "c4-standard-2",
    zone: str = "us-central1-a",
    solvers: str | None = None,
    timeout_seconds: int | None = None,
    years: list[int] = [2020, 2022, 2023, 2024, 2025],
) -> list[dict]:
    """Allocate problems across VMs and build one campaign YAML dict per VM.

    Parameters
    ----------
    problems_df : pd.DataFrame
        Problem metadata, as returned by `metadata.load_problem_metadata`
        (must have "Problem", "Size", "URL", and "Problem class" columns,
        indexed by "Problem").
    weight_col : str
        Column in `problems_df` to use as each problem's allocation weight
        (e.g. an estimated runtime column).
    num_vms : int
        Number of VMs to split problems across.
    machine_type : str, optional
        GCE machine type to record in each VM's YAML.
    zone : str, optional
        Default cloud zone to record in each VM's YAML (overridable later
        per VM).
    solvers : str, optional
        If given, recorded as each VM YAML's `solver_configuration` key.
    timeout_seconds : int, optional
        If given, recorded as each VM YAML's `timeout_seconds` key.
    years : list[int], optional
        Solver-version years to record in each VM's YAML.

    Returns
    -------
    list[dict]
        One dict per VM, in the on-disk campaign-YAML schema: `machine-type`,
        `zone`, `years`, `problems` (problem ID to `{"Problem class", "Size",
        "URL"}`) -- the same flat schema as `results/metadata.yaml`, so
        `metadata.load_problems` reads campaign-generated and metadata files
        identically -- plus `solver_configuration`/`timeout_seconds` if given.
    """
    if problems_df.empty:
        return []

    allocation, _ = allocate_vms_greedy(
        problems_df.index, problems_df[weight_col], num_vms
    )

    vm_yamls = []
    for problem_ids in allocation:
        vm_problems = {
            problem_id: {
                "Problem class": problems_df.loc[problem_id, "Problem class"],
                "Size": problems_df.loc[problem_id, "Size"],
                "URL": problems_df.loc[problem_id, "URL"],
            }
            for problem_id in problem_ids
        }
        vm_yamls.append(
            {
                "machine-type": machine_type,
                "zone": zone,  # Default cheapest zone, can be overwritten
                "years": years,
                "problems": vm_problems,
            }
        )
        if solvers:
            vm_yamls[-1]["solver_configuration"] = solvers
        if timeout_seconds:
            vm_yamls[-1]["timeout_seconds"] = timeout_seconds
    return vm_yamls


def create_benchmark_campaign(
    batch_id: str,
    vm_prefix: str,
    vm_yamls: list[dict],
) -> None:
    """Scaffold a campaign's Terraform/OpenTofu files from allocated VM YAMLs.

    Parameters
    ----------
    batch_id : str
        Unique identifier for this campaign; used as its run ID and as the
        `benchmarks/<batch_id>` directory name under `infrastructure/`.
    vm_prefix : str
        Prefix for each VM's YAML filename (`<vm_prefix>-<NN>.yaml`).
    vm_yamls : list[dict]
        Per-VM campaign configs, as returned by `allocate_problems`.
    """
    tfvars = "\n".join(
        [
            'project_id = "compute-app-427709"',
            "enable_gcs_upload = true",
            "auto_destroy_vm = true",
            f'benchmarks_dir = "benchmarks/{batch_id}"',
            f'run_id = "{batch_id}"',
        ]
    )

    # Create a campaign folder ../infrastructure/benchmarks/{batch_id}
    bench_dir = Path(f"../infrastructure/benchmarks/{batch_id}")
    bench_dir.mkdir(parents=True, exist_ok=True)
    with open(bench_dir / "run.tfvars", "w") as f:
        f.write(tfvars)

    if any(bench_dir.glob("*.yaml")):
        print(f"WARNING: existing yaml files found in {bench_dir}")

    # Add to it the allocated benchmarks
    for idx, yaml_data in enumerate(vm_yamls):
        with open(bench_dir / f"{vm_prefix}-{idx:02d}.yaml", "w") as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)

    print(f"Created directory and files in {bench_dir}")
    print(
        "Run this campaign from the infrastructure/ directory using the command:\n"
        f"tofu apply -var-file benchmarks/{batch_id}/run.tfvars -state=states/{batch_id}.tfstate"
    )
