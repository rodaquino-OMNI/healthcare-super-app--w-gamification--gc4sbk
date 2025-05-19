#!/bin/bash

# =========================================================================
# health-checker.sh - Comprehensive Health Check Script for AUSTA SuperApp
# =========================================================================
#
# This script performs deep health checks for all AUSTA SuperApp microservices,
# validates dependencies, checks journey-specific functionality, and reports
# results to monitoring systems.
#
# Features:
# - Deep health checks beyond basic liveness probes
# - Dependency verification for all services
# - Journey-specific functionality validation
# - Integration with monitoring systems (Prometheus, Grafana)
# - Automatic recovery mechanisms for certain failure scenarios
# - Detailed health status reporting
#
# Usage: ./health-checker.sh [options]
#   Options:
#     -e, --environment ENV   Specify environment (dev, staging, prod) [default: current context]
#     -s, --service NAME      Check specific service only
#     -j, --journey NAME      Check specific journey only (health, care, plan)
#     -v, --verbose           Enable verbose output
#     -q, --quiet             Suppress all output except errors
#     -m, --metrics           Output metrics in Prometheus format
#     -r, --recover           Attempt recovery for failed services
#     -h, --help              Display this help message
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error or invalid arguments
#
# =========================================================================

set -eo pipefail

# =========================================================================
# Configuration
# =========================================================================

# Script version
VERSION="1.0.0"

# Default values
ENVIRONMENT=""
SPECIFIC_SERVICE=""
SPECIFIC_JOURNEY=""
VERBOSE=false
QUIET=false
OUTPUT_METRICS=false
ATTEMPT_RECOVERY=false
TIMEOUT=5  # Default timeout in seconds
RETRIES=3  # Default number of retries
METRICS_FILE="/tmp/health_metrics.prom"
LOG_FILE="/var/log/austa/health-checker.log"
ALERT_WEBHOOK=""

# Service endpoints (will be populated based on environment)
API_GATEWAY_URL=""
AUTH_SERVICE_URL=""
HEALTH_SERVICE_URL=""
CARE_SERVICE_URL=""
PLAN_SERVICE_URL=""
GAMIFICATION_SERVICE_URL=""
NOTIFICATION_SERVICE_URL=""

# Database connection strings (will be populated based on environment)
POSTGRES_URI=""
REDIS_URI=""
KAFKA_BROKERS=""

# Kubernetes namespace
NAMESPACE="austa-superapp"

# =========================================================================
# Helper Functions
# =========================================================================

# Print usage information
usage() {
  cat << EOF
Usage: $0 [options]

Options:
  -e, --environment ENV   Specify environment (dev, staging, prod) [default: current context]
  -s, --service NAME      Check specific service only
  -j, --journey NAME      Check specific journey only (health, care, plan)
  -v, --verbose           Enable verbose output
  -q, --quiet             Suppress all output except errors
  -m, --metrics           Output metrics in Prometheus format
  -r, --recover           Attempt recovery for failed services
  -h, --help              Display this help message

Example:
  $0 --environment prod --journey health --metrics
EOF
}

# Logging function
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Always log to file
  mkdir -p $(dirname "$LOG_FILE")
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  # Output to console based on verbosity settings
  if [[ "$QUIET" == false ]] || [[ "$level" == "ERROR" ]]; then
    if [[ "$level" == "INFO" ]] && [[ "$VERBOSE" == false ]]; then
      return
    fi
    
    case $level in
      "INFO") echo -e "\033[0;32m[INFO]\033[0m $message" ;;
      "WARN") echo -e "\033[0;33m[WARN]\033[0m $message" ;;
      "ERROR") echo -e "\033[0;31m[ERROR]\033[0m $message" ;;
      "DEBUG") 
        if [[ "$VERBOSE" == true ]]; then
          echo -e "\033[0;34m[DEBUG]\033[0m $message"
        fi
        ;;
      *) echo "[$level] $message" ;;
    esac
  fi
}

# Function to record metrics in Prometheus format
record_metric() {
  local metric_name=$1
  local metric_value=$2
  local labels=$3
  
  if [[ "$OUTPUT_METRICS" == true ]]; then
    echo "${metric_name}{${labels}} ${metric_value}" >> "$METRICS_FILE"
  fi
}

