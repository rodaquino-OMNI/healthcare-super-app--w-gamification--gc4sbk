#!/bin/bash

# ======================================================
# AUSTA SuperApp Environment Validation Script
# ======================================================
# This script validates environment variables and service availability
# before application startup. It checks for required variables,
# verifies Docker container readiness, and confirms service port
# availability, preventing startup with incomplete configuration.
#
# Usage: ./validate-env.sh [environment] [service]
#   environment: development|staging|production (default: development)
#   service: all|api-gateway|auth|health|care|plan|gamification|notification (default: all)
#
# Exit codes:
#   0 - All validations passed
#   1 - Missing or invalid arguments
#   2 - Missing required environment variables
#   3 - Docker container not ready
#   4 - Service port not available
#   5 - Journey-specific validation failed
#   6 - Database connection failed
#   7 - Other validation error
# ======================================================

# Set strict mode
set -euo pipefail

# ======================================================
# Configuration
# ======================================================

# Default values
ENVIRONMENT="development"
SERVICE="all"
VERBOSE=false

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# ======================================================
# Helper Functions
# ======================================================

# Print timestamp with message
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  case $level in
    "INFO")
      echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
      ;;
    "WARN")
      echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
      ;;
    *)
      echo -e "${timestamp} - $message"
      ;;
  esac
}

# Check if a variable is set and not empty
check_env_var() {
  local var_name=$1
  local var_value=${!var_name:-}
  
  if [ -z "$var_value" ]; then
    log "ERROR" "Required environment variable $var_name is not set"
    return 1
  elif [ "$VERBOSE" = true ]; then
    log "INFO" "Environment variable $var_name is set"
  fi
  
  return 0
}

# Check if a Docker container is running and healthy
check_docker_container() {
  local container_name=$1
  
  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    log "WARN" "Docker command not found, skipping container checks"
    return 0
  fi
  
  # Check if container exists and is running
  if ! docker ps --format '{{.Names}}' | grep -q "$container_name"; then
    log "ERROR" "Docker container $container_name is not running"
    return 1
  fi
  
  # Check container health if available
  local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "health-check-not-available")
  
  if [ "$health_status" = "health-check-not-available" ]; then
    log "INFO" "Container $container_name is running (no health check available)"
  elif [ "$health_status" = "healthy" ]; then
    log "SUCCESS" "Container $container_name is healthy"
  else
    log "ERROR" "Container $container_name health check failed: $health_status"
    return 1
  fi
  
  return 0
}

# Check if a port is available (not in use)
check_port_available() {
  local port=$1
  local service_name=$2
  
  # Try to establish a connection to the port
  if nc -z localhost "$port" &>/dev/null; then
    log "SUCCESS" "Port $port is available for $service_name"
    return 0
  else
    log "ERROR" "Port $port is not available for $service_name"
    return 1
  fi
}

# Check if a port is in use by another process
check_port_conflict() {
  local port=$1
  local service_name=$2
  
  # Try to establish a connection to the port
  if nc -z localhost "$port" &>/dev/null; then
    log "ERROR" "Port $port is already in use (required by $service_name)"
    return 1
  else
    log "SUCCESS" "Port $port is free for $service_name"
    return 0
  fi
}

# Test database connection
test_db_connection() {
  local db_host=$1
  local db_port=$2
  local db_name=$3
  local db_user=$4
  local db_password=$5
  
  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    log "WARN" "PostgreSQL client not found, skipping database connection test"
    return 0
  fi
  
  # Try to connect to the database
  if PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -d "$db_name" -U "$db_user" -c "SELECT 1;" &>/dev/null; then
    log "SUCCESS" "Successfully connected to database $db_name on $db_host:$db_port"
    return 0
  else
    log "ERROR" "Failed to connect to database $db_name on $db_host:$db_port"
    return 1
  fi
}

# Test Redis connection
test_redis_connection() {
  local redis_host=$1
  local redis_port=$2
  
  # Check if redis-cli is available
  if ! command -v redis-cli &> /dev/null; then
    log "WARN" "Redis client not found, skipping Redis connection test"
    return 0
  fi
  
  # Try to connect to Redis
  if redis-cli -h "$redis_host" -p "$redis_port" ping &>/dev/null; then
    log "SUCCESS" "Successfully connected to Redis on $redis_host:$redis_port"
    return 0
  else
    log "ERROR" "Failed to connect to Redis on $redis_host:$redis_port"
    return 1
  fi
}

