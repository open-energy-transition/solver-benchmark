import numpy as np
from packaging.version import Version


def safe_parse_version(v):
    """Parse a version string tolerantly, falling back to '0' for non-PEP 440 strings."""
    try:
        return Version(str(v))
    except Exception:
        return Version("0")


def calculate_sgm(data_points, sh=10):
    data_points = np.maximum(1, data_points + sh)
    sgm = np.exp(np.mean(np.log(data_points))) - sh
    return sgm
