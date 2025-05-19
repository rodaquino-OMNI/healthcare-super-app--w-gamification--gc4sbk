# Monitoring Scripts

## Overview

This directory contains scripts for configuring, managing, and troubleshooting the AUSTA SuperApp monitoring infrastructure. These scripts support the multi-layered monitoring approach implemented across the platform, covering infrastructure, service, and synthetic monitoring.

## Monitoring Architecture

The AUSTA SuperApp implements a comprehensive monitoring strategy with multiple layers:

- **Infrastructure Monitoring**:
  - AWS CloudWatch for AWS services
  - Prometheus for Kubernetes and container metrics
  - Node exporters for system-level metrics

- **Service Monitoring**:
  - Health endpoints for service availability
  - Custom metrics exposed via Prometheus endpoint
  - Distributed tracing with OpenTelemetry

- **Synthetic Monitoring**:
  - Scheduled API probes
  - Simulated user flows
  - External availability monitoring

## Scripts

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `common.sh` | Shared utilities for all monitoring scripts | Sourced by other scripts |
| `health-checker.sh` | Validates operational status of all services | `./health-checker.sh [--environment=<env>] [--journey=<journey>]` |
| `monitor-dependencies.sh` | Checks health of infrastructure components | `./monitor-dependencies.sh [--environment=<env>]` |
| `collect-metrics.sh` | Automates collection of custom metrics | `./collect-metrics.sh [--service=<service>] [--export-format=<format>]` |

### Configuration Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-dashboards.sh` | Generates and updates Grafana dashboards | `./setup-dashboards.sh [--journey=<journey>] [--template=<template>]` |
| `configure-alerts.sh` | Manages Prometheus AlertManager rules | `./configure-alerts.sh [--environment=<env>] [--severity=<level>]` |
| `setup-tracing.sh` | Configures OpenTelemetry instrumentation | `./setup-tracing.sh [--service=<service>] [--sampling-rate=<rate>]` |

### Analysis Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `analyze-logs.sh` | Queries Loki for error patterns | `./analyze-logs.sh [--timeframe=<period>] [--service=<service>]` |
| `benchmark-services.sh` | Establishes baseline metrics | `./benchmark-services.sh [--service=<service>] [--duration=<time>]` |
| `validate-performance.sh` | Compares metrics against baselines | `./validate-performance.sh [--deployment=<id>] [--threshold=<value>]` |

### CI/CD Integration

| Script | Purpose | Usage |
|--------|---------|-------|
| `monitor-ci-cd.sh` | Configures Prometheus exporters for CI/CD | `./monitor-ci-cd.sh [--workflow=<workflow>] [--repository=<repo>]` |

## Common Usage Patterns

### Pre-Deployment Performance Benchmarking

```bash
# Establish performance baselines before deployment
./benchmark-services.sh --environment=staging --service=all

# Store results in Prometheus for later comparison
./collect-metrics.sh --metrics-type=benchmark --export=true
```

### Post-Deployment Validation

```bash
# Validate performance after deployment
./validate-performance.sh --deployment=$(git rev-parse HEAD) --threshold=10

# Check health of all services
./health-checker.sh --environment=production --deep-check=true
```

### Setting Up Monitoring for a New Service

```bash
# Configure metrics collection
./collect-metrics.sh --service=new-service --configure=true

# Set up tracing
./setup-tracing.sh --service=new-service --sampling-rate=0.1

# Add to dashboards
./setup-dashboards.sh --service=new-service --template=microservice

# Configure alerts
./configure-alerts.sh --service=new-service --severity=warning,critical
```

### Journey-Specific Monitoring

```bash
# Set up health journey monitoring
./setup-dashboards.sh --journey=health --template=journey
./configure-alerts.sh --journey=health --thresholds=default

# Set up care journey monitoring
./setup-dashboards.sh --journey=care --template=journey
./configure-alerts.sh --journey=care --thresholds=default

# Set up plan journey monitoring
./setup-dashboards.sh --journey=plan --template=journey
./configure-alerts.sh --journey=plan --thresholds=default
```

## Environment-Specific Considerations

### Development

- Monitoring in development uses local Prometheus and Grafana instances
- Tracing is configured with 100% sampling rate for comprehensive visibility
- Alerts are disabled by default to prevent notification noise

```bash
# Start local monitoring stack
./collect-metrics.sh --environment=development --start-stack=true

# Configure development dashboards
./setup-dashboards.sh --environment=development --template=dev
```

### Staging

- Staging environment uses the same monitoring infrastructure as production
- Alert thresholds are set higher to accommodate testing activities
- Performance baselines are regularly captured for comparison

