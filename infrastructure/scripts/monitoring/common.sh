#!/bin/bash

# =========================================================
# AUSTA SuperApp - Monitoring Common Utilities
# =========================================================
# Shared utilities for monitoring scripts providing standardized
# functions for connecting to monitoring systems, querying metrics,
# calculating thresholds, formatting results, and error handling.
# =========================================================
# Usage: source common.sh
# Permissions: chmod +x common.sh
# =========================================================
# Author: AUSTA SuperApp Team
# Created: 2025-05-19
# =========================================================

set -e

# =========================================================
# Environment Configuration
# =========================================================

# Default environment is development if not specified
ENVIRONMENT=${ENVIRONMENT:-"development"}

# Environment-specific configuration
case "$ENVIRONMENT" in
  "development")
    PROMETHEUS_URL="http://prometheus.dev.austa-superapp.local:9090"
    GRAFANA_URL="http://grafana.dev.austa-superapp.local:3000"
    ALERT_THRESHOLD_MULTIPLIER=1.5
    LOG_LEVEL="DEBUG"
    ;;
  "staging")
    PROMETHEUS_URL="http://prometheus.staging.austa-superapp.local:9090"
    GRAFANA_URL="http://grafana.staging.austa-superapp.local:3000"
    ALERT_THRESHOLD_MULTIPLIER=1.2
    LOG_LEVEL="INFO"
    ;;
  "production")
    PROMETHEUS_URL="http://prometheus.austa-superapp.local:9090"
    GRAFANA_URL="http://grafana.austa-superapp.local:3000"
    ALERT_THRESHOLD_MULTIPLIER=1.1
    LOG_LEVEL="WARN"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT. Using development defaults."
    PROMETHEUS_URL="http://prometheus.dev.austa-superapp.local:9090"
    GRAFANA_URL="http://grafana.dev.austa-superapp.local:3000"
    ALERT_THRESHOLD_MULTIPLIER=1.5
    LOG_LEVEL="DEBUG"
    ;;
esac

# API tokens (should be provided via environment variables in production)
PROMETHEUS_TOKEN=${PROMETHEUS_TOKEN:-""}
GRAFANA_TOKEN=${GRAFANA_TOKEN:-""}

# =========================================================
# Journey Service Mapping
# =========================================================

# Map journey names to their respective services
declare -A JOURNEY_SERVICES
JOURNEY_SERVICES=(
  ["health"]="health-service"
  ["care"]="care-service"
  ["plan"]="plan-service"
  ["gamification"]="gamification-engine"
  ["notification"]="notification-service"
  ["auth"]="auth-service"
  ["api"]="api-gateway"
)

# =========================================================
# Logging Functions
# =========================================================

# Log levels
declare -A LOG_LEVELS
LOG_LEVELS=(
  ["DEBUG"]=0
  ["INFO"]=1
  ["WARN"]=2
  ["ERROR"]=3
  ["FATAL"]=4
)

# Current log level from environment
CURRENT_LOG_LEVEL=${LOG_LEVELS[$LOG_LEVEL]}

# Log a message with a specific level
log() {
  local level=$1
  local message=$2
  local level_num=${LOG_LEVELS[$level]}

  # Only log if the message level is >= current log level
  if [[ $level_num -ge $CURRENT_LOG_LEVEL ]]; then
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message"
  fi
}

# Convenience logging functions
log_debug() { log "DEBUG" "$1"; }
log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }
log_fatal() { log "FATAL" "$1"; }

# =========================================================
# Error Handling
# =========================================================

# Error handler function
handle_error() {
  local exit_code=$?
  local line_number=$1
  log_error "Error occurred at line $line_number with exit code $exit_code"
  exit $exit_code
}

# Set up error trap
trap 'handle_error $LINENO' ERR

# =========================================================
# Prometheus Query Functions
# =========================================================

