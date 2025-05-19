#!/bin/bash

# validate-env.sh
# Purpose: Validates all required environment variables for the gamification-engine service
# before application startup to prevent runtime configuration errors.
#
# This script checks for critical variables including database connection, Kafka configuration,
# Redis settings, and gamification-specific environment variables.
#
# Usage: ./validate-env.sh
# Make sure to chmod +x this script before using it.

# Set strict mode to exit on any error
set -e

# Text formatting for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Initialize error counter
ERROR_COUNT=0

#===========================================
# Helper Functions
#===========================================

# Function to check if an environment variable is set
check_env_var() {
  local var_name=$1
  local var_description=$2
  local is_optional=${3:-false}
  
  if [ -z "${!var_name}" ]; then
    if [ "$is_optional" = "true" ]; then
      echo -e "${YELLOW}WARNING:${NC} Optional environment variable ${BLUE}$var_name${NC} is not set ($var_description)"
    else
      echo -e "${RED}ERROR:${NC} Required environment variable ${BLUE}$var_name${NC} is not set ($var_description)"
      ERROR_COUNT=$((ERROR_COUNT+1))
    fi
    return 1
  else
    echo -e "${GREEN}\u2713${NC} Environment variable ${BLUE}$var_name${NC} is set"
    return 0
  fi
}

# Function to validate the format of environment variables
validate_format() {
  local var_name=$1
  local pattern=$2
  local error_message=$3
  local is_optional=${4:-false}
  
  # Skip validation if the variable is optional and not set
  if [ -z "${!var_name}" ] && [ "$is_optional" = "true" ]; then
    return 0
  fi
  
  # Skip validation if the variable is not set (error already reported by check_env_var)
  if [ -z "${!var_name}" ]; then
    return 1
  fi
  
  if ! echo "${!var_name}" | grep -E "$pattern" > /dev/null; then
    echo -e "${RED}ERROR:${NC} Environment variable ${BLUE}$var_name${NC} has invalid format: $error_message"
    ERROR_COUNT=$((ERROR_COUNT+1))
    return 1
  else
    echo -e "${GREEN}\u2713${NC} Environment variable ${BLUE}$var_name${NC} has valid format"
  fi
  
  return 0
}

