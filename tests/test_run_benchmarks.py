"""Unit tests for the run_benchmarks module."""

from unittest.mock import MagicMock, patch

from runner.run_benchmarks import get_conda_package_versions


class TestRunBenchmarks:
    def test_get_conda_package_versions(self) -> None:
        """Test the get_conda_package_versions function."""
        solvers_list = ["highs", "highs-hipo", "highs-ipm", "cbc", "scip"]
        env_name = "benchmark-env"
        # Simulate conda list output
        conda_list_output = """
        # packages in environment at /opt/conda/envs/fake-env:
        #
        highspy                   1.13.2.dev1         py39_0
        coin-or-cbc               2.10.12             py39_0
        pyscipopt                 5.7.1               py39_0
        otherpkg                  0.1.0               py39_0
        """
        mock_result = MagicMock()
        mock_result.stdout = conda_list_output
        mock_result.returncode = 0

        expected_dict = {
            "highs": "1.13.2.dev1",
            "highs-hipo": "1.13.2.dev1",
            "highs-ipm": "1.13.2.dev1",
            "cbc": "2.10.12",
            "scip": "5.7.1",
        }

        with patch("subprocess.run", return_value=mock_result):
            versions = get_conda_package_versions(solvers_list, env_name)
            assert versions == expected_dict
