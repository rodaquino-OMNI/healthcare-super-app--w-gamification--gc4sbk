#!/bin/bash

# AUSTA SuperApp - Alert Configuration Script
# This script configures Prometheus AlertManager rules for service health, performance thresholds,
# and business metrics, with journey-specific alerting policies, notification routes, and severity levels.
# 
# It implements the following key features:
# - Journey-specific alerting policies with appropriate thresholds
# - Notification routing based on service and severity
# - Alert templates for standard monitoring metrics
# - Silence and maintenance window handling
# - CI/CD pipeline monitoring alerts
# - SLA monitoring based on performance requirements

set -e

# Configuration variables
PROMETHEUS_NAMESPACE="monitoring"
ALERT_RULES_DIR="/tmp/alert-rules"
KUBE_CONTEXT="austa-superapp"

# Create temporary directory for alert rules
mkdir -p "${ALERT_RULES_DIR}"

# Log function for script output
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting alert configuration for AUSTA SuperApp"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
  log "Error: kubectl is not installed or not in PATH"
  exit 1
}

# Check if yq is available for YAML processing
if ! command -v yq &> /dev/null; then
  log "Error: yq is not installed or not in PATH"
  exit 1
}

# Set Kubernetes context
kubectl config use-context "${KUBE_CONTEXT}" || {
  log "Error: Failed to set Kubernetes context to ${KUBE_CONTEXT}"
  exit 1
}

# Function to create PrometheusRule CR
create_prometheus_rule() {
  local name=$1
  local namespace=$2
  local severity=$3
  local rule_file=$4
  
  log "Creating PrometheusRule ${name} in namespace ${namespace} with severity ${severity}"
  
  kubectl apply -f "${rule_file}" || {
    log "Error: Failed to apply PrometheusRule ${name}"
    return 1
  }
  
  log "Successfully created PrometheusRule ${name}"
  return 0
}

# Function to create silence for maintenance windows
create_silence() {
  local start_time=$1
  local end_time=$2
  local matcher=$3
  local comment=$4
  
  log "Creating silence from ${start_time} to ${end_time} for ${matcher}"
  
  # Format for AlertManager API
  local silence_json='{"matchers":[{"name":"'$(echo $matcher | cut -d= -f1)'","value":"'$(echo $matcher | cut -d= -f2)'","isRegex":false}],"startsAt":"'$start_time'","endsAt":"'$end_time'","createdBy":"configure-alerts.sh","comment":"'$comment'"}'
  
  # Get AlertManager service
  local alertmanager_svc=$(kubectl get svc -n ${PROMETHEUS_NAMESPACE} -l app=alertmanager -o jsonpath='{.items[0].metadata.name}')
  
  # Create port-forward to AlertManager
  kubectl port-forward svc/${alertmanager_svc} -n ${PROMETHEUS_NAMESPACE} 9093:9093 &
  local pf_pid=$!
  sleep 2
  
  # Create silence
  curl -s -X POST -H "Content-Type: application/json" -d "${silence_json}" http://localhost:9093/api/v2/silences
  
  # Kill port-forward
  kill $pf_pid
  
  log "Silence created successfully"
  return 0
}

