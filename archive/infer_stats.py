"""A script to read generated LP files and infer stats like num variables/constraints.

The inferred stats are written back to the metadata.yaml file.
"""

import re
from collections import defaultdict
from datetime import datetime
from glob import glob
from pathlib import Path

import highspy
import yaml

metadata = yaml.safe_load(
    open("/scratch/htc/skrishna/solver-benchmark/benchmarks/pypsa/metadata.yaml")
)

benchmark_files = [
    Path(lp_file)
    for lp_file in glob("/scratch/htc/skrishna/solver-benchmark/runner/benchmarks/*.lp")
]
benchmarks = []
for path in benchmark_files:
    r = re.match(r"(.*)-(\d+)-(\d+)h\.\w+$", path.name)
    if r is None:
        raise ValueError(
            f"Unexpected filename {path.name}, could not parse size from it"
        )
    benchmarks.append((path, *r.groups()))

missing_metas = [p.name for p, b, _, _ in benchmarks if b not in metadata]
if missing_metas:
    print(
        f"WARNING: the following benchmark files do not have corresponding metadata: {missing_metas}"
    )
# TODO also warn if there's metadata for benchmarks that don't have files?

h = highspy.Highs()
sizes = defaultdict(list)

for p, b, n, t in benchmarks:
    print(f"{datetime.now()} Analyzing {b}")
    if b not in metadata:
        continue
    h.readModel(str(p.absolute()))
    sizes[b].append(
        {
            "Temporal resolution": int(t),
            "Spatial resolution": int(n),
            "N. of constraints": h.numConstrs,
            "N. of variables": h.numVariables,
        }
    )

for b in sizes:
    metadata[b]["Sizes"] = sorted(sizes[b], key=lambda s: s["N. of variables"])

# TODO dump to results/metadata, and also to runner/benchmarks.yaml
with open("plain_pypsa/metadata.yaml", "w") as f:
    yaml.safe_dump(
        metadata, f, default_flow_style=False, sort_keys=False, width=99999999
    )
