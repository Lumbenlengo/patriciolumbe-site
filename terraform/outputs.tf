output "videos_bucket_name" {
  value = google_storage_bucket.videos.name
}

output "videos_bucket_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.videos.name}"
}

output "dns_nameservers" {
  value = google_dns_managed_zone.patriciolumbe.name_servers
}

output "dashboard_url" {
  value = "https://console.cloud.google.com/monitoring/dashboards?project=${var.project_id}"
}
