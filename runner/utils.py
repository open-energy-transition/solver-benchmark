import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yaml
from humanize import naturaldelta
from IPython.display import display
from matplotlib.patches import Patch
import matplotlib as mpl

# ---------- Monitor in-progress runs ----------


def get_running_instances():
    """Get a list of running VM instances."""
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "instances",
                "list",
                "--filter=status:RUNNING",
                "--format=value(name,zone)",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip().splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Error fetching instances: {e}")
        return []


def check_uptime_of_instance(instance):
    """SSH into the instance and check uptime."""
    name, zone = instance.split()
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "ssh",
                name,
                "--zone",
                zone,
                "--command",
                "uptime",
                "--quiet",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return f"{name}: {result.stdout.strip()}"
    except subprocess.CalledProcessError as e:
        return f"{name}: Error - {e}"


def check_uptimes():
    instances = get_running_instances()
    print(f"There are {len(instances)} running instances")

    hung_vms = []

    # Use ThreadPoolExecutor to run uptime checks in parallel
    with ThreadPoolExecutor() as executor:
        future_to_instance = {
            executor.submit(check_uptime_of_instance, instance): instance
            for instance in instances
        }

        for future in as_completed(future_to_instance):
            instance = future_to_instance[future]
            try:
                uptime_info = future.result()
                print(uptime_info)
                if float(uptime_info.split()[-1]) < 1.0:
                    hung_vms.append(uptime_info)
            except Exception as e:
                print(f"{instance}: Exception - {e}")

    msg = "\n".join(hung_vms)
    print(f"\n{len(hung_vms)} potentially hung instances:\n{msg}")


# ---------- Use SCP to get in-progress results ----------


def fetch_results_from_instance(instance, output_dir="../results/partial-results"):
    """SCP the results from the instance."""
    # TODO use Path for output_dir
    name, zone = instance.split()
    result = None
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "scp",
                "--zone",
                zone,
                f"{name}:/solver-benchmark/results/benchmark_results.csv",
                f"{output_dir}/{name}.csv",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        result.check_returncode()
        return
    except subprocess.CalledProcessError as e:
        print(f"{name}: Error - {e}")
        print(result.stdout if result else "")
        print(result.stderr if result else "")


def fetch_all_partial_results(output_dir="../results/partial-results"):
    # Create and clear the directory if required
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    for f in output_dir.glob("*.csv"):
        f.unlink()
    print(f"Cleared {output_dir}")

    instances = [
        i for i in get_running_instances() if i.startswith("benchmark-instance")
    ]
    print(f"There are {len(instances)} running VMs. Fetching results from: ", end="")

    # Use ThreadPoolExecutor to fetch results in parallel
    with ThreadPoolExecutor() as executor:
        future_to_instance = {
            executor.submit(fetch_results_from_instance, instance): instance
            for instance in instances
        }

        for future in as_completed(future_to_instance):
            instance = future_to_instance[future]
            try:
                future.result()
                print(instance, end=" ")
            except Exception as e:
                print(f"{instance}: Exception - {e}")
    print("Done.")


# ---------- Load results ----------


def load_results(folder: str | list[str]):
    """Loads all CSV files in `folder`. Returns the results and variability dataframes."""
    folders = folder if isinstance(folder, list) else [folder]
    csv_files = [p for f in folders for p in Path(f).glob("*.csv")]
    results = pd.concat([pd.read_csv(p) for p in csv_files]).reset_index(drop=True)

    # Remove reference benchmark
    reference_results = results.query('Benchmark == "reference-benchmark"')
    results = results.query('Benchmark != "reference-benchmark"').copy()

    # Find the variability of each VM
    variability = reference_results.groupby(["Hostname", "Run ID", "VM Zone"]).agg(
        {"Runtime (s)": ["count", "min", "max", "std", "mean"]}
    )
    variability["std %"] = (
        variability[("Runtime (s)", "std")] * 100 / variability[("Runtime (s)", "mean")]
    )

    # Print some basic stats
    results["bench-size"] = results["Benchmark"] + "-" + results["Size"]
    results["solver-version"] = results["Solver"] + "-" + results["Solver Version"]
    print(
        f"Found {len(results)} records, {len(results['bench-size'].unique())} benchmark instances"
    )
    return results, variability