# Generate infrastructure alert rules
generate_infrastructure_alerts() {
  log "Generating infrastructure alert rules"
  
  cat > "${ALERT_RULES_DIR}/infrastructure-alerts.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: infrastructure-alerts
  namespace: ${PROMETHEUS_NAMESPACE}
  labels:
    role: alert-rules
    severity: critical
spec:
  groups:
  - name: node.rules
    rules:
    - alert: HighNodeCPU
      expr: instance:node_cpu_utilisation:rate5m > 0.8
      for: 10m
      labels:
        severity: warning
        team: infrastructure
      annotations:
        summary: High CPU usage on {{ $labels.instance }}
        description: "CPU usage is above 80% for more than 10 minutes on {{ $labels.instance }}"
        runbook_url: "https://wiki.austa.health/runbooks/high-node-cpu"
    
    - alert: HighNodeMemory
      expr: instance:node_memory_utilisation:ratio > 0.85
      for: 10m
      labels:
        severity: warning
        team: infrastructure
      annotations:
        summary: High memory usage on {{ $labels.instance }}
        description: "Memory usage is above 85% for more than 10 minutes on {{ $labels.instance }}"
        runbook_url: "https://wiki.austa.health/runbooks/high-node-memory"
    
    - alert: NodeDiskFull
      expr: instance:node_filesystem_usage:ratio > 0.85
      for: 5m
      labels:
        severity: critical
        team: infrastructure
      annotations:
        summary: Disk usage critical on {{ $labels.instance }}
        description: "Disk usage is above 85% for more than 5 minutes on {{ $labels.instance }}"
        runbook_url: "https://wiki.austa.health/runbooks/node-disk-full"
    
    - alert: NodeNetworkErrors
      expr: increase(node_network_transmit_errs_total[1h]) + increase(node_network_receive_errs_total[1h]) > 10
      for: 15m
      labels:
        severity: warning
        team: infrastructure
      annotations:
        summary: Network errors detected on {{ $labels.instance }}
        description: "Network errors detected on {{ $labels.instance }} for more than 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/node-network-errors"
  
  - name: kubernetes.rules
    rules:
    - alert: KubernetesPodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[1h]) > 0.2
      for: 15m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping
        description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is restarting {{ $value }} times / hour"
        runbook_url: "https://wiki.austa.health/runbooks/pod-crash-looping"
    
    - alert: KubernetesPodNotReady
      expr: sum by (namespace, pod) (kube_pod_status_phase{phase=~"Pending|Unknown"}) > 0
      for: 15m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Pod {{ $labels.namespace }}/{{ $labels.pod }} is not ready
        description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for more than 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/pod-not-ready"
    
    - alert: KubernetesDeploymentReplicasMismatch
      expr: kube_deployment_spec_replicas != kube_deployment_status_replicas_available
      for: 15m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Deployment {{ $labels.namespace }}/{{ $labels.deployment }} replicas mismatch
        description: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for more than 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/deployment-replicas-mismatch"
    
    - alert: KubernetesPersistentVolumeFillingUp
      expr: kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes < 0.1
      for: 5m
      labels:
        severity: critical
        team: infrastructure
      annotations:
        summary: PersistentVolume {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} is filling up
        description: "PersistentVolume {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} is filling up (< 10% left)"
        runbook_url: "https://wiki.austa.health/runbooks/persistent-volume-filling-up"
EOF

  create_prometheus_rule "infrastructure-alerts" "${PROMETHEUS_NAMESPACE}" "critical" "${ALERT_RULES_DIR}/infrastructure-alerts.yaml"
}

# Generate service health alert rules
generate_service_health_alerts() {
  log "Generating service health alert rules"
  
  cat > "${ALERT_RULES_DIR}/service-health-alerts.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: service-health-alerts
  namespace: ${PROMETHEUS_NAMESPACE}
  labels:
    role: alert-rules
    severity: critical
spec:
  groups:
  - name: service.health.rules
    rules:
    - alert: ServiceEndpointDown
      expr: probe_success{job="blackbox"} == 0
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: Service endpoint {{ $labels.instance }} is down
        description: "Service endpoint {{ $labels.instance }} has been down for more than 5 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/service-endpoint-down"
    
    - alert: HighErrorRate
      expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) > 0.05
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: High error rate for service {{ $labels.service }}
        description: "Service {{ $labels.service }} has a high HTTP error rate (> 5%)"
        runbook_url: "https://wiki.austa.health/runbooks/high-error-rate"
    
    - alert: SlowResponseTime
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 1
      for: 5m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Slow response time for service {{ $labels.service }}
        description: "Service {{ $labels.service }} has a 95th percentile response time greater than 1s"
        runbook_url: "https://wiki.austa.health/runbooks/slow-response-time"
    
    - alert: HighCPUUsage
      expr: sum(rate(container_cpu_usage_seconds_total{container!=""}[5m])) by (pod, namespace) / sum(kube_pod_container_resource_limits_cpu_cores) by (pod, namespace) > 0.8
      for: 10m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: High CPU usage for pod {{ $labels.namespace }}/{{ $labels.pod }}
        description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has high CPU usage (> 80% of limit) for more than 10 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/high-cpu-usage"
    
    - alert: HighMemoryUsage
      expr: sum(container_memory_working_set_bytes{container!=""}) by (pod, namespace) / sum(kube_pod_container_resource_limits_memory_bytes) by (pod, namespace) > 0.8
      for: 10m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: High memory usage for pod {{ $labels.namespace }}/{{ $labels.pod }}
        description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has high memory usage (> 80% of limit) for more than 10 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/high-memory-usage"
    
    - alert: PodOOMKilled
      expr: kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: Pod {{ $labels.namespace }}/{{ $labels.pod }} OOM killed
        description: "Container {{ $labels.container }} in pod {{ $labels.namespace }}/{{ $labels.pod }} was OOM killed recently"
        runbook_url: "https://wiki.austa.health/runbooks/pod-oom-killed"
