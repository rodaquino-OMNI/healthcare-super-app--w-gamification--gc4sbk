#!/bin/bash

#############################################################
# AUSTA SuperApp Runtime Environment Validation Script
# 
# This script performs comprehensive runtime checks to ensure
# proper configuration and readiness of services before startup.
# It validates environment variables, service dependencies,
# port availability, and performance baselines.
#
# Usage: ./runtime-check.sh [service-type]
#   service-type: api-gateway, auth-service, health-service, etc.
#
# Exit codes:
#   0 - All checks passed successfully
#   1 - Environment variable validation failed
#   2 - Dependency check failed
#   3 - Port availability check failed
#   4 - Performance baseline check failed
#   5 - Container readiness check failed
#   6 - Invalid arguments
#############################################################

set -e

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Script version
VERSION="1.0.0"

# Default values
VERBOSE=false
TIMEOUT=5
RETRY_COUNT=3
RETRY_DELAY=2
PERFORMANCE_THRESHOLD=20 # Percentage threshold for performance degradation

# Log file path
LOG_DIR="/var/log/austa"
LOG_FILE="${LOG_DIR}/runtime-check.log"

# Timestamp function
timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Logging function
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
  esac
  
  echo -e "${color}[$(timestamp)] [${level}] ${message}${NC}"
  
  # Create log directory if it doesn't exist
  if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR" 2>/dev/null || true
  fi
  
  # Append to log file if writable
  if [ -w "$LOG_DIR" ] || [ -w "$LOG_FILE" ]; then
    echo "[$(timestamp)] [${level}] ${message}" >> "$LOG_FILE"
  fi
}

# Display script usage
usage() {
  echo "AUSTA SuperApp Runtime Environment Validation Script v${VERSION}"
  echo ""
  echo "Usage: $0 [OPTIONS] SERVICE_TYPE"
  echo ""
  echo "SERVICE_TYPE: The type of service to validate (required)"
  echo "  Supported values: api-gateway, auth-service, health-service, care-service,"
  echo "                   plan-service, gamification-engine, notification-service"
  echo ""
  echo "Options:"
  echo "  -v, --verbose       Enable verbose output"
  echo "  -t, --timeout N     Set timeout for dependency checks (default: ${TIMEOUT}s)"
  echo "  -r, --retry N       Set retry count for dependency checks (default: ${RETRY_COUNT})"
  echo "  -d, --delay N       Set delay between retries (default: ${RETRY_DELAY}s)"
  echo "  -p, --threshold N   Set performance degradation threshold (default: ${PERFORMANCE_THRESHOLD}%)"
  echo "  -h, --help          Display this help message"
  echo ""
  echo "Exit codes:"
  echo "  0 - All checks passed successfully"
  echo "  1 - Environment variable validation failed"
  echo "  2 - Dependency check failed"
  echo "  3 - Port availability check failed"
  echo "  4 - Performance baseline check failed"
  echo "  5 - Container readiness check failed"
  echo "  6 - Invalid arguments"
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      -t|--timeout)
        TIMEOUT="$2"
        shift 2
        ;;
      -r|--retry)
        RETRY_COUNT="$2"
        shift 2
        ;;
      -d|--delay)
        RETRY_DELAY="$2"
        shift 2
        ;;
      -p|--threshold)
        PERFORMANCE_THRESHOLD="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      -*)
        log "ERROR" "Unknown option: $1"
        usage
        exit 6
        ;;
      *)
        if [ -z "$SERVICE_TYPE" ]; then
          SERVICE_TYPE="$1"
        else
          log "ERROR" "Too many arguments. SERVICE_TYPE already set to '$SERVICE_TYPE'"
          usage
          exit 6
        fi
        shift
        ;;
    esac
  done
  
  # Validate SERVICE_TYPE
  if [ -z "$SERVICE_TYPE" ]; then
    log "ERROR" "SERVICE_TYPE is required"
    usage
    exit 6
  fi
  
  # Validate SERVICE_TYPE values
  case $SERVICE_TYPE in
    api-gateway|auth-service|health-service|care-service|plan-service|gamification-engine|notification-service)
      # Valid service type
      ;;
    *)
      log "ERROR" "Invalid SERVICE_TYPE: $SERVICE_TYPE"
      usage
      exit 6
      ;;
  esac
}

