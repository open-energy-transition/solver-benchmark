"""Tests for runner/utils/metadata.py: loading problem metadata and
resolving it into runnable problems.
"""

import textwrap

import pytest

from runner.utils.metadata import load_problem_metadata, load_problems


class TestLoadProblemMetadata:
    def test_flat_problems_schema_becomes_dataframe(self, tmp_path):
        metadata_file = tmp_path / "metadata.yaml"
        metadata_file.write_text(
            textwrap.dedent(
                """\
                problems:
                  my-problem:
                    Size: S
                    Problem class: LP
                    URL: http://example.com/my-problem
                    Short description: "should be dropped"
                    Realistic motivation: "should also be dropped"
                """
            )
        )
        df = load_problem_metadata(str(metadata_file))
        assert list(df.index) == ["my-problem"]
        assert df.loc["my-problem", "Problem"] == "my-problem"
        assert df.loc["my-problem", "Size"] == "S"
        assert df.loc["my-problem", "Problem class"] == "LP"
        assert "Short description" not in df.columns
        assert "Realistic motivation" not in df.columns

    def test_multiple_problems(self, tmp_path):
        metadata_file = tmp_path / "metadata.yaml"
        metadata_file.write_text(
            textwrap.dedent(
                """\
                problems:
                  problem-a:
                    Size: S
                  problem-b:
                    Size: M
                """
            )
        )
        df = load_problem_metadata(str(metadata_file))
        assert sorted(df.index) == ["problem-a", "problem-b"]


class TestLoadProblems:
    def _write_yaml(self, tmp_path, content):
        problems_yaml = tmp_path / "problems.yaml"
        problems_yaml.write_text(textwrap.dedent(content))
        return problems_yaml

    def test_local_path_entry(self, tmp_path):
        problem_file = tmp_path / "problem.lp"
        problem_file.write_text("Minimize\nobj: x\n")
        problems_yaml = self._write_yaml(
            tmp_path,
            f"""\
            problems:
              my-problem:
                Path: {problem_file}
                Size: S
                Problem class: LP
            """,
        )
        problems = load_problems(problems_yaml, tmp_path / "downloads")
        assert len(problems) == 1
        problem = problems[0]
        assert problem["problem_id"] == "my-problem"
        assert problem["size_category"] == "S"
        assert problem["problem_class"] == "LP"
        assert problem["path"] == problem_file
        assert problem["timeout_seconds"] is None

    def test_missing_path_raises_file_not_found(self, tmp_path):
        problems_yaml = self._write_yaml(
            tmp_path,
            """\
            problems:
              my-problem:
                Path: /does/not/exist.lp
                Size: S
            """,
        )
        with pytest.raises(FileNotFoundError):
            load_problems(problems_yaml, tmp_path / "downloads")

    def test_neither_path_nor_url_raises_value_error(self, tmp_path):
        problems_yaml = self._write_yaml(
            tmp_path,
            """\
            problems:
              my-problem:
                Size: S
            """,
        )
        with pytest.raises(ValueError, match="No valid 'Path' or 'URL'"):
            load_problems(problems_yaml, tmp_path / "downloads")

    def test_url_entry_downloads_into_problems_folder(self, tmp_path, mocker):
        downloads_folder = tmp_path / "downloads"
        download_mock = mocker.patch("runner.utils.metadata.download_benchmark_file")
        problems_yaml = self._write_yaml(
            tmp_path,
            """\
            problems:
              my-problem:
                URL: http://example.com/my-problem.lp
                Size: S
            """,
        )
        problems = load_problems(problems_yaml, downloads_folder)
        expected_path = downloads_folder / "my-problem.lp"
        download_mock.assert_called_once_with(
            "http://example.com/my-problem.lp", expected_path
        )
        assert problems[0]["path"] == expected_path

    def test_gz_url_path_is_the_uncompressed_name(self, tmp_path, mocker):
        mocker.patch("runner.utils.metadata.download_benchmark_file")
        problems_yaml = self._write_yaml(
            tmp_path,
            """\
            problems:
              my-problem:
                URL: http://example.com/my-problem.lp.gz
                Size: S
            """,
        )
        problems = load_problems(problems_yaml, tmp_path / "downloads")
        assert problems[0]["path"] == tmp_path / "downloads" / "my-problem.lp"

    def test_size_categories_filter(self, tmp_path):
        problems_yaml = self._write_yaml(
            tmp_path,
            """\
            problems:
              small-problem:
                Path: /a.lp
                Size: S
              large-problem:
                Path: /b.lp
                Size: L
            """,
        )
        # Neither Path exists, but filtering should exclude both before the
        # existence check would ever raise.
        problems = load_problems(
            problems_yaml, tmp_path / "downloads", size_categories=["M"]
        )
        assert problems == []

    def test_top_level_timeout_applies_to_every_problem(self, tmp_path):
        problem_file = tmp_path / "problem.lp"
        problem_file.write_text("Minimize\nobj: x\n")
        problems_yaml = self._write_yaml(
            tmp_path,
            f"""\
            timeout_seconds: 120
            problems:
              my-problem:
                Path: {problem_file}
                Size: S
            """,
        )
        problems = load_problems(problems_yaml, tmp_path / "downloads")
        assert problems[0]["timeout_seconds"] == 120
