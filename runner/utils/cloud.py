"""Move files between this machine and cloud storage/VMs: pulling
in-progress results off benchmark VMs, and downloading benchmark problem
files from GCS or plain HTTP(S) URLs.
"""

import gzip
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

from .monitor import get_running_instances


def fetch_results_from_instance(
    instance: str, output_dir: str = "../results/partial-results"
) -> None:
    """SCP a benchmark VM's results CSV to `output_dir`.

    Parameters
    ----------
    instance : str
        `"<name> <zone>"`, as returned by `monitor.get_running_instances`.
    output_dir : str, optional
        Local directory to copy the results file into, as
        `<output_dir>/<name>.csv`.
    """
    # TODO use Path for output_dir
    name, zone = instance.split()
    result = None
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "scp",
                "--zone",
                zone,
                f"{name}:/solver-benchmark/results/benchmark_results.csv",
                f"{output_dir}/{name}.csv",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        result.check_returncode()
        return
    except subprocess.CalledProcessError as e:
        print(f"{name}: Error - {e}")
        print(result.stdout if result else "")
        print(result.stderr if result else "")


def fetch_all_partial_results(output_dir: str = "../results/partial-results") -> None:
    """Fetch in-progress results from every running benchmark VM, in parallel.

    Clears `output_dir` first, then SCPs each `benchmark-instance*` VM's
    current results CSV into it (see `fetch_results_from_instance`).

    Parameters
    ----------
    output_dir : str, optional
        Local directory to clear and re-populate with one CSV per VM.
    """
    # Create and clear the directory if required
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    for f in output_path.glob("*.csv"):
        f.unlink()
    print(f"Cleared {output_path}")

    instances = [
        i for i in get_running_instances() if i.startswith("benchmark-instance")
    ]
    print(f"There are {len(instances)} running VMs. Fetching results from: ", end="")

    # Use ThreadPoolExecutor to fetch results in parallel
    with ThreadPoolExecutor() as executor:
        future_to_instance = {
            executor.submit(fetch_results_from_instance, instance, output_dir): instance
            for instance in instances
        }

        for future in as_completed(future_to_instance):
            instance = future_to_instance[future]
            try:
                future.result()
                print(instance, end=" ")
            except Exception as e:
                print(f"{instance}: Exception - {e}")
    print("Done.")


def download_benchmark_file(url: str, dest_path: Path) -> None:
    """Download a benchmark problem file, unless it's already present locally.

    Parameters
    ----------
    url : str
        Where to download from. A `gs://` URL is fetched with `gsutil`
        (requires authentication); anything else is fetched over HTTP(S)
        with `requests`.
    dest_path : Path
        Where to save the file. If it ends in `.gz`, the downloaded file is
        gunzipped afterward and the compressed copy removed, so callers
        should use the *uncompressed* path (`dest_path` with `.gz` stripped)
        to refer to the final file.

    Notes
    -----
    Skips the download entirely if the uncompressed destination already
    exists, so repeated runs don't re-fetch the same file.
    """
    # Ensure the destination folder exists
    os.makedirs(dest_path.parent, exist_ok=True)

    # If dest_path ends with .gz, prepare for the uncompressed version
    if dest_path.suffix == ".gz":
        uncompressed_dest_path = dest_path.with_suffix("")
    else:
        uncompressed_dest_path = dest_path

    if os.path.exists(uncompressed_dest_path):
        print(f"File already exists at {uncompressed_dest_path}. Skipping download.")
        return

    if url.startswith("gs://"):
        # GCS file, so download using gsutil
        print(f"Downloading {url} to {dest_path} using gsutil...", end="")
        cmd = ["gsutil", "cp", url, dest_path]
        _result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("done.")
    else:
        # Perform the download with streaming to handle large files
        print(f"Downloading {url} to {dest_path}...", end="")
        with requests.get(url, stream=True) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("done.")

    if dest_path.suffix == ".gz":
        print(f"Unzipping {dest_path}...")
        with gzip.open(dest_path, "rb") as gz_file:
            uncompressed_file_path = dest_path.with_suffix("")
            with open(uncompressed_file_path, "wb") as uncompressed_file:
                shutil.copyfileobj(gz_file, uncompressed_file)
        os.remove(dest_path)
        print(f"Unzipped to {uncompressed_file_path}.")