def load_benchmark_metadata(metadata_file: str = "../results/metadata.yaml"):
    # Create a benchmark instance DF from the metadata.yaml file
    with open(Path(metadata_file), "r") as f:
        metadata = yaml.safe_load(f)
    rows = []
    ignore_keys = {"Short description", "Realistic motivation", "Sizes", "Name"}
    for bench_name, bench_data in metadata["benchmarks"].items():
        common_attrs = {k: v for k, v in bench_data.items() if k not in ignore_keys}
        for size_data in bench_data.get("Sizes", []):
            size_attrs = {k: v for k, v in size_data.items() if k not in ignore_keys}
            row = {
                "Benchmark": bench_name,
                "Instance": size_data.get("Name"),
                **common_attrs,
                **size_attrs,
            }
            rows.append(row)
    benchmarks_df = pd.DataFrame(rows)
    benchmarks_df.index = benchmarks_df["Benchmark"] + "-" + benchmarks_df["Instance"]
    return benchmarks_df


# ---------- Creating benchmark campaigns ----------


def allocate_vms_greedy(instances, instance_weights, num_vms: int):
    """Use longest-processing-time-first greedy algorithm to split benchs into VMs."""
    allocation = [[] for _ in range(num_vms)]
    weights = [0 for _ in range(num_vms)]

    instances_and_runtimes = sorted(
        [(instance_weights[b], b) for b in instances], reverse=True
    )

    for t, b in instances_and_runtimes:
        lightest_vm = min(enumerate(weights), key=lambda x: x[1])[0]
        allocation[lightest_vm].append(b)
        weights[lightest_vm] += t

    print(f"Allocated. Estimated runtime: {max(weights) / 3600:.1f}h")
    for i in range(num_vms):
        print(f"  VM {i:02d}: {len(allocation[i])} instances, {weights[i] / 3600:.1f}h")
    return allocation, weights


def allocate_benchmarks(
    benchmarks_df: pd.DataFrame,
    weight_col: str,
    num_vms: int,
    machine_type: str = "c4-standard-2",
    zone: str = "us-central1-a",
    solvers: str | None = None,
    timeout_seconds: int | None = None,
) -> list[dict]:
    allocation, _ = allocate_vms_greedy(
        benchmarks_df.index, benchmarks_df[weight_col], num_vms
    )
    vm_yamls = []
    for benchs in allocation:
        vm_benchmarks = {}
        # Collect all sizes of a benchmark
        for b in benchs:
            size_instance = {
                "Name": benchmarks_df.loc[b, "Instance"],
                "Size": benchmarks_df.loc[b, "Size"],
                "URL": benchmarks_df.loc[b, "URL"],
            }
            bench_name = benchmarks_df.loc[b, "Benchmark"]
            if bench_name in vm_benchmarks:
                vm_benchmarks[bench_name]["Sizes"].append(size_instance)
            else:
                vm_benchmarks[bench_name] = {
                    "Problem class": benchmarks_df.loc[b, "Problem class"],
                    "Sizes": [size_instance],
                }
        vm_yamls.append(
            {
                "machine-type": machine_type,
                "zone": zone,  # Default cheapest zone, can be overwritten
                "benchmarks": vm_benchmarks,
            }
        )
        if solvers:
            vm_yamls[-1]["solver"] = solvers
        if timeout_seconds:
            vm_yamls[-1]["timeout_seconds"] = timeout_seconds
    return vm_yamls


def create_benchmark_campaign(batch_id: str, vm_prefix: str, vm_yamls: list[dict]):
    tfvars = f'''project_id = "compute-app-427709"
    enable_gcs_upload = true
    auto_destroy_vm = true
    benchmarks_dir = "benchmarks/{batch_id}"
    run_id = "{batch_id}"
    '''

    # Create a campaign folder ../infrastructure/benchmarks/{batch_id}
    bench_dir = Path(f"../infrastructure/benchmarks/{batch_id}")
    bench_dir.mkdir(parents=True, exist_ok=True)
    with open(bench_dir / "run.tfvars", "w") as f:
        f.write(tfvars)

    if any(bench_dir.glob("*.yaml")):
        print(f"WARNING: existing yaml files found in {bench_dir}")

    # Add to it the allocated benchmarks
    for idx, yaml_data in enumerate(vm_yamls):
        with open(bench_dir / f"{vm_prefix}-{idx:02d}.yaml", "w") as f:
            yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)

    print(f"Created directory and files in {bench_dir}")
    print(
        "Run this campaign from the infrastructure/ directory using the command:\n"
        f"tofu apply -var-file benchmarks/{batch_id}/run.tfvars -state=states/{batch_id}.tfstate"
    )


