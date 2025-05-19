#!/bin/bash

# =========================================================================
# AUSTA SuperApp Performance Benchmarking Script
# =========================================================================
# This script executes pre-deployment tests against critical services to
# establish baseline metrics for API response times, database query performance,
# and resource utilization, storing results in Prometheus for later comparison
# during deployment validation.
# =========================================================================

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh" || { echo "Error: Failed to source common.sh"; exit 1; }

# =========================================================================
# Configuration
# =========================================================================

# Default values
ENVIRONMENT="staging"
TEST_DURATION=60  # seconds
VERBOSE=false
SERVICES=("api-gateway" "health-service" "care-service" "plan-service" "gamification-engine")
TEST_TYPES=("api" "database" "resource")
PROMETHEUS_PUSHGATEWAY="http://pushgateway:9091"
RESULTS_DIR="/tmp/benchmark-results"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
JOB_NAME="benchmark_${TIMESTAMP}"

# =========================================================================
# Helper Functions
# =========================================================================

function usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV    Target environment (dev, staging, prod) [default: staging]"
  echo "  -d, --duration SECONDS   Test duration in seconds [default: 60]"
  echo "  -s, --services LIST      Comma-separated list of services to test"
  echo "                          [default: api-gateway,health-service,care-service,plan-service,gamification-engine]"
  echo "  -t, --test-types LIST    Comma-separated list of test types (api,database,resource)"
  echo "                          [default: all]"
  echo "  -p, --pushgateway URL    Prometheus Pushgateway URL [default: http://pushgateway:9091]"
  echo "  -o, --output DIR         Results output directory [default: /tmp/benchmark-results]"
  echo "  -v, --verbose            Enable verbose output"
  echo "  -h, --help               Display this help message"
  exit 1
}

function log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    INFO)
      echo -e "\033[0;32m[INFO]\033[0m $timestamp - $message"
      ;;
    WARN)
      echo -e "\033[0;33m[WARN]\033[0m $timestamp - $message"
      ;;
    ERROR)
      echo -e "\033[0;31m[ERROR]\033[0m $timestamp - $message"
      ;;
    DEBUG)
      if [[ "$VERBOSE" == true ]]; then
        echo -e "\033[0;34m[DEBUG]\033[0m $timestamp - $message"
      fi
      ;;
    *)
      echo "$timestamp - $message"
      ;;
  esac
}

function push_to_prometheus() {
  local metric_name=$1
  local metric_value=$2
  local labels=$3
  
  log DEBUG "Pushing metric: ${metric_name}{${labels}} = ${metric_value}"
  
  # Create temporary file for metric
  local temp_file=$(mktemp)
  echo "# TYPE ${metric_name} gauge" > "$temp_file"
  echo "${metric_name}{${labels}} ${metric_value}" >> "$temp_file"
  
  # Push to Prometheus Pushgateway
  if ! curl -s --data-binary @"$temp_file" "${PROMETHEUS_PUSHGATEWAY}/metrics/job/${JOB_NAME}"; then
    log ERROR "Failed to push metrics to Prometheus Pushgateway"
    return 1
  fi
  
  # Clean up
  rm -f "$temp_file"
  return 0
}

function save_result_to_file() {
  local test_type=$1
  local service=$2
  local endpoint=$3
  local metric=$4
  local value=$5
  
  # Create results directory if it doesn't exist
  mkdir -p "${RESULTS_DIR}/${ENVIRONMENT}/${test_type}"
  
  # Append result to file
  echo "${TIMESTAMP},${service},${endpoint},${metric},${value}" >> "${RESULTS_DIR}/${ENVIRONMENT}/${test_type}/${service}_results.csv"
}

# =========================================================================
# API Response Time Benchmarking
# =========================================================================

