#!/bin/bash

# =========================================================================
# blue-green-validate.sh
#
# Validation script for blue-green deployments that performs extensive 
# pre-cutover testing of the new environment, including smoke tests, 
# endpoint validation, authentication verification, and end-to-end API 
# testing to ensure the new deployment is ready to receive production traffic.
# =========================================================================

# Source common functions and configuration
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")" 
source "${SCRIPT_DIR}/common.sh"
source "${SCRIPT_DIR}/config.sh"

# Set default values
NAMESPACE="default"
BLUE_ENV=""
GREEN_ENV=""
VERBOSE=false
TIMEOUT=300 # Default timeout in seconds
THRESHOLD_PCT=10 # Default performance threshold percentage
FORCE=false
OUTPUT_FILE="/tmp/blue-green-validation-$(date +%Y%m%d-%H%M%S).log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Usage information
function usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -b, --blue-env ENV_ID     Blue environment identifier (current production)"
  echo "  -g, --green-env ENV_ID    Green environment identifier (new version)"
  echo "  -n, --namespace NS        Kubernetes namespace (default: default)"
  echo "  -t, --timeout SECONDS     Timeout for tests in seconds (default: 300)"
  echo "  -p, --threshold PERCENT   Performance threshold percentage (default: 10)"
  echo "  -f, --force               Force validation to continue even if tests fail"
  echo "  -v, --verbose             Enable verbose output"
  echo "  -o, --output FILE         Output file for detailed logs"
  echo "  -h, --help                Display this help message"
  exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -b|--blue-env)
      BLUE_ENV="$2"
      shift
      shift
      ;;
    -g|--green-env)
      GREEN_ENV="$2"
      shift
      shift
      ;;
    -n|--namespace)
      NAMESPACE="$2"
      shift
      shift
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift
      shift
      ;;
    -p|--threshold)
      THRESHOLD_PCT="$2"
      shift
      shift
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -o|--output)
      OUTPUT_FILE="$2"
      shift
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate required parameters
if [[ -z "$BLUE_ENV" ]]; then
  echo -e "${RED}Error: Blue environment identifier is required${NC}"
  usage
fi

if [[ -z "$GREEN_ENV" ]]; then
  echo -e "${RED}Error: Green environment identifier is required${NC}"
  usage
fi

# Initialize log file
echo "Blue-Green Validation - $(date)" > "$OUTPUT_FILE"
echo "Blue Environment: $BLUE_ENV" >> "$OUTPUT_FILE"
echo "Green Environment: $GREEN_ENV" >> "$OUTPUT_FILE"
echo "Namespace: $NAMESPACE" >> "$OUTPUT_FILE"
echo "Timeout: $TIMEOUT seconds" >> "$OUTPUT_FILE"
echo "Performance Threshold: $THRESHOLD_PCT%" >> "$OUTPUT_FILE"
echo "----------------------------------------" >> "$OUTPUT_FILE"

# Log function with timestamp
function log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      local color="$BLUE"
      ;;
    "SUCCESS")
      local color="$GREEN"
      ;;
    "WARNING")
      local color="$YELLOW"
      ;;
    "ERROR")
      local color="$RED"
      ;;
    *)
      local color="$NC"
      ;;
  esac
  
  echo -e "${color}[$timestamp] [$level] $message${NC}"
  echo "[$timestamp] [$level] $message" >> "$OUTPUT_FILE"
  
  if [[ "$VERBOSE" == true && -n "$3" ]]; then
    echo -e "${color}$3${NC}"
    echo "$3" >> "$OUTPUT_FILE"
  fi
}

# Function to check if a command exists
function command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
for cmd in kubectl jq curl; do
  if ! command_exists "$cmd"; then
    log "ERROR" "Required command '$cmd' not found. Please install it and try again."
    exit 1
  fi
done