EOF

  create_prometheus_rule "service-health-alerts" "${PROMETHEUS_NAMESPACE}" "critical" "${ALERT_RULES_DIR}/service-health-alerts.yaml"
}

# Generate journey-specific alert rules
generate_journey_alerts() {
  log "Generating journey-specific alert rules"
  
  cat > "${ALERT_RULES_DIR}/journey-alerts.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: journey-alerts
  namespace: ${PROMETHEUS_NAMESPACE}
  labels:
    role: alert-rules
    severity: warning
spec:
  groups:
  - name: health.journey.rules
    rules:
    - alert: HealthJourneyHighLatency
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"health-service.*"}[5m])) by (le, service)) > 0.2
      for: 5m
      labels:
        severity: warning
        team: health-journey
        journey: health
      annotations:
        summary: Health journey high latency
        description: "Health journey service {{ $labels.service }} has a 95th percentile response time greater than 200ms"
        runbook_url: "https://wiki.austa.health/runbooks/health-journey-high-latency"
    
    - alert: HealthJourneyHighErrorRate
      expr: sum(rate(http_requests_total{service=~"health-service.*", status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total{service=~"health-service.*"}[5m])) by (service) > 0.02
      for: 5m
      labels:
        severity: critical
        team: health-journey
        journey: health
      annotations:
        summary: Health journey high error rate
        description: "Health journey service {{ $labels.service }} has a high HTTP error rate (> 2%)"
        runbook_url: "https://wiki.austa.health/runbooks/health-journey-high-error-rate"
    
    - alert: HealthMetricsProcessingDelay
      expr: health_metrics_processing_delay_seconds > 60
      for: 5m
      labels:
        severity: warning
        team: health-journey
        journey: health
      annotations:
        summary: Health metrics processing delay
        description: "Health metrics processing is delayed by more than 60 seconds"
        runbook_url: "https://wiki.austa.health/runbooks/health-metrics-processing-delay"
    
    - alert: HealthDeviceConnectionFailures
      expr: increase(health_device_connection_failures_total[15m]) > 5
      for: 5m
      labels:
        severity: warning
        team: health-journey
        journey: health
      annotations:
        summary: Health device connection failures
        description: "More than 5 health device connection failures in the last 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/health-device-connection-failures"
  
  - name: care.journey.rules
    rules:
    - alert: CareJourneyHighLatency
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"care-service.*"}[5m])) by (le, service)) > 0.2
      for: 5m
      labels:
        severity: warning
        team: care-journey
        journey: care
      annotations:
        summary: Care journey high latency
        description: "Care journey service {{ $labels.service }} has a 95th percentile response time greater than 200ms"
        runbook_url: "https://wiki.austa.health/runbooks/care-journey-high-latency"
    
    - alert: CareJourneyHighErrorRate
      expr: sum(rate(http_requests_total{service=~"care-service.*", status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total{service=~"care-service.*"}[5m])) by (service) > 0.02
      for: 5m
      labels:
        severity: critical
        team: care-journey
        journey: care
      annotations:
        summary: Care journey high error rate
        description: "Care journey service {{ $labels.service }} has a high HTTP error rate (> 2%)"
        runbook_url: "https://wiki.austa.health/runbooks/care-journey-high-error-rate"
    
    - alert: AppointmentBookingFailures
      expr: increase(appointment_booking_failures_total[15m]) > 3
      for: 5m
      labels:
        severity: critical
        team: care-journey
        journey: care
      annotations:
        summary: Appointment booking failures
        description: "More than 3 appointment booking failures in the last 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/appointment-booking-failures"
    
    - alert: TelemedicineSessionFailures
      expr: increase(telemedicine_session_failures_total[15m]) > 3
      for: 5m
      labels:
        severity: critical
        team: care-journey
        journey: care
      annotations:
        summary: Telemedicine session failures
        description: "More than 3 telemedicine session failures in the last 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/telemedicine-session-failures"
  
  - name: plan.journey.rules
    rules:
    - alert: PlanJourneyHighLatency
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"plan-service.*"}[5m])) by (le, service)) > 0.2
      for: 5m
      labels:
        severity: warning
        team: plan-journey
        journey: plan
      annotations:
        summary: Plan journey high latency
        description: "Plan journey service {{ $labels.service }} has a 95th percentile response time greater than 200ms"
        runbook_url: "https://wiki.austa.health/runbooks/plan-journey-high-latency"
    
    - alert: PlanJourneyHighErrorRate
      expr: sum(rate(http_requests_total{service=~"plan-service.*", status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total{service=~"plan-service.*"}[5m])) by (service) > 0.02
      for: 5m
      labels:
        severity: critical
        team: plan-journey
        journey: plan
      annotations:
        summary: Plan journey high error rate
        description: "Plan journey service {{ $labels.service }} has a high HTTP error rate (> 2%)"
        runbook_url: "https://wiki.austa.health/runbooks/plan-journey-high-error-rate"
    
    - alert: ClaimProcessingDelay
      expr: plan_claim_processing_delay_seconds > 300
      for: 10m
      labels:
        severity: warning
        team: plan-journey
        journey: plan
      annotations:
        summary: Claim processing delay
        description: "Claim processing is delayed by more than 5 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/claim-processing-delay"
    
    - alert: BenefitVerificationFailures
      expr: increase(benefit_verification_failures_total[15m]) > 5
      for: 5m
      labels:
        severity: warning
        team: plan-journey
        journey: plan
      annotations:
        summary: Benefit verification failures
        description: "More than 5 benefit verification failures in the last 15 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/benefit-verification-failures"
EOF

  create_prometheus_rule "journey-alerts" "${PROMETHEUS_NAMESPACE}" "warning" "${ALERT_RULES_DIR}/journey-alerts.yaml"
}

