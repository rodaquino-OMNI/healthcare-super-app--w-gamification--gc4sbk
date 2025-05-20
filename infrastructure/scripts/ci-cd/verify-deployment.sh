#!/bin/bash

#############################################################################
# verify-deployment.sh
#
# Comprehensive post-deployment verification script for the AUSTA SuperApp
# Performs health checks, integration tests, and performance validation
# to ensure successful deployment across all services and environments.
#
# Usage: ./verify-deployment.sh [environment] [deployment-id] [options]
#   environment: development, staging, production
#   deployment-id: The unique identifier for this deployment
#   options:
#     --skip-performance: Skip performance validation
#     --skip-integration: Skip integration tests
#     --timeout=<seconds>: Override default timeout (default: 300)
#     --verbose: Enable verbose output
#
# Exit codes:
#   0: All verification checks passed
#   1: Health check failures
#   2: Integration test failures
#   3: Performance validation failures
#   4: Monitoring configuration failures
#   5: Usage or parameter errors
#   6: Environment setup failures
#
# Author: AUSTA Platform Team
# Last updated: 2023-05-19
#############################################################################

set -e

# Default configuration
DEFAULT_TIMEOUT=300
VERBOSE=false
SKIP_PERFORMANCE=false
SKIP_INTEGRATION=false
RESULT_DIR="/tmp/deployment-verification"
LOG_FILE="${RESULT_DIR}/verification.log"
SUMMARY_FILE="${RESULT_DIR}/summary.json"

# Service groups for verification
API_SERVICES=("api-gateway")
AUTH_SERVICES=("auth-service")
JOURNEY_SERVICES=("health-service" "care-service" "plan-service")
CORE_SERVICES=("gamification-engine" "notification-service")
ALL_SERVICES=("${API_SERVICES[@]}" "${AUTH_SERVICES[@]}" "${JOURNEY_SERVICES[@]}" "${CORE_SERVICES[@]}")

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

#############################################################################
# Utility Functions
#############################################################################

# Log a message to the console and log file
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Ensure log directory exists
  mkdir -p "$(dirname "$LOG_FILE")"
  
  case $level in
    "INFO")
      echo -e "${BLUE}[INFO]${NC} $message"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} $message"
      ;;
    "WARNING")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo -e "[$level] $message"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Log a verbose message (only if --verbose is enabled)
log_verbose() {
  if [ "$VERBOSE" = true ]; then
    log "DEBUG" "$1"
  fi
}

# Display usage information
show_usage() {
  echo "Usage: $0 [environment] [deployment-id] [options]"
  echo "  environment: development, staging, production"
  echo "  deployment-id: The unique identifier for this deployment"
  echo "  options:"
  echo "    --skip-performance: Skip performance validation"
  echo "    --skip-integration: Skip integration tests"
  echo "    --timeout=<seconds>: Override default timeout (default: 300)"
  echo "    --verbose: Enable verbose output"
  exit 5
}

# Initialize the results directory and files
initialize_results() {
  mkdir -p "$RESULT_DIR"
  echo "" > "$LOG_FILE"
  
  # Initialize summary JSON
  cat > "$SUMMARY_FILE" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "results": {
    "health_checks": {
      "status": "pending",
      "details": {}
    },
    "integration_tests": {
      "status": "pending",
      "details": {}
    },
    "performance_validation": {
      "status": "pending",
      "details": {}
    },
    "monitoring_validation": {
      "status": "pending",
      "details": {}
    }
  },
  "overall_status": "pending"
}
EOF
}

# Update the summary JSON with results
update_summary() {
  local section=$1
  local status=$2
  local details=$3
  
  # Use temporary file to avoid issues with in-place editing
  local temp_file="${RESULT_DIR}/summary.tmp.json"
  
  jq --arg section "$section" \
     --arg status "$status" \
     --argjson details "$details" \
     '.results[$section] = {"status": $status, "details": $details}' \
     "$SUMMARY_FILE" > "$temp_file"
  
  mv "$temp_file" "$SUMMARY_FILE"
  
  # Update overall status
  update_overall_status
}

