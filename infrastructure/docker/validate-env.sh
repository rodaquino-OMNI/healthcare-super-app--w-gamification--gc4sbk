#!/bin/bash
# Make script executable with: chmod +x validate-env.sh

# ======================================================
# AUSTA SuperApp Environment Validation Script
# ======================================================
# This script validates environment variables and system
# requirements before starting Docker Compose services.
# It ensures all required variables are set and have
# appropriate values, checks port availability, and
# verifies connectivity to essential services.
# ======================================================

set -e

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
RESET="\033[0m"

# Configuration
ENV_FILE=".env.local"
ENV_EXAMPLE_FILE=".env.local.example"
LOG_FILE="env-validation.log"
VERBOSE=false
FIX_ISSUES=false
SKIP_CONNECTIVITY=false
SKIP_PORTS=false

# ======================================================
# Helper Functions
# ======================================================

log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      local color=$BLUE
      ;;
    "SUCCESS")
      local color=$GREEN
      ;;
    "WARNING")
      local color=$YELLOW
      ;;
    "ERROR")
      local color=$RED
      ;;
    *)
      local color=$RESET
      ;;
  esac
  
  echo -e "${timestamp} [${color}${level}${RESET}] ${message}"
  echo "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

show_help() {
  echo -e "\n${BOLD}AUSTA SuperApp Environment Validation${RESET}"
  echo -e "\nUsage: $0 [options]"
  echo -e "\nOptions:"
  echo "  -h, --help             Show this help message"
  echo "  -v, --verbose          Enable verbose output"
  echo "  -f, --fix              Attempt to fix common issues"
  echo "  -e, --env-file FILE    Specify environment file (default: .env.local)"
  echo "  --skip-connectivity    Skip connectivity checks"
  echo "  --skip-ports           Skip port availability checks"
  echo -e "\nExample: $0 --verbose --env-file .env.development"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      -f|--fix)
        FIX_ISSUES=true
        shift
        ;;
      -e|--env-file)
        ENV_FILE="$2"
        shift 2
        ;;
      --skip-connectivity)
        SKIP_CONNECTIVITY=true
        shift
        ;;
      --skip-ports)
        SKIP_PORTS=true
        shift
        ;;
      *)
        log "ERROR" "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

check_command() {
  local cmd=$1
  if ! command -v "$cmd" &> /dev/null; then
    log "ERROR" "Required command not found: $cmd"
    return 1
  fi
  
  if [[ "$VERBOSE" == "true" ]]; then
    log "INFO" "Command found: $cmd"
  fi
  
  return 0
}

check_file_exists() {
  local file=$1
  if [[ ! -f "$file" ]]; then
    log "ERROR" "Required file not found: $file"
    return 1
  fi
  
  if [[ "$VERBOSE" == "true" ]]; then
    log "INFO" "File found: $file"
  fi
  
  return 0
}

