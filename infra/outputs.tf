output "ec2_public_ip" {
  description = "Elastic IP address of the EC2 backend instance"
  value       = aws_eip.this.public_ip
}

output "backend_url" {
  description = "Backend API base URL"
  value       = "http://${aws_eip.this.public_ip}:3001/api/v1"
}

output "frontend_url" {
  description = "CloudFront URL for the React frontend"
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "swagger_url" {
  description = "Swagger UI URL"
  value       = "http://${aws_eip.this.public_ip}:3001/api/docs"
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.this.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.this.id
}
