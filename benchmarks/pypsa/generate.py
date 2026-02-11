import argparse
import os
import pathlib
import re
import subprocess

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
        with open(path, "r") as f:
            return y.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load YAML {path}: {e}")


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
    with open(path, "w") as f:
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
    p.add_argument("--file_extension", default=".lp")
    p.add_argument("--output_dir", default="/tmp/")
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


def generate_benchmark(name: str, config_path: pathlib.Path, dry: bool) -> None:
    """
    Generate a benchmark instance by running a Snakemake workflow.

    This function constructs and executes a Snakemake command to solve a
    network model based on the provided benchmark name and configuration.
    It selects the appropriate Snakemake rule (`solve_elec_networks` or
    `solve_sector_networks`) depending on whether 'elec' is in the name.

    Parameters
    ----------
    name : str
        The name of the benchmark (e.g., 'pypsa-eur-elec').
    config_path : pathlib.Path
        The path to the configuration file for the Snakemake workflow.
    dry : bool
        If True, a dry run is performed by adding the '-n' flag to the
        Snakemake command.
    """
    dry_flag = "-n" if dry else ""

    # ONLY FIRST-STAGE SOLVES ARE KEPT
    if "elec" in name:
        run(
            f"snakemake --snakefile Snakefile solve_elec_networks "
            f"--configfile {config_path} {dry_flag} --cores all"
        )
    else:
        run(
            f"snakemake --snakefile Snakefile solve_sector_networks "
            f"--configfile {config_path} {dry_flag} --cores all"
        )


if __name__ == "__main__":
    args = parse_args()

    base_dir = pathlib.Path(__file__).parent
    default_cfg = load_yaml(pathlib.Path(base_dir, "config", "config.default.yaml"))
    benchmark_files = select_yaml_files(args.benchmark_name, pathlib.Path(base_dir, "config"))

    bench_type = "elec" if "elec" in args.benchmark_name else "sec"
    horizon = "2050"

    for bench_file in benchmark_files:
        bench_cfg = load_yaml(bench_file)

        for clusters in args.clusters:
            for t_res in args.time_resolutions:
                # Build merged config
                final_cfg = recursive_merge(default_cfg.copy(), bench_cfg.copy())

                final_cfg.setdefault("scenario", {})
                final_cfg["scenario"]["clusters"] = [clusters]
                final_cfg["scenario"]["planning_horizons"] = [horizon]

                final_cfg.setdefault("clustering", {})
                final_cfg["clustering"].setdefault("temporal", {})
                if bench_type == "elec":
                    final_cfg["clustering"]["temporal"]["resolution_elec"] = t_res
                else:
                    final_cfg["clustering"]["temporal"]["resolution_sector"] = t_res

                # Fix NO/False issue
                if "countries" in final_cfg:
                    cleaned = []
                    for c in final_cfg["countries"]:
                        if c is False or c == "NO":
                            cleaned.append(DoubleQuotedScalarString("NO"))
                        else:
                            cleaned.append(DoubleQuotedScalarString(str(c)))
                    final_cfg["countries"] = cleaned

                out_cfg = bench_file.with_stem(
                    f"{bench_file.stem}_{clusters}_{t_res}_{horizon}"
                )
                save_yaml(out_cfg, final_cfg)

                # We still generate MPS/LP for the **first stage only**
                mps_path = (
                    pathlib.Path(args.output_dir)
                    / out_cfg.with_suffix(args.file_extension).name
                )
                os.environ["ONLY_GENERATE_PROBLEM_FILE"] = str(mps_path)

                generate_benchmark(args.benchmark_name, out_cfg, args.dry_run)

                out_cfg.unlink(missing_ok=True)
