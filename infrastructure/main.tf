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
    credentials = file(var.gcp_service_key_path)
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

variable "gcp_service_key_path" {
  description = "Path to the GCP credentials JSON file"
  type        = string
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

locals {
  benchmark_files = fileset("${path.module}/benchmarks", "*.yaml*")

  # Force validation of each YAML file individually with clear error messages
  yaml_validations = {
    for file in local.benchmark_files :
      file => yamldecode(file("${path.module}/benchmarks/${file}"))
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
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size = 50 # Size in GB
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = var.ssh_user != "" && var.ssh_key_path != "" ? "${var.ssh_user}:${file(var.ssh_key_path)}" : null
    benchmark_file = each.value.filename
    benchmark_year = lookup(each.value.content, "year", "2024")
    benchmark_content = file("${path.module}/benchmarks/${each.value.filename}")
    enable_gcs_upload = tostring(var.enable_gcs_upload)
    gcs_bucket_name = var.gcs_bucket_name
  }

  # Add the startup script from external file
  metadata_startup_script = file("${path.module}/${var.startup_script_path}")

  service_account {
    scopes = concat([
        "compute-ro",
        "logging-write",
        "monitoring-write"
    ], var.enable_gcs_upload ? ["storage-rw"] : ["storage-ro"])
  }
}

# Outputs
output "instance_ips" {
  value = {
    for name, instance in google_compute_instance.benchmark_instances :
      name => instance.network_interface[0].access_config[0].nat_ip
  }
}
