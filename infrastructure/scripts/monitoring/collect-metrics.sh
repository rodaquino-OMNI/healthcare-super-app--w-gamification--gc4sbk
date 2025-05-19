#!/bin/bash

# =========================================================
# AUSTA SuperApp - Metrics Collection Script
# =========================================================
# Automates the collection and export of custom application
# metrics to Prometheus, supporting all AUSTA SuperApp
# microservices by detecting endpoints, configuring scraping,
# and implementing service-specific exporters for journey-based
# metrics that aren't natively exposed.
# =========================================================
# Usage: ./collect-metrics.sh [options]
# Options:
#   -e, --environment ENV   Set environment (development, staging, production)
#   -j, --journey JOURNEY   Collect metrics for specific journey
#   -a, --all               Collect metrics for all journeys
#   -c, --cloudwatch        Export metrics to CloudWatch in addition to Prometheus
#   -o, --output FORMAT     Output format (json, csv, text)
#   -h, --help              Show this help message
# =========================================================
# Author: AUSTA SuperApp Team
# Created: 2025-05-19
# =========================================================

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# =========================================================
# Configuration
# =========================================================

# Default values
COLLECT_ALL=false
SPECIFIC_JOURNEY=""
OUTPUT_FORMAT="text"
EXPORT_TO_CLOUDWATCH=false
PROMETHEUS_EXPORTER_PORT=9090
METRICS_ENDPOINT="/metrics"
EXPORTER_NAMESPACE="austa"
CONFIG_DIR="/etc/austa-metrics"
TEMP_DIR="/tmp/austa-metrics"
CLOUDWATCH_NAMESPACE="AUSTA/SuperApp"

# Create temp directory if it doesn't exist
mkdir -p "${TEMP_DIR}"

# =========================================================
# Command Line Argument Parsing
# =========================================================

show_help() {
  echo "AUSTA SuperApp - Metrics Collection Script"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV   Set environment (development, staging, production)"
  echo "  -j, --journey JOURNEY   Collect metrics for specific journey"
  echo "  -a, --all               Collect metrics for all journeys"
  echo "  -c, --cloudwatch        Export metrics to CloudWatch in addition to Prometheus"
  echo "  -o, --output FORMAT     Output format (json, csv, text)"
  echo "  -h, --help              Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --all                Collect metrics for all journeys"
  echo "  $0 -j health -e prod    Collect metrics for health journey in production"
  echo "  $0 -j care -c -o json   Collect care journey metrics, export to CloudWatch, output as JSON"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -j|--journey)
      SPECIFIC_JOURNEY="$2"
      shift 2
      ;;
    -a|--all)
      COLLECT_ALL=true
      shift
      ;;
    -c|--cloudwatch)
      EXPORT_TO_CLOUDWATCH=true
      shift
      ;;
    -o|--output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate arguments
if [[ "$COLLECT_ALL" == "false" && -z "$SPECIFIC_JOURNEY" ]]; then
  log_error "Either --all or --journey must be specified"
  show_help
  exit 1
fi

if [[ -n "$SPECIFIC_JOURNEY" && "$COLLECT_ALL" == "true" ]]; then
  log_warn "Both --all and --journey specified. Using --journey=$SPECIFIC_JOURNEY"
  COLLECT_ALL=false
fi

if [[ -n "$SPECIFIC_JOURNEY" && -z "${JOURNEY_SERVICES[$SPECIFIC_JOURNEY]}" ]]; then
  log_error "Unknown journey: $SPECIFIC_JOURNEY"
  echo "Available journeys: ${!JOURNEY_SERVICES[@]}"
  exit 1
fi

if [[ "$OUTPUT_FORMAT" != "json" && "$OUTPUT_FORMAT" != "csv" && "$OUTPUT_FORMAT" != "text" ]]; then
  log_error "Invalid output format: $OUTPUT_FORMAT"
  log_error "Valid formats: json, csv, text"
  exit 1
fi

# =========================================================
# Metrics Collection Functions
# =========================================================

