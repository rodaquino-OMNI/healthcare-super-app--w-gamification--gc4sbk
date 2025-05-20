# AUSTA SuperApp Maintenance Scripts

## Overview

This directory contains maintenance scripts for the AUSTA SuperApp platform. These scripts are designed to automate routine maintenance tasks, ensure system health, and support operational procedures across all environments (development, staging, and production).

## Script Categories

### Database Maintenance

| Script | Purpose | Frequency | Impact | Automation |
|--------|---------|-----------|--------|------------|
| `db-vacuum.sh` | Performs PostgreSQL VACUUM ANALYZE to optimize database performance | Daily | None | Automated via cron |
| `db-index-optimize.sh` | Rebuilds and optimizes database indexes | Weekly | None | Automated via CI/CD |
| `db-connection-monitor.sh` | Monitors and reports on database connection usage | Hourly | None | Automated via cron |
| `db-backup-verify.sh` | Verifies database backups by performing test restoration | Monthly | None (uses clone) | Semi-automated |

### Kubernetes Maintenance

| Script | Purpose | Frequency | Impact | Automation |
|--------|---------|-----------|--------|------------|
| `k8s-node-drain.sh` | Safely drains Kubernetes nodes for maintenance | Monthly | None (rolling) | Automated via CI/CD |
| `k8s-resource-audit.sh` | Audits resource usage and recommends optimizations | Weekly | None | Automated via CI/CD |
| `k8s-orphaned-resources.sh` | Identifies and cleans up orphaned resources | Weekly | None | Automated via CI/CD |
| `k8s-cert-renewal.sh` | Manages certificate renewal for services | Monthly | None | Automated via cron |

### Security Updates

| Script | Purpose | Frequency | Impact | Automation |
|--------|---------|-----------|--------|------------|
| `security-dependency-scan.sh` | Scans dependencies for security vulnerabilities | Daily | None | Automated via CI/CD |
| `security-patch-report.sh` | Generates report of pending security patches | Weekly | None | Automated via CI/CD |
| `security-compliance-check.sh` | Verifies compliance with security policies | Weekly | None | Automated via CI/CD |
| `security-audit-log.sh` | Archives and analyzes security audit logs | Daily | None | Automated via cron |

### Backup and Recovery

| Script | Purpose | Frequency | Impact | Automation |
|--------|---------|-----------|--------|------------|
| `backup-verify.sh` | Verifies integrity of system backups | Daily | None | Automated via cron |
| `dr-test.sh` | Performs disaster recovery test procedures | Quarterly | None (uses DR region) | Manual with automation |
| `backup-cleanup.sh` | Removes expired backup files | Weekly | None | Automated via cron |
| `point-in-time-recovery-test.sh` | Tests point-in-time recovery capabilities | Monthly | None | Semi-automated |

### Performance Optimization

| Script | Purpose | Frequency | Impact | Automation |
|--------|---------|-----------|--------|------------|
| `perf-baseline.sh` | Establishes performance baselines for monitoring | Weekly | None | Automated via CI/CD |
| `cache-optimize.sh` | Optimizes cache settings based on usage patterns | Weekly | None | Automated via CI/CD |
| `query-performance.sh` | Identifies and reports on slow database queries | Daily | None | Automated via cron |
| `resource-right-size.sh` | Recommends resource allocation adjustments | Monthly | None | Semi-automated |

## Scheduling Guidelines

### Daily Tasks

Daily maintenance tasks are scheduled via cron jobs on the maintenance server. These tasks run during off-peak hours (typically 2:00 AM - 4:00 AM local time) to minimize any potential impact.

```bash
# Example crontab entries for daily tasks
# Database vacuum at 2:00 AM
0 2 * * * /infrastructure/scripts/maintenance/db-vacuum.sh > /var/log/maintenance/db-vacuum-$(date +\%Y\%m\%d).log 2>&1

# Security audit log archiving at 3:00 AM
0 3 * * * /infrastructure/scripts/maintenance/security-audit-log.sh > /var/log/maintenance/security-audit-$(date +\%Y\%m\%d).log 2>&1

# Backup verification at 4:00 AM
0 4 * * * /infrastructure/scripts/maintenance/backup-verify.sh > /var/log/maintenance/backup-verify-$(date +\%Y\%m\%d).log 2>&1
```

### Weekly Tasks

Weekly maintenance tasks are primarily scheduled through the CI/CD pipeline, running every Sunday at 1:00 AM. These tasks are defined in the GitHub Actions workflow file `.github/workflows/weekly-maintenance.yml`.

```yaml
# Example GitHub Actions workflow for weekly maintenance
name: Weekly Maintenance

on:
  schedule:
    # Run every Sunday at 1:00 AM UTC
    - cron: '0 1 * * 0'

jobs:
  database-maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run DB Index Optimization
        run: ./infrastructure/scripts/maintenance/db-index-optimize.sh
        
  kubernetes-maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run K8s Resource Audit
        run: ./infrastructure/scripts/maintenance/k8s-resource-audit.sh
        
  security-maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Compliance Check
        run: ./infrastructure/scripts/maintenance/security-compliance-check.sh
```

