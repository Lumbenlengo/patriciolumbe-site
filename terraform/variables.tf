variable "project_id" {
  type    = string
  default = "project-5c15975f-e002-4ccf-b67"
}

variable "region" {
  type    = string
  default = "europe-west1"
}

variable "custom_domain" {
  type    = string
  default = "patriciolumbe.com"
}

variable "billing_account_id" {
  type    = string
  default = "019DBF-E33042-855E4D"
}

variable "monthly_budget_amount" {
  type    = number
  default = 20
}

variable "alert_email" {
  type    = string
  default = "contact@patriciolumbe.com"
}

variable "environment" {
  type    = string
  default = "prod"
}