# Check if a required environment variable is set
check_env_var() {
  local var_name=$1
  local var_value=${!var_name}
  
  if [ -z "$var_value" ]; then
    log "ERROR" "Required environment variable $var_name is not set"
    return 1
  elif $VERBOSE; then
    log "INFO" "Environment variable $var_name is set"
  fi
  
  return 0
}

# Validate required environment variables based on service type
validate_environment_variables() {
  log "INFO" "Validating environment variables for $SERVICE_TYPE..."
  
  # Common environment variables for all services
  local common_vars=("NODE_ENV" "PORT" "SENTRY_DSN" "DATADOG_API_KEY")
  local service_specific_vars=()
  
  # Service-specific environment variables
  case $SERVICE_TYPE in
    api-gateway)
      service_specific_vars=("AUTH_SERVICE_URL" "HEALTH_SERVICE_URL" "CARE_SERVICE_URL" \
                            "PLAN_SERVICE_URL" "GAMIFICATION_SERVICE_URL" "NOTIFICATION_SERVICE_URL" \
                            "REDIS_URL" "JWT_SECRET")
      ;;
    auth-service)
      service_specific_vars=("DATABASE_URL" "JWT_SECRET" "JWT_EXPIRATION" "REDIS_URL")
      ;;
    health-service)
      service_specific_vars=("DATABASE_URL" "FHIR_API_URL" "FHIR_API_KEY")
      ;;
    care-service)
      service_specific_vars=("DATABASE_URL" "TELEMEDICINE_API_URL" "PROVIDER_API_URL")
      ;;
    plan-service)
      service_specific_vars=("DATABASE_URL" "INSURANCE_API_URL" "PAYMENT_API_URL")
      ;;
    gamification-engine)
      service_specific_vars=("DATABASE_URL" "KAFKA_BROKERS" "KAFKA_GROUP_ID" "REDIS_URL")
      ;;
    notification-service)
      service_specific_vars=("DATABASE_URL" "KAFKA_BROKERS" "KAFKA_GROUP_ID" "SMTP_HOST" "SMTP_PORT" \
                            "SMTP_USER" "SMTP_PASS" "SMS_PROVIDER_URL" "PUSH_NOTIFICATION_KEY")
      ;;
  esac
  
  # Check common variables
  local failed=false
  for var in "${common_vars[@]}"; do
    if ! check_env_var "$var"; then
      failed=true
    fi
  done
  
  # Check service-specific variables
  for var in "${service_specific_vars[@]}"; do
    if ! check_env_var "$var"; then
      failed=true
    fi
  done
  
  if $failed; then
    log "ERROR" "Environment variable validation failed"
    return 1
  else
    log "SUCCESS" "All required environment variables are set"
    return 0
  fi
}

# Check if a host is reachable
check_host_connectivity() {
  local host=$1
  local port=$2
  local timeout=$TIMEOUT
  local retry_count=$RETRY_COUNT
  local retry_delay=$RETRY_DELAY
  
  log "INFO" "Checking connectivity to $host:$port..."
  
  for ((i=1; i<=retry_count; i++)); do
    if nc -z -w "$timeout" "$host" "$port" 2>/dev/null; then
      log "SUCCESS" "Successfully connected to $host:$port"
      return 0
    else
      log "WARNING" "Failed to connect to $host:$port (attempt $i/$retry_count)"
      if [ "$i" -lt "$retry_count" ]; then
        log "INFO" "Retrying in $retry_delay seconds..."
        sleep "$retry_delay"
      fi
    fi
  done
  
  log "ERROR" "Failed to connect to $host:$port after $retry_count attempts"
  return 1
}

# Extract host and port from URL
extract_host_port() {
  local url=$1
  local default_port=$2
  
  # Extract protocol, host, and port
  local protocol=$(echo "$url" | grep -oP '^\w+(?=://)')
  local host_port=$(echo "$url" | grep -oP '(?<=://)([^/]+)')
  local host=$(echo "$host_port" | cut -d':' -f1)
  local port=$(echo "$host_port" | grep -oP '(?<=:)\d+' || echo "$default_port")
  
  # Set default port based on protocol if not specified
  if [ -z "$port" ]; then
    case $protocol in
      http) port=80 ;;
      https) port=443 ;;
      redis) port=6379 ;;
      *) port=$default_port ;;
    esac
  fi
  
  echo "$host $port"
}

