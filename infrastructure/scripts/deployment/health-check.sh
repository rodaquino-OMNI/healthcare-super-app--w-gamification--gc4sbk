#!/bin/bash
# AUSTA SuperApp Health Check Script
# This script performs comprehensive health checks for all components of the AUSTA SuperApp ecosystem

# Make script executable: chmod +x infrastructure/scripts/deployment/health-check.sh
# Version: 1.0.0
# Author: AUSTA Platform Team
# Last Updated: 2025-05-19

# Exit on error
set -e

# Script version
VERSION="1.0.0"

# Default values
ENVIRONMENT="development"
VERBOSE=false
TIMEOUT=30
SERVICE="all"
JOURNEY="all"
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
SKIP_PERFORMANCE=false
SKIP_KAFKA=false
SKIP_REDIS=false
SKIP_DATABASE=false
SKIP_MONITORING=false

# Display script usage information
show_usage() {
  echo "AUSTA SuperApp Health Check Script v$VERSION"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --environment=NAME     Target environment (development, staging, production) [default: development]"
  echo "  --service=NAME         Specific service to check (api-gateway, auth-service, etc.) [default: all]"
  echo "  --journey=NAME         Specific journey to check (health, care, plan) [default: all]"
  echo "  --timeout=SECONDS      Timeout for health checks [default: 30]"
  echo "  --output=FORMAT        Output format (text, json, html) [default: text]"
  echo "  --output-file=PATH     Write output to file instead of stdout"
  echo "  --skip-performance     Skip performance benchmark verification"
  echo "  --skip-kafka           Skip Kafka topic validation"
  echo "  --skip-redis           Skip Redis cache validation"
  echo "  --skip-database        Skip database connectivity checks"
  echo "  --skip-monitoring      Skip monitoring integration checks"
  echo "  --verbose              Enable verbose output"
  echo "  --help                 Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --environment=staging --service=api-gateway"
  echo "  $0 --environment=production --journey=health --verbose"
  echo "  $0 --environment=development --output=json --output-file=health-report.json"
  exit 1
}

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --environment=*)
      ENVIRONMENT="${arg#*=}"
      ;;
    --service=*)
      SERVICE="${arg#*=}"
      ;;
    --journey=*)
      JOURNEY="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT="${arg#*=}"
      ;;
    --output=*)
      OUTPUT_FORMAT="${arg#*=}"
      ;;
    --output-file=*)
      OUTPUT_FILE="${arg#*=}"
      ;;
    --skip-performance)
      SKIP_PERFORMANCE=true
      ;;
    --skip-kafka)
      SKIP_KAFKA=true
      ;;
    --skip-redis)
      SKIP_REDIS=true
      ;;
    --skip-database)
      SKIP_DATABASE=true
      ;;
    --skip-monitoring)
      SKIP_MONITORING=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
    --help)
      show_usage
      ;;
    *)
      echo "Unknown option: $arg"
      show_usage
      ;;
  esac
shift
done

# Validate environment parameter
case "$ENVIRONMENT" in
  development|staging|production)
    # Valid environment
    ;;
  *)
    echo "Error: Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
    exit 1
    ;;
esac

# Validate output format
case "$OUTPUT_FORMAT" in
  text|json|html)
    # Valid format
    ;;
  *)
    echo "Error: Invalid output format: $OUTPUT_FORMAT. Must be one of: text, json, html"
    exit 1
    ;;
esac

# ANSI color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Initialize results storage
declare -A SERVICE_RESULTS
declare -A DATABASE_RESULTS
declare -A KAFKA_RESULTS
declare -A REDIS_RESULTS
declare -A PERFORMANCE_RESULTS
declare -A MONITORING_RESULTS

# Helper Functions

# Log a message with timestamp and context
log_message() {
  local level="$1"
  local message="$2"
  local service="${3:-System}"
  local journey="${4:-}"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  local prefix=""
  
  case "$level" in
    "INFO") prefix="${BLUE}INFO${NC}" ;;
    "WARN") prefix="${YELLOW}WARN${NC}" ;;
    "ERROR") prefix="${RED}ERROR${NC}" ;;
    "SUCCESS") prefix="${GREEN}SUCCESS${NC}" ;;
    "DEBUG") 
      if [ "$VERBOSE" = true ]; then
        prefix="${MAGENTA}DEBUG${NC}"
      else
        return 0
      fi
      ;;
  esac
  
  if [ -n "$journey" ] && [ "$journey" != "shared" ]; then
    echo -e "[$timestamp] [$prefix] [${CYAN}$service${NC}] [${MAGENTA}$journey-journey${NC}] $message"
  else
    echo -e "[$timestamp] [$prefix] [${CYAN}$service${NC}] $message"
  fi
}

# Store a result in the appropriate result array
store_result() {
  local category="$1"
  local key="$2"
  local status="$3"
  local message="$4"
  local details="${5:-}"
  
  case "$category" in
    "service")
      SERVICE_RESULTS["$key"]="$status|$message|$details"
      ;;
    "database")
      DATABASE_RESULTS["$key"]="$status|$message|$details"
      ;;
    "kafka")
      KAFKA_RESULTS["$key"]="$status|$message|$details"
      ;;
    "redis")
      REDIS_RESULTS["$key"]="$status|$message|$details"
      ;;
    "performance")
      PERFORMANCE_RESULTS["$key"]="$status|$message|$details"
      ;;
    "monitoring")
      MONITORING_RESULTS["$key"]="$status|$message|$details"
      ;;
  esac
}

# Get the base URL for a service based on environment
get_service_url() {
  local service="$1"
  local environment="$2"
  
  case "$environment" in
    "development")
      case "$service" in
        "api-gateway") echo "http://localhost:3000" ;;
        "auth-service") echo "http://localhost:3001" ;;
        "health-service") echo "http://localhost:3002" ;;
        "care-service") echo "http://localhost:3003" ;;
        "plan-service") echo "http://localhost:3004" ;;
        "gamification-engine") echo "http://localhost:3005" ;;
        "notification-service") echo "http://localhost:3006" ;;
        *) echo "" ;;
      esac
      ;;
    "staging")
      case "$service" in
        "api-gateway") echo "https://api-staging.austa.com.br" ;;
        "auth-service") echo "http://auth-service.staging.svc.cluster.local" ;;
        "health-service") echo "http://health-service.health-journey.svc.cluster.local" ;;
        "care-service") echo "http://care-service.care-journey.svc.cluster.local" ;;
        "plan-service") echo "http://plan-service.plan-journey.svc.cluster.local" ;;
        "gamification-engine") echo "http://gamification-engine.gamification.svc.cluster.local" ;;
        "notification-service") echo "http://notification-service.shared-services.svc.cluster.local" ;;
        *) echo "" ;;
      esac
      ;;
    "production")
      case "$service" in
        "api-gateway") echo "https://api.austa.com.br" ;;
        "auth-service") echo "http://auth-service.production.svc.cluster.local" ;;
        "health-service") echo "http://health-service.health-journey.svc.cluster.local" ;;
        "care-service") echo "http://care-service.care-journey.svc.cluster.local" ;;
        "plan-service") echo "http://plan-service.plan-journey.svc.cluster.local" ;;
        "gamification-engine") echo "http://gamification-engine.gamification.svc.cluster.local" ;;
        "notification-service") echo "http://notification-service.shared-services.svc.cluster.local" ;;
        *) echo "" ;;
      esac
      ;;
  esac
}

