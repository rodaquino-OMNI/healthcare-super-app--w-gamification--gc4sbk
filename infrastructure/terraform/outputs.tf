# AUSTA SuperApp Infrastructure Outputs
# This file serves as the single source of truth for all Terraform-managed output variables

#######################
# Network Outputs
#######################

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.network.private_subnet_ids
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = module.network.database_subnet_ids
}

output "nat_gateway_ips" {
  description = "List of NAT Gateway public IPs"
  value       = module.network.nat_gateway_ips
}

#######################
# EKS Outputs
#######################

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint for the EKS cluster API server"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "eks_node_group_arns" {
  description = "ARNs of the EKS node groups"
  value       = module.eks.node_group_arns
}

#######################
# RDS Outputs
#######################

output "rds_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.rds.db_instance_endpoint
}

output "rds_instance_name" {
  description = "The database name"
  value       = module.rds.db_instance_name
}

output "rds_instance_username" {
  description = "The master username for the database"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "rds_instance_port" {
  description = "The database port"
  value       = module.rds.db_instance_port
}

output "rds_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${module.rds.db_instance_username}:${module.rds.db_instance_password}@${module.rds.db_instance_endpoint}/${module.rds.db_instance_name}"
  sensitive   = true
}

#######################
# ElastiCache Outputs
#######################

output "elasticache_redis_endpoint" {
  description = "The endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "elasticache_redis_port" {
  description = "The port of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_port
}

output "elasticache_connection_string" {
  description = "Redis connection string"
  value       = "redis://${module.elasticache.redis_endpoint}:${module.elasticache.redis_port}"
}

#######################
# MSK Outputs
#######################

output "msk_bootstrap_brokers" {
  description = "Plaintext connection host:port pairs for Kafka brokers"
  value       = module.msk.bootstrap_brokers
}

output "msk_bootstrap_brokers_tls" {
  description = "TLS connection host:port pairs for Kafka brokers"
  value       = module.msk.bootstrap_brokers_tls
}

output "msk_zookeeper_connect_string" {
  description = "Connection string for Zookeeper"
  value       = module.msk.zookeeper_connect_string
}

#######################
# S3 Outputs
#######################

output "s3_documents_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = module.s3.documents_bucket_name
}

output "s3_documents_bucket_arn" {
  description = "ARN of the S3 bucket for document storage"
  value       = module.s3.documents_bucket_arn
}

output "s3_static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = module.s3.static_assets_bucket_name
}

output "s3_static_assets_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = module.s3.static_assets_bucket_arn
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = module.s3.logs_bucket_name
}

output "s3_logs_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  value       = module.s3.logs_bucket_arn
}

#######################
# Monitoring Outputs
#######################

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "cloudwatch_log_group_names" {
  description = "Names of the CloudWatch log groups"
  value       = module.monitoring.log_group_names
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of the CloudWatch alarms"
  value       = module.monitoring.alarm_arns
}

#######################
# WAF Outputs
#######################

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = module.waf.web_acl_id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = module.waf.web_acl_arn
}

#######################
# ECR Outputs
#######################

# Backend Services ECR Repositories
output "ecr_api_gateway_repository_url" {
  description = "URL of the ECR repository for the API Gateway service"
  value       = module.ecr.api_gateway_repository_url
}

output "ecr_auth_service_repository_url" {
  description = "URL of the ECR repository for the Auth Service"
  value       = module.ecr.auth_service_repository_url
}

output "ecr_health_service_repository_url" {
  description = "URL of the ECR repository for the Health Service"
  value       = module.ecr.health_service_repository_url
}

output "ecr_care_service_repository_url" {
  description = "URL of the ECR repository for the Care Service"
  value       = module.ecr.care_service_repository_url
}

output "ecr_plan_service_repository_url" {
  description = "URL of the ECR repository for the Plan Service"
  value       = module.ecr.plan_service_repository_url
}

output "ecr_gamification_engine_repository_url" {
  description = "URL of the ECR repository for the Gamification Engine"
  value       = module.ecr.gamification_engine_repository_url
}

output "ecr_notification_service_repository_url" {
  description = "URL of the ECR repository for the Notification Service"
  value       = module.ecr.notification_service_repository_url
}

# Frontend ECR Repositories
output "ecr_web_app_repository_url" {
  description = "URL of the ECR repository for the Web App"
  value       = module.ecr.web_app_repository_url
}

output "ecr_mobile_app_repository_url" {
  description = "URL of the ECR repository for the Mobile App"
  value       = module.ecr.mobile_app_repository_url
}

# New Package ECR Repositories
output "ecr_design_system_repository_url" {
  description = "URL of the ECR repository for the Design System package"
  value       = module.ecr.design_system_repository_url
}

output "ecr_design_system_repository_arn" {
  description = "ARN of the ECR repository for the Design System package"
  value       = module.ecr.design_system_repository_arn
}

output "ecr_primitives_repository_url" {
  description = "URL of the ECR repository for the Primitives package"
  value       = module.ecr.primitives_repository_url
}

output "ecr_primitives_repository_arn" {
  description = "ARN of the ECR repository for the Primitives package"
  value       = module.ecr.primitives_repository_arn
}

output "ecr_interfaces_repository_url" {
  description = "URL of the ECR repository for the Interfaces package"
  value       = module.ecr.interfaces_repository_url
}

output "ecr_interfaces_repository_arn" {
  description = "ARN of the ECR repository for the Interfaces package"
  value       = module.ecr.interfaces_repository_arn
}

output "ecr_journey_context_repository_url" {
  description = "URL of the ECR repository for the Journey Context package"
  value       = module.ecr.journey_context_repository_url
}

output "ecr_journey_context_repository_arn" {
  description = "ARN of the ECR repository for the Journey Context package"
  value       = module.ecr.journey_context_repository_arn
}

# ECR Registry Information
output "ecr_registry_id" {
  description = "The ID of the ECR registry"
  value       = module.ecr.registry_id
}

output "ecr_registry_url" {
  description = "The URL of the ECR registry"
  value       = module.ecr.registry_url
}