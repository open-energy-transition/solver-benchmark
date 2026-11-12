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
    """Check that consecutive benchmark configurations remain independent."""
    base = {
        "scenario": {
            "clusters": [50],
            "planning_horizons": ["2050"],
        },
        "clustering": {
            "temporal": {
                "resolution_elec": False,
                "resolution_sector": False,
            }
        },
        "electricity": {"transmission_limit": "v1"},
        "conventional": {
            "unit_commitment": False,
            "dynamic_fuel_price": False,
        },
        "countries": ["DE", "NO"],
    }

    original = deepcopy(base)

    uc_override = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-elec-uc.yaml")
    normal_override = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-elec.yaml")

    uc = generator.build_benchmark_config(base, uc_override, 50, "3H", "elec")

    normal = generator.build_benchmark_config(
        base, normal_override, 100, "168H", "elec"
    )

    assert uc["conventional"]["unit_commitment"]
    assert uc["scenario"]["clusters"] == [50]
    assert uc["clustering"]["temporal"]["resolution_elec"] == "3H"

    assert not normal["conventional"]["unit_commitment"]
    assert normal["scenario"]["clusters"] == [100]
    assert normal["clustering"]["temporal"]["resolution_elec"] == "168H"

    assert uc["scenario"]["planning_horizons"] == ["2050"]
    assert base == original
    assert uc_override["conventional"]["unit_commitment"]


def test_build_sector_benchmark_config():
    """Check sector-specific temporal resolution configuration."""
    base = {
        "scenario": {},
        "clustering": {
            "temporal": {
                "resolution_elec": False,
                "resolution_sector": False,
            }
        },
    }

    override = generator.load_yaml(GENERATOR_DIR / "pypsa-eur-sec.yaml")

    result = generator.build_benchmark_config(base, override, 50, "24H", "sec")

    assert result["scenario"]["clusters"] == [50]
    assert result["scenario"]["planning_horizons"] == ["2050"]
    assert result["clustering"]["temporal"]["resolution_sector"] == "24H"
    assert result["clustering"]["temporal"]["resolution_elec"] is False