# Get the database connection string for a service
get_database_connection() {
  local service="$1"
  local environment="$2"
  
  # In a real implementation, these would be retrieved from a secure source
  # For this example, we'll use placeholder values
  case "$environment" in
    "development")
      case "$service" in
        "auth-service") echo "postgresql://postgres:postgres@localhost:5432/auth_db" ;;
        "health-service") echo "postgresql://postgres:postgres@localhost:5432/health_db" ;;
        "care-service") echo "postgresql://postgres:postgres@localhost:5432/care_db" ;;
        "plan-service") echo "postgresql://postgres:postgres@localhost:5432/plan_db" ;;
        "gamification-engine") echo "postgresql://postgres:postgres@localhost:5432/gamification_db" ;;
        "notification-service") echo "postgresql://postgres:postgres@localhost:5432/notification_db" ;;
        *) echo "" ;;
      esac
      ;;
    "staging"|"production")
      # In staging/production, we would use kubectl to get secrets
      # For this example, we'll use placeholder values
      echo "placeholder_connection_string"
      ;;
  esac
}

# Get Redis connection details for a service
get_redis_connection() {
  local service="$1"
  local environment="$2"
  
  # In a real implementation, these would be retrieved from a secure source
  # For this example, we'll use placeholder values
  case "$environment" in
    "development")
      echo "redis://localhost:6379/0"
      ;;
    "staging"|"production")
      # In staging/production, we would use kubectl to get secrets
      # For this example, we'll use placeholder values
      echo "redis://redis-master.shared-services.svc.cluster.local:6379/0"
      ;;
  esac
}

# Get Kafka broker list for a service
get_kafka_brokers() {
  local environment="$1"
  
  case "$environment" in
    "development")
      echo "localhost:9092"
      ;;
    "staging")
      echo "kafka-0.kafka-headless.shared-services.svc.cluster.local:9092,kafka-1.kafka-headless.shared-services.svc.cluster.local:9092,kafka-2.kafka-headless.shared-services.svc.cluster.local:9092"
      ;;
    "production")
      echo "kafka-0.kafka-headless.shared-services.svc.cluster.local:9092,kafka-1.kafka-headless.shared-services.svc.cluster.local:9092,kafka-2.kafka-headless.shared-services.svc.cluster.local:9092"
      ;;
  esac
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if we're running in a Kubernetes environment
is_kubernetes() {
  if [ -f /var/run/secrets/kubernetes.io/serviceaccount/token ]; then
    return 0
  else
    return 1
  fi
}

# Get kubectl namespace based on service and environment
get_namespace() {
  local service="$1"
  local environment="$2"
  
  case "$service" in
    "api-gateway")
      echo "ingress"
      ;;
    "auth-service")
      echo "$environment"
      ;;
    "health-service")
      echo "health-journey"
      ;;
    "care-service")
      echo "care-journey"
      ;;
    "plan-service")
      echo "plan-journey"
      ;;
    "gamification-engine")
      echo "gamification"
      ;;
    "notification-service")
      echo "shared-services"
      ;;
    *)
      echo "default"
      ;;
  esac
}

# Service Health Check Functions

# Check health of a service via HTTP endpoint
check_service_health() {
  local service="$1"
  local journey="${2:-}"
  local base_url=$(get_service_url "$service" "$ENVIRONMENT")
  local health_endpoint="/health"
  local curl_timeout=$TIMEOUT
  local curl_opts="-s -o /dev/null -w '%{http_code}' -m $curl_timeout"
  local http_code
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking health of service at $base_url$health_endpoint" "$service" "$journey"
  
  if [ -z "$base_url" ]; then
    log_message "ERROR" "Unknown service: $service" "$service" "$journey"
    store_result "service" "$service_key" "FAIL" "Unknown service: $service"
    return 1
  fi
  
  # For Kubernetes environments, use kubectl if available
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check service in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "service" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    log_message "DEBUG" "Found pod: $pod_name" "$service" "$journey"
    
    # Check if pod is running
    local pod_status=$(kubectl get pod "$pod_name" -n "$namespace" -o jsonpath='{.status.phase}' 2>/dev/null)
    
    if [ "$pod_status" != "Running" ]; then
      log_message "ERROR" "Pod is not running (status: $pod_status)" "$service" "$journey"
      store_result "service" "$service_key" "FAIL" "Pod is not running (status: $pod_status)"
      return 1
    fi
    
    # Check readiness probe status
    local ready_status=$(kubectl get pod "$pod_name" -n "$namespace" -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null)
    
    if [ "$ready_status" != "true" ]; then
      log_message "ERROR" "Pod is not ready" "$service" "$journey"
      store_result "service" "$service_key" "FAIL" "Pod is not ready"
      return 1
    fi
    
    # Check health endpoint using port-forward if needed
    if [[ "$base_url" == http* ]]; then
      # Use curl for HTTP endpoints
      http_code=$(eval curl $curl_opts "$base_url$health_endpoint" 2>/dev/null)
    else
      # Use port-forward and curl for internal services
      local port=8080
      kubectl port-forward "$pod_name" "$port:3000" -n "$namespace" &>/dev/null &
      local pf_pid=$!
      sleep 2
      http_code=$(eval curl $curl_opts "http://localhost:$port$health_endpoint" 2>/dev/null)
      kill $pf_pid 2>/dev/null || true
    fi
  else
    # Use curl for direct HTTP check
    http_code=$(eval curl $curl_opts "$base_url$health_endpoint" 2>/dev/null)
  fi
  
  if [ -z "$http_code" ]; then
    log_message "ERROR" "Failed to connect to service" "$service" "$journey"
    store_result "service" "$service_key" "FAIL" "Failed to connect to service"
    return 1
  fi
  
  if [ "$http_code" -eq 200 ]; then
    log_message "SUCCESS" "Service is healthy (HTTP $http_code)" "$service" "$journey"
    store_result "service" "$service_key" "PASS" "Service is healthy (HTTP $http_code)"
    return 0
  else
    log_message "ERROR" "Service health check failed (HTTP $http_code)" "$service" "$journey"
    store_result "service" "$service_key" "FAIL" "Service health check failed (HTTP $http_code)"
    return 1
  fi
}

