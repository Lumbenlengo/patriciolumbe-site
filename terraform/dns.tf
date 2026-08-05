resource "google_dns_managed_zone" "patriciolumbe" {
  name        = "patriciolumbe-zone"
  dns_name    = "${var.custom_domain}."
  description = "Zona DNS para patriciolumbe.com"

  dnssec_config {
    state = "on"
  }
}

resource "google_dns_record_set" "caa" {
  name         = google_dns_managed_zone.patriciolumbe.dns_name
  managed_zone = google_dns_managed_zone.patriciolumbe.name
  type         = "CAA"
  ttl          = 3600

  rrdatas = [
    "0 issue \"letsencrypt.org\"",
    "0 issue \"pki.goog\""
  ]
}
