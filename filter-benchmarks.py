#!/usr/bin/env python

"""
A script to (smartly) run Highs on all sizes of a benchmark and find the ones that
solve in under a timeout (1h).
"""

import csv
import sys
from pathlib import Path

from runner.run_benchmarks import benchmark_solver, download_file_from_google_drive

benchmark = sys.argv[1]
timeout = 60 * 60
resolutions = ["24h", "12h", "3h", "1h"]
clusters = list(range(2, 11))

end_early = False
results_csv = Path(f"filter-{benchmark}.csv")
if not results_csv.exists():
    with open(results_csv, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["benchmark", "status", "runtime"])

for r in resolutions:
    for n in clusters:
        lp_file = f"{benchmark}-{n}-{r}.lp"
        gcp_url = "https://storage.googleapis.com/solver-benchmarks/" + lp_file
        lp_path = Path("./runner/benchmarks/") / lp_file
        download_file_from_google_drive(gcp_url, lp_path)
        print(f"Solving {lp_file}..", flush=True)

        m = benchmark_solver(lp_path, "highs", timeout, None, None)
        print(m, flush=True)
        with open(results_csv, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([lp_file, m["status"], m["runtime"]])

        if m["status"] == "TO":
            if n == 2:
                end_early = True
            break
    if end_early:
        break