# Function to detect environment if not specified
detect_environment() {
  if [[ -z "$ENVIRONMENT" ]]; then
    # Try to detect from kubectl context
    local context=$(kubectl config current-context 2>/dev/null || echo "")
    
    case $context in
      *dev*) ENVIRONMENT="dev" ;;
      *staging*) ENVIRONMENT="staging" ;;
      *prod*) ENVIRONMENT="prod" ;;
      *) ENVIRONMENT="dev" ;; # Default to dev if can't detect
    esac
    
    log "INFO" "Auto-detected environment: $ENVIRONMENT"
  fi
  
  # Set environment-specific configurations
  case $ENVIRONMENT in
    "dev")
      API_GATEWAY_URL="http://api-gateway:4000"
      AUTH_SERVICE_URL="http://auth-service:3000"
      HEALTH_SERVICE_URL="http://health-journey:3000"
      CARE_SERVICE_URL="http://care-journey:3000"
      PLAN_SERVICE_URL="http://plan-journey:3000"
      GAMIFICATION_SERVICE_URL="http://gamification-engine:3000"
      NOTIFICATION_SERVICE_URL="http://notification-service:3000"
      POSTGRES_URI="postgresql://postgres:postgres@postgres:5432/austa"
      REDIS_URI="redis://redis:6379"
      KAFKA_BROKERS="kafka:9092"
      NAMESPACE="austa-superapp-dev"
      ;;
    "staging")
      API_GATEWAY_URL="http://api-gateway:4000"
      AUTH_SERVICE_URL="http://auth-service:3000"
      HEALTH_SERVICE_URL="http://health-journey:3000"
      CARE_SERVICE_URL="http://care-journey:3000"
      PLAN_SERVICE_URL="http://plan-journey:3000"
      GAMIFICATION_SERVICE_URL="http://gamification-engine:3000"
      NOTIFICATION_SERVICE_URL="http://notification-service:3000"
      POSTGRES_URI="postgresql://postgres:postgres@postgres:5432/austa"
      REDIS_URI="redis://redis:6379"
      KAFKA_BROKERS="kafka:9092"
      NAMESPACE="austa-superapp-staging"
      ;;
    "prod")
      API_GATEWAY_URL="http://api-gateway:4000"
      AUTH_SERVICE_URL="http://auth-service:3000"
      HEALTH_SERVICE_URL="http://health-journey:3000"
      CARE_SERVICE_URL="http://care-journey:3000"
      PLAN_SERVICE_URL="http://plan-journey:3000"
      GAMIFICATION_SERVICE_URL="http://gamification-engine:3000"
      NOTIFICATION_SERVICE_URL="http://notification-service:3000"
      # In production, we would use secrets to get these values
      POSTGRES_URI="$(kubectl get secret db-credentials -n $NAMESPACE -o jsonpath='{.data.uri}' | base64 -d)"
      REDIS_URI="$(kubectl get secret redis-credentials -n $NAMESPACE -o jsonpath='{.data.uri}' | base64 -d)"
      KAFKA_BROKERS="$(kubectl get secret kafka-credentials -n $NAMESPACE -o jsonpath='{.data.brokers}' | base64 -d)"
      NAMESPACE="austa-superapp"
      ;;
    *)
      log "ERROR" "Unknown environment: $ENVIRONMENT"
      exit 2
      ;;
  esac
  
  # Set alert webhook based on environment
  case $ENVIRONMENT in
    "dev") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
    "staging") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
    "prod") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
  esac
}

# Function to send alerts
send_alert() {
  local service=$1
  local status=$2
  local message=$3
  
  if [[ -n "$ALERT_WEBHOOK" ]]; then
    local color="good"
    if [[ "$status" != "OK" ]]; then
      color="danger"
    fi
    
    local payload='{"attachments":[{"color":"'$color'","title":"Health Check Alert: '$service'","text":"'$message'","fields":[{"title":"Environment","value":"'$ENVIRONMENT'","short":true},{"title":"Status","value":"'$status'","short":true}]}]}'
    
    curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK" > /dev/null
  fi
}

