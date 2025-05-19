#!/bin/sh
# Make script executable: chmod +x infrastructure/scripts/validate-env.sh
# =========================================================================
# AUSTA SuperApp Environment Validation Script
# =========================================================================
# This script validates the environment configuration before service startup:
# 1. Checks for required environment variables
# 2. Verifies Docker container readiness
# 3. Confirms service port availability
#
# Integration Points:
# - Local Development: Run before starting services with Docker Compose
# - CI/CD Pipeline: Execute as a pre-deployment validation step
# - Container Entrypoint: Use as a wrapper for service startup commands
# - Kubernetes: Use as an init container or readiness probe
#
# Docker Compose Integration:
#   services:
#     api-gateway:
#       image: austa/api-gateway:latest
#       entrypoint: ["/bin/sh", "-c", "/app/scripts/validate-env.sh --service=api-gateway && node dist/main.js"]
#       environment:
#         NODE_ENV: development
#         PORT: 3000
#
# Kubernetes Integration:
#   spec:
#     initContainers:
#     - name: env-validator
#       image: austa/api-gateway:latest
#       command: ["/bin/sh", "-c", "/app/scripts/validate-env.sh --service=api-gateway --skip-containers"]
#       env:
#         - name: NODE_ENV
#           valueFrom:
#             configMapKeyRef:
#               name: api-gateway-config
#               key: NODE_ENV
#
# Examples:
#   # Validate API Gateway in local development
#   ./validate-env.sh --service=api-gateway --env-file=.env.local
#
#   # Validate Health Service in production (skip container checks)
#   ./validate-env.sh --service=health-service --journey=health --skip-containers
#
#   # Use as a wrapper for service startup
#   ./validate-env.sh --service=auth-service && npm start
#
#   # Journey-specific validation examples:
#   ./validate-env.sh --service=health-service --journey=health
#   ./validate-env.sh --service=care-service --journey=care
#   ./validate-env.sh --service=plan-service --journey=plan
#
# Usage: ./validate-env.sh [options]
#   Options:
#     --service=NAME       Service name to validate (required)
#     --journey=NAME       Journey context (health, care, plan, or shared)
#     --timeout=SECONDS    Container readiness timeout (default: 30)
#     --env-file=PATH      Path to .env file to source (optional)
#     --skip-containers    Skip Docker container checks
#     --skip-ports         Skip port availability checks
#     --help               Display this help message
# =========================================================================

set -e

# Default values
TIMEOUT=30
SKIP_CONTAINERS=false
SKIP_PORTS=false
SERVICE=""
JOURNEY="shared"
ENV_FILE=""

# ANSI color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

# Display usage information
show_usage() {
  echo "Usage: ./validate-env.sh [options]"
  echo "  Options:"
  echo "    --service=NAME       Service name to validate (required)"
  echo "    --journey=NAME       Journey context (health, care, plan, or shared)"
  echo "    --timeout=SECONDS    Container readiness timeout (default: 30)"
  echo "    --env-file=PATH      Path to .env file to source (optional)"
  echo "    --skip-containers    Skip Docker container checks"
  echo "    --skip-ports         Skip port availability checks"
  echo "    --help               Display this help message"
  exit 1
}

# Log a message with timestamp and service context
log_message() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  local prefix=""
  
  case "$level" in
    "INFO") prefix="${GREEN}INFO${NC}" ;;
    "WARN") prefix="${YELLOW}WARN${NC}" ;;
    "ERROR") prefix="${RED}ERROR${NC}" ;;
    "SUCCESS") prefix="${GREEN}SUCCESS${NC}" ;;
  esac
  
  if [ "$JOURNEY" != "shared" ]; then
    echo "[$timestamp] [$prefix] [${CYAN}$SERVICE${NC}] [${MAGENTA}$JOURNEY-journey${NC}] $message"
  else
    echo "[$timestamp] [$prefix] [${CYAN}$SERVICE${NC}] $message"
  fi
}

