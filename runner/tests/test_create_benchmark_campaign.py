"""Tests for benchmarks/create_benchmark_campaign.py's config handling: the
shipped benchmarks/config.campaign.default.yaml must keep matching the
script's current selection schema and the repo's metadata/solver config.
"""

import argparse
import importlib.util
from pathlib import Path

import pytest
import yaml

from runner.utils import config

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_CONFIG = _REPO_ROOT / "benchmarks" / "config.campaign.default.yaml"

_spec = importlib.util.spec_from_file_location(
    "create_benchmark_campaign",
    _REPO_ROOT / "benchmarks" / "create_benchmark_campaign.py",
)
create_benchmark_campaign = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(create_benchmark_campaign)


@pytest.fixture
def default_args():
    defaults = create_benchmark_campaign.flatten_config(
        create_benchmark_campaign.load_configfile(str(_DEFAULT_CONFIG))
    )
    return create_benchmark_campaign.merge_cli_with_defaults(
        argparse.Namespace(), defaults
    )


def test_shipped_config_has_a_valid_selection(default_args):
    create_benchmark_campaign.validate_selection_args(default_args)


def test_shipped_config_selects_existing_problems(default_args):
    with open(_REPO_ROOT / "results" / "metadata.yaml") as f:
        problems = yaml.safe_load(f)["problems"]
    assert set(default_args.problem) <= problems.keys()


def test_shipped_config_uses_registered_solver_configurations(default_args):
    registered = config.load_solver_configurations()["configurations"]
    assert set(default_args.solver_configurations) <= registered.keys()


def test_shipped_config_uses_registered_years(default_args):
    registered_years = {
        str(entry["year"])
        for versions in config.load_solver_registry()["solvers"].values()
        for entry in versions.values()
    }
    assert {str(year) for year in default_args.years} <= registered_years


@pytest.mark.parametrize(
    "stale_config",
    [
        {"selection": {"benchmark": ["pypsa-de-elec"]}},
        {"allocation": {"solvers": ["highs"]}},
        {"target": "local", "unknown": 1},
    ],
)
def test_unknown_keys_are_rejected(stale_config):
    with pytest.raises(ValueError, match="Unknown campaign config key"):
        create_benchmark_campaign.flatten_config(stale_config)