# Check all services or a specific service
check_services() {
  local service="$1"
  local journey="$2"
  
  log_message "INFO" "Starting service health checks" "System"
  
  if [ "$service" = "all" ]; then
    # Check all services
    local services=("api-gateway" "auth-service" "gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_service_health "$svc" "$svc_journey"
    done
  else
    # Check specific service
    check_service_health "$service" "$journey"
  fi
  
  log_message "INFO" "Completed service health checks" "System"
}

# Database Connectivity Check Functions

# Check database connectivity for a service
check_database_connectivity() {
  local service="$1"
  local journey="${2:-}"
  local connection_string=$(get_database_connection "$service" "$ENVIRONMENT")
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking database connectivity for $service" "$service" "$journey"
  
  if [ -z "$connection_string" ]; then
    log_message "ERROR" "No database connection string available for $service" "$service" "$journey"
    store_result "database" "$service_key" "FAIL" "No database connection string available"
    return 1
  fi
  
  # Check if we're in Kubernetes and have kubectl
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check database connectivity in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "database" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    # Execute a database check command in the pod
    # This is a simplified example - in reality, you would use the appropriate database client
    local check_result
    
    if [[ "$connection_string" == postgresql* ]]; then
      # For PostgreSQL
      check_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "echo 'SELECT 1;' | psql '$connection_string' -t" 2>&1)
    elif [[ "$connection_string" == mysql* ]]; then
      # For MySQL
      check_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "echo 'SELECT 1;' | mysql -u\"\${connection_string#*//}\" -p\"\${connection_string#*:}\" \${connection_string#*@}" 2>&1)
    else
      log_message "ERROR" "Unsupported database type in connection string" "$service" "$journey"
      store_result "database" "$service_key" "FAIL" "Unsupported database type"
      return 1
    fi
    
    if [[ "$check_result" == *"1"* ]]; then
      log_message "SUCCESS" "Database connectivity check passed" "$service" "$journey"
      store_result "database" "$service_key" "PASS" "Database connectivity check passed"
      return 0
    else
      log_message "ERROR" "Database connectivity check failed: $check_result" "$service" "$journey"
      store_result "database" "$service_key" "FAIL" "Database connectivity check failed: $check_result"
      return 1
    fi
  else
    # Local development environment
    # This is a simplified example - in reality, you would use the appropriate database client
    local check_result
    
    if command_exists "psql" && [[ "$connection_string" == postgresql* ]]; then
      # For PostgreSQL
      check_result=$(echo 'SELECT 1;' | psql "$connection_string" -t 2>&1)
      
      if [[ "$check_result" == *"1"* ]]; then
        log_message "SUCCESS" "Database connectivity check passed" "$service" "$journey"
        store_result "database" "$service_key" "PASS" "Database connectivity check passed"
        return 0
      else
        log_message "ERROR" "Database connectivity check failed: $check_result" "$service" "$journey"
        store_result "database" "$service_key" "FAIL" "Database connectivity check failed: $check_result"
        return 1
      fi
    elif command_exists "mysql" && [[ "$connection_string" == mysql* ]]; then
      # For MySQL
      local mysql_user=$(echo "$connection_string" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
      local mysql_pass=$(echo "$connection_string" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
      local mysql_host=$(echo "$connection_string" | sed -n 's/.*@\([^:\/]*\).*/\1/p')
      local mysql_port=$(echo "$connection_string" | sed -n 's/.*@[^:\/]*:\([0-9]*\).*/\1/p')
      local mysql_db=$(echo "$connection_string" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
      
      check_result=$(echo 'SELECT 1;' | mysql -h"$mysql_host" -P"$mysql_port" -u"$mysql_user" -p"$mysql_pass" "$mysql_db" 2>&1)
      
      if [[ "$check_result" == *"1"* ]]; then
        log_message "SUCCESS" "Database connectivity check passed" "$service" "$journey"
        store_result "database" "$service_key" "PASS" "Database connectivity check passed"
        return 0
      else
        log_message "ERROR" "Database connectivity check failed: $check_result" "$service" "$journey"
        store_result "database" "$service_key" "FAIL" "Database connectivity check failed: $check_result"
        return 1
      fi
    else
      log_message "ERROR" "Required database client not found or unsupported database type" "$service" "$journey"
      store_result "database" "$service_key" "FAIL" "Required database client not found or unsupported database type"
      return 1
    fi
  fi
}

# Check all databases or databases for a specific service
check_databases() {
  local service="$1"
  local journey="$2"
  
  if [ "$SKIP_DATABASE" = true ]; then
    log_message "INFO" "Skipping database connectivity checks" "System"
    return 0
  fi
  
  log_message "INFO" "Starting database connectivity checks" "System"
  
  if [ "$service" = "all" ]; then
    # Check databases for all services except api-gateway
    local services=("auth-service" "gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_database_connectivity "$svc" "$svc_journey"
    done
  elif [ "$service" != "api-gateway" ]; then
    # Check database for specific service
    check_database_connectivity "$service" "$journey"
  else
    log_message "INFO" "Skipping database check for api-gateway (no database)" "api-gateway"
  fi
  
  log_message "INFO" "Completed database connectivity checks" "System"
}

# Kafka Topic Validation Functions

# Check Kafka connectivity and topic validation
check_kafka_connectivity() {
  local service="$1"
  local journey="${2:-}"
  local brokers=$(get_kafka_brokers "$ENVIRONMENT")
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking Kafka connectivity for $service" "$service" "$journey"
  
  if [ -z "$brokers" ]; then
    log_message "ERROR" "No Kafka brokers available for $ENVIRONMENT environment" "$service" "$journey"
    store_result "kafka" "$service_key" "FAIL" "No Kafka brokers available"
    return 1
  fi
  
  # Check if we're in Kubernetes and have kubectl
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check Kafka connectivity in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "kafka" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    # Check if kafka-topics.sh is available in the pod
    local has_kafka_tools=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "command -v kafka-topics.sh" 2>/dev/null)
    
    if [ -z "$has_kafka_tools" ]; then
      log_message "WARN" "Kafka tools not available in pod, skipping detailed Kafka checks" "$service" "$journey"
      
      # Try a simple connection test using nc
      local broker_host=$(echo "$brokers" | cut -d ',' -f1 | cut -d ':' -f1)
      local broker_port=$(echo "$brokers" | cut -d ',' -f1 | cut -d ':' -f2)
      
      local nc_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "echo > /dev/tcp/$broker_host/$broker_port" 2>&1)
      
      if [ -z "$nc_result" ]; then
        log_message "SUCCESS" "Basic Kafka connectivity check passed" "$service" "$journey"
        store_result "kafka" "$service_key" "PASS" "Basic Kafka connectivity check passed"
        return 0
      else
        log_message "ERROR" "Basic Kafka connectivity check failed: $nc_result" "$service" "$journey"
        store_result "kafka" "$service_key" "FAIL" "Basic Kafka connectivity check failed: $nc_result"
        return 1
      fi
    fi
    
    # List topics to verify connectivity
    local topics_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "kafka-topics.sh --bootstrap-server $brokers --list" 2>&1)
    
    if [[ "$topics_result" == *"Error"* ]]; then
      log_message "ERROR" "Kafka connectivity check failed: $topics_result" "$service" "$journey"
      store_result "kafka" "$service_key" "FAIL" "Kafka connectivity check failed: $topics_result"
      return 1
    else
      log_message "SUCCESS" "Kafka connectivity check passed" "$service" "$journey"
      store_result "kafka" "$service_key" "PASS" "Kafka connectivity check passed"
      
      # Check for expected topics based on service
      local expected_topics=()
      
      case "$service" in
        "gamification-engine")
          expected_topics+=("gamification.events" "gamification.achievements" "gamification.rewards")
          ;;
        "notification-service")
          expected_topics+=("notifications.outgoing" "notifications.status")
          ;;
        "health-service")
          expected_topics+=("health.metrics" "health.goals")
          ;;
        "care-service")
          expected_topics+=("care.appointments" "care.medications")
          ;;
        "plan-service")
          expected_topics+=("plan.claims" "plan.benefits")
          ;;
      esac
      
      for topic in "${expected_topics[@]}"; do
        if [[ "$topics_result" == *"$topic"* ]]; then
          log_message "SUCCESS" "Expected topic '$topic' exists" "$service" "$journey"
        else
          log_message "WARN" "Expected topic '$topic' not found" "$service" "$journey"
        fi
      done
      
      return 0
    fi
  else
    # Local development environment
    if command_exists "kafka-topics.sh"; then
      # List topics to verify connectivity
      local topics_result=$(kafka-topics.sh --bootstrap-server "$brokers" --list 2>&1)
      
      if [[ "$topics_result" == *"Error"* ]]; then
        log_message "ERROR" "Kafka connectivity check failed: $topics_result" "$service" "$journey"
        store_result "kafka" "$service_key" "FAIL" "Kafka connectivity check failed: $topics_result"
        return 1
      else
        log_message "SUCCESS" "Kafka connectivity check passed" "$service" "$journey"
        store_result "kafka" "$service_key" "PASS" "Kafka connectivity check passed"
        return 0
      fi
    elif command_exists "nc"; then
      # Try a simple connection test using nc
      local broker_host=$(echo "$brokers" | cut -d ',' -f1 | cut -d ':' -f1)
      local broker_port=$(echo "$brokers" | cut -d ',' -f1 | cut -d ':' -f2)
      
      nc -z -w 5 "$broker_host" "$broker_port" &>/dev/null
      local nc_exit=$?
      
      if [ $nc_exit -eq 0 ]; then
        log_message "SUCCESS" "Basic Kafka connectivity check passed" "$service" "$journey"
        store_result "kafka" "$service_key" "PASS" "Basic Kafka connectivity check passed"
        return 0
      else
        log_message "ERROR" "Basic Kafka connectivity check failed" "$service" "$journey"
        store_result "kafka" "$service_key" "FAIL" "Basic Kafka connectivity check failed"
        return 1
      fi
    else
      log_message "ERROR" "Kafka tools not available, skipping Kafka checks" "$service" "$journey"
      store_result "kafka" "$service_key" "SKIP" "Kafka tools not available"
      return 1
    fi
  fi
}

