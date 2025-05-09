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
            yaml_data = yaml.safe_load(file)
            if not yaml_data:
                print(f"Skipping file with no content: {file_path}")
                return

            benchmark_data = yaml_data["benchmarks"]

            for model_name, model_info in benchmark_data.items():
                sizes = []
                for size in model_info.get("Sizes", []):
                    size_entry = {
                        "Name": size["Name"],
                        "Size": size["Size"],
                        "URL": size["URL"],
                        "Spatial resolution": size.get("Spatial resolution"),
                        "Temporal resolution": size.get("Temporal resolution"),
                        "Realistic": size.get("Realistic"),
                        "Num. constraints": size.get("Num. constraints"),
                        "Num. variables": size.get("Num. variables"),
                    }

                    # Add optional fields if they exist
                    if "Num. continuous variables" in size:
                        size_entry["Num. continuous variables"] = size[
                            "Num. continuous variables"
                        ]
                    if "Num. integer variables" in size:
                        size_entry["Num. integer variables"] = size[
                            "Num. integer variables"
                        ]
                    sizes.append(size_entry)

                # Create metadata entry
                entry = {
                    "Short description": model_info.get("Short description"),
                    "Model name": model_info.get("Model name"),
                    "Version": model_info.get("Version"),
                    "Contributor(s)/Source": model_info.get("Contributor(s)/Source"),
                    "Technique": model_info.get("Technique"),
                    "Kind of problem": model_info.get("Kind of problem"),
                    "Sectors": model_info.get("Sectors"),
                    "Time horizon": model_info.get("Time horizon"),
                    "MILP features": model_info.get("MILP features"),
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

# Wrap the unified metadata in a "benchmarks" key
final_output = {"benchmarks": unified_metadata}

# Write the unified metadata to the results/metadata.yaml file
with open(results_file, "w") as output_file:
    yaml.dump(
        final_output,
        output_file,
        sort_keys=False,
        default_flow_style=False,
        Dumper=BlankNoneDumper,
    )

print(f"Processed {len(unified_metadata)} entries.")
print(f"Unified metadata has been written to {results_file}")