# Track validation results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to record test results
function record_test_result() {
  local test_name=$1
  local result=$2
  local details=$3
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [[ "$result" == "PASS" ]]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log "SUCCESS" "✅ Test '$test_name' passed" "$details"
  elif [[ "$result" == "FAIL" ]]; then
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log "ERROR" "❌ Test '$test_name' failed" "$details"
    
    if [[ "$FORCE" != true ]]; then
      log "ERROR" "Validation failed. Use --force to continue despite failures."
      exit 1
    fi
  elif [[ "$result" == "SKIP" ]]; then
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    log "WARNING" "⚠️ Test '$test_name' skipped" "$details"
  fi
}

# Function to get service endpoints for an environment
function get_service_endpoints() {
  local env_id=$1
  kubectl get services -n "$NAMESPACE" -l "environment=$env_id" -o json | jq -r '.items[] | .metadata.name'
}

# Function to check if all pods in an environment are ready
function check_pods_ready() {
  local env_id=$1
  local all_ready=true
  local details=""
  
  log "INFO" "Checking if all pods in environment '$env_id' are ready..."
  
  # Get all pods with the environment label
  local pods=$(kubectl get pods -n "$NAMESPACE" -l "environment=$env_id" -o json)
  local pod_count=$(echo "$pods" | jq '.items | length')
  
  if [[ "$pod_count" -eq 0 ]]; then
    record_test_result "pods-exist-$env_id" "FAIL" "No pods found with label environment=$env_id"
    return 1
  fi
  
  details+="Found $pod_count pods in environment $env_id\n"
  
  # Check each pod's status
  local not_ready_pods=$(echo "$pods" | jq -r '.items[] | select(.status.containerStatuses[] | select(.ready == false)) | .metadata.name')
  
  if [[ -n "$not_ready_pods" ]]; then
    all_ready=false
    details+="The following pods are not ready:\n$not_ready_pods\n"
    
    # Get more details about not ready pods
    for pod in $not_ready_pods; do
      local pod_details=$(kubectl describe pod "$pod" -n "$NAMESPACE")
      details+="\nDetails for pod $pod:\n$pod_details\n"
    done
  else
    details+="All pods are ready\n"
  fi
  
  if [[ "$all_ready" == true ]]; then
    record_test_result "pods-ready-$env_id" "PASS" "$details"
    return 0
  else
    record_test_result "pods-ready-$env_id" "FAIL" "$details"
    return 1
  fi
}

# Function to check if all deployments have the expected number of replicas
function check_deployments() {
  local env_id=$1
  local all_healthy=true
  local details=""
  
  log "INFO" "Checking deployments in environment '$env_id'..."
  
  # Get all deployments with the environment label
  local deployments=$(kubectl get deployments -n "$NAMESPACE" -l "environment=$env_id" -o json)
  local deployment_count=$(echo "$deployments" | jq '.items | length')
  
  if [[ "$deployment_count" -eq 0 ]]; then
    record_test_result "deployments-exist-$env_id" "FAIL" "No deployments found with label environment=$env_id"
    return 1
  fi
  
  details+="Found $deployment_count deployments in environment $env_id\n"
  
  # Check each deployment's status
  local unhealthy_deployments=$(echo "$deployments" | jq -r '.items[] | select(.status.availableReplicas < .status.replicas) | .metadata.name')
  
  if [[ -n "$unhealthy_deployments" ]]; then
    all_healthy=false
    details+="The following deployments don't have all replicas available:\n$unhealthy_deployments\n"
    
    # Get more details about unhealthy deployments
    for deployment in $unhealthy_deployments; do
      local deployment_details=$(kubectl describe deployment "$deployment" -n "$NAMESPACE")
      details+="\nDetails for deployment $deployment:\n$deployment_details\n"
    done
  else
    details+="All deployments have expected replicas available\n"
  fi
  
  if [[ "$all_healthy" == true ]]; then
    record_test_result "deployments-healthy-$env_id" "PASS" "$details"
    return 0
  else
    record_test_result "deployments-healthy-$env_id" "FAIL" "$details"
    return 1
  fi
}