# Query Prometheus for metrics
query_prometheus() {
  local query=$1
  local start_time=${2:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
  local end_time=${3:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
  local step=${4:-"15s"}

  log_debug "Querying Prometheus: $query"
  
  local auth_header=""
  if [[ -n "$PROMETHEUS_TOKEN" ]]; then
    auth_header="-H 'Authorization: Bearer $PROMETHEUS_TOKEN'"
  fi

  # URL encode the query
  local encoded_query=$(echo "$query" | jq -s -R -r @uri)
  
  # Build the API URL
  local api_url="$PROMETHEUS_URL/api/v1/query_range?query=$encoded_query&start=$start_time&end=$end_time&step=$step"
  
  # Execute the query
  local result=$(curl -s $auth_header "$api_url")
  
  # Check for errors
  local status=$(echo "$result" | jq -r '.status')
  if [[ "$status" != "success" ]]; then
    local error=$(echo "$result" | jq -r '.error // "Unknown error"')
    log_error "Prometheus query failed: $error"
    return 1
  fi
  
  echo "$result"
}

# Query Prometheus for instant metrics (current value)
query_prometheus_instant() {
  local query=$1
  local time=${2:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}

  log_debug "Querying Prometheus (instant): $query"
  
  local auth_header=""
  if [[ -n "$PROMETHEUS_TOKEN" ]]; then
    auth_header="-H 'Authorization: Bearer $PROMETHEUS_TOKEN'"
  fi

  # URL encode the query
  local encoded_query=$(echo "$query" | jq -s -R -r @uri)
  
  # Build the API URL
  local api_url="$PROMETHEUS_URL/api/v1/query?query=$encoded_query&time=$time"
  
  # Execute the query
  local result=$(curl -s $auth_header "$api_url")
  
  # Check for errors
  local status=$(echo "$result" | jq -r '.status')
  if [[ "$status" != "success" ]]; then
    local error=$(echo "$result" | jq -r '.error // "Unknown error"')
    log_error "Prometheus instant query failed: $error"
    return 1
  fi
  
  echo "$result"
}

# Extract values from Prometheus query result
extract_prometheus_values() {
  local result=$1
  local metric_name=${2:-""}
  
  # Extract the values array
  if [[ -n "$metric_name" ]]; then
    # Filter by metric name if provided
    echo "$result" | jq -r ".data.result[] | select(.metric.__name__ == \"$metric_name\") | .values[]"
  else
    # Return all values
    echo "$result" | jq -r '.data.result[].values[]'
  fi
}

# Extract the latest value from Prometheus query result
extract_latest_value() {
  local result=$1
  local metric_name=${2:-""}
  
  if [[ -n "$metric_name" ]]; then
    # Filter by metric name if provided
    echo "$result" | jq -r ".data.result[] | select(.metric.__name__ == \"$metric_name\") | .value[1] // .values[-1][1]"
  else
    # Return the latest value from the first result
    echo "$result" | jq -r '.data.result[0].value[1] // .data.result[0].values[-1][1]'
  fi
}

# =========================================================
# Journey-Specific Metric Functions
# =========================================================

# Get metrics for a specific journey
get_journey_metrics() {
  local journey=$1
  local metric=$2
  local duration=${3:-"1h"}
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Build the query with journey/service label
  local query="$metric{service=\"$service\"}"
  
  # Calculate time range
  local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_time=$(date -u -d "$duration ago" +"%Y-%m-%dT%H:%M:%SZ")
  
  # Execute the query
  query_prometheus "$query" "$start_time" "$end_time"
}

# Get the current health status of a journey
get_journey_health() {
  local journey=$1
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Query for service health (up metric)
  local result=$(query_prometheus_instant "up{service=\"$service\"}")
  local status=$(extract_latest_value "$result")
  
  if [[ "$status" == "1" ]]; then
    echo "healthy"
  else
    echo "unhealthy"
  fi
}

# Get journey-specific error rate
get_journey_error_rate() {
  local journey=$1
  local duration=${2:-"5m"}
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Build the query for error rate calculation
  local query="sum(rate(http_requests_total{service=\"$service\", status_code=~\"5..\"}[$duration])) / sum(rate(http_requests_total{service=\"$service\"}[$duration])) * 100"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local error_rate=$(extract_latest_value "$result")
  
  # Format to 2 decimal places
  printf "%.2f%%" "$error_rate"
}

# Get journey-specific latency percentiles
get_journey_latency() {
  local journey=$1
  local percentile=${2:-"0.95"}
  local duration=${3:-"5m"}
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Build the query for latency percentile
  local query="histogram_quantile($percentile, sum(rate(http_request_duration_seconds_bucket{service=\"$service\"}[$duration])) by (le))"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local latency=$(extract_latest_value "$result")
  
  # Convert to milliseconds and format
  local latency_ms=$(echo "$latency * 1000" | bc -l)
  printf "%.2f ms" "$latency_ms"
}

# Get journey-specific throughput (requests per second)
get_journey_throughput() {
  local journey=$1
  local duration=${2:-"5m"}
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  # Build the query for throughput calculation
  local query="sum(rate(http_requests_total{service=\"$service\"}[$duration]))"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local throughput=$(extract_latest_value "$result")
  
  # Format to 2 decimal places
  printf "%.2f req/s" "$throughput"
}

# Get journey-specific resource usage
get_journey_resource_usage() {
  local journey=$1
  local resource=${2:-"cpu"} # cpu or memory
  
  # Map journey to service name
  local service=${JOURNEY_SERVICES[$journey]}
  if [[ -z "$service" ]]; then
    log_error "Unknown journey: $journey"
    return 1
  fi
  
  local query=""
  if [[ "$resource" == "cpu" ]]; then
    # CPU usage query (percentage)
    query="sum(rate(container_cpu_usage_seconds_total{service=\"$service\"}[5m])) * 100"
  elif [[ "$resource" == "memory" ]]; then
    # Memory usage query (MB)
    query="sum(container_memory_usage_bytes{service=\"$service\"}) / 1024 / 1024"
  else
    log_error "Unknown resource type: $resource. Use 'cpu' or 'memory'."
    return 1
  fi
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local usage=$(extract_latest_value "$result")
  
  # Format the result
  if [[ "$resource" == "cpu" ]]; then
    printf "%.2f%%" "$usage"
  else
    printf "%.2f MB" "$usage"
  fi
}

# =========================================================
# Threshold Calculation Functions
# =========================================================

# Calculate a dynamic threshold based on historical data
calculate_threshold() {
  local metric=$1
  local percentile=${2:-"0.95"}
  local duration=${3:-"7d"}
  local multiplier=${4:-$ALERT_THRESHOLD_MULTIPLIER}
  
  # Calculate time range
  local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_time=$(date -u -d "$duration ago" +"%Y-%m-%dT%H:%M:%SZ")
  
  # Build the query using quantile function
  local query="quantile_over_time($percentile, $metric[$duration])"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local baseline=$(extract_latest_value "$result")
  
  # Apply multiplier to get threshold
  local threshold=$(echo "$baseline * $multiplier" | bc -l)
  
  echo "$threshold"
}

# Check if a metric exceeds its threshold
check_threshold_exceeded() {
  local metric=$1
  local threshold=$2
  
  # Get current value
  local result=$(query_prometheus_instant "$metric")
  local current_value=$(extract_latest_value "$result")
  
  # Compare with threshold
  if (( $(echo "$current_value > $threshold" | bc -l) )); then
    echo "true"
  else
    echo "false"
  fi
}

# =========================================================
# Result Formatting Functions
# =========================================================

# Format metrics as JSON
format_metrics_json() {
  local result=$1
  local metric_name=${2:-""}
  
  if [[ -n "$metric_name" ]]; then
    # Filter by metric name if provided
    echo "$result" | jq ".data.result[] | select(.metric.__name__ == \"$metric_name\")"
  else
    # Return all results
    echo "$result" | jq '.data.result'
  fi
}

# Format metrics as CSV
format_metrics_csv() {
  local result=$1
  local include_header=${2:-"true"}
  
  # Start with header if requested
  if [[ "$include_header" == "true" ]]; then
    echo "timestamp,metric_name,value,labels"
  fi
  
  # Extract and format each data point
  echo "$result" | jq -r '.data.result[] | .metric.__name__ as $name | .metric as $labels | .values[] | [.[0], $name, .[1], $labels] | @csv'
}

# Format a monitoring report
format_monitoring_report() {
  local journey=$1
  local metrics_json=$2
  local report_format=${3:-"text"}
  
  case "$report_format" in
    "json")
      # Return JSON format
      echo "{
  \"journey\": \"$journey\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"metrics\": $metrics_json
}"
      ;;
    "html")
      # Return HTML format
      echo "<html>
