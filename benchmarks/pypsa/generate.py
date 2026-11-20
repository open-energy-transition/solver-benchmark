"""
This script generates benchmark problem files for PyPSA-based energy system models.
It automates the process of creating multiple model instances by iterating over different configurations,
such as the number of clusters and time resolutions.
The script uses a base configuration and merges it with benchmark-specific configurations.
For each parameter combination, the script creates a benchmark-specific configuration and runs Snakemake
to build the composed PyPSA-Eur network. It then invokes export_model.py to construct and export
the optimization problem in LP or MPS format.
The script is intended to be run from the command line and accepts various arguments to customize
the benchmark generation process.

Example Usage
-------------
# Generate default benchmarks ('pypsa-eur-elec') with default settings.
python benchmarks/pypsa/generate.py

# Generate 'pypsa-eur-sec' benchmarks for 200 and 300 clusters,
# with 6h and 48h time resolutions, saving as MPS files in './output'.
python benchmarks/pypsa/generate.py \
    --benchmark_name pypsa-eur-sec \
    --file_extension .mps \
    --output_dir ./output \
    -c 200 300 \
    -r 6h 48h

# Perform a dry run to see the commands that would be executed without
# actually generating the files.
python benchmarks/pypsa/generate.py -n

"""

import argparse
import os
import pathlib
import re
import subprocess
import sys
from copy import deepcopy
from pathlib import Path

import ruamel.yaml
from ruamel.yaml.scalarstring import DoubleQuotedScalarString

DEFAULT_BENCHMARKS = ["pypsa-eur-elec", "pypsa-eur-sec"]


def load_yaml(path: pathlib.Path) -> dict:
    """
    Load a YAML file.

    Parameters
    ----------
    path : pathlib.Path
        The path to the YAML file to load.

    Returns
    -------
    dict
        A dictionary containing the parsed YAML data.

    Raises
    ------
    RuntimeError
        If the YAML file fails to load.
    """
    y = ruamel.yaml.YAML()
    try:
        with Path(path).open() as f:
            return y.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load YAML {path}: {e}") from e


def save_yaml(path: pathlib.Path, data: dict) -> None:
    """
    Save a dictionary to a YAML file.

    Parameters
    ----------
    path : pathlib.Path
        The path to the YAML file to save.
    data : dict
        A dictionary containing the data to be saved.
    """
    y = ruamel.yaml.YAML()
    y.preserve_quotes = True
    y.width = 4096
    with Path(path).open("w") as f:
        y.dump(data, f)


def recursive_merge(base: dict, override: dict) -> dict:
    """
    Recursively merge two dictionaries.

    The `override` dictionary is merged into the `base` dictionary. If a key
    exists in both and the corresponding values are dictionaries, a recursive
    merge is performed. Otherwise, the value from `override` overwrites the
    value in `base`. The `base` dictionary is modified in-place.

    Parameters
    ----------
    base : dict
        The base dictionary to merge into.
    override : dict
        The dictionary with values to override the base.

    Returns
    -------
    dict
        The merged dictionary.
    """
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            recursive_merge(base[k], v)
        else:
            base[k] = v
    return base


def select_yaml_files(
    benchmark_name: str, yaml_dir: pathlib.Path
) -> list[pathlib.Path]:
    """
    Select YAML configuration files for a given benchmark.

    This function looks up a predefined list of YAML file names associated
    with a benchmark name and returns the paths of those that exist within
    the specified directory.

    Parameters
    ----------
    benchmark_name : str
        The name of the benchmark (e.g., 'pypsa-eur-elec').
    yaml_dir : pathlib.Path
        The directory to search for the YAML files.

    Returns
    -------
    list[pathlib.Path]
        A list of paths to the YAML files found for the given benchmark.

    Raises
    ------
    ValueError
        If no YAML files are found for the specified benchmark name.
    """
    benchmark_yaml_map = {
        "pypsa-eur-elec": [
            "pypsa-eur-elec.yaml",
            "pypsa-eur-elec-dfp.yaml",
            "pypsa-eur-elec-trex_copt.yaml",
            "pypsa-eur-elec-trex_copt-dfp.yaml",
            "pypsa-eur-elec-trex_vopt.yaml",
            "pypsa-eur-elec-trex_vopt-dfp.yaml",
            "pypsa-eur-elec-uc.yaml",
            "pypsa-eur-elec-uc-dfp.yaml",
            "pypsa-eur-elec-trex_copt-uc.yaml",
            "pypsa-eur-elec-trex_copt-uc-dfp.yaml",
            "pypsa-eur-elec-trex_vopt-uc.yaml",
            "pypsa-eur-elec-trex_vopt-uc-dfp.yaml",
        ],
        "pypsa-eur-sec": [
            "pypsa-eur-sec.yaml",
            "pypsa-eur-sec-trex_copt.yaml",
            "pypsa-eur-sec-trex_vopt.yaml",
        ],
    }

    matches = []
    for name in benchmark_yaml_map.get(benchmark_name, []):
        p = yaml_dir / name
        if p.exists():
            matches.append(p)

    if not matches:
        raise ValueError(f"No YAML found for {benchmark_name}")

    return matches


