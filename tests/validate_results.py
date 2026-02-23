"""Check that each benchmark has been run on the expected number of solvers, and flag missing ones"""

from pathlib import Path

import pandas as pd
import yaml

data = pd.read_csv(Path(__file__).parent / "../results/benchmark_results.csv")
meta = yaml.safe_load(open("results/metadata.yaml"))

short_TO_benchs, long_TO_benchs = set(), set()
short_TO_solvers_LP = None
short_TO_solvers_MILP = None
long_TO_solvers_LP = None
long_TO_solvers_MILP = None
skipped_benchs = set()

for n, b in meta["benchmarks"].items():
    for s in b["Sizes"]:
        bench_size = n + "-" + s["Name"]
        if s["Size"] == "L":
            long_TO_benchs.add(bench_size)
        elif s["Size"] in ["S", "M"]:
            short_TO_benchs.add(bench_size)
        else:
            print(
                f"::warning file=tests/validate_results.py::ERROR: Unknown size {s['Size']}"
            )
            raise ValueError(f"Unknown size {s['Size']}")
        if s.get("Skip because") is not None:
            skipped_benchs.add(bench_size)

data["bench-size"] = data["Benchmark"] + "-" + data["Size"]
data["solver-version"] = data["Solver"] + "-" + data["Solver Version"]

# Check that every bench-size instance has metadata and the same set of solvers run on it
seen_benchs = set()
for (bench, size), group in data.groupby(["Benchmark", "Size"]):
    bench_size = bench + "-" + size
    solvers_present = set(sorted(group["solver-version"].unique()))
    if bench_size in short_TO_benchs:
        problem_class = meta["benchmarks"][bench].get("Problem class", "")
        if problem_class == "LP":
            expected_solvers = 17
        elif problem_class == "MILP":
            expected_solvers = 15
        else:
            expected_solvers = 17  # default

        assert len(solvers_present) == expected_solvers, (
            f"expected {expected_solvers}, found {len(solvers_present)} solvers in results for {bench_size} ({problem_class})"
        )

        if problem_class == "LP":
            if short_TO_solvers_LP is None:
                short_TO_solvers_LP = str(solvers_present)
            else:
                if short_TO_solvers_LP != str(solvers_present):
                    print(
                        f"::warning file=tests/validate_results.py::ERROR: Unexpected LP solvers for {bench_size}: {solvers_present}"
                    )
                    raise ValueError(
                        f"Unexpected LP solvers for {bench_size}: {solvers_present}"
                    )
        elif problem_class == "MILP":
            if short_TO_solvers_MILP is None:
                short_TO_solvers_MILP = str(solvers_present)
            else:
                if short_TO_solvers_MILP != str(solvers_present):
                    print(
                        f"::warning file=tests/validate_results.py::ERROR: Unexpected MILP solvers for {bench_size}: {solvers_present}"
                    )
                    raise ValueError(
                        f"Unexpected MILP solvers for {bench_size}: {solvers_present}"
                    )
    elif bench_size in long_TO_benchs:
        problem_class = meta["benchmarks"][bench].get("Problem class", "")
        if problem_class == "LP":
            expected_solvers = 6
        elif problem_class == "MILP":
            expected_solvers = 4
        else:
            expected_solvers = 6

        assert len(solvers_present) == expected_solvers, (
            f"expected {expected_solvers}, found {len(solvers_present)} solvers in results for {bench_size} ({problem_class})"
        )

        if problem_class == "LP":
            if long_TO_solvers_LP is None:
                long_TO_solvers_LP = str(solvers_present)
            else:
                if long_TO_solvers_LP != str(solvers_present):
                    print(
                        f"::warning file=tests/validate_results.py::ERROR: Unexpected LP solvers for {bench_size}: {solvers_present}"
                    )
                    raise ValueError(
                        f"Unexpected LP solvers for {bench_size}: {solvers_present}"
                    )
        elif problem_class == "MILP":
            if long_TO_solvers_MILP is None:
                long_TO_solvers_MILP = str(solvers_present)
            else:
                if long_TO_solvers_MILP != str(solvers_present):
                    print(
                        f"::warning file=tests/validate_results.py::ERROR: Unexpected MILP solvers for {bench_size}: {solvers_present}"
                    )
                    raise ValueError(
                        f"Unexpected MILP solvers for {bench_size}: {solvers_present}"
                    )
    else:
        print(
            f"::warning file=tests/validate_results.py::ERROR: Unknown benchmark {bench_size}"
        )
        raise ValueError(f"Unknown benchmark {bench_size}")
    seen_benchs.add(bench_size)

print(f"Solvers run on short LP benchmarks:\n{short_TO_solvers_LP}")
print(f"Solvers run on short MILP benchmarks:\n{short_TO_solvers_MILP}")
print(f"Solvers run on long LP benchmarks:\n{long_TO_solvers_LP}")
print(f"Solvers run on long MILP benchmarks:\n{long_TO_solvers_MILP}")

# Check that no bench-size from metadata is missing
missing_benchs = (short_TO_benchs | long_TO_benchs) - seen_benchs - skipped_benchs
if missing_benchs:
    print(
        "::warning file=tests/validate_results.py::ERROR: couldn't find these benchs in the results:"
    )
    print(
        f"::warning file=tests/validate_results.py::ERROR: Missing benchmarks: {missing_benchs}"
    )