# Detect Prometheus endpoints for a service
detect_prometheus_endpoints() {
  local service=$1
  local namespace=${2:-"default"}
  
  log_info "Detecting Prometheus endpoints for service: $service in namespace: $namespace"
  
  # Get service endpoints using kubectl
  local endpoints=$(kubectl get endpoints -n "$namespace" -l "app=$service" -o json | jq -r '.items[].subsets[].addresses[].ip')
  
  if [[ -z "$endpoints" ]]; then
    log_warn "No endpoints found for service: $service"
    return 1
  fi
  
  # Check each endpoint for metrics
  local metrics_endpoints=()
  for ip in $endpoints; do
    # Try common metrics paths
    for path in "/metrics" "/prometheus" "/prometheus/metrics"; do
      if curl -s "http://${ip}:${PROMETHEUS_EXPORTER_PORT}${path}" | grep -q "^# HELP"; then
        metrics_endpoints+=("${ip}:${PROMETHEUS_EXPORTER_PORT}${path}")
        log_info "Found metrics endpoint: http://${ip}:${PROMETHEUS_EXPORTER_PORT}${path}"
        break
      fi
    done
  done
  
  if [[ ${#metrics_endpoints[@]} -eq 0 ]]; then
    log_warn "No metrics endpoints found for service: $service"
    return 1
  fi
  
  # Return the first valid endpoint
  echo "${metrics_endpoints[0]}"
}

# Collect metrics from a Prometheus endpoint
collect_prometheus_metrics() {
  local endpoint=$1
  local output_file=$2
  
  log_info "Collecting metrics from endpoint: $endpoint"
  
  # Fetch metrics
  local metrics=$(curl -s "$endpoint")
  
  if [[ -z "$metrics" ]]; then
    log_error "Failed to collect metrics from endpoint: $endpoint"
    return 1
  fi
  
  # Save metrics to file
  echo "$metrics" > "$output_file"
  log_info "Metrics saved to: $output_file"
  
  # Return number of metrics collected
  local count=$(grep -c "^# HELP" "$output_file")
  echo "$count"
}

# Generate custom metrics for a journey
generate_journey_metrics() {
  local journey=$1
  local output_file=$2
  
  log_info "Generating custom metrics for journey: $journey"
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Start with an empty metrics file
  echo "# HELP austa_journey_metrics Custom metrics for AUSTA SuperApp journeys" > "$output_file"
  echo "# TYPE austa_journey_metrics gauge" >> "$output_file"
  
  # Add journey-specific metrics based on the journey type
  case "$journey" in
    "health")
      # Health journey metrics
      add_health_journey_metrics "$output_file"
      ;;
    "care")
      # Care journey metrics
      add_care_journey_metrics "$output_file"
      ;;
    "plan")
      # Plan journey metrics
      add_plan_journey_metrics "$output_file"
      ;;
    "gamification")
      # Gamification metrics
      add_gamification_metrics "$output_file"
      ;;
    "notification")
      # Notification metrics
      add_notification_metrics "$output_file"
      ;;
    "auth")
      # Auth metrics
      add_auth_metrics "$output_file"
      ;;
    "api")
      # API Gateway metrics
      add_api_gateway_metrics "$output_file"
      ;;
    *)
      log_warn "No custom metrics defined for journey: $journey"
      ;;
  esac
  
  # Return number of metrics generated
  local count=$(grep -c "^austa_" "$output_file")
  echo "$count"
}

