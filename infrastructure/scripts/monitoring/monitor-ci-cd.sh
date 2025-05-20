#!/bin/bash

# =========================================================
# AUSTA SuperApp - CI/CD Monitoring Script
# =========================================================
# This script configures Prometheus exporters for GitHub Actions
# workflows, sets up custom metrics for build performance,
# manages CI/CD pipeline health dashboards, and establishes
# alerts for build failures or performance degradations.
# =========================================================
# Usage: ./monitor-ci-cd.sh [--install-exporters] [--configure-metrics] [--setup-dashboard] [--configure-alerts] [--all]
# Permissions: chmod +x monitor-ci-cd.sh
# =========================================================
# Author: AUSTA SuperApp Team
# Created: 2025-05-19
# =========================================================

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# =========================================================
# Configuration Variables
# =========================================================

# GitHub Actions configuration
GITHUB_ORG=${GITHUB_ORG:-"austa-superapp"}
GITHUB_REPOS=("web" "backend" "mobile" "design-system" "primitives" "interfaces" "journey-context")
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

# Prometheus exporter configuration
EXPORTER_IMAGE="ghcr.io/austa-superapp/github-actions-exporter:latest"
EXPORTER_PORT=9090
EXPORTER_NAMESPACE="monitoring"

# Alert configuration
ALERT_RULES_FILE="/tmp/ci-cd-alert-rules.yaml"
ALERT_CONFIG_MAP="ci-cd-alert-rules"

# Dashboard configuration
DASHBOARD_FILE="/tmp/ci-cd-dashboard.json"
DASHBOARD_CONFIG_MAP="journey-dashboards"
DASHBOARD_KEY="cicd-health-dashboard.json"

# =========================================================
# Prometheus Exporter Functions
# =========================================================

# Install GitHub Actions Prometheus exporter
install_github_actions_exporter() {
  log_info "Installing GitHub Actions Prometheus exporter..."
  
  # Create Kubernetes namespace if it doesn't exist
  kubectl get namespace "${EXPORTER_NAMESPACE}" >/dev/null 2>&1 || kubectl create namespace "${EXPORTER_NAMESPACE}"
  
  # Create secret for GitHub token
  if [[ -n "${GITHUB_TOKEN}" ]]; then
    kubectl -n "${EXPORTER_NAMESPACE}" create secret generic github-token \
      --from-literal=token="${GITHUB_TOKEN}" \
      --dry-run=client -o yaml | kubectl apply -f -
    log_info "Created GitHub token secret"
  else
    log_warn "No GitHub token provided. Exporter will use rate-limited anonymous access."
  fi
  
  # Create ConfigMap for exporter configuration
  cat <<EOF > /tmp/exporter-config.yaml
repositories:
$(for repo in "${GITHUB_REPOS[@]}"; do echo "  - ${GITHUB_ORG}/${repo}"; done)
workflows:
  - name: "build"
  - name: "test"
  - name: "deploy"
  - name: "dependency-validation"
metrics:
  - build_duration_seconds
  - dependency_validation_failures_total
  - dependency_validation_runs_total
  - github_workflow_run_duration_seconds
  - github_workflow_run_conclusion
  - github_workflow_cache_hits
  - github_workflow_cache_misses
  - dependency_resolution_seconds
interval: 60s
EOF

  kubectl -n "${EXPORTER_NAMESPACE}" create configmap github-actions-exporter-config \
    --from-file=config.yaml=/tmp/exporter-config.yaml \
    --dry-run=client -o yaml | kubectl apply -f -
  log_info "Created exporter configuration"
  
  # Create deployment for the exporter
  cat <<EOF > /tmp/exporter-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: github-actions-exporter
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: github-actions-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: github-actions-exporter
  template:
    metadata:
      labels:
        app: github-actions-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${EXPORTER_PORT}"
    spec:
      containers:
      - name: exporter
        image: ${EXPORTER_IMAGE}
        ports:
        - containerPort: ${EXPORTER_PORT}
        env:
        - name: CONFIG_PATH
          value: "/config/config.yaml"
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: github-token
              key: token
              optional: true
        volumeMounts:
        - name: config
          mountPath: /config
        resources:
          limits:
            cpu: 200m
            memory: 256Mi
          requests:
            cpu: 100m
            memory: 128Mi
        livenessProbe:
          httpGet:
            path: /metrics
            port: ${EXPORTER_PORT}
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /metrics
            port: ${EXPORTER_PORT}
          initialDelaySeconds: 10
          timeoutSeconds: 5
          periodSeconds: 10
      volumes:
      - name: config
        configMap:
          name: github-actions-exporter-config
EOF

  kubectl apply -f /tmp/exporter-deployment.yaml
  log_info "Created exporter deployment"
  
  # Create service for the exporter
  cat <<EOF > /tmp/exporter-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: github-actions-exporter
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: github-actions-exporter
spec:
  selector:
    app: github-actions-exporter
  ports:
  - port: ${EXPORTER_PORT}
    targetPort: ${EXPORTER_PORT}
    protocol: TCP
    name: metrics
EOF

  kubectl apply -f /tmp/exporter-service.yaml
  log_info "Created exporter service"
  
  # Add scrape configuration to Prometheus
  configure_prometheus_scrape
  
  log_info "GitHub Actions exporter installation complete"
}