<head><title>Monitoring Report - $journey Journey</title></head>
<body>
  <h1>Monitoring Report - $journey Journey</h1>
  <p>Generated at: $(date)</p>
  <pre>$metrics_json</pre>
</body>
</html>"
      ;;
    *)
      # Default to text format
      echo "=== Monitoring Report - $journey Journey ==="
      echo "Generated at: $(date)"
      echo "---"
      echo "$metrics_json" | jq -r '.[] | "Metric: " + (.metric.__name__ // "unknown") + "\nValue: " + (.value[1] // .values[-1][1] | tostring) + "\nLabels: " + (.metric | del(.__name__) | tostring) + "\n"'
      ;;
  esac
}

# =========================================================
# CI/CD Pipeline Monitoring Functions
# =========================================================

# Get CI/CD pipeline metrics
get_pipeline_metrics() {
  local repository=$1
  local workflow=${2:-""}
  local duration=${3:-"7d"}
  
  local query=""
  if [[ -n "$workflow" ]]; then
    # Query for specific workflow
    query="github_workflow_run_duration_seconds{repository=\"$repository\", workflow=\"$workflow\"}"
  else
    # Query for all workflows in repository
    query="github_workflow_run_duration_seconds{repository=\"$repository\"}"
  fi
  
  # Calculate time range
  local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_time=$(date -u -d "$duration ago" +"%Y-%m-%dT%H:%M:%SZ")
  
  # Execute the query
  query_prometheus "$query" "$start_time" "$end_time"
}