# Add Health journey specific metrics
add_health_journey_metrics() {
  local output_file=$1
  
  log_info "Adding Health journey metrics"
  
  # Get active users with health tracking
  local active_users=$(query_prometheus_instant "sum(health_metrics_active_users)")
  local active_users_value=$(extract_latest_value "$active_users")
  echo "austa_health_active_users{journey=\"health\", environment=\"$ENVIRONMENT\"} $active_users_value" >> "$output_file"
  
  # Get connected devices count
  local connected_devices=$(query_prometheus_instant "sum(health_connected_devices)")
  local connected_devices_value=$(extract_latest_value "$connected_devices")
  echo "austa_health_connected_devices{journey=\"health\", environment=\"$ENVIRONMENT\"} $connected_devices_value" >> "$output_file"
  
  # Get health goals completion rate
  local goals_completion=$(query_prometheus_instant "sum(health_goals_completed) / sum(health_goals_created) * 100")
  local goals_completion_value=$(extract_latest_value "$goals_completion")
  echo "austa_health_goals_completion_rate{journey=\"health\", environment=\"$ENVIRONMENT\"} $goals_completion_value" >> "$output_file"
  
  # Get health insights generated
  local insights_generated=$(query_prometheus_instant "sum(rate(health_insights_generated[24h]))")
  local insights_generated_value=$(extract_latest_value "$insights_generated")
  echo "austa_health_insights_generated_daily{journey=\"health\", environment=\"$ENVIRONMENT\"} $insights_generated_value" >> "$output_file"
  
  # Get health data sync success rate
  local sync_success=$(query_prometheus_instant "sum(health_data_sync_success) / sum(health_data_sync_attempts) * 100")
  local sync_success_value=$(extract_latest_value "$sync_success")
  echo "austa_health_data_sync_success_rate{journey=\"health\", environment=\"$ENVIRONMENT\"} $sync_success_value" >> "$output_file"
}

# Add Care journey specific metrics
add_care_journey_metrics() {
  local output_file=$1
  
  log_info "Adding Care journey metrics"
  
  # Get active appointments
  local active_appointments=$(query_prometheus_instant "sum(care_active_appointments)")
  local active_appointments_value=$(extract_latest_value "$active_appointments")
  echo "austa_care_active_appointments{journey=\"care\", environment=\"$ENVIRONMENT\"} $active_appointments_value" >> "$output_file"
  
  # Get telemedicine sessions
  local telemedicine_sessions=$(query_prometheus_instant "sum(rate(care_telemedicine_sessions_total[24h]))")
  local telemedicine_sessions_value=$(extract_latest_value "$telemedicine_sessions")
  echo "austa_care_telemedicine_sessions_daily{journey=\"care\", environment=\"$ENVIRONMENT\"} $telemedicine_sessions_value" >> "$output_file"
  
  # Get appointment booking success rate
  local booking_success=$(query_prometheus_instant "sum(care_appointment_booking_success) / sum(care_appointment_booking_attempts) * 100")
  local booking_success_value=$(extract_latest_value "$booking_success")
  echo "austa_care_appointment_booking_success_rate{journey=\"care\", environment=\"$ENVIRONMENT\"} $booking_success_value" >> "$output_file"
  
  # Get medication adherence rate
  local medication_adherence=$(query_prometheus_instant "sum(care_medication_doses_taken) / sum(care_medication_doses_scheduled) * 100")
  local medication_adherence_value=$(extract_latest_value "$medication_adherence")
  echo "austa_care_medication_adherence_rate{journey=\"care\", environment=\"$ENVIRONMENT\"} $medication_adherence_value" >> "$output_file"
  
  # Get provider availability
  local provider_availability=$(query_prometheus_instant "avg(care_provider_availability) * 100")
  local provider_availability_value=$(extract_latest_value "$provider_availability")
  echo "austa_care_provider_availability_percent{journey=\"care\", environment=\"$ENVIRONMENT\"} $provider_availability_value" >> "$output_file"
}

