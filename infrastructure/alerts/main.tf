# Emails the given recipients when a benchmark run on a cloud VM ends in ER or
# OOM, so a broken campaign can be stopped early.
#
# The runner prints a line starting with BENCHMARK_ALERT for each such run (see
# runner/utils/alerts.py), and the VMs send their output to Cloud Logging. This
# log-based alert policy watches for that line.
#
# Unlike ../main.tf, which is applied per campaign, this is applied once per
# project; see ../README.md.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "notification_emails" {
  description = "Email addresses to notify when a benchmark run ends in ER or OOM"
  type        = list(string)

  validation {
    condition     = length(var.notification_emails) > 0
    error_message = "Give at least one email address."
  }
}

resource "google_monitoring_notification_channel" "email" {
  for_each = toset(var.notification_emails)

  display_name = "Solver benchmark alerts: ${each.value}"
  type         = "email"
  labels = {
    email_address = each.value
  }
}

resource "google_monitoring_alert_policy" "benchmark_failures" {
  display_name = "Solver benchmark: run ended in ER or OOM"
  combiner     = "OR"

  conditions {
    display_name = "The runner reported ER or OOM"
    condition_matched_log {
      # Audit logs of changes to this policy contain the filter text itself,
      # so leave them out, or every change would send an alert
      filter = "\"BENCHMARK_ALERT\" AND NOT logName:\"cloudaudit.googleapis.com\""
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
    for channel in google_monitoring_notification_channel.email : channel.name
  ]

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      A benchmark run ended in ER (error) or OOM (out of memory). The log
      entry names the problem, solver configuration, year, run ID and VM
      (host). Check that VM's logs, and stop the campaign if the failure
      points to a bug or a misconfigured run.
    EOT
  }
}