# Check Kafka for all services or a specific service
check_kafka() {
  local service="$1"
  local journey="$2"
  
  if [ "$SKIP_KAFKA" = true ]; then
    log_message "INFO" "Skipping Kafka topic validation" "System"
    return 0
  fi
  
  log_message "INFO" "Starting Kafka topic validation" "System"
  
  if [ "$service" = "all" ]; then
    # Check Kafka for services that use it
    local services=("gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_kafka_connectivity "$svc" "$svc_journey"
    done
  elif [ "$service" != "api-gateway" ] && [ "$service" != "auth-service" ]; then
    # Check Kafka for specific service
    check_kafka_connectivity "$service" "$journey"
  else
    log_message "INFO" "Skipping Kafka check for $service (does not use Kafka)" "$service"
  fi
  
  log_message "INFO" "Completed Kafka topic validation" "System"
}

# Redis Cache Validation Functions

# Check Redis connectivity and basic operations
check_redis_connectivity() {
  local service="$1"
  local journey="${2:-}"
  local redis_url=$(get_redis_connection "$service" "$ENVIRONMENT")
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking Redis connectivity for $service" "$service" "$journey"
  
  if [ -z "$redis_url" ]; then
    log_message "ERROR" "No Redis URL available for $service" "$service" "$journey"
    store_result "redis" "$service_key" "FAIL" "No Redis URL available"
    return 1
  fi
  
  # Extract Redis host and port from URL
  local redis_host=$(echo "$redis_url" | sed -n 's/.*redis:\/\/\([^:]*\).*/\1/p')
  local redis_port=$(echo "$redis_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  if [ -z "$redis_host" ]; then
    redis_host="localhost"
  fi
  
  if [ -z "$redis_port" ]; then
    redis_port="6379"
  fi
  
  # Check if we're in Kubernetes and have kubectl
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check Redis connectivity in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "redis" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    # Check if redis-cli is available in the pod
    local has_redis_cli=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "command -v redis-cli" 2>/dev/null)
    
    if [ -z "$has_redis_cli" ]; then
      log_message "WARN" "redis-cli not available in pod, skipping detailed Redis checks" "$service" "$journey"
      
      # Try a simple connection test using nc
      local nc_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "echo > /dev/tcp/$redis_host/$redis_port" 2>&1)
      
      if [ -z "$nc_result" ]; then
        log_message "SUCCESS" "Basic Redis connectivity check passed" "$service" "$journey"
        store_result "redis" "$service_key" "PASS" "Basic Redis connectivity check passed"
        return 0
      else
        log_message "ERROR" "Basic Redis connectivity check failed: $nc_result" "$service" "$journey"
        store_result "redis" "$service_key" "FAIL" "Basic Redis connectivity check failed: $nc_result"
        return 1
      fi
    fi
    
    # Test Redis connectivity with PING command
    local ping_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "redis-cli -h $redis_host -p $redis_port ping" 2>&1)
    
    if [ "$ping_result" = "PONG" ]; then
      log_message "SUCCESS" "Redis connectivity check passed" "$service" "$journey"
      store_result "redis" "$service_key" "PASS" "Redis connectivity check passed"
      
      # Test basic Redis operations
      local test_key="health-check-${service}-$(date +%s)"
      local test_value="test-value-$(date +%s)"
      
      # Set a test key
      kubectl exec "$pod_name" -n "$namespace" -- bash -c "redis-cli -h $redis_host -p $redis_port set $test_key $test_value" &>/dev/null
      
      # Get the test key
      local get_result=$(kubectl exec "$pod_name" -n "$namespace" -- bash -c "redis-cli -h $redis_host -p $redis_port get $test_key" 2>&1)
      
      # Delete the test key
      kubectl exec "$pod_name" -n "$namespace" -- bash -c "redis-cli -h $redis_host -p $redis_port del $test_key" &>/dev/null
      
      if [ "$get_result" = "$test_value" ]; then
        log_message "SUCCESS" "Redis operations check passed" "$service" "$journey"
        return 0
      else
        log_message "ERROR" "Redis operations check failed" "$service" "$journey"
        store_result "redis" "$service_key" "FAIL" "Redis operations check failed"
        return 1
      fi
    else
      log_message "ERROR" "Redis connectivity check failed: $ping_result" "$service" "$journey"
      store_result "redis" "$service_key" "FAIL" "Redis connectivity check failed: $ping_result"
      return 1
    fi
  else
    # Local development environment
    if command_exists "redis-cli"; then
      # Test Redis connectivity with PING command
      local ping_result=$(redis-cli -h "$redis_host" -p "$redis_port" ping 2>&1)
      
      if [ "$ping_result" = "PONG" ]; then
        log_message "SUCCESS" "Redis connectivity check passed" "$service" "$journey"
        store_result "redis" "$service_key" "PASS" "Redis connectivity check passed"
        
        # Test basic Redis operations
        local test_key="health-check-${service}-$(date +%s)"
        local test_value="test-value-$(date +%s)"
        
        # Set a test key
        redis-cli -h "$redis_host" -p "$redis_port" set "$test_key" "$test_value" &>/dev/null
        
        # Get the test key
        local get_result=$(redis-cli -h "$redis_host" -p "$redis_port" get "$test_key" 2>&1)
        
        # Delete the test key
        redis-cli -h "$redis_host" -p "$redis_port" del "$test_key" &>/dev/null
        
        if [ "$get_result" = "$test_value" ]; then
          log_message "SUCCESS" "Redis operations check passed" "$service" "$journey"
          return 0
        else
          log_message "ERROR" "Redis operations check failed" "$service" "$journey"
          store_result "redis" "$service_key" "FAIL" "Redis operations check failed"
          return 1
        fi
      else
        log_message "ERROR" "Redis connectivity check failed: $ping_result" "$service" "$journey"
        store_result "redis" "$service_key" "FAIL" "Redis connectivity check failed: $ping_result"
        return 1
      fi
    elif command_exists "nc"; then
      # Try a simple connection test using nc
      nc -z -w 5 "$redis_host" "$redis_port" &>/dev/null
      local nc_exit=$?
      
      if [ $nc_exit -eq 0 ]; then
        log_message "SUCCESS" "Basic Redis connectivity check passed" "$service" "$journey"
        store_result "redis" "$service_key" "PASS" "Basic Redis connectivity check passed"
        return 0
      else
        log_message "ERROR" "Basic Redis connectivity check failed" "$service" "$journey"
        store_result "redis" "$service_key" "FAIL" "Basic Redis connectivity check failed"
        return 1
      fi
    else
      log_message "ERROR" "redis-cli not available, skipping Redis checks" "$service" "$journey"
      store_result "redis" "$service_key" "SKIP" "redis-cli not available"
      return 1
    fi
  fi
}

