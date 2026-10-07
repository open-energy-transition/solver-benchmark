"""Allocate benchmark problems across cloud VMs for a campaign.

Also scaffolds the Terraform/OpenTofu files to launch it, and checks them
before launch: run `python -m runner.utils.campaign
infrastructure/benchmarks/<run-id>` to check an existing campaign folder (see
`validate_campaign`).

VM/cloud campaign allocation only -- loading problem metadata now lives in
`metadata.py`, since it's also needed by the CLI/orchestrator.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

import pandas as pd
import yaml

from . import config

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# The repository infrastructure/startup-script.sh clones on each VM
_REPO_URL = "https://github.com/open-energy-transition/solver-benchmark.git"

# infrastructure/main.tf's defaults for the variables validate_campaign reads
_DEFAULT_INSTANCE_NAME = "benchmark-instance"
_DEFAULT_GIT_REF = "main"

# GCE instance names: lowercase letters, digits and hyphens, starting with a
# letter, not ending with a hyphen, and at most 63 characters
_VM_NAME_PATTERN = re.compile(r"[a-z]([-a-z0-9]{0,61}[a-z0-9])?")

_REQUIRED_PROBLEM_FIELDS = ("Problem class", "Size", "URL")


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
    years: list[int] | None = None,
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
        Solver-version years to record in each VM's YAML. Defaults to
        2020 and 2022-2025.

    Returns
    -------
    list[dict]
        One dict per VM, in the on-disk campaign-YAML schema: `machine-type`,
        `zone`, `years`, `problems` (problem ID to `{"Problem class", "Size",
        "URL"}`) -- the same flat schema as `results/metadata.yaml`, so
        `metadata.load_problems` reads campaign-generated and metadata files
        identically -- plus `solver_configuration`/`timeout_seconds` if given.
    """
    if years is None:
        years = [2020, 2022, 2023, 2024, 2025]

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
    git_ref: str = _DEFAULT_GIT_REF,
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
    git_ref : str, optional
        Branch or tag of this repository that the VMs clone and run.
    """
    tfvars = "\n".join(
        [
            'project_id = "compute-app-427709"',
            "enable_gcs_upload = true",
            "auto_destroy_vm = true",
            f'benchmarks_dir = "benchmarks/{batch_id}"',
            f'run_id = "{batch_id}"',
            f'git_ref = "{git_ref}"',
        ]
    )

    # Create a campaign folder ../infrastructure/benchmarks/{batch_id}
    bench_dir = Path(f"../infrastructure/benchmarks/{batch_id}")
    bench_dir.mkdir(parents=True, exist_ok=True)
    with (bench_dir / "run.tfvars").open("w") as f:
        f.write(tfvars)

    if any(bench_dir.glob("*.yaml")):
        print(f"WARNING: existing yaml files found in {bench_dir}")

    # Add to it the allocated problems
    for idx, yaml_data in enumerate(vm_yamls):
        with (bench_dir / f"{vm_prefix}-{idx:02d}.yaml").open("w") as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)

    print(f"Created directory and files in {bench_dir}")
    print(
        "Run this campaign from the infrastructure/ directory using the command:\n"
        f"tofu apply -var-file benchmarks/{batch_id}/run.tfvars -state=states/{batch_id}.tfstate"
    )


def current_git_branch(repo_root: Path = _REPO_ROOT) -> str | None:
    """Return the checked-out branch, or None if HEAD is detached or git fails."""
    try:
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    return None if branch == "HEAD" else branch


def _read_tfvars(path: Path) -> dict[str, str]:
    """Read the `key = "value"` lines of a tfvars file, ignoring comments."""
    values = {}
    for raw_line in path.read_text().splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"')
    return values


def _check_vm_yaml(
    vm_file: Path,
    instance_name: str,
    known_years: set[str],
    known_configurations: set[str],
) -> list[str]:
    """Return the errors in one VM's campaign YAML."""
    errors = []

    # infrastructure/main.tf names each VM "<instance_name>-<file stem>"
    vm_name = f"{instance_name}-{vm_file.stem}"
    if not _VM_NAME_PATTERN.fullmatch(vm_name):
        errors.append(
            f"{vm_file.name}: VM name {vm_name!r} is not a valid GCE name "
            "(lowercase letters, digits and hyphens, at most 63 characters)"
        )

    try:
        data = yaml.safe_load(vm_file.read_text())
    except yaml.YAMLError as e:
        return [*errors, f"{vm_file.name}: invalid YAML: {e}"]
    if not isinstance(data, dict):
        return [*errors, f"{vm_file.name}: must contain a YAML mapping"]

    problems = data.get("problems")
    if not isinstance(problems, dict) or not problems:
        errors.append(f"{vm_file.name}: no problems listed under 'problems'")
    else:
        for problem_id, fields in problems.items():
            missing = [
                field
                for field in _REQUIRED_PROBLEM_FIELDS
                if not isinstance(fields, dict) or not fields.get(field)
            ]
            if missing:
                errors.append(
                    f"{vm_file.name}: problem {problem_id!r} is missing "
                    + ", ".join(missing)
                )

    years = data.get("years")
    if not isinstance(years, list) or not years:
        errors.append(f"{vm_file.name}: no years listed under 'years'")
    else:
        unknown_years = [str(year) for year in years if str(year) not in known_years]
        if unknown_years:
            errors.append(
                f"{vm_file.name}: no solver versions registered for year(s) "
                + ", ".join(unknown_years)
            )

    unknown_configurations = [
        name
        for name in str(data.get("solver_configuration") or "").split()
        if name.lower() not in known_configurations
    ]
    if unknown_configurations:
        errors.append(
            f"{vm_file.name}: unknown solver configuration(s) "
            + ", ".join(unknown_configurations)
        )

    return errors


