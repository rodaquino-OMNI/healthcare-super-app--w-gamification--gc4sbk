#!/bin/bash
# Make script executable with: chmod +x service-health-check.sh

# ======================================================
# AUSTA SuperApp Service Health Check Script
# ======================================================
# This script monitors the health of all Docker services by checking:
# - Container status
# - Service endpoints
# - Database connections
# - Kafka broker availability
# - Redis connectivity
# - API responsiveness
#
# It provides detailed health reports for troubleshooting and ensures
# all components of the AUSTA SuperApp development environment are
# functioning correctly.
# ======================================================

# Set strict mode
set -eo pipefail

# ======================================================
# CONFIGURATION
# ======================================================

# Default values
VERBOSE=false
JOURNEY="all"
AUTO_RECOVER=false
OUTPUT_FORMAT="terminal"
OUTPUT_FILE=""
TIMEOUT=5
RETRIES=3

# Color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color
BOLD="\033[1m"

# Service endpoints
API_GATEWAY_URL="http://localhost:3000"
AUTH_SERVICE_URL="http://localhost:3001"
HEALTH_SERVICE_URL="http://localhost:3002"
CARE_SERVICE_URL="http://localhost:3003"
PLAN_SERVICE_URL="http://localhost:3004"
GAMIFICATION_ENGINE_URL="http://localhost:3005"
NOTIFICATION_SERVICE_URL="http://localhost:3006"
WEB_APP_URL="http://localhost:8000"
DEV_PROXY_URL="http://localhost:8080"

# Database connection
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="austa"
DB_PASSWORD="austa"
DB_NAME="austa"

# Redis connection
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Kafka connection
KAFKA_BROKER="localhost:29092"

# ======================================================
# HELPER FUNCTIONS
# ======================================================

# Print usage information
usage() {
  echo -e "${BOLD}USAGE:${NC}"
  echo -e "  $0 [OPTIONS]"
  echo ""
  echo -e "${BOLD}OPTIONS:${NC}"
  echo -e "  -h, --help                Show this help message"
  echo -e "  -v, --verbose             Enable verbose output"
  echo -e "  -j, --journey JOURNEY     Check specific journey (health, care, plan, all)"
  echo -e "  -r, --recover             Attempt to automatically recover failed services"
  echo -e "  -o, --output FORMAT       Output format (terminal, json, markdown)"
  echo -e "  -f, --file FILENAME       Write output to file"
  echo -e "  -t, --timeout SECONDS     Connection timeout in seconds (default: 5)"
  echo -e "  --retries COUNT           Number of retries for failed checks (default: 3)"
  echo ""
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo -e "  $0 --journey health        Check only health journey services"
  echo -e "  $0 --verbose --recover    Check all services with detailed output and auto-recovery"
  echo -e "  $0 --output json --file health-report.json    Generate JSON report"
}

# Log message with timestamp
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$GREEN ;;
    "WARN") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "DEBUG") color=$BLUE ;;
  esac
  
  if [[ "$level" != "DEBUG" ]] || [[ "$VERBOSE" == true ]]; then
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${color}${level}${NC}: ${message}"
  fi
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if required tools are installed
check_requirements() {
  local missing_tools=false
  
  for tool in docker curl jq nc; do
    if ! command_exists "$tool"; then
      log "ERROR" "Required tool not found: $tool"
      missing_tools=true
    fi
  done
  
  if [[ "$missing_tools" == true ]]; then
    log "ERROR" "Please install the missing tools and try again."
    exit 1
  fi
}

# Format status with color
format_status() {
  local status=$1
  local color=$NC
  
  case $status in
    "HEALTHY") color=$GREEN ;;
    "DEGRADED") color=$YELLOW ;;
    "UNHEALTHY") color=$RED ;;
    "UNKNOWN") color=$BLUE ;;
  esac
  
  echo -e "${color}${status}${NC}"
}

# ======================================================
# HEALTH CHECK FUNCTIONS
# ======================================================

