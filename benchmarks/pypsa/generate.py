import argparse
import os
import pathlib
import re
import subprocess
import typing
import yaml

import ruamel.yaml


DEFAULT_BENCHMARKS = [
    "pypsa-eur-elec",
    "pypsa-eur-sec"
]


def select_yaml_files(benchmark_name: str, yaml_dir: typing.Optional[pathlib.Path] = None) -> list[pathlib.Path]:
    """
    Select YAML files corresponding to the given benchmark name.

    Parameters
    ----------
    benchmark_name : str
        Name of the benchmark to select YAML files for
    yaml_dir : Optional[Path], optional
        Directory containing YAML files. If None, uses the current directory.

    Returns
    -------
    list[Path]
        List of matching YAML files as Path objects

    Raises
    ------
    ValueError
        If no matching YAML files are found
    """
    # If no directory specified, use current directory
    if yaml_dir is None:
        yaml_dir = pathlib.Path(__file__).parent

    # Ensure yaml_dir is a Path object
    yaml_dir = pathlib.Path(yaml_dir)

    # Mapping of benchmark names to their matching YAML files
    benchmark_yaml_map = {
        "pypsa-eur-elec": [
            "pypsa-eur-elec.yaml",
            "pypsa-eur-elec-dfp.yaml",
            "pypsa-eur-elec-trex_copt.yaml",
            "pypsa-eur-elec-trex_copt-dfp.yaml",
            #"pypsa-eur-elec-trex_copt-ucconv.yaml",
            "pypsa-eur-elec-trex_vopt.yaml",
            "pypsa-eur-elec-trex_vopt-dfp.yaml",
            #"pypsa-eur-elec-trex_vopt-ucconv.yaml",
            #"pypsa-eur-elec-ucconv.yaml",
        ],
        "pypsa-eur-sec": [
            "pypsa-eur-sec.yaml",
            "pypsa-eur-sec-trex_copt.yaml",
            "pypsa-eur-sec-trex_vopt.yaml"
        ]
    }

    # Get matching YAML files
    matching_yamls = benchmark_yaml_map.get(benchmark_name, [])

    # Check if yaml files exist
    existing_yamls = [
        pathlib.Path(yaml_dir, yaml_file)
        for yaml_file in matching_yamls
        if pathlib.Path(yaml_dir, yaml_file).exists()
    ]

    # Raise error if no matching files found
    if not existing_yamls:
        raise ValueError(f"No YAML files found for benchmark: {benchmark_name}")

    return existing_yamls


def validate_time_resolution(resolution: str) -> str:
    """
    Validate and normalize time resolution format.

    Parameters
    ----------
    resolution : str
        Input time resolution string

    Returns
    -------
    str
        Normalized time resolution with uppercase 'H'

    Raises
    ------
    argparse.ArgumentTypeError
        If the resolution format is invalid

    """

    # Use regex to match valid time resolution format
    match = re.match(r'^(\d+)([hH])$', resolution)

    if not match:
        raise argparse.ArgumentTypeError(
            f"Invalid time resolution format: {resolution}. "
            "Must be in format like 1H, 12H, etc."
        )

    # Extract number and convert to uppercase H
    number, _ = match.groups()
    return f"{number}H"


def parse_input_arguments() -> argparse.Namespace:
    """
    Parse command line arguments.

    Returns
    -------
    argparse.Namespace
        Parsed command line arguments containing:
        - benchmark name
        - output directory
        - dry run flag.
        - clusters.
        - time resolutions

    """

    # Create the parser
    parser = argparse.ArgumentParser(
        description="Generates benchmark output files and puts them in output directory",
        formatter_class=argparse.RawTextHelpFormatter
    )

    # Define arguments
    parser.add_argument("--benchmark_name",
                        type=str,
                        choices=DEFAULT_BENCHMARKS,
                        default="pypsa-eur-elec",
                        help="Name of the benchmark to generate. ")

    parser.add_argument("--file_extension",
                        type=str,
                        default=".lp",
                        help="Benchmark file extension")

    parser.add_argument("--output_dir",
                        type=str,
                        default="/tmp/",
                        help="Output directory for benchmark files")

    parser.add_argument("-n", "--dry_run",
                        action="store_true",
                        help="Dry-run, just print snakemake DAGs but do nothing. Default: false")

    parser.add_argument("-c", "--clusters",
                        nargs="+",
                        type=int,
                        default=[50],
                        help="List of number of clusters. Default: 50 100")

    parser.add_argument("-r", "--time_resolutions",
                        nargs="+",
                        type=validate_time_resolution,
                        default=["12H", "24H"],
                        help="List of time resolutions. Default: 1H 3H 12H 24H")

    parser.add_argument("-rmc", "--remove_configs",
                        action="store_false",
                        help="Remove configs, remove modified config files. Default: true")

    # Parse arguments
    args = parser.parse_args()

    # Your actual implementation would go here
    print(f"Benchmark Name: {args.benchmark_name}")
    print(f"Output Directory: {args.output_dir}")
    print(f"Dry Run: {args.dry_run}")
    print(f"Clusters: {args.clusters}")
    print(f"Time Resolutions: {args.time_resolutions}")

    return args


