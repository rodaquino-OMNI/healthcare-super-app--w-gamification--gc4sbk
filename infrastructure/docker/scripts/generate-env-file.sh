#!/bin/bash

# =========================================================================
# AUSTA SuperApp Environment File Generator
# =========================================================================
# This script generates properly configured .env files for local development
# with appropriate defaults and documentation for all required variables.
#
# Usage: ./generate-env-file.sh [environment] [output_path] [example_path]
#   environment: development (default), staging, testing
#   output_path: path to write the .env file (default: .env.local)
#   example_path: path to write the example file (default: .env.local.example)
# =========================================================================

set -e

# Default values
ENVIRONMENT="development"
OUTPUT_FILE=".env.local"
EXAMPLE_FILE=".env.local.example"

# Process command line arguments
if [ "$1" != "" ]; then
  ENVIRONMENT="$1"
fi

if [ "$2" != "" ]; then
  OUTPUT_FILE="$2"
fi

if [ "$3" != "" ]; then
  EXAMPLE_FILE="$3"
fi

# Create output directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_FILE")"
mkdir -p "$(dirname "$EXAMPLE_FILE")"

echo "Generating environment file for $ENVIRONMENT environment..."

# Function to write a variable with documentation to both files
write_var() {
  local name=$1
  local value=$2
  local description=$3
  local required=$4
  local example_value=$5
  
  # Use example value if provided, otherwise use the actual value
  if [ -z "$example_value" ]; then
    example_value=$value
  fi
  
  # Add required marker if needed
  local req_marker=""
  if [ "$required" = "true" ]; then
    req_marker=" (REQUIRED)"
  fi
  
  # Write to example file with documentation
  echo "# $description$req_marker" >> "$EXAMPLE_FILE"
  echo "$name=$example_value" >> "$EXAMPLE_FILE"
  echo "" >> "$EXAMPLE_FILE"
  
  # Write to actual env file
  echo "$name=$value" >> "$OUTPUT_FILE"
}

# Function to add section header to both files
add_section() {
  local title=$1
  
  echo "" >> "$OUTPUT_FILE"
  echo "# =========================================================================" >> "$OUTPUT_FILE"
  echo "# $title" >> "$OUTPUT_FILE"
  echo "# =========================================================================" >> "$OUTPUT_FILE"
  
  echo "" >> "$EXAMPLE_FILE"
  echo "# =========================================================================" >> "$EXAMPLE_FILE"
  echo "# $title" >> "$EXAMPLE_FILE"
  echo "# =========================================================================" >> "$EXAMPLE_FILE"
}

# Clear existing files if they exist
> "$OUTPUT_FILE"
> "$EXAMPLE_FILE"

# Write header to both files
cat << EOF >> "$EXAMPLE_FILE"
# =========================================================================
# AUSTA SuperApp Environment Configuration
# =========================================================================
# This file contains all environment variables required for local development
# of the AUSTA SuperApp. Variables marked as (REQUIRED) must be set for the
# application to function properly.
# =========================================================================

EOF

cat << EOF >> "$OUTPUT_FILE"
# =========================================================================
# AUSTA SuperApp Environment Configuration ($ENVIRONMENT)
# =========================================================================
# Generated on $(date)
# =========================================================================

EOF

add_section "COMMON CONFIGURATION"
write_var "NODE_ENV" "$ENVIRONMENT" "Node environment setting" "true"
write_var "LOG_LEVEL" "debug" "Logging level (error, warn, info, http, verbose, debug, silly)" "true"
write_var "PORT" "3000" "Default port for services" "true"
write_var "TZ" "UTC" "Timezone for date handling" "false"
write_var "APP_NAME" "AUSTA SuperApp" "Application name" "true"

add_section "DATABASE CONFIGURATION"
write_var "DATABASE_URL" "postgresql://postgres:postgres@localhost:5432/austa_db" "Main PostgreSQL connection string" "true" "postgresql://user:password@host:port/dbname"
write_var "DATABASE_POOL_SIZE" "10" "Database connection pool size" "false"
write_var "DATABASE_SSL_ENABLED" "false" "Enable SSL for database connections" "false"
write_var "DATABASE_STATEMENT_TIMEOUT" "30000" "Database statement timeout in milliseconds" "false"
write_var "TIMESCALE_URL" "postgresql://postgres:postgres@localhost:5433/austa_timescale" "TimescaleDB connection string for time-series data" "true" "postgresql://user:password@host:port/dbname"
write_var "TIMESCALE_POOL_SIZE" "5" "TimescaleDB connection pool size" "false"
write_var "REDIS_URL" "redis://localhost:6379" "Redis connection string" "true" "redis://host:port"
write_var "REDIS_PASSWORD" "" "Redis password (if required)" "false" "your_redis_password"
write_var "REDIS_TTL" "86400" "Default TTL for Redis cache items in seconds" "false"

