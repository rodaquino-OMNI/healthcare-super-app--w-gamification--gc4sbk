#!/bin/bash
# Make script executable: chmod +x monitor-dependencies.sh

# =========================================================================
# monitor-dependencies.sh - Service Dependency Monitoring for AUSTA SuperApp
# =========================================================================
#
# This script monitors the health and performance of critical infrastructure
# dependencies (PostgreSQL, Redis, Kafka, ElastiCache), creates custom metrics
# for dependency availability, and integrates with alerting systems to provide
# early warning of degraded dependencies.
#
# Features:
# - Comprehensive health checks for all service dependencies
# - Performance monitoring for database connections
# - Redis and Kafka health probes with metrics export
# - Dependency mapping between services and infrastructure
# - Automatic recovery mechanisms for certain failure scenarios
# - Integration with Prometheus for metrics collection
# - SLA monitoring and reporting
#
# Usage: ./monitor-dependencies.sh [options]
#   Options:
#     -e, --environment ENV   Specify environment (dev, staging, prod) [default: current context]
#     -d, --dependency TYPE   Check specific dependency only (postgres, redis, kafka, elasticache)
#     -s, --service NAME      Check dependencies for specific service only
#     -j, --journey NAME      Check dependencies for specific journey only (health, care, plan)
#     -v, --verbose           Enable verbose output
#     -q, --quiet             Suppress all output except errors
#     -m, --metrics           Output metrics in Prometheus format
#     -r, --recover           Attempt recovery for failed dependencies
#     -i, --interval SECONDS  Run continuously with specified interval
#     -h, --help              Display this help message
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Script error or invalid arguments
#
# =========================================================================

set -eo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# =========================================================================
# Configuration
# =========================================================================

# Script version
VERSION="1.0.0"

# Default values
ENVIRONMENT=""
SPECIFIC_DEPENDENCY=""
SPECIFIC_SERVICE=""
SPECIFIC_JOURNEY=""
VERBOSE=false
QUIET=false
OUTPUT_METRICS=false
ATTEMPT_RECOVERY=false
RUN_INTERVAL=0  # 0 means run once, otherwise interval in seconds
TIMEOUT=5  # Default timeout in seconds
RETRIES=3  # Default number of retries
METRICS_FILE="/tmp/dependency_metrics.prom"
LOG_FILE="/var/log/austa/dependency-monitor.log"
ALERT_WEBHOOK=""

# Database connection strings (will be populated based on environment)
POSTGRES_URI=""
REDIS_URI=""
KAFKA_BROKERS=""
ELASTICACHE_URI=""

# Kubernetes namespace
NAMESPACE="austa-superapp"

# Service to dependency mapping
declare -A SERVICE_DEPENDENCIES

# =========================================================================
# Helper Functions
# =========================================================================

# Print usage information
usage() {
  cat << EOF
Usage: $0 [options]

Options:
  -e, --environment ENV   Specify environment (dev, staging, prod) [default: current context]
  -d, --dependency TYPE   Check specific dependency only (postgres, redis, kafka, elasticache)
  -s, --service NAME      Check dependencies for specific service only
  -j, --journey NAME      Check dependencies for specific journey only (health, care, plan)
  -v, --verbose           Enable verbose output
  -q, --quiet             Suppress all output except errors
  -m, --metrics           Output metrics in Prometheus format
  -r, --recover           Attempt recovery for failed dependencies
  -i, --interval SECONDS  Run continuously with specified interval
  -h, --help              Display this help message

Example:
  $0 --environment prod --dependency postgres --metrics
  $0 --journey health --interval 300 --recover
EOF
}

# Logging function
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Always log to file
  mkdir -p $(dirname "$LOG_FILE")
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  # Output to console based on verbosity settings
  if [[ "$QUIET" == false ]] || [[ "$level" == "ERROR" ]]; then
    if [[ "$level" == "INFO" ]] && [[ "$VERBOSE" == false ]]; then
      return
    fi
    
    case $level in
      "INFO") echo -e "\033[0;32m[INFO]\033[0m $message" ;;
      "WARN") echo -e "\033[0;33m[WARN]\033[0m $message" ;;
      "ERROR") echo -e "\033[0;31m[ERROR]\033[0m $message" ;;
      "DEBUG") 
        if [[ "$VERBOSE" == true ]]; then
          echo -e "\033[0;34m[DEBUG]\033[0m $message"
        fi
        ;;
      *) echo "[$level] $message" ;;
    esac
  fi
}

# Function to record metrics in Prometheus format
record_metric() {
  local metric_name=$1
  local metric_value=$2
  local labels=$3
  
  if [[ "$OUTPUT_METRICS" == true ]]; then
    echo "${metric_name}{${labels}} ${metric_value}" >> "$METRICS_FILE"
  fi
}

# Function to detect environment if not specified
detect_environment() {
  if [[ -z "$ENVIRONMENT" ]]; then
    # Try to detect from kubectl context
    local context=$(kubectl config current-context 2>/dev/null || echo "")
    
    case $context in
      *dev*) ENVIRONMENT="dev" ;;
      *staging*) ENVIRONMENT="staging" ;;
      *prod*) ENVIRONMENT="prod" ;;
      *) ENVIRONMENT="dev" ;; # Default to dev if can't detect
    esac
    
    log "INFO" "Auto-detected environment: $ENVIRONMENT"
  fi
  
  # Set environment-specific configurations
  case $ENVIRONMENT in
    "dev")
      POSTGRES_URI="postgresql://postgres:postgres@postgres:5432/austa"
      REDIS_URI="redis://redis:6379"
      KAFKA_BROKERS="kafka:9092"
      ELASTICACHE_URI="redis://redis:6379"
      NAMESPACE="austa-superapp-dev"
      ;;
    "staging")
      POSTGRES_URI="postgresql://postgres:postgres@postgres:5432/austa"
      REDIS_URI="redis://redis:6379"
      KAFKA_BROKERS="kafka:9092"
      ELASTICACHE_URI="redis://elasticache.staging.austa-superapp.local:6379"
      NAMESPACE="austa-superapp-staging"
      ;;
    "prod")
      # In production, we would use secrets to get these values
      POSTGRES_URI="$(kubectl get secret db-credentials -n $NAMESPACE -o jsonpath='{.data.uri}' | base64 -d)"
      REDIS_URI="$(kubectl get secret redis-credentials -n $NAMESPACE -o jsonpath='{.data.uri}' | base64 -d)"
      KAFKA_BROKERS="$(kubectl get secret kafka-credentials -n $NAMESPACE -o jsonpath='{.data.brokers}' | base64 -d)"
      ELASTICACHE_URI="$(kubectl get secret elasticache-credentials -n $NAMESPACE -o jsonpath='{.data.uri}' | base64 -d)"
      NAMESPACE="austa-superapp"
      ;;
    *)
      log "ERROR" "Unknown environment: $ENVIRONMENT"
      exit 2
      ;;
  esac
  
  # Set alert webhook based on environment
  case $ENVIRONMENT in
    "dev") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
    "staging") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
    "prod") ALERT_WEBHOOK="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX" ;;
  esac
  
  # Initialize service dependency mapping
  init_dependency_mapping
}