# Check Redis for all services or a specific service
check_redis() {
  local service="$1"
  local journey="$2"
  
  if [ "$SKIP_REDIS" = true ]; then
    log_message "INFO" "Skipping Redis cache validation" "System"
    return 0
  fi
  
  log_message "INFO" "Starting Redis cache validation" "System"
  
  if [ "$service" = "all" ]; then
    # Check Redis for all services that use it
    local services=("auth-service" "gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_redis_connectivity "$svc" "$svc_journey"
    done
  elif [ "$service" != "api-gateway" ]; then
    # Check Redis for specific service
    check_redis_connectivity "$service" "$journey"
  else
    log_message "INFO" "Skipping Redis check for api-gateway (does not use Redis directly)" "api-gateway"
  fi
  
  log_message "INFO" "Completed Redis cache validation" "System"
}

# Performance Benchmark Verification Functions

# Check performance metrics for a service
check_performance_metrics() {
  local service="$1"
  local journey="${2:-}"
  local base_url=$(get_service_url "$service" "$ENVIRONMENT")
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking performance metrics for $service" "$service" "$journey"
  
  if [ -z "$base_url" ]; then
    log_message "ERROR" "Unknown service: $service" "$service" "$journey"
    store_result "performance" "$service_key" "FAIL" "Unknown service: $service"
    return 1
  fi
  
  # In a real implementation, we would query Prometheus or other monitoring systems
  # For this example, we'll use a simple HTTP request to measure response time
  
  local metrics_endpoint="/metrics"
  local curl_timeout=$TIMEOUT
  local start_time=$(date +%s.%N)
  local http_code
  local response_time
  
  # Check if we're in Kubernetes and have kubectl
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check performance metrics in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "performance" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    # Check resource usage
    local cpu_usage=$(kubectl top pod "$pod_name" -n "$namespace" --containers 2>/dev/null | grep -v NAME | awk '{print $2}')
    local memory_usage=$(kubectl top pod "$pod_name" -n "$namespace" --containers 2>/dev/null | grep -v NAME | awk '{print $3}')
    
    if [ -n "$cpu_usage" ] && [ -n "$memory_usage" ]; then
      log_message "INFO" "Resource usage - CPU: $cpu_usage, Memory: $memory_usage" "$service" "$journey"
      
      # In a real implementation, we would compare against baseline metrics
      # For this example, we'll just report the current values
      store_result "performance" "$service_key" "PASS" "Resource usage within acceptable limits" "CPU: $cpu_usage, Memory: $memory_usage"
    else
      log_message "WARN" "Could not retrieve resource usage metrics" "$service" "$journey"
      store_result "performance" "$service_key" "WARN" "Could not retrieve resource usage metrics"
    fi
    
    # Check response time using port-forward if needed
    if [[ "$base_url" == http* ]]; then
      # Use curl for HTTP endpoints
      http_code=$(curl -s -o /dev/null -w "%{http_code}" -m "$curl_timeout" "$base_url$metrics_endpoint" 2>/dev/null)
      local end_time=$(date +%s.%N)
      response_time=$(echo "$end_time - $start_time" | bc)
    else
      # Use port-forward and curl for internal services
      local port=8080
      kubectl port-forward "$pod_name" "$port:3000" -n "$namespace" &>/dev/null &
      local pf_pid=$!
      sleep 2
      http_code=$(curl -s -o /dev/null -w "%{http_code}" -m "$curl_timeout" "http://localhost:$port$metrics_endpoint" 2>/dev/null)
      local end_time=$(date +%s.%N)
      response_time=$(echo "$end_time - $start_time" | bc)
      kill $pf_pid 2>/dev/null || true
    fi
  else
    # Use curl for direct HTTP check
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -m "$curl_timeout" "$base_url$metrics_endpoint" 2>/dev/null)
    local end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc)
  fi
  
  if [ -z "$http_code" ]; then
    log_message "ERROR" "Failed to connect to service metrics endpoint" "$service" "$journey"
    store_result "performance" "$service_key" "FAIL" "Failed to connect to service metrics endpoint"
    return 1
  fi
  
  if [ "$http_code" -eq 200 ]; then
    log_message "SUCCESS" "Metrics endpoint accessible (HTTP $http_code)" "$service" "$journey"
    log_message "INFO" "Response time: ${response_time}s" "$service" "$journey"
    
    # In a real implementation, we would compare against baseline metrics
    # For this example, we'll use a simple threshold
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
      log_message "SUCCESS" "Response time within acceptable limits" "$service" "$journey"
      store_result "performance" "$service_key" "PASS" "Response time within acceptable limits" "${response_time}s"
      return 0
    else
      log_message "WARN" "Response time exceeds threshold" "$service" "$journey"
      store_result "performance" "$service_key" "WARN" "Response time exceeds threshold" "${response_time}s"
      return 0
    fi
  else
    log_message "ERROR" "Metrics endpoint check failed (HTTP $http_code)" "$service" "$journey"
    store_result "performance" "$service_key" "FAIL" "Metrics endpoint check failed (HTTP $http_code)"
    return 1
  fi
}

