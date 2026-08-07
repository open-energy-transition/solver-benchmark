"""Run a single solver on a single benchmark problem as a resource-limited
subprocess, and parse back its reported memory usage.

Actually solving happens out-of-process (via `python -m runner.utils.solver`,
see `solver.py`'s own module docstring) so that a solver crash, timeout, or
out-of-memory kill can be observed and recorded as a result rather than
taking down the whole benchmark run.
"""

import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

import psutil

# solver.py uses package-relative imports (`from . import config`), so it
# must be run via `-m`, not as a bare script path -- PYTHONPATH (rather than
# `cwd`) is what makes `runner` resolve as a package regardless of the
# working directory each wrapper in the command below (systemd-run,
# /usr/bin/time, conda run) happens to launch it from.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"


def parse_memory(output: str) -> float:
    """Extract peak memory usage from `/usr/bin/time`'s output.

    Parameters
    ----------
    output : str
        The subprocess's stderr, expected to end with a line containing
        `/usr/bin/time --format "MaxResidentSetSizeKB=%M"`'s output.

    Returns
    -------
    float
        Peak resident set size in MB.

    Raises
    ------
    ValueError
        If the last line of `output` doesn't contain the expected marker.
    """
    line = output.splitlines()[-1]
    if "MaxResidentSetSizeKB=" in line:
        parts = line.strip().split("=")
        max_resident_set_size = parts[-1]
        return float(max_resident_set_size) / 1000  # Convert to MB
    raise ValueError(f"Could not find memory usage in subprocess output:\n{output}")


def _systemd_available() -> bool:
    """Check if systemd is running (not just installed)."""
    return bool(shutil.which("systemd-run") and os.path.isdir("/run/systemd/system"))


