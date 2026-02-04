"""Check that each benchmark has been run on the expected number of solvers, and flag missing ones"""

from pathlib import Path

import pandas as pd
import yaml

data = pd.read_csv(Path(__file__).parent / "../results/benchmark_results.csv")
meta = yaml.safe_load(open("results/metadata.yaml"))

short_TO_benchs, long_TO_benchs = set(), set()
short_TO_solvers, long_TO_solvers = None, None
for n, b in meta["benchmarks"].items():
    for s in b["Sizes"]:
        if s["Size"] == "L":
            long_TO_benchs.add(n + "-" + s["Name"])
        elif s["Size"] in ["S", "M"]:
            short_TO_benchs.add(n + "-" + s["Name"])
        else:
            print(
                f"::warning file=tests/validate_results.py::ERROR: Unknown size {s['Size']}"
            )
            raise ValueError(f"Unknown size {s['Size']}")

data["bench-size"] = data["Benchmark"] + "-" + data["Size"]
data["solver-version"] = data["Solver"] + "-" + data["Solver Version"]

# Check that every bench-size instance has the same set of solvers run on it
seen_benchs = set()
for (bench, size), group in data.groupby(["Benchmark", "Size"]):
    bench_size = bench + "-" + size
    solvers_present = set(sorted(group["solver-version"].unique()))
    if bench_size in short_TO_benchs:
        assert len(solvers_present) == 15, (
            f"expected {15}, found {len(solvers_present)} solvers in results"
        )
        if short_TO_solvers is None:
            short_TO_solvers = str(solvers_present)
        else:
            if short_TO_solvers != str(solvers_present):
                print(
                    f"::warning file=tests/validate_results.py::ERROR: Unexpected solvers for {bench_size}: {solvers_present}"
                )
                raise ValueError(
                    f"Unexpected solvers for {bench_size}: {solvers_present}"
                )
    elif bench_size in long_TO_benchs:
        assert len(solvers_present) == 4
        if long_TO_solvers is None:
            long_TO_solvers = str(solvers_present)
        else:
            if long_TO_solvers != str(solvers_present):
                print(
                    f"::warning file=tests/validate_results.py::ERROR: Unexpected solvers for {bench_size}: {solvers_present}"
                )
                raise ValueError(
                    f"Unexpected solvers for {bench_size}: {solvers_present}"
                )
    else:
        print(
            f"::warning file=tests/validate_results.py::ERROR: Unknown benchmark {bench_size}"
        )
        raise ValueError(f"Unknown benchmark {bench_size}")
    seen_benchs.add(bench_size)

print(f"Solvers run on short TO benchmarks:\n{short_TO_solvers}")
print(f"Solvers run on long TO benchmarks:\n{long_TO_solvers}")

# Check that no bench-size from metadata is missing
missing_benchs = (short_TO_benchs | long_TO_benchs) - seen_benchs

if missing_benchs:
    print(
        "::warning file=tests/validate_results.py::ERROR: couldn't find these benchs in the results:"
    )
    print(
        f"::warning file=tests/validate_results.py::ERROR: Missing benchmarks: {missing_benchs}"
    )
