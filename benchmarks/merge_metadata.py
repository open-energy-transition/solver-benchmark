import os
from pathlib import Path

import yaml

# Define the directory paths
base_dir = Path.cwd()
benchmarks_dir = base_dir / "benchmarks"
results_file = base_dir / "results" / "metadata.yaml"

# Ensure benchmarks directory exists
if not benchmarks_dir.exists():
    print(f"Benchmarks directory not found: {benchmarks_dir}")
    exit(1)

# Create results directory if it doesn't exist
results_file.parent.mkdir(parents=True, exist_ok=True)

# Dictionary to store unified metadata
unified_metadata = {}


# Helper function to process a single YAML file
def process_yaml_file(file_path):
    if os.path.getsize(file_path) == 0:
        print(f"Skipping empty file: {file_path}")
        return

    try:
        with open(file_path, "r") as file:
            benchmark_data = yaml.safe_load(file)
            if not benchmark_data:
                print(f"Skipping file with no content: {file_path}")
                return

            for model_name, model_info in benchmark_data.items():
                sizes = []
                for size in model_info.get("Sizes", []):
                    size_entry = {
                        "Name": size["Name"],
                        "Size": size["Size"],
                        "URL": size["URL"],
                        "Spatial resolution": size.get("Spatial resolution"),
                        "Temporal resolution": size.get("Temporal resolution"),
                        "N. of constraints": size.get("N. of constraints", None),
                        "N. of variables": size.get("N. of variables", None),
                    }

                    # Add optional fields if they exist
                    # if "N. of variables" in size:
                    #     size_entry["N. of variables"] = size["N. of variables"]
                    if "N. of continuous variables" in size:
                        size_entry["N. of continuous variables"] = size[
                            "N. of continuous variables"
                        ]
                    if "N. of integer variables" in size:
                        size_entry["N. of integer variables"] = size[
                            "N. of integer variables"
                        ]
                    if "N. of binary variables" in size:
                        size_entry["N. of binary variables"] = size[
                            "N. of binary variables"
                        ]
                    sizes.append(size_entry)

                # Create metadata entry
                entry = {
                    "Short description": model_info.get("Short description", None),
                    "Model name": model_info.get("Model name", None),
                    "Version": model_info.get("Version", None),
                    "Technique": model_info.get("Technique", None),
                    "Kind of problem": model_info.get("Kind of problem", None),
                    "Sectors": model_info.get("Sectors", None),
                    "Time horizon": model_info.get("Time horizon", None),
                    "MILP features": model_info.get("MILP features", None),
                    "Sizes": sizes,
                }
                # Add entry to unified metadata
                unified_metadata[model_name] = entry

    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {file_path}: {e}")


# Process all [Mm]etadata*.yaml files recursively under benchmarks
for file_path in sorted(benchmarks_dir.rglob("[Mm]etadata*.yaml")):
    process_yaml_file(file_path)


# Customize YAML dumper to handle `None` values as blank
class BlankNoneDumper(yaml.Dumper):
    def represent_none(self, _):
        return self.represent_scalar("tag:yaml.org,2002:null", "")


yaml.add_representer(type(None), BlankNoneDumper.represent_none, Dumper=BlankNoneDumper)

# Write the unified metadata to the results/metadata.yaml file
with open(results_file, "w") as output_file:
    yaml.dump(
        unified_metadata,
        output_file,
        sort_keys=False,
        default_flow_style=False,
        Dumper=BlankNoneDumper,
    )

print(f"Processed {len(unified_metadata)} entries.")
print(f"Unified metadata has been written to {results_file}")