def run_solver(
    input_file: str | Path,
    solver_name: str,
    timeout: int,
    solver_version: str,
    env_name: str | None = None,
) -> dict[str, Any]:
    """Run one solver configuration on one problem file, with resource limits.

    Wraps the solve in `/usr/bin/time` (for memory reporting), `timeout`
    (to enforce the time budget), and, where available, `systemd-run
    --scope` with a memory cap (95% of currently available memory) so an
    out-of-memory solver gets killed cleanly instead of triggering the
    system OOM killer.

    Parameters
    ----------
    input_file : str | Path
        Path to the problem file to solve.
    solver_name : str
        The solver configuration to run, e.g. `"highs"` or `"highs-hipo"`.
    timeout : int
        Wall-clock time budget in seconds.
    solver_version : str
        The solver version, passed through to `solver.main` for its output
        filenames and included in the returned metrics' log lookup.
    env_name : str, optional
        If given, run inside this conda environment via `conda run -n
        <env_name>` instead of the current one.

    Returns
    -------
    dict[str, Any]
        Metrics with at least `status` (one of `"ok"`, `"TO"`, `"OOM"`,
        `"ER"`), `condition`, `objective`, `runtime`, `reported_runtime`,
        `duality_gap`, `max_integrality_violation`, `memory` (MB, or None if
        unparseable), and `timeout` (the budget passed in, for reference).
    """
    available_memory_bytes = psutil.virtual_memory().available
    memory_limit_bytes = int(available_memory_bytes * 0.95)
    memory_limit_mb = memory_limit_bytes / (1024 * 1024)

    command = []

    if _systemd_available():
        print(
            f"Setting memory limit to {memory_limit_mb:.2f} MB (95% of available memory)"
        )
        command.append("systemd-run")
        if os.geteuid() != 0:
            command.append("--user")
        command.extend(
            [
                "--scope",
                f"--property=MemoryMax={memory_limit_bytes}",
                "--property=MemorySwapMax=0",
            ]
        )
    else:
        print(
            "WARNING: systemd not available, running without memory limit enforcement"
        )

    command.extend(
        [
            "/usr/bin/time",
            "--format",
            "MaxResidentSetSizeKB=%M",
            "timeout",
            f"{timeout}s",
        ]
    )

    # Use conda run to execute in the solver's env, or plain python for the current env
    if env_name:
        command.extend(["conda", "run", "-n", env_name])

    command.extend(
        [
            "python",
            "-m",
            "runner.utils.solver",
            solver_name,
            str(input_file),
            solver_version,
        ]
    )

    # Prepend (not replace) PYTHONPATH so `runner` resolves as a package --
    # see this module's docstring for why PYTHONPATH rather than `cwd`.
    subprocess_env = dict(os.environ)
    subprocess_env["PYTHONPATH"] = os.pathsep.join(
        [str(_REPO_ROOT), subprocess_env.get("PYTHONPATH", "")]
    )

    # Run the command and capture the output
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
        env=subprocess_env,
    )

    # DEBUG
    if result.stderr:
        print(f"STDERR from {solver_name} on {input_file}:\n{result.stderr}")

    # Append the stderr to the log file
    log_file = _LOGS_DIR / f"{Path(input_file).stem}-{solver_name}-{solver_version}.log"
    if log_file.exists():
        with open(log_file, "a") as f:
            f.write("\nSTDERR:\n")
            f.write(result.stderr)
    else:
        print(f"ERROR: couldn't find log file {log_file}")

    memory = None
    try:
        memory = parse_memory(result.stderr)
    except ValueError:
        print("Failed to parse memory usage from stderr")

    if result.returncode == 124:
        print("TIMEOUT")
        metrics = {
            "status": "TO",
            "condition": "Timeout",
            "objective": None,
            "runtime": timeout,
            "reported_runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    # systemd-run uses sigkill (9) or sigterm (15) to terminate the process and returns 128 + signal exit code
    # subprocess returns -<signal> for signals
    # these things don't seem very portable
    elif result.returncode in (137, 143, -9, -15):
        print("OUT OF MEMORY")
        metrics = {
            "status": "OOM",
            "condition": "Out of Memory",
            "objective": None,
            "runtime": "N/A",
            "reported_runtime": None,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    elif result.returncode != 0:
        print(
            f"ERROR running solver. Return code: {result.returncode}\n",
            f"Stdout:\n{result.stdout}\n",
            f"Stderr:\n{result.stderr}\n",
        )
        # Errors are also said to have run for `timeout`s, so that they appear
        # along with timeouts in charts
        metrics = {
            "status": "ER",
            "condition": "Error",
            "objective": None,
            "runtime": timeout,
            "reported_runtime": timeout,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    else:
        metrics = json.loads(result.stdout.splitlines()[-1])

    if metrics["status"] not in {"ok", "TO", "ER", "OOM"}:
        print(f"WARNING: unknown solver status: {metrics['status']}")

    metrics["memory"] = memory
    metrics["timeout"] = timeout

    return metrics


def get_highs_binary_version() -> str:
    """Get the version of the pre-installed reference HiGHS binary.

    Returns
    -------
    str
        The version string reported by `/opt/highs/bin/highs --version`, or
        `"unknown"` if it can't be determined.
    """
    highs_binary = "/opt/highs/bin/highs"

    try:
        result = subprocess.run(
            [highs_binary, "--version"],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8",
        )

        version_match = re.search(r"HiGHS version (\d+\.\d+\.\d+)", result.stdout)
        if version_match:
            return version_match.group(1)

        return "unknown"
    except Exception as e:
        print(f"Error getting HiGHS binary version: {str(e)}")
        return "unknown"


def run_reference_highs_binary() -> dict[str, Any]:
    """Run a fixed reference benchmark with the pre-installed HiGHS binary.

    Used to normalize results across VMs of possibly-different hardware
    speed: run periodically alongside real benchmarks (see
    `orchestrator`'s `reference_interval`), independent of which solver
    configuration is otherwise being benchmarked.

    Returns
    -------
    dict[str, Any]
        Metrics with `status`, `condition`, `objective`, `runtime`, and
        (on success) `memory` (always `"N/A"`, not measured for this path).
    """
    reference_model = "/benchmark-test-model.lp"
    highs_binary = "/opt/highs/bin/highs"

    command = [
        highs_binary,
        reference_model,
    ]

    # Run the command and capture the output
    start_time = time.perf_counter()
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
        encoding="utf-8",
    )
    runtime = time.perf_counter() - start_time
    if result.returncode != 0:
        print(f"ERROR running solver. Return code:\n{result.returncode}")
        metrics = {
            "status": "ER",
            "condition": "Error",
            "objective": None,
            "runtime": runtime,
            "duality_gap": None,
            "max_integrality_violation": None,
        }
    else:
        # Parse HiGHS output to extract objective value
        objective = None
        for line in result.stdout.splitlines():
            if "Objective value" in line:
                try:
                    objective = float(line.split(":")[-1].strip())
                except (ValueError, IndexError):
                    pass

        metrics = {
            "status": "OK",
            "condition": "Optimal",
            "objective": objective,
            "runtime": runtime,
            "memory": "N/A",
            "duality_gap": None,  # Not available from command line output
            "max_integrality_violation": None,  # Not available from command line output
        }

    return metrics
