#!/bin/bash
# Log all output to a file
exec > >(tee /var/log/startup-script.log) 2>&1
echo "Starting setup script at $(date)"

# Update and install packages
echo "Updating packages..."
apt-get update
apt-get install -y tmux git time curl jq

# Clone the repository
echo "Cloning repository..."
git clone https://github.com/open-energy-transition/solver-benchmark.git

# Install a global highs binary for reference runs
echo "Installing Highs..."
mkdir -p /opt/highs/bin
curl -L "https://github.com/JuliaBinaryWrappers/HiGHSstatic_jll.jl/releases/download/HiGHSstatic-v1.10.0%2B0/HiGHSstatic.v1.10.0.x86_64-linux-gnu-cxx11.tar.gz" -o HiGHSstatic.tar.gz
tar -xzf HiGHSstatic.tar.gz -C /opt/highs/
chmod +x /opt/highs/bin/highs
/opt/highs/bin/highs --version

# Downloading benchmark reference model
curl -L "https://storage.googleapis.com/solver-benchmarks/benchmark-test-model.lp" -o benchmark-test-model.lp

# Install Miniconda
echo "Installing Miniconda..."
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh

# Setup conda environment
echo "Setting up conda environment..."
echo "source ~/miniconda3/bin/activate" >> ~/.bashrc
~/miniconda3/bin/conda init bash

# Get benchmark years from instance metadata
BENCHMARK_YEARS_JSON=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_years")
echo "Retrieved benchmark years: ${BENCHMARK_YEARS_JSON}"

# Parse the JSON array into a space-separated string for benchmark_all.sh
BENCHMARK_YEARS_STR=$(echo "${BENCHMARK_YEARS_JSON}" | jq -r 'join(" ")')
echo "Parsed benchmark years: ${BENCHMARK_YEARS_STR}"

# Get benchmark filename from instance metadata
BENCHMARK_FILE=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_file")
echo "Using benchmark file: ${BENCHMARK_FILE}"

# Get reference benchmark interval from instance metadata
REFERENCE_BENCHMARK_INTERVAL=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/reference_benchmark_interval")
echo "Reference benchmark interval: ${REFERENCE_BENCHMARK_INTERVAL} seconds"

# Get benchmark content
BENCHMARK_CONTENT=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_content")

# Write the benchmark file - preserve the exact content
echo "${BENCHMARK_CONTENT}" > /solver-benchmark/benchmarks/${BENCHMARK_FILE}

# Make benchmark_all.sh executable
cd /solver-benchmark/
chmod +x ./runner/benchmark_all.sh

# Run the benchmark_all.sh script with our years
echo "Starting benchmarks for years: ${BENCHMARK_YEARS_STR}"
source ~/miniconda3/bin/activate
./runner/benchmark_all.sh -y "${BENCHMARK_YEARS_STR}" -r "${REFERENCE_BENCHMARK_INTERVAL}" ./benchmarks/"${BENCHMARK_FILE}"
BENCHMARK_EXIT_CODE=$?

if [ $BENCHMARK_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Benchmark failed with exit code $BENCHMARK_EXIT_CODE at $(date)"
    exit $BENCHMARK_EXIT_CODE
fi

echo "All benchmarks completed at $(date)"

# Create timestamp for the results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Using timestamp: ${TIMESTAMP}"

# Create a copy of results with timestamp
CLEAN_FILENAME=$(basename "${BENCHMARK_FILE}" .yaml)
RESULTS_COPY="/tmp/${CLEAN_FILENAME}_${TIMESTAMP}.csv"
echo "Creating copy of results as: ${RESULTS_COPY}"

cp /solver-benchmark/results/benchmark_results.csv "${RESULTS_COPY}"
COPY_EXIT_CODE=$?

if [ $COPY_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Failed to copy benchmark results at $(date). Exit code: $COPY_EXIT_CODE"
    echo "Check if file exists: /solver-benchmark/results/benchmark_results.csv"
    ls -la /solver-benchmark/results/
    exit $COPY_EXIT_CODE
fi

echo "Benchmark results successfully copied at $(date)"

# ----- GCS UPLOAD CONFIGURATION -----
# Only proceed if the benchmark and copy operations were successful
# Check if GCS upload is enabled
ENABLE_GCS_UPLOAD=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/enable_gcs_upload")
if [ "${ENABLE_GCS_UPLOAD}" == "true" ]; then
    # Get the GCS bucket name
    GCS_BUCKET_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/gcs_bucket_name")
    echo "Using GCS bucket: ${GCS_BUCKET_NAME}"

    # Ensure gsutil is available (should be on GCP instances by default)
    if ! command -v gsutil &> /dev/null; then
        echo "Installing Google Cloud SDK..."
        apt-get install -y apt-transport-https ca-certificates gnupg curl
        echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
        curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
        apt-get update && apt-get install -y google-cloud-sdk
    fi

    # Upload the results file to GCS bucket
    echo "Uploading results to GCS bucket..."
    gsutil cp "${RESULTS_COPY}" gs://${GCS_BUCKET_NAME}/

    # Verify the upload
    if [ $? -eq 0 ]; then
        echo "Upload successfully completed at $(date)"
        echo "File available at: gs://${GCS_BUCKET_NAME}/$(basename ${RESULTS_COPY})"
    else
        echo "Upload failed at $(date)"
        echo "Check VM service account permissions for the GCS bucket"
    fi
else
    echo "GCS upload is disabled. Skipping upload."
fi

# ----- AUTO-DESTROY CONFIGURATION -----
AUTO_DESTROY=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/auto_destroy_vm")
if [ "${AUTO_DESTROY}" == "true" ]; then
    echo "Auto-destroy is enabled. VM will be destroyed after script completion."

    INSTANCE_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/name")
    PROJECT_ID=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/project_id")
    ZONE=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/zone")

    echo "Preparing to destroy instance: ${INSTANCE_NAME} in zone: ${ZONE}, project: ${PROJECT_ID}"

    # Schedule deletion to happen after this script finishes
    nohup bash -c "sleep 30 && curl -X DELETE \
      -H 'Authorization: Bearer $(curl -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token | jq -r .access_token)' \
      -H 'Content-Type: application/json' \
      https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/zones/${ZONE}/instances/${INSTANCE_NAME} \
      > /var/log/self-destruct.log 2>&1" &

    echo "VM self-destruct scheduled. Will execute in 30 seconds."
    echo "Benchmark completed successfully at $(date)"
else
    echo "Auto-destroy is disabled. VM will remain running."
    echo "Benchmark completed successfully at $(date)"
fi
