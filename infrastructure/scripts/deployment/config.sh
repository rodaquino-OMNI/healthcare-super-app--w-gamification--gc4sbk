#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Deployment Configuration
# =========================================================================
# This script centralizes deployment settings across environments, defining
# traffic shifting percentages for canary deployments, timeouts for health
# checks, rollback thresholds, validation parameters, and environment-specific
# settings to ensure consistent deployment behavior.
#
# Usage:
#   source ./config.sh
#   source ./config.sh --env=production
#   source ./config.sh --env=staging
#   source ./config.sh --env=development
# =========================================================================

# =========================================================================
# Environment Detection and Configuration
# =========================================================================

# Default to development environment if not specified
DEPLOYMENT_ENV="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env=*)
      DEPLOYMENT_ENV="${key#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: source ./config.sh [--env=development|staging|production]"
      return 1
      ;;
  esac
done

# Validate environment
case "$DEPLOYMENT_ENV" in
  development|staging|production)
    # Valid environment
    ;;
  *)
    echo "Invalid environment: $DEPLOYMENT_ENV. Must be one of: development, staging, production"
    return 1
    ;;
esac

echo "Loading deployment configuration for $DEPLOYMENT_ENV environment..."

# =========================================================================
# Default Configuration (Common for all environments)
# =========================================================================

# Canary Deployment Settings
DEFAULT_INCREMENT=10          # Default traffic increment percentage
DEFAULT_MAX_SURGE=25          # Maximum additional pods during deployment
DEFAULT_VALIDATION_PERIOD=60  # Time in seconds to validate between increments
DEFAULT_MAX_ERRORS=0          # Maximum allowed errors during validation
DEFAULT_TIMEOUT=600           # Maximum deployment time in seconds

# Blue/Green Deployment Settings
BLUE_GREEN_VALIDATION_TIMEOUT=300  # Timeout for blue/green validation
BLUE_GREEN_CUTOVER_DELAY=30        # Delay before cutting over traffic
BLUE_GREEN_TERMINATION_DELAY=300   # Delay before terminating old environment

# Health Check Settings
HEALTH_CHECK_RETRIES=3             # Number of retries for health checks
HEALTH_CHECK_INTERVAL=10           # Interval between health checks in seconds
HEALTH_CHECK_TIMEOUT=5             # Timeout for individual health checks

# Rollback Settings
AUTO_ROLLBACK_ENABLED=true         # Enable automatic rollback on failure
ROLLBACK_TIMEOUT=300               # Timeout for rollback operations

# Validation Thresholds
ERROR_RATE_THRESHOLD=5             # Maximum error rate percentage
LATENCY_THRESHOLD_MULTIPLIER=1.5   # Maximum latency compared to baseline
MEMORY_THRESHOLD_MULTIPLIER=1.5    # Maximum memory usage compared to baseline
CPU_THRESHOLD_MULTIPLIER=1.5       # Maximum CPU usage compared to baseline

# Database Migration Settings
DB_MIGRATION_TIMEOUT=300           # Timeout for database migrations
DB_VALIDATION_TIMEOUT=120          # Timeout for database validation
DB_ROLLBACK_ENABLED=true           # Enable database rollback on failure

# =========================================================================
# Environment-Specific Configuration
# =========================================================================