function benchmark_api_endpoint() {
  local service=$1
  local endpoint=$2
  local method=${3:-GET}
  local payload=${4:-""}
  local headers=${5:-""}
  local expected_status=${6:-200}
  
  local service_url
  case $ENVIRONMENT in
    dev)
      service_url="http://${service}.austa-dev.svc.cluster.local"
      ;;
    staging)
      service_url="http://${service}.austa-staging.svc.cluster.local"
      ;;
    prod)
      service_url="http://${service}.austa-prod.svc.cluster.local"
      ;;
    *)
      log ERROR "Unknown environment: $ENVIRONMENT"
      return 1
      ;;
  esac
  
  local full_url="${service_url}${endpoint}"
  log INFO "Benchmarking API endpoint: ${method} ${full_url}"
  
  # Create temporary files for output and headers
  local output_file=$(mktemp)
  local headers_file=$(mktemp)
  
  # Prepare curl command
  local curl_cmd="curl -s -w '\n%{time_namelookup},%{time_connect},%{time_appconnect},%{time_pretransfer},%{time_redirect},%{time_starttransfer},%{time_total},%{http_code}\n' -o ${output_file} -D ${headers_file}"
  
  # Add method
  curl_cmd="$curl_cmd -X $method"
  
  # Add headers if provided
  if [[ -n "$headers" ]]; then
    IFS=',' read -ra HEADER_ARRAY <<< "$headers"
    for header in "${HEADER_ARRAY[@]}"; do
      curl_cmd="$curl_cmd -H \"$header\""
    done
  fi
  
  # Add payload if provided
  if [[ -n "$payload" && "$method" != "GET" ]]; then
    curl_cmd="$curl_cmd -d '$payload'"
  fi
  
  # Add URL
  curl_cmd="$curl_cmd \"$full_url\""
  
  # Execute curl command
  log DEBUG "Executing: $curl_cmd"
  local result=$(eval $curl_cmd)
  
  # Parse results
  IFS=',' read -r time_namelookup time_connect time_appconnect time_pretransfer time_redirect time_starttransfer time_total http_code <<< "$(echo "$result" | tail -n 1)"
  
  # Check if status code matches expected
  if [[ "$http_code" != "$expected_status" ]]; then
    log ERROR "API endpoint returned unexpected status code: $http_code (expected: $expected_status)"
    log DEBUG "Response: $(cat $output_file)"
    rm -f "$output_file" "$headers_file"
    return 1
  fi
  
  # Log results
  log INFO "API response time metrics for ${service}${endpoint}:"
  log INFO "  DNS Lookup:      ${time_namelookup}s"
  log INFO "  TCP Connect:     ${time_connect}s"
  log INFO "  Start Transfer:  ${time_starttransfer}s"
  log INFO "  Total Time:      ${time_total}s"
  
  # Push metrics to Prometheus
  local common_labels="environment=\"${ENVIRONMENT}\",service=\"${service}\",endpoint=\"${endpoint}\",method=\"${method}\""
  push_to_prometheus "austa_api_dns_lookup_seconds" "$time_namelookup" "$common_labels"
  push_to_prometheus "austa_api_tcp_connect_seconds" "$time_connect" "$common_labels"
  push_to_prometheus "austa_api_time_to_first_byte_seconds" "$time_starttransfer" "$common_labels"
  push_to_prometheus "austa_api_response_time_seconds" "$time_total" "$common_labels"
  
  # Save results to file
  save_result_to_file "api" "$service" "$endpoint" "dns_lookup" "$time_namelookup"
  save_result_to_file "api" "$service" "$endpoint" "tcp_connect" "$time_connect"
  save_result_to_file "api" "$service" "$endpoint" "time_to_first_byte" "$time_starttransfer"
  save_result_to_file "api" "$service" "$endpoint" "response_time" "$time_total"
  
  # Clean up
  rm -f "$output_file" "$headers_file"
  return 0
}

