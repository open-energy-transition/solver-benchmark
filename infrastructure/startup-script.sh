#!/bin/bash
# Log all output to a file
exec > >(tee /var/log/startup-script.log) 2>&1
echo "Starting setup script at $(date)"
start_time=$(date +%s)

# Generate a unique run ID using timestamp and instance ID
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
INSTANCE_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/name")
RUN_ID="${TIMESTAMP}_${INSTANCE_NAME}"
echo "Generated unique run ID: ${RUN_ID}"

# Update and install packages
echo "Updating packages..."
apt-get -qq update
apt-get -qq install -y tmux git time curl jq build-essential cmake

# Set up Gurobi license
mkdir -p /opt/gurobi
gsutil cp gs://solver-benchmarks-restricted/gurobi-benchmark-40-session.lic /opt/gurobi/gurobi.lic

# Clone the repository
echo "Cloning repository..."
git clone --depth=1 -b highs-hipo-runs https://github.com/open-energy-transition/solver-benchmark.git

# Install a global highs binary for reference runs
echo "Installing Highs..."
mkdir -p /opt/highs/bin
curl -L "https://github.com/JuliaBinaryWrappers/HiGHSstatic_jll.jl/releases/download/HiGHSstatic-v1.10.0%2B0/HiGHSstatic.v1.10.0.x86_64-linux-gnu-cxx11.tar.gz" -o HiGHSstatic.tar.gz
tar -xzf HiGHSstatic.tar.gz -C /opt/highs/
chmod +x /opt/highs/bin/highs
/opt/highs/bin/highs --version

# Install additional HiGHS from hipo branch with dependencies
echo "Installing HiGHS from hipo branch with required dependencies..."

# Set up working directory
HIGHS_HIPO_DIR="/opt/highs-hipo-workspace"
mkdir -p "${HIGHS_HIPO_DIR}"
cd "${HIGHS_HIPO_DIR}"

# Install BLAS dependency
echo "Installing BLAS..."
apt-get -qq install -y libblas-dev

# 1. Clone GKLib
echo "Cloning GKLib..."
git clone https://github.com/KarypisLab/GKlib.git

# 2. Clone METIS
echo "Cloning METIS..."
git clone https://github.com/KarypisLab/METIS.git

# 3. Create installs directory
echo "Creating installs directory..."
mkdir -p installs

# 4. Install GKLib shared (using shared approach due to linking errors)
echo "Installing GKLib as shared library..."
cd GKlib
make config shared=1 prefix="${HIGHS_HIPO_DIR}/installs"
make
make install
cd "${HIGHS_HIPO_DIR}"

# Check if shared library link is needed and create it
if [ ! -f "${HIGHS_HIPO_DIR}/installs/lib/libGKlib.so" ] && [ -f "${HIGHS_HIPO_DIR}/installs/lib/libGKlib.so.0" ]; then
    echo "Creating symlink for libGKlib.so..."
    ln -sf "${HIGHS_HIPO_DIR}/installs/lib/libGKlib.so.0" "${HIGHS_HIPO_DIR}/installs/lib/libGKlib.so"
fi

# 5. Install METIS shared
echo "Installing METIS as shared library..."
cd METIS
make config shared=1 gklib_path="${HIGHS_HIPO_DIR}/installs" prefix="${HIGHS_HIPO_DIR}/installs"
make
make install
cd "${HIGHS_HIPO_DIR}"

# 6. Verify dependencies installation
echo "Verifying dependencies installation..."
ls -la "${HIGHS_HIPO_DIR}/installs"
ls -la "${HIGHS_HIPO_DIR}/installs/lib"

# 7. Clone and build HiGHS with hipo support
echo "Cloning HiGHS repository..."
git clone https://github.com/ERGO-Code/HiGHS.git
cd HiGHS

# Checkout the hipo branch
echo "Checking out hipo branch..."
git checkout hipo

# 8. Configure HiGHS with HIPO enabled and dependency paths
echo "Configuring HiGHS with HIPO support..."
cmake -S. -B build \
      -DHIPO=ON \
      -DMETIS_ROOT="${HIGHS_HIPO_DIR}/installs" \
      -DGKLIB_ROOT="${HIGHS_HIPO_DIR}/installs"
