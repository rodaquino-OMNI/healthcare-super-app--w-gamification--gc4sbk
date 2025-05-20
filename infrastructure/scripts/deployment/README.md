# AUSTA SuperApp Deployment Scripts

## Introduction

This document provides comprehensive documentation for all deployment scripts used in the AUSTA SuperApp platform. These scripts facilitate the deployment, validation, and maintenance of the application across different environments, ensuring consistent and reliable deployments while maintaining the journey-centered architecture of the platform ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").

### Purpose

The deployment scripts serve several key purposes:

- Automate the deployment process across development, staging, and production environments
- Ensure consistent configuration and dependency resolution across all services
- Validate infrastructure before deployment to prevent configuration issues
- Provide rollback capabilities for quick recovery from failed deployments
- Support the journey-centered architecture with specialized deployment procedures for each journey service

### Deployment Architecture Overview

The AUSTA SuperApp uses a multi-environment deployment architecture with specialized strategies for different service types:

- **API Gateway**: Blue/green deployment for zero downtime
- **Journey Services**: Canary deployments with gradual traffic shifting
  - Health Journey Service ("Minha Sau00fade")
  - Care Journey Service ("Cuidar-me Agora")
  - Plan Journey Service ("Meu Plano & Benefu00edcios")
- **Data Services**: Controlled migrations with validation
- **Shared Infrastructure**: Terraform-managed cloud resources
- **Gamification Engine**: Specialized deployment with event processing validation

## Deployment Scripts Overview

### Available Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy-all.sh` | Orchestrates the complete deployment process | `./deploy-all.sh` |
| `deploy-service.sh` | Deploys a specific service | `./deploy-service.sh` |
| `rollback.sh` | Rolls back a deployment to a previous version | `./rollback.sh` |
| `validate-infra.sh` | Validates infrastructure configuration | `./validate-infra.sh` |
| `check-dependencies.sh` | Verifies dependency resolution | `./check-dependencies.sh` |
| `deploy-journey.sh` | Deploys all services for a specific journey | `./deploy-journey.sh` |
| `health-check.sh` | Performs post-deployment health checks | `./health-check.sh` |
| `db-migration.sh` | Manages database migrations | `./db-migration.sh` |
| `config-update.sh` | Updates configuration without full redeployment | `./config-update.sh` |
| `emergency-deploy.sh` | Expedited deployment for critical fixes | `./emergency-deploy.sh` |
| `validate-events.sh` | Validates event schema compatibility | `./validate-events.sh` |
| `monitor-deployment.sh` | Real-time monitoring during deployment | `./monitor-deployment.sh` |

### Common Usage Patterns

#### Complete Deployment

```bash
./deploy-all.sh --environment staging --version 1.2.3
```

#### Single Service Deployment

```bash
./deploy-service.sh --service health-service --environment staging --version 1.2.3
```

#### Journey-Specific Deployment

```bash
./deploy-journey.sh --journey health --environment staging --version 1.2.3
```

#### Configuration Update

```bash
./config-update.sh --service api-gateway --environment production --config-version 1.0.1
```

#### Dependency Resolution Validation

```bash
./check-dependencies.sh --workspace src/web --verbose
```

#### Event Schema Validation

```bash
./validate-events.sh --source-version 1.2.2 --target-version 1.2.3
```

## Environment-Specific Deployment

### Development Environment

The development environment supports rapid iteration and testing of features.

#### Deployment Process

1. Automatic deployment triggered by feature branch pushes
2. Isolated environments for feature testing
3. Ephemeral infrastructure created and destroyed per feature

#### Example: Deploy to Development

```bash
./deploy-all.sh --environment development --branch feature/new-health-metrics
```

### Staging Environment

The staging environment mirrors production for comprehensive testing.

#### Deployment Process

1. Automatic deployment on main branch merges
2. Complete staging environment that mirrors production
3. Comprehensive testing suite execution
4. Integration with test instances of external systems

