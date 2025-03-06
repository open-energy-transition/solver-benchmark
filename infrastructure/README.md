# Reproducible Solver Benchmark Infrastructure

This module automates the deployment of VMs on Google Cloud Platform to run energy system model benchmarks. Each VM is provisioned based on YAML configuration files that specify the benchmarks to run.

## Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) installed on your machine
- A Google Cloud Platform account with a project set up
- GCP service account credentials with appropriate permissions
- SSH key pair (optional, for VM access)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/solver-benchmark-infrastructure.git
cd solver-benchmark-infrastructure
```

### 2. Create Your Benchmark Files

Place your benchmark YAML files in the `benchmarks` directory. Example:

```yaml
machine-type: c4-standard-2
year: 2024
benchmarks:
    Short description: Sector-coupled PyPSA-Eur infrastructure run for Italy considering 2050 as single planning horizon (LP, lot of variables, strongly intermeshed constraints)
    Model name: PyPSA-Eur
    Version: 0.13.0 (commit 8f1a6b1)
    Technique: LP
    Kind of problem: Infrastructure
    Sectors: Sector-coupled (power + heating, biomass, industry, transport)
    Time horizon: Single period (1 year)
    MILP features: None
    Sizes:
    - Name: 2-24h
      Size: XS
      URL: https://storage.googleapis.com/solver-benchmarks/pypsa-eur-sec-2-24h.lp
      Temporal resolution: 24
      Spatial resolution: 2
      N. of constraints: 132272
      N. of variables: 63264
    - Name: 6-24h
      Size: XS
      URL: https://storage.googleapis.com/solver-benchmarks/pypsa-eur-sec-2-24h.lp
      Temporal resolution: 24
      Spatial resolution: 6
      N. of constraints: 377463
      N. of variables: 178831
    # ... additional configuration
```

### 3. Set Up Variables

Create a `terraform.tfvars` file with your GCP configuration:

```hcl
project_id           = "your-gcp-project-id"
zone                 = "europe-west4-a"
gcp_service_key_path = "/path/to/your-gcp-credentials.json"
ssh_user             = "your-username"  # Optional
ssh_key_path         = "~/.ssh/id_rsa.pub"  # Optional
```

### 4. Initialize OpenTofu

```bash
tofu init
```

### 5. Plan Your Deployment

```bash
tofu plan
```

This will show you what resources will be created based on your benchmark files.

### 6. Deploy the Infrastructure

```bash
tofu apply
```

### 7. Monitor Your Instances

Once deployed, you'll see the IP addresses of your VMs:

```
Outputs:

instance_ips = {
  "benchmark-instance-pypsa-eur-sec" = "34.90.XX.XX"
  # ...
}
```

### 8. Destroy Infrastructure When Done

Once the benchmarks finish, destroy the infrastructure when benchmarks are complete:

```bash
tofu destroy
```

## Configuration Options

### Benchmark YAML Format

Each YAML file defines a benchmark with specific configuration:

- `machine-type`: GCP machine type to use
- `year`: Benchmark environment year
- `benchmarks`: Model configurations to benchmark

### OpenTofu Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `project_id` | GCP Project ID | *Required* |
| `gcp_service_key_path` | Path to GCP credentials | *Required* |
| `zone` | GCP Zone | europe-west4-a |
| `instance_name` | Base name for instances | benchmark-instance |
| `startup_script_path` | Path to startup script | startup-script.sh |
| `ssh_user` | SSH username | "" |
| `ssh_key_path` | Path to SSH public key | "" |

## Troubleshooting
Check logs with `tail -f /var/log/startup-script.log`