# Add Plan journey specific metrics
add_plan_journey_metrics() {
  local output_file=$1
  
  log_info "Adding Plan journey metrics"
  
  # Get active insurance plans
  local active_plans=$(query_prometheus_instant "sum(plan_active_insurance_plans)")
  local active_plans_value=$(extract_latest_value "$active_plans")
  echo "austa_plan_active_insurance_plans{journey=\"plan\", environment=\"$ENVIRONMENT\"} $active_plans_value" >> "$output_file"
  
  # Get claims processing rate
  local claims_processing=$(query_prometheus_instant "sum(rate(plan_claims_processed_total[24h]))")
  local claims_processing_value=$(extract_latest_value "$claims_processing")
  echo "austa_plan_claims_processed_daily{journey=\"plan\", environment=\"$ENVIRONMENT\"} $claims_processing_value" >> "$output_file"
  
  # Get claims approval rate
  local claims_approval=$(query_prometheus_instant "sum(plan_claims_approved) / sum(plan_claims_submitted) * 100")
  local claims_approval_value=$(extract_latest_value "$claims_approval")
  echo "austa_plan_claims_approval_rate{journey=\"plan\", environment=\"$ENVIRONMENT\"} $claims_approval_value" >> "$output_file"
  
  # Get benefit utilization rate
  local benefit_utilization=$(query_prometheus_instant "sum(plan_benefits_used) / sum(plan_benefits_available) * 100")
  local benefit_utilization_value=$(extract_latest_value "$benefit_utilization")
  echo "austa_plan_benefit_utilization_rate{journey=\"plan\", environment=\"$ENVIRONMENT\"} $benefit_utilization_value" >> "$output_file"
  
  # Get document processing time
  local document_processing=$(query_prometheus_instant "avg(plan_document_processing_seconds)")
  local document_processing_value=$(extract_latest_value "$document_processing")
  echo "austa_plan_document_processing_time_seconds{journey=\"plan\", environment=\"$ENVIRONMENT\"} $document_processing_value" >> "$output_file"
}

# Add Gamification specific metrics
add_gamification_metrics() {
  local output_file=$1
  
  log_info "Adding Gamification metrics"
  
  # Get active users with gamification profiles
  local active_profiles=$(query_prometheus_instant "sum(gamification_active_profiles)")
  local active_profiles_value=$(extract_latest_value "$active_profiles")
  echo "austa_gamification_active_profiles{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $active_profiles_value" >> "$output_file"
  
  # Get achievements unlocked rate
  local achievements_unlocked=$(query_prometheus_instant "sum(rate(gamification_achievements_unlocked_total[24h]))")
  local achievements_unlocked_value=$(extract_latest_value "$achievements_unlocked")
  echo "austa_gamification_achievements_unlocked_daily{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $achievements_unlocked_value" >> "$output_file"
  
  # Get quest completion rate
  local quest_completion=$(query_prometheus_instant "sum(gamification_quests_completed) / sum(gamification_quests_started) * 100")
  local quest_completion_value=$(extract_latest_value "$quest_completion")
  echo "austa_gamification_quest_completion_rate{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $quest_completion_value" >> "$output_file"
  
  # Get reward redemption rate
  local reward_redemption=$(query_prometheus_instant "sum(gamification_rewards_redeemed) / sum(gamification_rewards_available) * 100")
  local reward_redemption_value=$(extract_latest_value "$reward_redemption")
  echo "austa_gamification_reward_redemption_rate{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $reward_redemption_value" >> "$output_file"
  
  # Get event processing rate
  local event_processing=$(query_prometheus_instant "sum(rate(gamification_events_processed_total[5m]))")
  local event_processing_value=$(extract_latest_value "$event_processing")
  echo "austa_gamification_events_processed_per_second{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $event_processing_value" >> "$output_file"
  
  # Get event processing latency
  local event_latency=$(query_prometheus_instant "avg(gamification_event_processing_seconds)")
  local event_latency_value=$(extract_latest_value "$event_latency")
  echo "austa_gamification_event_processing_latency_seconds{journey=\"gamification\", environment=\"$ENVIRONMENT\"} $event_latency_value" >> "$output_file"
}