#### Example: Deploy to Staging

```bash
./deploy-all.sh --environment staging --version 1.2.3-rc.1
```

### Production Environment

The production environment requires careful validation and controlled deployment.

#### Deployment Process

1. Manual approval required for promotion
2. Change advisory board review for significant changes
3. Scheduled deployment windows for planned releases
4. Emergency deployment process for critical fixes

#### Example: Deploy to Production

```bash
./deploy-all.sh --environment production --version 1.2.3 --approval-ticket TICKET-123
```

## CI/CD Integration

### GitHub Actions Integration

The deployment scripts are designed to integrate seamlessly with GitHub Actions workflows.

#### Workflow Configuration

Example GitHub Actions workflow configuration:

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - main

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
      - id: set-matrix
        run: |
          # Determine changed workspaces and create build matrix
          echo "::set-output name=matrix::{\"workspace\":[\"src/backend\",\"src/web\"]}"

  dependency-validation:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.detect-changes.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18.15.0'
      - name: Cache workspace dependencies
        uses: actions/cache@v3
        with:
          path: |
            **/node_modules
          key: ${{ runner.os }}-${{ matrix.workspace }}-${{ hashFiles(format('{0}/pnpm-lock.yaml', matrix.workspace)) }}
          restore-keys: |
            ${{ runner.os }}-${{ matrix.workspace }}-
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Validate dependencies
        run: |
          ./infrastructure/scripts/deployment/check-dependencies.sh --workspace ${{ matrix.workspace }}

  deploy:
    needs: dependency-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up environment
        run: |
          echo "Setting up deployment environment"
          # Install required tools and dependencies
          
      - name: Validate infrastructure
        run: |
          ./infrastructure/scripts/deployment/validate-infra.sh --environment staging
          
      - name: Deploy to staging
        run: |
          ./infrastructure/scripts/deployment/deploy-all.sh --environment staging --version ${{ github.sha }}
          
      - name: Run health checks
        run: |
          ./infrastructure/scripts/deployment/health-check.sh --environment staging
          
      - name: Validate event processing
        run: |
          ./infrastructure/scripts/deployment/validate-events.sh --environment staging
```

### Automated Deployment Workflows

The deployment scripts support several automated workflows:

#### Continuous Deployment to Development

Automatically deploys feature branches to development environments for testing.

#### Nightly Builds

Scheduled deployments to staging for overnight testing and validation.

#### Release Automation

Automated creation of release candidates and deployment to staging.

## Manual Deployment Procedures

### Prerequisites

Before performing a manual deployment, ensure you have:

1. Appropriate access credentials for the target environment
2. Required CLI tools installed (kubectl, helm, aws-cli, etc.)
3. VPN connection to the deployment network (if required)
4. Deployment approval (for production deployments)

### Step-by-Step Deployment

#### 1. Prepare the Deployment

```bash
# Clone the repository
git clone https://github.com/austa/superapp.git
cd superapp

# Checkout the desired version
git checkout v1.2.3

# Set up environment variables
export AWS_PROFILE=austa-production
export KUBECONFIG=~/.kube/austa-production
```

#### 2. Validate the Deployment

```bash
# Validate infrastructure
./infrastructure/scripts/deployment/validate-infra.sh --environment production