# Configure Prometheus to scrape the exporter
configure_prometheus_scrape() {
  log_info "Configuring Prometheus to scrape GitHub Actions exporter..."
  
  # Create additional scrape configuration
  cat <<EOF > /tmp/additional-scrape-config.yaml
- job_name: 'github-actions-exporter'
  scrape_interval: 30s
  metrics_path: '/metrics'
  kubernetes_sd_configs:
  - role: service
    namespaces:
      names:
      - ${EXPORTER_NAMESPACE}
    selectors:
    - role: service
      label: "app=github-actions-exporter"
  relabel_configs:
  - source_labels: [__meta_kubernetes_service_label_app]
    regex: github-actions-exporter
    action: keep
  - source_labels: [__meta_kubernetes_service_name]
    target_label: service
EOF

  # Update the additional scrape configs secret
  kubectl -n "${EXPORTER_NAMESPACE}" create secret generic additional-scrape-configs \
    --from-file=prometheus-additional.yaml=/tmp/additional-scrape-config.yaml \
    --dry-run=client -o yaml | kubectl apply -f -
  log_info "Updated Prometheus scrape configuration"
  
  # Check if Prometheus needs to be reloaded
  if kubectl -n "${EXPORTER_NAMESPACE}" get prometheus austa-prometheus &>/dev/null; then
    log_info "Reloading Prometheus configuration..."
    kubectl -n "${EXPORTER_NAMESPACE}" patch prometheus austa-prometheus --type=json \
      -p='[{"op": "replace", "path": "/spec/additionalScrapeConfigs/name", "value": "additional-scrape-configs"}]'
    log_info "Prometheus configuration reloaded"
  else
    log_warn "Prometheus custom resource not found. Manual configuration may be required."
  fi
}

# =========================================================
# Custom Metrics Configuration Functions
# =========================================================

# Configure custom metrics for CI/CD monitoring
configure_custom_metrics() {
  log_info "Configuring custom metrics for CI/CD monitoring..."
  
  # Create recording rules for CI/CD metrics
  cat <<EOF > /tmp/ci-cd-recording-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ci-cd-recording-rules
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: austa-superapp
    role: recording-rules
    type: performance-baseline
spec:
  groups:
  - name: ci_cd_metrics
    interval: 1m
    rules:
    # Build performance metrics
    - record: build_time_avg_by_repo
      expr: avg(github_workflow_run_duration_seconds) by (repository)
    - record: build_time_p50
      expr: histogram_quantile(0.5, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, repository))
    - record: build_time_p90
      expr: histogram_quantile(0.9, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, repository))
    - record: build_time_p99
      expr: histogram_quantile(0.99, sum(rate(github_workflow_run_duration_seconds_bucket[24h])) by (le, repository))
    
    # Build success rate metrics
    - record: build_success_rate
      expr: sum(github_workflow_run_conclusion{conclusion="success"}) by (repository, workflow) / sum(github_workflow_run_conclusion) by (repository, workflow) * 100
    
    # Dependency metrics
    - record: dependency_validation_failure_rate
      expr: sum(rate(dependency_validation_failures_total[6h])) by (repository) / sum(rate(dependency_validation_runs_total[6h])) by (repository) * 100
    - record: dependency_cache_hit_ratio
      expr: sum(github_workflow_cache_hits) by (repository) / (sum(github_workflow_cache_hits) by (repository) + sum(github_workflow_cache_misses) by (repository)) * 100
    
    # Mean time between failures and to recovery
    - record: mtbf_seconds
      expr: avg_over_time(time() - timestamp(changes(github_workflow_run_conclusion{conclusion="failure"}[30d]) > 0)[30d:1h])
    - record: mttr_seconds
      expr: avg_over_time(time() - timestamp(changes(github_workflow_run_conclusion{conclusion="success"} offset 1m)[30d:1h]) > 0)[30d:1h]
    
    # Resource utilization metrics
    - record: build_cpu_usage_avg
      expr: avg(rate(container_cpu_usage_seconds_total{pod=~"github-actions-runner.*"}[5m])) by (repository) * 100
    - record: build_memory_usage_avg
      expr: avg(container_memory_usage_bytes{pod=~"github-actions-runner.*"}) by (repository) / 1024 / 1024