check_port_available() {
  local port=$1
  local service=$2
  
  if [[ "$SKIP_PORTS" == "true" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Skipping port check for $service (port $port)"
    fi
    return 0
  fi
  
  # Check if port is in use
  if command -v nc &> /dev/null; then
    if nc -z localhost "$port" &> /dev/null; then
      log "ERROR" "Port $port is already in use (required by $service)"
      return 1
    fi
  elif command -v lsof &> /dev/null; then
    if lsof -i:"$port" &> /dev/null; then
      log "ERROR" "Port $port is already in use (required by $service)"
      return 1
    fi
  else
    log "WARNING" "Cannot check port availability: neither nc nor lsof found"
    return 0
  fi
  
  if [[ "$VERBOSE" == "true" ]]; then
    log "SUCCESS" "Port $port is available for $service"
  fi
  
  return 0
}

check_connectivity() {
  local host=$1
  local port=$2
  local service=$3
  local timeout=${4:-5}
  
  if [[ "$SKIP_CONNECTIVITY" == "true" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Skipping connectivity check for $service ($host:$port)"
    fi
    return 0
  fi
  
  if command -v nc &> /dev/null; then
    if nc -z -w "$timeout" "$host" "$port" &> /dev/null; then
      if [[ "$VERBOSE" == "true" ]]; then
        log "SUCCESS" "Successfully connected to $service at $host:$port"
      fi
      return 0
    else
      log "ERROR" "Failed to connect to $service at $host:$port"
      return 1
    fi
  else
    log "WARNING" "Cannot check connectivity: nc command not found"
    return 0
  fi
}

check_postgres_connection() {
  local host=${POSTGRES_HOST:-localhost}
  local port=${POSTGRES_PORT:-5432}
  local user=${POSTGRES_USER:-postgres}
  local password=${POSTGRES_PASSWORD:-postgres}
  local database=${POSTGRES_DB:-postgres}
  
  if [[ "$SKIP_CONNECTIVITY" == "true" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Skipping PostgreSQL connection check"
    fi
    return 0
  fi
  
  if ! command -v psql &> /dev/null; then
    log "WARNING" "Cannot check PostgreSQL connection: psql command not found"
    # Fall back to basic connectivity check
    check_connectivity "$host" "$port" "PostgreSQL"
    return $?
  fi
  
  # Try to connect to PostgreSQL
  if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" &> /dev/null; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Successfully connected to PostgreSQL at $host:$port"
    fi
    return 0
  else
    log "ERROR" "Failed to connect to PostgreSQL at $host:$port"
    return 1
  fi
}

check_redis_connection() {
  local host=${REDIS_HOST:-localhost}
  local port=${REDIS_PORT:-6379}
  
  if [[ "$SKIP_CONNECTIVITY" == "true" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Skipping Redis connection check"
    fi
    return 0
  fi
  
  if ! command -v redis-cli &> /dev/null; then
    log "WARNING" "Cannot check Redis connection: redis-cli command not found"
    # Fall back to basic connectivity check
    check_connectivity "$host" "$port" "Redis"
    return $?
  fi
  
  # Try to connect to Redis
  if redis-cli -h "$host" -p "$port" ping &> /dev/null; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Successfully connected to Redis at $host:$port"
    fi
    return 0
  else
    log "ERROR" "Failed to connect to Redis at $host:$port"
    return 1
  fi
}

check_kafka_connection() {
  local host=${KAFKA_BOOTSTRAP_SERVER:-localhost}
  local port=${KAFKA_PORT:-9092}
  
  if [[ "$SKIP_CONNECTIVITY" == "true" ]]; then
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Skipping Kafka connection check"
    fi
    return 0
  fi
  
  # Check basic connectivity first
  if ! check_connectivity "$host" "$port" "Kafka"; then
    return 1
  fi
  
  # If kafka-topics command is available, try to list topics
  if command -v kafka-topics &> /dev/null; then
    if kafka-topics --bootstrap-server "$host:$port" --list &> /dev/null; then
      if [[ "$VERBOSE" == "true" ]]; then
        log "SUCCESS" "Successfully connected to Kafka at $host:$port"
      fi
      return 0
    else
      log "ERROR" "Failed to list Kafka topics at $host:$port"
      return 1
    fi
  else
    if [[ "$VERBOSE" == "true" ]]; then
      log "INFO" "Basic connectivity to Kafka at $host:$port successful (kafka-topics command not available for detailed check)"
    fi
    return 0
  fi
}

# ======================================================
# Environment Variable Validation Functions
# ======================================================

load_env_file() {
  local env_file=$1
  
  if [[ ! -f "$env_file" ]]; then
    log "ERROR" "Environment file not found: $env_file"
    
    if [[ -f "$ENV_EXAMPLE_FILE" ]] && [[ "$FIX_ISSUES" == "true" ]]; then
      log "INFO" "Creating $env_file from example file"
      cp "$ENV_EXAMPLE_FILE" "$env_file"
      log "WARNING" "Created $env_file from example file. Please review and update the values."
    else
      log "INFO" "Create a $env_file file based on $ENV_EXAMPLE_FILE"
      return 1
    fi
  fi
  
  # Load environment variables
  if [[ "$VERBOSE" == "true" ]]; then
    log "INFO" "Loading environment variables from $env_file"
  fi
  
  # shellcheck disable=SC1090
  source "$env_file"
  
  return 0
}

check_required_vars() {
  local missing_vars=0
  
  # Define required variables by category
  local db_vars=("POSTGRES_HOST" "POSTGRES_PORT" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
  local redis_vars=("REDIS_HOST" "REDIS_PORT")
  local kafka_vars=("KAFKA_BOOTSTRAP_SERVER" "KAFKA_PORT" "ZOOKEEPER_HOST" "ZOOKEEPER_PORT")
  local api_vars=("API_GATEWAY_PORT" "AUTH_SERVICE_PORT")
  local journey_vars=("HEALTH_SERVICE_PORT" "CARE_SERVICE_PORT" "PLAN_SERVICE_PORT" "GAMIFICATION_ENGINE_PORT" "NOTIFICATION_SERVICE_PORT")
  
  # Check database variables
  log "INFO" "Checking database configuration variables..."
  for var in "${db_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log "ERROR" "Missing required database variable: $var"
      missing_vars=$((missing_vars + 1))
    elif [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Database variable set: $var = ${!var}"
    fi
  done
  
  # Check Redis variables
  log "INFO" "Checking Redis configuration variables..."
  for var in "${redis_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log "ERROR" "Missing required Redis variable: $var"
      missing_vars=$((missing_vars + 1))
    elif [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Redis variable set: $var = ${!var}"
    fi
  done
  
  # Check Kafka variables
  log "INFO" "Checking Kafka configuration variables..."
  for var in "${kafka_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log "ERROR" "Missing required Kafka variable: $var"
      missing_vars=$((missing_vars + 1))
    elif [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Kafka variable set: $var = ${!var}"
    fi
  done
  
  # Check API variables
  log "INFO" "Checking API configuration variables..."
  for var in "${api_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log "ERROR" "Missing required API variable: $var"
      missing_vars=$((missing_vars + 1))
    elif [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "API variable set: $var = ${!var}"
    fi
  done
  
  # Check Journey variables
  log "INFO" "Checking Journey service configuration variables..."
  for var in "${journey_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log "ERROR" "Missing required Journey service variable: $var"
      missing_vars=$((missing_vars + 1))
    elif [[ "$VERBOSE" == "true" ]]; then
      log "SUCCESS" "Journey service variable set: $var = ${!var}"
    fi
  done
  
  if [[ $missing_vars -gt 0 ]]; then
    log "ERROR" "Found $missing_vars missing required variables"
    return 1
  else
    log "SUCCESS" "All required environment variables are set"
    return 0
  fi
}

validate_var_values() {
  local invalid_vars=0
  
  # Validate port numbers
  log "INFO" "Validating port numbers..."
  local port_vars=("POSTGRES_PORT" "REDIS_PORT" "KAFKA_PORT" "ZOOKEEPER_PORT" "API_GATEWAY_PORT" "AUTH_SERVICE_PORT" "HEALTH_SERVICE_PORT" "CARE_SERVICE_PORT" "PLAN_SERVICE_PORT" "GAMIFICATION_ENGINE_PORT" "NOTIFICATION_SERVICE_PORT")
  
  for var in "${port_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
      if ! [[ "${!var}" =~ ^[0-9]+$ ]] || [[ "${!var}" -lt 1 ]] || [[ "${!var}" -gt 65535 ]]; then
        log "ERROR" "Invalid port number for $var: ${!var} (must be between 1 and 65535)"
        invalid_vars=$((invalid_vars + 1))
      elif [[ "$VERBOSE" == "true" ]]; then
        log "SUCCESS" "Valid port number for $var: ${!var}"
      fi
    fi
  done
  
  # Validate hostnames
  log "INFO" "Validating hostnames..."
  local host_vars=("POSTGRES_HOST" "REDIS_HOST" "KAFKA_BOOTSTRAP_SERVER" "ZOOKEEPER_HOST")
  
  for var in "${host_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
      # Simple hostname validation (allows IP addresses and hostnames)
      if ! [[ "${!var}" =~ ^[a-zA-Z0-9.-]+$ ]]; then
        log "ERROR" "Invalid hostname for $var: ${!var}"
        invalid_vars=$((invalid_vars + 1))
      elif [[ "$VERBOSE" == "true" ]]; then
        log "SUCCESS" "Valid hostname for $var: ${!var}"
      fi
    fi
  done
  
  if [[ $invalid_vars -gt 0 ]]; then
    log "ERROR" "Found $invalid_vars invalid variable values"
    return 1
  else
    log "SUCCESS" "All environment variable values are valid"
    return 0
  fi
}

# ======================================================
# Port Availability Checks
# ======================================================

check_required_ports() {
  local port_errors=0
  
  if [[ "$SKIP_PORTS" == "true" ]]; then
    log "INFO" "Skipping port availability checks"
    return 0
  fi
  
  log "INFO" "Checking port availability..."
  
  # Define services and their ports
  local services=(
    "PostgreSQL:${POSTGRES_PORT:-5432}"
    "Redis:${REDIS_PORT:-6379}"
    "Kafka:${KAFKA_PORT:-9092}"
    "Zookeeper:${ZOOKEEPER_PORT:-2181}"
    "API Gateway:${API_GATEWAY_PORT:-3000}"
    "Auth Service:${AUTH_SERVICE_PORT:-3001}"
    "Health Service:${HEALTH_SERVICE_PORT:-3002}"
    "Care Service:${CARE_SERVICE_PORT:-3003}"
    "Plan Service:${PLAN_SERVICE_PORT:-3004}"
    "Gamification Engine:${GAMIFICATION_ENGINE_PORT:-3005}"
    "Notification Service:${NOTIFICATION_SERVICE_PORT:-3006}"
    "Web Frontend:80"
    "Web Frontend Dev Server:3000"
    "Mobile Dev Server:8081"
  )
  
  for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    
    if ! check_port_available "$port" "$service"; then
      port_errors=$((port_errors + 1))
    fi
  done
  
  if [[ $port_errors -gt 0 ]]; then
    log "ERROR" "Found $port_errors port conflicts"
    return 1
  else
    log "SUCCESS" "All required ports are available"
    return 0
  fi
}

# ======================================================
# Connectivity Checks
# ======================================================

check_service_connectivity() {
  local connectivity_errors=0
  
  if [[ "$SKIP_CONNECTIVITY" == "true" ]]; then
    log "INFO" "Skipping service connectivity checks"
    return 0
  fi
  
  log "INFO" "Checking connectivity to required services..."
  
  # Check PostgreSQL connectivity
  if ! check_postgres_connection; then
    connectivity_errors=$((connectivity_errors + 1))
    log "INFO" "Make sure PostgreSQL is running and accessible"
  fi
  
  # Check Redis connectivity
  if ! check_redis_connection; then
    connectivity_errors=$((connectivity_errors + 1))
    log "INFO" "Make sure Redis is running and accessible"
  fi
  
  # Check Kafka connectivity
  if ! check_kafka_connection; then
    connectivity_errors=$((connectivity_errors + 1))
    log "INFO" "Make sure Kafka is running and accessible"
  fi
  
  # Check Zookeeper connectivity
  if ! check_connectivity "${ZOOKEEPER_HOST:-localhost}" "${ZOOKEEPER_PORT:-2181}" "Zookeeper"; then
    connectivity_errors=$((connectivity_errors + 1))
    log "INFO" "Make sure Zookeeper is running and accessible"
  fi
  
  if [[ $connectivity_errors -gt 0 ]]; then
    log "ERROR" "Found $connectivity_errors connectivity issues"
    return 1
  else
    log "SUCCESS" "All required services are accessible"
    return 0
  fi
}

# ======================================================
# Docker Checks
# ======================================================

check_docker_requirements() {
  local docker_errors=0
  
  log "INFO" "Checking Docker requirements..."
  
  # Check if Docker is installed and running
  if ! check_command "docker"; then
    docker_errors=$((docker_errors + 1))
    log "ERROR" "Docker is required but not installed"
  else
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
      docker_errors=$((docker_errors + 1))
      log "ERROR" "Docker daemon is not running"
    else
      log "SUCCESS" "Docker is installed and running"
    fi
  fi
  
  # Check if Docker Compose is installed
  if ! check_command "docker-compose"; then
    docker_errors=$((docker_errors + 1))
    log "ERROR" "Docker Compose is required but not installed"
  else
    log "SUCCESS" "Docker Compose is installed"
  fi
  
  if [[ $docker_errors -gt 0 ]]; then
    log "ERROR" "Found $docker_errors Docker-related issues"
    return 1
  else
    log "SUCCESS" "All Docker requirements are met"
    return 0
  fi
}

# ======================================================
# Main Execution
# ======================================================

main() {
  local exit_code=0
  
  # Initialize log file
  echo "" > "$LOG_FILE"
  
  log "INFO" "Starting environment validation for AUSTA SuperApp"
  
  # Parse command line arguments
  parse_args "$@"
  
  # Check Docker requirements
  if ! check_docker_requirements; then
    exit_code=1
  fi
  
  # Load environment variables
  if ! load_env_file "$ENV_FILE"; then
    exit_code=1
  fi
  
  # Check required environment variables
  if ! check_required_vars; then
    exit_code=1
  fi
  
  # Validate environment variable values
  if ! validate_var_values; then
    exit_code=1
  fi
  
  # Check port availability
  if ! check_required_ports; then
    exit_code=1
  fi
  
  # Check service connectivity
  if ! check_service_connectivity; then
    exit_code=1
  fi
  
  # Final summary
  if [[ $exit_code -eq 0 ]]; then
    log "SUCCESS" "Environment validation completed successfully"
    log "INFO" "You can now start the AUSTA SuperApp services"
  else
    log "ERROR" "Environment validation failed with errors"
    log "INFO" "Please fix the reported issues before starting the services"
    log "INFO" "Check $LOG_FILE for detailed logs"
  fi
  
  return $exit_code
}

# Run main function with all arguments
main "$@"