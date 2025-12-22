import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import yaml


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

    print(f"\n{len(hung_vms)} potentially hung instances:\n{'\n'.join(hung_vms)}")


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