```bash
# Update staging alert thresholds
./configure-alerts.sh --environment=staging --apply-preset=staging

# Capture performance baselines weekly
./benchmark-services.sh --environment=staging --schedule=weekly
```

### Production

- Production monitoring includes additional business metrics
- Alert notifications are routed to on-call teams
- Performance validation is mandatory after each deployment

```bash
# Configure production alerts with PagerDuty integration
./configure-alerts.sh --environment=production --notification-channel=pagerduty

# Validate after deployment
./validate-performance.sh --environment=production --block-on-regression=true
```

## Integration with CI/CD Pipeline

The monitoring scripts integrate with the CI/CD pipeline to provide continuous visibility into build and deployment processes:

### GitHub Actions Integration

```yaml
# Example GitHub Actions workflow step
steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Setup monitoring for CI/CD
    run: |
      ./infrastructure/scripts/monitoring/monitor-ci-cd.sh \
        --workflow=${{ github.workflow }} \
        --repository=${{ github.repository }} \
        --run-id=${{ github.run_id }}

  - name: Benchmark before changes
    run: |
      ./infrastructure/scripts/monitoring/benchmark-services.sh \
        --environment=staging \
        --label=pre-deployment

  # Deployment steps here

  - name: Validate performance after deployment
    run: |
      ./infrastructure/scripts/monitoring/validate-performance.sh \
        --deployment=${{ github.sha }} \
        --compare-to=pre-deployment \
        --threshold=10
```

### Performance Baseline Monitoring

The CI/CD pipeline uses these scripts to implement performance baseline monitoring:

1. **Pre-deployment Benchmarking**:
   - Automated collection of container startup times
   - Structured capture of database query execution times
   - Detailed measurement of API response times

2. **Post-deployment Comparison**:
   - Identical measurements executed after deployment
   - Automatic differential analysis against baselines
   - Statistical significance testing for changes

3. **Deployment Decision Support**:
   - Automated blocking of deployments exceeding thresholds
   - Performance impact reporting to development teams
   - Historical trend analysis for degradation patterns

## Troubleshooting

### Common Issues

#### Prometheus Target Not Found

**Symptoms**: Services not appearing in Prometheus targets or metrics not being collected

**Resolution**:
```bash
# Verify service discovery is working
./health-checker.sh --check-type=prometheus-sd

# Manually register target if needed
./collect-metrics.sh --service=missing-service --register-target=true
```

#### Alert Notification Failures

**Symptoms**: Alerts triggered but notifications not received

**Resolution**:
```bash
# Test notification channels
./configure-alerts.sh --test-notifications=true

# Verify alert routing
./configure-alerts.sh --verify-routes=true
```

#### High Cardinality Metrics

**Symptoms**: Prometheus performance issues, slow queries, or storage pressure

**Resolution**:
```bash
# Identify high cardinality metrics
./analyze-logs.sh --log-type=prometheus --pattern="high_cardinality"

# Adjust metric collection
./collect-metrics.sh --optimize-cardinality=true
```

#### Tracing Context Loss

**Symptoms**: Incomplete traces, missing spans between services

**Resolution**:
```bash
# Verify trace context propagation
./setup-tracing.sh --verify-propagation=true

# Fix instrumentation if needed
./setup-tracing.sh --service=affected-service --reinstrument=true
```

### Diagnostic Commands

#### Check Monitoring Stack Health

```bash
# Verify all monitoring components are healthy
./health-checker.sh --check-type=monitoring-stack
```

#### Validate Metric Collection

```bash
# Ensure metrics are being collected properly
./collect-metrics.sh --verify=true --service=all
```

#### Test Alert Rules

```bash
# Test if alert rules are properly configured
./configure-alerts.sh --test-rules=true
```

## Additional Resources

- [Monitoring Architecture Documentation](../../docs/architecture/monitoring.md)
- [Grafana Dashboard Templates](../../kubernetes/monitoring/grafana/dashboards/)
- [Alert Rule Definitions](../../kubernetes/monitoring/prometheus/rules/)
- [OpenTelemetry Configuration](../../kubernetes/monitoring/opentelemetry/)

## Maintenance and Updates

The monitoring scripts should be reviewed and updated when:

- New services are added to the platform
- Significant architecture changes are implemented
- New monitoring requirements are identified
- Monitoring tools are upgraded

To update the monitoring configuration:

```bash
# Update all monitoring components
./collect-metrics.sh --update-config=true
./setup-dashboards.sh --refresh=true
./configure-alerts.sh --update-rules=true
```