# ======================================================
# Validation Functions
# ======================================================

# Validate common environment variables
validate_common_env_vars() {
  log "INFO" "Validating common environment variables..."
  local errors=0
  
  # Node environment
  check_env_var "NODE_ENV" || ((errors++))
  
  # API and server configuration
  check_env_var "API_PORT" || ((errors++))
  check_env_var "API_HOST" || ((errors++))
  check_env_var "CORS_ORIGIN" || ((errors++))
  
  # JWT configuration
  check_env_var "JWT_SECRET" || ((errors++))
  check_env_var "JWT_EXPIRATION" || ((errors++))
  check_env_var "JWT_REFRESH_SECRET" || ((errors++))
  check_env_var "JWT_REFRESH_EXPIRATION" || ((errors++))
  
  # Logging configuration
  check_env_var "LOG_LEVEL" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All common environment variables are set"
    return 0
  else
    log "ERROR" "$errors common environment variables are missing"
    return 1
  fi
}

# Validate database environment variables
validate_database_env_vars() {
  log "INFO" "Validating database environment variables..."
  local errors=0
  
  # PostgreSQL configuration
  check_env_var "POSTGRES_HOST" || ((errors++))
  check_env_var "POSTGRES_PORT" || ((errors++))
  check_env_var "POSTGRES_DB" || ((errors++))
  check_env_var "POSTGRES_USER" || ((errors++))
  check_env_var "POSTGRES_PASSWORD" || ((errors++))
  
  # Database URL (used by Prisma)
  check_env_var "DATABASE_URL" || ((errors++))
  
  # Redis configuration
  check_env_var "REDIS_HOST" || ((errors++))
  check_env_var "REDIS_PORT" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All database environment variables are set"
    
    # Test database connection if variables are set
    if [ "$ENVIRONMENT" != "production" ]; then
      test_db_connection "$POSTGRES_HOST" "$POSTGRES_PORT" "$POSTGRES_DB" "$POSTGRES_USER" "$POSTGRES_PASSWORD" || ((errors++))
      test_redis_connection "$REDIS_HOST" "$REDIS_PORT" || ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
      return 0
    else
      return 6 # Database connection failed
    fi
  else
    log "ERROR" "$errors database environment variables are missing"
    return 2
  fi
}

# Validate Kafka environment variables
validate_kafka_env_vars() {
  log "INFO" "Validating Kafka environment variables..."
  local errors=0
  
  # Kafka configuration
  check_env_var "KAFKA_BROKERS" || ((errors++))
  check_env_var "KAFKA_CLIENT_ID" || ((errors++))
  check_env_var "KAFKA_GROUP_ID" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Kafka environment variables are set"
    return 0
  else
    log "ERROR" "$errors Kafka environment variables are missing"
    return 2
  fi
}

# Validate AWS environment variables
validate_aws_env_vars() {
  log "INFO" "Validating AWS environment variables..."
  local errors=0
  
  # AWS configuration
  check_env_var "AWS_REGION" || ((errors++))
  check_env_var "AWS_S3_BUCKET" || ((errors++))
  
  # AWS credentials (not required in production as IAM roles are used)
  if [ "$ENVIRONMENT" != "production" ]; then
    check_env_var "AWS_ACCESS_KEY_ID" || ((errors++))
    check_env_var "AWS_SECRET_ACCESS_KEY" || ((errors++))
  fi
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All AWS environment variables are set"
    return 0
  else
    log "ERROR" "$errors AWS environment variables are missing"
    return 2
  fi
}

# Validate API Gateway environment variables
validate_api_gateway_env_vars() {
  log "INFO" "Validating API Gateway environment variables..."
  local errors=0
  
  # API Gateway specific configuration
  check_env_var "RATE_LIMIT_WINDOW_MS" || ((errors++))
  check_env_var "RATE_LIMIT_MAX_REQUESTS" || ((errors++))
  check_env_var "AUTH_SERVICE_URL" || ((errors++))
  check_env_var "HEALTH_SERVICE_URL" || ((errors++))
  check_env_var "CARE_SERVICE_URL" || ((errors++))
  check_env_var "PLAN_SERVICE_URL" || ((errors++))
  check_env_var "GAMIFICATION_SERVICE_URL" || ((errors++))
  check_env_var "NOTIFICATION_SERVICE_URL" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All API Gateway environment variables are set"
    return 0
  else
    log "ERROR" "$errors API Gateway environment variables are missing"
    return 2
  fi
}