case "$DEPLOYMENT_ENV" in
  development)
    # Development Environment Settings
    # More permissive settings for faster iteration
    DEFAULT_INCREMENT=50            # Larger increments for faster testing
    DEFAULT_VALIDATION_PERIOD=30    # Shorter validation period
    DEFAULT_MAX_ERRORS=2            # Allow more errors in development
    DEFAULT_TIMEOUT=300             # Shorter timeout
    
    HEALTH_CHECK_RETRIES=2          # Fewer retries
    HEALTH_CHECK_INTERVAL=5          # Shorter interval
    
    ERROR_RATE_THRESHOLD=10          # Higher error threshold
    LATENCY_THRESHOLD_MULTIPLIER=2.0  # More lenient latency threshold
    
    # Journey-specific settings
    HEALTH_JOURNEY_VALIDATION_PERIOD=20
    CARE_JOURNEY_VALIDATION_PERIOD=20
    PLAN_JOURNEY_VALIDATION_PERIOD=20
    
    # API Gateway settings
    API_GATEWAY_BLUE_GREEN_VALIDATION_TIMEOUT=180
    ;;
    
  staging)
    # Staging Environment Settings
    # Balanced settings for thorough testing without excessive delays
    DEFAULT_INCREMENT=20            # Moderate increments
    DEFAULT_VALIDATION_PERIOD=60    # Standard validation period
    DEFAULT_MAX_ERRORS=1            # Stricter error threshold than development
    DEFAULT_TIMEOUT=600             # Standard timeout
    
    HEALTH_CHECK_RETRIES=3          # Standard retries
    HEALTH_CHECK_INTERVAL=10         # Standard interval
    
    ERROR_RATE_THRESHOLD=5           # Moderate error threshold
    LATENCY_THRESHOLD_MULTIPLIER=1.5  # Standard latency threshold
    
    # Journey-specific settings
    HEALTH_JOURNEY_VALIDATION_PERIOD=60
    CARE_JOURNEY_VALIDATION_PERIOD=60
    PLAN_JOURNEY_VALIDATION_PERIOD=60
    
    # API Gateway settings
    API_GATEWAY_BLUE_GREEN_VALIDATION_TIMEOUT=240
    ;;
    
  production)
    # Production Environment Settings
    # Conservative settings for maximum stability
    DEFAULT_INCREMENT=10            # Small increments for careful rollout
    DEFAULT_VALIDATION_PERIOD=120   # Longer validation period
    DEFAULT_MAX_ERRORS=0            # No errors allowed
    DEFAULT_TIMEOUT=900             # Longer timeout
    
    HEALTH_CHECK_RETRIES=5          # More retries
    HEALTH_CHECK_INTERVAL=15         # Longer interval
    
    ERROR_RATE_THRESHOLD=2           # Strict error threshold
    LATENCY_THRESHOLD_MULTIPLIER=1.2  # Strict latency threshold
    
    # Journey-specific settings
    HEALTH_JOURNEY_VALIDATION_PERIOD=180
    CARE_JOURNEY_VALIDATION_PERIOD=180
    PLAN_JOURNEY_VALIDATION_PERIOD=180
    
    # API Gateway settings
    API_GATEWAY_BLUE_GREEN_VALIDATION_TIMEOUT=300
    ;;
esac

# =========================================================================
# Service-Specific Configuration
# =========================================================================

# API Gateway - Uses Blue/Green deployment
API_GATEWAY_DEPLOYMENT_STRATEGY="blue-green"
API_GATEWAY_VALIDATION_TIMEOUT=${API_GATEWAY_BLUE_GREEN_VALIDATION_TIMEOUT:-300}
API_GATEWAY_CUTOVER_DELAY=${BLUE_GREEN_CUTOVER_DELAY}
API_GATEWAY_TERMINATION_DELAY=${BLUE_GREEN_TERMINATION_DELAY}

# Auth Service - Uses Blue/Green deployment
AUTH_SERVICE_DEPLOYMENT_STRATEGY="blue-green"
AUTH_SERVICE_VALIDATION_TIMEOUT=${BLUE_GREEN_VALIDATION_TIMEOUT}
AUTH_SERVICE_CUTOVER_DELAY=${BLUE_GREEN_CUTOVER_DELAY}
AUTH_SERVICE_TERMINATION_DELAY=${BLUE_GREEN_TERMINATION_DELAY}

# Journey Services - Use Canary deployment
# Health Journey
HEALTH_SERVICE_DEPLOYMENT_STRATEGY="canary"
HEALTH_SERVICE_INCREMENT=${DEFAULT_INCREMENT}
HEALTH_SERVICE_VALIDATION_PERIOD=${HEALTH_JOURNEY_VALIDATION_PERIOD:-${DEFAULT_VALIDATION_PERIOD}}
HEALTH_SERVICE_MAX_ERRORS=${DEFAULT_MAX_ERRORS}
HEALTH_SERVICE_TIMEOUT=${DEFAULT_TIMEOUT}

