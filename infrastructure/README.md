# Benchmark infrastructure

The OpenTofu configuration in `main.tf` creates one Google Cloud VM per benchmark YAML file of a campaign. Each VM runs `startup-script.sh`, which:

1. installs the dependencies, pixi, the Gurobi license and the HiGHS binary of the reference benchmark;
2. clones this repository at `git_ref`;
3. runs `runner.benchmark` on the VM's problems, with its years and solver configurations;
4. uploads the results, logs and solutions to the `results/`, `logs/` and `solutions/` folders of `gs://<gcs_bucket_name>/`, under `<run_id>/`, and the Gurobi logs to `gs://<gcs_bucket_name>-restricted/logs/<run_id>/`;
5. deletes the VM, if `auto_destroy_vm` is set.

Campaigns are usually created with the campaign generator: see [benchmarks/CAMPAIGNS.md](../benchmarks/CAMPAIGNS.md). Only maintainers launch them, as they cost money.

## Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) and the [gcloud CLI](https://cloud.google.com/sdk/docs/install).
- A Google Cloud project, and Application Default Credentials, which OpenTofu uses:

  ```bash
  gcloud auth application-default login   # your own account
  gcloud auth login --quiet --force --update-adc --cred-file "$GOOGLE_APPLICATION_CREDENTIALS"   # a service account
  ```

- Optionally, an SSH key pair to log in to the VMs.

## Benchmark YAML format

Each YAML file in `benchmarks_dir` becomes a VM named `<instance_name>-<file name>`. For example, [`benchmarks/sample_run/standard-00.yaml`](benchmarks/sample_run/standard-00.yaml):

```yaml
machine-type: c4-standard-2
years:
- 2025
solver_configuration: highs-default scip-default
problems:
  genx-3_three_zones_w_co2_capture-no_uc-3-1h:
    Problem class: LP
    Size: M
    URL: https://storage.googleapis.com/solver-benchmarks/instances/genx-3_three_zones_w_co2_capture-no_uc-3-1h.lp.gz
```

| Field | Description |
|---|---|
| `machine-type` | Machine type of the VM. Default: `c4-standard-2`. |
| `zone` | Zone of the VM. Default: the `zone` variable. |
| `years` | Solver-version years to run. Default: 2020 and 2022 to 2025. |
| `solver_configuration` | Space-separated solver configurations. Default: `default_configurations` in `runner/config/solver_configurations.yaml`. |
| `timeout_seconds` | Timeout of each run, in seconds. Default: 1 hour for S and M problems, 24 hours for L problems. |
| `problems` | Map of problem IDs to their `Problem class`, `Size` and `URL`, as in `results/metadata.yaml`. |

## Variables

Set the variables in a `run.tfvars` file, such as [`benchmarks/sample_run/run.tfvars`](benchmarks/sample_run/run.tfvars):

| Variable | Description | Default |
|---|---|---|
| `project_id` | Google Cloud project | required |
| `benchmarks_dir` | Folder of the benchmark YAML files, relative to `infrastructure/` | `runtime_optimized` |
| `zone` | Zone of the VMs without a `zone` field | `europe-west4-a` |
| `instance_name` | Prefix of the VM names | `benchmark-instance` |
| `run_id` | Identifier of the campaign, shared by all its VMs | `<YYYYMMDD_hhmmss>_batch`, at `tofu apply` |
| `git_ref` | Branch or tag of this repository that the VMs run | `main` |
| `reference_benchmark_interval` | Seconds between two reference benchmarks; 0 turns them off | `3600` |
| `enable_gcs_upload` | Upload the results and logs to Cloud Storage | `true` |
| `gcs_bucket_name` | Bucket of the results and logs | `solver-benchmarks` |
| `auto_destroy_vm` | Delete each VM when its benchmarks finish | `true` |
| `startup_script_path` | Startup script of the VMs | `startup-script.sh` |
| `ssh_user`, `ssh_key_path` | User and public key for SSH access | none |

The campaign generator writes a `run.tfvars` for each campaign.