EOF

  kubectl apply -f /tmp/ci-cd-recording-rules.yaml
  log_info "Applied CI/CD recording rules"
  
  # Create custom metrics for build performance
  cat <<EOF > /tmp/build-performance-metrics.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: build-performance-metrics
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: austa-superapp
    role: recording-rules
    type: performance-baseline
spec:
  groups:
  - name: build_performance
    interval: 5m
    rules:
    # Build performance baseline metrics
    - record: build_performance_baseline
      expr: avg_over_time(build_time_avg_by_repo[7d])
    - record: build_performance_trend
      expr: deriv(build_time_avg_by_repo[7d])
    - record: dependency_resolution_baseline
      expr: avg_over_time(dependency_resolution_seconds[7d])
    - record: cache_hit_ratio_baseline
      expr: avg_over_time(dependency_cache_hit_ratio[7d])
EOF

  kubectl apply -f /tmp/build-performance-metrics.yaml
  log_info "Applied build performance metrics"
  
  log_info "Custom metrics configuration complete"
}

# =========================================================
# Grafana Dashboard Functions
# =========================================================

# Setup CI/CD Health dashboard in Grafana
setup_cicd_dashboard() {
  log_info "Setting up CI/CD Health dashboard in Grafana..."
  
  # Create dashboard JSON
  cat <<EOF > "${DASHBOARD_FILE}"
{
  "title": "CI/CD Health Dashboard",
  "uid": "cicd-health",
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      },
      {
        "datasource": "Prometheus",
        "enable": true,
        "expr": "changes(deployment_events_total[5m]) > 0",
        "iconColor": "rgba(255, 96, 96, 1)",
        "name": "Deployments",
        "titleFormat": "Deployment",
        "textFormat": "Version ${tag} deployed to ${environment}"
      }
    ]
  },
  "panels": [
    {
      "title": "Build Performance Overview",
      "type": "row",
      "collapsed": false
    },
    {
      "title": "Average Build Times",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_time_avg_by_repo",
          "legendFormat": "{{repository}}"
        }
      ]
    },
    {
      "title": "Build Time Distribution",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_time_p50",
          "legendFormat": "p50 {{repository}}"
        },
        {
          "expr": "build_time_p90",
          "legendFormat": "p90 {{repository}}"
        },
        {
          "expr": "build_time_p99",
          "legendFormat": "p99 {{repository}}"
        }
      ]
    },
    {
      "title": "Build Time Trend (7d)",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_performance_trend",
          "legendFormat": "{{repository}} trend"
        }
      ]
    },
    {
      "title": "Pipeline Stability Metrics",
      "type": "row",
      "collapsed": false
    },
    {
      "title": "Build Success Rate",
      "type": "gauge",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_success_rate",
          "legendFormat": "{{repository}} - {{workflow}}"
        }
      ],
      "options": {
        "thresholds": [
          {
            "color": "red",
            "value": 0
          },
          {
            "color": "yellow",
            "value": 80
          },
          {
            "color": "green",
            "value": 95
          }
        ]
      }
    },
    {
      "title": "Failure Categories",
      "type": "piechart",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum(increase(github_workflow_run_conclusion{conclusion!='success'}[24h])) by (conclusion)",
          "legendFormat": "{{conclusion}}"
        }
      ]
    },
    {
      "title": "Mean Time Between Failures",
      "type": "stat",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "mtbf_seconds / 3600",
          "legendFormat": "{{workflow}}"
        }
      ],
      "options": {
        "unit": "hours"
      }
    },
    {
      "title": "Mean Time To Recovery",
      "type": "stat",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "mttr_seconds / 60",
          "legendFormat": "{{workflow}}"
        }
      ],
      "options": {
        "unit": "minutes"
      }
    },
    {
      "title": "Dependency Management",
      "type": "row",
      "collapsed": false
    },
    {
      "title": "Cache Hit Ratio",
      "type": "gauge",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "dependency_cache_hit_ratio",
          "legendFormat": "{{repository}}"
        }
      ],
      "options": {
        "thresholds": [
          {
            "color": "red",
            "value": 0
          },
          {
            "color": "yellow",
            "value": 50
          },
          {
            "color": "green",
            "value": 80
          }
        ]
      }
    },
    {
      "title": "Dependency Resolution Time",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "dependency_resolution_seconds",
          "legendFormat": "{{repository}}"
        },
        {
          "expr": "dependency_resolution_baseline",
          "legendFormat": "{{repository}} baseline"
        }
      ]
    },
    {
      "title": "Validation Failures",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "dependency_validation_failure_rate",
          "legendFormat": "{{repository}}"
        }
      ],
      "options": {
        "unit": "percent"
      }
    },
    {
      "title": "Resource Utilization",
      "type": "row",
      "collapsed": false
    },
    {
      "title": "Runner Utilization",
      "type": "heatmap",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum(rate(github_workflow_run_duration_seconds_count[5m])) by (repository)",
          "legendFormat": "{{repository}}"
        }
      ]
    },
    {
      "title": "CPU Usage During Builds",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_cpu_usage_avg",
          "legendFormat": "{{repository}}"
        }
      ],
      "options": {
        "unit": "percent"
      }
    },
    {
      "title": "Memory Usage During Builds",
      "type": "graph",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "build_memory_usage_avg",
          "legendFormat": "{{repository}} (MB)"
        }
      ],
      "options": {
        "unit": "megabytes"
      }
    },
    {
      "title": "Build Performance Comparison",
      "type": "row",
      "collapsed": false
    },
    {
      "title": "Build Time vs Baseline",
      "type": "bar",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "(build_time_avg_by_repo / build_performance_baseline - 1) * 100",
          "legendFormat": "{{repository}}"
        }
      ],
      "options": {
        "unit": "percent"
      }
    },
    {
      "title": "Cache Hit Ratio vs Baseline",
      "type": "bar",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "dependency_cache_hit_ratio - cache_hit_ratio_baseline",
          "legendFormat": "{{repository}}"
        }
      ],
      "options": {
        "unit": "percent"
      }
    }
  ],
  "refresh": "5m",
  "time": {
    "from": "now-24h",
    "to": "now"
  },
  "timepicker": {
    "refresh_intervals": [
      "5s",
      "10s",
      "30s",
      "1m",
      "5m",
      "15m",
      "30m",
      "1h",
      "2h",
      "1d"
    ]
  },
  "timezone": "",
  "schemaVersion": 27,
  "version": 1,
  "tags": ["ci-cd", "devops", "pipeline"]
}
EOF

  # Update the dashboard in Grafana
  if kubectl -n "${EXPORTER_NAMESPACE}" get configmap "${DASHBOARD_CONFIG_MAP}" &>/dev/null; then
    # Create a temporary file with escaped JSON content
    ESCAPED_CONTENT=$(cat "${DASHBOARD_FILE}" | sed 's/"/\\"/g' | sed 's/$/\\n/g' | tr -d '\n')
    
    # Create patch file
    cat <<EOF > /tmp/dashboard-patch.json
{
  "data": {
    "${DASHBOARD_KEY}": "${ESCAPED_CONTENT}"
  }
}
EOF
    
    # Apply the patch
    kubectl -n "${EXPORTER_NAMESPACE}" patch configmap "${DASHBOARD_CONFIG_MAP}" --patch "$(cat /tmp/dashboard-patch.json)"
    log_info "Updated CI/CD Health dashboard in ConfigMap"
  else
    log_warn "Dashboard ConfigMap '${DASHBOARD_CONFIG_MAP}' not found. Manual configuration may be required."
  fi
  
  log_info "CI/CD Health dashboard setup complete"
}