# Function to check service health
function check_service_health() {
  local env_id=$1
  local service_name=$2
  local endpoint=$3
  local expected_status=${4:-200}
  local details=""
  
  log "INFO" "Checking health of service '$service_name' in environment '$env_id'..."
  
  # Get service IP and port
  local service_ip=$(kubectl get service "$service_name" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
  local service_port=$(kubectl get service "$service_name" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
  
  if [[ -z "$service_ip" || -z "$service_port" ]]; then
    record_test_result "service-exists-$service_name" "FAIL" "Service $service_name not found or missing IP/port"
    return 1
  fi
  
  details+="Service $service_name found at $service_ip:$service_port\n"
  
  # Check if service endpoint is reachable
  local url="http://$service_ip:$service_port$endpoint"
  local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)
  local curl_exit_code=$?
  
  if [[ $curl_exit_code -ne 0 ]]; then
    details+="Failed to connect to $url (curl exit code: $curl_exit_code)\n"
    record_test_result "service-health-$service_name" "FAIL" "$details"
    return 1
  fi
  
  details+="Response status code: $response (expected: $expected_status)\n"
  
  if [[ "$response" == "$expected_status" ]]; then
    record_test_result "service-health-$service_name" "PASS" "$details"
    return 0
  else
    record_test_result "service-health-$service_name" "FAIL" "$details"
    return 1
  fi
}

# Function to check API Gateway health
function check_api_gateway() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking API Gateway in environment '$env_id'..."
  
  # Check if API Gateway service exists
  local api_gateway_service="api-gateway-$env_id"
  if ! kubectl get service "$api_gateway_service" -n "$NAMESPACE" &>/dev/null; then
    record_test_result "api-gateway-exists-$env_id" "FAIL" "API Gateway service $api_gateway_service not found"
    return 1
  fi
  
  details+="API Gateway service $api_gateway_service found\n"
  
  # Check API Gateway health endpoint
  check_service_health "$env_id" "$api_gateway_service" "/health"
  
  # Check API Gateway GraphQL endpoint
  check_service_health "$env_id" "$api_gateway_service" "/graphql" 200
  
  record_test_result "api-gateway-health-$env_id" "PASS" "$details"
  return 0
}

# Function to check authentication service
function check_auth_service() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking Auth Service in environment '$env_id'..."
  
  # Check if Auth Service exists
  local auth_service="auth-service-$env_id"
  if ! kubectl get service "$auth_service" -n "$NAMESPACE" &>/dev/null; then
    record_test_result "auth-service-exists-$env_id" "FAIL" "Auth Service $auth_service not found"
    return 1
  fi
  
  details+="Auth Service $auth_service found\n"
  
  # Check Auth Service health endpoint
  check_service_health "$env_id" "$auth_service" "/health"
  
  record_test_result "auth-service-health-$env_id" "PASS" "$details"
  return 0
}

# Function to check journey services
function check_journey_services() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking Journey Services in environment '$env_id'..."
  
  # List of journey services to check
  local journey_services=("health-service" "care-service" "plan-service")
  
  for service in "${journey_services[@]}"; do
    local service_name="$service-$env_id"
    
    # Check if service exists
    if ! kubectl get service "$service_name" -n "$NAMESPACE" &>/dev/null; then
      record_test_result "$service-exists-$env_id" "FAIL" "Journey Service $service_name not found"
      continue
    fi
    
    details+="Journey Service $service_name found\n"
    
    # Check service health endpoint
    check_service_health "$env_id" "$service_name" "/health"
  done
  
  record_test_result "journey-services-health-$env_id" "PASS" "$details"
  return 0
}