### Monthly Tasks

Monthly maintenance tasks are scheduled on the first Sunday of each month and include more comprehensive checks and optimizations.

```yaml
# Example GitHub Actions workflow for monthly maintenance
name: Monthly Maintenance

on:
  schedule:
    # Run on the first Sunday of each month at 12:00 AM UTC
    - cron: '0 0 1-7 * 0'

jobs:
  database-backup-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run DB Backup Verification
        run: ./infrastructure/scripts/maintenance/db-backup-verify.sh
        
  kubernetes-node-maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run K8s Node Drain
        run: ./infrastructure/scripts/maintenance/k8s-node-drain.sh
        
  resource-optimization:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Resource Right-Sizing
        run: ./infrastructure/scripts/maintenance/resource-right-size.sh
```

### Quarterly Tasks

Quarterly maintenance tasks include comprehensive disaster recovery testing and are scheduled manually with appropriate planning and notification.

## Manual Execution Instructions

### Prerequisites

Before running any maintenance script manually, ensure you have:

1. Proper AWS credentials configured
2. Kubernetes cluster access
3. Database access credentials
4. Sufficient permissions for the operations

### Execution Steps

1. Connect to the maintenance server or your local development environment
2. Navigate to the scripts directory:
   ```bash
   cd infrastructure/scripts/maintenance
   ```
3. Make the script executable if needed:
   ```bash
   chmod +x script-name.sh
   ```
4. Execute the script:
   ```bash
   ./script-name.sh [parameters]
   ```
5. Check the output logs:
   ```bash
   cat /var/log/maintenance/script-name-YYYYMMDD.log
   ```

### Example: Running Database Backup Verification

```bash
# Set environment variables
export ENV=staging
export DB_SNAPSHOT_ID=rds:postgres-main-2023-05-19-00-00

# Run the verification script
./db-backup-verify.sh --snapshot-id $DB_SNAPSHOT_ID --target-instance temp-verify

# Check the results
cat /var/log/maintenance/db-backup-verify-$(date +%Y%m%d).log
```

## Automated Execution via CI/CD

Most maintenance scripts are integrated with the CI/CD pipeline for automated execution. The integration is configured in the following GitHub Actions workflow files:

- `.github/workflows/daily-maintenance.yml`
- `.github/workflows/weekly-maintenance.yml`
- `.github/workflows/monthly-maintenance.yml`

### CI/CD Integration Benefits

- Consistent execution environment
- Automatic logging and notification
- Version-controlled script execution
- Audit trail of maintenance activities
- Integration with monitoring systems

### Example: CI/CD Workflow for Database Maintenance

```yaml
name: Database Maintenance

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC
  workflow_dispatch:     # Allow manual triggering

jobs:
  vacuum-analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Run Database Vacuum
        run: ./infrastructure/scripts/maintenance/db-vacuum.sh
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          
      - name: Upload logs
        uses: actions/upload-artifact@v3
        with:
          name: maintenance-logs
          path: /tmp/db-vacuum.log
```

## Environment-Specific Configurations

Maintenance scripts support different environments through configuration files and environment variables.

### Configuration Files

Environment-specific configurations are stored in:
- `infrastructure/scripts/maintenance/config/development.env`
- `infrastructure/scripts/maintenance/config/staging.env`
- `infrastructure/scripts/maintenance/config/production.env`

### Environment Variables

Scripts use the following environment variables:
- `ENV`: The target environment (development, staging, production)
- `MAINTENANCE_CONFIG_PATH`: Path to custom configuration file
- `NOTIFICATION_ENDPOINT`: Webhook URL for notifications
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

### Example: Loading Environment Configuration

