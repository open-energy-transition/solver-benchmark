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
cd /home/$(ls /home)
runuser -l $(ls /home) -c 'git clone https://github.com/open-energy-transition/solver-benchmark.git'

# Install Miniconda
echo "Installing Miniconda..."
runuser -l $(ls /home) -c 'mkdir -p ~/miniconda3'
runuser -l $(ls /home) -c 'wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh'
runuser -l $(ls /home) -c 'bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3'
runuser -l $(ls /home) -c 'rm ~/miniconda3/miniconda.sh'

# Setup conda environment
echo "Setting up conda environment..."
runuser -l $(ls /home) -c 'echo "source ~/miniconda3/bin/activate" >> ~/.bashrc'
runuser -l $(ls /home) -c '~/miniconda3/bin/conda init bash'

# Get benchmark year from instance metadata
BENCHMARK_YEAR=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/benchmark_year")
echo "Using benchmark year: ${BENCHMARK_YEAR}"

# Create conda environment with the appropriate year
runuser -l $(ls /home) -c "cd ~/solver-benchmark/ && ~/miniconda3/bin/conda env create -f runner/envs/benchmark-${BENCHMARK_YEAR}-fixed.yaml"

echo "Setup completed at $(date)"