# Update the overall status in the summary JSON
update_overall_status() {
  local temp_file="${RESULT_DIR}/summary.tmp.json"
  
  # Check if any section has failed
  local has_failed=$(jq '.results | to_entries | map(.value.status) | contains(["failed"])' "$SUMMARY_FILE")
  
  # Check if any section is still pending
  local has_pending=$(jq '.results | to_entries | map(.value.status) | contains(["pending"])' "$SUMMARY_FILE")
  
  local overall_status="passed"
  if [ "$has_failed" = "true" ]; then
    overall_status="failed"
  elif [ "$has_pending" = "true" ]; then
    overall_status="pending"
  fi
  
  jq --arg status "$overall_status" \
     '.overall_status = $status' \
     "$SUMMARY_FILE" > "$temp_file"
  
  mv "$temp_file" "$SUMMARY_FILE"
}

# Get Kubernetes namespace for the environment
get_namespace() {
  local environment=$1
  local service=$2
  
  case $environment in
    "development")
      echo "austa-dev"
      ;;
    "staging")
      echo "austa-staging"
      ;;
    "production")
      echo "austa-prod"
      ;;
    *)
      log "ERROR" "Unknown environment: $environment"
      exit 5
      ;;
  esac
}

# Get the base URL for a service in the given environment
get_service_url() {
  local environment=$1
  local service=$2
  
  case $environment in
    "development")
      echo "http://$service.austa-dev.svc.cluster.local:8080"
      ;;
    "staging")
      echo "http://$service.austa-staging.svc.cluster.local:8080"
      ;;
    "production")
      echo "http://$service.austa-prod.svc.cluster.local:8080"
      ;;
    *)
      log "ERROR" "Unknown environment: $environment"
      exit 5
      ;;
  esac
}

# Wait for a condition with timeout
wait_for() {
  local timeout=$1
  local condition=$2
  local description=$3
  local check_interval=5
  local elapsed=0
  
  log_verbose "Waiting for $description (timeout: ${timeout}s)"
  
  while [ $elapsed -lt $timeout ]; do
    if eval $condition; then
      log_verbose "Condition met: $description (${elapsed}s)"
      return 0
    fi
    
    sleep $check_interval
    elapsed=$((elapsed + check_interval))
    log_verbose "Still waiting for $description (${elapsed}s / ${timeout}s)"
  done
  
  log "ERROR" "Timeout waiting for $description after ${timeout}s"
  return 1
}

#############################################################################
# Health Check Functions
#############################################################################

# Check if a service is ready by calling its health endpoint
check_service_health() {
  local environment=$1
  local service=$2
  local url=$(get_service_url "$environment" "$service")
  local health_endpoint="$url/health"
  
  log_verbose "Checking health for $service at $health_endpoint"
  
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint" 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    log "SUCCESS" "Service $service is healthy"
    return 0
  else
    log "ERROR" "Service $service health check failed with status $response"
    return 1
  fi
}

# Check if a service's dependencies are available
check_service_dependencies() {
  local environment=$1
  local service=$2
  local url=$(get_service_url "$environment" "$service")
  local dependencies_endpoint="$url/health/dependencies"
  
  log_verbose "Checking dependencies for $service at $dependencies_endpoint"
  
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$dependencies_endpoint" 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    log "SUCCESS" "Service $service dependencies are available"
    return 0
  else
    log "ERROR" "Service $service dependency check failed with status $response"
    return 1
  fi
}