# Validate Auth Service environment variables
validate_auth_service_env_vars() {
  log "INFO" "Validating Auth Service environment variables..."
  local errors=0
  
  # Auth Service specific configuration
  check_env_var "AUTH_SERVICE_PORT" || ((errors++))
  check_env_var "PASSWORD_SALT_ROUNDS" || ((errors++))
  check_env_var "PASSWORD_RESET_EXPIRATION" || ((errors++))
  check_env_var "OAUTH_GOOGLE_CLIENT_ID" || ((errors++))
  check_env_var "OAUTH_GOOGLE_CLIENT_SECRET" || ((errors++))
  check_env_var "OAUTH_FACEBOOK_CLIENT_ID" || ((errors++))
  check_env_var "OAUTH_FACEBOOK_CLIENT_SECRET" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Auth Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Auth Service environment variables are missing"
    return 2
  fi
}

# Validate Health Service environment variables
validate_health_service_env_vars() {
  log "INFO" "Validating Health Service environment variables..."
  local errors=0
  
  # Health Service specific configuration
  check_env_var "HEALTH_SERVICE_PORT" || ((errors++))
  check_env_var "FHIR_API_URL" || ((errors++))
  check_env_var "FHIR_API_KEY" || ((errors++))
  check_env_var "TIMESCALE_HOST" || ((errors++))
  check_env_var "TIMESCALE_PORT" || ((errors++))
  check_env_var "TIMESCALE_DB" || ((errors++))
  check_env_var "TIMESCALE_USER" || ((errors++))
  check_env_var "TIMESCALE_PASSWORD" || ((errors++))
  check_env_var "WEARABLE_API_TIMEOUT_MS" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Health Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Health Service environment variables are missing"
    return 2
  fi
}

# Validate Care Service environment variables
validate_care_service_env_vars() {
  log "INFO" "Validating Care Service environment variables..."
  local errors=0
  
  # Care Service specific configuration
  check_env_var "CARE_SERVICE_PORT" || ((errors++))
  check_env_var "TELEMEDICINE_API_URL" || ((errors++))
  check_env_var "TELEMEDICINE_API_KEY" || ((errors++))
  check_env_var "PROVIDER_API_URL" || ((errors++))
  check_env_var "PROVIDER_API_KEY" || ((errors++))
  check_env_var "APPOINTMENT_REMINDER_MINUTES" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Care Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Care Service environment variables are missing"
    return 2
  fi
}

# Validate Plan Service environment variables
validate_plan_service_env_vars() {
  log "INFO" "Validating Plan Service environment variables..."
  local errors=0
  
  # Plan Service specific configuration
  check_env_var "PLAN_SERVICE_PORT" || ((errors++))
  check_env_var "INSURANCE_API_URL" || ((errors++))
  check_env_var "INSURANCE_API_KEY" || ((errors++))
  check_env_var "PAYMENT_API_URL" || ((errors++))
  check_env_var "PAYMENT_API_KEY" || ((errors++))
  check_env_var "CLAIM_DOCUMENT_MAX_SIZE_MB" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Plan Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Plan Service environment variables are missing"
    return 2
  fi
}

# Validate Gamification Service environment variables
validate_gamification_service_env_vars() {
  log "INFO" "Validating Gamification Service environment variables..."
  local errors=0
  
  # Gamification Service specific configuration
  check_env_var "GAMIFICATION_SERVICE_PORT" || ((errors++))
  check_env_var "ACHIEVEMENT_NOTIFICATION_ENABLED" || ((errors++))
  check_env_var "LEADERBOARD_UPDATE_INTERVAL_MINUTES" || ((errors++))
  check_env_var "QUEST_COMPLETION_TOPIC" || ((errors++))
  check_env_var "ACHIEVEMENT_UNLOCKED_TOPIC" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Gamification Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Gamification Service environment variables are missing"
    return 2
  fi
}