cmake --build build

# Verify the installation
echo "Verifying HiGHS hipo installation..."
"${HIGHS_HIPO_DIR}/HiGHS/build/bin/highs" --version
echo "HiGHS hipo installation completed"

# Go back to root directory
cd /

# Downloading benchmark reference model
curl -L "https://storage.googleapis.com/solver-benchmarks/benchmark-test-model.lp" -o benchmark-test-model.lp

# Install Miniconda
echo "Installing Miniconda..."
mkdir -p ~/miniconda3
wget -nv https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm ~/miniconda3/miniconda.sh

# Setup conda environment
echo "Setting up conda environment..."
echo "source ~/miniconda3/bin/activate" >> ~/.bashrc
~/miniconda3/bin/conda init bash
echo "Elapsed: $(($(date +%s)-start_time))s"

# Accept Anaconda Terms of Service to avoid interactive prompts
echo "Accepting Anaconda Terms of Service..."
~/miniconda3/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
~/miniconda3/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r

# Accept Anaconda Terms of Service to avoid interactive prompts
echo "Accepting Anaconda Terms of Service..."
~/miniconda3/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
~/miniconda3/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r

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

# Run the benchmark_all.sh script with our years and the run_id
echo "Starting benchmarks for years: ${BENCHMARK_YEARS_STR} with run_id: ${RUN_ID}"
source ~/miniconda3/bin/activate
./runner/benchmark_all.sh -y "${BENCHMARK_YEARS_STR}" -r "${REFERENCE_BENCHMARK_INTERVAL}" -u "${RUN_ID}" ./benchmarks/"${BENCHMARK_FILE}"
BENCHMARK_EXIT_CODE=$?