# Function to check HTTP endpoint health
check_http_endpoint() {
  local service=$1
  local url=$2
  local endpoint=${3:-"/health"}
  local expected_status=${4:-200}
  local timeout=${5:-$TIMEOUT}
  local retries=${6:-$RETRIES}
  local attempt=1
  local success=false
  local response_time=0
  local status_code=0
  local response=""
  
  log "DEBUG" "Checking $service at $url$endpoint (expecting $expected_status)"
  
  while [[ $attempt -le $retries ]] && [[ "$success" == false ]]; do
    log "DEBUG" "Attempt $attempt of $retries"
    
    # Measure response time and get status code
    local start_time=$(date +%s.%N)
    response=$(curl -s -o /dev/null -w "%{http_code}\n%{time_total}" -X GET "$url$endpoint" -m "$timeout" 2>/dev/null || echo "000\n0")
    
    # Parse response
    status_code=$(echo "$response" | head -n 1)
    response_time=$(echo "$response" | tail -n 1)
    
    if [[ "$status_code" == "$expected_status" ]]; then
      success=true
      break
    fi
    
    log "DEBUG" "Received status code $status_code, expected $expected_status"
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_health_check_status" "$([ "$success" == true ] && echo 1 || echo 0)" "service=\"$service\",endpoint=\"$endpoint\""
  record_metric "austa_health_check_response_time" "$response_time" "service=\"$service\",endpoint=\"$endpoint\""
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ $service health check passed ($response_time seconds)"
    return 0
  else
    log "ERROR" "❌ $service health check failed after $retries attempts (last status: $status_code)"
    send_alert "$service" "FAILED" "Health check failed with status code $status_code after $retries attempts"
    return 1
  fi
}

# Function to check deep health of a service
check_deep_health() {
  local service=$1
  local url=$2
  local success=true
  
  log "INFO" "Performing deep health check for $service"
  
  # Check basic health endpoint
  if ! check_http_endpoint "$service" "$url" "/health"; then
    success=false
  fi
  
  # Check readiness endpoint
  if ! check_http_endpoint "$service" "$url" "/health/ready"; then
    success=false
  fi
  
  # Check deep health endpoint
  if ! check_http_endpoint "$service" "$url" "/health/deep"; then
    # Deep health might not be implemented in all services yet
    log "WARN" "Deep health check endpoint not available for $service"
  fi
  
  # Check metrics endpoint
  if ! check_http_endpoint "$service" "$url" "/metrics" 200; then
    log "WARN" "Metrics endpoint not available for $service"
  fi
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ $service deep health check passed"
    return 0
  else
    log "ERROR" "❌ $service deep health check failed"
    return 1
  fi
}

# Function to check database connectivity
check_database() {
  local db_type=$1
  local uri=$2
  local success=false
  
  log "INFO" "Checking $db_type database connectivity"
  
  case $db_type in
    "postgres")
      # Use psql to check connectivity
      if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD=$(echo "$uri" | sed -n 's/.*:([^:]*@.*/\1/p') psql "$uri" -c "SELECT 1;" >/dev/null 2>&1; then
          success=true
        fi
      else
        # Fallback to using a PostgreSQL client container
        if kubectl run -i --rm --restart=Never postgres-check --image=postgres:13 --namespace="$NAMESPACE" -- \
          psql "$uri" -c "SELECT 1;" >/dev/null 2>&1; then
          success=true
        fi
      fi
      ;;
    "redis")
      # Use redis-cli to check connectivity
      if command -v redis-cli >/dev/null 2>&1; then
        local host=$(echo "$uri" | sed -n 's/redis:\/\/\([^:]*\).*/\1/p')
        local port=$(echo "$uri" | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
        if redis-cli -h "$host" -p "$port" PING | grep -q "PONG"; then
          success=true
        fi
      else
        # Fallback to using a Redis client container
        if kubectl run -i --rm --restart=Never redis-check --image=redis:6 --namespace="$NAMESPACE" -- \
          redis-cli -u "$uri" PING | grep -q "PONG"; then
          success=true
        fi
      fi
      ;;
    "kafka")
      # Use kafkacat to check connectivity
      if command -v kafkacat >/dev/null 2>&1; then
        if echo "test" | kafkacat -b "$uri" -t health-check -P >/dev/null 2>&1; then
          success=true
        fi
      else
        # Fallback to using a Kafka client container
        if kubectl run -i --rm --restart=Never kafka-check --image=confluentinc/cp-kafkacat --namespace="$NAMESPACE" -- \
          kafkacat -b "$uri" -L -t 5 >/dev/null 2>&1; then
          success=true
        fi
      fi
      ;;
    *)
      log "ERROR" "Unknown database type: $db_type"
      return 1
      ;;
  esac
  
  # Record metrics
  record_metric "austa_database_connectivity" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"$db_type\""
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ $db_type database connectivity check passed"
    return 0
  else
    log "ERROR" "❌ $db_type database connectivity check failed"
    send_alert "Database" "FAILED" "$db_type database connectivity check failed"
    return 1
  fi
}