# Care Journey
CARE_SERVICE_DEPLOYMENT_STRATEGY="canary"
CARE_SERVICE_INCREMENT=${DEFAULT_INCREMENT}
CARE_SERVICE_VALIDATION_PERIOD=${CARE_JOURNEY_VALIDATION_PERIOD:-${DEFAULT_VALIDATION_PERIOD}}
CARE_SERVICE_MAX_ERRORS=${DEFAULT_MAX_ERRORS}
CARE_SERVICE_TIMEOUT=${DEFAULT_TIMEOUT}

# Plan Journey
PLAN_SERVICE_DEPLOYMENT_STRATEGY="canary"
PLAN_SERVICE_INCREMENT=${DEFAULT_INCREMENT}
PLAN_SERVICE_VALIDATION_PERIOD=${PLAN_JOURNEY_VALIDATION_PERIOD:-${DEFAULT_VALIDATION_PERIOD}}
PLAN_SERVICE_MAX_ERRORS=${DEFAULT_MAX_ERRORS}
PLAN_SERVICE_TIMEOUT=${DEFAULT_TIMEOUT}

# Gamification Engine - Uses Canary deployment
GAMIFICATION_ENGINE_DEPLOYMENT_STRATEGY="canary"
GAMIFICATION_ENGINE_INCREMENT=${DEFAULT_INCREMENT}
GAMIFICATION_ENGINE_VALIDATION_PERIOD=${DEFAULT_VALIDATION_PERIOD}
GAMIFICATION_ENGINE_MAX_ERRORS=${DEFAULT_MAX_ERRORS}
GAMIFICATION_ENGINE_TIMEOUT=${DEFAULT_TIMEOUT}

# Notification Service - Uses Canary deployment
NOTIFICATION_SERVICE_DEPLOYMENT_STRATEGY="canary"
NOTIFICATION_SERVICE_INCREMENT=${DEFAULT_INCREMENT}
NOTIFICATION_SERVICE_VALIDATION_PERIOD=${DEFAULT_VALIDATION_PERIOD}
NOTIFICATION_SERVICE_MAX_ERRORS=${DEFAULT_MAX_ERRORS}
NOTIFICATION_SERVICE_TIMEOUT=${DEFAULT_TIMEOUT}

# =========================================================================
# Validation Metrics Configuration
# =========================================================================

# Define Prometheus queries for validation
PROM_ERROR_RATE_QUERY="sum(rate(http_requests_total{service=\"SERVICE_NAME\",version=\"canary\",status_code=~\"5..\"}[1m])) / sum(rate(http_requests_total{service=\"SERVICE_NAME\",version=\"canary\"}[1m])) * 100"
PROM_LATENCY_QUERY="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"SERVICE_NAME\",version=\"canary\"}[1m])) by (le))"
PROM_STABLE_LATENCY_QUERY="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"SERVICE_NAME\",version=\"stable\"}[1m])) by (le))"
PROM_MEMORY_QUERY="container_memory_usage_bytes{pod=~\"SERVICE_NAME-canary.*\"}"
PROM_CPU_QUERY="sum(rate(container_cpu_usage_seconds_total{pod=~\"SERVICE_NAME-canary.*\"}[1m]))"

# =========================================================================
# Deployment Notification Configuration
# =========================================================================

# Slack webhook URL for deployment notifications
SLACK_WEBHOOK_URL=""

# Email notification settings
EMAIL_NOTIFICATION_ENABLED=false
EMAIL_NOTIFICATION_RECIPIENTS=""

# =========================================================================
# Deployment Tracking Configuration
# =========================================================================

# Enable deployment tracking
DEPLOYMENT_TRACKING_ENABLED=true

# Deployment tracking database
DEPLOYMENT_DB_HOST="localhost"
DEPLOYMENT_DB_PORT=5432
DEPLOYMENT_DB_NAME="deployments"
DEPLOYMENT_DB_USER="deploy_user"
DEPLOYMENT_DB_PASSWORD=""