# ---------- Analyze results and make plots ----------


# Color map
color_map = {
    "cbc": "#F9CD5A",  # yellow
    "glpk": "#7C3AED",  # purple
    "gurobi": "#F66C49",  # red
    "highs": "#43BF94",  # green
    "highs-hipo": "#F759B8",  # magenta
    "highs-ipm": "#6D712E",  # green-brown
    "scip": "#3B82F6",  # blue
}


def calculate_sgm(data_points, sh=10):
    data_points = np.maximum(1, data_points + sh)
    sgm = np.exp(np.mean(np.log(data_points))) - sh
    return sgm


def is_solved(row):
    # Solved Instances: where Status == 'ok' and Termination Condition == 'optimal'
    # TODO for now, relaxing to Status == 'ok'
    return row["Status"] == "ok"


def compute_summary_results(results_extended, category_suffix=""):
    grouped = results_extended.groupby(
        ["Problem class", "Size Category", "solver-version"]
    )
    summaries = []
    for (cls, size, solver), group in grouped:
        solved_instances = (is_solved(group)).sum()

        # Compute SGM using: Runtime if solved, else Timeout
        data_points = group.apply(
            lambda row: row["Runtime (s)"] if is_solved(row) else row["Timeout"],
            axis=1,
        )
        sgm_runtime = calculate_sgm(data_points.values)

        full_size = {x[0]: x for x in ["Small", "Medium", "Large"]}[size]

        total_instances = group.shape[0]
        solved_frac = solved_instances * 100 / total_instances
        solved_instances_str = (
            f"{solved_frac: 3.0f}% ({solved_instances}/{total_instances})"
        )

        summaries.append(
            {
                "Class": cls,
                "Category": full_size + category_suffix,
                "Solver": solver,
                "Solved Instances": solved_instances_str,
                "SGM Runtime": sgm_runtime,
            }
        )
    return pd.DataFrame(summaries)