# Check if Kubernetes pods are running and ready
check_kubernetes_pods() {
  local environment=$1
  local service=$2
  local namespace=$(get_namespace "$environment")
  
  log_verbose "Checking Kubernetes pods for $service in namespace $namespace"
  
  # Get pod status
  local pods=$(kubectl get pods -n "$namespace" -l app="$service" -o json)
  local ready_count=$(echo "$pods" | jq '.items | map(select(.status.phase == "Running" and ([ .status.containerStatuses[] | .ready ] | all))) | length')
  local total_count=$(echo "$pods" | jq '.items | length')
  
  if [ "$ready_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
    log "SUCCESS" "All $ready_count/$total_count pods for $service are running and ready"
    return 0
  else
    log "ERROR" "Only $ready_count/$total_count pods for $service are running and ready"
    return 1
  fi
}

# Run all health checks for all services
run_health_checks() {
  log "INFO" "Starting health checks for all services in $ENVIRONMENT environment"
  
  local all_passed=true
  local details="{}"
  
  for service in "${ALL_SERVICES[@]}"; do
    log "INFO" "Running health checks for $service"
    
    local service_passed=true
    local service_details="{}"
    
    # Check Kubernetes pods
    if check_kubernetes_pods "$ENVIRONMENT" "$service"; then
      service_details=$(echo "$service_details" | jq --arg result "passed" '.kubernetes_pods = $result')
    else
      service_details=$(echo "$service_details" | jq --arg result "failed" '.kubernetes_pods = $result')
      service_passed=false
      all_passed=false
    fi
    
    # Check service health endpoint
    if check_service_health "$ENVIRONMENT" "$service"; then
      service_details=$(echo "$service_details" | jq --arg result "passed" '.health_endpoint = $result')
    else
      service_details=$(echo "$service_details" | jq --arg result "failed" '.health_endpoint = $result')
      service_passed=false
      all_passed=false
    fi
    
    # Check service dependencies
    if check_service_dependencies "$ENVIRONMENT" "$service"; then
      service_details=$(echo "$service_details" | jq --arg result "passed" '.dependencies = $result')
    else
      service_details=$(echo "$service_details" | jq --arg result "failed" '.dependencies = $result')
      service_passed=false
      all_passed=false
    fi
    
    # Add service results to details
    details=$(echo "$details" | jq --arg service "$service" --argjson service_details "$service_details" '.[$service] = $service_details')
  done
  
  # Update summary with health check results
  local status="passed"
  if [ "$all_passed" = false ]; then
    status="failed"
    log "ERROR" "Health checks failed for one or more services"
  else
    log "SUCCESS" "All health checks passed successfully"
  fi
  
  update_summary "health_checks" "$status" "$details"
  
  return $([[ "$all_passed" = true ]] && echo 0 || echo 1)
}

#############################################################################
# Integration Test Functions
#############################################################################

# Run integration tests for a specific journey
run_journey_integration_tests() {
  local environment=$1
  local journey=$2
  
  log "INFO" "Running integration tests for $journey journey"
  
  local test_command=""
  case $journey in
    "health")
      test_command="kubectl exec -n $(get_namespace "$environment") deploy/health-service -- npm run test:integration"
      ;;
    "care")
      test_command="kubectl exec -n $(get_namespace "$environment") deploy/care-service -- npm run test:integration"
      ;;
    "plan")
      test_command="kubectl exec -n $(get_namespace "$environment") deploy/plan-service -- npm run test:integration"
      ;;
    *)
      log "ERROR" "Unknown journey: $journey"
      return 1
      ;;
  esac
  
  log_verbose "Executing test command: $test_command"
  
  # Run the test command and capture output
  local test_output=$(eval $test_command 2>&1)
  local test_result=$?
  
  if [ $test_result -eq 0 ]; then
    log "SUCCESS" "Integration tests for $journey journey passed"
    return 0
  else
    log "ERROR" "Integration tests for $journey journey failed"
    log_verbose "Test output: $test_output"
    return 1
  fi
}

# Run cross-journey integration tests
run_cross_journey_tests() {
  local environment=$1
  
  log "INFO" "Running cross-journey integration tests"
  
  local test_command="kubectl exec -n $(get_namespace "$environment") deploy/api-gateway -- npm run test:e2e"
  
  log_verbose "Executing test command: $test_command"
  
  # Run the test command and capture output
  local test_output=$(eval $test_command 2>&1)
  local test_result=$?
  
  if [ $test_result -eq 0 ]; then
    log "SUCCESS" "Cross-journey integration tests passed"
    return 0
  else
    log "ERROR" "Cross-journey integration tests failed"
    log_verbose "Test output: $test_output"
    return 1
  fi
}

