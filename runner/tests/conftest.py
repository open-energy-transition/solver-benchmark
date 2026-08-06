import sys
from pathlib import Path

# runner/*.py are flat scripts (no __init__.py) that import each other directly,
# e.g. `from run_solver import HighsVariant` in run_benchmarks.py. Put runner/ on
# sys.path so tests can import them the same way.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