# Function to check Kubernetes pod health
check_pod_health() {
  local service=$1
  local namespace=${2:-$NAMESPACE}
  local min_ready=${3:-1}
  local pods_ready=0
  local total_pods=0
  
  log "INFO" "Checking pod health for $service in namespace $namespace"
  
  # Get pod status
  local pod_status=$(kubectl get pods -n "$namespace" -l app="$service" -o json 2>/dev/null)
  if [[ $? -ne 0 ]]; then
    log "ERROR" "Failed to get pod status for $service"
    return 1
  fi
  
  # Count total and ready pods
  total_pods=$(echo "$pod_status" | jq '.items | length')
  pods_ready=$(echo "$pod_status" | jq '[.items[] | select(.status.containerStatuses[] | select(.ready==true)) | .metadata.name] | length')
  
  # Record metrics
  record_metric "austa_pod_total" "$total_pods" "service=\"$service\""
  record_metric "austa_pod_ready" "$pods_ready" "service=\"$service\""
  
  if [[ $pods_ready -ge $min_ready ]]; then
    log "INFO" "✅ $service pod health check passed ($pods_ready/$total_pods ready)"
    return 0
  else
    log "ERROR" "❌ $service pod health check failed ($pods_ready/$total_pods ready, minimum required: $min_ready)"
    send_alert "$service" "FAILED" "Pod health check failed: $pods_ready/$total_pods pods ready (minimum required: $min_ready)"
    return 1
  fi
}

# Function to check journey-specific functionality
check_journey_functionality() {
  local journey=$1
  local success=true
  
  log "INFO" "Checking $journey journey functionality"
  
  case $journey in
    "health")
      # Check health journey specific endpoints
      if ! check_http_endpoint "health-journey" "$HEALTH_SERVICE_URL" "/api/health/metrics" 200; then
        success=false
      fi
      if ! check_http_endpoint "health-journey" "$HEALTH_SERVICE_URL" "/api/health/goals" 200; then
        success=false
      fi
      ;;
    "care")
      # Check care journey specific endpoints
      if ! check_http_endpoint "care-journey" "$CARE_SERVICE_URL" "/api/care/providers" 200; then
        success=false
      fi
      if ! check_http_endpoint "care-journey" "$CARE_SERVICE_URL" "/api/care/appointments" 200; then
        success=false
      fi
      ;;
    "plan")
      # Check plan journey specific endpoints
      if ! check_http_endpoint "plan-journey" "$PLAN_SERVICE_URL" "/api/plan/benefits" 200; then
        success=false
      fi
      if ! check_http_endpoint "plan-journey" "$PLAN_SERVICE_URL" "/api/plan/coverage" 200; then
        success=false
      fi
      ;;
    *)
      log "ERROR" "Unknown journey: $journey"
      return 1
      ;;
  esac
  
  # Record metrics
  record_metric "austa_journey_functionality" "$([ "$success" == true ] && echo 1 || echo 0)" "journey=\"$journey\""
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ $journey journey functionality check passed"
    return 0
  else
    log "ERROR" "❌ $journey journey functionality check failed"
    send_alert "$journey Journey" "FAILED" "Journey functionality check failed"
    return 1
  fi
}

