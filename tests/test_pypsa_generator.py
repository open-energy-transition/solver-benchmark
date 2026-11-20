"""Regression tests for the PyPSA-Eur benchmark generator."""

import importlib.util
from copy import deepcopy
from pathlib import Path

GENERATOR_DIR = Path(__file__).resolve().parents[1] / "benchmarks" / "pypsa"

spec = importlib.util.spec_from_file_location(
    "pypsa_benchmark_generator",
    GENERATOR_DIR / "generate.py",
)
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


def test_all_configurations_are_selected():
    """Check that all benchmark configurations are discovered."""
    electricity = generator.select_yaml_files("pypsa-eur-elec", GENERATOR_DIR)
    sector = generator.select_yaml_files("pypsa-eur-sec", GENERATOR_DIR)

    assert len(electricity) == 12
    assert len(sector) == 3
    assert len(set(electricity + sector)) == 15


def test_configuration_options_match_names():
    """Check consistency between benchmark names and configuration options."""
    for benchmark_name in ["pypsa-eur-elec", "pypsa-eur-sec"]:
        files = generator.select_yaml_files(benchmark_name, GENERATOR_DIR)

        for path in files:
            config = generator.load_yaml(path)
            electricity = config["electricity"]
            conventional = config.get("conventional", {})

            if "trex_copt" in path.name:
                expected_transmission = "copt"
            elif "trex_vopt" in path.name:
                expected_transmission = "vopt"
            else:
                expected_transmission = "v1"

            assert electricity["transmission_limit"] == expected_transmission, path.name
            assert conventional.get("unit_commitment", False) == ("-uc" in path.stem), (
                path.name
            )
            assert conventional.get("dynamic_fuel_price", False) == (
                "-dfp" in path.stem
            ), path.name


def test_recursive_merge_with_deepcopy():
    """Check that benchmark overrides do not modify the base configuration."""
    base = {
        "electricity": {"transmission_limit": "v1"},
        "conventional": {
            "unit_commitment": False,
            "dynamic_fuel_price": False,
        },
        "scenario": {"clusters": [50]},
    }

    original = deepcopy(base)

    uc_config = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-elec-uc.yaml")

    merged = generator.recursive_merge(deepcopy(base), uc_config)

    assert merged["conventional"]["unit_commitment"]

    merged["scenario"]["clusters"] = [100]

    assert base == original

    normal_config = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-elec.yaml")

    normal = generator.recursive_merge(deepcopy(base), normal_config)

    assert not normal["conventional"]["unit_commitment"]
    assert normal["scenario"]["clusters"] == [50]


def test_time_resolution_normalization():
    """Check normalization of temporal resolution arguments."""
    assert generator.validate_time_resolution("3h") == "3H"
    assert generator.validate_time_resolution("168H") == "168H"


def test_build_benchmark_config_isolation():
    """Check independent configurations with the updated PyPSA-Eur schema."""
    base = {
        "planning_horizons": [2030],
        "clustering": {
            "cluster_network": {"n_clusters": 50},
            "temporal": {
                "averaging": False,
                "segmentation": False,
                "representative": False,
            },
        },
        "sector": {"enabled": True},
        "conventional": {
            "unit_commitment": False,
            "dynamic_fuel_price": False,
        },
        "run": {
            "name": "",
            "shared_resources": {"policy": False},
        },
    }

    original = deepcopy(base)

    uc_override = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-elec-uc.yaml")

    uc = generator.build_benchmark_config(
        base,
        uc_override,
        50,
        "3H",
        "elec",
        benchmark_id="pypsa-eur-elec-uc-50-3h",
    )

    assert uc["planning_horizons"] == [2050]
    assert uc["clustering"]["cluster_network"]["n_clusters"] == 50
    assert uc["clustering"]["temporal"]["averaging"] == "3h"
    assert uc["sector"]["enabled"] is False
    assert uc["conventional"]["unit_commitment"] is True
    assert uc["run"]["name"] == "pypsa-eur-elec-uc-50-3h"
    assert uc["run"]["shared_resources"]["policy"] is False

    assert base == original


def test_build_sector_benchmark_config():
    """Check sector coupling and native temporal resolution."""
    base = {
        "planning_horizons": [2030],
        "clustering": {
            "cluster_network": {"n_clusters": 50},
            "temporal": {
                "averaging": False,
                "segmentation": False,
                "representative": False,
            },
        },
        "sector": {"enabled": False},
    }

    override = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-sec.yaml")

    result = generator.build_benchmark_config(base, override, 100, "1H", "sec")

    assert result["planning_horizons"] == [2050]
    assert result["clustering"]["cluster_network"]["n_clusters"] == 100
    assert result["clustering"]["temporal"]["averaging"] is False
    assert result["sector"]["enabled"] is True


def test_generate_benchmark_uses_composed_network(monkeypatch):
    """Check that Snakemake stops before optimization."""
    commands = []
    monkeypatch.setattr(generator, "run", commands.append)

    generator.generate_benchmark(
        Path("/tmp/benchmark.yaml"),
        Path("resources/example/networks/composed_2050.nc"),
        dry=True,
    )

    assert len(commands) == 1
    assert "composed_2050.nc" in commands[0]
    assert "--configfile /tmp/benchmark.yaml" in commands[0]
    assert " -n" in commands[0]
    assert "solve_network" not in commands[0]


def test_build_german_benchmark_config():
    """Check Germany selection is applied during config construction."""
    base = {"countries": ["DE", "FR"]}
    original = deepcopy(base)

    config = generator.build_benchmark_config(
        base,
        {},
        50,
        "3h",
        "elec",
        germany=True,
    )

    assert config["countries"] == ["DE"]
    assert base == original