def add_scenario_section(file_name: pathlib.Path, number_clusters: str, time_resolution: str, planning_horizon: str = "2050") -> pathlib.Path:
    """
    Create a scenario section for a configuration dictionary.

    Parameters
    ----------
    file_name: pathlib.Path
        Original input yaml configuration file
    number_clusters : str
        The number of clusters to be used in the scenario.
    time_resolution : str
        The time resolution for the scenario (e.g., '2H' for 2-hour intervals).
        Applied to both 'opts' and 'sector_opts' in the scenario configuration.
    planning_horizon : str
        The planning horizon. Default is 2050.

    Returns
    -------
    pathlib.Path:
        Output yaml configuration file

    """

    # Create a YAML loader with precise formatting
    yaml_loader = ruamel.yaml.YAML()
    yaml_loader.preserve_quotes = True  # Preserve quote styles
    yaml_loader.width = 4096  # Prevent unexpected line breaks

    with open(file_name, "r") as file:
        original_yaml = yaml_loader.load(file)

    scenario_section = {
        "scenario": {
            "clusters": number_clusters,
            "opts": time_resolution,
            "sector_opts": time_resolution,
            "planning_horizons": planning_horizon
        }
    }

    # REMOVE THIS PART

    enable_section = {
        "enable": {
            "retrieve": "auto",
            "retrieve_databundle": False,
            "retrieve_cost_data": True,
            "build_cutout": False,
            "retrieve_cutout": False,
            "drop_leap_day": True
        }
    }

    solver_section = {
        "solving": {
            "solver": {
                "name": "highs",
                "options": "highs-default"
            }
        }
    }

    # Merge the new section into the existing YAML
    original_yaml.update(scenario_section)
    original_yaml.update(solver_section)
    #original_yaml.update(enable_section)

    # Generate a new config file name
    output_file_name = file_name.with_stem(f'{file_name.stem}_{number_clusters}_{time_resolution}_{planning_horizon}')

    # Write the updated YAML to a file
    with open(output_file_name, "w") as file:
        yaml_loader.dump(original_yaml, file)

    return output_file_name


