"""
Validate and fix benchmark size URLs.

Checks that each size URL filename matches the pattern
    {benchmark-name}-{size-name}.{ext}[.gz]
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
    """Return expected filename preserving extension and optional .gz suffix."""
    gz = current_filename.endswith(".gz")
    base = current_filename[:-3] if gz else current_filename
    ext = base[base.rfind(".") :]
    # If no dot was found, ext will be the full string; make it empty instead
    if "." not in ext:
        ext = ""
    expected = f"{benchmark_name}-{size_name}{ext}"
    if gz:
        expected += ".gz"
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

    changes = []
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

            raw_filename = Path(parsed.path).name
            decoded_filename = unquote(raw_filename)
            expected = derive_expected_filename(bench_name, size_name, decoded_filename)
            encoded_expected = quote(expected, safe="")

            if raw_filename == encoded_expected:
                continue

            new_path_segments = parsed.path.split("/")
            new_path_segments[-1] = encoded_expected
            new_path = "/".join(new_path_segments)
            new_url = urlunparse(parsed._replace(path=new_path))
            changes.append((bench_name, size_name, url, new_url))
            if not dry_run:
                size_entry["URL"] = new_url

    if changes and not dry_run:
        save_yaml(path, data, yaml)
    return [(path, *c) for c in changes]


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

    all_changes = []
    gsutil_commands = []
    for file_path in sorted(benchmarks_dir.rglob(FILE_PATTERN)):
        for change in process_file(file_path, yaml, args.dry_run):
            all_changes.append(change)
            path, bench, size, old_url, new_url = change
            old_parsed = urlparse(old_url)
            new_parsed = urlparse(new_url)
            # Build gsutil mv commands using decoded object names
            old_key = unquote(old_parsed.path.lstrip("/"))
            new_key = unquote(new_parsed.path.lstrip("/"))
            # Only create commands for the expected host
            if old_parsed.netloc == GCS_HOST and new_parsed.netloc == GCS_HOST:
                gsutil_commands.append(
                    f"gsutil mv gs://{old_key.split('/')[0]}/{'/'.join(old_key.split('/')[1:])} gs://{new_key.split('/')[0]}/{'/'.join(new_key.split('/')[1:])}"
                )

    if not all_changes:
        print("All URLs already conform to the naming convention.")
        return

    # print("Non-conforming URLs:")
    # for path, bench, size, old, new in all_changes:
    #     print(f"- {path}: {bench} / {size}\n    old: {old}\n    new: {new}")

    updated = [c for c in all_changes if c]
    print(f"\nUpdated {len(updated)} URLs in metadata files")
    if updated and gsutil_commands:
        print("\nSuggested gsutil rename commands:\n")
        for cmd in gsutil_commands:
            print(cmd)
    if args.dry_run:
        print("\nDry run; no files were modified.")
    else:
        print(
            "\nFiles rewritten. Updated URLs above can be renamed on storage as needed."
        )


if __name__ == "__main__":
    main()
