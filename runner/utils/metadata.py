"""Load benchmark problem metadata and resolve it into runnable problems.

Split out on its own (rather than living in `campaign.py`) because it's read
by both the CLI/orchestrator and the campaign-allocation code, and is a
prime unit-test target: the flat "problems" schema shared by both metadata
files and campaign-generated run configs (see `load_problems`), and
missing-file errors.
"""

from pathlib import Path
from typing import Any

import pandas as pd
import yaml

from .cloud import download_benchmark_file


def load_problem_metadata(
    metadata_file: str = "../results/metadata.yaml",
) -> pd.DataFrame:
    """Create a problem DataFrame from the metadata.yaml file.

    Each problem under the top-level "problems" map becomes one row, with a
    "Problem" column set to its problem ID, for downstream VM-allocation
    code (`campaign.allocate_problems`) to split across VMs.

    Parameters
    ----------
    metadata_file : str, optional
        Path to the unified metadata YAML file (see
        `benchmarks/merge_metadata.py`).

    Returns
    -------
    pd.DataFrame
        One row per problem, indexed by "Problem" (the problem ID).
    """
    with open(Path(metadata_file), "r") as f:
        metadata = yaml.safe_load(f)
    ignore_keys = {"Short description", "Realistic motivation"}
    rows = []
    for problem_id, problem_data in metadata["problems"].items():
        attrs = {k: v for k, v in problem_data.items() if k not in ignore_keys}
        rows.append({"Problem": problem_id, **attrs})
    problems_df = pd.DataFrame(rows)
    problems_df.index = problems_df["Problem"]
    return problems_df


def load_problems(
    problems_yaml_path: str | Path,
    problems_folder: Path,
    size_categories: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Load a benchmark run config YAML into a flat list of runnable problems.

    A run config YAML has a top-level "problems" map, each entry a
    standalone problem (matching `results/metadata.yaml`'s own schema, e.g.
    `results/metadata_subset.yaml`) -- the same shape `campaign.
    allocate_problems` produces for VM/local runs, so this one loader
    handles both metadata files and campaign-generated run configs. There's
    no separate multi-instance/grouped schema to support: metadata.yaml has
    been flattened to one problem per model+size combination since #481, so
    every problem here is already a single, specific instance.

    Parameters
    ----------
    problems_yaml_path : str | Path
        Path to the benchmark run config YAML.
    problems_folder : Path
        Local directory to download URL-sourced problem files into (files
        already present are not re-downloaded, see
        `cloud.download_benchmark_file`).
    size_categories : list[str], optional
        If given, only problems whose "Size" is in this list are included.

    Returns
    -------
    list[dict[str, Any]]
        One dict per problem, each with keys `problem_id`, `size_category`,
        `class`, `path` (a local `Path` to the problem file), and
        `timeout_seconds` (from the YAML's top-level `timeout_seconds`, or
        None).

    Raises
    ------
    FileNotFoundError
        If a problem's "Path" entry doesn't exist on disk.
    ValueError
        If a problem has neither a "Path" nor a "URL" entry.
    """
    with open(problems_yaml_path, "r") as file:
        yaml_content = yaml.safe_load(file)
        problems_info = yaml_content["problems"]
        # Read timeout from top-level YAML if present
        yaml_timeout_seconds = yaml_content.get("timeout_seconds")

    problems = []
    for problem_id, problem_data in problems_info.items():
        # Filter to the desired size_categories
        if (
            size_categories is not None
            and problem_data.get("Size") not in size_categories
        ):
            continue

        # Determine the file path to use for the problem
        if "Path" in problem_data:
            problem_path = Path(problem_data["Path"])
            if not problem_path.exists():
                raise FileNotFoundError(
                    f"File specified in 'Path' does not exist: {problem_path}"
                )
        elif "URL" in problem_data:
            # TODO share this code with validate_urls.py
            gz = problem_data["URL"].endswith(".gz")
            base = problem_data["URL"][:-3] if gz else problem_data["URL"]
            ext = base[base.rfind(".") :]
            # If no dot was found, ext will be the full string; make it empty instead
            if "." not in ext:
                ext = ""
            ext += ".gz" if gz else ""
            problem_path = problems_folder / f"{problem_id}{ext}"
            download_benchmark_file(problem_data["URL"], problem_path)

            # Gzip files are unzipped by the above function, so update path accordingly
            if problem_path.suffix == ".gz":
                problem_path = problem_path.with_suffix("")
        else:
            raise ValueError("No valid 'Path' or 'URL' found for problem entry.")
        problems.append(
            {
                "problem_id": problem_id,
                "size_category": problem_data.get("Size"),
                "class": problem_data.get("Problem class"),
                "path": problem_path,
                "timeout_seconds": yaml_timeout_seconds,
            }
        )

    return problems