function run_api_benchmarks() {
  log INFO "Starting API response time benchmarks"
  
  # API Gateway endpoints
  if [[ " ${SERVICES[*]} " =~ " api-gateway " ]]; then
    benchmark_api_endpoint "api-gateway" "/health" "GET"
    benchmark_api_endpoint "api-gateway" "/graphql" "POST" '{"query":"{\n  ping\n}"}' "Content-Type: application/json"
  fi
  
  # Health Service endpoints
  if [[ " ${SERVICES[*]} " =~ " health-service " ]]; then
    benchmark_api_endpoint "health-service" "/health" "GET"
    benchmark_api_endpoint "health-service" "/api/v1/metrics" "GET"
    benchmark_api_endpoint "health-service" "/api/v1/goals" "GET"
    benchmark_api_endpoint "health-service" "/api/v1/devices" "GET"
  fi
  
  # Care Service endpoints
  if [[ " ${SERVICES[*]} " =~ " care-service " ]]; then
    benchmark_api_endpoint "care-service" "/health" "GET"
    benchmark_api_endpoint "care-service" "/api/v1/appointments" "GET"
    benchmark_api_endpoint "care-service" "/api/v1/providers" "GET"
    benchmark_api_endpoint "care-service" "/api/v1/medications" "GET"
  fi
  
  # Plan Service endpoints
  if [[ " ${SERVICES[*]} " =~ " plan-service " ]]; then
    benchmark_api_endpoint "plan-service" "/health" "GET"
    benchmark_api_endpoint "plan-service" "/api/v1/plans" "GET"
    benchmark_api_endpoint "plan-service" "/api/v1/benefits" "GET"
    benchmark_api_endpoint "plan-service" "/api/v1/claims" "GET"
  fi
  
  # Gamification Engine endpoints
  if [[ " ${SERVICES[*]} " =~ " gamification-engine " ]]; then
    benchmark_api_endpoint "gamification-engine" "/health" "GET"
    benchmark_api_endpoint "gamification-engine" "/api/v1/achievements" "GET"
    benchmark_api_endpoint "gamification-engine" "/api/v1/profiles" "GET"
    benchmark_api_endpoint "gamification-engine" "/api/v1/leaderboard" "GET"
  fi
  
  log INFO "Completed API response time benchmarks"
}

# =========================================================================
# Database Query Performance Testing
# =========================================================================

function benchmark_database_query() {
  local service=$1
  local query_name=$2
  local query=$3
  
  log INFO "Benchmarking database query: ${query_name} for ${service}"
  
  # Determine service pod based on environment
  local pod_selector="app=${service}"
  local namespace="austa-${ENVIRONMENT}"
  local pod=$(kubectl get pods -n "$namespace" -l "$pod_selector" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod" ]]; then
    log ERROR "No pod found for service: $service in namespace: $namespace"
    return 1
  fi
  
  # Execute query with timing
  log DEBUG "Executing query on pod: $pod"
  local start_time=$(date +%s.%N)
  
  # Different services might have different database access methods
  local result
  case $service in
    health-service|care-service|plan-service)
      # These services use Prisma
      result=$(kubectl exec -n "$namespace" "$pod" -- bash -c "cd /app && npx prisma db execute --stdin" <<< "\timing on\n$query")
      ;;
    gamification-engine)
      # Gamification engine uses direct PostgreSQL access
      result=$(kubectl exec -n "$namespace" "$pod" -- bash -c "PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c \"\\timing on\" -c \"$query\"")
      ;;
    *)
      log ERROR "Unsupported service for database query: $service"
      return 1
      ;;
  esac
  
  local end_time=$(date +%s.%N)
  local execution_time=$(echo "$end_time - $start_time" | bc)
  
  # Extract query execution time from result if available
  local query_time
  if [[ "$result" =~ Time:[[:space:]]*([0-9.]+)[[:space:]]*ms ]]; then
    query_time=$(echo "${BASH_REMATCH[1]} / 1000" | bc -l)
    log INFO "Database reported query time: ${query_time}s"
  else
    query_time=$execution_time
    log WARN "Could not extract query time from result, using measured time: ${query_time}s"
  fi
  
  # Log results
  log INFO "Database query performance for ${service}/${query_name}:"
  log INFO "  Execution Time: ${query_time}s"
  
  # Push metrics to Prometheus
  local labels="environment=\"${ENVIRONMENT}\",service=\"${service}\",query=\"${query_name}\""
  push_to_prometheus "austa_db_query_execution_seconds" "$query_time" "$labels"
  
  # Save results to file
  save_result_to_file "database" "$service" "$query_name" "execution_time" "$query_time"
  
  return 0
}