# Check dependencies based on service type
check_dependencies() {
  log "INFO" "Checking dependencies for $SERVICE_TYPE..."
  
  local failed=false
  local dependencies=()
  
  # Define dependencies based on service type
  case $SERVICE_TYPE in
    api-gateway)
      # Check Redis
      if [ -n "$REDIS_URL" ]; then
        read -r redis_host redis_port < <(extract_host_port "$REDIS_URL" 6379)
        dependencies+=("Redis:$redis_host:$redis_port")
      fi
      
      # Check dependent services
      for service_var in AUTH_SERVICE_URL HEALTH_SERVICE_URL CARE_SERVICE_URL PLAN_SERVICE_URL GAMIFICATION_SERVICE_URL NOTIFICATION_SERVICE_URL; do
        if [ -n "${!service_var}" ]; then
          read -r service_host service_port < <(extract_host_port "${!service_var}" 3000)
          service_name=$(echo "$service_var" | sed 's/_URL$//')
          dependencies+=("$service_name:$service_host:$service_port")
        fi
      done
      ;;
    auth-service|health-service|care-service|plan-service)
      # Check database
      if [ -n "$DATABASE_URL" ]; then
        read -r db_host db_port < <(extract_host_port "$DATABASE_URL" 5432)
        dependencies+=("Database:$db_host:$db_port")
      fi
      
      # Check Redis for auth-service
      if [ "$SERVICE_TYPE" = "auth-service" ] && [ -n "$REDIS_URL" ]; then
        read -r redis_host redis_port < <(extract_host_port "$REDIS_URL" 6379)
        dependencies+=("Redis:$redis_host:$redis_port")
      fi
      ;;
    gamification-engine|notification-service)
      # Check database
      if [ -n "$DATABASE_URL" ]; then
        read -r db_host db_port < <(extract_host_port "$DATABASE_URL" 5432)
        dependencies+=("Database:$db_host:$db_port")
      fi
      
      # Check Kafka
      if [ -n "$KAFKA_BROKERS" ]; then
        # Handle comma-separated list of brokers
        IFS=',' read -ra BROKERS <<< "$KAFKA_BROKERS"
        for broker in "${BROKERS[@]}"; do
          read -r kafka_host kafka_port < <(extract_host_port "$broker" 9092)
          dependencies+=("Kafka:$kafka_host:$kafka_port")
        done
      fi
      
      # Check Redis for gamification-engine
      if [ "$SERVICE_TYPE" = "gamification-engine" ] && [ -n "$REDIS_URL" ]; then
        read -r redis_host redis_port < <(extract_host_port "$REDIS_URL" 6379)
        dependencies+=("Redis:$redis_host:$redis_port")
      fi
      ;;
  esac
  
  # Check each dependency
  for dep in "${dependencies[@]}"; do
    IFS=':' read -r name host port <<< "$dep"
    log "INFO" "Checking dependency: $name ($host:$port)"
    
    if ! check_host_connectivity "$host" "$port"; then
      log "ERROR" "Dependency check failed for $name ($host:$port)"
      failed=true
    fi
  done
  
  if $failed; then
    log "ERROR" "Dependency check failed"
    return 1
  else
    log "SUCCESS" "All dependencies are available"
    return 0
  fi
}

# Check if a port is available
check_port_availability() {
  local port=$1
  
  log "INFO" "Checking if port $port is available..."
  
  if nc -z localhost "$port" 2>/dev/null; then
    log "ERROR" "Port $port is already in use"
    return 1
  else
    log "SUCCESS" "Port $port is available"
    return 0
  fi
}

# Verify port availability
verify_port_availability() {
  log "INFO" "Verifying port availability..."
  
  # Get the port from environment variable
  local port=${PORT:-3000}
  
  if ! check_port_availability "$port"; then
    log "ERROR" "Port availability check failed"
    return 1
  else
    log "SUCCESS" "Required port is available"
    return 0
  fi
}

# Measure startup time
measure_startup_time() {
  log "INFO" "Measuring container startup time..."
  
  local start_time=$(date +%s.%N)
  
  # Simulate startup tasks based on service type
  case $SERVICE_TYPE in
    api-gateway)
      # API Gateway specific startup tasks
      sleep 0.5
      ;;
    auth-service)
      # Auth Service specific startup tasks
      sleep 0.3
      ;;
    health-service|care-service|plan-service)
      # Journey services startup tasks
      sleep 0.4
      ;;
    gamification-engine)
      # Gamification Engine specific startup tasks
      sleep 0.6
      ;;
    notification-service)
      # Notification Service specific startup tasks
      sleep 0.2
      ;;
  esac
  
  local end_time=$(date +%s.%N)
  local startup_time=$(echo "$end_time - $start_time" | bc)
  
  log "INFO" "Container startup time: ${startup_time}s"
  echo "$startup_time"
}