# Add Notification specific metrics
add_notification_metrics() {
  local output_file=$1
  
  log_info "Adding Notification metrics"
  
  # Get notification delivery rate
  local delivery_rate=$(query_prometheus_instant "sum(rate(notification_delivered_total[1h]))")
  local delivery_rate_value=$(extract_latest_value "$delivery_rate")
  echo "austa_notification_delivery_rate_hourly{journey=\"notification\", environment=\"$ENVIRONMENT\"} $delivery_rate_value" >> "$output_file"
  
  # Get notification success rate
  local success_rate=$(query_prometheus_instant "sum(notification_delivered_success) / sum(notification_delivered_total) * 100")
  local success_rate_value=$(extract_latest_value "$success_rate")
  echo "austa_notification_success_rate{journey=\"notification\", environment=\"$ENVIRONMENT\"} $success_rate_value" >> "$output_file"
  
  # Get notification channel distribution
  for channel in "push" "email" "sms" "in_app"; do
    local channel_count=$(query_prometheus_instant "sum(notification_delivered_total{channel=\"$channel\"})")
    local channel_count_value=$(extract_latest_value "$channel_count")
    echo "austa_notification_channel_count{journey=\"notification\", channel=\"$channel\", environment=\"$ENVIRONMENT\"} $channel_count_value" >> "$output_file"
  done
  
  # Get notification latency
  local notification_latency=$(query_prometheus_instant "avg(notification_delivery_seconds)")
  local notification_latency_value=$(extract_latest_value "$notification_latency")
  echo "austa_notification_delivery_latency_seconds{journey=\"notification\", environment=\"$ENVIRONMENT\"} $notification_latency_value" >> "$output_file"
  
  # Get retry count
  local retry_count=$(query_prometheus_instant "sum(notification_retry_count) / count(notification_retry_count)")
  local retry_count_value=$(extract_latest_value "$retry_count")
  echo "austa_notification_average_retry_count{journey=\"notification\", environment=\"$ENVIRONMENT\"} $retry_count_value" >> "$output_file"
}

# Add Auth specific metrics
add_auth_metrics() {
  local output_file=$1
  
  log_info "Adding Auth metrics"
  
  # Get active user sessions
  local active_sessions=$(query_prometheus_instant "sum(auth_active_sessions)")
  local active_sessions_value=$(extract_latest_value "$active_sessions")
  echo "austa_auth_active_sessions{journey=\"auth\", environment=\"$ENVIRONMENT\"} $active_sessions_value" >> "$output_file"
  
  # Get login success rate
  local login_success=$(query_prometheus_instant "sum(auth_login_success) / sum(auth_login_attempts) * 100")
  local login_success_value=$(extract_latest_value "$login_success")
  echo "austa_auth_login_success_rate{journey=\"auth\", environment=\"$ENVIRONMENT\"} $login_success_value" >> "$output_file"
  
  # Get token refresh rate
  local token_refresh=$(query_prometheus_instant "sum(rate(auth_token_refresh_total[1h]))")
  local token_refresh_value=$(extract_latest_value "$token_refresh")
  echo "austa_auth_token_refresh_rate_hourly{journey=\"auth\", environment=\"$ENVIRONMENT\"} $token_refresh_value" >> "$output_file"
  
  # Get authentication method distribution
  for method in "password" "oauth" "biometric" "sso"; do
    local method_count=$(query_prometheus_instant "sum(auth_login_attempts{method=\"$method\"})")
    local method_count_value=$(extract_latest_value "$method_count")
    echo "austa_auth_login_method_count{journey=\"auth\", method=\"$method\", environment=\"$ENVIRONMENT\"} $method_count_value" >> "$output_file"
  done
  
  # Get permission check rate
  local permission_checks=$(query_prometheus_instant "sum(rate(auth_permission_checks_total[5m]))")
  local permission_checks_value=$(extract_latest_value "$permission_checks")
  echo "austa_auth_permission_checks_per_second{journey=\"auth\", environment=\"$ENVIRONMENT\"} $permission_checks_value" >> "$output_file"
}

