#!/usr/bin/env python3
"""Create benchmark campaigns from benchmark metadata.

This command prepares benchmark metadata, selects benchmark instances, and
creates either:

- a cloud OpenTofu campaign under infrastructure/benchmarks/<run-id>/;
- a local benchmark campaign under infrastructure/local/benchmarks/<run-id>/.

Cloud campaigns stop before running `tofu apply`. Local campaigns generate a
local run script and ask for confirmation before executing it.
"""

from __future__ import annotations

import argparse
import getpass
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER_DIR = REPO_ROOT / "runner"
METADATA_FILE = REPO_ROOT / "results" / "metadata.yaml"
INFRASTRUCTURE_DIR = REPO_ROOT / "infrastructure"
LOCAL_BENCHMARKS_DIR = INFRASTRUCTURE_DIR / "local" / "benchmarks"

MACHINE_PROFILES = {
    "short": {
        "machine_type": "c4-standard-2",
        "timeout_seconds": 60 * 60,
    },
    "long": {
        "machine_type": "c4-highmem-16",
        "timeout_seconds": 24 * 60 * 60,
    },
}


@dataclass(frozen=True)
class InstanceSelection:
    benchmark: str
    instance: str


def slugify_campaign_name(value: str) -> str:
    """Return a conservative campaign slug for run IDs and file paths."""
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9._-]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug:
        raise ValueError("Campaign name is empty after normalization.")
    return slug