# Generate SLA alert rules
generate_sla_alerts() {
  log "Generating SLA alert rules"
  
  cat > "${ALERT_RULES_DIR}/sla-alerts.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: sla-alerts
  namespace: ${PROMETHEUS_NAMESPACE}
  labels:
    role: alert-rules
    severity: critical
spec:
  groups:
  - name: sla.rules
    rules:
    - alert: APIGatewayLatencySLOBreach
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="api-gateway"}[5m])) by (le)) > 0.2
      for: 5m
      labels:
        severity: critical
        team: platform
        sla: true
      annotations:
        summary: API Gateway latency SLO breach
        description: "API Gateway 95th percentile latency is above 200ms SLO"
        runbook_url: "https://wiki.austa.health/runbooks/api-gateway-latency-slo-breach"
    
    - alert: GraphQLLatencySLOBreach
      expr: histogram_quantile(0.95, sum(rate(graphql_operation_duration_seconds_bucket[5m])) by (le)) > 0.25
      for: 5m
      labels:
        severity: critical
        team: platform
        sla: true
      annotations:
        summary: GraphQL latency SLO breach
        description: "GraphQL 95th percentile query response time is above 250ms SLO"
        runbook_url: "https://wiki.austa.health/runbooks/graphql-latency-slo-breach"
    
    - alert: DatabaseQueryLatencySLOBreach
      expr: histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (le)) > 0.1
      for: 5m
      labels:
        severity: critical
        team: platform
        sla: true
      annotations:
        summary: Database query latency SLO breach
        description: "Database 95th percentile query execution time is above 100ms SLO"
        runbook_url: "https://wiki.austa.health/runbooks/database-query-latency-slo-breach"
    
    - alert: MobileAppScreenLoadSLOBreach
      expr: histogram_quantile(0.9, sum(rate(mobile_screen_load_duration_seconds_bucket[5m])) by (le)) > 2
      for: 5m
      labels:
        severity: warning
        team: mobile
        sla: true
      annotations:
        summary: Mobile app screen load SLO breach
        description: "Mobile app 90th percentile screen load time is above 2s SLO"
        runbook_url: "https://wiki.austa.health/runbooks/mobile-app-screen-load-slo-breach"
    
    - alert: WebAppFCPSLOBreach
      expr: histogram_quantile(0.9, sum(rate(web_fcp_duration_seconds_bucket[5m])) by (le)) > 1.5
      for: 5m
      labels:
        severity: warning
        team: web
        sla: true
      annotations:
        summary: Web app FCP SLO breach
        description: "Web app 90th percentile First Contentful Paint is above 1.5s SLO"
        runbook_url: "https://wiki.austa.health/runbooks/web-app-fcp-slo-breach"
    
    - alert: SystemAvailabilitySLOBreach
      expr: avg_over_time(up{job="blackbox"}[1h]) * 100 < 99.95
      for: 5m
      labels:
        severity: critical
        team: platform
        sla: true
      annotations:
        summary: System availability SLO breach
        description: "System availability is below 99.95% SLO"
        runbook_url: "https://wiki.austa.health/runbooks/system-availability-slo-breach"
    
    - alert: GamificationEventProcessingSLOBreach
      expr: histogram_quantile(0.95, sum(rate(gamification_event_processing_duration_seconds_bucket[5m])) by (le)) > 0.05
      for: 5m
      labels:
        severity: warning
        team: gamification
        sla: true
      annotations:
        summary: Gamification event processing SLO breach
        description: "Gamification 95th percentile event processing time is above 50ms SLO"
        runbook_url: "https://wiki.austa.health/runbooks/gamification-event-processing-slo-breach"
    
    - alert: NotificationDeliverySLOBreach
      expr: histogram_quantile(0.95, sum(rate(notification_delivery_duration_seconds_bucket[5m])) by (le)) > 30
      for: 5m
      labels:
        severity: warning
        team: notification
        sla: true
      annotations:
        summary: Notification delivery SLO breach
        description: "Notification 95th percentile delivery time is above 30s SLO"
        runbook_url: "https://wiki.austa.health/runbooks/notification-delivery-slo-breach"