# Function to validate numeric values are within a valid range
validate_range() {
  local var_name=$1
  local min=$2
  local max=$3
  local is_optional=${4:-false}
  
  # Skip validation if the variable is optional and not set
  if [ -z "${!var_name}" ] && [ "$is_optional" = "true" ]; then
    return 0
  fi
  
  # Skip validation if the variable is not set (error already reported by check_env_var)
  if [ -z "${!var_name}" ]; then
    return 1
  fi
  
  # Check if the value is a number
  if ! [[ "${!var_name}" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}ERROR:${NC} Environment variable ${BLUE}$var_name${NC} must be a number"
    ERROR_COUNT=$((ERROR_COUNT+1))
    return 1
  fi
  
  # Check if the value is within the specified range
  if [ "${!var_name}" -lt "$min" ] || [ "${!var_name}" -gt "$max" ]; then
    echo -e "${RED}ERROR:${NC} Environment variable ${BLUE}$var_name${NC} must be between $min and $max"
    ERROR_COUNT=$((ERROR_COUNT+1))
    return 1
  else
    echo -e "${GREEN}\u2713${NC} Environment variable ${BLUE}$var_name${NC} is within valid range"
  fi
  
  return 0
}

# Function to check if a service is reachable (optional check)
check_service_reachable() {
  local var_name=$1
  local timeout=${2:-5}
  local is_optional=${3:-true}
  
  # Skip validation if the variable is optional and not set
  if [ -z "${!var_name}" ] && [ "$is_optional" = "true" ]; then
    return 0
  fi
  
  # Skip validation if the variable is not set (error already reported by check_env_var)
  if [ -z "${!var_name}" ]; then
    return 1
  fi
  
  # Extract host and port from URL
  local url="${!var_name}"
  local host=$(echo "$url" | sed -E 's|^(http|https)://([^:/]+).*$|\2|')
  local port=$(echo "$url" | sed -E 's|^(http|https)://[^:]+:([0-9]+).*$|\2|')
  
  # If port is not specified, use default ports
  if [ "$port" = "$url" ]; then
    if [[ "$url" == https://* ]]; then
      port=443
    else
      port=80
    fi
  fi
  
  # Check if the service is reachable
  if command -v nc >/dev/null 2>&1; then
    if nc -z -w "$timeout" "$host" "$port" >/dev/null 2>&1; then
      echo -e "${GREEN}\u2713${NC} Service at ${BLUE}$var_name${NC} is reachable"
      return 0
    else
      if [ "$is_optional" = "true" ]; then
        echo -e "${YELLOW}WARNING:${NC} Service at ${BLUE}$var_name${NC} is not reachable"
        return 0
      else
        echo -e "${RED}ERROR:${NC} Service at ${BLUE}$var_name${NC} is not reachable"
        ERROR_COUNT=$((ERROR_COUNT+1))
        return 1
      fi
    fi
  else
    echo -e "${YELLOW}WARNING:${NC} Cannot check if service at ${BLUE}$var_name${NC} is reachable (nc command not available)"
    return 0
  fi
}

# Check if database is reachable
check_database_connectivity() {
  local db_url="$DATABASE_URL"
  local timeout=5
  
  if [ -z "$db_url" ]; then
    return 1
  fi
  
  # Extract host and port from DATABASE_URL
  local host=$(echo "$db_url" | sed -E 's|^postgresql://[^:]+:[^@]+@([^:/]+).*$|\1|')
  local port=$(echo "$db_url" | sed -E 's|^postgresql://[^:]+:[^@]+@[^:]+:([0-9]+).*$|\1|')
  
  # If port is not specified, use default PostgreSQL port
  if [ "$port" = "$db_url" ]; then
    port=5432
  fi
  
  if command -v nc >/dev/null 2>&1; then
    if nc -z -w "$timeout" "$host" "$port" >/dev/null 2>&1; then
      echo -e "${GREEN}\u2713${NC} PostgreSQL database at ${BLUE}$host:$port${NC} is reachable"
    else
      echo -e "${RED}ERROR:${NC} PostgreSQL database at ${BLUE}$host:$port${NC} is not reachable"
      echo -e "${RED}ERROR:${NC} The application will not function without database connectivity"
      ERROR_COUNT=$((ERROR_COUNT+1))
    fi
  else
    echo -e "${YELLOW}WARNING:${NC} Cannot check if PostgreSQL database is reachable (nc command not available)"
  fi
  
  return 0
}

# Check if Kafka brokers are reachable
check_kafka_brokers() {
  local brokers="$KAFKA_BROKERS"
  local timeout=5
  local success=true
  
  if [ -z "$brokers" ]; then
    return 1
  fi
  
  echo -e "${BLUE}Checking Kafka broker connectivity:${NC}"
  
  # Split the brokers string by comma and check each broker
  IFS=',' read -ra BROKER_ARRAY <<< "$brokers"
  for broker in "${BROKER_ARRAY[@]}"; do
    # Extract host and port
    local host=$(echo "$broker" | cut -d ':' -f 1)
    local port=$(echo "$broker" | cut -d ':' -f 2)
    
    if command -v nc >/dev/null 2>&1; then
      if nc -z -w "$timeout" "$host" "$port" >/dev/null 2>&1; then
        echo -e "  ${GREEN}\u2713${NC} Kafka broker ${BLUE}$broker${NC} is reachable"
      else
        echo -e "  ${YELLOW}WARNING:${NC} Kafka broker ${BLUE}$broker${NC} is not reachable"
        success=false
      fi
    else
      echo -e "  ${YELLOW}WARNING:${NC} Cannot check if Kafka broker ${BLUE}$broker${NC} is reachable (nc command not available)"
      return 0
    fi
  done
  
  if [ "$success" = "false" ]; then
    echo -e "${YELLOW}WARNING:${NC} Some Kafka brokers are not reachable. The application may not function correctly."
  fi
  
  return 0
}

# Check if Redis is reachable
check_redis_connectivity() {
  local host="$REDIS_HOST"
  local port="$REDIS_PORT"
  local timeout=5
  
  if [ -z "$host" ] || [ -z "$port" ]; then
    return 1
  fi
  
  if command -v nc >/dev/null 2>&1; then
    if nc -z -w "$timeout" "$host" "$port" >/dev/null 2>&1; then
      echo -e "${GREEN}\u2713${NC} Redis server at ${BLUE}$host:$port${NC} is reachable"
    else
      echo -e "${YELLOW}WARNING:${NC} Redis server at ${BLUE}$host:$port${NC} is not reachable"
      echo -e "${YELLOW}WARNING:${NC} Leaderboard functionality may not work correctly"
    fi
  else
    echo -e "${YELLOW}WARNING:${NC} Cannot check if Redis server is reachable (nc command not available)"
  fi
  
  return 0
}

# Print header
echo -e "\n${BLUE}=== Validating Gamification Engine Environment Variables ===${NC}\n"

# ==========================================
# Database Configuration
# ==========================================
echo -e "\n${BLUE}Checking Database Configuration:${NC}"

check_env_var "DATABASE_URL" "PostgreSQL connection string for gamification data"
# Validate DATABASE_URL format
validate_format "DATABASE_URL" "^postgresql://.*" "Should start with postgresql:// followed by connection details"
# Run database connectivity check
check_database_connectivity

# ==========================================
# Kafka Configuration for Event Processing
# ==========================================
echo -e "\n${BLUE}Checking Kafka Configuration:${NC}"

check_env_var "KAFKA_BROKERS" "Comma-separated list of Kafka brokers (e.g., localhost:9092)"
# Validate KAFKA_BROKERS format
validate_format "KAFKA_BROKERS" "^[^,]+(,[^,]+)*$" "Should be a comma-separated list of host:port values"
# Run Kafka broker check
check_kafka_brokers

check_env_var "KAFKA_CLIENT_ID" "Client identifier for Kafka connection"
check_env_var "KAFKA_GROUP_ID" "Consumer group ID for Kafka consumers"

# Journey-specific Kafka topics
check_env_var "KAFKA_TOPIC_HEALTH_EVENTS" "Kafka topic for health journey events"
check_env_var "KAFKA_TOPIC_CARE_EVENTS" "Kafka topic for care journey events"
check_env_var "KAFKA_TOPIC_PLAN_EVENTS" "Kafka topic for plan journey events"

# Event processing configuration
check_env_var "KAFKA_MAX_RETRIES" "Maximum number of retries for failed Kafka operations" true
check_env_var "KAFKA_RETRY_INTERVAL" "Interval in ms between retries for Kafka operations" true
check_env_var "KAFKA_CONSUMER_CONCURRENCY" "Number of concurrent Kafka consumers" true

# ==========================================
# Redis Configuration for Leaderboards
# ==========================================
echo -e "\n${BLUE}Checking Redis Configuration:${NC}"

check_env_var "REDIS_HOST" "Redis server hostname"
check_env_var "REDIS_PORT" "Redis server port"
# Validate REDIS_PORT format
validate_format "REDIS_PORT" "^[0-9]+$" "Should be a valid port number (numeric value)"
# Validate REDIS_PORT range
validate_range "REDIS_PORT" 1 65535 "Port number must be between 1 and 65535"
# Run Redis connectivity check
check_redis_connectivity

check_env_var "REDIS_PASSWORD" "Redis server password" true
check_env_var "REDIS_DB" "Redis database number" true
check_env_var "REDIS_TTL" "Time-to-live for cached leaderboard data in seconds" true
check_env_var "REDIS_PREFIX" "Prefix for Redis keys to avoid collisions" true

# ==========================================
# Gamification Configuration
# ==========================================
echo -e "\n${BLUE}Checking Gamification Configuration:${NC}"

# Default point configuration
check_env_var "DEFAULT_ACHIEVEMENT_POINTS" "Default points awarded for achievements" true
check_env_var "DEFAULT_QUEST_POINTS" "Default points awarded for completing quests" true
check_env_var "DEFAULT_DAILY_POINTS" "Default points awarded for daily activities" true

# Leaderboard configuration
check_env_var "LEADERBOARD_UPDATE_INTERVAL" "Interval in ms for leaderboard updates" true
check_env_var "LEADERBOARD_MAX_ENTRIES" "Maximum number of entries in leaderboards" true
# Validate LEADERBOARD_MAX_ENTRIES range if set
validate_format "LEADERBOARD_MAX_ENTRIES" "^[0-9]+$" "Should be a positive number" true
validate_range "LEADERBOARD_MAX_ENTRIES" 10 1000 true
check_env_var "LEADERBOARD_REFRESH_CRON" "Cron expression for leaderboard refresh job" true

# Achievement configuration
check_env_var "ACHIEVEMENT_NOTIFICATION_ENABLED" "Enable/disable achievement notifications" true
check_env_var "ACHIEVEMENT_BATCH_SIZE" "Batch size for processing achievements" true

# ==========================================
# Notification Integration
# ==========================================
echo -e "\n${BLUE}Checking Notification Integration:${NC}"

check_env_var "NOTIFICATION_SERVICE_URL" "URL of the notification service" true
# Validate NOTIFICATION_SERVICE_URL format
validate_format "NOTIFICATION_SERVICE_URL" "^https?://.*" "Should be a valid URL starting with http:// or https://" true
# Check if notification service is reachable (optional)
if [ "$NOTIFICATION_ENABLED" = "true" ] && [ ! -z "$NOTIFICATION_SERVICE_URL" ]; then
  check_service_reachable "NOTIFICATION_SERVICE_URL" 5 true
fi
check_env_var "NOTIFICATION_KAFKA_TOPIC" "Kafka topic for sending notifications" true
check_env_var "NOTIFICATION_ENABLED" "Enable/disable sending notifications" true

# ==========================================
# Service Configuration
# ==========================================
echo -e "\n${BLUE}Checking Service Configuration:${NC}"

check_env_var "PORT" "Port on which the gamification engine service will listen" true
check_env_var "NODE_ENV" "Node environment (development, staging, production)"
# Validate NODE_ENV format
validate_format "NODE_ENV" "^(development|staging|production)$" "Should be one of: development, staging, production"
check_env_var "LOG_LEVEL" "Logging level (debug, info, warn, error)" true
# Validate LOG_LEVEL format
validate_format "LOG_LEVEL" "^(debug|info|warn|error)$" "Should be one of: debug, info, warn, error" true
check_env_var "API_PREFIX" "Prefix for API endpoints" true
check_env_var "CORS_ORIGIN" "Allowed CORS origins" true

# ==========================================
# Validation Results
# ==========================================
echo -e "\n${BLUE}=== Validation Results ===${NC}"

# Print summary of checks
echo -e "\n${BLUE}Environment Variable Summary:${NC}"
echo -e "- Database Configuration: $([ -z "$DATABASE_URL" ] && echo "${RED}Missing${NC}" || echo "${GREEN}Set${NC}")"
echo -e "- Kafka Configuration: $([ -z "$KAFKA_BROKERS" ] && echo "${RED}Missing${NC}" || echo "${GREEN}Set${NC}")"
echo -e "- Redis Configuration: $([ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ] && echo "${RED}Missing${NC}" || echo "${GREEN}Set${NC}")"
echo -e "- Notification Integration: $([ -z "$NOTIFICATION_SERVICE_URL" ] && echo "${YELLOW}Not configured${NC}" || echo "${GREEN}Configured${NC}")"
echo -e "- Service Configuration: $([ -z "$NODE_ENV" ] && echo "${RED}Missing${NC}" || echo "${GREEN}Set${NC}")"

# Print final result
if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "\n${RED}Validation failed with $ERROR_COUNT error(s).${NC}"
  echo -e "${YELLOW}Please set all required environment variables before starting the service.${NC}"
  echo -e "${YELLOW}Refer to .env.local.example for a list of all required variables.${NC}\n"
  exit 1
else
  echo -e "\n${GREEN}All required environment variables are set!${NC}"
  echo -e "${GREEN}The gamification-engine service is ready to start.${NC}\n"
  exit 0
fi