# Run gamification integration tests
run_gamification_tests() {
  local environment=$1
  
  log "INFO" "Running gamification integration tests"
  
  local test_command="kubectl exec -n $(get_namespace "$environment") deploy/gamification-engine -- npm run test:integration"
  
  log_verbose "Executing test command: $test_command"
  
  # Run the test command and capture output
  local test_output=$(eval $test_command 2>&1)
  local test_result=$?
  
  if [ $test_result -eq 0 ]; then
    log "SUCCESS" "Gamification integration tests passed"
    return 0
  else
    log "ERROR" "Gamification integration tests failed"
    log_verbose "Test output: $test_output"
    return 1
  fi
}

# Run all integration tests
run_integration_tests() {
  if [ "$SKIP_INTEGRATION" = true ]; then
    log "WARNING" "Skipping integration tests as requested"
    update_summary "integration_tests" "skipped" "{}"
    return 0
  fi
  
  log "INFO" "Starting integration tests in $ENVIRONMENT environment"
  
  local all_passed=true
  local details="{}"
  
  # Run journey-specific integration tests
  for journey in "health" "care" "plan"; do
    if run_journey_integration_tests "$ENVIRONMENT" "$journey"; then
      details=$(echo "$details" | jq --arg journey "$journey" --arg result "passed" '.[$journey] = $result')
    else
      details=$(echo "$details" | jq --arg journey "$journey" --arg result "failed" '.[$journey] = $result')
      all_passed=false
    fi
  done
  
  # Run cross-journey integration tests
  if run_cross_journey_tests "$ENVIRONMENT"; then
    details=$(echo "$details" | jq --arg result "passed" '.cross_journey = $result')
  else
    details=$(echo "$details" | jq --arg result "failed" '.cross_journey = $result')
    all_passed=false
  fi
  
  # Run gamification integration tests
  if run_gamification_tests "$ENVIRONMENT"; then
    details=$(echo "$details" | jq --arg result "passed" '.gamification = $result')
  else
    details=$(echo "$details" | jq --arg result "failed" '.gamification = $result')
    all_passed=false
  fi
  
  # Update summary with integration test results
  local status="passed"
  if [ "$all_passed" = false ]; then
    status="failed"
    log "ERROR" "Integration tests failed for one or more components"
  else
    log "SUCCESS" "All integration tests passed successfully"
  fi
  
  update_summary "integration_tests" "$status" "$details"
  
  return $([[ "$all_passed" = true ]] && echo 0 || echo 1)
}

#############################################################################
# Performance Validation Functions
#############################################################################

# Get pre-deployment performance baseline metrics from Prometheus
get_baseline_metrics() {
  local environment=$1
  local service=$2
  local metric=$3
  
  log_verbose "Retrieving baseline metrics for $service - $metric"
  
  local prometheus_url=""
  case $environment in
    "development")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
    "staging")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
    "production")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
  esac
  
  # Query for baseline metrics (stored before deployment)
  local query="baseline_${metric}{service=\"${service}\",deployment_id=\"pre_${DEPLOYMENT_ID}\"}"
  local encoded_query=$(echo "$query" | jq -sRr @uri)
  
  local response=$(curl -s "${prometheus_url}/api/v1/query?query=${encoded_query}")
  local value=$(echo "$response" | jq -r '.data.result[0].value[1] // "0"')
  
  echo "$value"
}

# Get current performance metrics from Prometheus
get_current_metrics() {
  local environment=$1
  local service=$2
  local metric=$3
  
  log_verbose "Retrieving current metrics for $service - $metric"
  
  local prometheus_url=""
  case $environment in
    "development")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
    "staging")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
    "production")
      prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
      ;;
  esac
  
  # Query for current metrics
  local query="${metric}{service=\"${service}\"}"
  local encoded_query=$(echo "$query" | jq -sRr @uri)
  
  local response=$(curl -s "${prometheus_url}/api/v1/query?query=${encoded_query}")
  local value=$(echo "$response" | jq -r '.data.result[0].value[1] // "0"')
  
  echo "$value"
}

