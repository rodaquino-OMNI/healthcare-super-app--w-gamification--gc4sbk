#!/bin/bash

# AUSTA SuperApp Environment Validation Script
# This script validates that all required environment variables are set
# before starting Docker services.
#
# Part of the AUSTA SuperApp refactoring project
# Implements environment validation mechanisms as specified in section 0.2.3 Phase 5

# Set strict error handling
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

# Initialize counters
TOTAL_CHECKS=0
FAILED_CHECKS=0

# Print header
echo -e "\n${BOLD}${BLUE}AUSTA SuperApp Environment Validation${RESET}\n"
echo -e "${CYAN}Checking required environment variables...${RESET}"
echo -e "${YELLOW}This script validates the environment configuration for the AUSTA SuperApp${RESET}"
echo -e "${YELLOW}Required variables must be set, while optional variables can be omitted${RESET}\n"

# Check if running in Docker context
if [ -f /.dockerenv ]; then
    echo -e "${CYAN}Running inside Docker container${RESET}\n"
else
    echo -e "${CYAN}Running in local environment${RESET}\n"
fi

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local var_description=$2
    local journey=$3
    local optional=$4
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    
    if [ -z "$var_value" ]; then
        if [ "$optional" = "true" ]; then
            if [ -n "$journey" ]; then
                echo -e "${YELLOW}⚠ ${var_name}${RESET} - ${var_description} (${YELLOW}${journey} Journey${RESET}) - Optional"
            else
                echo -e "${YELLOW}⚠ ${var_name}${RESET} - ${var_description} - Optional"
            fi
            return 0
        else
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            if [ -n "$journey" ]; then
                echo -e "${RED}✗ ${var_name}${RESET} - ${var_description} (${YELLOW}${journey} Journey${RESET})"
            else
                echo -e "${RED}✗ ${var_name}${RESET} - ${var_description}"
            fi
            return 1
        fi
    else
        if [ -n "$journey" ]; then
            echo -e "${GREEN}✓ ${var_name}${RESET} - ${var_description} (${YELLOW}${journey} Journey${RESET})"
        else
            echo -e "${GREEN}✓ ${var_name}${RESET} - ${var_description}"
        fi
        return 0
    fi
}

