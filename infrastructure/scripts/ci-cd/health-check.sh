#!/bin/bash

#############################################################################
# health-check.sh
#
# Performs comprehensive health checks on deployed services to verify correct
# operation after deployment, including endpoint validation, dependency checks,
# resource utilization verification, and integration point testing.
#
# This script is designed to be run as part of the CI/CD pipeline to validate
# successful deployments and prevent promotion of broken services.
#
# Usage: ./health-check.sh [options]
#
# Options:
#   -e, --environment <env>   Target environment (dev, staging, prod) [default: staging]
#   -n, --namespace <ns>      Kubernetes namespace [default: austa-<env>]
#   -t, --timeout <seconds>   Timeout for health checks [default: 300]
#   -v, --verbose             Enable verbose output
#   -h, --help                Display this help message
#   -j, --journey <journey>   Limit checks to specific journey (health, care, plan)
#   -s, --service <service>   Limit checks to specific service
#   --skip-integration        Skip integration point testing
#   --skip-resources          Skip resource utilization checks
#   --report-file <file>      Output detailed report to file
#   --compare-baseline        Compare metrics with pre-deployment baseline
#
# Exit codes:
#   0 - All health checks passed
#   1 - One or more health checks failed
#   2 - Script execution error
#
# Author: AUSTA Platform Team
# Last updated: 2023-05-19
#############################################################################

set -eo pipefail

# Default values
ENVIRONMENT="staging"
NAMESPACE=""
TIMEOUT=300
VERBOSE=false
JOURNEY=""
SERVICE=""
SKIP_INTEGRATION=false
SKIP_RESOURCES=false
REPORT_FILE=""
COMPARE_BASELINE=false

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common utilities if available
COMMON_SCRIPT="${SCRIPT_DIR}/../monitoring/common.sh"
if [[ -f "${COMMON_SCRIPT}" ]]; then
  source "${COMMON_SCRIPT}"
fi

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Service definitions with their health endpoints and dependencies
declare -A SERVICE_HEALTH_ENDPOINTS
declare -A SERVICE_DEPENDENCIES
declare -A SERVICE_INTEGRATIONS
declare -A SERVICE_RESOURCE_THRESHOLDS

#############################################################################
# Functions
#############################################################################

# Display usage information
function show_usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment <env>   Target environment (dev, staging, prod) [default: staging]"
  echo "  -n, --namespace <ns>      Kubernetes namespace [default: austa-<env>]"
  echo "  -t, --timeout <seconds>   Timeout for health checks [default: 300]"
  echo "  -v, --verbose             Enable verbose output"
  echo "  -h, --help                Display this help message"
  echo "  -j, --journey <journey>   Limit checks to specific journey (health, care, plan)"
  echo "  -s, --service <service>   Limit checks to specific service"
  echo "  --skip-integration        Skip integration point testing"
  echo "  --skip-resources          Skip resource utilization checks"
  echo "  --report-file <file>      Output detailed report to file"
  exit 0
}

# Log message with timestamp
function log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO")
      color=$BLUE
      ;;
    "SUCCESS")
      color=$GREEN
      ;;
    "WARNING")
      color=$YELLOW
      ;;
    "ERROR")
      color=$RED
      ;;
  esac
  
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${color}${level}${NC}: ${message}"
  
  # Add to report file if specified
  if [[ -n "$REPORT_FILE" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${level}: ${message}" >> "$REPORT_FILE"
  fi
}

# Verbose logging
function log_verbose() {
  if [[ "$VERBOSE" == true ]]; then
    log "INFO" "$1"
  fi
}

# Initialize the report file
function init_report_file() {
  if [[ -n "$REPORT_FILE" ]]; then
    echo "# AUSTA SuperApp Health Check Report" > "$REPORT_FILE"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
    echo "Environment: $ENVIRONMENT" >> "$REPORT_FILE"
    echo "Namespace: $NAMESPACE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "## Health Check Results" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  fi
}

# Parse command line arguments
function parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -e|--environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      -n|--namespace)
        NAMESPACE="$2"
        shift 2
        ;;
      -t|--timeout)
        TIMEOUT="$2"
        shift 2
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      -h|--help)
        show_usage
        ;;
      -j|--journey)
        JOURNEY="$2"
        shift 2
        ;;
      -s|--service)
        SERVICE="$2"
        shift 2
        ;;
      --skip-integration)
        SKIP_INTEGRATION=true
        shift
        ;;
      --skip-resources)
        SKIP_RESOURCES=true
        shift
        ;;
      --report-file)
        REPORT_FILE="$2"
        shift 2
        ;;
      --compare-baseline)
        COMPARE_BASELINE=true
        shift
        ;;
      *)
        log "ERROR" "Unknown option: $1"
        show_usage
        exit 2
        ;;
    esac
  done
  
  # Set namespace if not explicitly provided
  if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="austa-${ENVIRONMENT}"
  fi
}