add_section "AUTHENTICATION CONFIGURATION"
write_var "JWT_SECRET" "local_development_secret_key_change_in_production" "Secret key for JWT token signing" "true" "your_jwt_secret_key"
write_var "JWT_EXPIRATION" "3600" "JWT token expiration time in seconds" "true"
write_var "JWT_REFRESH_SECRET" "local_development_refresh_secret_key_change_in_production" "Secret key for refresh token signing" "true" "your_refresh_token_secret_key"
write_var "REFRESH_TOKEN_EXPIRATION" "604800" "Refresh token expiration time in seconds" "true"
write_var "AUTH_COOKIE_SECURE" "false" "Whether to use secure cookies (should be true in production)" "false"
write_var "AUTH_COOKIE_DOMAIN" "localhost" "Cookie domain for authentication" "false"
write_var "AUTH_COOKIE_HTTP_ONLY" "true" "Whether cookies are HTTP only" "false"
write_var "AUTH_COOKIE_SAME_SITE" "lax" "SameSite cookie policy (strict, lax, none)" "false"
write_var "AUTH_SERVICE_URL" "http://localhost:3005" "Auth service URL" "true" "http://auth-service-host:port"
write_var "OAUTH_ENABLED" "false" "Enable OAuth authentication" "false"
write_var "OAUTH_PROVIDERS" "" "Enabled OAuth providers (comma-separated)" "false" "google,facebook"

add_section "API CONFIGURATION"
write_var "API_URL" "http://localhost:3000" "Base URL for API" "true" "http://your-api-domain"
write_var "GRAPHQL_PATH" "/graphql" "Path for GraphQL endpoint" "false"
write_var "ENABLE_GRAPHQL_PLAYGROUND" "true" "Enable GraphQL playground in development" "false"
write_var "CORS_ORIGINS" "http://localhost:3000,http://localhost:3001,http://localhost:8081" "Allowed CORS origins (comma-separated)" "true" "http://localhost:3000,http://your-domain.com"

add_section "EVENT STREAMING CONFIGURATION"
write_var "KAFKA_BROKERS" "localhost:9092" "Kafka brokers (comma-separated list)" "true" "host1:port,host2:port"
write_var "KAFKA_CLIENT_ID" "austa-app" "Kafka client ID" "true"
write_var "KAFKA_GROUP_ID" "austa-local-group" "Kafka consumer group ID" "true"
write_var "KAFKA_SSL_ENABLED" "false" "Enable SSL for Kafka connections" "false"

add_section "NOTIFICATION CONFIGURATION"
write_var "EMAIL_PROVIDER" "smtp" "Email provider (smtp, sendgrid, etc.)" "false"
write_var "EMAIL_FROM" "noreply@example.com" "From email address" "false" "noreply@your-domain.com"
write_var "SMTP_HOST" "localhost" "SMTP server host" "false"
write_var "SMTP_PORT" "1025" "SMTP server port" "false"
write_var "SMTP_USER" "" "SMTP server username" "false" "your_smtp_username"
write_var "SMTP_PASSWORD" "" "SMTP server password" "false" "your_smtp_password"
write_var "SMS_PROVIDER" "console" "SMS provider (twilio, console, etc.)" "false"
write_var "PUSH_ENABLED" "false" "Enable push notifications" "false"

add_section "HEALTH JOURNEY CONFIGURATION"
write_var "HEALTH_SERVICE_URL" "http://localhost:3001" "Health service URL" "true" "http://health-service-host:port"
write_var "FHIR_API_URL" "http://localhost:8080/fhir" "FHIR API URL for health data integration" "false" "http://fhir-server/fhir"
write_var "WEARABLE_SYNC_INTERVAL" "3600" "Interval for wearable device synchronization (seconds)" "false"

add_section "CARE JOURNEY CONFIGURATION"
write_var "CARE_SERVICE_URL" "http://localhost:3002" "Care service URL" "true" "http://care-service-host:port"
write_var "TELEMEDICINE_PROVIDER" "mock" "Telemedicine provider (mock, zoom, etc.)" "false"
write_var "APPOINTMENT_REMINDER_LEAD_TIME" "3600" "Lead time for appointment reminders (seconds)" "false"

add_section "PLAN JOURNEY CONFIGURATION"
write_var "PLAN_SERVICE_URL" "http://localhost:3003" "Plan service URL" "true" "http://plan-service-host:port"
write_var "INSURANCE_API_URL" "http://localhost:8082/insurance" "Insurance API URL" "false" "http://insurance-api/v1"
write_var "PAYMENT_PROVIDER" "mock" "Payment provider (mock, stripe, etc.)" "false"

add_section "GAMIFICATION CONFIGURATION"
write_var "GAMIFICATION_SERVICE_URL" "http://localhost:3004" "Gamification service URL" "true" "http://gamification-service-host:port"
write_var "ACHIEVEMENT_NOTIFICATION_DELAY" "5" "Delay for achievement notifications (seconds)" "false"

