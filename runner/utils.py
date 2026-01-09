import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yaml
from humanize import naturaldelta
from matplotlib.patches import Patch

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


def plot_runtime_slowdowns(df, cls="", figsize=(12, 6), max_num_solvers=5):
    """Plots relative runtimes (slowdown factors) in a bar chart.

    Expects df to have columns: Benchmark, Solver, Runtime (s), Status, Timeout
    """
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

    width = 1 / (max_num_solvers + 1)  # the width of the bars

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
        # Compute x-axis offsets
        xs = i + (np.arange(num_solvers) * width) - 0.5 + width
        # Pick colors based on solvers
        seen_solvers.update(benchmark_data["Solver"])
        colors = [
            color_map[r["Solver"]]
            if r["Status"] == "ok"
            else (color_map[r["Solver"]], 0.2)
            for _, r in benchmark_data.iterrows()
        ]
        ax.bar(xs, benchmark_data["Slowdown"], width, color=colors)
        # Add text labels on top of bars
        for i, x in enumerate(xs):
            y = benchmark_data.iloc[i]["Slowdown"] + 0.5
            if benchmark_data.iloc[i]["Status"] == "ok":
                label = f"{benchmark_data.iloc[i]['Slowdown']:.1f}x"
                kwargs = {}
            else:
                # y = 1.1
                label = benchmark_data.iloc[i]["Status"]
                kwargs = {"color": "red", "weight": "bold"}
            ax.text(
                x,
                y,
                label,
                ha="center",
                **kwargs,
            )
            if "Solved Instances" in df.columns:
                solved = benchmark_data.iloc[i]["Solved Instances"].split()[0]
                ax.text(x, y + max_slowdown * 0.03, solved, ha="center", color="grey")

    # Set x-ticks and labels
    xlabels = [
        f"{r['Benchmark']}\nFastest solver: {naturaldelta(r['Runtime (s)'])}"
        for _, r in sorted_benchmarks.iterrows()
    ]
    ax.set_xticks(np.arange(len(sorted_benchmarks)), xlabels)

    # Add labels and title
    ax.set_ylabel("Relative Runtime (normalized)")
    ax.set_title("Solver Runtime Comparison" + (f" – {cls}" if cls else ""))
    ax.legend(
        handles=[
            Patch(color=c, label=s) for s, c in color_map.items() if s in seen_solvers
        ],
        title="Solver",
        loc="upper left",
    )


def plot_summary_results(summary_df, cls, label_map=None, max_num_solvers=5):
    # TODO add percentage instances solved above/below the bars?
    # Add the columns expected by the plotting function
    lp_summary = summary_df.query(f'Class == "{cls}"').copy()
    # TODO add num-probs and timeout to labels in a less hacky way
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
    lp_summary["Timeout"] = None  # Irrelevant, it's only used if Status != ok
    plot_runtime_slowdowns(
        lp_summary, cls=cls, figsize=(20, 6), max_num_solvers=max_num_solvers
    )
