# AUSTA SuperApp Infrastructure Scripts

## Overview

This directory contains scripts for managing, deploying, and maintaining the AUSTA SuperApp infrastructure across development, staging, and production environments. These scripts provide standardized tools for environment configuration, deployment automation, monitoring setup, maintenance tasks, and CI/CD pipeline operations.

## Root-Level Scripts

### terraform-wrapper.sh

**Purpose**: Centralized wrapper for Terraform operations that standardizes environment preparation, AWS credential management, workspace handling, and infrastructure deployment.

**Usage**:
```bash
./terraform-wrapper.sh [options] <terraform-command>
```

**Options**:
- `-e, --environment <env>`: Specify environment (development, staging, production)
- `-w, --workspace <workspace>`: Specify Terraform workspace
- `-p, --profile <profile>`: AWS profile to use
- `-r, --region <region>`: AWS region to use
- `-h, --help`: Display help information

**Examples**:
```bash
# Plan changes for development environment
./terraform-wrapper.sh -e development plan

# Apply changes to production environment
./terraform-wrapper.sh -e production -p prod-admin apply

# Destroy resources in staging environment
./terraform-wrapper.sh -e staging -w api-gateway destroy
```

### validate-env.sh

**Purpose**: Validates environment configuration by checking required variables, Docker container readiness, and service port availability.

**Usage**:
```bash
./validate-env.sh [options] <service-name>
```

**Options**:
- `-e, --environment <env>`: Specify environment (development, staging, production)
- `-c, --check-containers`: Verify Docker container readiness
- `-p, --check-ports`: Verify service port availability
- `-v, --verbose`: Enable verbose output
- `-h, --help`: Display help information

**Examples**:
```bash
# Validate environment for API Gateway service
./validate-env.sh -e development api-gateway

# Validate environment with container and port checks
./validate-env.sh -e staging -c -p auth-service

# Validate environment for all services
./validate-env.sh -e production --all
```

## Script Categories

### CI/CD Scripts (`ci-cd/`)

Scripts for automating and managing the CI/CD pipeline, including build processes, artifact management, deployment verification, and rollback procedures.

Key scripts include:
- `build-workspace.sh`: Builds monorepo packages in dependency order
- `build-image.sh`: Builds and pushes Docker images
- `detect-changes.sh`: Identifies changed packages for targeted rebuilds
- `validate-dependencies.js`: Validates package dependencies
- `verify-deployment.sh`: Verifies successful deployment
- `rollback.sh`: Handles deployment rollbacks

See [CI/CD Scripts Documentation](./ci-cd/README.md) for detailed information.

### Deployment Scripts (`deployment/`)

Scripts for managing the deployment process across environments, including blue-green deployments, canary deployments, promotion between environments, and rollback procedures.

Key scripts include:
- `blue-green-deploy.sh`: Implements blue-green deployment strategy
- `canary-deploy.sh`: Implements canary deployment strategy
- `promote-to-staging.sh`: Promotes changes from development to staging
- `promote-to-production.sh`: Promotes changes from staging to production
- `rollback.sh`: Orchestrates rollback procedures

See [Deployment Scripts Documentation](./deployment/README.md) for detailed information.

### Environment Scripts (`environment/`)

Scripts for managing environment configuration, validation, and preparation across development, staging, and production environments.

Key scripts include:
- `env-prepare.sh`: Orchestrates environment preparation
- `env-manager.sh`: Manages environment variables
- `config-parser.sh`: Parses configuration from multiple sources
- `secrets-manager.sh`: Manages secrets across environments
- `env-validator.sh`: Validates environment configuration
- `journey-config.sh`: Manages journey-specific configuration
- `runtime-check.sh`: Performs runtime verification

### Maintenance Scripts (`maintenance/`)

Scripts for performing regular maintenance tasks, including database optimization, Kubernetes node rotation, security updates, and backup verification.

Key scripts include:
- `maintenance-orchestrator.sh`: Orchestrates maintenance activities
- `db-vacuum-analyze.sh`: Performs PostgreSQL vacuum analysis
- `db-index-optimize.sh`: Optimizes database indexes
- `k8s-node-rotation.sh`: Rotates Kubernetes nodes
- `security-deps-update.sh`: Updates dependencies for security
- `backup-verify.sh`: Verifies database backups
- `dr-drill.sh`: Performs disaster recovery drills

See [Maintenance Scripts Documentation](./maintenance/README.md) for detailed information.

### Monitoring Scripts (`monitoring/`)

Scripts for setting up and managing monitoring, alerting, and observability across the AUSTA SuperApp ecosystem.

Key scripts include:
- `health-checker.sh`: Performs service health checks
- `monitor-dependencies.sh`: Monitors service dependencies
- `setup-dashboards.sh`: Configures Grafana dashboards
- `configure-alerts.sh`: Configures Prometheus alerts
- `benchmark-services.sh`: Benchmarks service performance
- `validate-performance.sh`: Validates performance against baselines

See [Monitoring Scripts Documentation](./monitoring/README.md) for detailed information.

## Usage Patterns

### Environment Preparation

Before deploying or running services, prepare the environment:

