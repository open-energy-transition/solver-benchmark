terraform {
    required_providers {
        google = {
            source = "hashicorp/google"
            version = "~> 4.0"
        }
    }
}

# GCP provider configuration
provider "google" {
    # credentials = file(var.gcp_service_key_path)
    project = var.project_id
    zone = var.zone
}

# Variables
variable "project_id" {
    description = "GCP Project ID"
    type = string
}

variable "zone" {
    description = "GCP Zone"
    type = string
    default = "europe-west4-a"
}

# variable "gcp_service_key_path" {
#   description = "Path to the GCP credentials JSON file"
#   type        = string
# }

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

variable "run_id" {
  description = "Unique identifier for this benchmark run. If not provided, each VM will generate its own. Use this to group parallel VMs into a single logical benchmark campaign."
  type        = string
  default     = ""
}

locals {
  # Generate a shared run_id if not provided (timestamp + a random suffix)
  # If provided, use the user's run_id
  shared_run_id = var.run_id != "" ? var.run_id : "${formatdate("YYYYMMDD_hhmmss", timestamp())}_batch"

  # Get all YAML files except allocation.yaml (which is just an index file)
  benchmark_files = [
    for file in fileset("${path.module}/benchmarks/${var.benchmarks_dir}/", "*.yaml*") :
      file if file != "allocation.yaml"
  ]

  # Force validation of each YAML file individually with clear error messages
  yaml_validations = {
    for file in local.benchmark_files :
      file => yamldecode(file("${path.module}/benchmarks/${var.benchmarks_dir}/${file}"))
  }

  benchmarks = {
    for file in local.benchmark_files :
      replace(file, ".yaml", "") => {
        filename = file
        content = local.yaml_validations[file]
      }
  }
}

# Create an instance for each benchmark file
resource "google_compute_instance" "benchmark_instances" {
  for_each = local.benchmarks

  name         = "${var.instance_name}-${each.key}"
  machine_type = lookup(each.value.content, "machine-type", "c4-standard-2")
  zone         = lookup(each.value.content, "zone", var.zone)

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-13"
      size = 50 # Size in GB
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
    benchmark_years = jsonencode(lookup(each.value.content, "years", ["2024"]))
    benchmark_content = file("${path.module}/benchmarks/${var.benchmarks_dir}/${each.value.filename}")
    enable_gcs_upload = tostring(var.enable_gcs_upload)
    gcs_bucket_name = var.gcs_bucket_name
    auto_destroy_vm = tostring(var.auto_destroy_vm)
    project_id = var.project_id
    zone = lookup(each.value.content, "zone", var.zone)
    reference_benchmark_interval = tostring(var.reference_benchmark_interval)
    run_id = local.shared_run_id
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
      var.enable_gcs_upload ? ["storage-rw"] : ["storage-ro"]
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