def display_speedups(results, new_pypsa_benchs):
    speedup_df = results.pivot_table(
        index="bench-size", columns="Solver", values="Runtime (s)", aggfunc="first"
    ).reset_index()

    # Also pivot Status column
    status_df = results.pivot_table(
        index="bench-size", columns="Solver", values="Status", aggfunc="first"
    ).reset_index()

    # Calculate speedups relative to ipm-time, but use status if not "ok"
    speedup_df["ipm-speedup"] = speedup_df.apply(
        lambda row: status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-ipm"
        ].values[0]
        if status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-ipm"
        ].values[0]
        != "ok"
        else row["highs"] / row["highs-ipm"],
        axis=1,
    )

    speedup_df["hipo-speedup"] = speedup_df.apply(
        lambda row: status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-hipo"
        ].values[0]
        if status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-hipo"
        ].values[0]
        != "ok"
        else row["highs"] / row["highs-hipo"],
        axis=1,
    )

    # Rename columns for clarity
    speedup_df = speedup_df.rename(
        columns={
            "highs": "simplex-time",
            "highs-ipm": "ipm-time",
            "highs-hipo": "hipo-time",
        }
    )

    # Add num-vars column by looking up in new_pypsa_benchs
    speedup_df = speedup_df.merge(
        new_pypsa_benchs[["Num. variables"]],
        left_on="bench-size",
        right_index=True,
        how="left",
    )

    speedup_df = speedup_df.rename(columns={"Num. variables": "num-vars"})

    missing = speedup_df[speedup_df["num-vars"].isna()]["bench-size"]
    if not missing.empty:
        raise ValueError("Missing Num. variables for:\n" + "\n".join(missing.tolist()))

    # Format the dataframe for pretty printing
    speedup_df = speedup_df.sort_values("num-vars")
    display_df = pd.DataFrame(speedup_df["bench-size"])
    display_df["num-vars"] = speedup_df["num-vars"]

    display_df["simplex-time"] = speedup_df.apply(
        lambda row: status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs"
        ].values[0]
        if status_df.loc[status_df["bench-size"] == row["bench-size"], "highs"].values[
            0
        ]
        != "ok"
        else naturaldelta(row["simplex-time"]),
        axis=1,
    )

    display_df["ipm-time"] = speedup_df.apply(
        lambda row: status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-ipm"
        ].values[0]
        if status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-ipm"
        ].values[0]
        != "ok"
        else naturaldelta(row["ipm-time"]),
        axis=1,
    )

    display_df["hipo-time"] = speedup_df.apply(
        lambda row: status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-hipo"
        ].values[0]
        if status_df.loc[
            status_df["bench-size"] == row["bench-size"], "highs-hipo"
        ].values[0]
        != "ok"
        else naturaldelta(row["hipo-time"]),
        axis=1,
    )

    display_df["ipm-speedup"] = speedup_df["ipm-speedup"].apply(
        lambda x: f"{x:.1f}x" if isinstance(x, (int, float)) else x
    )
    display_df["hipo-speedup"] = speedup_df["hipo-speedup"].apply(
        lambda x: f"{x:.1f}x" if isinstance(x, (int, float)) else x
    )

    display_df = display_df.reset_index(drop=True)

    display_df = display_df.rename(
        columns={
            "bench-size": "Benchmark",
            "num-vars": "Num. variables",
            "simplex-time": "Simplex time",
            "ipm-time": "IPX time",
            "hipo-time": "HiPO time",
            "ipm-speedup": "IPX vs Simplex speedup",
            "hipo-speedup": "HiPO vs Simplex speedup",
        }
    )
    
    return display_df.style.hide(axis="index").format(
        {
            "num-vars": "{:,.0f}".format,
            "ipm-speedup": "{:>s}".format,
            "hipo-speedup": "{:>s}".format,
        }
    )


def plot_runtime_slowdowns(df, cls="", figsize=(12, 6), max_num_solvers=5):
    """Plots relative runtimes (slowdown factors) in a bar chart.

    Expects df to have columns: Benchmark, Solver, Runtime (s), Status, Timeout
    """

    # --- Solver display names (presentation only) ---
    solver_label_map = {
        "highs": "highs-simplex",
        "highs-ipm": "highs-ipm",
        "highs-hipo": "highs-hipo",
        "gurobi": "gurobi",
        "cbc": "cbc",
        "scip": "scip",
        "glpk": "glpk",
    }

    if "bench-size" in df.columns:
        df["Benchmark"] = df["bench-size"]

    # Fill NaN runtimes and non-ok statuses with TO value
    df.loc[df["Runtime (s)"].isna(), "Runtime (s)"] = df["Timeout"]
    df.loc[df.query('Status != "ok"').index, "Runtime (s)"] = df["Timeout"]

    # Find the fastest solver for each benchmark
    df_ok = df.query('Status == "ok"')
    fastest_runtimes = df_ok.loc[df_ok.groupby("Benchmark")["Runtime (s)"].idxmin()]

    # Sort benchmarks by fastest runtime
    sorted_benchmarks = fastest_runtimes.sort_values("Runtime (s)").reset_index(
        drop=True
    )

    # Normalize runtimes to find each solver's slowdown factor
    df = df.merge(
        fastest_runtimes[["Benchmark", "Runtime (s)"]],
        on="Benchmark",
        suffixes=("", "_fastest"),
    )
    df["Slowdown"] = df["Runtime (s)"] / df["Runtime (s)_fastest"]
    max_slowdown = max(df.query('Status == "ok"')["Slowdown"])
    df.loc[df.query('Status != "ok"').index, "Slowdown"] = 1.1 * max_slowdown

    width = 1 / (max_num_solvers + 1)

    fig, ax = plt.subplots(figsize=figsize, layout="constrained")
    seen_solvers = set()

    # Add a dotted line at y=1
    ax.axhline(1, color="grey", linestyle="--")

    # Plot each benchmark
    for i, benchmark in enumerate(sorted_benchmarks["Benchmark"]):
        benchmark_data = df[df["Benchmark"] == benchmark].sort_values(
            "Slowdown", ascending=True
        )
        num_solvers = len(benchmark_data)

        xs = i + (np.arange(num_solvers) * width) - 0.5 + width

        # Track solvers actually used
        seen_solvers.update(benchmark_data["Solver"])

        colors = [
            (
                *mcolors.to_rgba(color_map[r["Solver"]])[:3],
                1.0 if r["Status"] == "ok" else 0.2,
            )
            for _, r in benchmark_data.iterrows()
        ]

        ax.bar(xs, benchmark_data["Slowdown"], width, color=colors)

        # Labels on bars
        for j, x in enumerate(xs):
            y = benchmark_data.iloc[j]["Slowdown"] + 0.5
            if benchmark_data.iloc[j]["Status"] == "ok":
                label = f"{benchmark_data.iloc[j]['Slowdown']:.1f}x"
                kwargs = {}
            else:
                label = benchmark_data.iloc[j]["Status"]
                kwargs = {"color": "red", "weight": "bold"}

            ax.text(x, y, label, ha="center", **kwargs)

            if "Solved Instances" in df.columns:
                solved = benchmark_data.iloc[j]["Solved Instances"].split()[0]
                ax.text(x, y + max_slowdown * 0.03, solved, ha="center", color="grey")

    # X ticks
    xlabels = [
        f"{r['Benchmark']}\nFastest solver: {naturaldelta(r['Runtime (s)'])}"
        for _, r in sorted_benchmarks.iterrows()
    ]
    ax.set_xticks(np.arange(len(sorted_benchmarks)), xlabels)

    # Labels and title
    ax.set_ylabel("Relative Runtime (normalized)")
    ax.set_title(
        "Solver Runtime Comparison" + (f" – {cls}" if cls else ""),
        fontsize=24,
        fontweight="bold",
    )

    # Legend with renamed solvers
    ax.legend(
        handles=[
            Patch(color=color_map[s], label=solver_label_map.get(s, s))
            for s in seen_solvers
        ],
        title="Solver",
        loc="upper left",
    )