# Function to attempt recovery of a service
attempt_recovery() {
  local service=$1
  local namespace=${2:-$NAMESPACE}
  
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for $service (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for $service"
  
  # Check if service exists
  if ! kubectl get deployment -n "$namespace" "$service" >/dev/null 2>&1; then
    log "ERROR" "Service $service not found in namespace $namespace"
    return 1
  fi
  
  # Attempt recovery by restarting the deployment
  if kubectl rollout restart deployment -n "$namespace" "$service" >/dev/null 2>&1; then
    log "INFO" "Triggered rollout restart for $service"
    
    # Wait for rollout to complete
    if kubectl rollout status deployment -n "$namespace" "$service" --timeout=300s >/dev/null 2>&1; then
      log "INFO" "✅ $service recovery successful"
      send_alert "$service" "RECOVERED" "Service was automatically recovered via deployment restart"
      return 0
    else
      log "ERROR" "❌ $service recovery failed - rollout did not complete in time"
      send_alert "$service" "RECOVERY FAILED" "Automatic recovery attempt failed - rollout did not complete in time"
      return 1
    fi
  else
    log "ERROR" "❌ $service recovery failed - could not restart deployment"
    send_alert "$service" "RECOVERY FAILED" "Automatic recovery attempt failed - could not restart deployment"
    return 1
  fi
}

# Function to export metrics to Prometheus
export_metrics_to_prometheus() {
  if [[ "$OUTPUT_METRICS" == true ]] && [[ -f "$METRICS_FILE" ]]; then
    log "INFO" "Exporting metrics to Prometheus"
    
    # Add timestamp to metrics
    local timestamp=$(date +%s%3N)
    sed -i "s/$/\t$timestamp/" "$METRICS_FILE"
    
    # Check if node_exporter textfile directory exists
    local textfile_dir="/var/lib/node_exporter/textfile"
    if [[ -d "$textfile_dir" ]]; then
      cp "$METRICS_FILE" "$textfile_dir/austa_health.prom"
      log "INFO" "Metrics exported to node_exporter textfile directory"
    else
      log "WARN" "node_exporter textfile directory not found, metrics not exported"
    fi
    
    # Output metrics to stdout if verbose
    if [[ "$VERBOSE" == true ]]; then
      log "DEBUG" "Metrics output:"
      cat "$METRICS_FILE"
    fi
  fi
}

# =========================================================================
# Main Functions
# =========================================================================

# Check all services
check_all_services() {
  local all_success=true
  
  log "INFO" "Starting comprehensive health check for all services"
  
  # Initialize metrics file
  if [[ "$OUTPUT_METRICS" == true ]]; then
    echo "# HELP austa_health_check_status Health check status (1=success, 0=failure)" > "$METRICS_FILE"
    echo "# TYPE austa_health_check_status gauge" >> "$METRICS_FILE"
    echo "# HELP austa_health_check_response_time Health check response time in seconds" >> "$METRICS_FILE"
    echo "# TYPE austa_health_check_response_time gauge" >> "$METRICS_FILE"
    echo "# HELP austa_pod_total Total number of pods for a service" >> "$METRICS_FILE"
    echo "# TYPE austa_pod_total gauge" >> "$METRICS_FILE"
    echo "# HELP austa_pod_ready Number of ready pods for a service" >> "$METRICS_FILE"
    echo "# TYPE austa_pod_ready gauge" >> "$METRICS_FILE"
    echo "# HELP austa_database_connectivity Database connectivity status (1=success, 0=failure)" >> "$METRICS_FILE"
    echo "# TYPE austa_database_connectivity gauge" >> "$METRICS_FILE"
    echo "# HELP austa_journey_functionality Journey functionality status (1=success, 0=failure)" >> "$METRICS_FILE"
    echo "# TYPE austa_journey_functionality gauge" >> "$METRICS_FILE"
  fi
  
  # Check API Gateway
  if [[ -z "$SPECIFIC_SERVICE" ]] || [[ "$SPECIFIC_SERVICE" == "api-gateway" ]]; then
    if ! check_deep_health "api-gateway" "$API_GATEWAY_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "api-gateway"
      fi
    fi
    check_pod_health "api-gateway"
  fi
  
  # Check Auth Service
  if [[ -z "$SPECIFIC_SERVICE" ]] || [[ "$SPECIFIC_SERVICE" == "auth-service" ]]; then
    if ! check_deep_health "auth-service" "$AUTH_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "auth-service"
      fi
    fi
    check_pod_health "auth-service"
  fi
  
  # Check Health Journey Service
  if [[ -z "$SPECIFIC_SERVICE" ]] && [[ -z "$SPECIFIC_JOURNEY" || "$SPECIFIC_JOURNEY" == "health" ]]; then
    if ! check_deep_health "health-journey" "$HEALTH_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "health-journey"
      fi
    fi
    check_pod_health "health-journey"
    check_journey_functionality "health"
  fi
  
  # Check Care Journey Service
  if [[ -z "$SPECIFIC_SERVICE" ]] && [[ -z "$SPECIFIC_JOURNEY" || "$SPECIFIC_JOURNEY" == "care" ]]; then
    if ! check_deep_health "care-journey" "$CARE_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "care-journey"
      fi
    fi
    check_pod_health "care-journey"
    check_journey_functionality "care"
  fi
  
  # Check Plan Journey Service
  if [[ -z "$SPECIFIC_SERVICE" ]] && [[ -z "$SPECIFIC_JOURNEY" || "$SPECIFIC_JOURNEY" == "plan" ]]; then
    if ! check_deep_health "plan-journey" "$PLAN_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "plan-journey"
      fi
    fi
    check_pod_health "plan-journey"
    check_journey_functionality "plan"
  fi
  
  # Check Gamification Engine
  if [[ -z "$SPECIFIC_SERVICE" ]] || [[ "$SPECIFIC_SERVICE" == "gamification-engine" ]]; then
    if ! check_deep_health "gamification-engine" "$GAMIFICATION_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "gamification-engine"
      fi
    fi
    check_pod_health "gamification-engine"
  fi
  
  # Check Notification Service
  if [[ -z "$SPECIFIC_SERVICE" ]] || [[ "$SPECIFIC_SERVICE" == "notification-service" ]]; then
    if ! check_deep_health "notification-service" "$NOTIFICATION_SERVICE_URL"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_recovery "notification-service"
      fi
    fi
    check_pod_health "notification-service"
  fi
  
  # Check databases
  if [[ -z "$SPECIFIC_SERVICE" ]]; then
    if ! check_database "postgres" "$POSTGRES_URI"; then
      all_success=false
    fi
    
    if ! check_database "redis" "$REDIS_URI"; then
      all_success=false
    fi
    
    if ! check_database "kafka" "$KAFKA_BROKERS"; then
      all_success=false
    fi
  fi
  
  # Export metrics to Prometheus
  export_metrics_to_prometheus
  
  if [[ "$all_success" == true ]]; then
    log "INFO" "✅ All health checks passed"
    return 0
  else
    log "ERROR" "❌ One or more health checks failed"
    return 1
  fi
}

# =========================================================================
# Main Script
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -s|--service)
      SPECIFIC_SERVICE="$2"
      shift 2
      ;;
    -j|--journey)
      SPECIFIC_JOURNEY="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -q|--quiet)
      QUIET=true
      shift
      ;;
    -m|--metrics)
      OUTPUT_METRICS=true
      shift
      ;;
    -r|--recover)
      ATTEMPT_RECOVERY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

# Validate arguments
if [[ "$VERBOSE" == true ]] && [[ "$QUIET" == true ]]; then
  log "ERROR" "Cannot specify both --verbose and --quiet"
  exit 2
fi

if [[ -n "$SPECIFIC_SERVICE" ]] && [[ -n "$SPECIFIC_JOURNEY" ]]; then
  log "ERROR" "Cannot specify both --service and --journey"
  exit 2
fi

# Detect environment
detect_environment

# Run health checks
log "INFO" "Starting health checks in $ENVIRONMENT environment"
check_all_services
EXIT_CODE=$?

log "INFO" "Health check completed with exit code $EXIT_CODE"
exit $EXIT_CODE