# Check if Docker is running
check_docker_running() {
  log "DEBUG" "Checking if Docker is running..."
  
  if ! docker info >/dev/null 2>&1; then
    log "ERROR" "Docker is not running"
    return 1
  fi
  
  log "DEBUG" "Docker is running"
  return 0
}

# Check container status
check_container_status() {
  local container_name=$1
  local status
  local health
  local result="UNKNOWN"
  
  log "DEBUG" "Checking container status: $container_name"
  
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    log "DEBUG" "Container not found: $container_name"
    echo "UNKNOWN"
    return
  fi
  
  # Get container status
  status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
  
  # Check if container has health check
  if docker inspect --format='{{if .Config.Healthcheck}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null | grep -q -v "none"; then
    health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
    
    case $health in
      "healthy") result="HEALTHY" ;;
      "starting") result="DEGRADED" ;;
      "unhealthy") result="UNHEALTHY" ;;
      *) result="UNKNOWN" ;;
    esac
  else
    # No health check, use container status
    case $status in
      "running") result="HEALTHY" ;;
      "created"|"restarting") result="DEGRADED" ;;
      "exited"|"dead") result="UNHEALTHY" ;;
      *) result="UNKNOWN" ;;
    esac
  fi
  
  log "DEBUG" "Container $container_name status: $result"
  echo "$result"
}

# Check HTTP endpoint
check_endpoint() {
  local url=$1
  local endpoint=${2:-"/health"}
  local full_url="${url}${endpoint}"
  local result="UNKNOWN"
  local http_code
  local attempt=1
  
  log "DEBUG" "Checking endpoint: $full_url"
  
  while [ $attempt -le $RETRIES ]; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$TIMEOUT" "$full_url" 2>/dev/null)
    
    case $http_code in
      200|201|204) 
        result="HEALTHY"
        break
        ;;
      429|503) 
        result="DEGRADED"
        ;;
      000) 
        result="UNHEALTHY"
        ;;
      *) 
        result="UNHEALTHY"
        ;;
    esac
    
    if [ "$result" = "HEALTHY" ]; then
      break
    fi
    
    log "DEBUG" "Attempt $attempt failed with HTTP code $http_code, retrying..."
    attempt=$((attempt + 1))
    sleep 1
  done
  
  log "DEBUG" "Endpoint $full_url status: $result (HTTP $http_code)"
  echo "$result"
}

# Check database connection
check_database() {
  local schema=$1
  local result="UNKNOWN"
  local connection_string="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  
  if [ -n "$schema" ]; then
    connection_string="${connection_string}?schema=${schema}"
  fi
  
  log "DEBUG" "Checking database connection: $connection_string"
  
  if command_exists psql; then
    # Use psql if available
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
      result="HEALTHY"
    else
      result="UNHEALTHY"
    fi
  else
    # Fallback to nc
    if nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; then
      result="DEGRADED" # Can connect but can't verify query
    else
      result="UNHEALTHY"
    fi
  fi
  
  log "DEBUG" "Database connection status ($schema): $result"
  echo "$result"
}

# Check Redis connection
check_redis() {
  local result="UNKNOWN"
  
  log "DEBUG" "Checking Redis connection: $REDIS_HOST:$REDIS_PORT"
  
  if command_exists redis-cli; then
    # Use redis-cli if available
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"; then
      result="HEALTHY"
    else
      result="UNHEALTHY"
    fi
  else
    # Fallback to nc
    if nc -z "$REDIS_HOST" "$REDIS_PORT" >/dev/null 2>&1; then
      result="DEGRADED" # Can connect but can't verify PING
    else
      result="UNHEALTHY"
    fi
  fi
  
  log "DEBUG" "Redis connection status: $result"
  echo "$result"
}

