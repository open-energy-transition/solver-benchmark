"""Estimate the compute cost of a benchmark campaign before it is created.

A campaign runs, on each VM, every solver configuration and year of the VM's
YAML that is registered (`runner/config/solvers.yaml`) and eligible
(`runner/config/eligibility_rules.yaml`) for each of its problems, one after
another. The estimate counts these runs and gives each an expected run time
from the past results in `results/benchmark_results.csv`, and a worst case in
which every run hits its timeout. VM prices, disk cost and setup time come
from `runner/config/vm_costs.yaml`.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd
import yaml

from . import config, env

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_VM_COSTS_PATH = _REPO_ROOT / "runner" / "config" / "vm_costs.yaml"
_RESULTS_PATH = _REPO_ROOT / "results" / "benchmark_results.csv"

_TIMED_OUT_STATUSES = {"TO", "OOM"}

# Fewest past runs an average share of the timeout is taken from
_MIN_SIMILAR_RUNS = 10


@dataclass
class VmEstimate:
    """The runs, hours and hourly cost of one VM of a campaign.

    Its hours include its setup time, and its hourly cost includes its disk;
    `hourly_cost` is None for a machine type without a price.
    """

    machine_type: str
    zone: str
    runs: int
    runs_with_history: int
    expected_hours: float
    worst_hours: float
    hourly_cost: float | None


@dataclass
class CampaignEstimate:
    """The estimated VM-hours and cost of a campaign."""

    vms: list[VmEstimate]
    region: str
    checked_on: str

    @property
    def runs(self) -> int:
        """Number of runs of all VMs."""
        return sum(vm.runs for vm in self.vms)

    @property
    def runs_with_history(self) -> int:
        """Number of runs whose expected time comes from the same past run."""
        return sum(vm.runs_with_history for vm in self.vms)

    @property
    def expected_hours(self) -> float:
        """Expected VM-hours of all VMs."""
        return sum(vm.expected_hours for vm in self.vms)

    @property
    def worst_hours(self) -> float:
        """VM-hours of all VMs if every run hits its timeout."""
        return sum(vm.worst_hours for vm in self.vms)

    @property
    def expected_cost(self) -> float:
        """Expected cost in USD of the VMs with a price."""
        return sum(vm.expected_hours * (vm.hourly_cost or 0) for vm in self.vms)

    @property
    def worst_cost(self) -> float:
        """Cost in USD of the VMs with a price if every run hits its timeout."""
        return sum(vm.worst_hours * (vm.hourly_cost or 0) for vm in self.vms)

    @property
    def unpriced_machine_types(self) -> list[str]:
        """Machine types of the campaign without a price."""
        return sorted({vm.machine_type for vm in self.vms if vm.hourly_cost is None})


def load_vm_costs(path: Path = _VM_COSTS_PATH) -> dict:
    """Load the VM prices, disk cost and setup time.

    Parameters
    ----------
    path : Path, optional
        The YAML file, `runner/config/vm_costs.yaml` by default.

    Returns
    -------
    dict
        Its `region`, `checked_on`, `machine_types` (machine type to hourly
        price), `disk_per_hour` and `setup_hours_per_vm`.
    """
    with path.open() as f:
        return yaml.safe_load(f)


def load_past_runs(results_csv: Path, metadata: pd.DataFrame) -> pd.DataFrame:
    """Load the past runs, with the share of its timeout each one used.

    Parameters
    ----------
    results_csv : Path
        The benchmark results, `results/benchmark_results.csv` by default.
    metadata : pd.DataFrame
        Problem metadata indexed by problem ID, with "Size" and "Problem
        class" columns, as returned by `metadata.load_problem_metadata`.

    Returns
    -------
    pd.DataFrame
        One row per problem, solver and solver version, from its latest run:
        "Problem", "Solver", "Solver Version", "Size", "Problem class",
        "Runtime (s)" (None if the run timed out or ran out of memory) and
        "Share of timeout". Empty if `results_csv` doesn't exist.

    Notes
    -----
    A run that timed out, ran out of memory or has no runtime counts as using
    its whole timeout.
    """
    columns = [
        "Problem",
        "Solver",
        "Solver Version",
        "Size",
        "Problem class",
        "Runtime (s)",
        "Share of timeout",
    ]
    if not results_csv.exists():
        return pd.DataFrame(columns=columns)

    results = pd.read_csv(results_csv, dtype={"Solver Version": str})
    results["Problem"] = results["Benchmark"] + "-" + results["Size"].astype(str)
    results = (
        results.sort_values("Timestamp")
        .groupby(["Problem", "Solver", "Solver Version"])
        .tail(1)
    )
    timed_out = (
        results["Status"].isin(_TIMED_OUT_STATUSES) | results["Runtime (s)"].isna()
    )
    results["Runtime (s)"] = results["Runtime (s)"].where(~timed_out)
    results["Share of timeout"] = (
        (results["Runtime (s)"] / results["Timeout"]).fillna(1.0).clip(upper=1.0)
    )
    results["Size"] = results["Problem"].map(metadata["Size"])
    results["Problem class"] = results["Problem"].map(metadata["Problem class"])
    return results[columns].reset_index(drop=True)


def _result_names(solver_configuration: str) -> set[str]:
    """Return the names a configuration's runs have in the results.

    Notes
    -----
    Results name the runs of a solver's default configuration either after
    the configuration ("highs-default") or after the solver ("highs").
    """
    names = {solver_configuration}
    configuration = config.get_solver_configuration(solver_configuration)
    if configuration:
        package = configuration["solver_package"]
        if solver_configuration == f"{package}-default":
            names.add(package)
    return names


def estimate_run_hours(
    past_runs: pd.DataFrame,
    problem_id: str,
    size: str,
    problem_class: str,
    solver_configuration: str,
    solver_version: str,
    timeout_seconds: float,
) -> tuple[float, bool]:
    """Estimate the hours one run takes.

    Parameters
    ----------
    past_runs : pd.DataFrame
        Past runs, as returned by `load_past_runs`.
    problem_id, size, problem_class : str
        The problem, its size category and its problem class.
    solver_configuration, solver_version : str
        The solver configuration and the version it runs.
    timeout_seconds : float
        The timeout of the run.

    Returns
    -------
    tuple[float, bool]
        The expected hours, and whether a past run of the same problem and
        solver version gave them.

    Notes
    -----
    The expected time is, in order of preference:

    1. the time of the latest past run of the same problem and solver
       version, or the whole timeout if that run timed out;
    2. the average share of the timeout that the solver used, over all its
       versions, on past runs of problems of the same size category and
       problem class, or of the same size category, whichever first has at
       least 10 runs;
    3. the whole timeout.
    """
    solver_runs = past_runs[
        past_runs["Solver"].isin(_result_names(solver_configuration))
    ]

    same_run = solver_runs[
        (solver_runs["Problem"] == problem_id)
        & (solver_runs["Solver Version"] == str(solver_version))
    ]
    if not same_run.empty:
        runtime = same_run["Runtime (s)"].iloc[-1]
        seconds = timeout_seconds if pd.isna(runtime) else min(runtime, timeout_seconds)
        return seconds / 3600, True

    same_size = solver_runs[solver_runs["Size"] == size]
    for similar in (same_size[same_size["Problem class"] == problem_class], same_size):
        if len(similar) >= _MIN_SIMILAR_RUNS:
            return similar["Share of timeout"].mean() * timeout_seconds / 3600, False

    return timeout_seconds / 3600, False


def _default_timeout_seconds(size: str) -> int:
    """Return the timeout the runner gives a problem without one in its YAML."""
    return 24 * 60 * 60 if size == "L" else 60 * 60


def estimate_campaign_cost(
    vm_yamls: list[dict],
    metadata: pd.DataFrame,
    results_csv: Path = _RESULTS_PATH,
    vm_costs: dict | None = None,
) -> CampaignEstimate:
    """Estimate the VM-hours and cost of a campaign.

    Parameters
    ----------
    vm_yamls : list[dict]
        One campaign YAML per VM, as returned by `campaign.allocate_problems`.
    metadata : pd.DataFrame
        Problem metadata indexed by problem ID, as returned by
        `metadata.load_problem_metadata`, to find the size category and
        problem class of past runs.
    results_csv : Path, optional
        The past results, `results/benchmark_results.csv` by default.
    vm_costs : dict, optional
        VM prices, disk cost and setup time, as returned by `load_vm_costs`.
        Defaults to `runner/config/vm_costs.yaml`.

    Returns
    -------
    CampaignEstimate
        The runs, hours and cost of each VM.

    Notes
    -----
    A VM without a `solver_configuration` runs the default configurations
    of `runner/config/solver_configurations.yaml`. Each VM's hours include
    its setup time.
    """
    vm_costs = vm_costs or load_vm_costs()
    past_runs = load_past_runs(results_csv, metadata)
    prices = vm_costs["machine_types"]

    vms = []
    for vm_yaml in vm_yamls:
        configurations = (
            str(vm_yaml.get("solver_configuration") or "").split()
            or config.get_default_configurations()
        )
        years = [str(year) for year in vm_yaml.get("years", [])]
        versions = {
            year: env.get_registered_solver_versions(configurations, year)
            for year in years
        }

        runs = runs_with_history = 0
        expected_hours = worst_hours = vm_costs["setup_hours_per_vm"]
        for problem_id, problem in vm_yaml["problems"].items():
            size, problem_class = problem["Size"], problem["Problem class"]
            timeout_seconds = vm_yaml.get(
                "timeout_seconds"
            ) or _default_timeout_seconds(size)
            for year in years:
                for configuration in configurations:
                    version = versions[year].get(configuration)
                    if not version or not config.is_solver_eligible(
                        configuration,
                        year,
                        size_category=size,
                        problem_class=problem_class,
                    ):
                        continue
                    hours, from_history = estimate_run_hours(
                        past_runs,
                        problem_id,
                        size,
                        problem_class,
                        configuration,
                        version["version"],
                        timeout_seconds,
                    )
                    runs += 1
                    runs_with_history += from_history
                    expected_hours += hours
                    worst_hours += timeout_seconds / 3600

        machine_type = vm_yaml["machine-type"]
        price = prices.get(machine_type)
        vms.append(
            VmEstimate(
                machine_type=machine_type,
                zone=vm_yaml.get("zone", ""),
                runs=runs,
                runs_with_history=runs_with_history,
                expected_hours=expected_hours,
                worst_hours=worst_hours,
                hourly_cost=None
                if price is None
                else price + vm_costs["disk_per_hour"],
            )
        )

    return CampaignEstimate(
        vms=vms,
        region=vm_costs["region"],
        checked_on=str(vm_costs["checked_on"]),
    )


def _usd(amount: float) -> str:
    """Format an amount in USD, with cents below $100."""
    return f"${amount:,.0f}" if amount >= 100 else f"${amount:,.2f}"


def _hours(hours: float) -> str:
    """Format a number of hours, with a decimal below 100."""
    return f"{hours:,.0f}" if hours >= 100 else f"{hours:,.1f}"


def format_estimate(estimate: CampaignEstimate) -> str:
    """Format a campaign's estimate for the terminal.

    Parameters
    ----------
    estimate : CampaignEstimate
        The estimate, as returned by `estimate_campaign_cost`.

    Returns
    -------
    str
        The runs, VM-hours, cost and longest VM, in total and per machine
        type, with the region and date of the prices.
    """
    lines = [
        "\nCost estimate",
        "=============",
        f"Runs:                {estimate.runs:,} ({estimate.runs_with_history:,} "
        "with a past run of the same problem and solver version)",
        f"VM-hours:            {_hours(estimate.expected_hours)} expected, "
        f"{_hours(estimate.worst_hours)} if every run hits its timeout",
        f"Cost:                {_usd(estimate.expected_cost)} expected, "
        f"{_usd(estimate.worst_cost)} if every run hits its timeout",
    ]
    if estimate.vms:
        longest_expected = max(vm.expected_hours for vm in estimate.vms)
        longest_worst = max(vm.worst_hours for vm in estimate.vms)
        lines.append(
            f"Longest VM:          {_hours(longest_expected)} h expected, "
            f"{_hours(longest_worst)} h if every run hits its timeout"
        )
    lines.append(
        f"Prices:              on-demand in {estimate.region}, "
        f"checked on {estimate.checked_on}"
    )

    lines.append("\nBy machine type:")
    for machine_type in sorted({vm.machine_type for vm in estimate.vms}):
        vms = [vm for vm in estimate.vms if vm.machine_type == machine_type]
        hourly_cost = vms[0].hourly_cost
        cost = (
            "no price in runner/config/vm_costs.yaml"
            if hourly_cost is None
            else f"{_usd(sum(vm.expected_hours for vm in vms) * hourly_cost)} "
            f"expected, {_usd(sum(vm.worst_hours for vm in vms) * hourly_cost)} "
            "at most"
        )
        lines.append(
            f"  {machine_type}: {len(vms)} VM(s), "
            f"{sum(vm.runs for vm in vms):,} runs, {cost}"
        )

    other_regions = [
        vm for vm in estimate.vms if not vm.zone.startswith(f"{estimate.region}-")
    ]
    if other_regions:
        lines.append(
            f"\nNOTE: {len(other_regions)} VM(s) are outside {estimate.region}; "
            "prices in other regions can be up to about 20% higher."
        )
    if estimate.unpriced_machine_types:
        lines.append(
            "\nWARNING: the cost leaves out the VMs of "
            + ", ".join(estimate.unpriced_machine_types)
            + ", which have no price in runner/config/vm_costs.yaml."
        )
    return "\n".join(lines)