if [ $BENCHMARK_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Benchmark failed with exit code $BENCHMARK_EXIT_CODE at $(date)"
fi

echo "All benchmarks completed at $(date)"
echo "Elapsed: $(($(date +%s)-start_time))s"

# Create a copy of results
CLEAN_FILENAME=$(basename "${BENCHMARK_FILE}" .yaml)
RESULTS_COPY="/tmp/${CLEAN_FILENAME}.csv"
echo "Creating copy of results as: ${RESULTS_COPY}"

cp /solver-benchmark/results/benchmark_results.csv "${RESULTS_COPY}"
COPY_EXIT_CODE=$?

if [ $COPY_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Failed to copy benchmark results at $(date). Exit code: $COPY_EXIT_CODE"
    echo "Check if file exists: /solver-benchmark/results/benchmark_results.csv"
    ls -la /solver-benchmark/results/
fi

echo "Benchmark results successfully copied at $(date)"
echo "Elapsed: $(($(date +%s)-start_time))s"

# ----- GCS UPLOAD CONFIGURATION -----
# Check if GCS upload is enabled
ENABLE_GCS_UPLOAD=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/enable_gcs_upload")
if [ "${ENABLE_GCS_UPLOAD}" == "true" ]; then
    # Get the GCS bucket name
    GCS_BUCKET_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/gcs_bucket_name")
    echo "Using GCS bucket: ${GCS_BUCKET_NAME}"

    # Get the instance name for file names
    INSTANCE_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/name")

    # Ensure gsutil is available (should be on GCP instances by default)
    if ! command -v gsutil &> /dev/null; then
        echo "Installing Google Cloud SDK..."
        apt-get install -y apt-transport-https ca-certificates gnupg curl
        echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
        curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
        apt-get update && apt-get install -y google-cloud-sdk
    fi

    # Create a temporary directory for compressed files
    COMPRESSED_DIR="/tmp/compressed_benchmark_files"
    mkdir -p "${COMPRESSED_DIR}/logs"
    mkdir -p "${COMPRESSED_DIR}/solutions"

    # Only upload the results file if benchmark was successful
    if [ $BENCHMARK_EXIT_CODE -eq 0 ]; then
        # Upload the results file to GCS bucket
        echo "Uploading results CSV to GCS bucket..."
        RESULTS_FILENAME="${INSTANCE_NAME}-result.csv"
        gsutil cp "${RESULTS_COPY}" "gs://${GCS_BUCKET_NAME}/results/${RUN_ID}/${RESULTS_FILENAME}"

        if [ $? -eq 0 ]; then
            echo "Results CSV upload successfully completed at $(date)"
            echo "File available at: gs://${GCS_BUCKET_NAME}/results/${RUN_ID}/${RESULTS_FILENAME}"
        else
            echo "Results CSV upload failed at $(date)"
            echo "Check VM service account permissions for the GCS bucket"
        fi
    else
        echo "Skipping results CSV upload because benchmark failed with exit code $BENCHMARK_EXIT_CODE"
    fi

    # Compress and upload benchmarks log files
    echo "Processing benchmarks log files..."
    find /solver-benchmark/runner/logs/ -type f -name "*.log" | while read log_file; do
        filename=$(basename "${log_file}")
        compressed_file="${COMPRESSED_DIR}/logs/${filename}.gz"

        echo "Compressing ${log_file} to ${compressed_file}..."
        gzip -c "${log_file}" > "${compressed_file}"

        echo "Uploading ${compressed_file} to GCS bucket..."

        # Check if file contains "gurobi" in the name
        if [[ "${filename}" == *"gurobi"* ]]; then
            echo "File contains 'gurobi' in name, storing in restricted folder..."
            gsutil cp "${compressed_file}" "gs://${GCS_BUCKET_NAME}-restricted/logs/${RUN_ID}/${filename}.gz"
        else
            gsutil cp "${compressed_file}" "gs://${GCS_BUCKET_NAME}/logs/${RUN_ID}/${filename}.gz"
        fi

        if [ $? -eq 0 ]; then
            echo "Successfully uploaded ${filename}.gz"
        else
            echo "Failed to upload ${filename}.gz"
        fi
    done

    # Compress and upload solution files
    echo "Processing solution files..."
    find /solver-benchmark/runner/solutions/ -type f -name "*.sol" | while read sol_file; do
        filename=$(basename "${sol_file}")
        compressed_file="${COMPRESSED_DIR}/solutions/${filename}.gz"

        echo "Compressing ${sol_file} to ${compressed_file}..."
        gzip -c "${sol_file}" > "${compressed_file}"

        echo "Uploading ${compressed_file} to GCS bucket..."

        gsutil cp "${compressed_file}" "gs://${GCS_BUCKET_NAME}/solutions/${RUN_ID}/${filename}.gz"

        if [ $? -eq 0 ]; then
            echo "Successfully uploaded ${filename}.gz"
        else
            echo "Failed to upload ${filename}.gz"
        fi
    done

    # Compress and upload the startup script log
    echo "Processing startup script log..."
    STARTUP_LOG_FILE="/var/log/startup-script.log"
    if [ -f "${STARTUP_LOG_FILE}" ]; then
        STARTUP_LOG_FILENAME="${INSTANCE_NAME}-startup-script.log.gz"
        COMPRESSED_STARTUP_LOG="${COMPRESSED_DIR}/${STARTUP_LOG_FILENAME}"

        echo "Compressing ${STARTUP_LOG_FILE} to ${COMPRESSED_STARTUP_LOG}..."
        gzip -c "${STARTUP_LOG_FILE}" > "${COMPRESSED_STARTUP_LOG}"

        echo "Uploading ${COMPRESSED_STARTUP_LOG} to GCS bucket..."
        gsutil cp "${COMPRESSED_STARTUP_LOG}" "gs://${GCS_BUCKET_NAME}/logs/${RUN_ID}/${STARTUP_LOG_FILENAME}"

        if [ $? -eq 0 ]; then
            echo "Successfully uploaded startup script log as ${STARTUP_LOG_FILENAME}"
        else
            echo "Failed to upload startup script log"
        fi
    else
        echo "Warning: Startup script log file not found at ${STARTUP_LOG_FILE}"
    fi

    # Clean up temporary compressed files
    rm -rf "${COMPRESSED_DIR}"
    echo "Compression and upload of all benchmark files completed"
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