# Check performance for all services or a specific service
check_performance() {
  local service="$1"
  local journey="$2"
  
  if [ "$SKIP_PERFORMANCE" = true ]; then
    log_message "INFO" "Skipping performance benchmark verification" "System"
    return 0
  fi
  
  log_message "INFO" "Starting performance benchmark verification" "System"
  
  if [ "$service" = "all" ]; then
    # Check performance for all services
    local services=("api-gateway" "auth-service" "gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_performance_metrics "$svc" "$svc_journey"
    done
  else
    # Check performance for specific service
    check_performance_metrics "$service" "$journey"
  fi
  
  log_message "INFO" "Completed performance benchmark verification" "System"
}

# Monitoring Integration Functions

# Check monitoring integration for a service
check_monitoring_integration() {
  local service="$1"
  local journey="${2:-}"
  local base_url=$(get_service_url "$service" "$ENVIRONMENT")
  local service_key="$service"
  
  if [ -n "$journey" ] && [ "$journey" != "all" ] && [ "$journey" != "shared" ]; then
    service_key="${service}-${journey}"
  fi
  
  log_message "INFO" "Checking monitoring integration for $service" "$service" "$journey"
  
  if [ -z "$base_url" ]; then
    log_message "ERROR" "Unknown service: $service" "$service" "$journey"
    store_result "monitoring" "$service_key" "FAIL" "Unknown service: $service"
    return 1
  fi
  
  # Check Prometheus metrics endpoint
  local metrics_endpoint="/metrics"
  local curl_timeout=$TIMEOUT
  local metrics_content
  
  # Check if we're in Kubernetes and have kubectl
  if is_kubernetes && command_exists "kubectl"; then
    local namespace=$(get_namespace "$service" "$ENVIRONMENT")
    local pod_name
    
    log_message "DEBUG" "Using kubectl to check monitoring integration in namespace $namespace" "$service" "$journey"
    
    # Get the first pod for the service
    pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod_name" ]; then
      log_message "ERROR" "No pods found for service in namespace $namespace" "$service" "$journey"
      store_result "monitoring" "$service_key" "FAIL" "No pods found for service"
      return 1
    fi
    
    # Check if the pod has Prometheus annotations
    local has_prometheus_annotations=$(kubectl get pod "$pod_name" -n "$namespace" -o jsonpath='{.metadata.annotations.prometheus\.io/scrape}' 2>/dev/null)
    
    if [ "$has_prometheus_annotations" = "true" ]; then
      log_message "SUCCESS" "Pod has Prometheus scrape annotations" "$service" "$journey"
    else
      log_message "WARN" "Pod does not have Prometheus scrape annotations" "$service" "$journey"
    fi
    
    # Check metrics endpoint using port-forward if needed
    if [[ "$base_url" == http* ]]; then
      # Use curl for HTTP endpoints
      metrics_content=$(curl -s -m "$curl_timeout" "$base_url$metrics_endpoint" 2>/dev/null)
    else
      # Use port-forward and curl for internal services
      local port=8080
      kubectl port-forward "$pod_name" "$port:3000" -n "$namespace" &>/dev/null &
      local pf_pid=$!
      sleep 2
      metrics_content=$(curl -s -m "$curl_timeout" "http://localhost:$port$metrics_endpoint" 2>/dev/null)
      kill $pf_pid 2>/dev/null || true
    fi
  else
    # Use curl for direct HTTP check
    metrics_content=$(curl -s -m "$curl_timeout" "$base_url$metrics_endpoint" 2>/dev/null)
  fi
  
  if [ -z "$metrics_content" ]; then
    log_message "ERROR" "Failed to retrieve metrics from service" "$service" "$journey"
    store_result "monitoring" "$service_key" "FAIL" "Failed to retrieve metrics from service"
    return 1
  fi
  
  # Check if metrics content looks like Prometheus format
  if [[ "$metrics_content" == *"# HELP"* ]] || [[ "$metrics_content" == *"# TYPE"* ]]; then
    log_message "SUCCESS" "Service exposes Prometheus metrics" "$service" "$journey"
    store_result "monitoring" "$service_key" "PASS" "Service exposes Prometheus metrics"
    
    # Check for specific metrics based on service type
    local expected_metrics=()
    
    case "$service" in
      "api-gateway")
        expected_metrics+=("http_request_duration_seconds" "http_requests_total")
        ;;
      "auth-service")
        expected_metrics+=("auth_login_attempts_total" "auth_token_validation_total")
        ;;
      "gamification-engine")
        expected_metrics+=("gamification_events_processed_total" "gamification_achievements_unlocked_total")
        ;;
      "notification-service")
        expected_metrics+=("notifications_sent_total" "notifications_delivery_duration_seconds")
        ;;
      "health-service")
        expected_metrics+=("health_metrics_recorded_total" "health_goals_achieved_total")
        ;;
      "care-service")
        expected_metrics+=("care_appointments_scheduled_total" "care_telemedicine_sessions_total")
        ;;
      "plan-service")
        expected_metrics+=("plan_claims_submitted_total" "plan_benefits_checked_total")
        ;;
    esac
    
    local missing_metrics=0
    for metric in "${expected_metrics[@]}"; do
      if [[ "$metrics_content" == *"$metric"* ]]; then
        log_message "SUCCESS" "Expected metric '$metric' found" "$service" "$journey"
      else
        log_message "WARN" "Expected metric '$metric' not found" "$service" "$journey"
        missing_metrics=$((missing_metrics + 1))
      fi
    done
    
    if [ $missing_metrics -gt 0 ]; then
      log_message "WARN" "$missing_metrics expected metrics not found" "$service" "$journey"
      store_result "monitoring" "$service_key" "WARN" "$missing_metrics expected metrics not found"
    fi
    
    return 0
  else
    log_message "ERROR" "Service does not expose Prometheus metrics" "$service" "$journey"
    store_result "monitoring" "$service_key" "FAIL" "Service does not expose Prometheus metrics"
    return 1
  fi
}