def _check_git_state(git_ref: str, repo_root: Path) -> tuple[list[str], list[str]]:
    """Check that the VMs will run the same code as the local checkout.

    The VMs clone `git_ref` from GitHub, so local changes, unpushed commits
    and a different checked-out branch are not what they run.

    Returns
    -------
    tuple[list[str], list[str]]
        `(errors, warnings)`.
    """
    errors, warnings = [], []

    def git(*args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", *args], cwd=repo_root, capture_output=True, text=True, check=False
        )

    try:
        changes = git("status", "--porcelain").stdout.splitlines()
        branch = current_git_branch(repo_root)
        head = git("rev-parse", "HEAD").stdout.strip()
        remote = git(
            "ls-remote",
            "--exit-code",
            _REPO_URL,
            f"refs/heads/{git_ref}",
            f"refs/tags/{git_ref}",
        )
    except OSError as e:
        return errors, [f"could not check the git state: {e}"]

    if changes:
        warnings.append(
            f"{len(changes)} uncommitted or untracked change(s), which the VMs "
            "won't run:\n" + "\n".join(f"      {change}" for change in changes[:10])
        )

    if branch != git_ref:
        warnings.append(
            f"the VMs run {git_ref!r}, but {branch or 'a detached HEAD'!r} is "
            "checked out; set git_ref in run.tfvars if that's not intended"
        )

    # --exit-code makes ls-remote exit with 2 when the ref doesn't exist
    if remote.returncode == 2:
        errors.append(
            f"{git_ref!r} is not a branch or tag on GitHub, so the VMs can't "
            "clone it; push it first"
        )
    elif remote.returncode != 0:
        warnings.append(
            f"could not check {git_ref!r} on GitHub: {remote.stderr.strip()}"
        )
    elif branch == git_ref and head not in remote.stdout:
        warnings.append(
            f"local {git_ref!r} differs from GitHub, which the VMs run; "
            "push or pull first"
        )

    return errors, warnings


def validate_campaign(
    bench_dir: str | Path, repo_root: Path = _REPO_ROOT
) -> tuple[list[str], list[str]]:
    """Check a campaign folder before launching it with `tofu apply`.

    Errors are problems that would make the campaign fail: VM names GCE
    rejects, VM YAMLs missing problems, problem fields or years, unknown
    solver configurations, or a `git_ref` the VMs can't clone. Warnings are
    for a local checkout that differs from the code the VMs will run.

    Parameters
    ----------
    bench_dir : str | Path
        The campaign folder, e.g. `infrastructure/benchmarks/<run-id>`, with
        a `run.tfvars` and one YAML per VM.
    repo_root : Path, optional
        The local checkout to compare with the code the VMs will run.

    Returns
    -------
    tuple[list[str], list[str]]
        `(errors, warnings)`, both empty if the campaign looks fine.
    """
    bench_dir = Path(bench_dir)
    tfvars_path = bench_dir / "run.tfvars"
    if not tfvars_path.exists():
        return [f"{tfvars_path} not found"], []

    tfvars = _read_tfvars(tfvars_path)
    instance_name = tfvars.get("instance_name", _DEFAULT_INSTANCE_NAME)
    git_ref = tfvars.get("git_ref", _DEFAULT_GIT_REF)

    # The same files infrastructure/main.tf turns into VMs
    vm_files = sorted(
        path for path in bench_dir.glob("*.yaml*") if path.name != "allocation.yaml"
    )
    if not vm_files:
        return [f"no VM YAML files found in {bench_dir}"], []

    known_years = {*config.get_all_registered_years(), "tests"}
    known_configurations = set(
        config.load_solver_configurations().get("configurations", {})
    )

    errors = []
    for vm_file in vm_files:
        errors.extend(
            _check_vm_yaml(vm_file, instance_name, known_years, known_configurations)
        )

    git_errors, warnings = _check_git_state(git_ref, repo_root)
    return errors + git_errors, warnings


def print_validation(errors: list[str], warnings: list[str]) -> bool:
    """Print `validate_campaign`'s results, returning whether there were no errors."""
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if not errors and not warnings:
        print("Campaign check passed.")
    return not errors


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python -m runner.utils.campaign <campaign folder>")
    sys.exit(0 if print_validation(*validate_campaign(sys.argv[1])) else 1)