```bash
#!/bin/bash
# Script: db-vacuum.sh

# Load environment configuration
ENV=${ENV:-production}
CONFIG_FILE=${MAINTENANCE_CONFIG_PATH:-"./config/${ENV}.env"}

if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
else
  echo "Error: Configuration file not found: $CONFIG_FILE"
  exit 1
fi

# Execute maintenance task
echo "Starting database vacuum for environment: $ENV"
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Database Maintenance Scripts

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Connection timeout | Network issues or database under load | Retry during off-peak hours or check network connectivity |
| Insufficient privileges | Missing database permissions | Ensure maintenance user has appropriate permissions |
| Disk space warning | Low disk space on database server | Clean up old logs or allocate additional storage |
| Long-running vacuum | Large tables or high transaction volume | Consider adjusting maintenance window or using incremental vacuum |

#### Kubernetes Maintenance Scripts

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Node drain failure | Pods with no PodDisruptionBudget | Add PDBs to critical services or force drain with caution |
| Resource audit timeout | Large cluster with many resources | Increase script timeout or run in segments |
| Permission denied | Insufficient RBAC permissions | Update Kubernetes RBAC roles for maintenance service account |
| Certificate renewal failure | Invalid certificate authority | Check certificate chain and renewal configuration |

#### Backup and Recovery Scripts

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Backup verification failure | Corrupted backup or storage issues | Check storage integrity and retry with different backup |
| Slow restoration | Large database size | Adjust timeout parameters or optimize restoration process |
| Missing backup files | Retention policy misconfiguration | Review backup retention settings and storage lifecycle policies |
| DR test failure | Configuration drift between regions | Synchronize configurations and update DR documentation |

### Logging and Monitoring

All maintenance scripts log their activity to:

1. Standard output/error (captured by CI/CD system)
2. Local log files in `/var/log/maintenance/`
3. CloudWatch Logs (when running in AWS environments)

Monitoring alerts are configured for:

- Failed maintenance tasks
- Maintenance tasks exceeding expected duration
- Critical resources identified during audits
- Security compliance violations

### Escalation Procedures

If a maintenance script fails:

1. Check the logs for specific error messages
2. Consult the troubleshooting guide above
3. If unresolved, escalate to the appropriate team:
   - Database issues: Data Engineering team
   - Kubernetes issues: Platform Engineering team
   - Security issues: Security Operations team
   - Backup/recovery issues: Site Reliability Engineering team

## Backup and Disaster Recovery Procedures

### Backup Verification

The `backup-verify.sh` script performs the following checks:

1. Verifies backup file integrity
2. Performs test restoration to a temporary environment
3. Runs validation queries to ensure data consistency
4. Generates a verification report

```bash
# Example: Verify RDS snapshot
./backup-verify.sh --type rds --snapshot-id postgres-main-2023-05-19-00-00 --validation-queries ./validation/health_service_queries.sql
```

### Point-in-Time Recovery Testing

The `point-in-time-recovery-test.sh` script tests the ability to restore to a specific point in time:

1. Identifies a target timestamp
2. Initiates point-in-time recovery to a test instance
3. Validates database state at the recovered point
4. Generates a recovery test report

```bash
# Example: Test point-in-time recovery
./point-in-time-recovery-test.sh --source-db postgres-main --timestamp "2023-05-19T10:30:00Z" --validation-script ./validation/validate_pitr.sh
```

### Disaster Recovery Testing

The `dr-test.sh` script performs comprehensive disaster recovery testing:

1. Simulates primary region failure
2. Executes failover to DR region
3. Validates application functionality in DR region
4. Tests failback procedure
5. Generates DR test report

```bash
# Example: Perform DR test
./dr-test.sh --primary-region us-east-1 --dr-region us-west-2 --services "api-gateway,auth-service,health-service" --test-suite ./dr-tests/critical-paths.js
```

### Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

The maintenance scripts help ensure that the system meets its defined RTO and RPO:

| Scenario | Recovery Strategy | RPO | RTO |
|----------|-------------------|-----|-----|
| Single AZ Failure | Automatic failover to other AZs | 0 | <5 minutes |
| Region Failure | Manual failover to DR region | 15 minutes | 4 hours |
| Data Corruption | Point-in-time recovery from backups | 5 minutes | 1 hour |
| Service Outage | Automatic pod rescheduling | 0 | <5 minutes |

## Contributing

### Adding New Maintenance Scripts

1. Create your script in the appropriate category directory
2. Follow the script template and coding standards
3. Add appropriate logging and error handling
4. Update this README with script details
5. Create CI/CD workflow for automation if needed
6. Submit a pull request for review

### Script Template

```bash
#!/bin/bash
# Script: script-name.sh
# Purpose: Brief description of the script's purpose
# Usage: ./script-name.sh [options]
# Author: Your Name
# Last Updated: YYYY-MM-DD

set -e

# Load common functions
source "$(dirname "$0")/common/functions.sh"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --option1)
      OPTION1="$2"
      shift 2
      ;;
    --option2)
      OPTION2="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./script-name.sh --option1 value1 --option2 value2"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Load environment configuration
ENV=${ENV:-production}
CONFIG_FILE=${MAINTENANCE_CONFIG_PATH:-"./config/${ENV}.env"}

if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
else
  echo "Error: Configuration file not found: $CONFIG_FILE"
  exit 1
fi

# Initialize logging
log_init "script-name"

# Main logic
log_info "Starting maintenance task"

# Your script logic here

log_info "Maintenance task completed successfully"
exit 0
```

## Contact Information

- **Platform Engineering Team**: platform@austa.health
- **Data Engineering Team**: data@austa.health
- **Security Team**: security@austa.health
- **SRE Team**: sre@austa.health

## References

- [AWS RDS Maintenance Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html)
- [Kubernetes Node Maintenance](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)
- [PostgreSQL Vacuum Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)