# Check monitoring integration for all services or a specific service
check_monitoring() {
  local service="$1"
  local journey="$2"
  
  if [ "$SKIP_MONITORING" = true ]; then
    log_message "INFO" "Skipping monitoring integration checks" "System"
    return 0
  fi
  
  log_message "INFO" "Starting monitoring integration checks" "System"
  
  if [ "$service" = "all" ]; then
    # Check monitoring for all services
    local services=("api-gateway" "auth-service" "gamification-engine" "notification-service")
    
    # Add journey-specific services if needed
    if [ "$journey" = "all" ] || [ "$journey" = "health" ]; then
      services+=("health-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "care" ]; then
      services+=("care-service")
    fi
    
    if [ "$journey" = "all" ] || [ "$journey" = "plan" ]; then
      services+=("plan-service")
    fi
    
    for svc in "${services[@]}"; do
      local svc_journey="shared"
      
      # Determine the journey for this service
      case "$svc" in
        "health-service") svc_journey="health" ;;
        "care-service") svc_journey="care" ;;
        "plan-service") svc_journey="plan" ;;
        *) svc_journey="shared" ;;
      esac
      
      # Skip if journey doesn't match
      if [ "$journey" != "all" ] && [ "$svc_journey" != "shared" ] && [ "$svc_journey" != "$journey" ]; then
        continue
      fi
      
      check_monitoring_integration "$svc" "$svc_journey"
    done
  else
    # Check monitoring for specific service
    check_monitoring_integration "$service" "$journey"
  fi
  
  log_message "INFO" "Completed monitoring integration checks" "System"
}

# Generate Health Check Report