# Get CI/CD pipeline success rate
get_pipeline_success_rate() {
  local repository=$1
  local workflow=${2:-""}
  local duration=${3:-"7d"}
  
  local filter="repository=\"$repository\""
  if [[ -n "$workflow" ]]; then
    filter="$filter, workflow=\"$workflow\""
  fi
  
  # Build the query for success rate calculation
  local query="sum(github_workflow_run_conclusion{$filter, conclusion=\"success\"}) / sum(github_workflow_run_conclusion{$filter}) * 100"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local success_rate=$(extract_latest_value "$result")
  
  # Format to 2 decimal places
  printf "%.2f%%" "$success_rate"
}

# Get dependency resolution metrics
get_dependency_metrics() {
  local repository=$1
  local duration=${2:-"7d"}
  
  # Build the query for dependency resolution time
  local query="avg(dependency_resolution_seconds{repository=\"$repository\"})"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local resolution_time=$(extract_latest_value "$result")
  
  # Format to 2 decimal places
  printf "%.2f seconds" "$resolution_time"
}

# Get cache hit ratio for builds
get_build_cache_hit_ratio() {
  local repository=$1
  local duration=${2:-"7d"}
  
  # Build the query for cache hit ratio
  local query="sum(github_workflow_cache_hits{repository=\"$repository\"}) / (sum(github_workflow_cache_hits{repository=\"$repository\"}) + sum(github_workflow_cache_misses{repository=\"$repository\"})) * 100"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local hit_ratio=$(extract_latest_value "$result")
  
  # Format to 2 decimal places
  printf "%.2f%%" "$hit_ratio"
}