# Validate Notification Service environment variables
validate_notification_service_env_vars() {
  log "INFO" "Validating Notification Service environment variables..."
  local errors=0
  
  # Notification Service specific configuration
  check_env_var "NOTIFICATION_SERVICE_PORT" || ((errors++))
  check_env_var "EMAIL_PROVIDER" || ((errors++))
  check_env_var "EMAIL_FROM_ADDRESS" || ((errors++))
  check_env_var "SMS_PROVIDER" || ((errors++))
  check_env_var "PUSH_NOTIFICATION_PROVIDER" || ((errors++))
  check_env_var "RETRY_MAX_ATTEMPTS" || ((errors++))
  check_env_var "RETRY_INITIAL_DELAY_MS" || ((errors++))
  check_env_var "DLQ_ENABLED" || ((errors++))
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All Notification Service environment variables are set"
    return 0
  else
    log "ERROR" "$errors Notification Service environment variables are missing"
    return 2
  fi
}

# Validate Docker containers
validate_docker_containers() {
  log "INFO" "Validating Docker containers..."
  local errors=0
  
  # Check core infrastructure containers
  check_docker_container "postgres" || ((errors++))
  check_docker_container "redis" || ((errors++))
  
  # Check Kafka containers if used
  if [ -n "${KAFKA_BROKERS:-}" ]; then
    check_docker_container "kafka" || ((errors++))
    check_docker_container "zookeeper" || ((errors++))
  fi
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All required Docker containers are running"
    return 0
  else
    log "ERROR" "$errors Docker containers are not ready"
    return 3
  fi
}

# Validate service ports
validate_service_ports() {
  log "INFO" "Validating service ports..."
  local errors=0
  
  # Check if ports are available for services
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api-gateway" ]; then
    check_port_conflict "${API_PORT:-3000}" "API Gateway" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "auth" ]; then
    check_port_conflict "${AUTH_SERVICE_PORT:-3001}" "Auth Service" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "health" ]; then
    check_port_conflict "${HEALTH_SERVICE_PORT:-3002}" "Health Service" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "care" ]; then
    check_port_conflict "${CARE_SERVICE_PORT:-3003}" "Care Service" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "plan" ]; then
    check_port_conflict "${PLAN_SERVICE_PORT:-3004}" "Plan Service" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "gamification" ]; then
    check_port_conflict "${GAMIFICATION_SERVICE_PORT:-3005}" "Gamification Service" || ((errors++))
  fi
  
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "notification" ]; then
    check_port_conflict "${NOTIFICATION_SERVICE_PORT:-3006}" "Notification Service" || ((errors++))
  fi
  
  # Check if infrastructure ports are available
  check_port_available "${POSTGRES_PORT:-5432}" "PostgreSQL" || ((errors++))
  check_port_available "${REDIS_PORT:-6379}" "Redis" || ((errors++))
  
  if [ -n "${KAFKA_BROKERS:-}" ]; then
    # Extract port from KAFKA_BROKERS (assuming format: host:port)
    local kafka_port=$(echo "${KAFKA_BROKERS}" | cut -d ':' -f2)
    check_port_available "${kafka_port:-9092}" "Kafka" || ((errors++))
  fi
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All service ports are available"
    return 0
  else
    log "ERROR" "$errors service ports are not available"
    return 4
  fi
}

