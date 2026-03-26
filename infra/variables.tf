variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "checkout-app"
}

variable "db_password" {
  description = "Password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "wompi_private_key" {
  description = "Wompi private key for server-side API calls"
  type        = string
  sensitive   = true
}

variable "wompi_public_key" {
  description = "Wompi public key for client-side tokenization"
  type        = string
  sensitive   = true
}

variable "wompi_integrity_key" {
  description = "Wompi integrity key for signature validation"
  type        = string
  sensitive   = true
}

variable "wompi_api_url" {
  description = "Wompi API base URL"
  type        = string
  default     = "https://api-sandbox.co.uat.wompi.dev/v1"
}

variable "ec2_key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the EC2 instance. Restrict to your IP in production."
  type        = string
  default     = "0.0.0.0/0"
}