# Compare metrics and determine if the difference is acceptable
compare_metrics() {
  local baseline=$1
  local current=$2
  local threshold=$3
  local higher_is_better=$4
  
  log_verbose "Comparing metrics: baseline=$baseline, current=$current, threshold=$threshold, higher_is_better=$higher_is_better"
  
  # Calculate percentage difference
  if [ "$baseline" = "0" ]; then
    # Avoid division by zero
    if [ "$current" = "0" ]; then
      # Both are zero, no change
      echo "0"
      return 0
    else
      # Baseline is zero but current is not, consider it a significant change
      echo "100"
      return 1
    fi
  fi
  
  local diff=$(echo "scale=2; (($current - $baseline) / $baseline) * 100" | bc)
  
  # Remove negative sign for comparison
  local abs_diff=$(echo "$diff" | tr -d '-')
  
  if [ "$(echo "$abs_diff > $threshold" | bc)" -eq 1 ]; then
    # Difference exceeds threshold, check if it's in the right direction
    if [ "$higher_is_better" = true ] && [ "$(echo "$diff > 0" | bc)" -eq 1 ]; then
      # Higher is better and it increased, so it's good
      echo "$diff"
      return 0
    elif [ "$higher_is_better" = false ] && [ "$(echo "$diff < 0" | bc)" -eq 1 ]; then
      # Lower is better and it decreased, so it's good
      echo "$diff"
      return 0
    else
      # Change in wrong direction
      echo "$diff"
      return 1
    fi
  else
    # Difference within threshold
    echo "$diff"
    return 0
  fi
}

# Validate performance for a specific service
validate_service_performance() {
  local environment=$1
  local service=$2
  
  log "INFO" "Validating performance for $service"
  
  local service_passed=true
  local service_details="{}"
  
  # Define metrics to check with their thresholds and whether higher is better
  local metrics=(
    "container_startup_time_seconds 20 false"
    "http_request_duration_seconds_avg 15 false"
    "database_query_duration_seconds_avg 15 false"
    "memory_usage_bytes 25 false"
    "cpu_usage_percent 25 false"
  )
  
  for metric_info in "${metrics[@]}"; do
    read -r metric threshold higher_is_better <<< "$metric_info"
    
    local baseline=$(get_baseline_metrics "$environment" "$service" "$metric")
    local current=$(get_current_metrics "$environment" "$service" "$metric")
    
    local diff_percent=$(compare_metrics "$baseline" "$current" "$threshold" "$higher_is_better")
    local comparison_result=$?
    
    local metric_details='{"baseline": "'$baseline'", "current": "'$current'", "diff_percent": "'$diff_percent'"'
    
    if [ $comparison_result -eq 0 ]; then
      metric_details="$metric_details, \"status\": \"passed\"}"
      log "SUCCESS" "Performance check for $service - $metric is within acceptable range (${diff_percent}%)"
    else
      metric_details="$metric_details, \"status\": \"failed\"}"
      log "ERROR" "Performance check for $service - $metric exceeds threshold (${diff_percent}%)"
      service_passed=false
    fi
    
    service_details=$(echo "$service_details" | jq --arg metric "$metric" --argjson metric_details "$metric_details" '.[$metric] = $metric_details')
  done
  
  echo "$service_details"
  return $([[ "$service_passed" = true ]] && echo 0 || echo 1)
}

# Run performance validation for all services
run_performance_validation() {
  if [ "$SKIP_PERFORMANCE" = true ]; then
    log "WARNING" "Skipping performance validation as requested"
    update_summary "performance_validation" "skipped" "{}"
    return 0
  fi
  
  log "INFO" "Starting performance validation in $ENVIRONMENT environment"
  
  local all_passed=true
  local details="{}"
  
  for service in "${ALL_SERVICES[@]}"; do
    local service_details=$(validate_service_performance "$ENVIRONMENT" "$service")
    local service_result=$?
    
    details=$(echo "$details" | jq --arg service "$service" --argjson service_details "$service_details" '.[$service] = $service_details')
    
    if [ $service_result -ne 0 ]; then
      all_passed=false
    fi
  done
  
  # Update summary with performance validation results
  local status="passed"
  if [ "$all_passed" = false ]; then
    status="failed"
    log "ERROR" "Performance validation failed for one or more services"
  else
    log "SUCCESS" "All performance validations passed successfully"
  fi
  
  update_summary "performance_validation" "$status" "$details"
  
  return $([[ "$all_passed" = true ]] && echo 0 || echo 1)
}