# Show troubleshooting guide based on error code
show_troubleshooting_guide() {
  local error_code=$1
  
  echo "\n${YELLOW}=== Troubleshooting Guide ===${NC}"
  
  case $error_code in
    2) # Environment variable error
      echo "${CYAN}Missing Environment Variable:${NC}"
      echo "1. Check your .env file or environment configuration"
      echo "2. For local development, copy .env.local.example to .env.local"
      echo "3. For Kubernetes, verify ConfigMap and Secret resources"
      echo "4. Service-specific variables may be found in service documentation"
      ;;
      
    3|4) # Container error
      echo "${CYAN}Docker Container Issue:${NC}"
      echo "1. Check if Docker is running: docker ps"
      echo "2. For local development, run: docker-compose up -d"
      echo "3. Check container logs: docker logs <container_name>"
      echo "4. Verify container health: docker inspect <container_name>"
      echo "5. Restart the container: docker restart <container_name>"
      ;;
      
    5) # Port availability error
      echo "${CYAN}Port Conflict:${NC}"
      echo "1. Identify the process using the port:"
      echo "   - lsof -i:<port> or netstat -tuln | grep <port>"
      echo "2. Stop the conflicting process or change your service port"
      echo "3. For local development, check other running services"
      echo "4. Verify your .env file has the correct PORT setting"
      ;;
      
    *) # General error
      echo "${CYAN}General Troubleshooting:${NC}"
      echo "1. Check service logs for more details"
      echo "2. Verify network connectivity to dependent services"
      echo "3. Ensure all required services are running"
      echo "4. Check for recent configuration changes"
      ;;
  esac
  
  echo "\n${CYAN}For more help:${NC}"
  echo "- Review service documentation in /docs"
  echo "- Check the troubleshooting guide in the wiki"
  echo "- Contact the DevOps team for assistance"
  echo "${YELLOW}===========================${NC}\n"
}

# Log an error message and exit with error code
log_error_and_exit() {
  local message="$1"
  local exit_code="${2:-1}"
  log_message "ERROR" "$message"
  show_troubleshooting_guide "$exit_code"
  exit "$exit_code"
}

# Check if a variable is set and not empty
check_env_var() {
  local var_name="$1"
  local var_value=""
  eval "var_value=\${$var_name:-}"
  
  if [ -z "$var_value" ]; then
    log_error_and_exit "Required environment variable '$var_name' is not set or empty" 2
  else
    log_message "INFO" "Environment variable '$var_name' is properly set"
    return 0
  fi
}

# Check if a Docker container is running and ready
check_container() {
  local container_name="$1"
  local max_attempts=$((TIMEOUT / 2))
  local attempt=1
  
  log_message "INFO" "Checking if container '$container_name' is running and ready..."
  
  # Check if Docker is available
  if ! command -v docker >/dev/null 2>&1; then
    log_message "WARN" "Docker command not found, skipping container check"
    return 0
  fi
  
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    log_error_and_exit "Container '$container_name' does not exist" 3
  fi
  
  # Check if container is running
  while [ $attempt -le $max_attempts ]; do
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
      # Check container health if available
      local health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null)
      
      if [ "$health_status" = "healthy" ] || [ "$health_status" = "running" ]; then
        log_message "SUCCESS" "Container '$container_name' is running and ready"
        return 0
      elif [ "$health_status" = "starting" ]; then
        log_message "INFO" "Container '$container_name' is starting (attempt $attempt/$max_attempts)..."
      else
        log_message "WARN" "Container '$container_name' has status: $health_status (attempt $attempt/$max_attempts)"
      fi
    else
      log_message "WARN" "Container '$container_name' is not running (attempt $attempt/$max_attempts)"
    fi
    
    attempt=$((attempt + 1))
    sleep 2
  done
  
  log_error_and_exit "Container '$container_name' is not ready after $TIMEOUT seconds" 4
}

# Check if a port is available (not in use)
check_port_available() {
  local port="$1"
  local protocol="${2:-tcp}"
  
  log_message "INFO" "Checking if port $port/$protocol is available..."
  
  # Check if port is in use
  if command -v netstat >/dev/null 2>&1; then
    if netstat -tuln | grep -q ":$port "; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -tuln | grep -q ":$port "; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -i:"$port" >/dev/null 2>&1; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  else
    log_message "WARN" "Cannot check port availability: netstat, ss, and lsof commands not found"
    return 0
  fi
  
  log_message "SUCCESS" "Port $port/$protocol is available"
  return 0
}

# =========================================================================
# Parse Command Line Arguments
# =========================================================================

for arg in "$@"; do
  case $arg in
    --service=*)
      SERVICE="${arg#*=}"
      ;;
    --journey=*)
      JOURNEY="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT="${arg#*=}"
      ;;
    --env-file=*)
      ENV_FILE="${arg#*=}"
      ;;
    --skip-containers)
      SKIP_CONTAINERS=true
      ;;
    --skip-ports)
      SKIP_PORTS=true
      ;;
    --help)
      show_usage
      ;;
    *)
      log_error_and_exit "Unknown option: $arg"
      ;;
  esac
done

# Validate required parameters
if [ -z "$SERVICE" ]; then
  log_error_and_exit "--service parameter is required"
fi

# Validate journey parameter
case "$JOURNEY" in
  health|care|plan|shared)
    # Valid journey
    ;;
  *)
    log_error_and_exit "Invalid journey: $JOURNEY. Must be one of: health, care, plan, shared"
    ;;