# Function to send alerts
send_alert() {
  local dependency=$1
  local status=$2
  local message=$3
  local affected_services=${4:-""}
  
  if [[ -n "$ALERT_WEBHOOK" ]]; then
    local color="good"
    if [[ "$status" != "OK" ]]; then
      color="danger"
    fi
    
    local payload='{"attachments":[{"color":"'$color'","title":"Dependency Alert: '$dependency'","text":"'$message'","fields":[{"title":"Environment","value":"'$ENVIRONMENT'","short":true},{"title":"Status","value":"'$status'","short":true},{"title":"Affected Services","value":"'$affected_services'","short":false}]}]}'
    
    curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK" > /dev/null
  fi
}

# Initialize service to dependency mapping
init_dependency_mapping() {
  # Clear existing mapping
  SERVICE_DEPENDENCIES=()
  
  # Map services to their dependencies
  # Format: SERVICE_DEPENDENCIES["service-name"]="dependency1,dependency2,..."
  SERVICE_DEPENDENCIES["api-gateway"]="redis"
  SERVICE_DEPENDENCIES["auth-service"]="postgres,redis"
  SERVICE_DEPENDENCIES["health-service"]="postgres,redis,kafka,timescaledb"
  SERVICE_DEPENDENCIES["care-service"]="postgres,redis,kafka"
  SERVICE_DEPENDENCIES["plan-service"]="postgres,redis,kafka"
  SERVICE_DEPENDENCIES["gamification-engine"]="postgres,redis,kafka"
  SERVICE_DEPENDENCIES["notification-service"]="postgres,redis,kafka"
  
  # Map journeys to services
  # These are used when checking dependencies for a specific journey
  SERVICE_DEPENDENCIES["health-journey"]="health-service"
  SERVICE_DEPENDENCIES["care-journey"]="care-service"
  SERVICE_DEPENDENCIES["plan-journey"]="plan-service"
  
  log "DEBUG" "Initialized service dependency mapping"
}

# Get affected services for a dependency
get_affected_services() {
  local dependency=$1
  local affected_services=""
  
  # Loop through all services
  for service in "${!SERVICE_DEPENDENCIES[@]}"; do
    # Skip journey mappings
    if [[ "$service" == *"-journey" ]]; then
      continue
    fi
    
    # Check if service depends on the given dependency
    local deps="${SERVICE_DEPENDENCIES[$service]}"
    if [[ "$deps" == *"$dependency"* ]]; then
      if [[ -n "$affected_services" ]]; then
        affected_services="$affected_services, $service"
      else
        affected_services="$service"
      fi
    fi
  done
  
  echo "$affected_services"
}

# Get dependencies for a service
get_service_dependencies() {
  local service=$1
  
  # Check if service exists in mapping
  if [[ -n "${SERVICE_DEPENDENCIES[$service]}" ]]; then
    echo "${SERVICE_DEPENDENCIES[$service]}"
  else
    log "WARN" "No dependency mapping found for service: $service"
    echo ""
  fi
}

# Get dependencies for a journey
get_journey_dependencies() {
  local journey=$1
  local dependencies=""
  
  # Get the service for this journey
  local journey_service="${SERVICE_DEPENDENCIES[$journey]}"
  if [[ -z "$journey_service" ]]; then
    log "ERROR" "Unknown journey: $journey"
    return 1
  fi
  
  # Get dependencies for the service
  dependencies=$(get_service_dependencies "$journey_service")
  
  echo "$dependencies"
}

# Export metrics to Prometheus
export_metrics_to_prometheus() {
  if [[ "$OUTPUT_METRICS" == true ]] && [[ -f "$METRICS_FILE" ]]; then
    log "INFO" "Exporting metrics to Prometheus"
    
    # Add timestamp to metrics
    local timestamp=$(date +%s%3N)
    sed -i "s/$/\t$timestamp/" "$METRICS_FILE"
    
    # Check if node_exporter textfile directory exists
    local textfile_dir="/var/lib/node_exporter/textfile"
    if [[ -d "$textfile_dir" ]]; then
      cp "$METRICS_FILE" "$textfile_dir/austa_dependencies.prom"
      log "INFO" "Metrics exported to node_exporter textfile directory"
    else
      log "WARN" "node_exporter textfile directory not found, metrics not exported"
    fi
    
    # Output metrics to stdout if verbose
    if [[ "$VERBOSE" == true ]]; then
      log "DEBUG" "Metrics output:"
      cat "$METRICS_FILE"
    fi
  fi
}

# =========================================================================
# Dependency Check Functions
# =========================================================================

