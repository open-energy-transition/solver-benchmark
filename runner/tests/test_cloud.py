"""Tests for runner/utils/cloud.py's download_benchmark_file: fetching
problem files from GCS or plain HTTP(S) URLs.
"""

import gzip
import subprocess
from unittest.mock import MagicMock

from runner.utils.cloud import download_benchmark_file


class TestDownloadBenchmarkFile:
    def test_skips_download_if_file_exists(self, tmp_path, mocker):
        dest = tmp_path / "problem.lp"
        dest.write_text("already here")
        requests_mock = mocker.patch("runner.utils.cloud.requests.get")
        subprocess_mock = mocker.patch("runner.utils.cloud.subprocess.run")

        download_benchmark_file("http://example.com/problem.lp", dest)

        requests_mock.assert_not_called()
        subprocess_mock.assert_not_called()
        assert dest.read_text() == "already here"

    def test_http_download_streams_to_file(self, tmp_path, mocker):
        dest = tmp_path / "problem.lp"
        response = MagicMock()
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        response.iter_content.return_value = [b"hello ", b"world"]
        mocker.patch("runner.utils.cloud.requests.get", return_value=response)

        download_benchmark_file("http://example.com/problem.lp", dest)

        assert dest.read_bytes() == b"hello world"
        response.raise_for_status.assert_called_once()

    def test_gcs_download_uses_gsutil(self, tmp_path, mocker):
        dest = tmp_path / "problem.lp"
        run_mock = mocker.patch(
            "runner.utils.cloud.subprocess.run",
            return_value=subprocess.CompletedProcess(args=[], returncode=0),
        )

        download_benchmark_file("gs://solver-benchmarks/problem.lp", dest)

        called_cmd = run_mock.call_args[0][0]
        assert called_cmd == ["gsutil", "cp", "gs://solver-benchmarks/problem.lp", dest]

    def test_gz_download_is_unzipped_and_original_removed(self, tmp_path, mocker):
        dest = tmp_path / "problem.lp.gz"
        uncompressed_content = b"lp file contents"
        gz_bytes = gzip.compress(uncompressed_content)

        response = MagicMock()
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        response.iter_content.return_value = [gz_bytes]
        mocker.patch("runner.utils.cloud.requests.get", return_value=response)

        download_benchmark_file("http://example.com/problem.lp.gz", dest)

        uncompressed_dest = dest.with_suffix("")
        assert uncompressed_dest.read_bytes() == uncompressed_content
        assert not dest.exists()