# Function to check gamification engine
function check_gamification_engine() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking Gamification Engine in environment '$env_id'..."
  
  # Check if Gamification Engine service exists
  local gamification_service="gamification-engine-$env_id"
  if ! kubectl get service "$gamification_service" -n "$NAMESPACE" &>/dev/null; then
    record_test_result "gamification-engine-exists-$env_id" "FAIL" "Gamification Engine service $gamification_service not found"
    return 1
  fi
  
  details+="Gamification Engine service $gamification_service found\n"
  
  # Check Gamification Engine health endpoint
  check_service_health "$env_id" "$gamification_service" "/health"
  
  # Check Gamification Engine events endpoint
  check_service_health "$env_id" "$gamification_service" "/events/health"
  
  record_test_result "gamification-engine-health-$env_id" "PASS" "$details"
  return 0
}

# Function to check notification service
function check_notification_service() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking Notification Service in environment '$env_id'..."
  
  # Check if Notification Service exists
  local notification_service="notification-service-$env_id"
  if ! kubectl get service "$notification_service" -n "$NAMESPACE" &>/dev/null; then
    record_test_result "notification-service-exists-$env_id" "FAIL" "Notification Service $notification_service not found"
    return 1
  fi
  
  details+="Notification Service $notification_service found\n"
  
  # Check Notification Service health endpoint
  check_service_health "$env_id" "$notification_service" "/health"
  
  record_test_result "notification-service-health-$env_id" "PASS" "$details"
  return 0
}

# Function to compare performance between blue and green environments
function compare_performance() {
  local blue_env=$1
  local green_env=$2
  local details=""
  
  log "INFO" "Comparing performance between blue ($blue_env) and green ($green_env) environments..."
  
  # List of services to compare
  local services=("api-gateway" "auth-service" "health-service" "care-service" "plan-service" "gamification-engine" "notification-service")
  
  for service in "${services[@]}"; do
    local blue_service="$service-$blue_env"
    local green_service="$service-$green_env"
    
    # Check if both services exist
    if ! kubectl get service "$blue_service" -n "$NAMESPACE" &>/dev/null; then
      details+="Blue service $blue_service not found, skipping comparison\n"
      continue
    fi
    
    if ! kubectl get service "$green_service" -n "$NAMESPACE" &>/dev/null; then
      details+="Green service $green_service not found, skipping comparison\n"
      continue
    fi
    
    # Get service IPs and ports
    local blue_ip=$(kubectl get service "$blue_service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    local blue_port=$(kubectl get service "$blue_service" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
    local green_ip=$(kubectl get service "$green_service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    local green_port=$(kubectl get service "$green_service" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
    
    # Measure response time for blue environment
    local blue_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 5 "http://$blue_ip:$blue_port/health" 2>/dev/null)
    local blue_exit_code=$?
    
    # Measure response time for green environment
    local green_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 5 "http://$green_ip:$green_port/health" 2>/dev/null)
    local green_exit_code=$?
    
    if [[ $blue_exit_code -ne 0 || $green_exit_code -ne 0 ]]; then
      details+="Failed to connect to one or both services, skipping comparison\n"
      continue
    fi
    
    details+="Service: $service\n"
    details+="  Blue response time: ${blue_time}s\n"
    details+="  Green response time: ${green_time}s\n"
    
    # Calculate percentage difference
    local diff=$(echo "scale=2; (($green_time - $blue_time) / $blue_time) * 100" | bc)
    details+="  Difference: ${diff}%\n"
    
    # Check if green is significantly slower
    if (( $(echo "$diff > $THRESHOLD_PCT" | bc -l) )); then
      details+="  ⚠️ Green environment is ${diff}% slower than blue (threshold: $THRESHOLD_PCT%)\n"
      record_test_result "performance-$service" "FAIL" "Green environment is significantly slower than blue"
    else
      details+="  ✅ Performance difference within acceptable threshold\n"
      record_test_result "performance-$service" "PASS" "Performance difference within acceptable threshold"
    fi
  done
  
  log "INFO" "Performance comparison complete" "$details"
}

