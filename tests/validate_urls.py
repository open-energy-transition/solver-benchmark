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

GCS_HOSTS = ["storage.googleapis.com", "storage.cloud.google.com"]
GITHUB_HOSTS = ["raw.githubusercontent.com"]

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

    seen_bench_names = set()
    seen_urls = set()
    to_mv = []
    to_gzip = []

    for bench_name, bench_info in (data.get("benchmarks") or {}).items():
        # Benchmark name uniqueness
        if bench_name in seen_bench_names:
            print(f"ERROR: Duplicate benchmark name found: {bench_name}")
            if not dry_run:
                exit(1)
        else:
            seen_bench_names.add(bench_name)

        sizes = bench_info.get("Sizes") or []
        seen_size_names_per_bench = set()

        for size_entry in sizes:
            if not isinstance(size_entry, dict):
                continue

            url = size_entry.get("URL")
            size_name = size_entry.get("Name")
            if not url or not size_name:
                continue

            # Size name uniqueness per benchmark
            if size_name in seen_size_names_per_bench:
                print(
                    f"ERROR: Duplicate size name '{size_name}' in benchmark '{bench_name}'"
                )
                if not dry_run:
                    exit(1)
            else:
                seen_size_names_per_bench.add(size_name)

            # URL uniqueness globally
            if url in seen_urls:
                print(f"ERROR: Duplicate URL found: {url}")
                if not dry_run:
                    exit(1)
            else:
                seen_urls.add(url)

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
            expected = derive_expected_filename(bench_name, size_name, decoded_filename)
            encoded_expected = quote(expected, safe="")

            if host in GCS_HOSTS:
                new_path_segments = [
                    "",
                    "solver-benchmarks",
                    "instances",
                    encoded_expected,
                ]
                new_url = urlunparse(parsed._replace(path="/".join(new_path_segments)))
                size_entry["URL"] = new_url
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
