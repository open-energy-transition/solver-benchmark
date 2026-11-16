"""Export a PyPSA-Eur optimization problem without solving it."""

import argparse
import logging
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pypsa
import yaml
from scripts.solve_network import (
    collect_kwargs,
    create_optimization_model,
    prepare_network,
)

logger = logging.getLogger(__name__)


def get_custom_functionality(config: dict) -> str | None:
    """Resolve the custom functionality path relative to the rules directory."""
    configured = config["solving"]["options"].get("custom_extra_functionality")

    if not configured:
        return None

    path = (Path("rules") / configured).resolve()

    if not path.is_file():
        raise FileNotFoundError(f"Custom functionality not found: {path}")

    return str(path)


def export_model(
    network_path: Path,
    config_path: Path,
    problem_path: Path,
    prepared_network_path: Path,
    horizon: str,
) -> None:
    """Prepare a network, construct its optimization model, and export it."""
    with config_path.open() as file:
        config = yaml.safe_load(file)

    solve_options = config["solving"]["options"]

    if solve_options.get("rolling_horizon", False):
        raise ValueError("Rolling-horizon benchmarks are not supported.")

    np.random.seed(solve_options.get("seed", 123))

    logger.info("Loading composed network: %s", network_path)
    network = pypsa.Network(network_path)

    prepare_network(
        network,
        config=config,
        solve_opts=solve_options,
        foresight=config["foresight"],
        planning_horizons=horizon,
        co2_sequestration_potential=config["sector"]["co2_sequestration_potential"],
        limit_max_growth=config["sector"]["limit_max_growth"],
        rolling_horizon=False,
    )

    # Preserve the network used to construct the optimization problem.
    prepared_network_path.parent.mkdir(parents=True, exist_ok=True)
    network.export_to_netcdf(prepared_network_path)

    model_kwargs, solve_kwargs = collect_kwargs(
        config,
        config["solving"],
        planning_horizons=horizon,
        mode="single",
    )

    params = SimpleNamespace(
        custom_extra_functionality=get_custom_functionality(config)
    )

    context = SimpleNamespace(
        config=config,
        params=params,
        wildcards=SimpleNamespace(horizon=horizon),
    )

    create_optimization_model(
        network,
        config=config,
        params=params,
        model_kwargs=model_kwargs,
        solve_kwargs=solve_kwargs,
        planning_horizons=horizon,
        snakemake=context,
    )

    problem_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info("Exporting optimization problem: %s", problem_path)
    network.model.to_file(
        problem_path,
        io_api=problem_path.suffix.lstrip("."),
    )

    logger.info(
        "Exported model with %s variables and %s constraints",
        network.model.nvars,
        network.model.ncons,
    )


def main() -> None:
    """Parse arguments and export the requested benchmark instance."""
    parser = argparse.ArgumentParser()

    parser.add_argument("--network", type=Path, required=True)
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--problem", type=Path, required=True)
    parser.add_argument("--prepared-network", type=Path, required=True)
    parser.add_argument("--horizon", default="2050")

    args = parser.parse_args()

    if args.problem.suffix not in {".lp", ".mps"}:
        parser.error("Problem extension must be .lp or .mps")

    logging.basicConfig(level=logging.INFO)

    export_model(
        network_path=args.network,
        config_path=args.config,
        problem_path=args.problem,
        prepared_network_path=args.prepared_network,
        horizon=args.horizon,
    )


if __name__ == "__main__":
    main()
