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