function run_database_benchmarks() {
  log INFO "Starting database query performance benchmarks"
  
  # Health Service queries
  if [[ " ${SERVICES[*]} " =~ " health-service " ]]; then
    benchmark_database_query "health-service" "list_metrics" "SELECT * FROM \"HealthMetric\" LIMIT 100;"
    benchmark_database_query "health-service" "metrics_by_user" "SELECT * FROM \"HealthMetric\" WHERE \"userId\" = 'test-user-1' ORDER BY \"createdAt\" DESC LIMIT 50;"
    benchmark_database_query "health-service" "active_goals" "SELECT * FROM \"HealthGoal\" WHERE \"status\" = 'ACTIVE' LIMIT 100;"
    benchmark_database_query "health-service" "device_connections" "SELECT * FROM \"DeviceConnection\" WHERE \"status\" = 'CONNECTED' LIMIT 100;"
  fi
  
  # Care Service queries
  if [[ " ${SERVICES[*]} " =~ " care-service " ]]; then
    benchmark_database_query "care-service" "upcoming_appointments" "SELECT * FROM \"Appointment\" WHERE \"status\" = 'SCHEDULED' AND \"appointmentDate\" > NOW() ORDER BY \"appointmentDate\" ASC LIMIT 100;"
    benchmark_database_query "care-service" "active_medications" "SELECT * FROM \"Medication\" WHERE \"endDate\" > NOW() OR \"endDate\" IS NULL LIMIT 100;"
    benchmark_database_query "care-service" "available_providers" "SELECT * FROM \"Provider\" WHERE \"isAvailable\" = true LIMIT 100;"
  fi
  
  # Plan Service queries
  if [[ " ${SERVICES[*]} " =~ " plan-service " ]]; then
    benchmark_database_query "plan-service" "active_plans" "SELECT * FROM \"Plan\" WHERE \"status\" = 'ACTIVE' LIMIT 100;"
    benchmark_database_query "plan-service" "plan_benefits" "SELECT p.\"id\" as \"planId\", p.\"name\" as \"planName\", b.* FROM \"Plan\" p JOIN \"Benefit\" b ON b.\"planId\" = p.\"id\" LIMIT 100;"
    benchmark_database_query "plan-service" "recent_claims" "SELECT * FROM \"Claim\" ORDER BY \"submissionDate\" DESC LIMIT 100;"
  fi
  
  # Gamification Engine queries
  if [[ " ${SERVICES[*]} " =~ " gamification-engine " ]]; then
    benchmark_database_query "gamification-engine" "user_achievements" "SELECT * FROM \"Achievement\" WHERE \"userId\" = 'test-user-1' ORDER BY \"awardedAt\" DESC LIMIT 100;"
    benchmark_database_query "gamification-engine" "leaderboard" "SELECT p.\"userId\", p.\"displayName\", p.\"points\", p.\"level\" FROM \"Profile\" p ORDER BY p.\"points\" DESC LIMIT 100;"
    benchmark_database_query "gamification-engine" "recent_events" "SELECT * FROM \"Event\" ORDER BY \"timestamp\" DESC LIMIT 100;"
    benchmark_database_query "gamification-engine" "active_quests" "SELECT * FROM \"Quest\" WHERE \"status\" = 'ACTIVE' LIMIT 100;"
  fi
  
  log INFO "Completed database query performance benchmarks"
}

# =========================================================================
# Resource Utilization Baseline Capture
# =========================================================================

