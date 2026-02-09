#!/bin/bash
# Generate fixed conda environment YAML files for each per-solver env.
# Matches benchmark-{solver}-{year}.yaml files.

set -euo pipefail

for f in runner/envs/benchmark-*-*.yaml; do
  # Skip already-generated fixed files
  [[ "$f" == *-fixed.yaml ]] && continue

  name=$(grep '^name:' "$f" | awk '{print $2}')
  echo "Creating env $name from $f..."
  conda env create -q -f "$f" -y
  conda env export -n "$name" --no-builds > "${f%.yaml}-fixed.yaml"
  conda env remove -n "$name" -y
  echo "Generated ${f%.yaml}-fixed.yaml"
done

echo "All fixed env files generated."
