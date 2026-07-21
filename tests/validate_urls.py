#!/usr/bin/env python3
"""
Validate and fix benchmark instance URLs.

Checks that each instance's URL filename matches the pattern
    {instance-id}.{ext}.gz
where ext is taken from the existing filename extension, and instance-id is
the instance's top-level key in the "instances" map (e.g.
"ethos_fine_europe_60tp-175-720ts"). Outputs the list of non-conforming
entries and rewrites URLs to the expected filename in-place.

Run:
    source venv/bin/activate
    python fix_metadata_urls.py [--dry-run]
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse, urlunparse

from ruamel.yaml import YAML

FILE_PATTERN = "[Mm]etadata*.yaml"

GCS_HOSTS = ["storage.googleapis.com", "storage.cloud.google.com"]
GITHUB_HOSTS = ["raw.githubusercontent.com"]

# Define the directory paths relative to the script location (tests/)
project_root_dir = Path(__file__).parent.parent
benchmarks_dir = project_root_dir / "benchmarks"

RenameOp = tuple[str, str]


def derive_expected_filename(instance_name: str, current_filename: str) -> str:
    """
    Compute the expected gzipped filename for an instance's URL.

    Parameters
    ----------
    instance_name : str
        Instance key (Problem ID) from the "instances" map.
    current_filename : str
        Filename currently referenced by the instance's URL.

    Returns
    -------
    str
        Expected filename, "{instance_name}{ext}.gz", preserving the
        original extension.
    """
    gz = current_filename.endswith(".gz")
    base = current_filename[:-3] if gz else current_filename
    ext = base[base.rfind(".") :]
    # If no dot was found, ext will be the full string; make it empty instead
    if "." not in ext:
        ext = ""
    return f"{instance_name}{ext}.gz"


def load_yaml(path: Path, yaml: YAML) -> Any:
    """
    Load a YAML file's contents.

    Parameters
    ----------
    path : Path
        File to load.
    yaml : ruamel.yaml.YAML
        YAML loader/dumper.

    Returns
    -------
    Any
        Parsed YAML content.

    Raises
    ------
    RuntimeError
        If the file can't be read or parsed.
    """
    try:
        return yaml.load(path.read_text())
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"Failed to load {path}: {exc}") from exc


def save_yaml(path: Path, data: Any, yaml: YAML) -> None:
    """
    Write YAML data back to disk.

    Parameters
    ----------
    path : Path
        Destination file.
    data : Any
        YAML-serializable content.
    yaml : ruamel.yaml.YAML
        YAML loader/dumper.

    Raises
    ------
    RuntimeError
        If the file can't be written.
    """
    try:
        yaml.dump(data, path)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"Failed to write {path}: {exc}") from exc


def process_file(
    path: Path, yaml: YAML, dry_run: bool
) -> tuple[list[RenameOp], list[RenameOp]]:
    """
    Validate and (unless dry_run) fix instance URLs in one metadata file.

    Parameters
    ----------
    path : Path
        Metadata YAML file to process.
    yaml : ruamel.yaml.YAML
        YAML loader/dumper used to read and, if needed, rewrite the file.
    dry_run : bool
        If True, report issues without modifying the file; duplicate
        names/URLs and invalid hosts still exit(1) since those are ambiguous
        to auto-fix.

    Returns
    -------
    tuple[list[tuple[str, str]], list[tuple[str, str]]]
        (to_mv, to_gzip): GCS (path, expected_filename) pairs for files that
        need renaming, and for files that still need gzipping, respectively.
    """
    data = load_yaml(path, yaml)
    if not data or "instances" not in data:
        return [], []

    seen_instance_names: list[str] = []
    seen_urls: list[str] = []
    to_mv: list[RenameOp] = []
    to_gzip: list[RenameOp] = []

    for instance_name, instance_info in (data.get("instances") or {}).items():
        # Instance name uniqueness
        if instance_name in seen_instance_names:
            print(f"ERROR: Duplicate instance name found: {instance_name}")
            if not dry_run:
                exit(1)
        else:
            seen_instance_names.append(instance_name)

        if not isinstance(instance_info, dict):
            continue

        url = instance_info.get("URL")
        if not url:
            continue

        # URL uniqueness globally
        if url in seen_urls:
            print(f"ERROR: Duplicate URL found: {url}")
            if not dry_run:
                exit(1)
        else:
            seen_urls.append(url)

        # Validate host
        parsed = urlparse(url)
        host = parsed.netloc.lower()

        # Normalize old cloud URLs to storage.googleapis.com
        if host == "storage.cloud.google.com":
            parsed = parsed._replace(netloc="storage.googleapis.com")
            host = "storage.googleapis.com"

        # Validate host
        if host not in GCS_HOSTS + GITHUB_HOSTS:
            print(
                f"ERROR: URL uses invalid host {parsed.netloc}, must be one of {GCS_HOSTS + GITHUB_HOSTS}: {url}"
            )
            if not dry_run:
                exit(1)
            continue
        gs_path = unquote("/".join(parsed.path.split("/")[1:]))

        raw_filename = Path(parsed.path).name
        decoded_filename = unquote(raw_filename)
        expected = derive_expected_filename(instance_name, decoded_filename)
        encoded_expected = quote(expected, safe="")

        if host in GCS_HOSTS:
            new_path_segments = [
                "",
                "solver-benchmarks",
                "instances",
                encoded_expected,
            ]
            new_url = urlunparse(parsed._replace(path="/".join(new_path_segments)))
            instance_info["URL"] = new_url
        else:
            # For GitHub URLs, keep as-is
            new_url = url

        # If it needs gzipping:
        if not raw_filename.endswith(".gz"):
            to_gzip.append((gs_path, expected[:-3]))
            continue

        # If it needs moving/renaming:
        if url != new_url:
            to_mv.append((gs_path, expected))

    if len(to_mv) + len(to_gzip) > 0 and not dry_run:
        save_yaml(path, data, yaml)
    return to_mv, to_gzip


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
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
    parser = argparse.ArgumentParser(description="Validate and fix benchmark URLs")
    parser.add_argument(
        "--dry-run", action="store_true", help="Report issues without rewriting files"
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """
    CLI entry point: validate/fix URLs across all benchmark metadata files.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments.
    """
    args = parse_args(argv)

    yaml = YAML()
    yaml.preserve_quotes = True
    # Match original indentation (sequence items flush with parent key) and wide lines
    yaml.indent(mapping=2, sequence=2, offset=0)
    yaml.width = 99999

    mv_commands: list[str] = []
    gzip_commands: list[str] = []
    for file_path in sorted(benchmarks_dir.rglob("metadata.yaml")):
        to_mv, to_gzip = process_file(file_path, yaml, args.dry_run)
        for gs_path, filename in to_mv:
            mv_commands.append(
                f"gsutil mv gs://{gs_path} gs://solver-benchmarks/instances/{filename}"
            )
        for gs_path, filename in to_gzip:
            gzip_commands.append(
                f"gsutil mv gs://{gs_path} /tmp/benchmarks-to-zip/{filename}"
            )

    if len(mv_commands) + len(gzip_commands) == 0:
        print("All URLs already conform to the naming convention.")
        return

    print(f"\nUpdated {len(mv_commands) + len(gzip_commands)} URLs in metadata files")
    print("\nPlease run these commands:\n")
    if mv_commands:
        for cmd in mv_commands:
            print(cmd)
        print()
    if gzip_commands:
        print("mkdir -p /tmp/benchmarks-to-zip")
        for cmd in gzip_commands:
            print(cmd)
        print("find /tmp/benchmarks-to-zip/ -type f | parallel gzip --best")
        print(
            "gsutil -m rsync /tmp/benchmarks-to-zip gs://solver-benchmarks/instances/"
        )

    if args.dry_run:
        print("\nDry run; no files were modified.")
    else:
        print(
            "\nMetadata files rewritten. Run the above commands to rename files on bucket accordingly."
        )


if __name__ == "__main__":
    main()