# Initialize service definitions
function init_services() {
  # API Gateway
  SERVICE_HEALTH_ENDPOINTS["api-gateway"]="/health"
  SERVICE_DEPENDENCIES["api-gateway"]="auth-service"
  SERVICE_INTEGRATIONS["api-gateway"]="auth-service:auth/validate"
  SERVICE_RESOURCE_THRESHOLDS["api-gateway"]="cpu=80,memory=80"
  
  # Auth Service
  SERVICE_HEALTH_ENDPOINTS["auth-service"]="/health"
  SERVICE_DEPENDENCIES["auth-service"]="postgres:5432"
  SERVICE_INTEGRATIONS["auth-service"]=""
  SERVICE_RESOURCE_THRESHOLDS["auth-service"]="cpu=70,memory=75"
  
  # Health Journey Service
  SERVICE_HEALTH_ENDPOINTS["health-service"]="/health"
  SERVICE_DEPENDENCIES["health-service"]="postgres:5432,kafka:9092"
  SERVICE_INTEGRATIONS["health-service"]="gamification-engine:events/health"
  SERVICE_RESOURCE_THRESHOLDS["health-service"]="cpu=70,memory=75"
  
  # Care Journey Service
  SERVICE_HEALTH_ENDPOINTS["care-service"]="/health"
  SERVICE_DEPENDENCIES["care-service"]="postgres:5432,kafka:9092"
  SERVICE_INTEGRATIONS["care-service"]="gamification-engine:events/care"
  SERVICE_RESOURCE_THRESHOLDS["care-service"]="cpu=70,memory=75"
  
  # Plan Journey Service
  SERVICE_HEALTH_ENDPOINTS["plan-service"]="/health"
  SERVICE_DEPENDENCIES["plan-service"]="postgres:5432,kafka:9092"
  SERVICE_INTEGRATIONS["plan-service"]="gamification-engine:events/plan"
  SERVICE_RESOURCE_THRESHOLDS["plan-service"]="cpu=70,memory=75"
  
  # Gamification Engine
  SERVICE_HEALTH_ENDPOINTS["gamification-engine"]="/health"
  SERVICE_DEPENDENCIES["gamification-engine"]="postgres:5432,kafka:9092,redis:6379"
  SERVICE_INTEGRATIONS["gamification-engine"]="notification-service:notifications/send"
  SERVICE_RESOURCE_THRESHOLDS["gamification-engine"]="cpu=75,memory=80"
  
  # Notification Service
  SERVICE_HEALTH_ENDPOINTS["notification-service"]="/health"
  SERVICE_DEPENDENCIES["notification-service"]="postgres:5432,kafka:9092,redis:6379"
  SERVICE_INTEGRATIONS["notification-service"]=""
  SERVICE_RESOURCE_THRESHOLDS["notification-service"]="cpu=60,memory=70"
}

