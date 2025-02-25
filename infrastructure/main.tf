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
    description = "Name of the instance"
    type = string
    default = "benchmark-instance"
}

# Test Instance
resource "google_compute_instance" "c4_instance" {
    name = var.instance_name
    machine_type = "c4-standard-2"
    zone = var.zone

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

    # Only set SSH keys if variables are provided
    metadata = {
        ssh-keys = var.ssh_user != "" && var.ssh_key_path != "" ? "${var.ssh_user}:${file(var.ssh_key_path)}" : null
    }

    service_account {
        scopes = ["cloud-platform"]
    }

}

# Outputs
output "instance_ip" {
    value = google_compute_instance.c4_instance.network_interface[0].access_config[0].nat_ip
}
output "instance_id" {
    value = google_compute_instance.c4_instance.id
}