# Check for dependency validation failures
check_dependency_validation_failures() {
  local repository=$1
  local threshold=${2:-"5"} # Default 5% threshold
  local duration=${3:-"6h"}
  
  # Build the query for dependency validation failure rate
  local query="sum(rate(dependency_validation_failures_total{repository=\"$repository\"}[$duration])) / sum(rate(dependency_validation_runs_total{repository=\"$repository\"}[$duration])) * 100"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local failure_rate=$(extract_latest_value "$result")
  
  # Check if failure rate exceeds threshold
  if (( $(echo "$failure_rate > $threshold" | bc -l) )); then
    log_warn "Dependency validation failure rate (${failure_rate}%) exceeds threshold (${threshold}%)"
    return 1
  else
    log_info "Dependency validation failure rate (${failure_rate}%) is below threshold (${threshold}%)"
    return 0
  fi
}

# =========================================================
# Utility Functions
# =========================================================

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required dependencies
check_dependencies() {
  local missing_deps=0
  
  # Check for curl
  if ! command_exists curl; then
    log_error "Missing dependency: curl"
    missing_deps=1
  fi
  
  # Check for jq
  if ! command_exists jq; then
    log_error "Missing dependency: jq"
    missing_deps=1
  fi
  
  # Check for bc
  if ! command_exists bc; then
    log_error "Missing dependency: bc"
    missing_deps=1
  fi
  
  if [[ $missing_deps -ne 0 ]]; then
    log_fatal "Missing dependencies. Please install required packages."
    exit 1
  fi
}

# Get Grafana dashboard URL for a journey
get_grafana_dashboard_url() {
  local journey=$1
  local dashboard_id=""
  
  # Map journey to dashboard ID
  case "$journey" in
    "health")
      dashboard_id="health-journey-overview"
      ;;
    "care")
      dashboard_id="care-journey-overview"
      ;;
    "plan")
      dashboard_id="plan-journey-overview"
      ;;
    "gamification")
      dashboard_id="gamification-overview"
      ;;
    "notification")
      dashboard_id="notification-service-overview"
      ;;
    "auth")
      dashboard_id="auth-service-overview"
      ;;
    "api")
      dashboard_id="api-gateway-overview"
      ;;
    "ci-cd")
      dashboard_id="ci-cd-health"
      ;;
    *)
      dashboard_id="austa-superapp-overview"
      ;;
  esac
  
  echo "$GRAFANA_URL/d/$dashboard_id"
}

# Get performance baseline comparison
get_performance_baseline_comparison() {
  local metric=$1
  local pre_deployment_time=$2
  local post_deployment_time=$3
  
  # Query pre-deployment value
  local pre_result=$(query_prometheus_instant "$metric" "$pre_deployment_time")
  local pre_value=$(extract_latest_value "$pre_result")
  
  # Query post-deployment value
  local post_result=$(query_prometheus_instant "$metric" "$post_deployment_time")
  local post_value=$(extract_latest_value "$post_result")
  
  # Calculate percentage change
  local change=$(echo "(($post_value - $pre_value) / $pre_value) * 100" | bc -l)
  
  # Format the result
  printf "%.2f%%" "$change"
}

# =========================================================
# Performance Baseline Monitoring Functions
# =========================================================

# Store a performance baseline for a metric
store_performance_baseline() {
  local metric=$1
  local baseline_name=${2:-"default"}
  local baseline_dir="${BASELINE_DIR:-"/tmp/austa-baselines"}"
  
  # Create baseline directory if it doesn't exist
  mkdir -p "$baseline_dir"
  
  # Get current value
  local result=$(query_prometheus_instant "$metric")
  local current_value=$(extract_latest_value "$result")
  
  # Store with timestamp
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local baseline_file="$baseline_dir/${baseline_name}.json"
  
  echo "{
  \"metric\": \"$metric\",
  \"value\": $current_value,
  \"timestamp\": \"$timestamp\",
  \"environment\": \"$ENVIRONMENT\"
}" > "$baseline_file"
  
  log_info "Stored performance baseline '$baseline_name' for metric '$metric'"
  echo "$baseline_file"
}