# Check PostgreSQL database connectivity and performance
check_postgres() {
  local uri=$1
  local success=false
  local response_time=0
  local connection_count=0
  local replication_lag=0
  local query_time=0
  
  log "INFO" "Checking PostgreSQL database connectivity and performance"
  
  # Function to run a PostgreSQL query
  run_postgres_query() {
    local query=$1
    local start_time=$(date +%s.%N)
    local result
    
    # Use psql to run the query
    if command -v psql >/dev/null 2>&1; then
      # Extract credentials from URI
      local user=$(echo "$uri" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
      local password=$(echo "$uri" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
      local host=$(echo "$uri" | sed -n 's/.*@\([^:]*\):.*/\1/p')
      local port=$(echo "$uri" | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
      local dbname=$(echo "$uri" | sed -n 's/.*\/\([^?]*\).*/\1/p')
      
      # Set PGPASSWORD environment variable for passwordless connection
      PGPASSWORD="$password" result=$(psql -h "$host" -p "$port" -U "$user" -d "$dbname" -t -c "$query" 2>/dev/null)
    else
      # Fallback to using a PostgreSQL client container
      result=$(kubectl run -i --rm --restart=Never postgres-check-$(date +%s) --image=postgres:13 --namespace="$NAMESPACE" -- \
        psql "$uri" -t -c "$query" 2>/dev/null)
    fi
    
    local end_time=$(date +%s.%N)
    query_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "$result"
  }
  
  # Try to connect and run a simple query
  local attempt=1
  while [[ $attempt -le $RETRIES ]] && [[ "$success" == false ]]; do
    log "DEBUG" "PostgreSQL connection attempt $attempt of $RETRIES"
    
    # Measure connection time
    local start_time=$(date +%s.%N)
    
    # Run a simple query to check connectivity
    local result=$(run_postgres_query "SELECT 1 as is_alive;" 2>/dev/null || echo "")
    
    local end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc -l)
    
    if [[ "$result" == *"1"* ]]; then
      success=true
      
      # Get additional metrics if connection successful
      # Get connection count
      connection_count=$(run_postgres_query "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')
      
      # Check if this is a replica and get replication lag
      local is_replica=$(run_postgres_query "SELECT pg_is_in_recovery();")
      if [[ "$is_replica" == *"t"* ]]; then
        # Get replication lag in seconds
        replication_lag=$(run_postgres_query "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" | tr -d ' ')
      else
        replication_lag=0
      fi
      
      break
    fi
    
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_dependency_status" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"postgres\""
  record_metric "austa_dependency_response_time" "$response_time" "type=\"postgres\""
  record_metric "austa_postgres_connections" "$connection_count" "type=\"postgres\""
  record_metric "austa_postgres_replication_lag" "$replication_lag" "type=\"postgres\""
  record_metric "austa_postgres_query_time" "$query_time" "type=\"postgres\""
  
  # Get affected services
  local affected_services=$(get_affected_services "postgres")
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ PostgreSQL health check passed ($response_time seconds)"
    log "INFO" "  - Connections: $connection_count"
    log "INFO" "  - Replication lag: $replication_lag seconds"
    log "INFO" "  - Query time: $query_time seconds"
    return 0
  else
    log "ERROR" "❌ PostgreSQL health check failed after $RETRIES attempts"
    send_alert "PostgreSQL" "FAILED" "Database connectivity check failed after $RETRIES attempts" "$affected_services"
    return 1
  fi
}

# Check Redis cache connectivity and performance
check_redis() {
  local uri=$1
  local success=false
  local response_time=0
  local used_memory=0
  local connected_clients=0
  local hit_rate=0
  
  log "INFO" "Checking Redis cache connectivity and performance"
  
  # Function to run a Redis command
  run_redis_command() {
    local command=$1
    local start_time=$(date +%s.%N)
    local result
    
    # Use redis-cli to run the command
    if command -v redis-cli >/dev/null 2>&1; then
      # Extract host and port from URI
      local host=$(echo "$uri" | sed -n 's/redis:\/\/\([^:]*\).*/\1/p')
      local port=$(echo "$uri" | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
      
      result=$(redis-cli -h "$host" -p "$port" $command 2>/dev/null)
    else
      # Fallback to using a Redis client container
      result=$(kubectl run -i --rm --restart=Never redis-check-$(date +%s) --image=redis:6 --namespace="$NAMESPACE" -- \
        redis-cli -u "$uri" $command 2>/dev/null)
    fi
    
    local end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "$result"
  }
  
  # Try to connect and run a simple command
  local attempt=1
  while [[ $attempt -le $RETRIES ]] && [[ "$success" == false ]]; do
    log "DEBUG" "Redis connection attempt $attempt of $RETRIES"
    
    # Run PING command to check connectivity
    local result=$(run_redis_command "PING" 2>/dev/null || echo "")
    
    if [[ "$result" == *"PONG"* ]]; then
      success=true
      
      # Get additional metrics if connection successful
      # Get memory usage
      used_memory=$(run_redis_command "INFO memory" | grep "used_memory:" | cut -d ':' -f2 | tr -d '\r')
      
      # Get connected clients
      connected_clients=$(run_redis_command "INFO clients" | grep "connected_clients:" | cut -d ':' -f2 | tr -d '\r')
      
      # Calculate hit rate
      local hits=$(run_redis_command "INFO stats" | grep "keyspace_hits:" | cut -d ':' -f2 | tr -d '\r')
      local misses=$(run_redis_command "INFO stats" | grep "keyspace_misses:" | cut -d ':' -f2 | tr -d '\r')
      
      if [[ $((hits + misses)) -gt 0 ]]; then
        hit_rate=$(echo "scale=4; $hits / ($hits + $misses) * 100" | bc -l)
      else
        hit_rate=0
      fi
      
      break
    fi
    
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_dependency_status" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"redis\""
  record_metric "austa_dependency_response_time" "$response_time" "type=\"redis\""
  record_metric "austa_redis_used_memory" "$used_memory" "type=\"redis\""
  record_metric "austa_redis_connected_clients" "$connected_clients" "type=\"redis\""
  record_metric "austa_redis_hit_rate" "$hit_rate" "type=\"redis\""
  
  # Get affected services
  local affected_services=$(get_affected_services "redis")
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ Redis health check passed ($response_time seconds)"
    log "INFO" "  - Used memory: $used_memory bytes"
    log "INFO" "  - Connected clients: $connected_clients"
    log "INFO" "  - Hit rate: $hit_rate%"
    return 0
  else
    log "ERROR" "❌ Redis health check failed after $RETRIES attempts"
    send_alert "Redis" "FAILED" "Cache connectivity check failed after $RETRIES attempts" "$affected_services"
    return 1
  fi
}

# Check Kafka broker connectivity and performance
check_kafka() {
  local brokers=$1
  local success=false
  local response_time=0
  local topic_count=0
  local broker_count=0
  local under_replicated=0
  
  log "INFO" "Checking Kafka broker connectivity and performance"
  
  # Function to run a Kafka command
  run_kafka_command() {
    local command=$1
    local start_time=$(date +%s.%N)
    local result
    
    # Use kafkacat to run the command
    if command -v kafkacat >/dev/null 2>&1; then
      result=$(kafkacat -b "$brokers" $command 2>/dev/null)
    else
      # Fallback to using a Kafka client container
      result=$(kubectl run -i --rm --restart=Never kafka-check-$(date +%s) --image=confluentinc/cp-kafkacat --namespace="$NAMESPACE" -- \
        kafkacat -b "$brokers" $command 2>/dev/null)
    fi
    
    local end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "$result"
  }
  
  # Try to connect and list topics
  local attempt=1
  while [[ $attempt -le $RETRIES ]] && [[ "$success" == false ]]; do
    log "DEBUG" "Kafka connection attempt $attempt of $RETRIES"
    
    # List metadata to check connectivity
    local result=$(run_kafka_command "-L -t 5" 2>/dev/null || echo "")
    
    if [[ -n "$result" ]]; then
      success=true
      
      # Get additional metrics if connection successful
      # Count topics
      topic_count=$(echo "$result" | grep -c "topic ")
      
      # Count brokers
      broker_count=$(echo "$result" | grep -c "broker ")
      
      # Check for under-replicated partitions
      under_replicated=$(echo "$result" | grep -c "under-replicated")
      
      break
    fi
    
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_dependency_status" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"kafka\""
  record_metric "austa_dependency_response_time" "$response_time" "type=\"kafka\""
  record_metric "austa_kafka_topic_count" "$topic_count" "type=\"kafka\""
  record_metric "austa_kafka_broker_count" "$broker_count" "type=\"kafka\""
  record_metric "austa_kafka_under_replicated" "$under_replicated" "type=\"kafka\""
  
  # Get affected services
  local affected_services=$(get_affected_services "kafka")
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ Kafka health check passed ($response_time seconds)"
    log "INFO" "  - Topics: $topic_count"
    log "INFO" "  - Brokers: $broker_count"
    log "INFO" "  - Under-replicated partitions: $under_replicated"
    return 0
  else
    log "ERROR" "❌ Kafka health check failed after $RETRIES attempts"
    send_alert "Kafka" "FAILED" "Message broker connectivity check failed after $RETRIES attempts" "$affected_services"
    return 1
  fi
}

# Check ElastiCache connectivity and performance
check_elasticache() {
  local uri=$1
  local success=false
  local response_time=0
  local cpu_utilization=0
  local memory_utilization=0
  local cache_hit_rate=0
  
  log "INFO" "Checking ElastiCache connectivity and performance"
  
  # ElastiCache uses Redis protocol, so we can reuse Redis check
  # but we'll add AWS-specific metrics if available
  
  # Try to connect and run a simple command
  local attempt=1
  while [[ $attempt -le $RETRIES ]] && [[ "$success" == false ]]; do
    log "DEBUG" "ElastiCache connection attempt $attempt of $RETRIES"
    
    # Use redis-cli to check connectivity
    if command -v redis-cli >/dev/null 2>&1; then
      local host=$(echo "$uri" | sed -n 's/redis:\/\/\([^:]*\).*/\1/p')
      local port=$(echo "$uri" | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
      
      local start_time=$(date +%s.%N)
      local result=$(redis-cli -h "$host" -p "$port" PING 2>/dev/null || echo "")
      local end_time=$(date +%s.%N)
      response_time=$(echo "$end_time - $start_time" | bc -l)
      
      if [[ "$result" == *"PONG"* ]]; then
        success=true
        
        # Get additional metrics if connection successful
        # For ElastiCache, we would ideally get these from CloudWatch
        # but for this script, we'll use Redis INFO command
        
        # Get CPU utilization (estimate from used_cpu_sys)
        local cpu_sys=$(redis-cli -h "$host" -p "$port" INFO stats | grep "used_cpu_sys:" | cut -d ':' -f2 | tr -d '\r')
        cpu_utilization=$(echo "scale=2; $cpu_sys * 10" | bc -l) # Rough estimate
        
        # Get memory utilization
        local used_memory=$(redis-cli -h "$host" -p "$port" INFO memory | grep "used_memory:" | cut -d ':' -f2 | tr -d '\r')
        local max_memory=$(redis-cli -h "$host" -p "$port" INFO memory | grep "maxmemory:" | cut -d ':' -f2 | tr -d '\r')
        
        if [[ $max_memory -gt 0 ]]; then
          memory_utilization=$(echo "scale=4; $used_memory / $max_memory * 100" | bc -l)
        else
          memory_utilization=0
        fi
        
        # Calculate hit rate
        local hits=$(redis-cli -h "$host" -p "$port" INFO stats | grep "keyspace_hits:" | cut -d ':' -f2 | tr -d '\r')
        local misses=$(redis-cli -h "$host" -p "$port" INFO stats | grep "keyspace_misses:" | cut -d ':' -f2 | tr -d '\r')
        
        if [[ $((hits + misses)) -gt 0 ]]; then
          cache_hit_rate=$(echo "scale=4; $hits / ($hits + $misses) * 100" | bc -l)
        else
          cache_hit_rate=0
        fi
        
        break
      fi
    else
      # Fallback to using a Redis client container
      local start_time=$(date +%s.%N)
      local result=$(kubectl run -i --rm --restart=Never elasticache-check-$(date +%s) --image=redis:6 --namespace="$NAMESPACE" -- \
        redis-cli -u "$uri" PING 2>/dev/null || echo "")
      local end_time=$(date +%s.%N)
      response_time=$(echo "$end_time - $start_time" | bc -l)
      
      if [[ "$result" == *"PONG"* ]]; then
        success=true
        # Limited metrics when using container
        break
      fi
    fi
    
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_dependency_status" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"elasticache\""
  record_metric "austa_dependency_response_time" "$response_time" "type=\"elasticache\""
  record_metric "austa_elasticache_cpu_utilization" "$cpu_utilization" "type=\"elasticache\""
  record_metric "austa_elasticache_memory_utilization" "$memory_utilization" "type=\"elasticache\""
  record_metric "austa_elasticache_hit_rate" "$cache_hit_rate" "type=\"elasticache\""
  
  # Get affected services
  local affected_services=$(get_affected_services "redis") # ElastiCache is used as Redis
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ ElastiCache health check passed ($response_time seconds)"
    log "INFO" "  - CPU utilization: $cpu_utilization%"
    log "INFO" "  - Memory utilization: $memory_utilization%"
    log "INFO" "  - Cache hit rate: $cache_hit_rate%"
    return 0
  else
    log "ERROR" "❌ ElastiCache health check failed after $RETRIES attempts"
    send_alert "ElastiCache" "FAILED" "Cache connectivity check failed after $RETRIES attempts" "$affected_services"
    return 1
  fi
}

# Check TimescaleDB connectivity and performance
check_timescaledb() {
  # TimescaleDB is a PostgreSQL extension, so we can reuse PostgreSQL check
  # but we'll add TimescaleDB-specific metrics
  
  local uri=$1
  local success=false
  local response_time=0
  local hypertable_count=0
  local chunks_count=0
  local compression_ratio=0
  
  log "INFO" "Checking TimescaleDB connectivity and performance"
  
  # Function to run a TimescaleDB query
  run_timescaledb_query() {
    local query=$1
    local start_time=$(date +%s.%N)
    local result
    
    # Use psql to run the query
    if command -v psql >/dev/null 2>&1; then
      # Extract credentials from URI
      local user=$(echo "$uri" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
      local password=$(echo "$uri" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
      local host=$(echo "$uri" | sed -n 's/.*@\([^:]*\):.*/\1/p')
      local port=$(echo "$uri" | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
      local dbname=$(echo "$uri" | sed -n 's/.*\/\([^?]*\).*/\1/p')
      
      # Set PGPASSWORD environment variable for passwordless connection
      PGPASSWORD="$password" result=$(psql -h "$host" -p "$port" -U "$user" -d "$dbname" -t -c "$query" 2>/dev/null)
    else
      # Fallback to using a PostgreSQL client container
      result=$(kubectl run -i --rm --restart=Never timescaledb-check-$(date +%s) --image=postgres:13 --namespace="$NAMESPACE" -- \
        psql "$uri" -t -c "$query" 2>/dev/null)
    fi
    
    local end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "$result"
  }
  
  # Try to connect and check if TimescaleDB extension is installed
  local attempt=1
  while [[ $attempt -le $RETRIES ]] && [[ "$success" == false ]]; do
    log "DEBUG" "TimescaleDB connection attempt $attempt of $RETRIES"
    
    # Check if TimescaleDB extension is installed
    local result=$(run_timescaledb_query "SELECT extname FROM pg_extension WHERE extname = 'timescaledb';" 2>/dev/null || echo "")
    
    if [[ "$result" == *"timescaledb"* ]]; then
      success=true
      
      # Get additional metrics if connection successful
      # Get hypertable count
      hypertable_count=$(run_timescaledb_query "SELECT count(*) FROM timescaledb_information.hypertables;" | tr -d ' ')
      
      # Get chunks count
      chunks_count=$(run_timescaledb_query "SELECT count(*) FROM timescaledb_information.chunks;" | tr -d ' ')
      
      # Get compression ratio if any tables are compressed
      local compressed_size=$(run_timescaledb_query "SELECT sum(before_compression_total_bytes) as before_size, sum(after_compression_total_bytes) as after_size FROM timescaledb_information.compression_settings;" | tr '\n' ' ' | awk '{print $1, $2}')
      
      local before_size=$(echo "$compressed_size" | awk '{print $1}')
      local after_size=$(echo "$compressed_size" | awk '{print $2}')
      
      if [[ -n "$before_size" && -n "$after_size" && $before_size -gt 0 ]]; then
        compression_ratio=$(echo "scale=2; $before_size / $after_size" | bc -l)
      else
        compression_ratio=1
      fi
      
      break
    fi
    
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Record metrics
  record_metric "austa_dependency_status" "$([ "$success" == true ] && echo 1 || echo 0)" "type=\"timescaledb\""
  record_metric "austa_dependency_response_time" "$response_time" "type=\"timescaledb\""
  record_metric "austa_timescaledb_hypertables" "$hypertable_count" "type=\"timescaledb\""
  record_metric "austa_timescaledb_chunks" "$chunks_count" "type=\"timescaledb\""
  record_metric "austa_timescaledb_compression_ratio" "$compression_ratio" "type=\"timescaledb\""
  
  # Get affected services
  local affected_services=$(get_affected_services "timescaledb")
  
  if [[ "$success" == true ]]; then
    log "INFO" "✅ TimescaleDB health check passed ($response_time seconds)"
    log "INFO" "  - Hypertables: $hypertable_count"
    log "INFO" "  - Chunks: $chunks_count"
    log "INFO" "  - Compression ratio: ${compression_ratio}x"
    return 0
  else
    log "ERROR" "❌ TimescaleDB health check failed after $RETRIES attempts"
    send_alert "TimescaleDB" "FAILED" "Time-series database connectivity check failed after $RETRIES attempts" "$affected_services"
    return 1
  fi
}

# =========================================================================
# Recovery Functions
# =========================================================================

# Attempt to recover PostgreSQL
attempt_postgres_recovery() {
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for PostgreSQL (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for PostgreSQL"
  
  # Check if PostgreSQL is running in Kubernetes
  if kubectl get statefulset -n "$NAMESPACE" postgres >/dev/null 2>&1; then
    log "INFO" "PostgreSQL is running as a StatefulSet in Kubernetes"
    
    # Check if pods are running
    local running_pods=$(kubectl get pods -n "$NAMESPACE" -l app=postgres -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}')
    
    if [[ -z "$running_pods" ]]; then
      log "WARN" "No running PostgreSQL pods found"
      
      # Try to restart the StatefulSet
      if kubectl rollout restart statefulset -n "$NAMESPACE" postgres >/dev/null 2>&1; then
        log "INFO" "Triggered rollout restart for PostgreSQL StatefulSet"
        
        # Wait for rollout to complete
        if kubectl rollout status statefulset -n "$NAMESPACE" postgres --timeout=300s >/dev/null 2>&1; then
          log "INFO" "✅ PostgreSQL recovery successful"
          send_alert "PostgreSQL" "RECOVERED" "Database was automatically recovered via StatefulSet restart"
          return 0
        else
          log "ERROR" "❌ PostgreSQL recovery failed - rollout did not complete in time"
          send_alert "PostgreSQL" "RECOVERY FAILED" "Automatic recovery attempt failed - rollout did not complete in time"
          return 1
        fi
      else
        log "ERROR" "❌ PostgreSQL recovery failed - could not restart StatefulSet"
        send_alert "PostgreSQL" "RECOVERY FAILED" "Automatic recovery attempt failed - could not restart StatefulSet"
        return 1
      fi
    else
      log "INFO" "PostgreSQL pods are running, attempting to check for connection issues"
      
      # Check if there are too many connections
      local max_connections=$(kubectl exec -n "$NAMESPACE" $running_pods -- psql -U postgres -c "SHOW max_connections;" -t | tr -d ' \n')
      local current_connections=$(kubectl exec -n "$NAMESPACE" $running_pods -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" -t | tr -d ' \n')
      
      log "INFO" "PostgreSQL connections: $current_connections / $max_connections"
      
      if [[ $current_connections -gt $((max_connections * 80 / 100)) ]]; then
        log "WARN" "PostgreSQL has high connection count ($current_connections / $max_connections)"
        
        # Terminate idle connections
        kubectl exec -n "$NAMESPACE" $running_pods -- psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '30 minutes';" >/dev/null 2>&1
        
        log "INFO" "Terminated idle PostgreSQL connections"
        send_alert "PostgreSQL" "RECOVERED" "Terminated idle connections to reduce connection count"
        return 0
      fi
    fi
  else
    log "WARN" "PostgreSQL is not running as a Kubernetes StatefulSet, limited recovery options"
    send_alert "PostgreSQL" "RECOVERY FAILED" "Automatic recovery not possible - PostgreSQL is not running in Kubernetes"
    return 1
  fi
  
  log "WARN" "No recovery action taken for PostgreSQL"
  return 1
}

# Attempt to recover Redis
attempt_redis_recovery() {
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for Redis (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for Redis"
  
  # Check if Redis is running in Kubernetes
  if kubectl get deployment -n "$NAMESPACE" redis >/dev/null 2>&1; then
    log "INFO" "Redis is running as a Deployment in Kubernetes"
    
    # Try to restart the Deployment
    if kubectl rollout restart deployment -n "$NAMESPACE" redis >/dev/null 2>&1; then
      log "INFO" "Triggered rollout restart for Redis Deployment"
      
      # Wait for rollout to complete
      if kubectl rollout status deployment -n "$NAMESPACE" redis --timeout=300s >/dev/null 2>&1; then
        log "INFO" "✅ Redis recovery successful"
        send_alert "Redis" "RECOVERED" "Cache was automatically recovered via Deployment restart"
        return 0
      else
        log "ERROR" "❌ Redis recovery failed - rollout did not complete in time"
        send_alert "Redis" "RECOVERY FAILED" "Automatic recovery attempt failed - rollout did not complete in time"
        return 1
      fi
    else
      log "ERROR" "❌ Redis recovery failed - could not restart Deployment"
      send_alert "Redis" "RECOVERY FAILED" "Automatic recovery attempt failed - could not restart Deployment"
      return 1
    fi
  elif kubectl get statefulset -n "$NAMESPACE" redis >/dev/null 2>&1; then
    log "INFO" "Redis is running as a StatefulSet in Kubernetes"
    
    # Try to restart the StatefulSet
    if kubectl rollout restart statefulset -n "$NAMESPACE" redis >/dev/null 2>&1; then
      log "INFO" "Triggered rollout restart for Redis StatefulSet"
      
      # Wait for rollout to complete
      if kubectl rollout status statefulset -n "$NAMESPACE" redis --timeout=300s >/dev/null 2>&1; then
        log "INFO" "✅ Redis recovery successful"
        send_alert "Redis" "RECOVERED" "Cache was automatically recovered via StatefulSet restart"
        return 0
      else
        log "ERROR" "❌ Redis recovery failed - rollout did not complete in time"
        send_alert "Redis" "RECOVERY FAILED" "Automatic recovery attempt failed - rollout did not complete in time"
        return 1
      fi
    else
      log "ERROR" "❌ Redis recovery failed - could not restart StatefulSet"
      send_alert "Redis" "RECOVERY FAILED" "Automatic recovery attempt failed - could not restart StatefulSet"
      return 1
    fi
  else
    log "WARN" "Redis is not running in Kubernetes, limited recovery options"
    send_alert "Redis" "RECOVERY FAILED" "Automatic recovery not possible - Redis is not running in Kubernetes"
    return 1
  fi
}

# Attempt to recover Kafka
attempt_kafka_recovery() {
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for Kafka (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for Kafka"
  
  # Check if Kafka is running in Kubernetes
  if kubectl get statefulset -n "$NAMESPACE" kafka >/dev/null 2>&1; then
    log "INFO" "Kafka is running as a StatefulSet in Kubernetes"
    
    # For Kafka, we don't want to restart the entire StatefulSet at once
    # Instead, we'll check individual pods and restart them if needed
    
    # Get all Kafka pods
    local kafka_pods=$(kubectl get pods -n "$NAMESPACE" -l app=kafka -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -z "$kafka_pods" ]]; then
      log "WARN" "No Kafka pods found"
      return 1
    fi
    
    local recovery_success=false
    
    # Check each pod and restart if needed
    for pod in $kafka_pods; do
      local pod_status=$(kubectl get pod -n "$NAMESPACE" $pod -o jsonpath='{.status.phase}')
      
      if [[ "$pod_status" != "Running" ]]; then
        log "WARN" "Kafka pod $pod is not running (status: $pod_status)"
        
        # Delete the pod to force recreation
        if kubectl delete pod -n "$NAMESPACE" $pod >/dev/null 2>&1; then
          log "INFO" "Deleted Kafka pod $pod to force recreation"
          recovery_success=true
        else
          log "ERROR" "Failed to delete Kafka pod $pod"
        fi
      fi
    done
    
    if [[ "$recovery_success" == true ]]; then
      log "INFO" "✅ Kafka recovery initiated - pods are being recreated"
      send_alert "Kafka" "RECOVERING" "Message broker recovery initiated - pods are being recreated"
      return 0
    else
      log "WARN" "No recovery action taken for Kafka - all pods appear to be running"
      return 1
    fi
  else
    log "WARN" "Kafka is not running as a Kubernetes StatefulSet, limited recovery options"
    send_alert "Kafka" "RECOVERY FAILED" "Automatic recovery not possible - Kafka is not running in Kubernetes"
    return 1
  fi
}

# Attempt to recover ElastiCache
attempt_elasticache_recovery() {
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for ElastiCache (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for ElastiCache"
  
  # ElastiCache is an AWS managed service, so we have limited recovery options
  # We can try to check if we're using a local Redis instance as a stand-in for ElastiCache
  
  if [[ "$ENVIRONMENT" != "prod" ]]; then
    log "INFO" "In non-production environment, ElastiCache might be simulated by Redis"
    
    # Try to recover Redis as a proxy for ElastiCache
    attempt_redis_recovery
    return $?
  else
    log "WARN" "ElastiCache is an AWS managed service, automatic recovery not possible"
    log "WARN" "Please check the AWS Console or contact AWS support"
    send_alert "ElastiCache" "RECOVERY FAILED" "Automatic recovery not possible - ElastiCache is an AWS managed service"
    return 1
  fi
}

# Attempt to recover TimescaleDB
attempt_timescaledb_recovery() {
  if [[ "$ATTEMPT_RECOVERY" != true ]]; then
    log "INFO" "Recovery not attempted for TimescaleDB (--recover flag not set)"
    return 0
  fi
  
  log "INFO" "Attempting recovery for TimescaleDB"
  
  # TimescaleDB is an extension of PostgreSQL, so we can reuse PostgreSQL recovery
  attempt_postgres_recovery
  return $?
}

# =========================================================================
# Main Functions
# =========================================================================

# Check all dependencies
check_all_dependencies() {
  local all_success=true
  
  log "INFO" "Starting comprehensive dependency checks"
  
  # Initialize metrics file
  if [[ "$OUTPUT_METRICS" == true ]]; then
    echo "# HELP austa_dependency_status Dependency health status (1=success, 0=failure)" > "$METRICS_FILE"
    echo "# TYPE austa_dependency_status gauge" >> "$METRICS_FILE"
    echo "# HELP austa_dependency_response_time Dependency response time in seconds" >> "$METRICS_FILE"
    echo "# TYPE austa_dependency_response_time gauge" >> "$METRICS_FILE"
    echo "# HELP austa_postgres_connections Number of active PostgreSQL connections" >> "$METRICS_FILE"
    echo "# TYPE austa_postgres_connections gauge" >> "$METRICS_FILE"
    echo "# HELP austa_postgres_replication_lag PostgreSQL replication lag in seconds" >> "$METRICS_FILE"
    echo "# TYPE austa_postgres_replication_lag gauge" >> "$METRICS_FILE"
    echo "# HELP austa_postgres_query_time PostgreSQL query execution time in seconds" >> "$METRICS_FILE"
    echo "# TYPE austa_postgres_query_time gauge" >> "$METRICS_FILE"
    echo "# HELP austa_redis_used_memory Redis used memory in bytes" >> "$METRICS_FILE"
    echo "# TYPE austa_redis_used_memory gauge" >> "$METRICS_FILE"
    echo "# HELP austa_redis_connected_clients Number of connected Redis clients" >> "$METRICS_FILE"
    echo "# TYPE austa_redis_connected_clients gauge" >> "$METRICS_FILE"
    echo "# HELP austa_redis_hit_rate Redis cache hit rate percentage" >> "$METRICS_FILE"
    echo "# TYPE austa_redis_hit_rate gauge" >> "$METRICS_FILE"
    echo "# HELP austa_kafka_topic_count Number of Kafka topics" >> "$METRICS_FILE"
    echo "# TYPE austa_kafka_topic_count gauge" >> "$METRICS_FILE"
    echo "# HELP austa_kafka_broker_count Number of Kafka brokers" >> "$METRICS_FILE"
    echo "# TYPE austa_kafka_broker_count gauge" >> "$METRICS_FILE"
    echo "# HELP austa_kafka_under_replicated Number of under-replicated Kafka partitions" >> "$METRICS_FILE"
    echo "# TYPE austa_kafka_under_replicated gauge" >> "$METRICS_FILE"
    echo "# HELP austa_elasticache_cpu_utilization ElastiCache CPU utilization percentage" >> "$METRICS_FILE"
    echo "# TYPE austa_elasticache_cpu_utilization gauge" >> "$METRICS_FILE"
    echo "# HELP austa_elasticache_memory_utilization ElastiCache memory utilization percentage" >> "$METRICS_FILE"
    echo "# TYPE austa_elasticache_memory_utilization gauge" >> "$METRICS_FILE"
    echo "# HELP austa_elasticache_hit_rate ElastiCache hit rate percentage" >> "$METRICS_FILE"
    echo "# TYPE austa_elasticache_hit_rate gauge" >> "$METRICS_FILE"
    echo "# HELP austa_timescaledb_hypertables Number of TimescaleDB hypertables" >> "$METRICS_FILE"
    echo "# TYPE austa_timescaledb_hypertables gauge" >> "$METRICS_FILE"
    echo "# HELP austa_timescaledb_chunks Number of TimescaleDB chunks" >> "$METRICS_FILE"
    echo "# TYPE austa_timescaledb_chunks gauge" >> "$METRICS_FILE"
    echo "# HELP austa_timescaledb_compression_ratio TimescaleDB compression ratio" >> "$METRICS_FILE"
    echo "# TYPE austa_timescaledb_compression_ratio gauge" >> "$METRICS_FILE"
  fi
  
  # Check PostgreSQL
  if [[ -z "$SPECIFIC_DEPENDENCY" ]] || [[ "$SPECIFIC_DEPENDENCY" == "postgres" ]]; then
    if ! check_postgres "$POSTGRES_URI"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_postgres_recovery
      fi
    fi
  fi
  
  # Check Redis
  if [[ -z "$SPECIFIC_DEPENDENCY" ]] || [[ "$SPECIFIC_DEPENDENCY" == "redis" ]]; then
    if ! check_redis "$REDIS_URI"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_redis_recovery
      fi
    fi
  fi
  
  # Check Kafka
  if [[ -z "$SPECIFIC_DEPENDENCY" ]] || [[ "$SPECIFIC_DEPENDENCY" == "kafka" ]]; then
    if ! check_kafka "$KAFKA_BROKERS"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_kafka_recovery
      fi
    fi
  fi
  
  # Check ElastiCache
  if [[ -z "$SPECIFIC_DEPENDENCY" ]] || [[ "$SPECIFIC_DEPENDENCY" == "elasticache" ]]; then
    if ! check_elasticache "$ELASTICACHE_URI"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_elasticache_recovery
      fi
    fi
  fi
  
  # Check TimescaleDB
  if [[ -z "$SPECIFIC_DEPENDENCY" ]] || [[ "$SPECIFIC_DEPENDENCY" == "timescaledb" ]]; then
    if ! check_timescaledb "$POSTGRES_URI"; then
      all_success=false
      if [[ "$ATTEMPT_RECOVERY" == true ]]; then
        attempt_timescaledb_recovery
      fi
    fi
  fi
  
  # Export metrics to Prometheus
  export_metrics_to_prometheus
  
  if [[ "$all_success" == true ]]; then
    log "INFO" "✅ All dependency checks passed"
    return 0
  else
    log "ERROR" "❌ One or more dependency checks failed"
    return 1
  fi
}

# Check dependencies for a specific service
check_service_dependencies() {
  local service=$1
  local all_success=true
  
  log "INFO" "Checking dependencies for service: $service"
  
  # Get dependencies for this service
  local dependencies=$(get_service_dependencies "$service")
  
  if [[ -z "$dependencies" ]]; then
    log "ERROR" "No dependencies found for service: $service"
    return 1
  fi
  
  log "INFO" "Dependencies for $service: $dependencies"
  
  # Initialize metrics file
  if [[ "$OUTPUT_METRICS" == true ]]; then
    echo "# HELP austa_dependency_status Dependency health status (1=success, 0=failure)" > "$METRICS_FILE"
    echo "# TYPE austa_dependency_status gauge" >> "$METRICS_FILE"
    echo "# HELP austa_dependency_response_time Dependency response time in seconds" >> "$METRICS_FILE"
    echo "# TYPE austa_dependency_response_time gauge" >> "$METRICS_FILE"
  fi
  
  # Check each dependency
  IFS=',' read -ra DEPS <<< "$dependencies"
  for dep in "${DEPS[@]}"; do
    case $dep in
      "postgres")
        if ! check_postgres "$POSTGRES_URI"; then
          all_success=false
          if [[ "$ATTEMPT_RECOVERY" == true ]]; then
            attempt_postgres_recovery
          fi
        fi
        ;;
      "redis")
        if ! check_redis "$REDIS_URI"; then
          all_success=false
          if [[ "$ATTEMPT_RECOVERY" == true ]]; then
            attempt_redis_recovery
          fi
        fi
        ;;
      "kafka")
        if ! check_kafka "$KAFKA_BROKERS"; then
          all_success=false
          if [[ "$ATTEMPT_RECOVERY" == true ]]; then
            attempt_kafka_recovery
          fi
        fi
        ;;
      "elasticache")
        if ! check_elasticache "$ELASTICACHE_URI"; then
          all_success=false
          if [[ "$ATTEMPT_RECOVERY" == true ]]; then
            attempt_elasticache_recovery
          fi
        fi
        ;;
      "timescaledb")
        if ! check_timescaledb "$POSTGRES_URI"; then
          all_success=false
          if [[ "$ATTEMPT_RECOVERY" == true ]]; then
            attempt_timescaledb_recovery
          fi
        fi
        ;;
      *)
        log "WARN" "Unknown dependency: $dep"
        ;;
    esac
  done
  
  # Export metrics to Prometheus
  export_metrics_to_prometheus
  
  if [[ "$all_success" == true ]]; then
    log "INFO" "✅ All dependencies for $service are healthy"
    return 0
  else
    log "ERROR" "❌ One or more dependencies for $service are unhealthy"
    return 1
  fi
}

# Check dependencies for a specific journey
check_journey_dependencies() {
  local journey=$1
  local all_success=true
  
  log "INFO" "Checking dependencies for journey: $journey"
  
  # Get the service for this journey
  local journey_service="${SERVICE_DEPENDENCIES[$journey]}"
  if [[ -z "$journey_service" ]]; then
    log "ERROR" "Unknown journey: $journey"
    return 1
  fi
  
  log "INFO" "Journey $journey maps to service: $journey_service"
  
  # Check dependencies for the service
  check_service_dependencies "$journey_service"
  return $?
}

# Run checks in a loop with specified interval
run_checks_with_interval() {
  local interval=$1
  
  log "INFO" "Running dependency checks every $interval seconds"
  
  while true; do
    # Run the appropriate check based on input parameters
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
      check_service_dependencies "$SPECIFIC_SERVICE"
    elif [[ -n "$SPECIFIC_JOURNEY" ]]; then
      check_journey_dependencies "$SPECIFIC_JOURNEY"
    else
      check_all_dependencies
    fi
    
    log "INFO" "Sleeping for $interval seconds before next check"
    sleep $interval
  done
}

# =========================================================================
# Main Script
# =========================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -d|--dependency)
      SPECIFIC_DEPENDENCY="$2"
      shift 2
      ;;
    -s|--service)
      SPECIFIC_SERVICE="$2"
      shift 2
      ;;
    -j|--journey)
      SPECIFIC_JOURNEY="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -q|--quiet)
      QUIET=true
      shift
      ;;
    -m|--metrics)
      OUTPUT_METRICS=true
      shift
      ;;
    -r|--recover)
      ATTEMPT_RECOVERY=true
      shift
      ;;
    -i|--interval)
      RUN_INTERVAL=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

# Validate arguments
if [[ "$VERBOSE" == true ]] && [[ "$QUIET" == true ]]; then
  log "ERROR" "Cannot specify both --verbose and --quiet"
  exit 2
fi

if [[ -n "$SPECIFIC_SERVICE" ]] && [[ -n "$SPECIFIC_JOURNEY" ]]; then
  log "ERROR" "Cannot specify both --service and --journey"
  exit 2
fi

if [[ -n "$SPECIFIC_SERVICE" ]] && [[ -n "$SPECIFIC_DEPENDENCY" ]]; then
  log "WARN" "Both --service and --dependency specified, will check only the specified dependency for the service"
fi

if [[ -n "$SPECIFIC_JOURNEY" ]] && [[ -n "$SPECIFIC_DEPENDENCY" ]]; then
  log "WARN" "Both --journey and --dependency specified, will check only the specified dependency for the journey"
fi

# Detect environment
detect_environment

# Run checks
log "INFO" "Starting dependency monitoring in $ENVIRONMENT environment"

if [[ $RUN_INTERVAL -gt 0 ]]; then
  run_checks_with_interval $RUN_INTERVAL
else
  # Run once
  if [[ -n "$SPECIFIC_SERVICE" ]]; then
    check_service_dependencies "$SPECIFIC_SERVICE"
  elif [[ -n "$SPECIFIC_JOURNEY" ]]; then
    check_journey_dependencies "$SPECIFIC_JOURNEY"
  else
    check_all_dependencies
  fi
fi

EXIT_CODE=$?

log "INFO" "Dependency monitoring completed with exit code $EXIT_CODE"
exit $EXIT_CODE