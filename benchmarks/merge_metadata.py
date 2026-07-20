#!/usr/bin/env python3
"""
Merge per-contributor benchmark metadata files into results/metadata.yaml.

Scans every `[Mm]etadata*.yaml` file under `benchmarks/`, validates each
instance entry against the small set of strictly-required fields (see
`REQUIRED_INSTANCE_FIELDS`), and writes the combined result to
`results/metadata.yaml`. Everything beyond the required fields (calculated
stats, optional descriptive/taxonomy fields) is passed through unchanged.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, MutableMapping, Optional

import yaml

YamlMap = MutableMapping[str, Any]

# Fields every instance entry must have at submission time. Everything else
# (calculated stats, taxonomy fields, temporal/geographic scope, etc.) is
# optional and may be filled in later.
REQUIRED_INSTANCE_FIELDS = [
    "Short description",
    "Contributor(s)/Source",
    "License",
    "URL",
]


class BlankNoneDumper(yaml.Dumper):
    """YAML dumper that renders `None` values as a blank scalar instead of `null`."""

    def represent_none(self, _: Any) -> yaml.Node:
        return self.represent_scalar("tag:yaml.org,2002:null", "")


def validate_instance_entry(
    instance_name: str, instance_info: Any, file_path: Path
) -> bool:
    """
    Validate that an instance entry has all required fields.

    Parameters
    ----------
    instance_name : str
        Name (Problem ID) of the instance.
    instance_info : Any
        Parsed YAML value for the instance; expected to be a dict.
    file_path : Path
        Path to the file being processed, used for error reporting.

    Returns
    -------
    bool
        True if the entry is valid, False otherwise.
    """
    if not isinstance(instance_info, dict):
        print(f"ERROR in {file_path}: Instance '{instance_name}' is not a dictionary")
        return False

    missing_fields = [
        field for field in REQUIRED_INSTANCE_FIELDS if field not in instance_info
    ]
    if missing_fields:
        print(
            f"ERROR in {file_path}: Instance '{instance_name}' missing required "
            f"fields: {missing_fields}"
        )
        return False

    # A "Realistic" instance must explain why it's considered realistic.
    realistic = instance_info.get("Realistic", False)
    if realistic is True:
        realistic_motivation = instance_info.get("Realistic motivation", "")
        if (
            not realistic_motivation
            or not isinstance(realistic_motivation, str)
            or realistic_motivation.strip() == ""
        ):
            print(
                f"ERROR in {file_path}: Instance '{instance_name}' has "
                "Realistic=true but missing, empty, or placeholder "
                "'Realistic motivation'"
            )
            return False

    return True


def process_yaml_file(
    file_path: Path, unified_metadata: YamlMap, skip_validation: bool
) -> None:
    """
    Merge a single metadata YAML file's instances into `unified_metadata`.

    Parameters
    ----------
    file_path : Path
        Path to a `[Mm]etadata*.yaml` file.
    unified_metadata : dict
        Accumulator dict, updated in place with validated instance entries.
    skip_validation : bool
        If True, entries are merged without required-field validation.
    """
    if file_path.stat().st_size == 0:
        print(f"Skipping empty file: {file_path}")
        return

    try:
        with open(file_path, "r") as file:
            yaml_data = yaml.safe_load(file)
    except yaml.YAMLError as exc:
        print(f"Error parsing YAML file {file_path}: {exc}")
        return

    if not yaml_data:
        print(f"Skipping file with no content: {file_path}")
        return

    if "instances" not in yaml_data:
        print(f"No 'instances' section found in: {file_path}")
        return

    for instance_name, instance_info in yaml_data["instances"].items():
        if not skip_validation and not validate_instance_entry(
            instance_name, instance_info, file_path
        ):
            print(f"Skipping invalid instance '{instance_name}' from {file_path}")
            continue

        if instance_name in unified_metadata:
            print(
                f"WARNING: Duplicate instance name '{instance_name}' found in "
                f"{file_path}. Overwriting previous entry."
            )
        unified_metadata[instance_name] = instance_info


def iter_metadata_files(benchmarks_dir: Path) -> list[Path]:
    """
    List all instance metadata YAML files under `benchmarks_dir`.

    Parameters
    ----------
    benchmarks_dir : Path
        Root directory to search recursively.

    Returns
    -------
    list[Path]
        Sorted metadata file paths, excluding the schema file itself.
    """
    return [
        p
        for p in sorted(benchmarks_dir.rglob("[Mm]etadata*.yaml"))
        if p.name != "metadata_schema.yaml"
    ]


def write_merged_metadata(unified_metadata: YamlMap, results_file: Path) -> None:
    """
    Write the unified metadata dict to `results_file` as `{"instances": ...}`.

    Parameters
    ----------
    unified_metadata : dict
        Combined instance entries keyed by instance name.
    results_file : Path
        Destination YAML file path.
    """
    yaml.add_representer(
        type(None), BlankNoneDumper.represent_none, Dumper=BlankNoneDumper
    )
    results_file.parent.mkdir(parents=True, exist_ok=True)
    with open(results_file, "w") as output_file:
        yaml.dump(
            {"instances": unified_metadata},
            output_file,
            sort_keys=False,
            default_flow_style=False,
            Dumper=BlankNoneDumper,
        )


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    """
    Parse CLI arguments.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments. Defaults to sys.argv parsing.

    Returns
    -------
    argparse.Namespace
        Parsed args.
    """
    parser = argparse.ArgumentParser(
        description="Merge metadata YAML files into a single file"
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip validation of instance entries (default: validation enabled)",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    """
    CLI entry point: merge all benchmark metadata files into results/metadata.yaml.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments.

    Returns
    -------
    int
        Exit code: 0 on success, 1 if the benchmarks directory is missing.
    """
    args = parse_args(argv)

    base_dir = Path(__file__).parent.parent
    benchmarks_dir = base_dir / "benchmarks"
    results_file = base_dir / "results" / "metadata.yaml"

    if not benchmarks_dir.exists():
        print(f"Benchmarks directory not found: {benchmarks_dir}")
        return 1

    unified_metadata: YamlMap = {}
    for file_path in iter_metadata_files(benchmarks_dir):
        process_yaml_file(file_path, unified_metadata, args.skip_validation)

    write_merged_metadata(unified_metadata, results_file)

    print(f"Processed {len(unified_metadata)} entries.")
    print(
        "Validation was skipped."
        if args.skip_validation
        else "Validation was enabled."
    )
    print(f"Unified metadata has been written to {results_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