# Compare current performance with stored baseline
compare_with_baseline() {
  local metric=$1
  local baseline_name=${2:-"default"}
  local threshold=${3:-"10"} # Default 10% threshold
  local baseline_dir="${BASELINE_DIR:-"/tmp/austa-baselines"}"
  
  local baseline_file="$baseline_dir/${baseline_name}.json"
  
  # Check if baseline exists
  if [[ ! -f "$baseline_file" ]]; then
    log_error "Baseline '$baseline_name' not found"
    return 1
  fi
  
  # Read baseline value
  local baseline_value=$(cat "$baseline_file" | jq -r '.value')
  local baseline_timestamp=$(cat "$baseline_file" | jq -r '.timestamp')
  
  # Get current value
  local result=$(query_prometheus_instant "$metric")
  local current_value=$(extract_latest_value "$result")
  
  # Calculate percentage change
  local change=$(echo "(($current_value - $baseline_value) / $baseline_value) * 100" | bc -l)
  local abs_change=$(echo "if($change < 0) -1*$change else $change fi" | bc -l)
  
  # Check if change exceeds threshold
  local exceeded="false"
  if (( $(echo "$abs_change > $threshold" | bc -l) )); then
    exceeded="true"
  fi
  
  # Format the result
  echo "{
  \"metric\": \"$metric\",
  \"baseline_value\": $baseline_value,
  \"baseline_timestamp\": \"$baseline_timestamp\",
  \"current_value\": $current_value,
  \"current_timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"change_percent\": $change,
  \"threshold_exceeded\": $exceeded,
  \"threshold\": $threshold
}"
}

# Check container startup time comparison
compare_container_startup_time() {
  local service=$1
  local pre_deployment_time=$2
  local post_deployment_time=$3
  
  # Build the query for container startup time
  local query="container_start_time_seconds{service=\"$service\"}"
  
  # Get performance comparison
  get_performance_baseline_comparison "$query" "$pre_deployment_time" "$post_deployment_time"
}

# Check API response time comparison
compare_api_response_time() {
  local endpoint=$1
  local pre_deployment_time=$2
  local post_deployment_time=$3
  
  # Build the query for API response time
  local query="http_request_duration_seconds{endpoint=\"$endpoint\", quantile=\"0.95\"}"
  
  # Get performance comparison
  get_performance_baseline_comparison "$query" "$pre_deployment_time" "$post_deployment_time"
}

# Check database query latency comparison
compare_db_query_latency() {
  local query_name=$1
  local pre_deployment_time=$2
  local post_deployment_time=$3
  
  # Build the query for database query latency
  local query="database_query_duration_seconds{query_name=\"$query_name\", quantile=\"0.95\"}"
  
  # Get performance comparison
  get_performance_baseline_comparison "$query" "$pre_deployment_time" "$post_deployment_time"
}

# =========================================================
# Usage Examples
# =========================================================

# Example 1: Query CPU usage for the health journey
# ```
# source ./common.sh
# result=$(get_journey_metrics "health" "container_cpu_usage_seconds_total" "30m")
# echo $(format_metrics_json "$result")
# ```

# Example 2: Check if a service is healthy
# ```
# source ./common.sh
# status=$(get_journey_health "care")
# echo "Care journey status: $status"
# ```

# Example 3: Calculate a threshold and check if it's exceeded
# ```
# source ./common.sh
# threshold=$(calculate_threshold "http_request_duration_seconds{quantile=\"0.95\"}" "0.99" "7d")
# exceeded=$(check_threshold_exceeded "http_request_duration_seconds{quantile=\"0.95\"}" "$threshold")
# if [[ "$exceeded" == "true" ]]; then
#   log_warn "Performance threshold exceeded!"
# fi
# ```

# Example 4: Generate a monitoring report
# ```
# source ./common.sh
# result=$(get_journey_metrics "plan" "http_requests_total")
# json=$(format_metrics_json "$result")
# report=$(format_monitoring_report "plan" "$json" "json")
# echo "$report" > plan_monitoring_report.json
# ```