# Add API Gateway specific metrics
add_api_gateway_metrics() {
  local output_file=$1
  
  log_info "Adding API Gateway metrics"
  
  # Get request rate
  local request_rate=$(query_prometheus_instant "sum(rate(api_gateway_requests_total[5m]))")
  local request_rate_value=$(extract_latest_value "$request_rate")
  echo "austa_api_gateway_requests_per_second{journey=\"api\", environment=\"$ENVIRONMENT\"} $request_rate_value" >> "$output_file"
  
  # Get error rate
  local error_rate=$(query_prometheus_instant "sum(rate(api_gateway_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(api_gateway_requests_total[5m])) * 100")
  local error_rate_value=$(extract_latest_value "$error_rate")
  echo "austa_api_gateway_error_rate{journey=\"api\", environment=\"$ENVIRONMENT\"} $error_rate_value" >> "$output_file"
  
  # Get average response time
  local response_time=$(query_prometheus_instant "avg(api_gateway_request_duration_seconds)")
  local response_time_value=$(extract_latest_value "$response_time")
  echo "austa_api_gateway_response_time_seconds{journey=\"api\", environment=\"$ENVIRONMENT\"} $response_time_value" >> "$output_file"
  
  # Get journey distribution
  for journey in "health" "care" "plan" "auth" "gamification" "notification"; do
    local journey_count=$(query_prometheus_instant "sum(api_gateway_requests_total{journey=\"$journey\"})")
    local journey_count_value=$(extract_latest_value "$journey_count")
    echo "austa_api_gateway_journey_request_count{journey=\"api\", target_journey=\"$journey\", environment=\"$ENVIRONMENT\"} $journey_count_value" >> "$output_file"
  done
  
  # Get rate limiting metrics
  local rate_limited=$(query_prometheus_instant "sum(rate(api_gateway_rate_limited_total[5m]))")
  local rate_limited_value=$(extract_latest_value "$rate_limited")
  echo "austa_api_gateway_rate_limited_per_second{journey=\"api\", environment=\"$ENVIRONMENT\"} $rate_limited_value" >> "$output_file"
}