# Validate journey-specific requirements
validate_journey_specific() {
  log "INFO" "Validating journey-specific requirements..."
  local errors=0
  
  # Health Journey specific validation
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "health" ]; then
    # Check FHIR API connection if not in development mode
    if [ "$ENVIRONMENT" != "development" ] && [ -n "${FHIR_API_URL:-}" ] && [ -n "${FHIR_API_KEY:-}" ]; then
      log "INFO" "Checking FHIR API connection..."
      if ! curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${FHIR_API_KEY}" "${FHIR_API_URL}/metadata" | grep -q "200\|401\|403"; then
        log "ERROR" "FHIR API connection failed"
        ((errors++))
      else
        log "SUCCESS" "FHIR API connection successful"
      fi
    fi
  fi
  
  # Care Journey specific validation
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "care" ]; then
    # Check telemedicine API connection if not in development mode
    if [ "$ENVIRONMENT" != "development" ] && [ -n "${TELEMEDICINE_API_URL:-}" ] && [ -n "${TELEMEDICINE_API_KEY:-}" ]; then
      log "INFO" "Checking telemedicine API connection..."
      if ! curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TELEMEDICINE_API_KEY}" "${TELEMEDICINE_API_URL}/status" | grep -q "200\|401\|403"; then
        log "ERROR" "Telemedicine API connection failed"
        ((errors++))
      else
        log "SUCCESS" "Telemedicine API connection successful"
      fi
    fi
  fi
  
  # Plan Journey specific validation
  if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "plan" ]; then
    # Check insurance API connection if not in development mode
    if [ "$ENVIRONMENT" != "development" ] && [ -n "${INSURANCE_API_URL:-}" ] && [ -n "${INSURANCE_API_KEY:-}" ]; then
      log "INFO" "Checking insurance API connection..."
      if ! curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${INSURANCE_API_KEY}" "${INSURANCE_API_URL}/status" | grep -q "200\|401\|403"; then
        log "ERROR" "Insurance API connection failed"
        ((errors++))
      else
        log "SUCCESS" "Insurance API connection successful"
      fi
    fi
  fi
  
  if [ $errors -eq 0 ]; then
    log "SUCCESS" "All journey-specific validations passed"
    return 0
  else
    log "ERROR" "$errors journey-specific validations failed"
    return 5
  fi
}

# ======================================================
# Main Script
# ======================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    development|staging|production)
      ENVIRONMENT="$1"
      shift
      ;;
    all|api-gateway|auth|health|care|plan|gamification|notification)
      SERVICE="$1"
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: ./validate-env.sh [environment] [service] [--verbose] [--help]"
      echo "  environment: development|staging|production (default: development)"
      echo "  service: all|api-gateway|auth|health|care|plan|gamification|notification (default: all)"
      echo "  --verbose: Show more detailed output"
      echo "  --help: Show this help message"
      exit 0
      ;;
    *)
      log "ERROR" "Unknown argument: $1"
      echo "Usage: ./validate-env.sh [environment] [service] [--verbose] [--help]"
      exit 1
      ;;
  esac
done

log "INFO" "Starting environment validation for AUSTA SuperApp"
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Service: $SERVICE"

# Load environment variables from .env file if it exists
if [ -f ".env.${ENVIRONMENT}" ]; then
  log "INFO" "Loading environment variables from .env.${ENVIRONMENT}"
  set -a
  source ".env.${ENVIRONMENT}"
  set +a
elif [ -f ".env.local" ]; then
  log "INFO" "Loading environment variables from .env.local"
  set -a
  source ".env.local"
  set +a
elif [ -f ".env" ]; then
  log "INFO" "Loading environment variables from .env"
  set -a
  source ".env"
  set +a
fi

# Track validation errors
VALIDATION_ERRORS=0

# Run validations based on service
validate_common_env_vars || VALIDATION_ERRORS=$?

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api-gateway" ]; then
  validate_api_gateway_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_aws_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "auth" ]; then
  validate_auth_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "health" ]; then
  validate_health_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_aws_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
  validate_journey_specific || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "care" ]; then
  validate_care_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_aws_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
  validate_journey_specific || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "plan" ]; then
  validate_plan_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_aws_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
  validate_journey_specific || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "gamification" ]; then
  validate_gamification_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_kafka_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "notification" ]; then
  validate_notification_service_env_vars || VALIDATION_ERRORS=$?
  validate_database_env_vars || VALIDATION_ERRORS=$?
  validate_kafka_env_vars || VALIDATION_ERRORS=$?
  validate_aws_env_vars || VALIDATION_ERRORS=$?
  validate_service_ports || VALIDATION_ERRORS=$?
fi

# Check Docker containers in development environment
if [ "$ENVIRONMENT" = "development" ]; then
  validate_docker_containers || VALIDATION_ERRORS=$?
fi

# Print summary
if [ $VALIDATION_ERRORS -eq 0 ]; then
  log "SUCCESS" "All environment validations passed successfully"
  exit 0
else
  log "ERROR" "Environment validation failed with $VALIDATION_ERRORS errors"
  exit $VALIDATION_ERRORS
fi