EOF

  create_prometheus_rule "sla-alerts" "${PROMETHEUS_NAMESPACE}" "critical" "${ALERT_RULES_DIR}/sla-alerts.yaml"
}

# Generate CI/CD pipeline alert rules
generate_cicd_alerts() {
  log "Generating CI/CD pipeline alert rules"
  
  cat > "${ALERT_RULES_DIR}/cicd-alerts.yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cicd-alerts
  namespace: ${PROMETHEUS_NAMESPACE}
  labels:
    role: alert-rules
    severity: warning
spec:
  groups:
  - name: cicd.rules
    rules:
    - alert: DependencyValidationFailureRate
      expr: sum(rate(dependency_validation_failures_total[6h])) / sum(rate(dependency_validation_runs_total[6h])) > 0.05
      for: 10m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: High dependency validation failure rate
        description: "Dependency validation is failing at a rate of {{ $value | humanizePercentage }} over the last 6 hours"
        runbook_url: "https://wiki.austa.health/runbooks/dependency-validation-failure-rate"
    
    - alert: CIBuildDurationHigh
      expr: avg_over_time(ci_build_duration_seconds[1h]) > 600
      for: 10m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: CI build duration is high
        description: "Average CI build time exceeds 10 minutes for two consecutive runs"
        runbook_url: "https://wiki.austa.health/runbooks/ci-build-duration-high"
    
    - alert: CIBuildDurationCritical
      expr: ci_build_duration_seconds > 1200
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: CI build duration is critical
        description: "CI build time exceeds 20 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/ci-build-duration-critical"
    
    - alert: ProductionDeploymentFailure
      expr: deployment_status{environment="production", status="failure"} == 1
      for: 5m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: Production deployment failure
        description: "Production deployment has failed"
        runbook_url: "https://wiki.austa.health/runbooks/production-deployment-failure"
    
    - alert: StagingWorkflowSuccessRateLow
      expr: sum(rate(workflow_runs_total{environment="staging", status="success"}[1h])) / sum(rate(workflow_runs_total{environment="staging"}[1h])) < 0.9
      for: 30m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Staging workflow success rate is low
        description: "Staging workflow success rate is below 90%"
        runbook_url: "https://wiki.austa.health/runbooks/staging-workflow-success-rate-low"
    
    - alert: SecurityScanFailure
      expr: security_scan_status{status="failure"} == 1
      for: 5m
      labels:
        severity: critical
        team: security
      annotations:
        summary: Security scan failure
        description: "Security scan has failed for {{ $labels.repository }}/{{ $labels.branch }}"
        runbook_url: "https://wiki.austa.health/runbooks/security-scan-failure"
    
    - alert: CacheMissRateHigh
      expr: sum(rate(cache_miss_total[1h])) / sum(rate(cache_access_total[1h])) > 0.3
      for: 30m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: Cache miss rate is high
        description: "Cache miss rate is above 30% for the last 30 minutes"
        runbook_url: "https://wiki.austa.health/runbooks/cache-miss-rate-high"
EOF

  create_prometheus_rule "cicd-alerts" "${PROMETHEUS_NAMESPACE}" "warning" "${ALERT_RULES_DIR}/cicd-alerts.yaml"
}