def run_snakemake_command(command: str, capture_output: bool = False) -> subprocess.CompletedProcess:
    """
    Execute a Snakemake command and stream its output to the container stdout/stderr
    in real time. If capture_output=True, fall back to capturing for backward compatibility.
    """
    # Use shell splitting for security but allow complex commands if needed.
    cmd_parts = command.split()

    if capture_output:
        # preserve existing behavior when caller explicitly wants captured output
        result = subprocess.run(
            cmd_parts,
            check=True,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print("Snakemake stdout:")
            print(result.stdout)
        if result.stderr:
            print("Snakemake stderr:")
            print(result.stderr)
        return result

    # Stream output in real time
    proc = subprocess.Popen(
        cmd_parts,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )

    # Print each line as it arrives
    for line in proc.stdout:
        print(line, end="")

    proc.stdout.close()
    returncode = proc.wait()

    if returncode != 0:
        raise RuntimeError(f"Snakemake command failed (rc={returncode}): {command}")

    # Return a CompletedProcess-like object for compatibility
    return subprocess.CompletedProcess(cmd_parts, returncode)


def generate_benchmark(
    name_of_benchmark: str,
    config_file: pathlib.Path,
    dry_run_flag: bool
) -> None:
    """
    Generate benchmark file based on benchmark name and configuration.

    Parameters
    ----------
    name_of_benchmark : str
        Name of the benchmark to run
    config_file : pathlib.Path
        Configuration YAML file
    dry_run_flag : bool
        Flag to perform a dry run without actual execution (default is False)

    Raises
    ------
    ValueError
        If the benchmark is not supported

    Notes
    -----
    Supports benchmarks containing 'elec' and 'pypsa-eur-sec'
    """

    # Extract the final pathlib.Path component
    config_file_name = config_file.name
    elec_benchmarks_filter = list(filter(lambda x: "elec" in x, DEFAULT_BENCHMARKS))
    if dry_run_flag:
        dry_run = "-n"
    else:
        dry_run = ""

    if name_of_benchmark in elec_benchmarks_filter:
        snakemake_command_network = f"snakemake --snakefile Snakefile solve_elec_networks --configfile {config_file_name} {dry_run} --cores all"
        run_snakemake_command(snakemake_command_network)
    elif name_of_benchmark == "pypsa-eur-sec":
        # Prepare operations MPS path (PyPSA will write here instead of NC)
        mps_path_original = pathlib.Path(os.environ["ONLY_GENERATE_PROBLEM_FILE"])
        mps_ops = mps_path_original.with_name(
            mps_path_original.stem + "_op" + mps_path_original.suffix
        )

        # Override the output target for the operations step
        os.environ["ONLY_GENERATE_PROBLEM_FILE"] = str(mps_ops)
        print(f"[INFO] Writing OPERATIONS MPS to : {mps_ops}")

        # ------------------------------------------------------------
        # Load config YAML to extract wildcard values required by the rule
        # The rule solve_operations_network has output:
        #   networks/base_s_{clusters}_elec_{opts}_op.nc
        #
        # Snakemake needs this target to choose the rule,
        # even if the actual NC file will NOT be written because
        # ONLY_GENERATE_PROBLEM_FILE forces PyPSA to output only the MPS.
        # ------------------------------------------------------------
        with open(config_file, "r") as f:
            cfg = yaml.safe_load(f)

        # Extract wildcards from config
        clusters = cfg["scenario"]["clusters"]
        opts = cfg["scenario"]["opts"]

        # Build the concrete output target of the rule
        ops_target = f"results/networks/base_s_{clusters}_elec_{opts}_op.nc"

        # ------------------------------------------------------------
        # Snakemake call:
        # We trigger the rule by giving its expected output.
        # PyPSA will NOT produce the NC because ONLY_GENERATE_PROBLEM_FILE overrides it.
        # ------------------------------------------------------------
        cmd_ops = (
            f"snakemake --snakefile Snakefile {ops_target} "
            f"--configfile {config_file_name} {dry_run} --cores all"
        )
        run_snakemake_command(cmd_ops)
    else:
        print(f"{name_of_benchmark} is not among the supported ones")


if __name__ == "__main__":

    # Parse input arguments
    input_args = parse_input_arguments()

    # Select yaml files based on benchmark name
    list_yamls = select_yaml_files(input_args.benchmark_name)

    p_horizon = "2050"

    # Generate the yaml files
    for yaml_file_name in list_yamls:
        for n_clusters in input_args.clusters:
            for t_res in input_args.time_resolutions:

                # Generate new config file nae
                output_yaml_file_name = add_scenario_section(yaml_file_name, n_clusters, t_res, p_horizon)

                # Generate benchmark file name
                benchmark_file_name = pathlib.Path(output_yaml_file_name.parent, input_args.output_dir, output_yaml_file_name.with_suffix(input_args.file_extension).name)

                print("\n============================================")
                print(f"[INFO] Using YAML config     : {output_yaml_file_name}")
                print(f"[INFO] Clusters = {n_clusters}, Time resolution = {t_res}")
                print("============================================\n")

                mps_name = (
                    output_yaml_file_name.with_suffix(input_args.file_extension).name
                )
                mps_path = pathlib.Path(
                    output_yaml_file_name.parent,
                    input_args.output_dir,
                    mps_name
                )
                os.environ["ONLY_GENERATE_PROBLEM_FILE"] = str(mps_path)
                print(f"[INFO] Writing MPS to : {mps_path}")

                # run solver
                generate_benchmark(input_args.benchmark_name, output_yaml_file_name, input_args.dry_run)
                # Remove config file
                if input_args.remove_configs:
                    output_yaml_file_name.unlink(missing_ok=True)
