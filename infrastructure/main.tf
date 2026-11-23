# Creates the Google Cloud VMs of a benchmark campaign, one per benchmark YAML
# file in benchmarks_dir, each running startup-script.sh. With
# notification_emails, it also creates an alert policy that emails them when a
# run of this campaign ends in ER or OOM; the last VM to finish deletes it.
# See README.md.

terraform {
    required_providers {
        google = {
            source = "hashicorp/google"
            version = "~> 4.0"
        }
    }
}

provider "google" {
    project = var.project_id
    zone = var.zone
}

variable "project_id" {
    description = "GCP Project ID"
    type = string
}

variable "zone" {
    description = "GCP Zone"
    type = string
    default = "europe-west4-a"
}

variable "ssh_user" {
    description = "SSH username"
    type        = string
    default     = ""
}

variable "ssh_key_path" {
    description = "Path to SSH public key file"
    type        = string
    default     = ""
}

variable "instance_name" {
    description = "Base name of the instance"
    type = string
    default = "benchmark-instance"
}

variable "startup_script_path" {
    description = "Path to startup script"
    type = string
    default = "startup-script.sh"
}

variable "enable_gcs_upload" {
  description = "Enable uploading benchmark results to GCS bucket"
  type        = bool
  default     = true
}

variable "gcs_bucket_name" {
  description = "Name of the GCS bucket to upload benchmark results"
  type        = string
  default     = "solver-benchmarks"
}

variable "auto_destroy_vm" {
  description = "Automatically destroy VM after benchmark completes"
  type        = bool
  default     = true
}

variable "reference_benchmark_interval" {
  description = "Time interval in seconds for running reference benchmarks (0 disables reference benchmarks)"
  type        = number
  default     = 3600
}

variable "benchmarks_dir" {
  description = "Subdirectory containing benchmark YAML files (e.g., 'runtime_optimized', 'phase_1_parallel', 'phase_2_sequential')"
  type        = string
  default     = "runtime_optimized"
}

variable "git_ref" {
  description = "Branch or tag of this repository that the VMs clone and run"
  type        = string
  default     = "main"
}

variable "run_id" {
  description = "Unique identifier for this benchmark run, shared by all its VMs to group them into a single benchmark campaign. If not provided, one is generated from the current date and time."
  type        = string
  default     = ""
}

variable "notification_emails" {
  description = "Email addresses to notify when a run of this campaign ends in ER or OOM. No alert is created if empty."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for email in var.notification_emails : can(regex("^[^@ ]+@[^@ ]+[.][^@ ]+$", email))
    ])
    error_message = "Each notification email must be an email address."
  }
}

locals {
  # The run_id provided, or else one generated from the current date and time,
  # e.g. 20251106_153156_batch
  shared_run_id = var.run_id != "" ? var.run_id : "${formatdate("YYYYMMDD_hhmmss", timestamp())}_batch"

  # Get all YAML files except allocation.yaml (which is just an index file)
  benchmark_files = [
    for file in fileset("${var.benchmarks_dir}/", "*.yaml*") :
      file if file != "allocation.yaml"
  ]

  # Force validation of each YAML file individually with clear error messages
  yaml_validations = {
    for file in local.benchmark_files :
      file => yamldecode(file("${var.benchmarks_dir}/${file}"))
  }

  benchmarks = {
    for file in local.benchmark_files :
      replace(file, ".yaml", "") => {
        filename = file
        content = local.yaml_validations[file]
      }
  }

  # GCP labels of each VM and its boot disk, for grouping costs in Cloud
  # Billing. Label values may only contain lowercase letters, digits, _ and -,
  # up to 63 characters.
  vm_labels = {
    for name, benchmark in local.benchmarks :
      name => {
        for key, value in {
          run_id       = local.shared_run_id
          benchmark    = name
          machine_type = lookup(benchmark.content, "machine-type", "c4-standard-2")
          zone         = lookup(benchmark.content, "zone", var.zone)
        } : key => substr(replace(lower(value), "/[^a-z0-9_-]/", "-"), 0, 63)
      }
  }

  alerts_enabled = length(var.notification_emails) > 0
  run_id_label   = substr(replace(lower(local.shared_run_id), "/[^a-z0-9_-]/", "-"), 0, 63)

  # The runner's alert lines contain "run_id=<run ID> host=..." (see
  # runner/utils/alerts.py). Characters other than letters, digits, _ and -
  # become ".", which also matches them, so the pattern needs no escaping.
  run_id_pattern = "run_id=${replace(local.shared_run_id, "/[^A-Za-z0-9_-]/", ".")}( |$)"
}