#############################################################################
# Monitoring Validation Functions
#############################################################################

# Check if Prometheus is scraping metrics from a service
check_prometheus_scraping() {
  local environment=$1
  local service=$2
  
  log_verbose "Checking Prometheus scraping for $service"
  
  local prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
  local query="up{job=\"${service}\"}"
  local encoded_query=$(echo "$query" | jq -sRr @uri)
  
  local response=$(curl -s "${prometheus_url}/api/v1/query?query=${encoded_query}")
  local value=$(echo "$response" | jq -r '.data.result[0].value[1] // "0"')
  
  if [ "$value" = "1" ]; then
    log "SUCCESS" "Prometheus is successfully scraping metrics from $service"
    return 0
  else
    log "ERROR" "Prometheus is not scraping metrics from $service"
    return 1
  fi
}

# Check if Grafana dashboards are available
check_grafana_dashboards() {
  local environment=$1
  
  log_verbose "Checking Grafana dashboards"
  
  local grafana_url="http://grafana.monitoring.svc.cluster.local:3000"
  local api_key="eyJrIjoiYXVzdGFBcGlLZXkiLCJuIjoiZGVwbG95bWVudC12ZXJpZmljYXRpb24iLCJpZCI6MX0="  # Example API key, should be retrieved securely
  
  # Check for journey dashboards
  local dashboards=("austa-health-journey" "austa-care-journey" "austa-plan-journey" "austa-overview")
  local all_dashboards_available=true
  
  for dashboard in "${dashboards[@]}"; do
    local response=$(curl -s -H "Authorization: Bearer $api_key" "${grafana_url}/api/dashboards/uid/${dashboard}")
    local status=$(echo "$response" | jq -r '.meta.slug // "not_found"')
    
    if [ "$status" != "not_found" ]; then
      log "SUCCESS" "Grafana dashboard $dashboard is available"
    else
      log "ERROR" "Grafana dashboard $dashboard is not available"
      all_dashboards_available=false
    fi
  done
  
  return $([[ "$all_dashboards_available" = true ]] && echo 0 || echo 1)
}

# Check if AlertManager rules are configured
check_alertmanager_rules() {
  local environment=$1
  
  log_verbose "Checking AlertManager rules"
  
  local prometheus_url="http://prometheus.monitoring.svc.cluster.local:9090"
  local response=$(curl -s "${prometheus_url}/api/v1/rules")
  
  # Check for required alert rules
  local required_alerts=("InstanceDown" "APIHighLatency" "ServiceHealthCheckFailing" "HighErrorRate")
  local all_alerts_configured=true
  
  for alert in "${required_alerts[@]}"; do
    local alert_exists=$(echo "$response" | jq --arg alert "$alert" '.data.groups[].rules[] | select(.name == $alert) | .name' | wc -l)
    
    if [ "$alert_exists" -gt 0 ]; then
      log "SUCCESS" "Alert rule $alert is configured"
    else
      log "ERROR" "Alert rule $alert is not configured"
      all_alerts_configured=false
    fi
  done
  
  return $([[ "$all_alerts_configured" = true ]] && echo 0 || echo 1)
}

