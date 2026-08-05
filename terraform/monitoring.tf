resource "google_monitoring_notification_channel" "email" {
  display_name = "Patricio Email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }
}


resource "google_monitoring_uptime_check_config" "website" {
  display_name = "Patriciolumbe Website Uptime"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = "/"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.custom_domain
    }
  }
}

resource "google_monitoring_alert_policy" "site_down" {
  display_name = "Website is DOWN"
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failed"

    condition_threshold {
      filter          = "resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_FRACTION_TRUE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "1800s"
  }
}
