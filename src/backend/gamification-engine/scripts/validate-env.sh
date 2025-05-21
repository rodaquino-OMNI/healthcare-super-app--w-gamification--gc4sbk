#!/bin/bash

# validate-env.sh
# Validates all required environment variables for the gamification-engine service
# before application startup to prevent runtime configuration errors.
#
# Usage: ./validate-env.sh
#
# This script checks for the presence of all required environment variables
# for the gamification-engine service and exits with a non-zero status code
# if any required variables are missing.
#
# The script validates the following categories of environment variables:
# - Database Configuration (PostgreSQL via Prisma)
# - Kafka Configuration (brokers, client ID, consumer group)
# - Kafka Connection Configuration (SSL, SASL)
# - Kafka Topic Configuration (health, care, plan journey events)
# - Dead Letter Queue Configuration (DLQ topic, retries)
# - Redis Configuration (host, port, auth, TLS)
# - Gamification Configuration (points, leaderboard settings)
#
# For numeric variables, the script also validates that the values are valid numbers.
#
# This script is typically called during container startup or in CI/CD pipelines
# to ensure all required configuration is present before attempting to start the service.

set -e

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
YELLOW="\033[33m"
GREEN="\033[32m"
RESET="\033[0m"

echo -e "${BOLD}Validating environment variables for gamification-engine...${RESET}"

# Track validation status
VALIDATION_FAILED=false

# Function to check if a required environment variable is set
check_required_var() {
  local var_name=$1
  local var_desc=$2
  
  if [ -z "${!var_name}" ]; then
    echo -e "${RED}ERROR: Required environment variable ${BOLD}$var_name${RESET}${RED} is not set.${RESET}"
    echo -e "       $var_desc"
    VALIDATION_FAILED=true
    return 1
  else
    echo -e "${GREEN}✓ ${var_name} is set${RESET}"
    return 0
  fi
}

# Function to check if an optional environment variable is set
check_optional_var() {
  local var_name=$1
  local var_desc=$2
  local default_value=$3
  
  if [ -z "${!var_name}" ]; then
    echo -e "${YELLOW}WARNING: Optional environment variable ${BOLD}$var_name${RESET}${YELLOW} is not set.${RESET}"
    echo -e "         $var_desc"
    echo -e "         Using default value: $default_value"
    return 1
  else
    echo -e "${GREEN}✓ ${var_name} is set${RESET}"
    return 0
  fi
}

# Function to check if a variable contains a valid number
check_numeric_var() {
  local var_name=$1
  
  if [[ -n "${!var_name}" ]] && ! [[ "${!var_name}" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}ERROR: Environment variable ${BOLD}$var_name${RESET}${RED} must be a number.${RESET}"
    echo -e "       Current value: ${!var_name}"
    VALIDATION_FAILED=true
    return 1
  fi
  return 0
}

echo -e "\n${BOLD}Database Configuration:${RESET}"
check_required_var "DATABASE_URL" "The connection URL for the PostgreSQL database used by Prisma."

echo -e "\n${BOLD}Kafka Configuration:${RESET}"
check_required_var "KAFKA_BROKERS" "Comma-separated list of Kafka broker addresses (e.g., 'localhost:9092')."
check_required_var "KAFKA_CLIENT_ID" "Client ID for Kafka connection (e.g., 'gamification-engine')."
check_optional_var "KAFKA_GROUP_ID" "Consumer group ID for Kafka consumers." "gamification-consumer-group"

# Check Kafka connection variables
echo -e "\n${BOLD}Kafka Connection Configuration:${RESET}"
check_optional_var "KAFKA_SSL_ENABLED" "Enable SSL for Kafka connection (true/false)." "false"
check_optional_var "KAFKA_SASL_ENABLED" "Enable SASL authentication for Kafka (true/false)." "false"
check_optional_var "KAFKA_SASL_USERNAME" "SASL username for Kafka authentication." ""
check_optional_var "KAFKA_SASL_PASSWORD" "SASL password for Kafka authentication." ""

# Check Kafka topic variables
echo -e "\n${BOLD}Kafka Topic Configuration:${RESET}"
check_required_var "KAFKA_TOPIC_HEALTH_EVENTS" "Kafka topic for health journey events (e.g., 'health.events')."
check_required_var "KAFKA_TOPIC_CARE_EVENTS" "Kafka topic for care journey events (e.g., 'care.events')."
check_required_var "KAFKA_TOPIC_PLAN_EVENTS" "Kafka topic for plan journey events (e.g., 'plan.events')."

# Check Dead Letter Queue configuration
echo -e "\n${BOLD}Dead Letter Queue Configuration:${RESET}"
check_optional_var "KAFKA_DLQ_ENABLED" "Enable Dead Letter Queue for failed events (true/false)." "true"
check_optional_var "KAFKA_DLQ_TOPIC" "Kafka topic for Dead Letter Queue." "gamification-dlq"
check_optional_var "KAFKA_MAX_RETRIES" "Maximum number of retries for failed events." "3"
check_numeric_var "KAFKA_MAX_RETRIES"

echo -e "\n${BOLD}Redis Configuration:${RESET}"
check_required_var "REDIS_HOST" "Redis server hostname (e.g., 'localhost')."
check_required_var "REDIS_PORT" "Redis server port (e.g., '6379')."
check_numeric_var "REDIS_PORT"
check_optional_var "REDIS_PASSWORD" "Password for Redis authentication (if required)." "<none>"
check_optional_var "REDIS_DB" "Redis database number." "0"
check_numeric_var "REDIS_DB"
check_optional_var "REDIS_TLS_ENABLED" "Enable TLS for Redis connection (true/false)." "false"
check_optional_var "REDIS_KEY_PREFIX" "Prefix for Redis keys." "gamification:"

echo -e "\n${BOLD}Gamification Configuration:${RESET}"
check_optional_var "GAMIFICATION_DEFAULT_POINTS" "Default points awarded for events without specific point values." "10"
check_numeric_var "GAMIFICATION_DEFAULT_POINTS"
check_optional_var "GAMIFICATION_LEADERBOARD_MAX_ENTRIES" "Maximum number of entries in leaderboards." "100"
check_numeric_var "GAMIFICATION_LEADERBOARD_MAX_ENTRIES"
check_optional_var "GAMIFICATION_LEADERBOARD_TTL" "Cache TTL for leaderboards in seconds." "300"
check_numeric_var "GAMIFICATION_LEADERBOARD_TTL"

# Check if any validation failed
if [ "$VALIDATION_FAILED" = true ]; then
  echo -e "\n${RED}${BOLD}Environment validation failed!${RESET}${RED} Please set the required environment variables and try again.${RESET}"
  echo -e "For local development, you can set these variables in a .env file in the project root."
  echo -e "For production, ensure these variables are set in your deployment configuration."
  exit 1
else
  echo -e "\n${GREEN}${BOLD}Environment validation successful!${RESET}${GREEN} All required variables are set.${RESET}"
  exit 0
fi