def validate_time_resolution(res: str) -> str:
    """
    Validate a time resolution string for argparse.

    Checks if the input string matches the format of one or more digits
    followed by 'h' or 'H'. If it matches, it returns the formatted string
    with a capital 'H'. This function is intended to be used as a type
    for an `argparse` argument.

    Parameters
    ----------
    res : str
        The time resolution string to validate (e.g., '3h', '12H').

    Returns
    -------
    str
        The validated time resolution string in the format '{digits}H'.

    Raises
    ------
    argparse.ArgumentTypeError
        If the input string does not match the required format.
    """
    m = re.match(r"^(\d+)[hH]$", res)
    if not m:
        raise argparse.ArgumentTypeError(f"Invalid time resolution: {res}")
    return f"{m.group(1)}H"


def parse_args() -> argparse.Namespace:
    """
    Parse command-line arguments for the benchmark generation script.

    Returns
    -------
    argparse.Namespace
        An object containing the parsed command-line arguments as attributes.
        The attributes include `benchmark_name`, `file_extension`, `output_dir`,
        `dry_run`, `clusters`, and `time_resolutions`.
    """
    p = argparse.ArgumentParser()
    p.add_argument(
        "--benchmark_name", choices=DEFAULT_BENCHMARKS, default="pypsa-eur-elec"
    )
    p.add_argument("--file_extension", default=".mps")
    p.add_argument("--output_dir", default="/tmp/")
    p.add_argument("--configuration", default=None)
    p.add_argument("--germany", action="store_true")
    p.add_argument("-n", "--dry_run", action="store_true")
    p.add_argument("-c", "--clusters", nargs="+", type=int, default=[50, 100])
    p.add_argument(
        "-r",
        "--time_resolutions",
        nargs="+",
        type=validate_time_resolution,
        default=["1h", "3h", "12h", "24h"],
    )
    return p.parse_args()


