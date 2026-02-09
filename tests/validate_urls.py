"""
Validate and fix benchmark size URLs.

Checks that each size URL filename matches the pattern
    {benchmark-name}-{size-name}.{ext}.gz
where ext is taken from the existing filename extension. Outputs the list of
non-conforming entries and rewrites URLs to the expected filename in-place.

Run:
    source venv/bin/activate
    python fix_metadata_urls.py [--dry-run]
"""

from __future__ import annotations

import argparse
from pathlib import Path
from urllib.parse import quote, unquote, urlparse, urlunparse

from ruamel.yaml import YAML

FILE_PATTERN = "[Mm]etadata*.yaml"
GCS_HOST = "storage.googleapis.com"

# Define the directory paths relative to the script location (tests/)
project_root_dir = Path(__file__).parent.parent
benchmarks_dir = project_root_dir / "benchmarks"


def derive_expected_filename(
    benchmark_name: str, size_name: str, current_filename: str
) -> str:
    """Return expected gzipped filename preserving extension."""
    gz = current_filename.endswith(".gz")
    base = current_filename[:-3] if gz else current_filename
    ext = base[base.rfind(".") :]
    # If no dot was found, ext will be the full string; make it empty instead
    if "." not in ext:
        ext = ""
    expected = f"{benchmark_name}-{size_name}{ext}.gz"
    return expected


def load_yaml(path: Path, yaml: YAML):
    try:
        return yaml.load(path.read_text())
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"Failed to load {path}: {exc}") from exc


def save_yaml(path: Path, data, yaml: YAML):
    try:
        yaml.dump(data, path)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"Failed to write {path}: {exc}") from exc


def process_file(path: Path, yaml: YAML, dry_run: bool):
    data = load_yaml(path, yaml)
    if not data or "benchmarks" not in data:
        return []

    to_mv = []
    to_gzip = []
    for bench_name, bench_info in (data.get("benchmarks") or {}).items():
        sizes = bench_info.get("Sizes") or []
        for size_entry in sizes:
            if not isinstance(size_entry, dict):
                continue
            url = size_entry.get("URL")
            size_name = size_entry.get("Name")
            if not url or not size_name:
                continue

            parsed = urlparse(url)
            if parsed.netloc != GCS_HOST:
                continue
            gs_path = "/".join(parsed.path.split("/")[1:])

            raw_filename = Path(parsed.path).name
            decoded_filename = unquote(raw_filename)
            expected = derive_expected_filename(bench_name, size_name, decoded_filename)
            encoded_expected = quote(expected, safe="")

            new_path_segments = ["", "solver-benchmarks", "instances", encoded_expected]
            new_url = urlunparse(parsed._replace(path="/".join(new_path_segments)))
            size_entry["URL"] = new_url

            # If it needs gzipping:
            if not raw_filename.endswith(".gz"):
                to_gzip.append((gs_path, expected))
                continue

            # If it needs moving/renaming:
            if url != new_url:
                to_mv.append((gs_path, expected))

    if len(to_mv) + len(to_gzip) > 0 and not dry_run:
        save_yaml(path, data, yaml)
    return to_mv, to_gzip


def main():
    parser = argparse.ArgumentParser(description="Validate and fix benchmark URLs")
    parser.add_argument(
        "--dry-run", action="store_true", help="Report issues without rewriting files"
    )
    args = parser.parse_args()

    yaml = YAML()
    yaml.preserve_quotes = True
    # Match original indentation (sequence items flush with parent key) and wide lines
    yaml.indent(mapping=2, sequence=2, offset=0)
    yaml.width = 99999

    mv_commands = []
    gzip_commands = []
    for file_path in sorted(benchmarks_dir.rglob(FILE_PATTERN)):
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
    for cmd in mv_commands:
        print(cmd)
    print("\nmkdir -p /tmp/benchmarks-to-zip")
    for cmd in gzip_commands:
        print(cmd)
    print("\nfind /tmp/benchmarks-to-zip/ -type f | parallel -P 20 gzip --best")
    print("gsutil -m rsync /tmp/benchmarks-to-zip gs://solver-benchmarks/instances/")

    if args.dry_run:
        print("\nDry run; no files were modified.")
    else:
        print(
            "\nMetadata files rewritten. Run the above commands to rename files on bucket accordingly."
        )


if __name__ == "__main__":
    main()

# test +
# only mv
# mv + gz
# only gz