function capture_resource_utilization() {
  local service=$1
  local duration=$2
  
  log INFO "Capturing resource utilization for ${service} over ${duration} seconds"
  
  # Determine service pod based on environment
  local pod_selector="app=${service}"
  local namespace="austa-${ENVIRONMENT}"
  local pods=$(kubectl get pods -n "$namespace" -l "$pod_selector" -o jsonpath='{.items[*].metadata.name}')
  
  if [[ -z "$pods" ]]; then
    log ERROR "No pods found for service: $service in namespace: $namespace"
    return 1
  fi
  
  # Capture metrics for each pod
  for pod in $pods; do
    log DEBUG "Capturing metrics for pod: $pod"
    
    # Get initial metrics
    local start_metrics=$(kubectl top pod "$pod" -n "$namespace" --containers)
    
    # Wait for specified duration
    sleep "$duration"
    
    # Get final metrics
    local end_metrics=$(kubectl top pod "$pod" -n "$namespace" --containers)
    
    # Parse CPU and memory usage
    local cpu_usage=$(echo "$end_metrics" | grep "$pod" | awk '{print $2}')
    local memory_usage=$(echo "$end_metrics" | grep "$pod" | awk '{print $3}')
    
    # Convert memory to bytes for Prometheus
    local memory_bytes
    if [[ "$memory_usage" =~ ([0-9]+)Mi ]]; then
      memory_bytes=$((${BASH_REMATCH[1]} * 1024 * 1024))
    elif [[ "$memory_usage" =~ ([0-9]+)Ki ]]; then
      memory_bytes=$((${BASH_REMATCH[1]} * 1024))
    elif [[ "$memory_usage" =~ ([0-9]+)Gi ]]; then
      memory_bytes=$((${BASH_REMATCH[1]} * 1024 * 1024 * 1024))
    else
      memory_bytes=$memory_usage
    fi
    
    # Convert CPU to cores for Prometheus (assuming format like 250m = 0.25 cores)
    local cpu_cores
    if [[ "$cpu_usage" =~ ([0-9]+)m ]]; then
      cpu_cores=$(echo "scale=3; ${BASH_REMATCH[1]} / 1000" | bc)
    else
      cpu_cores=$cpu_usage
    fi
    
    # Log results
    log INFO "Resource utilization for ${service}/${pod}:"
    log INFO "  CPU Usage:    ${cpu_usage} (${cpu_cores} cores)"
    log INFO "  Memory Usage: ${memory_usage} (${memory_bytes} bytes)"
    
    # Push metrics to Prometheus
    local labels="environment=\"${ENVIRONMENT}\",service=\"${service}\",pod=\"${pod}\""
    push_to_prometheus "austa_pod_cpu_cores" "$cpu_cores" "$labels"
    push_to_prometheus "austa_pod_memory_bytes" "$memory_bytes" "$labels"
    
    # Save results to file
    save_result_to_file "resource" "$service" "$pod" "cpu_cores" "$cpu_cores"
    save_result_to_file "resource" "$service" "$pod" "memory_bytes" "$memory_bytes"
  done
  
  return 0
}