# Configure AlertManager notification routes
configure_alertmanager() {
  log "Configuring AlertManager notification routes"
  
  cat > "${ALERT_RULES_DIR}/alertmanager-config.yaml" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-austa-prometheus
  namespace: ${PROMETHEUS_NAMESPACE}
type: Opaque
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX'
      smtp_smarthost: 'smtp.austa.health:587'
      smtp_from: 'alertmanager@austa.health'
      smtp_auth_username: 'alertmanager'
      smtp_auth_password: 'REPLACE_WITH_ACTUAL_PASSWORD'
      smtp_require_tls: true
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

    templates:
      - '/etc/alertmanager/config/*.tmpl'

    route:
      receiver: 'default-receiver'
      group_by: ['alertname', 'job']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      routes:
        # Critical alerts go to PagerDuty
        - match:
            severity: critical
          receiver: 'pagerduty-critical'
          continue: true

        # Journey-specific routing
        - match:
            journey: health
          receiver: 'slack-health-journey'
          group_by: ['alertname', 'job', 'journey']
          continue: true

        - match:
            journey: care
          receiver: 'slack-care-journey'
          group_by: ['alertname', 'job', 'journey']
          continue: true

        - match:
            journey: plan
          receiver: 'slack-plan-journey'
          group_by: ['alertname', 'job', 'journey']
          continue: true

        # Team-specific routing
        - match:
            team: platform
          receiver: 'slack-platform-team'
          group_by: ['alertname', 'job', 'team']
          continue: true

        - match:
            team: infrastructure
          receiver: 'slack-infrastructure-team'
          group_by: ['alertname', 'job', 'team']
          continue: true

        - match:
            team: security
          receiver: 'slack-security-team'
          group_by: ['alertname', 'job', 'team']
          continue: true

        # SLA breaches get special handling
        - match:
            sla: true
          receiver: 'slack-sla-breach'
          group_by: ['alertname', 'job']
          continue: true

    receivers:
      - name: 'default-receiver'
        slack_configs:
          - channel: '#austa-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'pagerduty-critical'
        pagerduty_configs:
          - service_key: 'REPLACE_WITH_ACTUAL_SERVICE_KEY'
            send_resolved: true
            description: '{{ template "pagerduty.default.description" . }}'
            severity: 'critical'
            details:
              firing: '{{ template "pagerduty.default.firing" . }}'
              runbook: '{{ (index .Alerts 0).Annotations.runbook_url }}'

      - name: 'slack-health-journey'
        slack_configs:
          - channel: '#health-journey-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-care-journey'
        slack_configs:
          - channel: '#care-journey-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-plan-journey'
        slack_configs:
          - channel: '#plan-journey-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-platform-team'
        slack_configs:
          - channel: '#platform-team-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-infrastructure-team'
        slack_configs:
          - channel: '#infrastructure-team-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-security-team'
        slack_configs:
          - channel: '#security-team-alerts'
            send_resolved: true
            title: '{{ template "slack.default.title" . }}'
            text: '{{ template "slack.default.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

      - name: 'slack-sla-breach'
        slack_configs:
          - channel: '#sla-breach-alerts'
            send_resolved: true
            title: '{{ template "slack.sla.title" . }}'
            text: '{{ template "slack.sla.text" . }}'
            footer: '{{ template "slack.default.footer" . }}'

    inhibit_rules:
      # Inhibit warning alerts if there's already a critical alert for the same service
      - source_match:
          severity: 'critical'
        target_match:
          severity: 'warning'
        equal: ['alertname', 'service']

      # Inhibit service-specific alerts if there's a broader infrastructure issue
      - source_match:
          alertname: 'NodeDiskFull'
        target_match_re:
          alertname: '.*HighLatency|.*HighErrorRate'
        equal: ['instance']
EOF

  # Create AlertManager templates
  mkdir -p "${ALERT_RULES_DIR}/templates"
  
  cat > "${ALERT_RULES_DIR}/templates/slack.tmpl" << EOF
{{ define "slack.default.title" }}
  [{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.default.text" }}
{{ range .Alerts }}
  *Alert:* {{ .Annotations.summary }}
  *Description:* {{ .Annotations.description }}
  *Severity:* {{ .Labels.severity }}
  *Started:* {{ .StartsAt | since }}
  {{if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{end}}
  *Details:*
  {{ range .Labels.SortedPairs }}• *{{ .Name }}:* `{{ .Value }}`
  {{ end }}
{{ end }}
{{ end }}

{{ define "slack.default.footer" }}
  AUSTA SuperApp Monitoring | {{ now | date "2006-01-02T15:04:05Z07:00" }}
{{ end }}

{{ define "slack.sla.title" }}
  [{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] 🚨 SLA BREACH: {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.sla.text" }}
{{ range .Alerts }}
  *SLA Breach:* {{ .Annotations.summary }}
  *Description:* {{ .Annotations.description }}
  *Severity:* {{ .Labels.severity }}
  *Started:* {{ .StartsAt | since }}
  {{if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{end}}
  *Details:*
  {{ range .Labels.SortedPairs }}• *{{ .Name }}:* `{{ .Value }}`
  {{ end }}
{{ end }}
{{ end }}
EOF

  cat > "${ALERT_RULES_DIR}/templates/pagerduty.tmpl" << EOF
{{ define "pagerduty.default.description" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}: {{ .CommonAnnotations.summary }}
{{ end }}

{{ define "pagerduty.default.firing" }}
{{ range .Alerts }}
  Alert: {{ .Annotations.summary }}
  Description: {{ .Annotations.description }}
  Severity: {{ .Labels.severity }}
  Started: {{ .StartsAt | since }}
  Labels:
  {{ range .Labels.SortedPairs }}  - {{ .Name }}: {{ .Value }}
  {{ end }}
{{ end }}
{{ end }}
EOF

  # Apply AlertManager configuration
  kubectl apply -f "${ALERT_RULES_DIR}/alertmanager-config.yaml" || {
    log "Error: Failed to apply AlertManager configuration"
    return 1
  }
  
  # Create ConfigMap for templates
  kubectl create configmap alertmanager-templates \
    --from-file="${ALERT_RULES_DIR}/templates/" \
    -n "${PROMETHEUS_NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f - || {
    log "Error: Failed to create AlertManager templates ConfigMap"
    return 1
  }
  
  log "Successfully configured AlertManager"
  return 0
}

# Create maintenance window
create_maintenance_window() {
  local start_time=$1
  local duration_hours=$2
  local affected_services=$3
  local comment=$4
  
  if [[ -z "${start_time}" ]]; then
    # Default to current time if not specified
    start_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  fi
  
  if [[ -z "${duration_hours}" ]]; then
    # Default to 2 hours if not specified
    duration_hours=2
  fi
  
  # Calculate end time
  end_time=$(date -u -d "${start_time} + ${duration_hours} hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
  if [[ $? -ne 0 ]]; then
    # Try BSD date format for macOS
    end_time=$(date -u -v+${duration_hours}H -j -f "%Y-%m-%dT%H:%M:%SZ" "${start_time}" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)
    if [[ $? -ne 0 ]]; then
      log "Error: Could not calculate end time for maintenance window"
      return 1
    fi
  fi
  
  log "Creating maintenance window from ${start_time} to ${end_time}"
  
  # Create silences for each affected service
  IFS=',' read -ra SERVICES <<< "${affected_services}"
  for service in "${SERVICES[@]}"; do
    create_silence "${start_time}" "${end_time}" "service=${service}" "${comment}"
  done
  
  log "Maintenance window created successfully"
  return 0
}

# Main execution
main() {
  # Generate alert rules
  generate_infrastructure_alerts
  generate_service_health_alerts
  generate_journey_alerts
  generate_sla_alerts
  generate_cicd_alerts
  
  # Configure AlertManager
  configure_alertmanager
  
  # Clean up temporary files
  log "Cleaning up temporary files"
  rm -rf "${ALERT_RULES_DIR}"
  
  log "Alert configuration completed successfully"
}

# Execute main function
main

# Example usage of maintenance window creation (commented out)
# create_maintenance_window "2023-06-01T22:00:00Z" 4 "health-service,care-service" "Scheduled database maintenance"

# Exit with success
exit 0