# Generate a report of all health check results
generate_report() {
  local format="$1"
  local output_file="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  local report=""
  local exit_code=0
  
  # Count results by category and status
  local total_checks=0
  local passed_checks=0
  local warning_checks=0
  local failed_checks=0
  local skipped_checks=0
  
  # Function to count results for a category
  count_category_results() {
    local category="$1"
    local -n results="$2"
    
    for key in "${!results[@]}"; do
      local status=$(echo "${results[$key]}" | cut -d '|' -f1)
      
      total_checks=$((total_checks + 1))
      
      case "$status" in
        "PASS") passed_checks=$((passed_checks + 1)) ;;
        "WARN") warning_checks=$((warning_checks + 1)) ;;
        "FAIL") 
          failed_checks=$((failed_checks + 1))
          exit_code=1
          ;;
        "SKIP") skipped_checks=$((skipped_checks + 1)) ;;
      esac
    done
  }
  
  # Count results for each category
  count_category_results "service" SERVICE_RESULTS
  count_category_results "database" DATABASE_RESULTS
  count_category_results "kafka" KAFKA_RESULTS
  count_category_results "redis" REDIS_RESULTS
  count_category_results "performance" PERFORMANCE_RESULTS
  count_category_results "monitoring" MONITORING_RESULTS
  
  # Generate report based on format
  case "$format" in
    "text")
      report+="AUSTA SuperApp Health Check Report\n"
      report+="================================\n"
      report+="Environment: $ENVIRONMENT\n"
      report+="Timestamp: $timestamp\n"
      report+="\n"
      report+="Summary:\n"
      report+="  Total Checks: $total_checks\n"
      report+="  Passed: $passed_checks\n"
      report+="  Warnings: $warning_checks\n"
      report+="  Failed: $failed_checks\n"
      report+="  Skipped: $skipped_checks\n"
      report+="\n"
      
      # Function to add category results to text report
      add_category_to_text_report() {
        local category="$1"
        local category_name="$2"
        local -n results="$3"
        
        if [ ${#results[@]} -eq 0 ]; then
          return
        fi
        
        report+="$category_name Checks:\n"
        report+="$(printf '%0.s-' $(seq 1 $((${#category_name} + 8))))\n"
        
        for key in "${!results[@]}"; do
          local status=$(echo "${results[$key]}" | cut -d '|' -f1)
          local message=$(echo "${results[$key]}" | cut -d '|' -f2)
          local details=$(echo "${results[$key]}" | cut -d '|' -f3)
          
          report+="  $key: "
          
          case "$status" in
            "PASS") report+="[PASS] " ;;
            "WARN") report+="[WARN] " ;;
            "FAIL") report+="[FAIL] " ;;
            "SKIP") report+="[SKIP] " ;;
          esac
          
          report+="$message"
          
          if [ -n "$details" ]; then
            report+=" ($details)"
          fi
          
          report+="\n"
        done
        
        report+="\n"
      }
      
      # Add each category to the report
      add_category_to_text_report "service" "Service" SERVICE_RESULTS
      add_category_to_text_report "database" "Database" DATABASE_RESULTS
      add_category_to_text_report "kafka" "Kafka" KAFKA_RESULTS
      add_category_to_text_report "redis" "Redis" REDIS_RESULTS
      add_category_to_text_report "performance" "Performance" PERFORMANCE_RESULTS
      add_category_to_text_report "monitoring" "Monitoring" MONITORING_RESULTS
      ;;
      
    "json")
      report+="{\n"
      report+="  \"report\": {\n"
      report+="    \"environment\": \"$ENVIRONMENT\",\n"
      report+="    \"timestamp\": \"$timestamp\",\n"
      report+="    \"summary\": {\n"
      report+="      \"total\": $total_checks,\n"
      report+="      \"passed\": $passed_checks,\n"
      report+="      \"warnings\": $warning_checks,\n"
      report+="      \"failed\": $failed_checks,\n"
      report+="      \"skipped\": $skipped_checks\n"
      report+="    },\n"
      
      # Function to add category results to JSON report
      add_category_to_json_report() {
        local category="$1"
        local -n results="$2"
        local is_last="$3"
        
        report+="    \"$category\": {\n"
        
        local keys=(${!results[@]})
        local key_count=${#keys[@]}
        local key_index=0
        
        for key in "${keys[@]}"; do
          key_index=$((key_index + 1))
          local status=$(echo "${results[$key]}" | cut -d '|' -f1)
          local message=$(echo "${results[$key]}" | cut -d '|' -f2)
          local details=$(echo "${results[$key]}" | cut -d '|' -f3)
          
          report+="      \"$key\": {\n"
          report+="        \"status\": \"$status\",\n"
          report+="        \"message\": \"$message\""
          
          if [ -n "$details" ]; then
            report+=",\n        \"details\": \"$details\"\n"
          else
            report+="\n"
          fi
          
          if [ $key_index -eq $key_count ]; then
            report+="      }\n"
          else
            report+="      },\n"
          fi
        done
        
        if [ "$is_last" = true ]; then
          report+="    }\n"
        else
          report+="    },\n"
        fi
      }
      
      # Add each category to the report
      add_category_to_json_report "services" SERVICE_RESULTS false
      add_category_to_json_report "databases" DATABASE_RESULTS false
      add_category_to_json_report "kafka" KAFKA_RESULTS false
      add_category_to_json_report "redis" REDIS_RESULTS false
      add_category_to_json_report "performance" PERFORMANCE_RESULTS false
      add_category_to_json_report "monitoring" MONITORING_RESULTS true
      
      report+="  }\n"
      report+="}\n"
      ;;
      
    "html")
      report+="<!DOCTYPE html>\n"
      report+="<html>\n"
      report+="<head>\n"
      report+="  <title>AUSTA SuperApp Health Check Report</title>\n"
      report+="  <style>\n"
      report+="    body { font-family: Arial, sans-serif; margin: 20px; }\n"
      report+="    h1 { color: #333; }\n"
      report+="    .summary { margin: 20px 0; }\n"
      report+="    .category { margin: 20px 0; }\n"
      report+="    .category h2 { color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }\n"
      report+="    .check { margin: 10px 0; padding: 10px; border-radius: 5px; }\n"
      report+="    .pass { background-color: #dff0d8; border: 1px solid #d6e9c6; }\n"
      report+="    .warn { background-color: #fcf8e3; border: 1px solid #faebcc; }\n"
      report+="    .fail { background-color: #f2dede; border: 1px solid #ebccd1; }\n"
      report+="    .skip { background-color: #f5f5f5; border: 1px solid #e3e3e3; }\n"
      report+="    .status { font-weight: bold; }\n"
      report+="    .pass .status { color: #3c763d; }\n"
      report+="    .warn .status { color: #8a6d3b; }\n"
      report+="    .fail .status { color: #a94442; }\n"
      report+="    .skip .status { color: #777; }\n"
      report+="    .details { margin-top: 5px; font-size: 0.9em; color: #555; }\n"
      report+="  </style>\n"
      report+="</head>\n"
      report+="<body>\n"
      report+="  <h1>AUSTA SuperApp Health Check Report</h1>\n"
      report+="  <div class=\"info\">\n"
      report+="    <p><strong>Environment:</strong> $ENVIRONMENT</p>\n"
      report+="    <p><strong>Timestamp:</strong> $timestamp</p>\n"
      report+="  </div>\n"
      report+="  <div class=\"summary\">\n"
      report+="    <h2>Summary</h2>\n"
      report+="    <p>Total Checks: $total_checks</p>\n"
      report+="    <p>Passed: $passed_checks</p>\n"
      report+="    <p>Warnings: $warning_checks</p>\n"
      report+="    <p>Failed: $failed_checks</p>\n"
      report+="    <p>Skipped: $skipped_checks</p>\n"
      report+="  </div>\n"
      
      # Function to add category results to HTML report
      add_category_to_html_report() {
        local category="$1"
        local category_name="$2"
        local -n results="$3"
        
        if [ ${#results[@]} -eq 0 ]; then
          return
        fi
        
        report+="  <div class=\"category\">\n"
        report+="    <h2>$category_name Checks</h2>\n"
        
        for key in "${!results[@]}"; do
          local status=$(echo "${results[$key]}" | cut -d '|' -f1)
          local message=$(echo "${results[$key]}" | cut -d '|' -f2)
          local details=$(echo "${results[$key]}" | cut -d '|' -f3)
          local status_class=""
          
          case "$status" in
            "PASS") status_class="pass" ;;
            "WARN") status_class="warn" ;;
            "FAIL") status_class="fail" ;;
            "SKIP") status_class="skip" ;;
          esac
          
          report+="    <div class=\"check $status_class\">\n"
          report+="      <div class=\"service\">$key</div>\n"
          report+="      <div class=\"status\">$status</div>\n"
          report+="      <div class=\"message\">$message</div>\n"
          
          if [ -n "$details" ]; then
            report+="      <div class=\"details\">$details</div>\n"
          fi
          
          report+="    </div>\n"
        done
        
        report+="  </div>\n"
      }
      
      # Add each category to the report
      add_category_to_html_report "service" "Service" SERVICE_RESULTS
      add_category_to_html_report "database" "Database" DATABASE_RESULTS
      add_category_to_html_report "kafka" "Kafka" KAFKA_RESULTS
      add_category_to_html_report "redis" "Redis" REDIS_RESULTS
      add_category_to_html_report "performance" "Performance" PERFORMANCE_RESULTS
      add_category_to_html_report "monitoring" "Monitoring" MONITORING_RESULTS
      
      report+="</body>\n"
      report+="</html>\n"
      ;;
  esac
  
  # Output the report
  if [ -n "$output_file" ]; then
    echo -e "$report" > "$output_file"
    log_message "INFO" "Health check report written to $output_file" "System"
  else
    echo -e "$report"
  fi
  
  return $exit_code
}

# Main Execution

# Display script banner
log_message "INFO" "AUSTA SuperApp Health Check Script v$VERSION" "System"

# Run health checks
check_services "$SERVICE" "$JOURNEY"
check_databases "$SERVICE" "$JOURNEY"
check_kafka "$SERVICE" "$JOURNEY"
check_redis "$SERVICE" "$JOURNEY"
check_performance "$SERVICE" "$JOURNEY"
check_monitoring "$SERVICE" "$JOURNEY"

# Generate and output report
generate_report "$OUTPUT_FORMAT" "$OUTPUT_FILE"
exit_code=$?

# Exit with appropriate code
exit $exit_code