# Check Kafka connection
check_kafka() {
  local result="UNKNOWN"
  
  log "DEBUG" "Checking Kafka connection: $KAFKA_BROKER"
  
  # Extract host and port from broker string
  local kafka_host=$(echo "$KAFKA_BROKER" | cut -d ':' -f 1)
  local kafka_port=$(echo "$KAFKA_BROKER" | cut -d ':' -f 2)
  
  if command_exists kafka-topics; then
    # Use kafka-topics if available
    if kafka-topics --bootstrap-server "$KAFKA_BROKER" --list >/dev/null 2>&1; then
      result="HEALTHY"
    else
      result="UNHEALTHY"
    fi
  else
    # Fallback to nc
    if nc -z "$kafka_host" "$kafka_port" >/dev/null 2>&1; then
      result="DEGRADED" # Can connect but can't verify topics
    else
      result="UNHEALTHY"
    fi
  fi
  
  log "DEBUG" "Kafka connection status: $result"
  echo "$result"
}

# Check Kafka topics
check_kafka_topics() {
  local topics=("health-events" "care-events" "plan-events" "gamification-events" "notification-events")
  local missing_topics=()
  
  log "DEBUG" "Checking Kafka topics..."
  
  if ! command_exists kafka-topics; then
    log "DEBUG" "kafka-topics command not found, skipping topic check"
    echo "UNKNOWN"
    return
  fi
  
  # Get list of topics
  local existing_topics
  existing_topics=$(kafka-topics --bootstrap-server "$KAFKA_BROKER" --list 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    log "DEBUG" "Failed to list Kafka topics"
    echo "UNHEALTHY"
    return
  fi
  
  # Check if required topics exist
  for topic in "${topics[@]}"; do
    if ! echo "$existing_topics" | grep -q "^${topic}$"; then
      missing_topics+=("$topic")
    fi
  done
  
  if [ ${#missing_topics[@]} -eq 0 ]; then
    log "DEBUG" "All required Kafka topics exist"
    echo "HEALTHY"
  elif [ ${#missing_topics[@]} -lt ${#topics[@]} ]; then
    log "DEBUG" "Some Kafka topics are missing: ${missing_topics[*]}"
    echo "DEGRADED"
  else
    log "DEBUG" "All Kafka topics are missing"
    echo "UNHEALTHY"
  fi
}

# ======================================================
# RECOVERY FUNCTIONS
# ======================================================

# Restart a container
restart_container() {
  local container_name=$1
  
  log "INFO" "Attempting to restart container: $container_name"
  
  if docker restart "$container_name" >/dev/null 2>&1; then
    log "INFO" "Successfully restarted container: $container_name"
    return 0
  else
    log "ERROR" "Failed to restart container: $container_name"
    return 1
  fi
}

# Create missing Kafka topics
create_missing_topics() {
  local topics=("health-events" "care-events" "plan-events" "gamification-events" "notification-events")
  local created=0
  
  log "INFO" "Checking for missing Kafka topics..."
  
  if ! command_exists kafka-topics; then
    log "ERROR" "kafka-topics command not found, cannot create topics"
    return 1
  fi
  
  # Get list of topics
  local existing_topics
  existing_topics=$(kafka-topics --bootstrap-server "$KAFKA_BROKER" --list 2>/dev/null)
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Failed to list Kafka topics"
    return 1
  fi
  
  # Create missing topics
  for topic in "${topics[@]}"; do
    if ! echo "$existing_topics" | grep -q "^${topic}$"; then
      log "INFO" "Creating missing Kafka topic: $topic"
      
      if kafka-topics --bootstrap-server "$KAFKA_BROKER" --create --topic "$topic" --partitions 1 --replication-factor 1 >/dev/null 2>&1; then
        log "INFO" "Successfully created Kafka topic: $topic"
        created=$((created + 1))
      else
        log "ERROR" "Failed to create Kafka topic: $topic"
      fi
    fi
  done
  
  log "INFO" "Created $created missing Kafka topics"
  return 0
}

# ======================================================
# MAIN HEALTH CHECK FUNCTIONS
# ======================================================

# Check API Gateway health
check_api_gateway() {
  local container_status
  local endpoint_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking API Gateway health..."
  
  container_status=$(check_container_status "austa-api-gateway")
  endpoint_status=$(check_endpoint "$API_GATEWAY_URL" "/health")
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "API Gateway is not healthy, attempting recovery..."
    restart_container "austa-api-gateway"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-api-gateway")
    endpoint_status=$(check_endpoint "$API_GATEWAY_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "API Gateway recovery successful"
    else
      log "ERROR" "API Gateway recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"API Gateway\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Auth Service health
check_auth_service() {
  local container_status
  local endpoint_status
  local db_status
  local redis_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Auth Service health..."
  
  container_status=$(check_container_status "austa-auth-service")
  endpoint_status=$(check_endpoint "$AUTH_SERVICE_URL" "/health")
  db_status=$(check_database "auth")
  redis_status=$(check_redis)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$redis_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Auth Service is not healthy, attempting recovery..."
    restart_container "austa-auth-service"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-auth-service")
    endpoint_status=$(check_endpoint "$AUTH_SERVICE_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Auth Service recovery successful"
    else
      log "ERROR" "Auth Service recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Auth Service\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"redis_status\": \"$redis_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Health Journey Service health
check_health_service() {
  local container_status
  local endpoint_status
  local db_status
  local kafka_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Health Journey Service health..."
  
  container_status=$(check_container_status "austa-health-service")
  endpoint_status=$(check_endpoint "$HEALTH_SERVICE_URL" "/health")
  db_status=$(check_database "health")
  kafka_status=$(check_kafka)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$kafka_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Health Service is not healthy, attempting recovery..."
    restart_container "austa-health-service"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-health-service")
    endpoint_status=$(check_endpoint "$HEALTH_SERVICE_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Health Service recovery successful"
    else
      log "ERROR" "Health Service recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Health Journey Service\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"kafka_status\": \"$kafka_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Care Journey Service health
check_care_service() {
  local container_status
  local endpoint_status
  local db_status
  local kafka_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Care Journey Service health..."
  
  container_status=$(check_container_status "austa-care-service")
  endpoint_status=$(check_endpoint "$CARE_SERVICE_URL" "/health")
  db_status=$(check_database "care")
  kafka_status=$(check_kafka)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$kafka_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Care Service is not healthy, attempting recovery..."
    restart_container "austa-care-service"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-care-service")
    endpoint_status=$(check_endpoint "$CARE_SERVICE_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Care Service recovery successful"
    else
      log "ERROR" "Care Service recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Care Journey Service\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"kafka_status\": \"$kafka_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Plan Journey Service health
check_plan_service() {
  local container_status
  local endpoint_status
  local db_status
  local kafka_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Plan Journey Service health..."
  
  container_status=$(check_container_status "austa-plan-service")
  endpoint_status=$(check_endpoint "$PLAN_SERVICE_URL" "/health")
  db_status=$(check_database "plan")
  kafka_status=$(check_kafka)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$kafka_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Plan Service is not healthy, attempting recovery..."
    restart_container "austa-plan-service"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-plan-service")
    endpoint_status=$(check_endpoint "$PLAN_SERVICE_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Plan Service recovery successful"
    else
      log "ERROR" "Plan Service recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Plan Journey Service\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"kafka_status\": \"$kafka_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Gamification Engine health
check_gamification_engine() {
  local container_status
  local endpoint_status
  local db_status
  local kafka_status
  local kafka_topics_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Gamification Engine health..."
  
  container_status=$(check_container_status "austa-gamification-engine")
  endpoint_status=$(check_endpoint "$GAMIFICATION_ENGINE_URL" "/health")
  db_status=$(check_database "gamification")
  kafka_status=$(check_kafka)
  kafka_topics_status=$(check_kafka_topics)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$kafka_status" = "HEALTHY" ] && 
     [ "$kafka_topics_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Gamification Engine is not healthy, attempting recovery..."
    
    # Create missing Kafka topics if needed
    if [ "$kafka_topics_status" != "HEALTHY" ]; then
      create_missing_topics
    fi
    
    restart_container "austa-gamification-engine"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-gamification-engine")
    endpoint_status=$(check_endpoint "$GAMIFICATION_ENGINE_URL" "/health")
    kafka_topics_status=$(check_kafka_topics)
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
       [ "$kafka_topics_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Gamification Engine recovery successful"
    else
      log "ERROR" "Gamification Engine recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Gamification Engine\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"kafka_status\": \"$kafka_status\",
    \"kafka_topics_status\": \"$kafka_topics_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Notification Service health
check_notification_service() {
  local container_status
  local endpoint_status
  local db_status
  local kafka_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Notification Service health..."
  
  container_status=$(check_container_status "austa-notification-service")
  endpoint_status=$(check_endpoint "$NOTIFICATION_SERVICE_URL" "/health")
  db_status=$(check_database "notification")
  kafka_status=$(check_kafka)
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ] && 
     [ "$db_status" = "HEALTHY" ] && [ "$kafka_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Notification Service is not healthy, attempting recovery..."
    restart_container "austa-notification-service"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-notification-service")
    endpoint_status=$(check_endpoint "$NOTIFICATION_SERVICE_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Notification Service recovery successful"
    else
      log "ERROR" "Notification Service recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Notification Service\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"database_status\": \"$db_status\",
    \"kafka_status\": \"$kafka_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Web App health
check_web_app() {
  local container_status
  local endpoint_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Web App health..."
  
  container_status=$(check_container_status "austa-web-app")
  endpoint_status=$(check_endpoint "$WEB_APP_URL" "/")
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Web App is not healthy, attempting recovery..."
    restart_container "austa-web-app"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-web-app")
    endpoint_status=$(check_endpoint "$WEB_APP_URL" "/")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Web App recovery successful"
    else
      log "ERROR" "Web App recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Web App\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check Dev Proxy health
check_dev_proxy() {
  local container_status
  local endpoint_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking Dev Proxy health..."
  
  container_status=$(check_container_status "austa-dev-proxy")
  endpoint_status=$(check_endpoint "$DEV_PROXY_URL" "/health")
  
  # Determine overall status
  if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$container_status" = "UNHEALTHY" ] || [ "$endpoint_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Dev Proxy is not healthy, attempting recovery..."
    restart_container "austa-dev-proxy"
    sleep 5
    
    # Re-check after recovery attempt
    container_status=$(check_container_status "austa-dev-proxy")
    endpoint_status=$(check_endpoint "$DEV_PROXY_URL" "/health")
    
    if [ "$container_status" = "HEALTHY" ] && [ "$endpoint_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Dev Proxy recovery successful"
    else
      log "ERROR" "Dev Proxy recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Dev Proxy\",
    \"container_status\": \"$container_status\",
    \"endpoint_status\": \"$endpoint_status\",
    \"overall_status\": \"$overall\"
  }"
}

# Check infrastructure services health
check_infrastructure() {
  local postgres_status
  local redis_status
  local kafka_status
  local zookeeper_status
  local overall="UNKNOWN"
  
  log "INFO" "Checking infrastructure services health..."
  
  postgres_status=$(check_container_status "austa-postgres")
  redis_status=$(check_container_status "austa-redis")
  kafka_status=$(check_container_status "austa-kafka")
  zookeeper_status=$(check_container_status "austa-zookeeper")
  
  # Determine overall status
  if [ "$postgres_status" = "HEALTHY" ] && [ "$redis_status" = "HEALTHY" ] && 
     [ "$kafka_status" = "HEALTHY" ] && [ "$zookeeper_status" = "HEALTHY" ]; then
    overall="HEALTHY"
  elif [ "$postgres_status" = "UNHEALTHY" ] || [ "$redis_status" = "UNHEALTHY" ] || 
       [ "$kafka_status" = "UNHEALTHY" ] || [ "$zookeeper_status" = "UNHEALTHY" ]; then
    overall="UNHEALTHY"
  else
    overall="DEGRADED"
  fi
  
  # Auto-recovery
  if [ "$AUTO_RECOVER" = true ] && [ "$overall" != "HEALTHY" ]; then
    log "WARN" "Infrastructure services are not healthy, attempting recovery..."
    
    if [ "$postgres_status" != "HEALTHY" ]; then
      restart_container "austa-postgres"
    fi
    
    if [ "$redis_status" != "HEALTHY" ]; then
      restart_container "austa-redis"
    fi
    
    if [ "$zookeeper_status" != "HEALTHY" ]; then
      restart_container "austa-zookeeper"
    fi
    
    if [ "$kafka_status" != "HEALTHY" ]; then
      # Only restart Kafka if Zookeeper is healthy
      if [ "$zookeeper_status" = "HEALTHY" ] || [ "$(check_container_status "austa-zookeeper")" = "HEALTHY" ]; then
        restart_container "austa-kafka"
      fi
    fi
    
    sleep 10
    
    # Re-check after recovery attempt
    postgres_status=$(check_container_status "austa-postgres")
    redis_status=$(check_container_status "austa-redis")
    kafka_status=$(check_container_status "austa-kafka")
    zookeeper_status=$(check_container_status "austa-zookeeper")
    
    if [ "$postgres_status" = "HEALTHY" ] && [ "$redis_status" = "HEALTHY" ] && 
       [ "$kafka_status" = "HEALTHY" ] && [ "$zookeeper_status" = "HEALTHY" ]; then
      overall="HEALTHY"
      log "INFO" "Infrastructure services recovery successful"
    else
      log "ERROR" "Infrastructure services recovery failed"
    fi
  fi
  
  # Return results
  echo "{
    \"service\": \"Infrastructure\",
    \"postgres_status\": \"$postgres_status\",
    \"redis_status\": \"$redis_status\",
    \"kafka_status\": \"$kafka_status\",
    \"zookeeper_status\": \"$zookeeper_status\",
    \"overall_status\": \"$overall\"
  }"
}

# ======================================================
# OUTPUT FORMATTING FUNCTIONS
# ======================================================

# Format results as JSON
format_json() {
  local results=$1
  
  echo "{
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"services\": [
    $results
  ]
}"
}

# Format results as terminal output
format_terminal() {
  local results=$1
  local services
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo -e "\n${BOLD}AUSTA SuperApp Service Health Check${NC}"
  echo -e "${BLUE}Timestamp:${NC} $timestamp\n"
  
  echo -e "${BOLD}SERVICES${NC}"
  echo -e "${BOLD}=========${NC}"
  
  # Parse JSON results
  services=$(echo "$results" | jq -c '.[]')
  
  # Display service status
  for service in $services; do
    local name=$(echo "$service" | jq -r '.service')
    local status=$(echo "$service" | jq -r '.overall_status')
    
    echo -e "${BOLD}$name:${NC} $(format_status "$status")"
    
    # Display detailed status
    if [ "$name" = "Infrastructure" ]; then
      echo -e "  PostgreSQL: $(format_status "$(echo "$service" | jq -r '.postgres_status')")"
      echo -e "  Redis: $(format_status "$(echo "$service" | jq -r '.redis_status')")"
      echo -e "  Kafka: $(format_status "$(echo "$service" | jq -r '.kafka_status')")"
      echo -e "  Zookeeper: $(format_status "$(echo "$service" | jq -r '.zookeeper_status')")"
    elif [ "$name" = "Gamification Engine" ]; then
      echo -e "  Container: $(format_status "$(echo "$service" | jq -r '.container_status')")"
      echo -e "  Endpoint: $(format_status "$(echo "$service" | jq -r '.endpoint_status')")"
      echo -e "  Database: $(format_status "$(echo "$service" | jq -r '.database_status')")"
      echo -e "  Kafka: $(format_status "$(echo "$service" | jq -r '.kafka_status')")"
      echo -e "  Kafka Topics: $(format_status "$(echo "$service" | jq -r '.kafka_topics_status')")"
    elif [ "$name" = "Web App" ] || [ "$name" = "Dev Proxy" ]; then
      echo -e "  Container: $(format_status "$(echo "$service" | jq -r '.container_status')")"
      echo -e "  Endpoint: $(format_status "$(echo "$service" | jq -r '.endpoint_status')")"
    else
      echo -e "  Container: $(format_status "$(echo "$service" | jq -r '.container_status')")"
      echo -e "  Endpoint: $(format_status "$(echo "$service" | jq -r '.endpoint_status')")"
      
      # Check if database_status exists
      if echo "$service" | jq -e '.database_status' >/dev/null 2>&1; then
        echo -e "  Database: $(format_status "$(echo "$service" | jq -r '.database_status')")"
      fi
      
      # Check if redis_status exists
      if echo "$service" | jq -e '.redis_status' >/dev/null 2>&1; then
        echo -e "  Redis: $(format_status "$(echo "$service" | jq -r '.redis_status')")"
      fi
      
      # Check if kafka_status exists
      if echo "$service" | jq -e '.kafka_status' >/dev/null 2>&1; then
        echo -e "  Kafka: $(format_status "$(echo "$service" | jq -r '.kafka_status')")"
      fi
    fi
    
    echo ""
  done
  
  # Display summary
  local healthy=$(echo "$services" | jq -r '.overall_status' | grep -c "HEALTHY")
  local degraded=$(echo "$services" | jq -r '.overall_status' | grep -c "DEGRADED")
  local unhealthy=$(echo "$services" | jq -r '.overall_status' | grep -c "UNHEALTHY")
  local total=$((healthy + degraded + unhealthy))
  
  echo -e "${BOLD}SUMMARY${NC}"
  echo -e "${BOLD}=======${NC}"
  echo -e "${GREEN}Healthy:${NC} $healthy/$total"
  echo -e "${YELLOW}Degraded:${NC} $degraded/$total"
  echo -e "${RED}Unhealthy:${NC} $unhealthy/$total\n"
}

# Format results as Markdown
format_markdown() {
  local results=$1
  local services
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo "# AUSTA SuperApp Service Health Check"
  echo ""
  echo "**Timestamp:** $timestamp"
  echo ""
  echo "## Services"
  echo ""
  
  # Parse JSON results
  services=$(echo "$results" | jq -c '.[]')
  
  # Create service status table
  echo "| Service | Status | Details |"
  echo "|---------|--------|--------|"
  
  # Display service status
  for service in $services; do
    local name=$(echo "$service" | jq -r '.service')
    local status=$(echo "$service" | jq -r '.overall_status')
    local details=""
    
    # Generate details
    if [ "$name" = "Infrastructure" ]; then
      details="PostgreSQL: $(echo "$service" | jq -r '.postgres_status')<br>"
      details+="Redis: $(echo "$service" | jq -r '.redis_status')<br>"
      details+="Kafka: $(echo "$service" | jq -r '.kafka_status')<br>"
      details+="Zookeeper: $(echo "$service" | jq -r '.zookeeper_status')"
    elif [ "$name" = "Gamification Engine" ]; then
      details="Container: $(echo "$service" | jq -r '.container_status')<br>"
      details+="Endpoint: $(echo "$service" | jq -r '.endpoint_status')<br>"
      details+="Database: $(echo "$service" | jq -r '.database_status')<br>"
      details+="Kafka: $(echo "$service" | jq -r '.kafka_status')<br>"
      details+="Kafka Topics: $(echo "$service" | jq -r '.kafka_topics_status')"
    elif [ "$name" = "Web App" ] || [ "$name" = "Dev Proxy" ]; then
      details="Container: $(echo "$service" | jq -r '.container_status')<br>"
      details+="Endpoint: $(echo "$service" | jq -r '.endpoint_status')"
    else
      details="Container: $(echo "$service" | jq -r '.container_status')<br>"
      details+="Endpoint: $(echo "$service" | jq -r '.endpoint_status')"
      
      # Check if database_status exists
      if echo "$service" | jq -e '.database_status' >/dev/null 2>&1; then
        details+="<br>Database: $(echo "$service" | jq -r '.database_status')"
      fi
      
      # Check if redis_status exists
      if echo "$service" | jq -e '.redis_status' >/dev/null 2>&1; then
        details+="<br>Redis: $(echo "$service" | jq -r '.redis_status')"
      fi
      
      # Check if kafka_status exists
      if echo "$service" | jq -e '.kafka_status' >/dev/null 2>&1; then
        details+="<br>Kafka: $(echo "$service" | jq -r '.kafka_status')"
      fi
    fi
    
    echo "| $name | $status | $details |"
  done
  
  echo ""
  
  # Display summary
  local healthy=$(echo "$services" | jq -r '.overall_status' | grep -c "HEALTHY")
  local degraded=$(echo "$services" | jq -r '.overall_status' | grep -c "DEGRADED")
  local unhealthy=$(echo "$services" | jq -r '.overall_status' | grep -c "UNHEALTHY")
  local total=$((healthy + degraded + unhealthy))
  
  echo "## Summary"
  echo ""
  echo "- **Healthy:** $healthy/$total"
  echo "- **Degraded:** $degraded/$total"
  echo "- **Unhealthy:** $unhealthy/$total"
}

# ======================================================
# MAIN FUNCTION
# ======================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage
      exit 0
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -j|--journey)
      JOURNEY="$2"
      shift 2
      ;;
    -r|--recover)
      AUTO_RECOVER=true
      shift
      ;;
    -o|--output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    -f|--file)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --retries)
      RETRIES="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
do
done

# Validate journey parameter
if [[ ! "$JOURNEY" =~ ^(all|health|care|plan)$ ]]; then
  log "ERROR" "Invalid journey: $JOURNEY. Valid options are: all, health, care, plan"
  exit 1
fi

# Validate output format
if [[ ! "$OUTPUT_FORMAT" =~ ^(terminal|json|markdown)$ ]]; then
  log "ERROR" "Invalid output format: $OUTPUT_FORMAT. Valid options are: terminal, json, markdown"
  exit 1
fi

# Check requirements
check_requirements

# Check if Docker is running
if ! check_docker_running; then
  log "ERROR" "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Run health checks
log "INFO" "Starting health checks..."

# Initialize results array
results=""

# Check infrastructure services
infrastructure_result=$(check_infrastructure)
results+="$infrastructure_result"

# Check API Gateway
api_gateway_result=$(check_api_gateway)
results+=",$api_gateway_result"

# Check Auth Service
auth_service_result=$(check_auth_service)
results+=",$auth_service_result"

# Check journey-specific services
if [[ "$JOURNEY" == "all" ]] || [[ "$JOURNEY" == "health" ]]; then
  health_service_result=$(check_health_service)
  results+=",$health_service_result"
fi

if [[ "$JOURNEY" == "all" ]] || [[ "$JOURNEY" == "care" ]]; then
  care_service_result=$(check_care_service)
  results+=",$care_service_result"
fi

if [[ "$JOURNEY" == "all" ]] || [[ "$JOURNEY" == "plan" ]]; then
  plan_service_result=$(check_plan_service)
  results+=",$plan_service_result"
fi

# Check Gamification Engine
gamification_engine_result=$(check_gamification_engine)
results+=",$gamification_engine_result"

# Check Notification Service
notification_service_result=$(check_notification_service)
results+=",$notification_service_result"

# Check Web App
web_app_result=$(check_web_app)
results+=",$web_app_result"

# Check Dev Proxy
dev_proxy_result=$(check_dev_proxy)
results+=",$dev_proxy_result"

# Format results
case $OUTPUT_FORMAT in
  "json")
    formatted_results=$(format_json "$results")
    ;;
  "markdown")
    formatted_results=$(format_markdown "$results")
    ;;
  "terminal")
    formatted_results=$(format_terminal "$results")
    ;;
esac

# Output results
if [ -n "$OUTPUT_FILE" ]; then
  echo "$formatted_results" > "$OUTPUT_FILE"
  log "INFO" "Results written to $OUTPUT_FILE"
else
  echo "$formatted_results"
fi

# Check if any services are unhealthy
if echo "$results" | jq -r '.overall_status' | grep -q "UNHEALTHY"; then
  log "ERROR" "Some services are unhealthy. Please check the results for details."
  exit 1
fi

log "INFO" "Health check completed successfully."
exit 0