# Check dependencies
./infrastructure/scripts/deployment/check-dependencies.sh
```

#### 3. Execute the Deployment

```bash
# Deploy all services
./infrastructure/scripts/deployment/deploy-all.sh --environment production --version v1.2.3
```

#### 4. Verify the Deployment

```bash
# Run health checks
./infrastructure/scripts/deployment/health-check.sh --environment production
```

## Infrastructure Validation

### Terraform Validation

The `validate-infra.sh` script performs Terraform validation to ensure infrastructure code correctness.

#### Usage

```bash
./validate-infra.sh --environment staging
```

#### Validation Steps

1. Terraform initialization
2. Terraform validation
3. Terraform plan generation
4. Plan analysis for destructive changes

### Kubernetes Manifest Validation

The script also validates Kubernetes manifests to prevent configuration errors.

#### Usage

```bash
./validate-infra.sh --environment staging --service api-gateway
```

#### Validation Steps

1. Kubernetes schema validation
2. Resource quota compliance check
3. Security policy validation
4. Custom resource definition validation

## Rollback Procedures

### Container Rollback

The `rollback.sh` script provides container rollback capabilities using Kubernetes deployment revision history.

#### Usage

```bash
./rollback.sh --service health-service --environment production --revision previous
```

#### Rollback Options

- `--revision previous`: Roll back to the previous revision
- `--revision N`: Roll back to a specific revision number
- `--version v1.2.2`: Roll back to a specific version tag

### Database Rollback

The `db-migration.sh` script supports database rollback operations.

#### Usage

```bash
./db-migration.sh --service health-service --environment production --action rollback --steps 1
```

#### Rollback Options

- `--steps N`: Roll back N migration steps
- `--to-version X.Y.Z`: Roll back to a specific migration version
- `--to-timestamp YYYY-MM-DD-HH-MM`: Roll back to a point in time (requires backup)

### Configuration Rollback

The `config-update.sh` script supports configuration rollback.

#### Usage

```bash
./config-update.sh --service api-gateway --environment production --action rollback --config-version 1.0.0
```

## Troubleshooting

### Common Deployment Issues

#### Dependency Resolution Failures

**Symptoms:**
- Build failures with missing dependencies
- Version conflicts in package resolution
- TypeScript path resolution errors
- Module not found errors in monorepo packages

**Resolution:**
1. Run `./check-dependencies.sh --verbose` to identify specific issues
2. Update package.json files to resolve conflicts
3. Use the resolutions field in root package.json for transitive dependencies
4. Check tsconfig.json path mappings for consistency
5. Verify workspace definitions in package.json
6. Ensure all required packages are properly exported

#### Infrastructure Provisioning Failures

**Symptoms:**
- Terraform apply errors
- Resource creation timeouts

**Resolution:**
1. Check AWS service quotas and limits
2. Verify IAM permissions for the deployment role
3. Check for conflicting resource names or IDs

#### Kubernetes Deployment Failures

**Symptoms:**
- Pods stuck in pending or crashloopbackoff state
- Service endpoints not available
- Journey services unable to communicate
- Gamification events not being processed

**Resolution:**
1. Check pod logs: `kubectl logs -n <namespace> <pod-name>`
2. Describe the pod: `kubectl describe pod -n <namespace> <pod-name>`
3. Verify resource requests and limits
4. Check for image pull errors or secrets issues
5. Verify Kafka connectivity for event-driven services
6. Check journey service health endpoints
7. Validate service account permissions

### Debugging Techniques

#### Deployment Logs

Access detailed deployment logs for troubleshooting:

```bash
./deploy-service.sh --service health-service --environment staging --version 1.2.3 --debug
```

#### Health Check Diagnostics

Run detailed health checks with diagnostic information:

```bash
./health-check.sh --environment staging --service health-service --verbose
```

#### Infrastructure State Inspection

Inspect the current infrastructure state:

```bash
./validate-infra.sh --environment staging --show-state
```

#### Event Processing Validation

Validate event processing between services:

```bash
./validate-events.sh --source gamification-engine --target notification-service --event achievement-unlocked
```

#### Dependency Graph Visualization

Generate a visual representation of package dependencies:

```bash
./check-dependencies.sh --workspace src/web --generate-graph --output dependency-graph.svg
```

### Support Contacts

For deployment issues that cannot be resolved using this documentation:

- **Platform Team**: platform-team@austa.com
- **DevOps On-Call**: devops-oncall@austa.com (24/7 emergency support)
- **Slack Channel**: #deployment-support

## Maintenance Procedures

### Scheduled Maintenance

| Procedure | Frequency | Impact | Script |
|-----------|-----------|--------|--------|
| Database Maintenance | Weekly | None | `./maintenance/db-maintenance.sh` |
| Index Optimization | Weekly | None | `./maintenance/optimize-indices.sh` |
| Node Rotation | Monthly | None | `./maintenance/rotate-nodes.sh` |
| Dependency Updates | Weekly | Requires testing | `./maintenance/update-dependencies.sh` |

#### Example: Database Maintenance

```bash
./maintenance/db-maintenance.sh --environment production --service health-service
```

### Emergency Maintenance

For urgent maintenance requirements:

```bash
./emergency-deploy.sh --service affected-service --environment production --fix-branch hotfix/critical-issue
```

This script follows an expedited deployment process while maintaining essential validation steps.

## Disaster Recovery

### Recovery Scenarios

| Scenario | Recovery Strategy | Script |
|----------|-------------------|--------|
| Single AZ Failure | Automatic failover to other AZs | Automatic |
| Region Failure | Manual failover to DR region | `./dr/region-failover.sh` |
| Data Corruption | Point-in-time recovery from backups | `./dr/restore-data.sh` |
| Service Outage | Automatic pod rescheduling | Automatic |
| Security Breach | Isolation, investigation, restore | `./dr/security-recovery.sh` |

### Recovery Procedures

#### Region Failover

```bash
./dr/region-failover.sh --primary-region us-east-1 --dr-region us-west-2
```

#### Data Restoration

```bash
./dr/restore-data.sh --service health-service --timestamp "2023-06-15 14:30:00" --environment production
```

#### Security Incident Recovery

```bash
./dr/security-recovery.sh --isolation-level service --service affected-service --environment production
```

## Appendix

### Script Parameters Reference

#### Global Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `--environment` | Target environment (development, staging, production) | None | Yes |
| `--version` | Version to deploy | None | Yes |
| `--debug` | Enable debug output | false | No |
| `--help` | Show help message | N/A | No |
| `--workspace` | Specific workspace to target (src/web, src/backend) | None | No |
| `--verbose` | Show detailed output | false | No |

#### Service-Specific Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `--service` | Service to deploy | None | For single-service deployments |
| `--journey` | Journey to deploy (health, care, plan) | None | For journey-specific deployments |
| `--config-only` | Update only configuration | false | No |
| `--skip-tests` | Skip post-deployment tests | false | No |
| `--approval-ticket` | Reference to approval ticket | None | For production deployments |
| `--canary-percentage` | Traffic percentage for canary deployment | 10 | No |
| `--event-validation` | Enable event schema validation | true | No |
| `--dependency-check` | Perform dependency resolution check | true | No |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_PROFILE` | AWS profile to use | Yes |
| `KUBECONFIG` | Path to Kubernetes config | Yes |
| `GITHUB_TOKEN` | GitHub token for API access | For CI/CD integration |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | No |
| `TERRAFORM_BACKEND_CONFIG` | Path to Terraform backend config | For infrastructure operations |
| `NODE_VERSION` | Node.js version to use (pinned to 18.15.0) | No |
| `PNPM_VERSION` | PNPM version to use | No |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap servers for event validation | For event validation |
| `DATABASE_URL` | Database connection string | For database operations |
| `JOURNEY_CONFIG_PATH` | Path to journey configuration | For journey-specific deployments |

### Related Documentation

- [Infrastructure Documentation](../../infrastructure/README.md)
- [CI/CD Pipeline Documentation](../../.github/workflows/README.md)
- [Kubernetes Configuration](../../infrastructure/kubernetes/README.md)
- [Database Migration Guide](../../src/backend/shared/prisma/README.md)
- [Journey Architecture Documentation](../../docs/architecture/journeys.md)
- [Gamification Engine Documentation](../../src/backend/gamification-engine/README.md)
- [Event Schema Documentation](../../src/backend/packages/events/README.md)
- [Dependency Management Guide](../../docs/development/dependencies.md)