# Example 5: Store and compare performance baselines
# ```
# source ./common.sh
# # Store baseline before deployment
# store_performance_baseline "http_request_duration_seconds{endpoint=\"/api/health/metrics\", quantile=\"0.95\"}" "health-metrics-endpoint-v1.2.3"
# 
# # After deployment, compare with baseline
# comparison=$(compare_with_baseline "http_request_duration_seconds{endpoint=\"/api/health/metrics\", quantile=\"0.95\"}" "health-metrics-endpoint-v1.2.3" "5")
# echo "$comparison" | jq .
# ```

# Example 6: CI/CD pipeline monitoring
# ```
# source ./common.sh
# # Get build success rate for a repository
# success_rate=$(get_pipeline_success_rate "austa-superapp" "main-build")
# echo "Build success rate: $success_rate"
# 
# # Check for dependency validation failures
# check_dependency_validation_failures "austa-superapp" "3"
# ```

# =========================================================
# Cross-Journey Monitoring Functions
# =========================================================

# Monitor end-to-end user flow across journeys
monitor_user_flow() {
  local flow_name=$1
  local duration=${2:-"1h"}
  
  # Build the query for user flow monitoring
  local query="user_flow_duration_seconds{flow=\"$flow_name\"}"
  
  # Calculate time range
  local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_time=$(date -u -d "$duration ago" +"%Y-%m-%dT%H:%M:%SZ")
  
  # Execute the query
  local result=$(query_prometheus "$query" "$start_time" "$end_time")
  
  # Format the result
  format_metrics_json "$result"
}

# Check cross-journey dependencies health
check_cross_journey_dependencies() {
  local source_journey=$1
  local target_journey=$2
  
  # Map journeys to service names
  local source_service=${JOURNEY_SERVICES[$source_journey]}
  local target_service=${JOURNEY_SERVICES[$target_journey]}
  
  if [[ -z "$source_service" || -z "$target_service" ]]; then
    log_error "Unknown journey: $source_journey or $target_journey"
    return 1
  fi
  
  # Build the query for dependency health
  local query="service_dependency_health{source=\"$source_service\", target=\"$target_service\"}"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local health=$(extract_latest_value "$result")
  
  if [[ "$health" == "1" ]]; then
    echo "healthy"
  else
    echo "unhealthy"
  fi
}

# Get cross-journey latency
get_cross_journey_latency() {
  local source_journey=$1
  local target_journey=$2
  local duration=${3:-"5m"}
  
  # Map journeys to service names
  local source_service=${JOURNEY_SERVICES[$source_journey]}
  local target_service=${JOURNEY_SERVICES[$target_journey]}
  
  if [[ -z "$source_service" || -z "$target_service" ]]; then
    log_error "Unknown journey: $source_journey or $target_journey"
    return 1
  fi
  
  # Build the query for cross-journey latency
  local query="service_request_duration_seconds{source=\"$source_service\", target=\"$target_service\", quantile=\"0.95\"}"
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  local latency=$(extract_latest_value "$result")
  
  # Convert to milliseconds and format
  local latency_ms=$(echo "$latency * 1000" | bc -l)
  printf "%.2f ms" "$latency_ms"
}

# Monitor gamification events across journeys
monitor_gamification_events() {
  local journey=${1:-"all"}
  local duration=${2:-"1h"}
  
  local query=""
  if [[ "$journey" == "all" ]]; then
    # Query for all journeys
    query="sum(rate(gamification_events_total[$duration])) by (journey)"
  else
    # Query for specific journey
    local service=${JOURNEY_SERVICES[$journey]}
    if [[ -z "$service" ]]; then
      log_error "Unknown journey: $journey"
      return 1
    fi
    query="rate(gamification_events_total{journey=\"$journey\"}[$duration])"
  fi
  
  # Execute the query
  local result=$(query_prometheus_instant "$query")
  
  # Format the result
  format_metrics_json "$result"
}

# =========================================================
# Initialization
# =========================================================

# Check dependencies when this script is sourced
check_dependencies

# Log initialization
log_info "Monitoring utilities initialized for environment: $ENVIRONMENT"
log_info "Prometheus URL: $PROMETHEUS_URL"
log_info "Grafana URL: $GRAFANA_URL"