# Export metrics to CloudWatch
export_to_cloudwatch() {
  local metrics_file=$1
  local journey=$2
  
  log_info "Exporting metrics to CloudWatch for journey: $journey"
  
  # Check if AWS CLI is installed
  if ! command_exists aws; then
    log_error "AWS CLI not found. Cannot export to CloudWatch."
    return 1
  fi
  
  # Parse metrics file and export each metric
  local count=0
  while IFS= read -r line; do
    # Skip comments and empty lines
    if [[ "$line" =~ ^#.*$ || -z "$line" ]]; then
      continue
    fi
    
    # Parse metric line (format: name{labels} value)
    if [[ "$line" =~ ^([a-zA-Z0-9_]+)\{(.*)\}\ +([0-9.]+)$ ]]; then
      local metric_name="${BASH_REMATCH[1]}"
      local labels="${BASH_REMATCH[2]}"
      local value="${BASH_REMATCH[3]}"
      
      # Extract dimensions from labels
      local dimensions=""
      IFS="," read -ra label_pairs <<< "$labels"
      for pair in "${label_pairs[@]}"; do
        if [[ "$pair" =~ ([a-zA-Z0-9_]+)=\"([^\"]*)\" ]]; then
          local key="${BASH_REMATCH[1]}"
          local val="${BASH_REMATCH[2]}"
          dimensions+="Name=$key,Value=$val "
        fi
      done
      
      # Export to CloudWatch
      aws cloudwatch put-metric-data \
        --namespace "${CLOUDWATCH_NAMESPACE}/${journey}" \
        --metric-name "$metric_name" \
        --value "$value" \
        --dimensions $dimensions \
        --timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --region "${AWS_REGION:-us-east-1}"
      
      count=$((count + 1))
    fi
  done < "$metrics_file"
  
  log_info "Exported $count metrics to CloudWatch"
  echo "$count"
}

# Configure Prometheus scraping for a service
configure_prometheus_scraping() {
  local service=$1
  local metrics_endpoint=$2
  local namespace=${3:-"default"}
  
  log_info "Configuring Prometheus scraping for service: $service at endpoint: $metrics_endpoint"
  
  # Create or update ServiceMonitor for the service
  local service_monitor_yaml="${TEMP_DIR}/${service}-service-monitor.yaml"
  
  cat > "$service_monitor_yaml" << EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ${service}-monitor
  namespace: ${namespace}
  labels:
    app: austa-superapp
spec:
  selector:
    matchLabels:
      app: ${service}
  endpoints:
  - port: metrics
    path: ${metrics_endpoint}
    interval: 30s
    scrapeTimeout: 10s
  namespaceSelector:
    matchNames:
    - ${namespace}
EOF
  
  # Apply the ServiceMonitor
  kubectl apply -f "$service_monitor_yaml"
  
  log_info "ServiceMonitor created/updated for $service"
}

# Create custom metrics exporter for a journey
create_metrics_exporter() {
  local journey=$1
  local metrics_file=$2
  local namespace=${3:-"default"}
  local port=${4:-"9091"}
  
  log_info "Creating metrics exporter for journey: $journey"
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Create exporter directory
  local exporter_dir="${TEMP_DIR}/${journey}-exporter"
  mkdir -p "$exporter_dir"
  
  # Copy metrics file to exporter directory
  cp "$metrics_file" "${exporter_dir}/metrics"
  
  # Create simple Python HTTP server to serve metrics
  cat > "${exporter_dir}/exporter.py" << EOF
#!/usr/bin/env python3

import http.server
import socketserver
import os
import time

PORT = ${port}
METRICS_FILE = "metrics"
UPDATE_INTERVAL = 60  # seconds

class MetricsHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            with open(METRICS_FILE, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

with socketserver.TCPServer(("", PORT), MetricsHandler) as httpd:
    print(f"Serving metrics at port {PORT}")
    httpd.serve_forever()
EOF
  
  # Make the exporter executable
  chmod +x "${exporter_dir}/exporter.py"
  
  # Create Kubernetes deployment for the exporter
  local deployment_yaml="${exporter_dir}/deployment.yaml"
  
  cat > "$deployment_yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${journey}-metrics-exporter
  namespace: ${namespace}
  labels:
    app: ${journey}-metrics-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${journey}-metrics-exporter
  template:
    metadata:
      labels:
        app: ${journey}-metrics-exporter
    spec:
      containers:
      - name: exporter
        image: python:3.9-slim
        command: ["python", "/app/exporter.py"]
        ports:
        - containerPort: ${port}
        volumeMounts:
        - name: exporter-config
          mountPath: /app
      volumes:
      - name: exporter-config
        configMap:
          name: ${journey}-metrics-exporter-config
          defaultMode: 0755
---
apiVersion: v1
kind: Service
metadata:
  name: ${journey}-metrics-exporter
  namespace: ${namespace}
  labels:
    app: ${journey}-metrics-exporter
spec:
  selector:
    app: ${journey}-metrics-exporter
  ports:
  - name: metrics
    port: ${port}
    targetPort: ${port}
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${journey}-metrics-exporter-config
  namespace: ${namespace}
data:
  exporter.py: |
$(cat "${exporter_dir}/exporter.py" | sed 's/^/    /')
  metrics: |
$(cat "${exporter_dir}/metrics" | sed 's/^/    /')
EOF
  
  # Apply the deployment
  kubectl apply -f "$deployment_yaml"
  
  # Create ServiceMonitor for the exporter
  configure_prometheus_scraping "${journey}-metrics-exporter" "/metrics" "$namespace"
  
  log_info "Metrics exporter created for journey: $journey"
}

# Update metrics in an existing exporter
update_exporter_metrics() {
  local journey=$1
  local metrics_file=$2
  local namespace=${3:-"default"}
  
  log_info "Updating metrics in exporter for journey: $journey"
  
  # Create ConfigMap with updated metrics
  local config_map_yaml="${TEMP_DIR}/${journey}-metrics-update.yaml"
  
  cat > "$config_map_yaml" << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${journey}-metrics-exporter-config
  namespace: ${namespace}
data:
  exporter.py: |
$(kubectl get configmap -n "$namespace" "${journey}-metrics-exporter-config" -o jsonpath='{.data.exporter\.py}' | sed 's/^/    /')
  metrics: |
$(cat "$metrics_file" | sed 's/^/    /')
EOF
  
  # Apply the updated ConfigMap
  kubectl apply -f "$config_map_yaml"
  
  # Restart the exporter pod to pick up new metrics
  kubectl rollout restart deployment -n "$namespace" "${journey}-metrics-exporter"
  
  log_info "Metrics updated for journey: $journey"
}

# Check if an exporter exists for a journey
exporter_exists() {
  local journey=$1
  local namespace=${2:-"default"}
  
  kubectl get deployment -n "$namespace" "${journey}-metrics-exporter" &>/dev/null
  return $?
}

# =========================================================
# Main Execution
# =========================================================

log_info "Starting metrics collection for AUSTA SuperApp"
log_info "Environment: $ENVIRONMENT"

# Determine which journeys to collect metrics for
journeys_to_collect=()
if [[ "$COLLECT_ALL" == "true" ]]; then
  # Collect for all journeys
  journeys_to_collect=(${!JOURNEY_SERVICES[@]})
  log_info "Collecting metrics for all journeys: ${journeys_to_collect[*]}"
else
  # Collect for specific journey
  journeys_to_collect=("$SPECIFIC_JOURNEY")
  log_info "Collecting metrics for journey: $SPECIFIC_JOURNEY"
fi

# Process each journey
for journey in "${journeys_to_collect[@]}"; do
  log_info "Processing journey: $journey"
  
  # Map journey to service name
  service=${JOURNEY_SERVICES[$journey]}
  
  # Create output directory for this journey
  journey_dir="${TEMP_DIR}/${journey}"
  mkdir -p "$journey_dir"
  
  # Generate custom metrics for this journey
  metrics_file="${journey_dir}/custom_metrics.prom"
  metrics_count=$(generate_journey_metrics "$journey" "$metrics_file")
  log_info "Generated $metrics_count custom metrics for journey: $journey"
  
  # Export to CloudWatch if requested
  if [[ "$EXPORT_TO_CLOUDWATCH" == "true" ]]; then
    cloudwatch_count=$(export_to_cloudwatch "$metrics_file" "$journey")
    log_info "Exported $cloudwatch_count metrics to CloudWatch for journey: $journey"
  fi
  
  # Check if exporter already exists
  if exporter_exists "$journey"; then
    # Update existing exporter
    update_exporter_metrics "$journey" "$metrics_file"
  else
    # Create new exporter
    create_metrics_exporter "$journey" "$metrics_file"
  fi
  
  # Try to detect native Prometheus endpoints
  endpoint=$(detect_prometheus_endpoints "$service" 2>/dev/null)
  if [[ -n "$endpoint" ]]; then
    log_info "Detected native Prometheus endpoint for $service: $endpoint"
    
    # Collect metrics from native endpoint
    native_metrics_file="${journey_dir}/native_metrics.prom"
    native_count=$(collect_prometheus_metrics "$endpoint" "$native_metrics_file")
    log_info "Collected $native_count native metrics from $service"
    
    # Configure Prometheus scraping for native endpoint
    configure_prometheus_scraping "$service" "$METRICS_ENDPOINT"
  else
    log_info "No native Prometheus endpoint detected for $service"
  fi
  
  # Format output based on requested format
  case "$OUTPUT_FORMAT" in
    "json")
      # Convert metrics to JSON format
      jq -Rs 'split("\n") | map(select(length > 0 and (startswith("#") | not))) | map(capture("(?<metric>[a-zA-Z0-9_]+)\\{(?<labels>.*)\\} (?<value>.+)") | {metric: .metric, labels: .labels, value: .value})' "$metrics_file" > "${journey_dir}/metrics.json"
      cat "${journey_dir}/metrics.json"
      ;;
    "csv")
      # Convert metrics to CSV format
      echo "metric,labels,value" > "${journey_dir}/metrics.csv"
      grep -v "^#" "$metrics_file" | sed -E 's/([a-zA-Z0-9_]+)\{(.*)\} (.*)/\1,"\2",\3/' >> "${journey_dir}/metrics.csv"
      cat "${journey_dir}/metrics.csv"
      ;;
    *)
      # Default to text format (raw metrics)
      cat "$metrics_file"
      ;;
  esac
done

log_info "Metrics collection completed successfully"