# Email channels and alert policy of this campaign's ER and OOM runs. The last
# VM to finish deletes them (see startup-script.sh).
resource "google_monitoring_notification_channel" "campaign" {
  for_each = toset(var.notification_emails)

  display_name = "Solver benchmark ${local.shared_run_id}: ${each.value}"
  type         = "email"
  labels = {
    email_address = each.value
  }
  user_labels = {
    run_id = local.run_id_label
  }
}

resource "google_monitoring_alert_policy" "campaign" {
  count = local.alerts_enabled ? 1 : 0

  display_name = "Solver benchmark ${local.shared_run_id}: run ended in ER or OOM"
  combiner     = "OR"
  user_labels = {
    run_id = local.run_id_label
  }

  conditions {
    display_name = "The runner reported ER or OOM"
    condition_matched_log {
      # The guest agent logs the startup script's output as textPayload or
      # jsonPayload.message, depending on its version. Audit logs of changes
      # to this policy contain the filter text itself, so leave them out.
      filter = join(" ", [
        "\"BENCHMARK_ALERT\"",
        "AND (textPayload=~\"${local.run_id_pattern}\" OR jsonPayload.message=~\"${local.run_id_pattern}\")",
        "AND NOT logName:\"cloudaudit.googleapis.com\"",
      ])
    }
  }

  alert_strategy {
    # At most one email per 5 minutes, however many runs fail
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }

  notification_channels = [
    for channel in google_monitoring_notification_channel.campaign : channel.name
  ]

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      A run of benchmark campaign ${local.shared_run_id} ended in ER (error) or
      OOM (out of memory). The log entry names the problem, solver
      configuration, year and VM (host). Check that VM's logs, and stop the
      campaign if the failure points to a bug or a misconfigured run.
    EOT
  }
}

# Create an instance for each benchmark file
resource "google_compute_instance" "benchmark_instances" {
  for_each = local.benchmarks

  name         = "${var.instance_name}-${each.key}"
  machine_type = lookup(each.value.content, "machine-type", "c4-standard-2")
  zone         = lookup(each.value.content, "zone", var.zone)

  labels = local.vm_labels[each.key]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-13"
      size = 50 # Size in GB
      labels = local.vm_labels[each.key]
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP
    }
  }

  # Include all configuration options in metadata
  metadata = {
    ssh-keys = var.ssh_user != "" && var.ssh_key_path != "" ? "${var.ssh_user}:${file(var.ssh_key_path)}" : null
    benchmark_file = each.value.filename
    benchmark_years = jsonencode(lookup(each.value.content, "years", ["2020", "2022", "2023", "2024", "2025"]))
    benchmark_content = file("${var.benchmarks_dir}/${each.value.filename}")
    enable_gcs_upload = tostring(var.enable_gcs_upload)
    gcs_bucket_name = var.gcs_bucket_name
    auto_destroy_vm = tostring(var.auto_destroy_vm)
    project_id = var.project_id
    zone = lookup(each.value.content, "zone", var.zone)
    reference_benchmark_interval = tostring(var.reference_benchmark_interval)
    run_id = local.shared_run_id
    run_id_label = local.run_id_label
    git_ref = var.git_ref
    # Deleted by the last VM to finish (see startup-script.sh)
    alert_policy = local.alerts_enabled ? google_monitoring_alert_policy.campaign[0].name : ""
    alert_channels = join(" ", [
      for channel in google_monitoring_notification_channel.campaign : channel.name
    ])
  }

  # Add the startup script from external file
  metadata_startup_script = file("${path.module}/${var.startup_script_path}")

  # Conditional service account configuration
  service_account {
    scopes = concat(
      # Base scopes
      [
        var.auto_destroy_vm ? "compute-rw" : "compute-ro",  # Need compute-rw for self-destruction
        "logging-write",
        "monitoring-write"
      ],
      # Conditional scope for GCS upload
      var.enable_gcs_upload ? ["storage-rw"] : ["storage-ro"],
      # Full Monitoring access to delete the campaign's alert policy
      local.alerts_enabled ? ["monitoring"] : []
    )
  }
}

# Outputs
output "instance_ips" {
  value = {
    for name, instance in google_compute_instance.benchmark_instances :
      name => instance.network_interface[0].access_config[0].nat_ip
  }
}

output "shared_run_id" {
  value = local.shared_run_id
}