# =========================================================
# Alert Configuration Functions
# =========================================================

# Configure alerts for CI/CD monitoring
configure_alerts() {
  log_info "Configuring alerts for CI/CD monitoring..."
  
  # Create alert rules for CI/CD monitoring
  cat <<EOF > "${ALERT_RULES_FILE}"
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ci-cd-alert-rules
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: austa-superapp
    role: alert-rules
    component: ci-cd
spec:
  groups:
  - name: ci_cd_alerts
    rules:
    # Dependency validation failure alerts
    - alert: DependencyValidationFailureRate
      expr: sum(rate(dependency_validation_failures_total[6h])) by (repository) / sum(rate(dependency_validation_runs_total[6h])) by (repository) > 0.05
      for: 10m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: "High dependency validation failure rate for {{ $labels.repository }}"
        description: "Dependency validation is failing at a rate of {{ $value | humanizePercentage }} over the last 6 hours for {{ $labels.repository }}"
    
    # Build performance alerts
    - alert: BuildTimeTooLong
      expr: avg(github_workflow_run_duration_seconds) by (repository, workflow) > 600
      for: 5m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "Build time exceeds 10 minutes for {{ $labels.repository }}/{{ $labels.workflow }}"
        description: "Average build time for {{ $labels.repository }}/{{ $labels.workflow }} is {{ $value | humanizeDuration }}"
    
    - alert: BuildTimeCritical
      expr: avg(github_workflow_run_duration_seconds) by (repository, workflow) > 1200
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: "Build time exceeds 20 minutes for {{ $labels.repository }}/{{ $labels.workflow }}"
        description: "Average build time for {{ $labels.repository }}/{{ $labels.workflow }} is {{ $value | humanizeDuration }}"
    
    # Pipeline stability alerts
    - alert: ProductionDeploymentFailure
      expr: github_workflow_run_conclusion{workflow="deploy", branch="main", conclusion!="success"} > 0
      for: 1m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: "Production deployment failed for {{ $labels.repository }}"
        description: "Production deployment workflow failed with conclusion '{{ $labels.conclusion }}'"
    
    - alert: StagingWorkflowSuccessRateLow
      expr: sum(github_workflow_run_conclusion{branch="develop", conclusion="success"}) by (repository) / sum(github_workflow_run_conclusion{branch="develop"}) by (repository) < 0.9
      for: 30m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "Staging workflow success rate below 90% for {{ $labels.repository }}"
        description: "Staging workflow success rate is {{ $value | humanizePercentage }} over the last 30 minutes"
    
    - alert: SecurityScanFailure
      expr: github_workflow_run_conclusion{workflow=~".*security.*", conclusion!="success"} > 0
      for: 1m
      labels:
        severity: critical
        team: security
      annotations:
        summary: "Security scan failed for {{ $labels.repository }}"
        description: "Security scan workflow failed with conclusion '{{ $labels.conclusion }}'"
    
    # Cache performance alerts
    - alert: LowCacheHitRatio
      expr: dependency_cache_hit_ratio < 50
      for: 1h
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "Low cache hit ratio for {{ $labels.repository }}"
        description: "Cache hit ratio is {{ $value | humanizePercentage }} for {{ $labels.repository }}, which is below the 50% threshold"
    
    # Build regression alerts
    - alert: BuildTimeRegression
      expr: (build_time_avg_by_repo / build_performance_baseline - 1) * 100 > 20
      for: 30m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "Build time regression detected for {{ $labels.repository }}"
        description: "Build time has increased by {{ $value | humanizePercentage }} compared to the 7-day baseline"
EOF

  # Apply the alert rules
  kubectl apply -f "${ALERT_RULES_FILE}"
  log_info "Applied CI/CD alert rules"
  
  # Create ConfigMap for alert rules if needed
  if ! kubectl -n "${EXPORTER_NAMESPACE}" get configmap "${ALERT_CONFIG_MAP}" &>/dev/null; then
    kubectl -n "${EXPORTER_NAMESPACE}" create configmap "${ALERT_CONFIG_MAP}" \
      --from-file="${ALERT_RULES_FILE}"
    log_info "Created alert rules ConfigMap"
  fi
  
  log_info "CI/CD alert configuration complete"
}