def run(cmd: str) -> None:
    """
    Execute a shell command and stream its output.

    This function runs a command in a subprocess, capturing and printing its
    standard output and standard error in real-time. If the command exits
    with a non-zero status code, it indicates a failure, and a RuntimeError
    is raised.

    Parameters
    ----------
    cmd : str
        The command string to be executed.

    Raises
    ------
    RuntimeError
        If the command returns a non-zero exit code, indicating an error.
    """
    proc = subprocess.Popen(
        cmd.split(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    for line in proc.stdout:
        print(line, end="")
    proc.wait()

    if proc.returncode != 0:
        raise RuntimeError(f"Snakemake failed (rc={proc.returncode}): {cmd}")


def generate_benchmark(
    config_path: pathlib.Path,
    network_path: pathlib.Path,
    dry: bool,
) -> None:
    """
    Run Snakemake to build the composed PyPSA-Eur network.

    Parameters
    ----------
    config_path : pathlib.Path
        Path to the benchmark-specific Snakemake configuration.
    network_path : pathlib.Path
        Path to the composed network generated by Snakemake.
    dry : bool
        Whether to execute Snakemake in dry-run mode.
    """
    command = (
        f"snakemake --snakefile Snakefile {network_path} "
        f"--configfile {config_path} --cores {os.environ.get('SLURM_CPUS_PER_TASK', 'all')}"
    )

    if dry:
        command += " -n"

    run(command)


def build_benchmark_config(
    default_cfg: dict,
    bench_cfg: dict,
    clusters: int,
    time_resolution: str,
    bench_type: str,
    horizon: str = "2050",
    benchmark_id: str | None = None,
) -> dict:
    """
    Build an isolated configuration for the PyPSA-Eur benchmark.

    Parameters
    ----------
    default_cfg : dict
        Base PyPSA-Eur configuration.
    bench_cfg : dict
        Benchmark-specific configuration overrides.
    clusters : int
        Number of spatial clusters.
    time_resolution : str
        Temporal resolution, such as "1h" or "3h".
    bench_type : str
        Benchmark type, either "elec" or "sec".
    horizon : str, optional
        Planning horizon. Defaults to "2050".
    benchmark_id : str or None, optional
        Benchmark identifier used to configure the run.

    Returns
    -------
    dict
        Merged configuration without modifying the inputs.

    Raises
    ------
    ValueError
        If the benchmark type is unsupported.
    """
    if bench_type not in {"elec", "sec"}:
        raise ValueError(f"Unsupported benchmark type: {bench_type}")

    final_cfg = recursive_merge(deepcopy(default_cfg), deepcopy(bench_cfg))

    final_cfg["planning_horizons"] = [int(horizon)]

    final_cfg.setdefault("clustering", {}).setdefault("cluster_network", {})
    final_cfg["clustering"]["cluster_network"]["n_clusters"] = clusters

    resolution = validate_time_resolution(time_resolution).lower()
    final_cfg["clustering"]["temporal"] = {
        "averaging": resolution if resolution != "1h" else False,
        "segmentation": False,
        "representative": False,
    }

    final_cfg.setdefault("sector", {})["enabled"] = bench_type == "sec"

    if benchmark_id is not None:
        run_config = final_cfg.setdefault("run", {})
        run_config["name"] = benchmark_id
        run_config["prefix"] = ""
        run_config.setdefault("scenarios", {})["enable"] = False
        run_config.setdefault("shared_resources", {})["policy"] = False

    if "countries" in final_cfg:
        final_cfg["countries"] = [
            DoubleQuotedScalarString(
                "NO" if country is False or country == "NO" else str(country)
            )
            for country in final_cfg["countries"]
        ]

    return final_cfg


if __name__ == "__main__":
    args = parse_args()

    base_dir = pathlib.Path(__file__).resolve().parent
    default_cfg = load_yaml(base_dir / "config" / "config.default.yaml")
    benchmark_files = select_yaml_files(args.benchmark_name, base_dir)

    if args.configuration:
        benchmark_files = [
            path for path in benchmark_files if path.stem == args.configuration
        ]
        if not benchmark_files:
            raise ValueError(f"Unknown configuration: {args.configuration}")

    bench_type = "elec" if "elec" in args.benchmark_name else "sec"
    horizon = "2050"

    output_dir = pathlib.Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.file_extension not in {".lp", ".mps"}:
        raise ValueError("File extension must be .lp or .mps")

    for bench_file in benchmark_files:
        bench_cfg = load_yaml(bench_file)

        for clusters in args.clusters:
            for time_resolution in args.time_resolutions:
                resolution = validate_time_resolution(time_resolution).lower()
                benchmark_id = f"{bench_file.stem}-{clusters}-{resolution}"

                if args.germany:
                    benchmark_id = benchmark_id.replace("pypsa-eur-", "pypsa-de-", 1)

                config = build_benchmark_config(
                    default_cfg,
                    bench_cfg,
                    clusters,
                    time_resolution,
                    bench_type,
                    horizon,
                    benchmark_id=benchmark_id,
                )

                if args.germany:
                    config["countries"] = ["DE"]

                config_path = output_dir / f"{benchmark_id}.yaml"
                problem_path = output_dir / (f"{benchmark_id}{args.file_extension}")
                prepared_network_path = output_dir / f"{benchmark_id}.nc"

                composed_network_path = (
                    pathlib.Path("resources")
                    / benchmark_id
                    / "networks"
                    / f"composed_{horizon}.nc"
                )

                save_yaml(config_path, config)

                generate_benchmark(
                    config_path,
                    composed_network_path,
                    args.dry_run,
                )

                if args.dry_run:
                    continue

                subprocess.run(
                    [
                        sys.executable,
                        str(base_dir / "export_model.py"),
                        "--network",
                        str(composed_network_path),
                        "--config",
                        str(config_path),
                        "--problem",
                        str(problem_path),
                        "--prepared-network",
                        str(prepared_network_path),
                        "--horizon",
                        horizon,
                    ],
                    check=True,
                )
