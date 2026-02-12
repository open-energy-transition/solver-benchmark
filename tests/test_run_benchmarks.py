import subprocess
from unittest.mock import MagicMock, patch

import pytest

from runner.run_benchmarks import get_conda_package_versions, parse_memory


def test_get_versions_success() -> None:
    """
    Test successful retrieval of versions for various solvers using unittest.mock.
    """
    conda_list_output = """
# packages in environment at /path/to/conda/envs/benchmark-2023:
#
# Name                    Version                   Build  Channel
gurobi                    11.0.2                  pypi_0    pypi
highspy                   1.7.0                   pypi_0    pypi
coin-or-cbc               2.10.5               h48a1547_0
some-other-package        1.2.3                     abc_1
"""
    solvers = ["gurobi", "highs", "cbc", "scip"]
    env_name = "benchmark-2023"

    expected_versions = {
        "gurobi": "11.0.2",
        "highs": "1.7.0",
        "cbc": "2.10.5",
        "scip": None,
    }

    with patch("runner.run_benchmarks.subprocess.run") as mock_run:

        mock_run.return_value = MagicMock(
            stdout=conda_list_output, stderr="", returncode=0
        )

        versions = get_conda_package_versions(solvers, env_name)

        assert versions == expected_versions

        mock_run.assert_called_once_with(
            ["bash", "-i", "-c", f"conda list -n {env_name}"],
            capture_output=True,
            text=True,
            check=True,
        )


def test_conda_command_fails() -> None:
    """
    Test that a ValueError is raised if the conda command fails.
    """
    with patch("runner.run_benchmarks.subprocess.run") as mock_run:
        # Configure the mock to raise CalledProcessError
        mock_run.side_effect = subprocess.CalledProcessError(
            returncode=1, cmd="conda list", stderr="Conda command not found"
        )

        with pytest.raises(
            ValueError, match="Error executing conda command: Conda command not found"
        ):
            get_conda_package_versions(["gurobi"], "test-env")


@pytest.mark.parametrize(
    "output, expected_mb",
    [
        ("MaxResidentSetSizeKB=50000", 50.0),
        ("Some other output\nMaxResidentSetSizeKB=12345", 12.345),
        (
            "stdout line 1\nstdout line 2\nstderr line 1\nMaxResidentSetSizeKB=9876",
            9.876,
        ),
        ("  MaxResidentSetSizeKB=1000  ", 1.0),
        ("MaxResidentSetSizeKB=0", 0.0),
    ],
)
def test_parse_memory_success(output: str, expected_mb: float) -> None:
    """
    Test that parse_memory correctly extracts and converts memory usage.
    """
    assert parse_memory(output) == expected_mb


def test_parse_memory_failure() -> None:
    """
    Test that parse_memory raises a ValueError when the key is not found.
    """
    invalid_output = "Some random command output\nthat does not contain memory info"
    with pytest.raises(
        ValueError, match="Could not find memory usage in subprocess output"
    ):
        parse_memory(invalid_output)