"""Unit tests for the run_benchmarks module."""

import gzip
import os
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest
import requests

from runner import run_benchmarks
from runner.run_benchmarks import (
    build_solver_command,
    download_benchmark_file,
    get_conda_package_versions,
    get_solver_name_and_version,
)


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

    def test_build_command_non_root_includes_user_and_reference_flag(
        self, monkeypatch: MagicMock
    ) -> None:
        """Test that the command includes --user and --highs_solver_variant hipo when not running as root."""
        monkeypatch.setattr(os, "geteuid", lambda: 1000)  # non-root
        input_file = Path("/tmp/example_problem.lp")
        solver_name = "highs"
        timeout = 60
        solver_version = "1.2.3"
        memory_limit_bytes = 12345678

        cmd = build_solver_command(
            input_file, solver_name, timeout, solver_version, memory_limit_bytes, True
        )

        assert cmd[0] == "systemd-run"
        assert "--user" in cmd
        assert f"--property=MemoryMax={memory_limit_bytes}" in cmd
        assert "--property=MemorySwapMax=0" in cmd
        assert "/usr/bin/time" in cmd
        assert "--format" in cmd
        assert "MaxResidentSetSizeKB=%M" in cmd
        assert "timeout" in cmd
        assert f"{timeout}s" in cmd
        expected_wrapper = str(Path(run_benchmarks.__file__).parent / "run_solver.py")
        assert expected_wrapper in cmd
        assert "--solver_name" in cmd
        assert cmd[cmd.index("--solver_name") + 1] == solver_name
        assert "--input_file" in cmd
        assert cmd[cmd.index("--input_file") + 1] == input_file.as_posix()
        assert "--solver_version" in cmd
        assert cmd[cmd.index("--solver_version") + 1] == solver_version
        assert "--highs_solver_variant" in cmd
        assert cmd[cmd.index("--highs_solver_variant") + 1] == "hipo"

    def test_build_command_as_root_no_user_and_no_reference(
        self, monkeypatch: MagicMock
    ) -> None:
        """Test that the command does not include --user and --highs_solver_variant hipo"""
        monkeypatch.setattr(os, "geteuid", lambda: 0)  # root
        input_file = Path("/tmp/another.lp")
        solver_name = "cbc"
        timeout = 30
        solver_version = "2.0"
        memory_limit_bytes = 99999

        cmd = build_solver_command(
            input_file, solver_name, timeout, solver_version, memory_limit_bytes, False
        )
        assert "--user" not in cmd
        assert f"--property=MemoryMax={memory_limit_bytes}" in cmd
        assert f"{timeout}s" in cmd
        assert "--solver_name" in cmd
        assert cmd[cmd.index("--solver_name") + 1] == solver_name
        assert "--input_file" in cmd
        assert cmd[cmd.index("--input_file") + 1] == input_file.as_posix()
        assert "--solver_version" in cmd
        assert cmd[cmd.index("--solver_version") + 1] == solver_version
        assert not any(el == "--highs_solver_variant hipo" for el in cmd)

    def test_download_regular_file_http(self, tmp_path: Path) -> None:
        """Test downloading a regular file from HTTP URL."""
        dest_path = tmp_path / "data.txt"
        test_content = b"test file content"

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [test_content]
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/data.txt", dest_path)

            assert dest_path.exists()
            assert dest_path.read_bytes() == test_content
            mock_get.assert_called_once_with("http://example.com/data.txt", stream=True)

    def test_download_gzipped_file_http(self, tmp_path: Path) -> None:
        """Test downloading and unzipping a .gz file from HTTP."""
        dest_path = tmp_path / "data.txt.gz"
        uncompressed_path = tmp_path / "data.txt"
        original_content = b"original file content"

        # Create gzipped content
        gzipped_content = gzip.compress(original_content)

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [gzipped_content]
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/data.txt.gz", dest_path)

            # Verify uncompressed file exists and compressed file is removed
            assert uncompressed_path.exists()
            assert not dest_path.exists()
            assert uncompressed_path.read_bytes() == original_content

    def test_skip_download_if_file_exists(self, tmp_path: Path) -> None:
        """Test that download is skipped if the file already exists."""
        dest_path = tmp_path / "data.txt"
        dest_path.write_text("existing content")

        with patch("requests.get") as mock_get:
            download_benchmark_file("http://example.com/data.txt", dest_path)

            # Verify no download occurred
            mock_get.assert_not_called()
            assert dest_path.read_text() == "existing content"

    def test_skip_download_if_uncompressed_file_exists_with_gz_url(
        self, tmp_path: Path
    ) -> None:
        """Test that download is skipped if uncompressed file exists when .gz URL is provided."""
        gz_path = tmp_path / "data.txt.gz"
        uncompressed_path = tmp_path / "data.txt"
        uncompressed_path.write_text("existing content")

        with patch("requests.get") as mock_get:
            download_benchmark_file("http://example.com/data.txt.gz", gz_path)

            # Verify no download occurred
            mock_get.assert_not_called()
            assert uncompressed_path.read_text() == "existing content"
            assert not gz_path.exists()

    def test_create_destination_directory_if_not_exists(self, tmp_path: Path) -> None:
        """Test that destination directory is created if it doesn't exist."""
        nested_path = tmp_path / "subdir" / "nested" / "data.txt"

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [b"content"]
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/data.txt", nested_path)

            assert nested_path.parent.exists()
            assert nested_path.exists()

    def test_http_download_raises_on_failed_response(self, tmp_path: Path) -> None:
        """Test that HTTP errors are properly raised."""
        dest_path = tmp_path / "data.txt"

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.raise_for_status.side_effect = requests.HTTPError(
                "404 Not Found"
            )
            mock_get.return_value.__enter__.return_value = mock_response

            with pytest.raises(requests.HTTPError):
                download_benchmark_file("http://example.com/missing.txt", dest_path)

    def test_gsutil_download_fails(self, tmp_path: Path) -> None:
        """Test that gsutil command failures are properly raised."""
        dest_path = tmp_path / "data.txt"

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.CalledProcessError(1, "gsutil cp")

            with pytest.raises(subprocess.CalledProcessError):
                download_benchmark_file("gs://bucket-name/data.txt", dest_path)

    def test_gzip_decompression_error(self, tmp_path: Path) -> None:
        """Test handling of corrupted gzip files."""
        dest_path = tmp_path / "data.txt.gz"
        # Write invalid gzip content
        dest_path.write_bytes(b"not a valid gzip file")

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [b"not a valid gzip file"]
            mock_get.return_value.__enter__.return_value = mock_response

            with pytest.raises(gzip.BadGzipFile):
                download_benchmark_file("http://example.com/data.txt.gz", dest_path)

    def test_large_file_streaming(self, tmp_path: Path) -> None:
        """Test that large files are downloaded in chunks."""
        dest_path = tmp_path / "large_file.bin"
        # 10 chunks of 8KB each
        chunks = [b"x" * 8192 for _ in range(10)]

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = chunks
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/large_file.bin", dest_path)

            assert dest_path.stat().st_size == 8192 * 10
            mock_response.iter_content.assert_called_once_with(chunk_size=8192)

    def test_full_workflow_gcs_gzip(self, tmp_path: Path) -> None:
        """Test complete workflow: GCS download + gzip decompression."""
        dest_path = tmp_path / "benchmark.tar.gz"
        uncompressed_path = tmp_path / "benchmark.tar"
        original_content = b"tar archive content here"

        gzipped = gzip.compress(original_content)

        with patch("subprocess.run") as mock_run:
            # Simulate gsutil writing the gzipped file
            def write_file(*args, **kwargs):
                dest_path.write_bytes(gzipped)
                return Mock(returncode=0)

            mock_run.side_effect = write_file

            download_benchmark_file("gs://bucket-name/benchmark.tar.gz", dest_path)

            assert uncompressed_path.exists()
            assert not dest_path.exists()
            assert uncompressed_path.read_bytes() == original_content

    def test_file_with_multiple_dots_in_name(self, tmp_path: Path) -> None:
        """Test handling files with multiple dots (e.g., data.backup.txt.gz)."""
        dest_path = tmp_path / "data.backup.txt.gz"
        uncompressed_path = tmp_path / "data.backup.txt"
        content = b"backup data"
        gzipped = gzip.compress(content)

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = [gzipped]
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/data.backup.txt.gz", dest_path)

            assert uncompressed_path.exists()
            assert uncompressed_path.read_bytes() == content

    def test_empty_file_download(self, tmp_path: Path) -> None:
        """Test downloading an empty file."""
        dest_path = tmp_path / "empty.txt"

        with patch("requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.iter_content.return_value = []
            mock_get.return_value.__enter__.return_value = mock_response

            download_benchmark_file("http://example.com/empty.txt", dest_path)

            assert dest_path.exists()
            assert dest_path.stat().st_size == 0

    @pytest.mark.parametrize(
        "input_name, expected_base, expected_variant",
        [
            ("highs", "highs", None),
            ("highs-hipo", "highs", "hipo"),
            ("highs-ipm", "highs", "ipm"),
            ("Highs-IPX", "highs", "ipx"),
            ("HIGHS-SIMPLEX", "highs", "simplex"),
            ("cbc", "cbc", None),
            ("scip", "scip", None),
        ],
    )
    def test_split_highs_solver_name_variants_parametrized(
        self, input_name: str, expected_base: str, expected_variant: str | None
    ) -> None:
        """Test the _split_highs_solver_name function with various input formats."""
        base, variant = get_solver_name_and_version(input_name)
        assert base == expected_base
        assert variant == expected_variant