function measure_container_startup() {
  local service=$1
  
  log INFO "Measuring container startup time for ${service}"
  
  # Determine service deployment based on environment
  local namespace="austa-${ENVIRONMENT}"
  local deployment="${service}"
  
  # Check if deployment exists
  if ! kubectl get deployment -n "$namespace" "$deployment" &>/dev/null; then
    log ERROR "Deployment not found: $deployment in namespace: $namespace"
    return 1
  fi
  
  # Scale down the deployment
  log DEBUG "Scaling down deployment: $deployment"
  kubectl scale deployment -n "$namespace" "$deployment" --replicas=0
  
  # Wait for pods to terminate
  log DEBUG "Waiting for pods to terminate"
  kubectl wait --for=delete pods -l "app=${service}" -n "$namespace" --timeout=60s
  
  # Scale up the deployment and measure time
  log DEBUG "Scaling up deployment: $deployment"
  local start_time=$(date +%s.%N)
  kubectl scale deployment -n "$namespace" "$deployment" --replicas=1
  
  # Wait for pod to be ready
  log DEBUG "Waiting for pod to be ready"
  if ! kubectl wait --for=condition=ready pods -l "app=${service}" -n "$namespace" --timeout=120s; then
    log ERROR "Timeout waiting for pod to be ready"
    return 1
  fi
  
  local end_time=$(date +%s.%N)
  local startup_time=$(echo "$end_time - $start_time" | bc)
  
  # Log results
  log INFO "Container startup time for ${service}:"
  log INFO "  Startup Time: ${startup_time}s"
  
  # Push metrics to Prometheus
  local labels="environment=\"${ENVIRONMENT}\",service=\"${service}\""
  push_to_prometheus "austa_container_startup_seconds" "$startup_time" "$labels"
  
  # Save results to file
  save_result_to_file "resource" "$service" "container" "startup_time" "$startup_time"
  
  return 0
}

function run_resource_benchmarks() {
  log INFO "Starting resource utilization benchmarks"
  
  # Capture resource utilization for all services
  for service in "${SERVICES[@]}"; do
    capture_resource_utilization "$service" "$TEST_DURATION"
  done
  
  # Measure container startup time (only in non-production environments)
  if [[ "$ENVIRONMENT" != "prod" ]]; then
    for service in "${SERVICES[@]}"; do
      measure_container_startup "$service"
    done
  else
    log WARN "Skipping container startup measurements in production environment"
  fi
  
  log INFO "Completed resource utilization benchmarks"
}

# =========================================================================
# Main Function
# =========================================================================

function main() {
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      -e|--environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      -d|--duration)
        TEST_DURATION="$2"
        shift 2
        ;;
      -s|--services)
        IFS=',' read -ra SERVICES <<< "$2"
        shift 2
        ;;
      -t|--test-types)
        IFS=',' read -ra TEST_TYPES <<< "$2"
        shift 2
        ;;
      -p|--pushgateway)
        PROMETHEUS_PUSHGATEWAY="$2"
        shift 2
        ;;
      -o|--output)
        RESULTS_DIR="$2"
        shift 2
        ;;
      -v|--verbose)
        VERBOSE=true
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
  
  # Validate environment
  if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log ERROR "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
    exit 1
  fi
  
  # Create results directory
  mkdir -p "$RESULTS_DIR"
  
  # Log configuration
  log INFO "Starting performance benchmarks with configuration:"
  log INFO "  Environment:       $ENVIRONMENT"
  log INFO "  Test Duration:     $TEST_DURATION seconds"
  log INFO "  Services:          ${SERVICES[*]}"
  log INFO "  Test Types:        ${TEST_TYPES[*]}"
  log INFO "  Pushgateway URL:   $PROMETHEUS_PUSHGATEWAY"
  log INFO "  Results Directory: $RESULTS_DIR"
  log INFO "  Job Name:          $JOB_NAME"
  
  # Run benchmarks based on test types
  if [[ " ${TEST_TYPES[*]} " =~ " api " ]] || [[ " ${TEST_TYPES[*]} " =~ " all " ]]; then
    run_api_benchmarks
  fi
  
  if [[ " ${TEST_TYPES[*]} " =~ " database " ]] || [[ " ${TEST_TYPES[*]} " =~ " all " ]]; then
    run_database_benchmarks
  fi
  
  if [[ " ${TEST_TYPES[*]} " =~ " resource " ]] || [[ " ${TEST_TYPES[*]} " =~ " all " ]]; then
    run_resource_benchmarks
  fi
  
  log INFO "Performance benchmarks completed successfully"
  log INFO "Results saved to: $RESULTS_DIR"
  log INFO "Metrics pushed to Prometheus with job name: $JOB_NAME"
}

# Execute main function
main "$@"