esac

# Source environment file if provided
if [ -n "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE" ]; then
    log_message "INFO" "Sourcing environment variables from $ENV_FILE"
    # shellcheck disable=SC1090
    . "$ENV_FILE"
  else
    log_error_and_exit "Environment file not found: $ENV_FILE"
  fi
fi

log_message "INFO" "Starting environment validation for $SERVICE (journey: $JOURNEY)"

# =========================================================================
# Validate Environment Variables
# =========================================================================

log_message "INFO" "Validating required environment variables..."

# Common variables for all services
check_env_var "NODE_ENV"
check_env_var "PORT"

# Service-specific variables
case "$SERVICE" in
  api-gateway)
    check_env_var "AUTH_SERVICE_URL"
    check_env_var "HEALTH_SERVICE_URL"
    check_env_var "CARE_SERVICE_URL"
    check_env_var "PLAN_SERVICE_URL"
    check_env_var "GAMIFICATION_ENGINE_URL"
    ;;
    
  auth-service)
    check_env_var "JWT_SECRET"
    check_env_var "JWT_EXPIRATION"
    check_env_var "DATABASE_URL"
    check_env_var "REDIS_URL"
    ;;
    
  gamification-engine)
    check_env_var "DATABASE_URL"
    check_env_var "KAFKA_BROKERS"
    check_env_var "NOTIFICATION_SERVICE_URL"
    ;;
    
  notification-service)
    check_env_var "DATABASE_URL"
    check_env_var "KAFKA_BROKERS"
    check_env_var "EMAIL_PROVIDER"
    check_env_var "SMS_PROVIDER"
    ;;
    
  *)
    # Journey-specific services
    case "$JOURNEY" in
      health)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "FHIR_API_URL"
        ;;
        
      care)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "TELEMEDICINE_API_URL"
        ;;
        
      plan)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "INSURANCE_API_URL"
        ;;
        
      shared)
        check_env_var "DATABASE_URL"
        ;;
    esac
    ;;
esac

# =========================================================================
# Validate Docker Container Readiness
# =========================================================================

if [ "$SKIP_CONTAINERS" = "false" ]; then
  log_message "INFO" "Validating Docker container readiness..."
  
  # Check common dependencies
  if echo "$DATABASE_URL" | grep -q "postgres"; then
    check_container "postgres"
  fi
  
  if echo "$DATABASE_URL" | grep -q "timescale"; then
    check_container "timescaledb"
  fi
  
  if [ -n "$REDIS_URL" ]; then
    check_container "redis"
  fi
  
  if [ -n "$KAFKA_BROKERS" ]; then
    check_container "kafka"
    check_container "zookeeper"
  fi
  
  # Service-specific container dependencies
  case "$SERVICE" in
    api-gateway)
      # API Gateway typically doesn't have additional container dependencies
      ;;
      
    auth-service)
      # Auth service dependencies already checked (postgres, redis)
      ;;
      
    gamification-engine)
      # Gamification engine dependencies already checked (postgres, kafka)
      ;;
      
    notification-service)
      # Check email service mock if in development
      if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
        check_container "mailhog"
      fi
      ;;
      
    *)
      # Journey-specific container dependencies
      case "$JOURNEY" in
        health)
          # Health journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "fhir-server-mock"
          fi
          ;;
          
        care)
          # Care journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "telemedicine-mock"
          fi
          ;;
          
        plan)
          # Plan journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "insurance-api-mock"
          fi
          ;;
      esac
      ;;
  esac
else
  log_message "INFO" "Skipping Docker container checks"
fi

# =========================================================================
# Validate Port Availability
# =========================================================================

if [ "$SKIP_PORTS" = "false" ]; then
  log_message "INFO" "Validating port availability..."
  
  # Check if the service's port is available
  if [ -n "$PORT" ]; then
    check_port_available "$PORT" "tcp"
  fi
  
  # Check additional ports based on service type
  case "$SERVICE" in
    api-gateway)
      # API Gateway might use additional ports for WebSocket
      if [ -n "$WS_PORT" ]; then
        check_port_available "$WS_PORT" "tcp"
      fi
      ;;
      
    notification-service)
      # Notification service might use additional ports for WebSocket
      if [ -n "$WS_PORT" ]; then
        check_port_available "$WS_PORT" "tcp"
      fi
      ;;
  esac
else
  log_message "INFO" "Skipping port availability checks"
fi

# =========================================================================
# Validation Complete
# =========================================================================

log_message "SUCCESS" "Environment validation completed successfully for $SERVICE"
exit 0