add_section "MONITORING AND OBSERVABILITY"
write_var "ENABLE_METRICS" "true" "Enable Prometheus metrics collection" "false"
write_var "METRICS_PATH" "/metrics" "Path for metrics endpoint" "false"
write_var "ENABLE_TRACING" "true" "Enable distributed tracing" "false"
write_var "TRACING_SAMPLE_RATE" "1.0" "Tracing sample rate (0.0-1.0)" "false"
write_var "DATADOG_ENABLED" "false" "Enable Datadog APM" "false"
write_var "DATADOG_API_KEY" "" "Datadog API key" "false" "your_datadog_api_key"
write_var "DATADOG_SERVICE_NAME" "austa-superapp" "Service name for Datadog" "false"
write_var "DATADOG_ENV" "$ENVIRONMENT" "Environment for Datadog" "false"
write_var "LOG_FORMAT" "json" "Log format (json, pretty)" "false"
write_var "CORRELATION_ID_HEADER" "x-correlation-id" "HTTP header for correlation ID" "false"

add_section "DEVELOPMENT TOOLS"
write_var "ENABLE_SWAGGER" "true" "Enable Swagger documentation" "false"
write_var "SWAGGER_PATH" "/api" "Path for Swagger documentation" "false"
write_var "ENABLE_DEBUG_ENDPOINTS" "true" "Enable debug endpoints" "false"
write_var "ENABLE_HOT_RELOAD" "true" "Enable hot reloading for development" "false"
write_var "SEED_DATABASE" "true" "Seed database with test data on startup" "false"
write_var "MOCK_EXTERNAL_SERVICES" "true" "Use mock implementations for external services" "false"

add_section "FRONTEND CONFIGURATION"
write_var "NEXT_PUBLIC_API_URL" "http://localhost:3000" "API URL for frontend" "true" "http://your-api-domain"
write_var "NEXT_PUBLIC_WEBSOCKET_URL" "ws://localhost:3000" "WebSocket URL for frontend" "true" "ws://your-api-domain"
write_var "NEXT_PUBLIC_ENVIRONMENT" "$ENVIRONMENT" "Environment name for frontend" "true"
write_var "NEXT_PUBLIC_SENTRY_DSN" "" "Sentry DSN for frontend error tracking" "false" "your_sentry_dsn"
write_var "NEXT_PUBLIC_ANALYTICS_ID" "" "Analytics ID for frontend tracking" "false" "your_analytics_id"
write_var "NEXT_PUBLIC_FEATURE_FLAGS" "gamification,telemedicine" "Enabled feature flags (comma-separated)" "false"
write_var "NEXT_PUBLIC_DEFAULT_LOCALE" "pt-BR" "Default locale for frontend" "false"
write_var "NEXT_PUBLIC_SUPPORTED_LOCALES" "pt-BR,en-US" "Supported locales (comma-separated)" "false"

add_section "MOBILE CONFIGURATION"
write_var "EXPO_PUBLIC_API_URL" "http://localhost:3000" "API URL for mobile app" "true" "http://your-api-domain"
write_var "EXPO_PUBLIC_WEBSOCKET_URL" "ws://localhost:3000" "WebSocket URL for mobile app" "true" "ws://your-api-domain"
write_var "EXPO_PUBLIC_ENVIRONMENT" "$ENVIRONMENT" "Environment name for mobile app" "true"
write_var "EXPO_PUBLIC_SENTRY_DSN" "" "Sentry DSN for mobile error tracking" "false" "your_sentry_dsn"
write_var "EXPO_PUBLIC_ANALYTICS_ID" "" "Analytics ID for mobile tracking" "false" "your_analytics_id"
write_var "EXPO_PUBLIC_FEATURE_FLAGS" "gamification,telemedicine" "Enabled feature flags (comma-separated)" "false"
write_var "EXPO_PUBLIC_DEFAULT_LOCALE" "pt-BR" "Default locale for mobile app" "false"
write_var "EXPO_PUBLIC_SUPPORTED_LOCALES" "pt-BR,en-US" "Supported locales (comma-separated)" "false"
write_var "EXPO_PUBLIC_HEALTHKIT_ENABLED" "true" "Enable HealthKit integration (iOS)" "false"
write_var "EXPO_PUBLIC_GOOGLE_FIT_ENABLED" "true" "Enable Google Fit integration (Android)" "false"

# Set appropriate permissions
chmod 644 "$OUTPUT_FILE"
chmod 644 "$EXAMPLE_FILE"

echo "Environment files generated successfully:"
echo "- $OUTPUT_FILE"
echo "- $EXAMPLE_FILE"
echo ""
echo "To use these files:"
echo "1. Copy $EXAMPLE_FILE to .env.local in your project root"
echo "2. Update any values marked as (REQUIRED) with your specific configuration"
echo "3. Restart your services to apply the new configuration"