## Launching and stopping VMs

From `infrastructure/`, with a state file per campaign:

```bash
tofu init
tofu apply -var-file benchmarks/<run-id>/run.tfvars -state=states/<run-id>.tfstate
```

OpenTofu prints the IP address of each VM (`instance_ips`) and the run ID (`shared_run_id`). VMs with `auto_destroy_vm = false` stay up until you delete them:

```bash
tofu destroy -var-file benchmarks/<run-id>/run.tfvars -state=states/<run-id>.tfstate
```

To follow a VM's progress:

```bash
gcloud compute ssh <instance_name>-<file name> --project <project_id> --zone <zone>
tail -f /var/log/startup-script.log                       # overall progress
tail -f /solver-benchmark/runner/logs/*                   # solver logs
tail -f /solver-benchmark/results/benchmark_results.csv   # results of the VM
```

## Cost tracking labels

Each VM and its boot disk get four [labels](https://docs.cloud.google.com/compute/docs/labeling-resources), to filter and group costs in Cloud Billing:

| Label | Value |
|---|---|
| `run_id` | The campaign's run ID |
| `benchmark` | The benchmark YAML file name, without `.yaml` |
| `machine_type` | The VM's machine type |
| `zone` | The VM's zone |

The values are lowercased, with characters other than `a-z`, `0-9`, `_` and `-` replaced by `-`, and cut to 63 characters.

## Failure notifications

To get an email when a benchmark run on a VM ends in ER (error) or OOM (out of memory), set up the alert in [`alerts/`](alerts/main.tf) once per Google Cloud project. It isn't part of a campaign, so it isn't created or destroyed with the VMs.

For each such run, the runner prints a line starting with `BENCHMARK_ALERT`, naming the problem, solver configuration, year, run ID and VM. The runner runs inside the VM's startup script, and the Compute Engine guest agent sends the startup script's output to Cloud Logging (the VMs have the `logging-write` scope for this; no serial port logging is needed). A log-based alert policy emails the recipients when it sees that line: at most one email every 5 minutes, however many runs fail.

Setting it up needs permission to create Cloud Monitoring alert policies and notification channels in the project (e.g. the Monitoring Editor role). If you have no application-default credentials, OpenTofu can use your gcloud login's token:

```bash
gcloud auth login
cd alerts
export GOOGLE_OAUTH_ACCESS_TOKEN=$(gcloud auth print-access-token)
tofu init
tofu apply -var project_id=<your-gcp-project> -var 'notification_emails=["you@example.org"]'
```

### Testing the alert

To check the whole path, from a VM's output to the email:

1. Set up the alert as above. It doesn't fire for log lines written before it existed.
2. Start a small VM with the same image and logging scope as the benchmark VMs, whose startup script prints an alert line:

   ```bash
   gcloud compute instances create benchmark-alert-test --project <your-gcp-project> \
     --zone europe-west4-a --machine-type e2-micro \
     --image-family debian-13 --image-project debian-cloud --scopes logging-write \
     --metadata startup-script='echo "BENCHMARK_ALERT status=ER test=vm"'
   ```

3. After a minute or two, check that the line reached Cloud Logging, under the `google_metadata_script_runner` log:

   ```bash
   gcloud logging read '"BENCHMARK_ALERT" AND resource.type="gce_instance"' \
     --project <your-gcp-project> --freshness 15m --limit 5
   ```

4. Wait a few minutes for the email.
5. Delete the VM:

   ```bash
   gcloud compute instances delete benchmark-alert-test --project <your-gcp-project> \
     --zone europe-west4-a --quiet
   ```

To try again, create a new VM rather than rebooting this one: after a reboot, the startup script reruns, but its output isn't logged again. Benchmark VMs boot only once, so this doesn't affect them.

To check only the alert policy and the email, without a VM, write a test entry to Cloud Logging:

```bash
gcloud logging write solver-benchmark-alert-test "BENCHMARK_ALERT status=ER test=policy" --project <your-gcp-project>
```