def plot_summary_results(summary_df, cls, label_map=None, max_num_solvers=5):

    mpl.rcParams.update({
        "font.size": 22,
        "axes.titlesize": 22,
        "axes.labelsize": 22,
        "xtick.labelsize": 22,
        "ytick.labelsize": 22,
        "legend.fontsize": 22,
        "legend.title_fontsize": 22,
        "figure.constrained_layout.use": True,
    })

    lp_summary = summary_df.query(f'Class == "{cls}"').copy()

    if label_map:
        lp_summary["Category"] = lp_summary["Category"].map(label_map)

    lp_summary = lp_summary.rename(
        columns={"Category": "Benchmark", "SGM Runtime": "Runtime (s)"}
    )

    lp_summary["Status"] = "ok"
    lp_summary["Solver"] = lp_summary["Solver"].apply(
        lambda s: re.match(r"^([a-z\-]+?)(?:-\d)", s).group(1)
        if re.match(r"^([a-z\-]+?)(?:-\d)", s)
        else s
    )
    lp_summary["Timeout"] = None

    plot_runtime_slowdowns(
        lp_summary, cls=cls, figsize=(35, 12), max_num_solvers=max_num_solvers
    )

    ax = plt.gca()
    ax.set_ylim(0, ax.get_ylim()[1] * 1.10)


def print_sgm_tables_per_bucket(
    final_with_size,
    buckets,
    solvers=("highs", "highs-hipo", "highs-ipm", "gurobi"),
    shift=1.0,
):
    """
    Print one SGM runtime table per bucket, including solved percentage.

    Columns:
      - Solver
      - SGM runtime (min)
      - # solved
      - # total
      - % solved
    """

    # Presentation-ready solver labels
    solver_label_map = {
        "highs": "HiGHS-Simplex",
        "highs-ipm": "HiGHS-IPX",
        "highs-hipo": "HiGHS-HiPO",
        "gurobi": "Gurobi",
    }

    def shifted_geometric_mean(x, shift=1.0):
        x = np.asarray(x)
        return np.exp(np.mean(np.log(x + shift))) - shift

    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for b in buckets:
        rows = []
        dfb = df[b["mask"]]
        n_total = len(dfb)

        if n_total == 0:
            continue

        for solver in solvers:
            solved = dfb[solver].dropna().values
            n_solved = len(solved)
            n_to = n_total - n_solved

            runtimes = np.concatenate(
                [
                    solved,
                    np.full(n_to, b["penalty"]),
                ]
            )

            sgm_sec = shifted_geometric_mean(runtimes, shift=shift)

            rows.append(
                {
                    "Solver": solver_label_map.get(solver, solver),
                    "SGM runtime (min)": round(sgm_sec / 60, 2),
                    "# solved": n_solved,
                    "# total": n_total,
                    "% solved": round(100 * n_solved / n_total, 1),
                }
            )

        table = pd.DataFrame(rows)

        print(f"\n{b['name']}")
        display(
            table.style.hide(axis="index").format(
                {
                    "SGM runtime (min)": "{:.2f}",
                    "% solved": "{:.1f}",
                }
            )
        )