# Function to validate user journeys
function validate_user_journeys() {
  local env_id=$1
  local details=""
  
  log "INFO" "Validating user journeys in environment '$env_id'..."
  
  # Get API Gateway service
  local api_gateway_service="api-gateway-$env_id"
  if ! kubectl get service "$api_gateway_service" -n "$NAMESPACE" &>/dev/null; then
    record_test_result "user-journeys-api-gateway-$env_id" "FAIL" "API Gateway service $api_gateway_service not found"
    return 1
  fi
  
  local api_gateway_ip=$(kubectl get service "$api_gateway_service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
  local api_gateway_port=$(kubectl get service "$api_gateway_service" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
  local api_base_url="http://$api_gateway_ip:$api_gateway_port"
  
  details+="API Gateway URL: $api_base_url\n"
  
  # Test Health Journey endpoints
  log "INFO" "Testing Health Journey endpoints..."
  local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base_url/health/metrics" 2>/dev/null)
  details+="Health Journey metrics endpoint: $health_response\n"
  
  if [[ "$health_response" == "200" ]]; then
    record_test_result "health-journey-$env_id" "PASS" "Health Journey endpoints are accessible"
  else
    record_test_result "health-journey-$env_id" "FAIL" "Health Journey endpoints returned non-200 status"
  fi
  
  # Test Care Journey endpoints
  log "INFO" "Testing Care Journey endpoints..."
  local care_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base_url/care/providers" 2>/dev/null)
  details+="Care Journey providers endpoint: $care_response\n"
  
  if [[ "$care_response" == "200" ]]; then
    record_test_result "care-journey-$env_id" "PASS" "Care Journey endpoints are accessible"
  else
    record_test_result "care-journey-$env_id" "FAIL" "Care Journey endpoints returned non-200 status"
  fi
  
  # Test Plan Journey endpoints
  log "INFO" "Testing Plan Journey endpoints..."
  local plan_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base_url/plan/benefits" 2>/dev/null)
  details+="Plan Journey benefits endpoint: $plan_response\n"
  
  if [[ "$plan_response" == "200" ]]; then
    record_test_result "plan-journey-$env_id" "PASS" "Plan Journey endpoints are accessible"
  else
    record_test_result "plan-journey-$env_id" "FAIL" "Plan Journey endpoints returned non-200 status"
  fi
  
  # Test Gamification endpoints
  log "INFO" "Testing Gamification endpoints..."
  local gamification_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_base_url/gamification/achievements" 2>/dev/null)
  details+="Gamification achievements endpoint: $gamification_response\n"
  
  if [[ "$gamification_response" == "200" ]]; then
    record_test_result "gamification-$env_id" "PASS" "Gamification endpoints are accessible"
  else
    record_test_result "gamification-$env_id" "FAIL" "Gamification endpoints returned non-200 status"
  fi
  
  log "INFO" "User journey validation complete" "$details"
}

# Function to check database connectivity
function check_database_connectivity() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking database connectivity in environment '$env_id'..."
  
  # List of services that connect to the database
  local services=("health-service" "care-service" "plan-service" "gamification-engine" "auth-service")
  
  for service in "${services[@]}"; do
    local service_name="$service-$env_id"
    
    # Check if service exists
    if ! kubectl get service "$service_name" -n "$NAMESPACE" &>/dev/null; then
      details+="Service $service_name not found, skipping database check\n"
      continue
    fi
    
    # Get a pod for this service
    local pod=$(kubectl get pods -n "$NAMESPACE" -l "app=$service,environment=$env_id" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -z "$pod" ]]; then
      details+="No pods found for service $service_name, skipping database check\n"
      continue
    fi
    
    # Check database connectivity using the pod
    local db_check=$(kubectl exec "$pod" -n "$NAMESPACE" -- curl -s http://localhost:8080/health/database 2>/dev/null)
    local db_status=$(echo "$db_check" | jq -r '.status' 2>/dev/null)
    
    details+="Service: $service_name\n"
    details+="  Database connectivity: $db_status\n"
    
    if [[ "$db_status" == "UP" ]]; then
      record_test_result "database-connectivity-$service-$env_id" "PASS" "Database connectivity check passed"
    else
      record_test_result "database-connectivity-$service-$env_id" "FAIL" "Database connectivity check failed"
    fi
  done
  
  log "INFO" "Database connectivity check complete" "$details"
}

# Function to check Kafka connectivity
function check_kafka_connectivity() {
  local env_id=$1
  local details=""
  
  log "INFO" "Checking Kafka connectivity in environment '$env_id'..."
  
  # List of services that connect to Kafka
  local services=("gamification-engine" "notification-service")
  
  for service in "${services[@]}"; do
    local service_name="$service-$env_id"
    
    # Check if service exists
    if ! kubectl get service "$service_name" -n "$NAMESPACE" &>/dev/null; then
      details+="Service $service_name not found, skipping Kafka check\n"
      continue
    fi
    
    # Get a pod for this service
    local pod=$(kubectl get pods -n "$NAMESPACE" -l "app=$service,environment=$env_id" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -z "$pod" ]]; then
      details+="No pods found for service $service_name, skipping Kafka check\n"
      continue
    fi
    
    # Check Kafka connectivity using the pod
    local kafka_check=$(kubectl exec "$pod" -n "$NAMESPACE" -- curl -s http://localhost:8080/health/kafka 2>/dev/null)
    local kafka_status=$(echo "$kafka_check" | jq -r '.status' 2>/dev/null)
    
    details+="Service: $service_name\n"
    details+="  Kafka connectivity: $kafka_status\n"
    
    if [[ "$kafka_status" == "UP" ]]; then
      record_test_result "kafka-connectivity-$service-$env_id" "PASS" "Kafka connectivity check passed"
    else
      record_test_result "kafka-connectivity-$service-$env_id" "FAIL" "Kafka connectivity check failed"
    fi
  done
  
  log "INFO" "Kafka connectivity check complete" "$details"
}

# Main validation function
function validate_environment() {
  local env_id=$1
  
  log "INFO" "Starting validation of environment '$env_id'..."
  
  # Check if pods are ready
  check_pods_ready "$env_id"
  
  # Check deployments
  check_deployments "$env_id"
  
  # Check API Gateway
  check_api_gateway "$env_id"
  
  # Check Auth Service
  check_auth_service "$env_id"
  
  # Check Journey Services
  check_journey_services "$env_id"
  
  # Check Gamification Engine
  check_gamification_engine "$env_id"
  
  # Check Notification Service
  check_notification_service "$env_id"
  
  # Check Database Connectivity
  check_database_connectivity "$env_id"
  
  # Check Kafka Connectivity
  check_kafka_connectivity "$env_id"
  
  # Validate User Journeys
  validate_user_journeys "$env_id"
  
  log "INFO" "Validation of environment '$env_id' complete"
}

# Main execution
log "INFO" "Starting Blue-Green validation"

# Validate green environment
log "INFO" "Validating Green environment: $GREEN_ENV"
validate_environment "$GREEN_ENV"

# Compare performance between blue and green environments
log "INFO" "Comparing performance between Blue and Green environments"
compare_performance "$BLUE_ENV" "$GREEN_ENV"

# Print summary
log "INFO" "Validation Summary:"
log "INFO" "Total Tests: $TOTAL_TESTS"
log "SUCCESS" "Passed Tests: $PASSED_TESTS"

if [[ $FAILED_TESTS -gt 0 ]]; then
  log "ERROR" "Failed Tests: $FAILED_TESTS"
fi

if [[ $SKIPPED_TESTS -gt 0 ]]; then
  log "WARNING" "Skipped Tests: $SKIPPED_TESTS"
fi

# Determine overall result
if [[ $FAILED_TESTS -eq 0 ]]; then
  log "SUCCESS" "✅ Validation PASSED: Green environment is ready for traffic"
  exit 0
else
  if [[ "$FORCE" == true ]]; then
    log "WARNING" "⚠️ Validation completed with failures, but --force flag was used"
    exit 0
  else
    log "ERROR" "❌ Validation FAILED: Green environment is NOT ready for traffic"
    log "ERROR" "Review the log file for details: $OUTPUT_FILE"
    exit 1
  fi
fi