# =========================================================
# Integration with Central Monitoring Functions
# =========================================================

# Integrate CI/CD metrics with central monitoring system
integrate_with_central_monitoring() {
  log_info "Integrating CI/CD metrics with central monitoring system..."
  
  # Create recording rules for CI/CD metrics in central monitoring
  cat <<EOF > /tmp/central-monitoring-integration.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ci-cd-central-integration
  namespace: ${EXPORTER_NAMESPACE}
  labels:
    app: austa-superapp
    role: recording-rules
    type: integration
spec:
  groups:
  - name: ci_cd_central_integration
    interval: 5m
    rules:
    # Unified view metrics
    - record: service_deployment_frequency
      expr: count_over_time(changes(github_workflow_run_conclusion{workflow="deploy", conclusion="success"}[7d]) > 0[7d:1h]) / 7
    - record: service_deployment_lead_time
      expr: avg_over_time(github_workflow_run_duration_seconds{workflow="deploy"}[7d])
    - record: service_change_failure_rate
      expr: sum(github_workflow_run_conclusion{workflow="deploy", conclusion!="success"}) / sum(github_workflow_run_conclusion{workflow="deploy"}) * 100
    - record: service_time_to_restore
      expr: mttr_seconds
    
    # Executive dashboard metrics
    - record: deployment_velocity
      expr: sum(service_deployment_frequency) by (repository)
    - record: deployment_stability
      expr: 100 - sum(service_change_failure_rate) by (repository)
EOF

  kubectl apply -f /tmp/central-monitoring-integration.yaml
  log_info "Applied central monitoring integration rules"
  
  # Create CloudWatch cross-account metrics if AWS CLI is available
  if command -v aws &>/dev/null; then
    log_info "Setting up CloudWatch cross-account metrics..."
    
    # Create CloudWatch metrics configuration
    cat <<EOF > /tmp/cloudwatch-metrics-config.yaml
metrics:
  - aws_namespace: "AUSTA/CICD"
    rules:
      - expr: build_success_rate
        name: BuildSuccessRate
        dimensions:
          - repository
          - workflow
      - expr: dependency_validation_failure_rate
        name: DependencyValidationFailureRate
        dimensions:
          - repository
      - expr: build_time_avg_by_repo
        name: BuildTimeAverage
        dimensions:
          - repository
      - expr: dependency_cache_hit_ratio
        name: CacheHitRatio
        dimensions:
          - repository
EOF

    # Apply CloudWatch metrics configuration
    if kubectl -n "${EXPORTER_NAMESPACE}" get configmap prometheus-cloudwatch-exporter-config &>/dev/null; then
      kubectl -n "${EXPORTER_NAMESPACE}" create configmap prometheus-cloudwatch-exporter-config \
        --from-file=config.yaml=/tmp/cloudwatch-metrics-config.yaml \
        --dry-run=client -o yaml | kubectl apply -f -
      log_info "Updated CloudWatch metrics configuration"
    else
      log_warn "CloudWatch exporter ConfigMap not found. Manual configuration may be required."
    fi
  else
    log_warn "AWS CLI not found. Skipping CloudWatch cross-account metrics setup."
  fi
  
  log_info "CI/CD metrics integration with central monitoring complete"
}