# Filter services based on journey or service parameter
function filter_services() {
  local filtered_services=()
  
  # Get all service names
  local all_services=(${!SERVICE_HEALTH_ENDPOINTS[@]})
  
  # Filter by journey if specified
  if [[ -n "$JOURNEY" ]]; then
    case $JOURNEY in
      "health")
        filtered_services+=("health-service")
        ;;
      "care")
        filtered_services+=("care-service")
        ;;
      "plan")
        filtered_services+=("plan-service")
        ;;
      *)
        log "ERROR" "Unknown journey: $JOURNEY"
        exit 2
        ;;
    esac
  # Filter by service if specified
  elif [[ -n "$SERVICE" ]]; then
    if [[ " ${all_services[@]} " =~ " ${SERVICE} " ]]; then
      filtered_services+=("$SERVICE")
    else
      log "ERROR" "Unknown service: $SERVICE"
      exit 2
    fi
  # Otherwise use all services
  else
    filtered_services=(${all_services[@]})
  fi
  
  echo "${filtered_services[@]}"
}

# Check if kubectl is available
function check_kubectl() {
  if ! command -v kubectl &> /dev/null; then
    log "ERROR" "kubectl command not found. Please install kubectl."
    exit 2
  fi
  
  # Check if we can access the cluster
  if ! kubectl get ns &> /dev/null; then
    log "ERROR" "Cannot access Kubernetes cluster. Please check your kubeconfig."
    exit 2
  fi
  
  # Check if namespace exists
  if ! kubectl get ns "$NAMESPACE" &> /dev/null; then
    log "ERROR" "Namespace '$NAMESPACE' does not exist."
    exit 2
  fi
}