# Function to check URL format
check_url() {
    local var_name=$1
    local var_value=${!var_name}
    local var_description=$2
    local journey=$3
    local optional=$4
    
    check_var "$var_name" "$var_description" "$journey" "$optional"
    if [ $? -eq 0 ] && [ -n "$var_value" ]; then
        # Simple URL validation
        if [[ ! "$var_value" =~ ^https?:// ]]; then
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            echo -e "${RED}  └─ Invalid URL format for ${var_name}. Must start with http:// or https://${RESET}"
            return 1
        fi
    fi
}

# Function to check database connection string
check_db_connection() {
    local var_name=$1
    local var_value=${!var_name}
    local var_description=$2
    local journey=$3
    local optional=$4
    
    check_var "$var_name" "$var_description" "$journey" "$optional"
    if [ $? -eq 0 ] && [ -n "$var_value" ]; then
        # Simple database URL validation
        if [[ ! "$var_value" =~ ^postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+ ]]; then
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            echo -e "${RED}  └─ Invalid database connection format for ${var_name}${RESET}"
            echo -e "${RED}  └─ Expected format: postgresql://user:password@host:port/database${RESET}"
            return 1
        fi
    fi
}

# Function to check port number
check_port() {
    local var_name=$1
    local var_value=${!var_name}
    local var_description=$2
    local journey=$3
    
    check_var "$var_name" "$var_description" "$journey"
    if [ $? -eq 0 ]; then
        # Port number validation
        if ! [[ "$var_value" =~ ^[0-9]+$ ]] || [ "$var_value" -lt 1 ] || [ "$var_value" -gt 65535 ]; then
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            echo -e "${RED}  └─ Invalid port number for ${var_name}. Must be between 1-65535${RESET}"
            return 1
        fi
    fi
}

# Function to check if a port is available
check_port_available() {
    local port=$1
    local service=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    
    # Skip check if port is not set
    if [ -z "$port" ]; then
        echo -e "${YELLOW}⚠ Port check skipped for ${service} - port not set${RESET}"
        return 0
    fi
    
    # Check if port is in use
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost "$port" >/dev/null 2>&1; then
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            echo -e "${RED}✗ Port ${port} is already in use (required by ${service})${RESET}"
            return 1
        else
            echo -e "${GREEN}✓ Port ${port} is available for ${service}${RESET}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠ Cannot check port availability - 'nc' command not found${RESET}"
        return 0
    fi
}

# Print section header
print_section() {
    echo -e "\n${BOLD}${MAGENTA}$1${RESET}"
}

# ===== SHARED ENVIRONMENT VARIABLES =====
print_section "Shared Environment Variables"

# Node environment
check_var "NODE_ENV" "Node environment (development, staging, production)"

# API and service URLs
check_url "API_BASE_URL" "Base URL for API Gateway"
check_url "AUTH_SERVICE_URL" "Auth Service URL"

# Logging and monitoring
check_var "LOG_LEVEL" "Log level (debug, info, warn, error)" "" "true"
check_var "ENABLE_REQUEST_LOGGING" "Enable request logging (true/false)" "" "true"
check_var "TRACING_ENABLED" "Enable distributed tracing (true/false)" "" "true"
check_var "METRICS_ENABLED" "Enable metrics collection (true/false)" "" "true"

# Kafka configuration
check_var "KAFKA_BROKERS" "Kafka broker connection string"
check_var "KAFKA_CLIENT_ID" "Kafka client identifier"
check_var "KAFKA_CONSUMER_GROUP_ID" "Kafka consumer group ID"
check_var "KAFKA_SSL_ENABLED" "Enable Kafka SSL (true/false)" "" "true"

# Redis configuration
check_var "REDIS_HOST" "Redis host"
check_port "REDIS_PORT" "Redis port"
check_var "REDIS_PASSWORD" "Redis password"
check_var "REDIS_SSL_ENABLED" "Enable Redis SSL (true/false)" "" "true"

# JWT configuration
check_var "JWT_SECRET" "JWT secret key"
check_var "JWT_EXPIRATION" "JWT expiration time in seconds"
check_var "REFRESH_TOKEN_EXPIRATION" "Refresh token expiration time in seconds"
check_var "JWT_ISSUER" "JWT issuer" "" "true"

# ===== API GATEWAY =====
print_section "API Gateway Configuration"

check_port "API_GATEWAY_PORT" "API Gateway port"
check_var "CORS_ALLOWED_ORIGINS" "CORS allowed origins (comma-separated)"
check_var "RATE_LIMIT_WINDOW_MS" "Rate limiting window in milliseconds"
check_var "RATE_LIMIT_MAX_REQUESTS" "Maximum requests per rate limit window"
check_var "API_GATEWAY_GRAPHQL_PATH" "GraphQL endpoint path" "" "true"
check_var "API_GATEWAY_REST_PREFIX" "REST API prefix" "" "true"
check_var "API_GATEWAY_TIMEOUT_MS" "Request timeout in milliseconds" "" "true"
check_var "API_GATEWAY_MAX_PAYLOAD_SIZE" "Maximum payload size in bytes" "" "true"

# ===== AUTH SERVICE =====
print_section "Auth Service Configuration"

check_port "AUTH_SERVICE_PORT" "Auth Service port"
check_db_connection "AUTH_DATABASE_URL" "Auth Service database connection"
check_var "PASSWORD_SALT_ROUNDS" "Password hashing salt rounds"
check_var "TOKEN_BLACKLIST_ENABLED" "Enable token blacklisting (true/false)"
check_var "AUTH_OAUTH_ENABLED" "Enable OAuth authentication (true/false)" "" "true"
check_var "AUTH_OAUTH_GOOGLE_CLIENT_ID" "Google OAuth client ID" "" "true"
check_var "AUTH_OAUTH_GOOGLE_CLIENT_SECRET" "Google OAuth client secret" "" "true"
check_var "AUTH_OAUTH_FACEBOOK_CLIENT_ID" "Facebook OAuth client ID" "" "true"
check_var "AUTH_OAUTH_FACEBOOK_CLIENT_SECRET" "Facebook OAuth client secret" "" "true"
check_var "AUTH_MFA_ENABLED" "Enable multi-factor authentication (true/false)" "" "true"

# ===== HEALTH JOURNEY =====
print_section "Health Journey Configuration"

check_port "HEALTH_SERVICE_PORT" "Health Service port" "Health"
check_db_connection "HEALTH_DATABASE_URL" "Health Service database connection" "Health"
check_var "HEALTH_METRICS_RETENTION_DAYS" "Health metrics retention period in days" "Health"
check_url "HEALTH_FHIR_API_URL" "FHIR API URL for health data" "Health"
check_var "HEALTH_FHIR_API_KEY" "FHIR API key" "Health"
check_var "HEALTH_FHIR_API_VERSION" "FHIR API version" "Health" "true"
check_var "HEALTH_METRICS_BATCH_SIZE" "Metrics processing batch size" "Health" "true"
check_var "HEALTH_GOALS_ENABLED" "Enable health goals feature" "Health" "true"
check_var "HEALTH_INSIGHTS_ENABLED" "Enable health insights feature" "Health" "true"
check_var "HEALTH_DEVICE_SYNC_INTERVAL_MINUTES" "Device sync interval in minutes" "Health" "true"

# Health Journey Wearable Integrations
check_url "HEALTH_FITBIT_API_URL" "Fitbit API URL" "Health" "true"
check_var "HEALTH_FITBIT_CLIENT_ID" "Fitbit client ID" "Health" "true"
check_var "HEALTH_FITBIT_CLIENT_SECRET" "Fitbit client secret" "Health" "true"
check_url "HEALTH_GARMIN_API_URL" "Garmin API URL" "Health" "true"
check_var "HEALTH_GARMIN_CLIENT_ID" "Garmin client ID" "Health" "true"
check_var "HEALTH_GARMIN_CLIENT_SECRET" "Garmin client secret" "Health" "true"

# ===== CARE JOURNEY =====
print_section "Care Journey Configuration"

check_port "CARE_SERVICE_PORT" "Care Service port" "Care"
check_db_connection "CARE_DATABASE_URL" "Care Service database connection" "Care"
check_url "TELEMEDICINE_PROVIDER_API_URL" "Telemedicine provider API URL" "Care"
check_var "TELEMEDICINE_PROVIDER_API_KEY" "Telemedicine provider API key" "Care"
check_var "TELEMEDICINE_SESSION_TIMEOUT_MINUTES" "Telemedicine session timeout in minutes" "Care" "true"
check_var "CARE_APPOINTMENT_REMINDER_ENABLED" "Enable appointment reminders" "Care" "true"
check_var "CARE_APPOINTMENT_REMINDER_HOURS_BEFORE" "Hours before appointment to send reminder" "Care" "true"
check_var "CARE_PROVIDER_SEARCH_RADIUS_KM" "Provider search radius in kilometers" "Care" "true"
check_var "CARE_MEDICATION_REMINDER_ENABLED" "Enable medication reminders" "Care" "true"

# Care Journey Provider Integrations
check_url "CARE_PROVIDER_DIRECTORY_API_URL" "Provider directory API URL" "Care" "true"
check_var "CARE_PROVIDER_DIRECTORY_API_KEY" "Provider directory API key" "Care" "true"
check_url "CARE_SYMPTOM_CHECKER_API_URL" "Symptom checker API URL" "Care" "true"
check_var "CARE_SYMPTOM_CHECKER_API_KEY" "Symptom checker API key" "Care" "true"

# ===== PLAN JOURNEY =====
print_section "Plan Journey Configuration"

check_port "PLAN_SERVICE_PORT" "Plan Service port" "Plan"
check_db_connection "PLAN_DATABASE_URL" "Plan Service database connection" "Plan"
check_url "INSURANCE_API_URL" "Insurance provider API URL" "Plan"
check_var "INSURANCE_API_KEY" "Insurance provider API key" "Plan"
check_var "PLAN_COVERAGE_CACHE_TTL_MINUTES" "Coverage information cache TTL in minutes" "Plan" "true"
check_var "PLAN_BENEFIT_VERIFICATION_ENABLED" "Enable benefit verification" "Plan" "true"
check_var "PLAN_CLAIM_SUBMISSION_ENABLED" "Enable claim submission" "Plan" "true"
check_var "PLAN_DOCUMENT_UPLOAD_ENABLED" "Enable document upload" "Plan" "true"
check_var "PLAN_DOCUMENT_STORAGE_PATH" "Document storage path" "Plan" "true"

# Plan Journey Insurance Integrations
check_url "PLAN_CLAIMS_PROCESSING_API_URL" "Claims processing API URL" "Plan" "true"
check_var "PLAN_CLAIMS_PROCESSING_API_KEY" "Claims processing API key" "Plan" "true"
check_url "PLAN_BENEFITS_API_URL" "Benefits API URL" "Plan" "true"
check_var "PLAN_BENEFITS_API_KEY" "Benefits API key" "Plan" "true"

# ===== GAMIFICATION ENGINE =====
print_section "Gamification Engine Configuration"

check_port "GAMIFICATION_SERVICE_PORT" "Gamification Engine port"
check_db_connection "GAMIFICATION_DATABASE_URL" "Gamification Engine database connection"
check_var "GAMIFICATION_KAFKA_TOPIC_PREFIX" "Kafka topic prefix for gamification events"
check_var "GAMIFICATION_EVENT_PROCESSING_BATCH_SIZE" "Event processing batch size"
check_var "GAMIFICATION_ACHIEVEMENT_NOTIFICATION_ENABLED" "Enable achievement notifications" "" "true"
check_var "GAMIFICATION_LEADERBOARD_REFRESH_INTERVAL_MINUTES" "Leaderboard refresh interval in minutes" "" "true"
check_var "GAMIFICATION_POINTS_EXPIRATION_DAYS" "Points expiration period in days" "" "true"
check_var "GAMIFICATION_QUEST_AUTO_ENROLLMENT_ENABLED" "Enable automatic quest enrollment" "" "true"

# Journey-specific Gamification Settings
check_var "GAMIFICATION_HEALTH_JOURNEY_ENABLED" "Enable gamification for Health Journey" "Health" "true"
check_var "GAMIFICATION_CARE_JOURNEY_ENABLED" "Enable gamification for Care Journey" "Care" "true"
check_var "GAMIFICATION_PLAN_JOURNEY_ENABLED" "Enable gamification for Plan Journey" "Plan" "true"

# Gamification Rules Engine
check_var "GAMIFICATION_RULES_REFRESH_INTERVAL_MINUTES" "Rules refresh interval in minutes" "" "true"
check_var "GAMIFICATION_RULES_CACHE_ENABLED" "Enable rules caching" "" "true"

# ===== NOTIFICATION SERVICE =====
print_section "Notification Service Configuration"

check_port "NOTIFICATION_SERVICE_PORT" "Notification Service port"
check_db_connection "NOTIFICATION_DATABASE_URL" "Notification Service database connection"
check_url "EMAIL_PROVIDER_API_URL" "Email provider API URL"
check_var "EMAIL_PROVIDER_API_KEY" "Email provider API key"
check_url "SMS_PROVIDER_API_URL" "SMS provider API URL"
check_var "SMS_PROVIDER_API_KEY" "SMS provider API key"
check_url "PUSH_NOTIFICATION_PROVIDER_API_URL" "Push notification provider API URL"
check_var "PUSH_NOTIFICATION_PROVIDER_API_KEY" "Push notification provider API key"
check_var "NOTIFICATION_RETRY_ATTEMPTS" "Maximum notification retry attempts"
check_var "NOTIFICATION_RETRY_DELAY_MS" "Delay between notification retry attempts in ms"
check_var "NOTIFICATION_BATCH_SIZE" "Notification processing batch size" "" "true"
check_var "NOTIFICATION_THROTTLING_ENABLED" "Enable notification throttling" "" "true"
check_var "NOTIFICATION_THROTTLING_RATE_LIMIT" "Maximum notifications per minute" "" "true"
check_var "NOTIFICATION_DLQ_ENABLED" "Enable dead letter queue for failed notifications" "" "true"

# Notification Templates
check_var "NOTIFICATION_TEMPLATES_REFRESH_INTERVAL_MINUTES" "Templates refresh interval in minutes" "" "true"
check_var "NOTIFICATION_TEMPLATES_CACHE_ENABLED" "Enable templates caching" "" "true"

# Journey-specific Notification Settings
check_var "NOTIFICATION_HEALTH_JOURNEY_ENABLED" "Enable notifications for Health Journey" "Health" "true"
check_var "NOTIFICATION_CARE_JOURNEY_ENABLED" "Enable notifications for Care Journey" "Care" "true"
check_var "NOTIFICATION_PLAN_JOURNEY_ENABLED" "Enable notifications for Plan Journey" "Plan" "true"

# ===== PORT AVAILABILITY =====
print_section "Port Availability Checks"

# Check if required ports are available
check_port_available "${API_GATEWAY_PORT}" "API Gateway"
check_port_available "${AUTH_SERVICE_PORT}" "Auth Service"
check_port_available "${HEALTH_SERVICE_PORT}" "Health Service"
check_port_available "${CARE_SERVICE_PORT}" "Care Service"
check_port_available "${PLAN_SERVICE_PORT}" "Plan Service"
check_port_available "${GAMIFICATION_SERVICE_PORT}" "Gamification Engine"
check_port_available "${NOTIFICATION_SERVICE_PORT}" "Notification Service"
check_port_available "${REDIS_PORT}" "Redis"

# ===== DOCKER CONTAINER HEALTH CHECKS =====
print_section "Docker Container Health Checks"

# Function to check if a Docker container is running
check_container_running() {
    local container_name=$1
    local optional=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    
    if command -v docker >/dev/null 2>&1; then
        if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
            echo -e "${GREEN}✓ Container ${container_name} is running${RESET}"
            return 0
        else
            if [ "$optional" = "true" ]; then
                echo -e "${YELLOW}⚠ Container ${container_name} is not running (optional)${RESET}"
                return 0
            else
                FAILED_CHECKS=$((FAILED_CHECKS+1))
                echo -e "${RED}✗ Container ${container_name} is not running${RESET}"
                return 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠ Cannot check container status - 'docker' command not found${RESET}"
        return 0
    fi
}

# Check required containers
check_container_running "austa-postgres" "true"
check_container_running "austa-redis" "true"
check_container_running "austa-kafka" "true"
check_container_running "austa-zookeeper" "true"
check_container_running "austa-dev-proxy" "true"

# ===== SUMMARY =====
echo -e "\n${BOLD}${BLUE}Validation Summary${RESET}"
echo -e "${CYAN}Total checks: ${TOTAL_CHECKS}${RESET}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}All environment variables are properly configured!${RESET}\n"
    exit 0
else
    echo -e "${RED}Failed checks: ${FAILED_CHECKS}${RESET}"
    echo -e "${RED}${BOLD}Environment validation failed. Please fix the issues above before starting services.${RESET}\n"
    echo -e "${YELLOW}Hint: Check .env.local.example for reference values.${RESET}\n"
    echo -e "${YELLOW}For more information, refer to the documentation at:${RESET}"
    echo -e "${YELLOW}https://github.com/austa/superapp/blob/main/docs/environment-setup.md${RESET}\n"
    exit 1
fi