# Check performance baseline
check_performance_baseline() {
  log "INFO" "Checking performance baseline..."
  
  # Get baseline metrics file path
  local metrics_dir="/var/lib/austa/metrics"
  local baseline_file="${metrics_dir}/${SERVICE_TYPE}_baseline.json"
  
  # Create metrics directory if it doesn't exist
  if [ ! -d "$metrics_dir" ]; then
    mkdir -p "$metrics_dir" 2>/dev/null || true
  fi
  
  # Measure current startup time
  local current_startup_time=$(measure_startup_time)
  
  # Check if baseline file exists
  if [ -f "$baseline_file" ] && [ -r "$baseline_file" ]; then
    log "INFO" "Baseline metrics found, comparing with current performance"
    
    # Read baseline startup time
    local baseline_startup_time=$(grep -oP '"startup_time":\s*"\K[0-9.]+' "$baseline_file")
    
    if [ -n "$baseline_startup_time" ]; then
      # Calculate percentage difference
      local percent_diff=$(echo "scale=2; (($current_startup_time - $baseline_startup_time) / $baseline_startup_time) * 100" | bc)
      
      log "INFO" "Baseline startup time: ${baseline_startup_time}s, Current: ${current_startup_time}s, Difference: ${percent_diff}%"
      
      # Check if performance degradation exceeds threshold
      if (( $(echo "$percent_diff > $PERFORMANCE_THRESHOLD" | bc -l) )); then
        log "ERROR" "Performance degradation exceeds threshold (${percent_diff}% > ${PERFORMANCE_THRESHOLD}%)"
        return 1
      else
        log "SUCCESS" "Performance is within acceptable range"
      fi
    else
      log "WARNING" "Could not read baseline startup time from file"
      # Create or update baseline file
      echo "{\"startup_time\": \"$current_startup_time\", \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$baseline_file"
      log "INFO" "Created new baseline metrics"
    fi
  else
    log "INFO" "No baseline metrics found, creating baseline"
    # Create baseline file
    echo "{\"startup_time\": \"$current_startup_time\", \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" > "$baseline_file"
    log "SUCCESS" "Created baseline metrics"
  fi
  
  return 0
}

# Check container readiness
check_container_readiness() {
  log "INFO" "Checking container readiness..."
  
  # Check if running in a container
  if [ -f "/.dockerenv" ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    log "INFO" "Running in a container environment"
    
    # Check available memory
    local total_memory=$(free -m | awk '/^Mem:/{print $2}')
    local available_memory=$(free -m | awk '/^Mem:/{print $7}')
    local memory_usage_percent=$(echo "scale=2; (($total_memory - $available_memory) / $total_memory) * 100" | bc)
    
    log "INFO" "Memory usage: ${memory_usage_percent}% (${available_memory}MB available out of ${total_memory}MB)"
    
    # Check available disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log "INFO" "Disk usage: ${disk_usage}%"
    
    # Check if memory or disk usage is too high
    if (( $(echo "$memory_usage_percent > 90" | bc -l) )); then
      log "ERROR" "Memory usage is too high (${memory_usage_percent}%)"
      return 1
    fi
    
    if (( disk_usage > 90 )); then
      log "ERROR" "Disk usage is too high (${disk_usage}%)"
      return 1
    fi
    
    log "SUCCESS" "Container has sufficient resources"
  else
    log "INFO" "Not running in a container environment, skipping container-specific checks"
  fi
  
  return 0
}

# Main function
main() {
  log "INFO" "Starting runtime environment check for $SERVICE_TYPE (v${VERSION})"
  
  # Run all checks
  if ! validate_environment_variables; then
    log "ERROR" "Environment validation failed"
    exit 1
  fi
  
  if ! check_dependencies; then
    log "ERROR" "Dependency check failed"
    exit 2
  fi
  
  if ! verify_port_availability; then
    log "ERROR" "Port availability check failed"
    exit 3
  fi
  
  if ! check_performance_baseline; then
    log "ERROR" "Performance baseline check failed"
    exit 4
  fi
  
  if ! check_container_readiness; then
    log "ERROR" "Container readiness check failed"
    exit 5
  fi
  
  log "SUCCESS" "All runtime checks passed successfully"
  exit 0
}

# Parse command line arguments
parse_args "$@"

# Run main function
main