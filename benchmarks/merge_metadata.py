import argparse
import os
from pathlib import Path

import yaml

# Parse command line arguments
parser = argparse.ArgumentParser(
    description="Merge metadata YAML files into a single file"
)
parser.add_argument(
    "--skip-validation",
    action="store_true",
    help="Skip validation of benchmark entries (default: validation enabled)",
)
args = parser.parse_args()

# Define the directory paths relative to the script location
# Script is in benchmarks/, so we need to go up one level to get to project root
base_dir = Path(__file__).parent.parent
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

# Required fields for benchmark entries
REQUIRED_BENCHMARK_FIELDS = [
    "Short description",
    "Modelling framework",
    "Model name",
    "Version",
    "Contributor(s)/Source",
    "License",
    "Problem class",
    "Application",
    "Sectoral focus",
    "Sectors",
    "Time horizon",
    "MILP features",
    "Sizes",
]

# Required fields for size entries
REQUIRED_SIZE_FIELDS = [
    "Name",
    "Size",
    "URL",
    "Temporal resolution",
    "Spatial resolution",
    "Realistic",
    "Num. constraints",
    "Num. variables",
]


# Helper function to validate a benchmark entry
def validate_benchmark_entry(model_name, model_info, file_path):
    """
    Validate that a benchmark entry has all required fields

    Args:
        model_name: Name of the benchmark model
        model_info: Dictionary containing benchmark information
        file_path: Path to the file being processed (for error reporting)

    Returns:
        True if valid, False otherwise
    """
    # Check if model_info is a dictionary
    if not isinstance(model_info, dict):
        print(f"ERROR in {file_path}: Benchmark '{model_name}' is not a dictionary")
        return False

    # Check for required benchmark fields
    missing_fields = []
    for field in REQUIRED_BENCHMARK_FIELDS:
        if field not in model_info:
            missing_fields.append(field)

    if missing_fields:
        print(
            f"ERROR in {file_path}: Benchmark '{model_name}' missing required fields: {missing_fields}"
        )
        return False

    # Check if this is a MILP problem
    problem_class = model_info.get("Problem class", "")
    is_milp = problem_class == "MILP"

    # Validate Sizes section
    sizes = model_info.get("Sizes")
    if not isinstance(sizes, list):
        print(
            f"ERROR in {file_path}: Benchmark '{model_name}' - 'Sizes' must be a list"
        )
        return False

    # Validate each size entry
    for i, size_entry in enumerate(sizes):
        if not isinstance(size_entry, dict):
            print(
                f"ERROR in {file_path}: Benchmark '{model_name}' - Size entry {i} is not a dictionary"
            )
            return False

        # Start with base required fields
        required_fields = REQUIRED_SIZE_FIELDS.copy()

        # Add MILP-specific fields if this is a MILP problem
        if is_milp:
            required_fields.extend(
                ["Num. continuous variables", "Num. integer variables"]
            )

        missing_size_fields = []
        for field in required_fields:
            if field not in size_entry:
                missing_size_fields.append(field)

        if missing_size_fields:
            size_name = size_entry.get("Name", f"entry {i}")
            print(
                f"ERROR in {file_path}: Benchmark '{model_name}' - Size '{size_name}' missing required fields: {missing_size_fields}"
            )
            return False

        # Validate Realistic motivation when Realistic is true
        realistic = size_entry.get("Realistic", False)
        if realistic is True:  # Explicitly check for boolean True
            realistic_motivation = size_entry.get("Realistic motivation", "")
            if (
                not realistic_motivation
                or not isinstance(realistic_motivation, str)
                or realistic_motivation.strip() == ""
            ):
                size_name = size_entry.get("Name", f"entry {i}")
                print(
                    f"ERROR in {file_path}: Benchmark '{model_name}' - Size '{size_name}' has Realistic=true but missing, empty, or placeholder 'Realistic motivation'"
                )
                return False

    return True


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

            # Check if 'benchmarks' section exists
            if "benchmarks" not in yaml_data:
                print(f"No 'benchmarks' section found in: {file_path}")
                return

            benchmark_data = yaml_data["benchmarks"]

            # Process benchmark entries with optional validation
            for model_name, model_info in benchmark_data.items():
                # Skip validation if requested
                if args.skip_validation:
                    # Check for duplicate benchmark names
                    if model_name in unified_metadata:
                        print(
                            f"WARNING: Duplicate benchmark name '{model_name}' found in {file_path}. Overwriting previous entry."
                        )

                    unified_metadata[model_name] = model_info
                else:
                    # Validate entry before adding
                    if validate_benchmark_entry(model_name, model_info, file_path):
                        # Check for duplicate benchmark names
                        if model_name in unified_metadata:
                            print(
                                f"WARNING: Duplicate benchmark name '{model_name}' found in {file_path}. Overwriting previous entry."
                            )

                        unified_metadata[model_name] = model_info
                    else:
                        print(
                            f"Skipping invalid benchmark '{model_name}' from {file_path}"
                        )

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
if args.skip_validation:
    print("Validation was skipped.")
else:
    print("Validation was enabled.")
print(f"Unified metadata has been written to {results_file}")
