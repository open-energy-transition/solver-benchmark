import argparse
import sys
from typing import List, Optional, Sequence, Union


def parse_arguments(argv: Optional[Sequence[str]] = None) -> int:
    """
    Main function to parse arguments and process benchmark generation.

    Parameters
    ----------
    argv : Optional[Sequence[str]], optional
        Command-line arguments to parse. If None, uses sys.argv[1:].

    Returns
    -------
    int
        Exit status code (0 for success, non-zero for failure)

    Examples
    --------
    >>> parse_arguments(['mybenchmark', '/output/path'])
    Benchmark Name: mybenchmark
    Output Directory: /output/path
    Dry Run: False
    Clusters: [2, 3, 4, 5, 6, 7, 8, 9, 10]
    Time Resolutions: ['1h', '3h', '12h', '24h']
    0
    """

    # Create the parser
    parser = argparse.ArgumentParser(
        description="Generates benchmark sizes and puts LP files in output directory",
        formatter_class=argparse.RawTextHelpFormatter
    )

    # Define arguments
    parser.add_argument("--benchmark_name",
                        help="Name of the benchmark to generate")

    parser.add_argument("--output_dir",
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
                        default=["1h", "3h", "12h", "24h"],
                        help="List of time resolutions. Default: 1h 3h 12h 24h")

    # Parse arguments
    args = parser.parse_args()

    # Your actual implementation would go here
    print(f"Benchmark Name: {args.benchmark_name}")
    print(f"Output Directory: {args.output_dir}")
    print(f"Dry Run: {args.dry_run}")
    print(f"Clusters: {args.clusters}")
    print(f"Time Resolutions: {args.time_resolutions}")


if __name__ == "__main__":
    parse_arguments()