# =========================================================================
# Configuration Complete
# =========================================================================

echo "Deployment configuration loaded for $DEPLOYMENT_ENV environment."

# Export all variables to make them available to child processes
export DEPLOYMENT_ENV

# Canary Deployment Settings
export DEFAULT_INCREMENT DEFAULT_MAX_SURGE DEFAULT_VALIDATION_PERIOD DEFAULT_MAX_ERRORS DEFAULT_TIMEOUT

# Blue/Green Deployment Settings
export BLUE_GREEN_VALIDATION_TIMEOUT BLUE_GREEN_CUTOVER_DELAY BLUE_GREEN_TERMINATION_DELAY

# Health Check Settings
export HEALTH_CHECK_RETRIES HEALTH_CHECK_INTERVAL HEALTH_CHECK_TIMEOUT

# Rollback Settings
export AUTO_ROLLBACK_ENABLED ROLLBACK_TIMEOUT

# Validation Thresholds
export ERROR_RATE_THRESHOLD LATENCY_THRESHOLD_MULTIPLIER MEMORY_THRESHOLD_MULTIPLIER CPU_THRESHOLD_MULTIPLIER

# Database Migration Settings
export DB_MIGRATION_TIMEOUT DB_VALIDATION_TIMEOUT DB_ROLLBACK_ENABLED

# Service-Specific Configuration
export API_GATEWAY_DEPLOYMENT_STRATEGY API_GATEWAY_VALIDATION_TIMEOUT API_GATEWAY_CUTOVER_DELAY API_GATEWAY_TERMINATION_DELAY
export AUTH_SERVICE_DEPLOYMENT_STRATEGY AUTH_SERVICE_VALIDATION_TIMEOUT AUTH_SERVICE_CUTOVER_DELAY AUTH_SERVICE_TERMINATION_DELAY
export HEALTH_SERVICE_DEPLOYMENT_STRATEGY HEALTH_SERVICE_INCREMENT HEALTH_SERVICE_VALIDATION_PERIOD HEALTH_SERVICE_MAX_ERRORS HEALTH_SERVICE_TIMEOUT
export CARE_SERVICE_DEPLOYMENT_STRATEGY CARE_SERVICE_INCREMENT CARE_SERVICE_VALIDATION_PERIOD CARE_SERVICE_MAX_ERRORS CARE_SERVICE_TIMEOUT
export PLAN_SERVICE_DEPLOYMENT_STRATEGY PLAN_SERVICE_INCREMENT PLAN_SERVICE_VALIDATION_PERIOD PLAN_SERVICE_MAX_ERRORS PLAN_SERVICE_TIMEOUT
export GAMIFICATION_ENGINE_DEPLOYMENT_STRATEGY GAMIFICATION_ENGINE_INCREMENT GAMIFICATION_ENGINE_VALIDATION_PERIOD GAMIFICATION_ENGINE_MAX_ERRORS GAMIFICATION_ENGINE_TIMEOUT
export NOTIFICATION_SERVICE_DEPLOYMENT_STRATEGY NOTIFICATION_SERVICE_INCREMENT NOTIFICATION_SERVICE_VALIDATION_PERIOD NOTIFICATION_SERVICE_MAX_ERRORS NOTIFICATION_SERVICE_TIMEOUT

# Validation Metrics Configuration
export PROM_ERROR_RATE_QUERY PROM_LATENCY_QUERY PROM_STABLE_LATENCY_QUERY PROM_MEMORY_QUERY PROM_CPU_QUERY

# Deployment Notification Configuration
export SLACK_WEBHOOK_URL EMAIL_NOTIFICATION_ENABLED EMAIL_NOTIFICATION_RECIPIENTS

# Deployment Tracking Configuration
export DEPLOYMENT_TRACKING_ENABLED DEPLOYMENT_DB_HOST DEPLOYMENT_DB_PORT DEPLOYMENT_DB_NAME DEPLOYMENT_DB_USER DEPLOYMENT_DB_PASSWORD