# Validate monitoring configuration
validate_monitoring() {
  log "INFO" "Validating monitoring configuration in $ENVIRONMENT environment"
  
  local all_passed=true
  local details="{}"
  
  # Check Prometheus scraping for all services
  local prometheus_details="{}"
  for service in "${ALL_SERVICES[@]}"; do
    if check_prometheus_scraping "$ENVIRONMENT" "$service"; then
      prometheus_details=$(echo "$prometheus_details" | jq --arg service "$service" --arg result "passed" '.[$service] = $result')
    else
      prometheus_details=$(echo "$prometheus_details" | jq --arg service "$service" --arg result "failed" '.[$service] = $result')
      all_passed=false
    fi
  done
  details=$(echo "$details" | jq --argjson prometheus "$prometheus_details" '.prometheus_scraping = $prometheus')
  
  # Check Grafana dashboards
  if check_grafana_dashboards "$ENVIRONMENT"; then
    details=$(echo "$details" | jq --arg result "passed" '.grafana_dashboards = $result')
  else
    details=$(echo "$details" | jq --arg result "failed" '.grafana_dashboards = $result')
    all_passed=false
  fi
  
  # Check AlertManager rules
  if check_alertmanager_rules "$ENVIRONMENT"; then
    details=$(echo "$details" | jq --arg result "passed" '.alertmanager_rules = $result')
  else
    details=$(echo "$details" | jq --arg result "failed" '.alertmanager_rules = $result')
    all_passed=false
  fi
  
  # Update summary with monitoring validation results
  local status="passed"
  if [ "$all_passed" = false ]; then
    status="failed"
    log "ERROR" "Monitoring validation failed for one or more components"
  else
    log "SUCCESS" "All monitoring validations passed successfully"
  fi
  
  update_summary "monitoring_validation" "$status" "$details"
  
  return $([[ "$all_passed" = true ]] && echo 0 || echo 1)
}

#############################################################################
# Main Execution
#############################################################################

# Parse command line arguments
parse_args() {
  if [ $# -lt 2 ]; then
    show_usage
  fi
  
  ENVIRONMENT=$1
  DEPLOYMENT_ID=$2
  shift 2
  
  # Validate environment
  case $ENVIRONMENT in
    "development"|"staging"|"production")
      # Valid environment
      ;;
    *)
      log "ERROR" "Invalid environment: $ENVIRONMENT"
      show_usage
      ;;
  esac
  
  # Parse options
  while [ $# -gt 0 ]; do
    case $1 in
      --skip-performance)
        SKIP_PERFORMANCE=true
        ;;
      --skip-integration)
        SKIP_INTEGRATION=true
        ;;
      --timeout=*)
        TIMEOUT=${1#*=}
        ;;
      --verbose)
        VERBOSE=true
        ;;
      *)
        log "ERROR" "Unknown option: $1"
        show_usage
        ;;
    esac
    shift
  done
  
  # Set timeout
  if [ -z "$TIMEOUT" ]; then
    TIMEOUT=$DEFAULT_TIMEOUT
  fi
  
  log "INFO" "Verification parameters: Environment=$ENVIRONMENT, Deployment ID=$DEPLOYMENT_ID, Timeout=$TIMEOUT"
  log "INFO" "Options: Skip Performance=$SKIP_PERFORMANCE, Skip Integration=$SKIP_INTEGRATION, Verbose=$VERBOSE"
}

# Main function
main() {
  parse_args "$@"
  initialize_results
  
  log "INFO" "Starting post-deployment verification for deployment $DEPLOYMENT_ID in $ENVIRONMENT environment"
  
  # Run health checks
  if ! run_health_checks; then
    log "ERROR" "Health checks failed. Verification aborted."
    exit 1
  fi
  
  # Run integration tests
  if ! run_integration_tests; then
    log "ERROR" "Integration tests failed. Verification aborted."
    exit 2
  fi
  
  # Run performance validation
  if ! run_performance_validation; then
    log "ERROR" "Performance validation failed. Verification aborted."
    exit 3
  fi
  
  # Validate monitoring configuration
  if ! validate_monitoring; then
    log "ERROR" "Monitoring validation failed. Verification aborted."
    exit 4
  fi
  
  # All checks passed
  log "SUCCESS" "All verification checks passed for deployment $DEPLOYMENT_ID in $ENVIRONMENT environment"
  
  # Print summary
  log "INFO" "Verification summary:"
  cat "$SUMMARY_FILE" | jq .
  
  exit 0
}

# Execute main function with all arguments
main "$@"