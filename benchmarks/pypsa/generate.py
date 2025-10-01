import argparse
import pathlib
import re
import typing

import yaml
import ruamel.yaml


DEFAULT_BENCHMARKS = [
    "pypsa-eur-elec-trex",
    "pypsa-eur-elec-dfp",
    "pypsa-eur-elec-ucconv",
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
        "pypsa-eur-elec-trex": [
            "pypsa-eur-elec-trex_copt.yaml",
            "pypsa-eur-elec-trex_vopt.yaml",
            "pypsa-eur-elec-trex_vopt-dfp.yaml",
            "pypsa-eur-elec-trex_copt-dfp.yaml",
            "pypsa-eur-elec-trex_vopt-ucconv.yaml",
            "pypsa-eur-elec-trex_copt-ucconv.yaml"
        ],
        "pypsa-eur-elec-dfp": [
            "pypsa-eur-elec-dfp.yaml",
        ],
        "pypsa-eur-elec-ucconv": [
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
                        default="pypsa-eur-elec-trex",
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
                        default=list(range(2, 11)),  # Default: 2 3 ... 10
                        help="List of number of clusters. Default: 2 3 ... 10")

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


def add_scenario_section(file_name: pathlib.Path, number_clusters: str, time_resolution: str) -> pathlib.Path:
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
            "planning_horizons": 2050
        }
    }

    # Merge the new section into the existing YAML
    original_yaml.update(scenario_section)

    output_file_name = file_name.with_stem(f'{file_name.stem}_{number_clusters}_{time_resolution}')

    # Write the updated YAML to a file
    with open(output_file_name, "w") as file:
        yaml_loader.dump(original_yaml, file)

    return output_file_name


if __name__ == "__main__":

    # Parse input arguments
    input_args = parse_input_arguments()

    # Select yaml files based on benchmark name
    list_yamls = select_yaml_files(input_args.benchmark_name)

    # Generate the yaml files
    for yaml_file_name in list_yamls:
        for n_clusters in input_args.clusters:
            for t_res in input_args.time_resolutions:
                output_yaml_file_name = add_scenario_section(yaml_file_name, n_clusters, t_res)

                if input_args.remove_configs:
                    output_yaml_file_name.unlink(missing_ok=True)