def plot_speedup_vs_variables(
    final_with_size,
    figsize=(12, 4),
    outpath="speedup_vs_num_variables.png",
    dpi=300,
):
    """
    Scatter plots of speedup vs number of variables (horizontal layout):

      1) HiPO vs simplex
      2) HiPO vs IPX
      3) HiPO vs Gurobi

    Speedup = runtime_reference / runtime_target
    """

    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for c in ["highs", "highs-hipo", "highs-ipm", "gurobi"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    fig, axes = plt.subplots(1, 3, figsize=figsize, sharey=True)

    # HiPO vs simplex
    ax = axes[0]
    m = (
        df["highs"].notna()
        & df["highs-hipo"].notna()
        & (df["highs"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "highs"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs simplex", fontsize=14, fontweight="bold")

    # HiPO vs IPx
    ax = axes[1]
    m = (
        df["highs-ipm"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-ipm"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "highs-ipm"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs IPX", fontsize=14, fontweight="bold")

    # HiPO vs Gurobi
    ax = axes[2]
    m = (
        df["gurobi"].notna()
        & df["highs-hipo"].notna()
        & (df["gurobi"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. variables"],
        df.loc[m, "gurobi"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs Gurobi", fontsize=14, fontweight="bold")

    # Shared formatting
    for ax in axes:
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.grid(which="both", linestyle="--", linewidth=0.5)
        ax.tick_params(axis="both", which="major", labelsize=11)
        ax.tick_params(axis="both", which="minor", labelsize=9)

    axes[0].set_ylabel("Speedup (-)", fontsize=13)
    for ax in axes:
        ax.set_xlabel("Number of variables (-)", fontsize=12)

    plt.tight_layout()
    plt.savefig(outpath, dpi=dpi, bbox_inches="tight")
    plt.show()


def plot_solver_scaling_by_bucket(
    final_with_size,
    solvers=("gurobi", "highs", "highs-hipo", "highs-ipm"),
    figsize=(10, 15),
):
    """
    Same scatter + log-log fit as the original scaling plot,
    but split by problem size buckets (vertical layout):

        Small  : Num. variables < 1e4
        Medium : 1e4 <= Num. variables < 1e6
        Large  : Num. variables >= 1e6
    """

    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for s in solvers:
        df[s] = pd.to_numeric(df[s], errors="coerce")

    # Define buckets
    buckets = {
        "S benchmarks": df["Num. variables"] < 1e4,
        "M benchmarks": (df["Num. variables"] >= 1e4) & (df["Num. variables"] < 1e6),
        "L benchmarks": df["Num. variables"] >= 1e6,
    }

    fig, axes = plt.subplots(3, 1, figsize=figsize, sharex=False, sharey=True)

    for ax, (bucket_name, mask_bucket) in zip(axes, buckets.items()):
        dfb = df[mask_bucket]

        for s in solvers:
            sdf = dfb[dfb[s].notna() & (dfb[s] > 0)]
            if sdf.empty:
                continue

            x = sdf["Num. variables"].to_numpy()
            y = sdf[s].to_numpy()

            # Scatter
            ax.scatter(x, y, label=s, alpha=0.8)

            # Log-log fit (within bucket)
            lx = np.log10(x)
            ly = np.log10(y)
            mask = np.isfinite(lx) & np.isfinite(ly)

            if mask.sum() < 2:
                continue

            a, b = np.polyfit(lx[mask], ly[mask], 1)

            lx_fit = np.linspace(lx[mask].min(), lx[mask].max(), 100)
            y_fit = 10 ** (a * lx_fit + b)

            ax.plot(10**lx_fit, y_fit)

        ax.set_xscale("log")
        ax.set_yscale("log")

        # Titles
        ax.set_title(bucket_name, fontsize=18, fontweight="bold")

        ax.set_xlabel("Number of variables (-)", fontsize=18)
        ax.set_ylabel("Runtime (s)", fontsize=18)

        # Larger tick labels
        ax.tick_params(axis="both", which="major", labelsize=14)
        ax.tick_params(axis="both", which="minor", labelsize=12)

        ax.grid(which="both", linestyle="--", linewidth=0.5)

    # Legend only once
    axes[-1].legend(fontsize=14, loc="best")

    plt.tight_layout()
    plt.show()


def plot_speedup_vs_constraints(
    final_with_size,
    figsize=(12, 4),
    outpath="speedup_vs_num_constraints.png",
    dpi=300,
):
    """
    Scatter plots of speedup vs number of constraints (horizontal layout):

      1) HiPO vs simplex
      2) HiPO vs IPX
      3) HiPO vs Gurobi

    Speedup = runtime_reference / runtime_target
    """

    df = final_with_size.copy()
    df = df[df["Num. constraints"].notna() & (df["Num. constraints"] > 0)]

    for c in ["highs", "highs-hipo", "highs-ipm", "gurobi"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    fig, axes = plt.subplots(1, 3, figsize=figsize, sharey=True)

    # HiPO vs simplex
    ax = axes[0]
    m = (
        df["highs"].notna()
        & df["highs-hipo"].notna()
        & (df["highs"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "highs"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs simplex", fontsize=14, fontweight="bold")

    # HiPO vs IPM
    ax = axes[1]
    m = (
        df["highs-ipm"].notna()
        & df["highs-hipo"].notna()
        & (df["highs-ipm"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "highs-ipm"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs IPX", fontsize=14, fontweight="bold")

    # HiPO vs Gurobi
    ax = axes[2]
    m = (
        df["gurobi"].notna()
        & df["highs-hipo"].notna()
        & (df["gurobi"] > 0)
        & (df["highs-hipo"] > 0)
    )

    ax.scatter(
        df.loc[m, "Num. constraints"],
        df.loc[m, "gurobi"] / df.loc[m, "highs-hipo"],
        alpha=0.8,
    )

    ax.axhline(1.0, linestyle="--", linewidth=1)
    ax.set_title("HiPO vs Gurobi", fontsize=14, fontweight="bold")

    # Shared formatting
    for ax in axes:
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.grid(which="both", linestyle="--", linewidth=0.5)
        ax.tick_params(axis="both", which="major", labelsize=11)
        ax.tick_params(axis="both", which="minor", labelsize=9)

    axes[0].set_ylabel("Speedup (-)", fontsize=13)
    for ax in axes:
        ax.set_xlabel("Number of constraints (-)", fontsize=12)

    plt.tight_layout()
    plt.savefig(outpath, dpi=dpi, bbox_inches="tight")
    plt.show()


def build_gurobi_hipo_comparison_tables(
    final_with_size,
    top_n=5,
):
    """
    Build two tables:
      1) Largest benchmarks solved by HiPO
      2) Largest benchmarks solved by Gurobi

    Columns:
      - Num. variables
      - Num. constraints
      - Gurobi time (min)
      - HiPO time (min)
      - Gurobi / HiPO speedup
    """

    df = final_with_size.copy()

    # Keep only rows with valid size info
    df = df[
        df["Num. variables"].notna()
        & (df["Num. variables"] > 0)
        & df["Num. constraints"].notna()
        & (df["Num. constraints"] > 0)
    ]

    # Ensure numeric
    df["gurobi"] = pd.to_numeric(df["gurobi"], errors="coerce")
    df["highs-hipo"] = pd.to_numeric(df["highs-hipo"], errors="coerce")

    def _display_table(df_sub, title):
        table = df_sub[
            [
                "Benchmark_clean",
                "Size",
                "Num. variables",
                "Num. constraints",
                "gurobi",
                "highs-hipo",
            ]
        ].copy()

        table = table.rename(columns={"Benchmark_clean": "Benchmark"})
        table["Gurobi time (min)"] = table["gurobi"] / 60
        table["HiPO time (min)"] = table["highs-hipo"] / 60
        table["Gurobi / HiPO speedup"] = table["gurobi"] / table["highs-hipo"]

        table = table.drop(columns=["gurobi", "highs-hipo"])

        print(f"\n{title}")
        display(
            table.sort_values("Num. variables", ascending=False)
            .style.hide(axis="index")
            .format(
                {
                    "Num. variables": "{:,.0f}",
                    "Num. constraints": "{:,.0f}",
                    "Gurobi time (min)": "{:.1f}",
                    "HiPO time (min)": "{:.1f}",
                    "Gurobi / HiPO speedup": "{:.1f}",
                },
                na_rep="N/A",
            )
        )

    # Table 1 — Largest benchmarks solved by HiPO
    hipo_solved = df[df["highs-hipo"].notna() & (df["highs-hipo"] > 0)]
    hipo_largest = hipo_solved.sort_values("Num. variables", ascending=False).head(
        top_n
    )

    _display_table(
        hipo_largest,
        f"Largest {top_n} benchmarks solved by HiPO",
    )

    # Table 2 — Largest benchmarks solved by Gurobi
    gurobi_solved = df[df["gurobi"].notna() & (df["gurobi"] > 0)]
    gurobi_largest = gurobi_solved.sort_values("Num. variables", ascending=False).head(
        top_n
    )

    _display_table(
        gurobi_largest,
        f"Largest {top_n} benchmarks solved by Gurobi",
    )


def plot_solver_scaling_by_bucket_scatter_only(
    final_with_size,
    solvers=("gurobi", "highs", "highs-hipo", "highs-ipm"),
    figsize=(10, 15),
):
    """
    Scatter-only version of the scaling plot, split by problem size buckets,
    WITH log-log trend lines (power-law fits).

        Small  : Num. variables < 1e4
        Medium : 1e4 <= Num. variables < 1e6
        Large  : Num. variables >= 1e6
    """

    df = final_with_size.copy()
    df = df[df["Num. variables"].notna() & (df["Num. variables"] > 0)]

    for s in solvers:
        df[s] = pd.to_numeric(df[s], errors="coerce")

    # Define buckets
    buckets = {
        "Small (<1e4)": df["Num. variables"] < 1e4,
        "Medium (1e4–1e6)": (df["Num. variables"] >= 1e4)
        & (df["Num. variables"] < 1e6),
        "Large (≥1e6)": df["Num. variables"] >= 1e6,
    }

    fig, axes = plt.subplots(3, 1, figsize=figsize, sharey=True)

    for ax, (bucket_name, mask_bucket) in zip(axes, buckets.items()):
        dfb = df[mask_bucket]

        for s in solvers:
            sdf = dfb[dfb[s].notna() & (dfb[s] > 0)]
            if sdf.empty:
                continue

            x = sdf["Num. variables"].values
            y = sdf[s].values

            # Scatter
            ax.scatter(x, y, label=s, alpha=0.8)

            # -------- Trend line (log-log fit) --------
            if len(x) >= 2:
                logx = np.log10(x)
                logy = np.log10(y)

                coeffs = np.polyfit(logx, logy, 1)
                slope, intercept = coeffs

                x_fit = np.logspace(logx.min(), logx.max(), 100)
                y_fit = 10 ** (intercept) * x_fit**slope

                ax.plot(
                    x_fit,
                    y_fit,
                    linestyle="--",
                    linewidth=2,
                    alpha=0.8,
                )

        ax.set_xscale("log")
        ax.set_yscale("log")

        ax.set_title(bucket_name, fontsize=18, fontweight="bold")
        ax.set_xlabel("Number of variables (-)", fontsize=18)
        ax.set_ylabel("Runtime (s)", fontsize=18)

        ax.tick_params(axis="both", which="major", labelsize=14)
        ax.tick_params(axis="both", which="minor", labelsize=12)

        ax.grid(which="both", linestyle="--", linewidth=0.5)

    axes[-1].legend(fontsize=14, loc="best")

    plt.tight_layout()
    plt.show()