def run_command(command: list[str], cwd: Path) -> None:
    """Run a command and fail loudly if it exits with a non-zero status."""
    print(f"\n$ {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def prepare_metadata() -> None:
    """Regenerate merged and categorized benchmark metadata."""
    run_command([sys.executable, "benchmarks/merge_metadata.py"], cwd=REPO_ROOT)
    run_command([sys.executable, "benchmarks/categorize_benchmarks.py"], cwd=REPO_ROOT)


def import_runner_utils():
    """Import runner utilities after ensuring repo paths are importable."""
    sys.path.insert(0, str(REPO_ROOT))
    from runner.utils import (  # pylint: disable=import-outside-toplevel
        allocate_benchmarks,
        create_benchmark_campaign,
        load_benchmark_metadata,
    )

    return allocate_benchmarks, create_benchmark_campaign, load_benchmark_metadata


def parse_instance(value: str) -> InstanceSelection:
    """Parse '<benchmark>:<instance>' CLI values."""
    if ":" not in value:
        raise argparse.ArgumentTypeError(
            f"Invalid instance {value!r}. Expected format '<benchmark>:<instance>'."
        )

    benchmark, instance = value.split(":", 1)
    benchmark = benchmark.strip()
    instance = instance.strip()

    if not benchmark or not instance:
        raise argparse.ArgumentTypeError(
            f"Invalid instance {value!r}. Expected format '<benchmark>:<instance>'."
        )

    return InstanceSelection(benchmark=benchmark, instance=instance)


def validate_selection_args(args: argparse.Namespace) -> None:
    """Validate mutually exclusive benchmark selection modes."""
    selection_modes = sum(
        [
            bool(args.all),
            bool(args.benchmark),
            bool(args.instance),
        ]
    )

    if selection_modes != 1:
        raise ValueError("Select exactly one mode: --all, --benchmark, or --instance.")

    if args.name and not args.benchmark:
        raise ValueError("--name can only be used together with --benchmark.")

    if args.size and not args.benchmark:
        raise ValueError("--size can only be used together with --benchmark.")


def format_available_instances(df: pd.DataFrame, benchmark: str | None = None) -> str:
    """Format available benchmark instances for error messages."""
    available = df[["Benchmark", "Instance"]].drop_duplicates()
    if benchmark is not None:
        available = available.loc[available["Benchmark"] == benchmark]

    if available.empty:
        return "No available instances found."

    lines = []
    for bench_name, group in available.groupby("Benchmark", sort=True):
        instances = ", ".join(sorted(group["Instance"].astype(str)))
        lines.append(f"  {bench_name}: {instances}")
    return "\n".join(lines)


def select_benchmarks(df: pd.DataFrame, args: argparse.Namespace) -> pd.DataFrame:
    """Select benchmark instances from the flattened metadata dataframe."""
    validate_selection_args(args)

    selected = df.copy()

    if args.all:
        pass
    elif args.benchmark:
        selected = selected.loc[selected["Benchmark"].isin(args.benchmark)].copy()

        if args.size:
            selected = selected.loc[selected["Size"].isin(args.size)].copy()

        if args.name:
            selected = selected.loc[
                selected["Instance"].astype(str).isin(args.name)
            ].copy()
    elif args.instance:
        requested = {(item.benchmark, item.instance) for item in args.instance}
        selected = selected.loc[
            selected.apply(
                lambda row: (row["Benchmark"], row["Instance"]) in requested,
                axis=1,
            )
        ].copy()

    if selected.empty:
        msg = "No benchmark instances matched the requested selection."
        if args.benchmark and len(args.benchmark) == 1:
            msg += "\n\nAvailable instances for this benchmark:\n"
            msg += format_available_instances(df, args.benchmark[0])
        else:
            msg += "\n\nAvailable benchmark instances:\n"
            msg += format_available_instances(df)
        raise ValueError(msg)

    if not args.do_not_skip and "Skip because" in selected.columns:
        before_skip_filter = len(selected)
        selected = selected.loc[selected["Skip because"].fillna("").eq("")].copy()

        if selected.empty and before_skip_filter > 0:
            raise ValueError(
                "All selected benchmark instances are marked in the "
                "'Skip because' field. Re-run with --do-not-skip if this is intentional."
            )

    return selected


def allocate_campaign_vms(
    selected: pd.DataFrame,
    allocate_benchmarks,
    *,
    num_vms: int | None,
    weight_col: str,
    machine_profile: str | None,
    zone: str,
    timeout_seconds: int | None,
    years: list[int],
    solver: str | None,
) -> list[dict]:
    """Allocate selected benchmark instances to VM YAML dictionaries."""
    if weight_col not in selected.columns:
        raise ValueError(
            f"Weight column {weight_col!r} not found. "
            f"Available columns: {sorted(selected.columns)}"
        )

    if selected[weight_col].isna().any():
        missing = selected.loc[selected[weight_col].isna(), ["Benchmark", "Instance"]]
        raise ValueError(
            f"Weight column {weight_col!r} contains missing values for:\n"
            f"{missing.to_string(index=False)}"
        )

    def allocate_group(
        group: pd.DataFrame,
        profile: str,
        group_timeout_seconds: int,
    ) -> list[dict]:
        vm_count = num_vms or len(group)

        if vm_count < 1:
            raise ValueError("--num-vms must be at least 1.")

        return allocate_benchmarks(
            group,
            weight_col,
            vm_count,
            machine_type=MACHINE_PROFILES[profile]["machine_type"],
            zone=zone,
            solvers=solver,
            timeout_seconds=group_timeout_seconds,
            years=years,
        )

    if machine_profile is not None:
        profile_timeout_seconds = (
            timeout_seconds or MACHINE_PROFILES[machine_profile]["timeout_seconds"]
        )
        return allocate_group(selected, machine_profile, profile_timeout_seconds)

    vm_yamls = []

    small_medium = selected.loc[selected["Size"].isin(["S", "M"])].copy()
    large = selected.loc[selected["Size"] == "L"].copy()
    other = selected.loc[~selected["Size"].isin(["S", "M", "L"])].copy()

    if not small_medium.empty:
        sm_timeout_seconds = (
            timeout_seconds or MACHINE_PROFILES["short"]["timeout_seconds"]
        )
        vm_yamls.extend(allocate_group(small_medium, "short", sm_timeout_seconds))

    if not large.empty:
        large_timeout_seconds = (
            timeout_seconds or MACHINE_PROFILES["long"]["timeout_seconds"]
        )
        vm_yamls.extend(allocate_group(large, "long", large_timeout_seconds))

    if not other.empty:
        raise ValueError(
            "Found benchmark instances with unknown Size values:\n"
            f"{other[['Benchmark', 'Instance', 'Size']].to_string(index=False)}"
        )

    return vm_yamls


def print_campaign_summary(
    *,
    run_id: str,
    vm_prefix: str,
    selected: pd.DataFrame,
    vm_yamls: list[dict],
    years: list[int],
    timeout_seconds: int | None,
    machine_profile: str | None,
) -> None:
    """Print a concise summary and the next OpenTofu command."""
    campaign_dir = INFRASTRUCTURE_DIR / "benchmarks" / run_id

    by_size = selected["Size"].value_counts(dropna=False).sort_index()
    by_problem_class = selected["Problem class"].value_counts(dropna=False).sort_index()

    print("\nCampaign summary")
    print("================")
    print(f"Run ID:              {run_id}")
    print(f"VM prefix:           {vm_prefix}")
    print(f"Years:               {', '.join(map(str, years))}")
    if machine_profile is None:
        print("Machine policy:      S/M = short, L = long")
    else:
        print(f"Machine override:    {machine_profile}")
    if timeout_seconds is None:
        print("Timeout policy:      S/M = 1h (3600 s), L = 24h (86400 s)")
    else:
        print(
            f"Timeout override:    {timeout_seconds / 3600:.0f}h ({timeout_seconds} s)"
        )
    print(f"Selected instances:  {len(selected)}")
    print(f"Generated VMs:       {len(vm_yamls)}")
    print(f"Output directory:    {campaign_dir.relative_to(REPO_ROOT)}")

    print("\nInstances by benchmark:")
    for bench_name, group in selected.groupby("Benchmark", sort=True):
        instances = ", ".join(group["Instance"].astype(str))
        print(f"  {bench_name}: {instances}")

    print("\nInstances by size class:")
    for size_class, count in by_size.items():
        print(f"  {size_class}: {count}")

    print("\nInstances by problem class:")
    for problem_class, count in by_problem_class.items():
        print(f"  {problem_class}: {count}")

    print("\nGenerated files:")
    print(f"  {campaign_dir.relative_to(REPO_ROOT)}/run.tfvars")
    for idx in range(len(vm_yamls)):
        print(f"  {campaign_dir.relative_to(REPO_ROOT)}/{vm_prefix}-{idx:02d}.yaml")

    print("\nNext steps:")
    print("  cd infrastructure")
    print(
        "  tofu apply "
        f"-var-file benchmarks/{run_id}/run.tfvars "
        f"-state=states/{run_id}.tfstate"
    )

    print("\nBefore launching:")
    print(
        "  1. Estimate the cost before launching the run. "
        "It is easy to start a campaign costing $1000."
    )
    print(
        "  2. Estimate runtime and check that the run is parallelized "
        "as much as reasonably possible."
    )
    print(
        "  3. Check whether anyone else is already running benchmarks, "
        "and whether enough Gurobi licenses are available for the number "
        "of VMs you want to launch. The current limit is 40."
    )
    print(
        "  4. Inspect the generated YAML files in "
        f"infrastructure/benchmarks/{run_id}/ "
        "and verify that they contain the expected benchmarks."
    )


def build_parser(defaults: dict | None = None) -> argparse.ArgumentParser:
    """
    Build the command-line argument parser.

    Parameters
    ----------
    defaults : dict | None, optional
        Default argument values, typically loaded from a campaign config file.
        Explicit CLI arguments override these values.

    Returns
    -------
    argparse.ArgumentParser
        Configured argument parser.
    """
    defaults = defaults or {}
    parser = argparse.ArgumentParser(
        description="Create an OpenTofu benchmark campaign from metadata."
    )

    parser.add_argument(
        "--configfile",
        help=(
            "YAML campaign configuration file. "
            "Explicit CLI arguments override values from the config file."
        ),
    )

    parser.add_argument(
        "--target",
        choices=["cloud", "local"],
        default=argparse.SUPPRESS,
        help="Execution target.",
    )

    parser.add_argument(
        "--yes",
        action="store_true",
        default=argparse.SUPPRESS,
        help="Skip confirmation prompt for local execution.",
    )

    parser.add_argument(
        "--campaign",
        default=argparse.SUPPRESS,
        help="Short campaign name. The run ID is generated as YYYYMMDD-<campaign>.",
    )

    selection = parser.add_argument_group("selection")
    selection.add_argument(
        "--all",
        action="store_true",
        default=argparse.SUPPRESS,
        help="Select all benchmark instances.",
    )
    selection.add_argument(
        "--benchmark",
        nargs="+",
        default=argparse.SUPPRESS,
        help=(
            "Select all instances of one or more benchmarks. "
            "Can be combined with --size and --name filters."
        ),
    )
    selection.add_argument(
        "--size",
        nargs="+",
        default=argparse.SUPPRESS,
        help="Filter benchmark instances by metadata Size field, e.g. S M L.",
    )
    selection.add_argument(
        "--name",
        nargs="+",
        default=argparse.SUPPRESS,
        help=(
            "Filter benchmark instances by metadata Name field. "
            "This corresponds to the Instance column in the flattened metadata."
        ),
    )
    selection.add_argument(
        "--instance",
        action="append",
        default=argparse.SUPPRESS,
        type=parse_instance,
        help=(
            "Select a specific benchmark instance as '<benchmark>:<instance>'. "
            "Repeat this option for mixed selections."
        ),
    )
    selection.add_argument(
        "--do-not-skip",
        dest="do_not_skip",
        default=argparse.SUPPRESS,
        action="store_true",
        help=(
            "Include benchmark instances marked with 'Skip because:' in the metadata."
        ),
    )

    allocation = parser.add_argument_group("allocation")
    allocation.add_argument(
        "--num-vms",
        type=int,
        default=argparse.SUPPRESS,
        help=(
            "Number of VMs to allocate. "
            "If omitted, one VM is created per selected benchmark instance."
        ),
    )
    allocation.add_argument(
        "--weight-col",
        default=argparse.SUPPRESS,
        help="Metadata column used for greedy VM allocation.",
    )
    allocation.add_argument(
        "--machine-type",
        choices=sorted(MACHINE_PROFILES),
        default=argparse.SUPPRESS,
        help=(
            "Override the automatic machine profile selection. "
            "Use 'short' for c4-standard-2 with 1h timeout, or "
            "'long' for c4-highmem-16 with 24h timeout. "
            "If omitted, S/M instances use short and L instances use long."
        ),
    )
    allocation.add_argument(
        "--zone",
        default=argparse.SUPPRESS,
        help="GCP zone for generated VM YAML files.",
    )
    allocation.add_argument(
        "--timeout-hours",
        type=float,
        default=argparse.SUPPRESS,
        help=(
            "Override solver timeout in hours for all generated VMs. "
            "If omitted, S/M instances use 1h and L instances use 24h."
        ),
    )
    allocation.add_argument(
        "--years",
        nargs="+",
        type=int,
        default=argparse.SUPPRESS,
        help="Solver environment years to benchmark (default: 2025).",
    )
    allocation.add_argument(
        "--solver",
        nargs="+",
        default=argparse.SUPPRESS,
        help=("Solvers to benchmark. Default: gurobi highs scip cbc glpk."),
    )
    parser.add_argument(
        "--force",
        default=argparse.SUPPRESS,
        action="store_true",
        help="Overwrite an existing campaign directory if it already exists.",
    )
    parser.add_argument(
        "--vm-prefix",
        default=argparse.SUPPRESS,
        help=(
            "Prefix for generated VM YAML files. "
            "Defaults to 'benchmark-instance-<campaign>'."
        ),
    )
    parser.add_argument(
        "--skip-prepare",
        default=argparse.SUPPRESS,
        action="store_true",
        help="Skip merge_metadata.py and categorize_benchmarks.py.",
    )

    return parser


def validate_campaign_directory(campaign_dir: Path, force: bool) -> None:
    """
    Validate that the campaign output directory can be created.

    Parameters
    ----------
    campaign_dir : pathlib.Path
        Campaign output directory.
    force : bool
        Whether to allow overwriting an existing campaign directory.

    Raises
    ------
    FileExistsError
        If the campaign directory already exists and ``force`` is ``False``.
    """
    if not campaign_dir.exists():
        return

    if force:
        return

    raise FileExistsError(
        f"Campaign directory already exists:\n"
        f"  {campaign_dir.relative_to(REPO_ROOT)}\n\n"
        f"Options:\n"
        f"  1. Use a different campaign name:\n"
        f"     --campaign my-new-campaign\n\n"
        f"  2. Remove the existing campaign directory and rerun:\n"
        f"     rm -rf {campaign_dir.relative_to(REPO_ROOT)}\n\n"
        f"  3. Force overwrite:\n"
        f"     --force"
    )


def load_configfile(path: str | None) -> dict:
    """
    Load campaign configuration from a YAML file.

    Parameters
    ----------
    path : str | None
        Path to the YAML configuration file. If ``None``, an empty
        configuration dictionary is returned.

    Returns
    -------
    dict
        Parsed configuration dictionary.

    Raises
    ------
    ValueError
        If the YAML root object is not a mapping.
    """
    if path is None:
        return {}

    config_path = Path(path)

    with config_path.open("r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    if not isinstance(config, dict):
        raise ValueError(f"Config file must contain a YAML mapping: {config_path}")

    return config


def flatten_config(config: dict) -> dict:
    """
    Convert nested campaign configuration into argparse defaults.

    Parameters
    ----------
    config : dict
        Campaign configuration loaded from YAML. Supported top-level sections
        are ``campaign``, ``selection``, and ``allocation``.

    Returns
    -------
    dict
        Flat dictionary suitable for ``argparse.ArgumentParser.set_defaults``.
    """
    flat = {}

    if "target" in config:
        flat["target"] = config["target"]

    if "campaign" in config:
        flat["campaign"] = config["campaign"]

    selection = config.get("selection", {}) or {}
    allocation = config.get("allocation", {}) or {}

    for key in [
        "all",
        "benchmark",
        "size",
        "name",
        "instance",
        "do_not_skip",
    ]:
        if key in selection:
            flat[key] = selection[key]

    for key in [
        "num_vms",
        "weight_col",
        "machine_type",
        "zone",
        "timeout_hours",
        "years",
        "solver",
    ]:
        if key in allocation:
            flat[key] = allocation[key]

    return flat


def merge_cli_with_defaults(
    cli_args: argparse.Namespace,
    defaults: dict,
) -> argparse.Namespace:
    """Merge hardcoded defaults, config defaults, and explicit CLI arguments."""
    hardcoded = {
        "target": "cloud",
        "campaign": None,
        "all": False,
        "benchmark": None,
        "size": None,
        "name": None,
        "instance": None,
        "do_not_skip": False,
        "num_vms": None,
        "weight_col": "Num. variables",
        "machine_type": None,
        "zone": "us-central1-a",
        "timeout_hours": None,
        "years": [2025],
        "solver": ["gurobi", "highs", "scip", "cbc", "glpk"],
        "force": False,
        "vm_prefix": None,
        "skip_prepare": False,
        "yes": False,
        "configfile": None,
    }

    merged = hardcoded | defaults | vars(cli_args)

    cli_dict = vars(cli_args)

    # Selection mode CLI arguments override selection mode from config.
    if "all" in cli_dict:
        merged["benchmark"] = None
        merged["instance"] = None
    elif "benchmark" in cli_dict:
        merged["all"] = False
        merged["instance"] = None
    elif "instance" in cli_dict:
        merged["all"] = False
        merged["benchmark"] = None

    return argparse.Namespace(**merged)


def write_campaign_summary_csv(
    *,
    campaign_dir: Path,
    run_id: str,
    selected: pd.DataFrame,
    args: argparse.Namespace,
    timeout_seconds: int | None,
    machine_profile: str | None,
) -> None:
    """
    Write a CSV summary of the generated benchmark campaign.

    Parameters
    ----------
    run_id : str
        Campaign run identifier.
    selected : pandas.DataFrame
        Selected benchmark instances after applying all filters.
    args : argparse.Namespace
        Parsed command-line arguments after config file defaults and CLI
        overrides have been merged.
    timeout_seconds : int | None
        Solver timeout in seconds. If ``None``, the automatic timeout policy is
        used.
    machine_profile : str | None
        Machine profile override. If ``None``, the automatic size-based policy
        is used.
    """
    created_at = datetime.now().isoformat(timespec="seconds")
    created_by = getpass.getuser()

    rows = selected.copy().reset_index(drop=True)

    def effective_machine_profile(size: str) -> str:
        if args.target == "local":
            return "not applicable"
        if machine_profile is not None:
            return machine_profile
        if size in ["S", "M"]:
            return "short"
        if size == "L":
            return "long"
        return "unknown"

    def effective_machine_type(size: str) -> str:
        if args.target == "local":
            return "not applicable"
        profile = effective_machine_profile(size)
        if profile in MACHINE_PROFILES:
            return MACHINE_PROFILES[profile]["machine_type"]
        return "unknown"

    def effective_timeout_seconds(size: str) -> int | None:
        if timeout_seconds is not None:
            return timeout_seconds
        profile = effective_machine_profile(size)
        if profile in MACHINE_PROFILES:
            return MACHINE_PROFILES[profile]["timeout_seconds"]
        return None

    summary = pd.DataFrame(
        {
            "Run ID": run_id,
            "Target": args.target,
            "Created at": created_at,
            "Created by": created_by,
            "Config file": args.configfile,
            "Benchmark": rows["Benchmark"],
            "Instance": rows["Instance"],
            "Size": rows["Size"],
            "Problem class": rows["Problem class"],
            "Num. variables": rows.get("Num. variables"),
            "Num. constraints": rows.get("Num. constraints"),
            "Num. nonzeros": rows.get("Num. nonzeros"),
            "URL": rows.get("URL"),
            "Solvers": " ".join(args.solver),
            "Years": " ".join(map(str, args.years)),
            "Num VMs": (
                args.num_vms
                if args.target == "cloud" and args.num_vms is not None
                else len(selected)
                if args.target == "cloud"
                else "not applicable"
            ),
            "Weight column": args.weight_col,
            "Machine profile": rows["Size"].apply(effective_machine_profile),
            "Machine type": rows["Size"].apply(effective_machine_type),
            "Zone": args.zone if args.target == "cloud" else "not applicable",
            "Timeout seconds": rows["Size"].apply(effective_timeout_seconds),
            "Skipped instances included": args.do_not_skip,
        }
    )

    summary.to_csv(campaign_dir / "campaign_summary.csv", index=False)


def create_local_benchmark_yaml(
    selected: pd.DataFrame,
    *,
    years: list[int],
    solvers: list[str],
    timeout_seconds: int | None,
) -> dict:
    """
    Create benchmark YAML data for local execution.

    Parameters
    ----------
    selected : pandas.DataFrame
        Selected benchmark instances.
    years : list[int]
        Benchmark environment years.
    solvers : list[str]
        Solvers selected for the benchmark campaign.
    timeout_seconds : int | None
        Solver timeout in seconds.

    Returns
    -------
    dict
        YAML-compatible benchmark campaign data.
    """
    benchmarks = {}

    for _, row in selected.iterrows():
        benchmark = row["Benchmark"]
        size_instance = {
            "Name": row["Instance"],
            "Size": row["Size"],
            "URL": row["URL"],
        }

        if benchmark not in benchmarks:
            benchmarks[benchmark] = {
                "Problem class": row["Problem class"],
                "Sizes": [],
            }

        benchmarks[benchmark]["Sizes"].append(size_instance)

    data = {
        "years": years,
        "solvers": solvers,
        "benchmarks": benchmarks,
    }

    if timeout_seconds is not None:
        data["timeout_seconds"] = timeout_seconds

    return data


def create_local_campaign(
    *,
    campaign_dir: Path,
    run_id: str,
    selected: pd.DataFrame,
    args: argparse.Namespace,
    timeout_seconds: int | None,
) -> Path:
    """
    Create local benchmark campaign files.

    Parameters
    ----------
    campaign_dir : pathlib.Path
        Local campaign output directory.
    run_id : str
        Campaign run identifier.
    selected : pandas.DataFrame
        Selected benchmark instances.
    args : argparse.Namespace
        Parsed command-line arguments.
    timeout_seconds : int | None
        Solver timeout in seconds.

    Returns
    -------
    pathlib.Path
        Path to the generated local run script.
    """
    campaign_dir.mkdir(parents=True, exist_ok=True)

    solver = " ".join(args.solver)
    local_yaml = create_local_benchmark_yaml(
        selected,
        years=args.years,
        solvers=args.solver,
        timeout_seconds=timeout_seconds,
    )

    local_yaml_path = campaign_dir / "local_benchmarks.yaml"
    with local_yaml_path.open("w", encoding="utf-8") as f:
        yaml.dump(local_yaml, f, default_flow_style=False, sort_keys=False)

    command_parts = [
        "bash",
        "runner/benchmark_all.sh",
        "-y",
        " ".join(map(str, args.years)),
        "-s",
        solver,
        "-u",
        run_id,
        str(local_yaml_path.relative_to(REPO_ROOT)),
    ]

    run_script = campaign_dir / "run_local.sh"
    with run_script.open("w", encoding="utf-8") as f:
        f.write("#!/usr/bin/env bash\n")
        f.write("set -euo pipefail\n\n")
        f.write(f'cd "{REPO_ROOT}"\n\n')
        f.write(" ".join(f'"{part}"' for part in command_parts) + "\n")

    run_script.chmod(0o755)

    return run_script


def maybe_run_local_campaign(run_script: Path, *, yes: bool) -> None:
    """
    Ask whether to run the generated local benchmark campaign.

    Parameters
    ----------
    run_script : pathlib.Path
        Path to the generated local run script.
    yes : bool
        If ``True``, skip confirmation and run immediately.
    """
    if not yes:
        answer = input("\nProceed with local execution? [y/N] ").strip().lower()
        if answer != "y":
            print("\nLocal campaign generated, execution skipped.")
            return

    subprocess.run(["bash", str(run_script)], cwd=REPO_ROOT, check=True)


def main() -> None:
    config_parser = argparse.ArgumentParser(add_help=False)
    config_parser.add_argument("--configfile")
    config_args, _ = config_parser.parse_known_args()

    config = load_configfile(config_args.configfile)
    defaults = flatten_config(config)

    parser = build_parser(defaults)
    cli_args = parser.parse_args()
    args = merge_cli_with_defaults(cli_args, defaults)

    if not args.campaign:
        parser.error("--campaign is required unless provided in --configfile")

    if args.yes and args.target != "local":
        parser.error("--yes can only be used with --target local")

    if args.instance and isinstance(args.instance[0], str):
        args.instance = [parse_instance(value) for value in args.instance]

    campaign_slug = slugify_campaign_name(args.campaign)
    run_id = f"{date.today():%Y%m%d}-{campaign_slug}"
    vm_prefix = args.vm_prefix or f"benchmark-instance-{campaign_slug}"

    if args.target == "cloud":
        campaign_dir = INFRASTRUCTURE_DIR / "benchmarks" / run_id
    else:
        campaign_dir = LOCAL_BENCHMARKS_DIR / run_id

    validate_campaign_directory(campaign_dir, args.force)

    if not args.skip_prepare:
        prepare_metadata()

    allocate_benchmarks, create_benchmark_campaign, load_benchmark_metadata = (
        import_runner_utils()
    )

    benchmarks_df = load_benchmark_metadata(str(METADATA_FILE))
    selected = select_benchmarks(benchmarks_df, args)

    timeout_seconds = None

    if args.timeout_hours is not None:
        timeout_seconds = int(args.timeout_hours * 3600)

    if args.target == "local" and timeout_seconds is None:
        selected_profiles = selected["Size"].map(
            lambda size: "long" if size == "L" else "short"
        )
        timeout_seconds = max(
            MACHINE_PROFILES[profile]["timeout_seconds"]
            for profile in selected_profiles
        )

    if args.target == "cloud":
        vm_yamls = allocate_campaign_vms(
            selected,
            allocate_benchmarks,
            num_vms=args.num_vms,
            weight_col=args.weight_col,
            machine_profile=args.machine_type,
            zone=args.zone,
            timeout_seconds=timeout_seconds,
            years=args.years,
            solver=" ".join(args.solver),
        )

        # create_benchmark_campaign uses relative paths like ../infrastructure.
        # Run it from runner/ to preserve the existing path convention.
        old_cwd = Path.cwd()
        try:
            import os

            os.chdir(RUNNER_DIR)
            create_benchmark_campaign(run_id, vm_prefix, vm_yamls)
        finally:
            os.chdir(old_cwd)

        write_campaign_summary_csv(
            campaign_dir=campaign_dir,
            run_id=run_id,
            selected=selected,
            args=args,
            timeout_seconds=timeout_seconds,
            machine_profile=args.machine_type,
        )

        print_campaign_summary(
            run_id=run_id,
            vm_prefix=vm_prefix,
            selected=selected,
            vm_yamls=vm_yamls,
            years=args.years,
            timeout_seconds=timeout_seconds,
            machine_profile=args.machine_type,
        )

    else:
        run_script = create_local_campaign(
            campaign_dir=campaign_dir,
            run_id=run_id,
            selected=selected,
            args=args,
            timeout_seconds=timeout_seconds,
        )

        write_campaign_summary_csv(
            campaign_dir=campaign_dir,
            run_id=run_id,
            selected=selected,
            args=args,
            timeout_seconds=timeout_seconds,
            machine_profile=args.machine_type,
        )

        print("\nLocal campaign generated")
        print("========================")
        print(f"Run ID:              {run_id}")
        print(f"Output directory:    {campaign_dir.relative_to(REPO_ROOT)}")
        print(
            f"Benchmark YAML:      {run_script.with_name('local_benchmarks.yaml').relative_to(REPO_ROOT)}"
        )
        print(f"Run script:          {run_script.relative_to(REPO_ROOT)}")
        print(
            f"Summary CSV:         {(campaign_dir / 'campaign_summary.csv').relative_to(REPO_ROOT)}"
        )
        print("\nRun locally with:")
        print(f"  bash {run_script.relative_to(REPO_ROOT)}")

        maybe_run_local_campaign(run_script, yes=args.yes)


if __name__ == "__main__":
    main()
