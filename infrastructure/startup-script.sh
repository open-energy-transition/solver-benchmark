#!/bin/bash
# Log all output to a file
exec > >(tee /var/log/startup-script.log) 2>&1
echo "Starting setup script at $(date)"

# Update and install packages
echo "Updating packages..."
apt-get update
apt-get install -y tmux git time

# Clone the repository
echo "Cloning repository..."
git clone https://github.com/open-energy-transition/solver-benchmark.git

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

# Get benchmark year from instance metadata
BENCHMARK_YEAR=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_year")
echo "Using benchmark year: ${BENCHMARK_YEAR}"

# Create conda environment with the appropriate year
cd /solver-benchmark/
~/miniconda3/bin/conda env create -f runner/envs/benchmark-${BENCHMARK_YEAR}-fixed.yaml

# Activate the conda environment
echo "Activating conda environment benchmark-${BENCHMARK_YEAR}..."
source ~/miniconda3/bin/activate
conda activate benchmark-${BENCHMARK_YEAR}

# Add auto-activation to .bashrc
echo -e "\n# Automatically activate benchmark environment" >> ~/.bashrc
echo "conda activate benchmark-${BENCHMARK_YEAR}" >> ~/.bashrc

# Verify environment is active
echo "Current conda environment:"
conda info --envs | grep "*"

echo "Setup completed at $(date)"
echo "Conda environment benchmark-${BENCHMARK_YEAR} is now active and will be activated on login"

# Get benchmark filename from instance metadata
BENCHMARK_FILE=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_file")
echo "Using benchmark file: ${BENCHMARK_FILE}"

# Get benchmark content
BENCHMARK_CONTENT=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_content")

# Write the benchmark file - preserve the exact content
echo "${BENCHMARK_CONTENT}" > /solver-benchmark/benchmarks/${BENCHMARK_FILE}

# Run the benchmarks
echo "Starting benchmarks..."
python /solver-benchmark/runner/run_benchmarks.py /solver-benchmark/benchmarks/${BENCHMARK_FILE} ${BENCHMARK_YEAR}

# ----- GCS UPLOAD CONFIGURATION -----
# Check if GCS upload is enabled
ENABLE_GCS_UPLOAD=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/enable_gcs_upload")
if [ "${ENABLE_GCS_UPLOAD}" != "true" ]; then
    echo "GCS upload is disabled. Skipping upload."
    exit 0
fi

# Get the GCS bucket name
GCS_BUCKET_NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/gcs_bucket_name")
echo "Using GCS bucket: ${GCS_BUCKET_NAME}"

# Create timestamp for the file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Using timestamp: ${TIMESTAMP}"

# Create the properly named copy of results
CLEAN_FILENAME=$(basename "${BENCHMARK_FILE}" .yaml)
RESULTS_COPY="/tmp/${CLEAN_FILENAME}_${TIMESTAMP}.csv"
echo "Creating copy of results as: ${RESULTS_COPY}"
cp /solver-benchmark/results/benchmark_results.csv "${RESULTS_COPY}"

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