# =========================================================
# Main Execution Flow
# =========================================================

# Print usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Configure CI/CD monitoring for AUSTA SuperApp"
  echo ""
  echo "Options:"
  echo "  --install-exporters   Install GitHub Actions Prometheus exporters"
  echo "  --configure-metrics   Configure custom metrics for build performance"
  echo "  --setup-dashboard     Setup CI/CD Health dashboard in Grafana"
  echo "  --configure-alerts    Configure alerts for build failures"
  echo "  --integrate           Integrate with central monitoring system"
  echo "  --all                 Perform all actions"
  echo "  --help                Display this help message"
  echo ""
  echo "Example: $0 --all"
}

# Check if no arguments provided
if [[ $# -eq 0 ]]; then
  usage
  exit 1
 fi

# Process command line arguments
INSTALL_EXPORTERS=false
CONFIGURE_METRICS=false
SETUP_DASHBOARD=false
CONFIGURE_ALERTS=false
INTEGRATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-exporters)
      INSTALL_EXPORTERS=true
      shift
      ;;
    --configure-metrics)
      CONFIGURE_METRICS=true
      shift
      ;;
    --setup-dashboard)
      SETUP_DASHBOARD=true
      shift
      ;;
    --configure-alerts)
      CONFIGURE_ALERTS=true
      shift
      ;;
    --integrate)
      INTEGRATE=true
      shift
      ;;
    --all)
      INSTALL_EXPORTERS=true
      CONFIGURE_METRICS=true
      SETUP_DASHBOARD=true
      CONFIGURE_ALERTS=true
      INTEGRATE=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# Check dependencies
check_dependencies

# Execute requested actions
if [[ "$INSTALL_EXPORTERS" == "true" ]]; then
  install_github_actions_exporter
fi

if [[ "$CONFIGURE_METRICS" == "true" ]]; then
  configure_custom_metrics
fi

if [[ "$SETUP_DASHBOARD" == "true" ]]; then
  setup_cicd_dashboard
fi

if [[ "$CONFIGURE_ALERTS" == "true" ]]; then
  configure_alerts
fi

if [[ "$INTEGRATE" == "true" ]]; then
  integrate_with_central_monitoring
fi

log_info "CI/CD monitoring configuration completed successfully"
exit 0