```bash
# Prepare development environment
./environment/env-prepare.sh -e development

# Prepare staging environment with specific journey focus
./environment/env-prepare.sh -e staging -j health

# Prepare production environment with all validations
./environment/env-prepare.sh -e production --validate-all
```

### Deployment Workflow

Standard deployment workflow across environments:

```bash
# Deploy to development
./deployment/canary-deploy.sh -e development -s health-service

# Validate deployment
./deployment/validate-deployment.sh -e development -s health-service

# Promote to staging
./deployment/promote-to-staging.sh -s health-service

# Promote to production
./deployment/promote-to-production.sh -s health-service
```

### Maintenance Tasks

Executing maintenance tasks:

```bash
# Run all scheduled maintenance tasks
./maintenance/maintenance-orchestrator.sh --scheduled

# Run specific maintenance task
./maintenance/maintenance-orchestrator.sh --task db-vacuum-analyze

# Run maintenance in specific environment
./maintenance/maintenance-orchestrator.sh -e production --task k8s-node-rotation
```

### Monitoring Setup

Setting up monitoring components:

```bash
# Set up dashboards for all journeys
./monitoring/setup-dashboards.sh --all-journeys

# Configure alerts for specific service
./monitoring/configure-alerts.sh -s api-gateway

# Benchmark services before deployment
./monitoring/benchmark-services.sh -e staging -s health-service
```

## Environment-Specific Considerations

### Development Environment

- Scripts use local Docker environment or minikube
- Secrets are stored in encrypted .env files
- Monitoring uses local Prometheus and Grafana instances
- Deployment uses direct kubectl apply or skaffold

### Staging Environment

- Scripts use AWS EKS staging cluster
- Secrets are stored in AWS Secrets Manager
- Monitoring integrates with centralized Prometheus/Grafana
- Deployment uses GitHub Actions with canary strategy

### Production Environment

- Scripts use AWS EKS production cluster with stricter validation
- Secrets are managed through AWS Secrets Manager with restricted access
- Monitoring includes additional alerting and SLA verification
- Deployment strategies vary by service criticality:
  - API Gateway: Blue-green deployment
  - Journey Services: Canary deployment with progressive traffic shifting

## Troubleshooting

### Common Issues

#### Environment Validation Failures

**Problem**: Environment validation fails with missing variables.

**Solution**: Check the appropriate .env file or AWS Parameter Store for the required variables. Use the following command to see which variables are missing:

```bash
./validate-env.sh -e <environment> -v <service-name>
```

#### Deployment Failures

**Problem**: Deployment fails with health check errors.

**Solution**: Check service logs and dependencies. Use the health check script to identify specific issues:

```bash
./deployment/health-check.sh -e <environment> -s <service-name>
```

#### Database Maintenance Issues

**Problem**: Database maintenance tasks fail or timeout.

**Solution**: Check database connection and resource utilization. Adjust maintenance window parameters:

```bash
./maintenance/db-vacuum-analyze.sh -e <environment> --timeout 3600 --max-connections 5
```

#### Terraform Execution Errors

**Problem**: Terraform operations fail with state lock errors.

**Solution**: Check for abandoned locks and force unlock if necessary:

```bash
./terraform-wrapper.sh -e <environment> force-unlock <lock-id>
```

## Examples

### Complete Deployment Workflow

```bash
# 1. Prepare environment
./environment/env-prepare.sh -e staging

# 2. Validate environment
./validate-env.sh -e staging --all

# 3. Build and push Docker images
./ci-cd/build-image.sh -e staging -s health-service

# 4. Benchmark services before deployment
./monitoring/benchmark-services.sh -e staging -s health-service

# 5. Deploy using canary strategy
./deployment/canary-deploy.sh -e staging -s health-service

# 6. Validate deployment
./deployment/validate-deployment.sh -e staging -s health-service

# 7. Update monitoring dashboards
./monitoring/setup-dashboards.sh -e staging -j health
```

### Database Maintenance Workflow

```bash
# 1. Check database status before maintenance
./monitoring/monitor-dependencies.sh -e production --db-only

# 2. Perform vacuum analyze
./maintenance/db-vacuum-analyze.sh -e production

# 3. Optimize indexes
./maintenance/db-index-optimize.sh -e production

# 4. Verify database performance after maintenance
./monitoring/validate-performance.sh -e production --db-only
```

### Disaster Recovery Test

```bash
# 1. Prepare for DR drill
./maintenance/dr-drill.sh -e production --prepare

# 2. Execute DR failover
./maintenance/dr-drill.sh -e production --execute

# 3. Validate DR environment
./maintenance/dr-drill.sh -e production --validate

# 4. Generate DR readiness report
./maintenance/dr-drill.sh -e production --report

# 5. Failback to primary region
./maintenance/dr-drill.sh -e production --failback
```

## Contributing

When adding new scripts to this directory:

1. Follow the established naming conventions
2. Include comprehensive help text with `-h` or `--help` flag
3. Implement proper error handling and logging
4. Add appropriate validation for input parameters
5. Update this README.md with script details
6. Create or update subfolder README.md with detailed documentation

## License

Copyright © 2023-2025 AUSTA Health Technologies. All rights reserved.