# Check service health endpoint
function check_service_health() {
  local service=$1
  local health_endpoint=${SERVICE_HEALTH_ENDPOINTS[$service]}
  local service_url
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  log_verbose "Checking health endpoint for $service at $health_endpoint"
  
  # Get service URL using kubectl port-forward
  local port=$((8000 + RANDOM % 1000))
  local pod_name
  
  # Find a pod for this service
  pod_name=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [[ -z "$pod_name" ]]; then
    log "ERROR" "No pods found for service $service in namespace $NAMESPACE"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
  
  # Start port-forward in background
  kubectl port-forward -n "$NAMESPACE" "$pod_name" "$port:8080" &>/dev/null &
  local port_forward_pid=$!
  
  # Wait for port-forward to establish
  sleep 2
  
  # Check if port-forward is still running
  if ! kill -0 $port_forward_pid &>/dev/null; then
    log "ERROR" "Failed to establish port-forward to $service"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
  
  # Construct service URL
  service_url="http://localhost:$port$health_endpoint"
  
  # Make health check request with timeout
  local response
  local status_code
  
  log_verbose "Checking health endpoint: $service_url"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$service_url" 2>/dev/null)
  status_code=$?
  
  # Kill port-forward process
  kill $port_forward_pid &>/dev/null
  wait $port_forward_pid &>/dev/null || true
  
  # Check response
  if [[ $status_code -eq 0 && $response -eq 200 ]]; then
    log "SUCCESS" "Service $service health check passed"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    log "ERROR" "Service $service health check failed (HTTP $response)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# Check service dependencies
function check_service_dependencies() {
  local service=$1
  local dependencies=${SERVICE_DEPENDENCIES[$service]}
  
  if [[ -z "$dependencies" ]]; then
    log_verbose "Service $service has no dependencies to check"
    return 0
  fi
  
  log_verbose "Checking dependencies for $service: $dependencies"
  
  local pod_name
  pod_name=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [[ -z "$pod_name" ]]; then
    log "ERROR" "No pods found for service $service in namespace $NAMESPACE"
    return 1
  fi
  
  # Check each dependency
  IFS=',' read -ra DEPS <<< "$dependencies"
  for dep in "${DEPS[@]}"; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Parse dependency and port
    IFS=':' read -ra DEP_PARTS <<< "$dep"
    local dep_name=${DEP_PARTS[0]}
    local dep_port=${DEP_PARTS[1]:-80}
    
    log_verbose "Checking dependency $dep_name:$dep_port for service $service"
    
    # Check if dependency is reachable from the service pod
    local check_cmd="nc -z -w 5 $dep_name $dep_port"
    if kubectl exec -n "$NAMESPACE" "$pod_name" -- bash -c "$check_cmd" &>/dev/null; then
      log "SUCCESS" "Service $service can reach dependency $dep_name:$dep_port"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      log "ERROR" "Service $service cannot reach dependency $dep_name:$dep_port"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
  done
}

# Check service integration points
function check_service_integrations() {
  local service=$1
  local integrations=${SERVICE_INTEGRATIONS[$service]}
  
  if [[ -z "$integrations" || "$SKIP_INTEGRATION" == true ]]; then
    log_verbose "Skipping integration checks for $service"
    return 0
  fi
  
  log_verbose "Checking integrations for $service: $integrations"
  
  local pod_name
  pod_name=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [[ -z "$pod_name" ]]; then
    log "ERROR" "No pods found for service $service in namespace $NAMESPACE"
    return 1
  fi
  
  # Check each integration point
  IFS=',' read -ra INTS <<< "$integrations"
  for integration in "${INTS[@]}"; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Parse integration target and endpoint
    IFS=':' read -ra INT_PARTS <<< "$integration"
    local int_service=${INT_PARTS[0]}
    local int_endpoint=${INT_PARTS[1]}
    
    log_verbose "Checking integration with $int_service at endpoint $int_endpoint"
    
    # Use kubectl exec to make a request to the integration endpoint
    local int_url="http://$int_service:8080/$int_endpoint"
    local check_cmd="curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 $int_url"
    
    local response
    response=$(kubectl exec -n "$NAMESPACE" "$pod_name" -- bash -c "$check_cmd" 2>/dev/null)
    
    # Check response
    if [[ "$response" == "200" || "$response" == "201" || "$response" == "204" ]]; then
      log "SUCCESS" "Service $service integration with $int_service is working"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      log "WARNING" "Service $service integration with $int_service returned HTTP $response"
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
  done
}

# Check service resource utilization
function check_service_resources() {
  local service=$1
  local thresholds=${SERVICE_RESOURCE_THRESHOLDS[$service]}
  
  if [[ -z "$thresholds" || "$SKIP_RESOURCES" == true ]]; then
    log_verbose "Skipping resource checks for $service"
    return 0
  fi
  
  log_verbose "Checking resource utilization for $service against thresholds: $thresholds"
  
  # Get resource usage using kubectl top
  local cpu_usage
  local memory_usage
  
  # Parse thresholds
  local cpu_threshold=80
  local memory_threshold=80
  
  IFS=',' read -ra THRESH <<< "$thresholds"
  for thresh in "${THRESH[@]}"; do
    IFS='=' read -ra THRESH_PARTS <<< "$thresh"
    local thresh_name=${THRESH_PARTS[0]}
    local thresh_value=${THRESH_PARTS[1]}
    
    if [[ "$thresh_name" == "cpu" ]]; then
      cpu_threshold=$thresh_value
    elif [[ "$thresh_name" == "memory" ]]; then
      memory_threshold=$thresh_value
    fi
  done
  
  # Check CPU usage
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  # Get CPU usage from kubectl top
  cpu_usage=$(kubectl top pods -n "$NAMESPACE" -l app="$service" --no-headers | awk '{print $2}' | sed 's/[^0-9]*//g')
  
  if [[ -z "$cpu_usage" ]]; then
    log "WARNING" "Could not get CPU usage for service $service"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  elif [[ $cpu_usage -gt $cpu_threshold ]]; then
    log "WARNING" "Service $service CPU usage ($cpu_usage%) exceeds threshold ($cpu_threshold%)"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  else
    log "SUCCESS" "Service $service CPU usage ($cpu_usage%) is below threshold ($cpu_threshold%)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  fi
  
  # Check memory usage
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  # Get memory usage from kubectl top
  memory_usage=$(kubectl top pods -n "$NAMESPACE" -l app="$service" --no-headers | awk '{print $3}' | sed 's/[^0-9]*//g')
  
  if [[ -z "$memory_usage" ]]; then
    log "WARNING" "Could not get memory usage for service $service"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  elif [[ $memory_usage -gt $memory_threshold ]]; then
    log "WARNING" "Service $service memory usage ($memory_usage%) exceeds threshold ($memory_threshold%)"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  else
    log "SUCCESS" "Service $service memory usage ($memory_usage%) is below threshold ($memory_threshold%)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  fi
  
  # Compare with baseline if requested
  if [[ "$COMPARE_BASELINE" == true ]]; then
    compare_with_baseline "$service"
  fi
}

# Compare current metrics with pre-deployment baseline
function compare_with_baseline() {
  local service=$1
  
  log_verbose "Comparing metrics for $service with pre-deployment baseline"
  
  # Check if baseline metrics exist in Prometheus
  # This requires the monitoring infrastructure to be set up with Prometheus
  # and the baseline metrics to be stored before deployment
  
  # Path to the monitoring script that can query Prometheus
  local prometheus_query_script="${SCRIPT_DIR}/../monitoring/query-prometheus.sh"
  
  if [[ ! -f "$prometheus_query_script" ]]; then
    log "WARNING" "Cannot compare with baseline: Prometheus query script not found"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
    return 1
  fi
  
  # Check API response time
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  # Query for current API response time
  local current_response_time
  current_response_time=$($prometheus_query_script -q "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"$service\"}[5m])) by (le))" 2>/dev/null)
  
  # Query for baseline API response time
  local baseline_response_time
  baseline_response_time=$($prometheus_query_script -q "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"$service\", deployment=\"baseline\"}[5m])) by (le))" 2>/dev/null)
  
  if [[ -z "$current_response_time" || -z "$baseline_response_time" ]]; then
    log "WARNING" "Could not compare API response times for service $service: metrics not available"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  else
    # Convert to milliseconds for better readability
    local current_ms=$(echo "$current_response_time * 1000" | bc)
    local baseline_ms=$(echo "$baseline_response_time * 1000" | bc)
    
    # Calculate percentage difference
    local diff_percent=$(echo "scale=2; (($current_ms - $baseline_ms) / $baseline_ms) * 100" | bc)
    
    # Check if current is significantly worse than baseline (>10% increase)
    if (( $(echo "$diff_percent > 10" | bc -l) )); then
      log "WARNING" "Service $service API response time ($current_ms ms) is $diff_percent% higher than baseline ($baseline_ms ms)"
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
    # Check if current is significantly better than baseline (>10% decrease)
    elif (( $(echo "$diff_percent < -10" | bc -l) )); then
      log "SUCCESS" "Service $service API response time ($current_ms ms) is $(echo "$diff_percent * -1" | bc)% lower than baseline ($baseline_ms ms)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      log "SUCCESS" "Service $service API response time ($current_ms ms) is within 10% of baseline ($baseline_ms ms)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
  fi
  
  # Check container startup time
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  # Query for current container startup time
  local current_startup_time
  current_startup_time=$($prometheus_query_script -q "avg(container_startup_time_seconds{service=\"$service\"})" 2>/dev/null)
  
  # Query for baseline container startup time
  local baseline_startup_time
  baseline_startup_time=$($prometheus_query_script -q "avg(container_startup_time_seconds{service=\"$service\", deployment=\"baseline\"})" 2>/dev/null)
  
  if [[ -z "$current_startup_time" || -z "$baseline_startup_time" ]]; then
    log "WARNING" "Could not compare container startup times for service $service: metrics not available"
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
  else
    # Convert to milliseconds for better readability
    local current_ms=$(echo "$current_startup_time * 1000" | bc)
    local baseline_ms=$(echo "$baseline_startup_time * 1000" | bc)
    
    # Calculate percentage difference
    local diff_percent=$(echo "scale=2; (($current_ms - $baseline_ms) / $baseline_ms) * 100" | bc)
    
    # Check if current is significantly worse than baseline (>20% increase)
    if (( $(echo "$diff_percent > 20" | bc -l) )); then
      log "WARNING" "Service $service container startup time ($current_ms ms) is $diff_percent% higher than baseline ($baseline_ms ms)"
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
    # Check if current is significantly better than baseline (>10% decrease)
    elif (( $(echo "$diff_percent < -10" | bc -l) )); then
      log "SUCCESS" "Service $service container startup time ($current_ms ms) is $(echo "$diff_percent * -1" | bc)% lower than baseline ($baseline_ms ms)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      log "SUCCESS" "Service $service container startup time ($current_ms ms) is within acceptable range of baseline ($baseline_ms ms)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
  fi
}

# Run all checks for a service
function check_service() {
  local service=$1
  
  log "INFO" "Checking service: $service"
  
  # Check service health endpoint
  check_service_health "$service"
  
  # Check service dependencies
  check_service_dependencies "$service"
  
  # Check service integration points
  check_service_integrations "$service"
  
  # Check service resource utilization
  check_service_resources "$service"
  
  log "INFO" "Completed checks for service: $service"
}

# Print summary of results
function print_summary() {
  echo ""
  echo "=================================================================="
  echo "                  HEALTH CHECK SUMMARY                           "
  echo "=================================================================="
  echo "Environment: $ENVIRONMENT"
  echo "Namespace: $NAMESPACE"
  echo "------------------------------------------------------------------"
  echo -e "Total checks:  ${TOTAL_CHECKS}"
  echo -e "Passed:        ${GREEN}${PASSED_CHECKS}${NC}"
  echo -e "Warnings:      ${YELLOW}${WARNING_CHECKS}${NC}"
  echo -e "Failed:        ${RED}${FAILED_CHECKS}${NC}"
  echo "------------------------------------------------------------------"
  
  if [[ $FAILED_CHECKS -eq 0 ]]; then
    if [[ $WARNING_CHECKS -eq 0 ]]; then
      echo -e "${GREEN}All health checks passed successfully!${NC}"
    else
      echo -e "${YELLOW}Health checks completed with warnings.${NC}"
    fi
  else
    echo -e "${RED}One or more health checks failed!${NC}"
  fi
  echo "=================================================================="
  
  # Add summary to report file if specified
  if [[ -n "$REPORT_FILE" ]]; then
    echo "" >> "$REPORT_FILE"
    echo "## Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- Total checks: ${TOTAL_CHECKS}" >> "$REPORT_FILE"
    echo "- Passed: ${PASSED_CHECKS}" >> "$REPORT_FILE"
    echo "- Warnings: ${WARNING_CHECKS}" >> "$REPORT_FILE"
    echo "- Failed: ${FAILED_CHECKS}" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
      if [[ $WARNING_CHECKS -eq 0 ]]; then
        echo "**Result:** All health checks passed successfully!" >> "$REPORT_FILE"
      else
        echo "**Result:** Health checks completed with warnings." >> "$REPORT_FILE"
      fi
    else
      echo "**Result:** One or more health checks failed!" >> "$REPORT_FILE"
    fi
  fi
}

#############################################################################
# Main script execution
#############################################################################

# Parse command line arguments
parse_args "$@"

# Initialize report file if specified
if [[ -n "$REPORT_FILE" ]]; then
  init_report_file
fi

# Log script start
log "INFO" "Starting health checks for environment: $ENVIRONMENT, namespace: $NAMESPACE"

# Log additional options
if [[ "$COMPARE_BASELINE" == true ]]; then
  log "INFO" "Will compare metrics with pre-deployment baseline"
fi

if [[ -n "$JOURNEY" ]]; then
  log "INFO" "Limiting checks to journey: $JOURNEY"
fi

if [[ -n "$SERVICE" ]]; then
  log "INFO" "Limiting checks to service: $SERVICE"
fi

# Check if kubectl is available and we can access the cluster
check_kubectl

# Initialize service definitions
init_services

# Get filtered list of services to check
SERVICES_TO_CHECK=($(filter_services))

# Set timeout for the entire script
timeout $TIMEOUT bash -c "{
  # Check each service
  for service in \"\${SERVICES_TO_CHECK[@]}\"; do
    check_service \"\$service\"
  done
}" || {
  log "ERROR" "Health check timed out after $TIMEOUT seconds"
  exit 1
}

# Print summary of results
print_summary

# Exit with appropriate status code
if [[ $FAILED_CHECKS -gt 0 ]]; then
  exit 1
else
  exit 0
fi