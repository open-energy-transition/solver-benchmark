# Reproducible Solver Benchmark Infrastructure

This module automates the deployment of VMs on Google Cloud Platform to run energy system model benchmarks. Each VM is provisioned based on YAML configuration files that specify the benchmarks to run.

## Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) installed on your machine
- A Google Cloud Platform account with a project set up
- SSH key pair (optional, for VM access)

## Quick Start

### 1. Set up GCP Application Default Credentials

To set up Google Cloud Application Default Credentials (ADC) for local development and scripts, you can use either your own user account or a service account.

This method stores credentials in ~/.config/gcloud/application_default_credentials.json for use by Google Cloud client libraries. Opentofu will use these credentials to authenticate with GCP.

```
# Use your personal account, open browser to authenticate your Google account
gcloud auth application-default login

# Use a service account
gcloud auth login --quiet --force --update-adc --cred-file "$GOOGLE_APPLICATION_CREDENTIALS"
```

### 1. Clone the Repository

```bash
cd infra
```

### 2. Create Your Benchmark Files

2.1. Create a directory for your benchmarking session in `infrastructure/benchmarks` directory
```
mkdir infrastructure/benchmarks/sample_run
```

2.2 Place your benchmark YAML files in the `benchmarks` directory. Example:

```yaml
machine-type: c4-standard-2
years:
- 2025
solver: highs scip # solvers to run, runs all the default solvers in benchmark_all.sh if not specified
benchmarks:
  genx-3_three_zones_w_co2_capture-no_uc:
    Sizes:
    - Name: 3-1h
      Size: M
      URL: https://storage.googleapis.com/solver-benchmarks/genx-3_three_zones_w_co2_capture-no_uc.lp
  Sienna_modified_RTS_GMLC_DA_sys_NetTransport_Horizon24_Day314:
    Sizes:
    - Name: 1-1h
      Size: M
      URL: https://raw.githubusercontent.com/jump-dev/open-energy-modeling-benchmarks/main/instances/Sienna_modified_RTS_GMLC_DA_sys_NetTransport_Horizon24_Day314-868ad371df2ae99f1427c0d6f5d6af4f1c520d51224598e1dc085b0736df5955.mps.gz
```

### 3. Set Up Opentofu Variables

### OpenTofu Variables

| Variable                       | Description                                                                     | Default                                                   |
|--------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------|
| `project_id`                   | GCP Project ID                                                                  | *Required*                                                |
| `zone`                         | GCP Zone (Will be overriden if a value is specified in the input metadata file) | europe-west4-a                                            |
| `instance_name`                | Base name for instances                                                         | benchmark-instance                                        |
| `startup_script_path`          | Path to startup script                                                          | startup-script.sh                                         |
| `enable_gcs_upload`            | Enable/disable results upload to GCS bucket                                     | true                                                      |
| `gcs_bucket_name`              | Name of the GCS bucket to upload the results                                    | solver-benchmarks                                         |
| `auto_destroy_vm`              | Enable/disable auto deletion of VM on benchmark completion                      | true                                                      |
| `reference_benchmark_interval` | Time interval in seconds to run the reference benchmark                         | 3600                                                      |
| `ssh_user`                     | SSH username                                                                    | ""                                                        |
| `ssh_key_path`                 | Path to SSH public key                                                          | ""                                                        |
| `run_id`                       | Run ID for the benchmarking session                                             | 20251106_153156_batch (calculated from current date-time) |


Create a `run.tfvars` file with your GCP configuration:

```hcl
project_id = "your-gcp-project"
# This will be overriden if a value is specified in the input metadata file
zone = "europe-west4-a"

# Optional
run_id = "my_benchmark_run" # calcuated from current time if not provided

# Setting enable_gcs_uploads to true results and log artifacts to `gcs`
# results are available at gs://<gcs_bucket_name>/results/<run_id>
# logs are available at 'gs://<gcs_bucket_name>/logs/<run_id>
enable_gcs_upload = true
auto_destroy_vm = false # destroys the VM after running benchmarks and uploading artifacts
benchmarks_dir = "benchmarks/sample_run"
```

### 4. Initialize OpenTofu

```bash
tofu init
```
### 5. Provision and submit your benchmarking session

```bash
tofu apply -var-file benchmarks/sample_run/run.tfvars

google_compute_instance.benchmark_instances["standard-00"]: Creating...
google_compute_instance.benchmark_instances["standard-01"]: Creating...
google_compute_instance.benchmark_instances["standard-01"]: Still creating... [10s elapsed]
google_compute_instance.benchmark_instances["standard-00"]: Still creating... [10s elapsed]
google_compute_instance.benchmark_instances["standard-01"]: Still creating... [20s elapsed]
google_compute_instance.benchmark_instances["standard-00"]: Still creating... [20s elapsed]
google_compute_instance.benchmark_instances["standard-00"]: Creation complete after 21s [id=projects/your-gcp-project/zones/europe-west4-a/instances/benchmark-instance-standard-00]
google_compute_instance.benchmark_instances["standard-01"]: Creation complete after 21s [id=projects/your-gcp-project/zones/europe-west4-a/instances/benchmark-instance-standard-01]

Apply complete! Resources: 2 added, 0 changed, 0 destroyed.

Outputs:

instance_ips = {
  "standard-00" = "34.xxx.xxx.xxx"
  "standard-01" = "34.xxx.xxx.xxx"
}
run_id = "20251106_153156_batch"
```

### 7. Monitor Your Instances

Once deployed, you'll see the IP addresses/instance FQDN of your VMs and the `run_id`
You can use this to ssh into your machines to examine the benchmark process

### 8. Destroy Infrastructure When Done

Once the benchmarks finish, by default the VM will auto delete its self. If you change `auto_destroy_vm`
to `false` in the configuration option, you can delete the whole infrastructure with:

```bash
tofu destroy -var-file benchmarks/sample_run/run.tfvars
```

## Configuration Options

### Benchmark YAML Format

Each YAML file defines a benchmark with specific configuration:

- `machine-type`: GCP machine type to use
- `year`: Benchmark environment year
- `benchmarks`: Model configurations to benchmark

## Troubleshooting

```bash
gcloud compute ssh projects/your-gcp-project/zones/europe-west4-a/instances/benchmark-instance-standard-01
tail -f /var/log/startup-script.log # overall progress
tail -f /solver-benchmark/runner/logs/* # solver logs
tail -f /solver-benchmark/results/benchmark_results.csv # benchmark results for the VM
```
