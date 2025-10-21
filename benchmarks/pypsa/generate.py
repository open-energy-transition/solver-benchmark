import argparse
import pathlib
import re
import subprocess
import typing

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
            "pypsa-eur-elec-trex_copt-ucconv.yaml",
            "pypsa-eur-elec-trex_vopt.yaml",
            "pypsa-eur-elec-trex_vopt-dfp.yaml",
            "pypsa-eur-elec-trex_vopt-ucconv.yaml",
            "pypsa-eur-elec-ucconv.yaml",
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
        description="Generates benchmark sizes and puts LP files in output directory",
        formatter_class=argparse.RawTextHelpFormatter
    )

    # Define arguments
    parser.add_argument("--benchmark_name",
                        type=str,
                        choices=DEFAULT_BENCHMARKS,
                        default="pypsa-eur-elec",
                        help="Name of the benchmark to generate. ")

    parser.add_argument("--output_dir",
                        type=str,
                        default="/tmp/",
                        help="Output directory for LP files")

    parser.add_argument("-n", "--dry_run",
                        action="store_true",
                        help="Dry-run, just print snakemake DAGs but do nothing. Default: false")

    parser.add_argument("-c", "--clusters",
                        nargs="+",
                        type=int,
                        default=[50, 100],
                        help="List of number of clusters. Default: 50 100"

    parser.add_argument("-r", "--time_resolutions",
                        nargs="+",
                        type=validate_time_resolution,
                        default=["1H", "3H", "12H", "24H"],
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

    # Merge the new section into the existing YAML
    original_yaml.update(scenario_section)

    output_file_name = file_name.with_stem(f'{file_name.stem}_{number_clusters}_{time_resolution}_{planning_horizon}')

    # Write the updated YAML to a file
    with open(output_file_name, "w") as file:
        yaml_loader.dump(original_yaml, file)

    return output_file_name


def run_snakemake_command(command: str, capture_output: bool = True) -> subprocess.CompletedProcess:
    """
    Execute a Snakemake command and handle its output and potential errors.

    Parameters
    ----------
    command : str
        The full Snakemake command to be executed
    capture_output : bool, optional
        Whether to capture and log command output (default is True)

    Returns
    -------
    subprocess.CompletedProcess
        The completed process with run information

    Raises
    ------
    subprocess.CalledProcessError
        If the Snakemake command fails to execute successfully

    Examples
    --------
    >>> result = run_snakemake_command("snakemake -call solve_elec_networks")
    """
    try:
        # Split the command to handle shell=False for better security
        cmd_parts = command.split()

        # Run Snakemake command
        result = subprocess.run(
            cmd_parts,
            check=True,  # Raise exception on non-zero exit
            capture_output=capture_output,  # Optionally capture output
            text=True  # Return strings instead of bytes
        )

        # Conditionally print output for logging
        if capture_output:
            if result.stdout:
                print("Snakemake stdout:")
                print(result.stdout)

            if result.stderr:
                print("Snakemake stderr:")
                print(result.stderr)

        return result

    except subprocess.CalledProcessError as e:
        # Detailed error handling with informative message
        error_msg = (
            f"Snakemake command failed:\n"
            f"Command: {command}\n"
            f"Return Code: {e.returncode}\n"
            f"STDOUT: {e.stdout}\n"
            f"STDERR: {e.stderr}"
        )
        raise RuntimeError(error_msg) from e


def run_benchmark(
    name_of_benchmark: str,
    config_file: pathlib.Path,
    n_c: str,
    time_res: str,
    p_hor: str,
    dry_run_flag: bool
) -> None:
    """
    Run specific Snakemake benchmarks based on benchmark name and configuration.

    Parameters
    ----------
    name_of_benchmark : str
        Name of the benchmark to run
    config_file : pathlib.Path
        Configuration YAML file
    n_c : str
        Number of clusters
    time_res : str
        Time resolution
    p_hor : str
        Planning horizon
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
        snakemake_command_network = f"snakemake -call solve_elec_networks --configfile {config_file_name} --latency-wait 60 {dry_run} "
        run_snakemake_command(snakemake_command_network)
        snakemake_elec_benchmark = f"snakemake -call results/networks/base_s_{n_c}_elec_{time_res}_{p_hor}_op --configfile {config_file_name} {dry_run}"
        run_snakemake_command(snakemake_elec_benchmark)
    elif name_of_benchmark == "pypsa-eur-sec":
        snakemake_sec_benchmark = f"snakemake -call solve_sector_networks --configfile {config_file_name} {dry_run}"
        run_snakemake_command(snakemake_sec_benchmark)
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
                output_yaml_file_name = add_scenario_section(yaml_file_name, n_clusters, t_res, p_horizon)
                run_benchmark(input_args.benchmark_name, output_yaml_file_name, n_clusters, t_res, p_horizon, input_args.dry_run)
                if input_args.remove_configs:
                    output_yaml_file_name.unlink(missing_ok=True)
