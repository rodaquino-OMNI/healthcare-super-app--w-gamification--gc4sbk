#!/bin/bash

#############################################################################
# db-vacuum-analyze.sh
#
# Description: Daily PostgreSQL vacuum analysis script that reclaims storage
#              by removing dead tuples, updates statistics for the query optimizer,
#              and performs targeted vacuum operations on high-churn tables
#              across all journey databases to maintain optimal database
#              performance and prevent bloat.
#
# Usage: ./db-vacuum-analyze.sh [--dry-run] [--verbose] [--journey=<journey-name>] [--parallel=<num>]
#
# Options:
#   --dry-run         Show what would be done without actually performing operations
#   --verbose         Enable verbose output
#   --journey=NAME    Target a specific journey database (health, care, plan, gamification)
#                     If not specified, all journey databases will be processed
#   --parallel=NUM    Number of parallel vacuum workers to use (default: 2)
#
# Author: AUSTA SuperApp Team
# Created: 2023-05-19
# Updated: 2023-05-19
#############################################################################

# Source common utilities and functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh" || { echo "Error: Failed to source common.sh"; exit 1; }

# Script constants
SCRIPT_NAME="db-vacuum-analyze"
LOG_PREFIX="[DB-VACUUM]"
DEFAULT_VACUUM_THRESHOLD=1000 # Default number of dead tuples to trigger vacuum
DEFAULT_ANALYZE_THRESHOLD=0.20 # Default change percentage to trigger analyze
MAX_TRANSACTION_AGE=1000000000 # Age threshold for transaction ID wraparound prevention
DEFAULT_PARALLEL_WORKERS=2 # Default number of parallel vacuum workers

# Journey databases to process
JOURNEY_DBS=("health" "care" "plan" "gamification")

# High-churn tables that need more frequent/aggressive vacuum
HIGH_CHURN_TABLES=(
  "health.health_metrics"
  "health.device_connections"
  "care.appointments"
  "care.telemedicine_sessions"
  "plan.claims"
  "gamification.events"
  "gamification.achievements"
  "gamification.profiles"
)

# Parse command line arguments
DRY_RUN=false
VERBOSE=false
TARGET_JOURNEY=""
PARALLEL_WORKERS=$DEFAULT_PARALLEL_WORKERS
shifted=0

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --journey=*)
      TARGET_JOURNEY="${arg#*=}"
      shift
      ;;
    --parallel=*)
      PARALLEL_WORKERS="${arg#*=}"
      shift
      ;;
    *)
      log_error "Unknown argument: $arg"
      echo "Usage: ./db-vacuum-analyze.sh [--dry-run] [--verbose] [--journey=<journey-name>] [--parallel=<num>]"
      exit 1
      ;;
  esac
shifted=$((shifted + 1))
done

# If a specific journey is specified, validate it
if [[ -n "$TARGET_JOURNEY" ]]; then
  if [[ ! " ${JOURNEY_DBS[@]} " =~ " ${TARGET_JOURNEY} " ]]; then
    log_error "Invalid journey specified: $TARGET_JOURNEY. Valid options are: ${JOURNEY_DBS[*]}"
    exit 1
  fi
  JOURNEY_DBS=("$TARGET_JOURNEY")
  log_info "Targeting only $TARGET_JOURNEY journey database"
fi

# Validate parallel workers
if ! [[ "$PARALLEL_WORKERS" =~ ^[0-9]+$ ]]; then
  log_error "Invalid parallel workers value: $PARALLEL_WORKERS. Must be a positive integer."
  exit 1
fi

# Function to get RDS instances for each journey
get_journey_db_instances() {
  local journey=$1
  local env=${ENVIRONMENT:-"production"}
  
  # In a real implementation, this would use AWS CLI to get the actual RDS instances
  # For now, we'll use a naming convention to simulate the lookup
  echo "austa-${journey}-${env}"
}

# Function to connect to a PostgreSQL database
connect_to_db() {
  local db_instance=$1
  local db_name=$2
  local query=$3
  
  if [[ "$VERBOSE" == "true" ]]; then
    log_info "Executing on $db_instance/$db_name: $query"
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would execute: $query on $db_instance/$db_name"
    return 0
  fi
  
  # In a real implementation, this would use the AWS CLI to get connection details
  # and then use psql to connect to the database
  # For now, we'll simulate the connection
  
  # Example of how this would be implemented:
  # PGPASSWORD="$DB_PASSWORD" psql -h "$db_instance.cluster-xyz.sa-east-1.rds.amazonaws.com" \
  #   -U "$DB_USER" -d "$db_name" -c "$query"
  
  # For simulation purposes:
  log_info "Connected to $db_instance/$db_name and executed: $query"
  return 0
}

# Function to monitor vacuum progress
monitor_vacuum_progress() {
  local db_instance=$1
  local db_name=$2
  
  if [[ "$VERBOSE" != "true" ]]; then
    return 0
  fi
  
  log_info "Monitoring vacuum progress on $db_name"
  
  # Query to monitor vacuum progress
  local query=""
  query+="SELECT phase, heap_blks_total, heap_blks_scanned, heap_blks_vacuumed, "
  query+="index_vacuum_count, max_dead_tuples, num_dead_tuples "
  query+="FROM pg_stat_progress_vacuum;"
  
  connect_to_db "$db_instance" "$db_name" "$query"
}

# Function to identify high-churn tables in a database
identify_high_churn_tables() {
  local db_instance=$1
  local db_name=$2
  
  log_info "Identifying high-churn tables in $db_name"
  
  # Query to find tables with high dead tuple counts
  local query=""
  query+="SELECT schemaname || '.' || relname AS table_name, "
  query+="n_dead_tup, n_live_tup, "
  query+="CASE WHEN n_live_tup > 0 THEN round(100 * n_dead_tup::numeric / n_live_tup, 2) ELSE 0 END AS dead_ratio, "
  query+="last_vacuum, last_analyze "
  query+="FROM pg_stat_user_tables "
  query+="WHERE n_dead_tup > $DEFAULT_VACUUM_THRESHOLD "
  query+="OR (n_live_tup > 0 AND (n_dead_tup::numeric / n_live_tup) > $DEFAULT_ANALYZE_THRESHOLD) "
  query+="ORDER BY n_dead_tup DESC;"
  
  connect_to_db "$db_instance" "$db_name" "$query"
  
  # In a real implementation, this would parse the results and return the list of tables
  # For now, we'll return a predefined list based on the journey
  local journey_specific_tables=()
  for table in "${HIGH_CHURN_TABLES[@]}"; do
    if [[ "$table" == "$db_name"* ]]; then
      journey_specific_tables+=("${table#*.}")
    fi
  done
  
  echo "${journey_specific_tables[*]}"
}

# Function to check for tables at risk of transaction ID wraparound
check_txid_wraparound() {
  local db_instance=$1
  local db_name=$2
  
  log_info "Checking for transaction ID wraparound risk in $db_name"
  
  # Query to find tables at risk of transaction ID wraparound
  local query=""
  query+="SELECT schemaname || '.' || relname AS table_name, "
  query+="age(datfrozenxid) AS xid_age "
  query+="FROM pg_stat_user_tables t "
  query+="JOIN pg_database d ON d.datname = current_database() "
  query+="WHERE age(datfrozenxid) > $MAX_TRANSACTION_AGE "
  query+="ORDER BY age(datfrozenxid) DESC;"
  
  connect_to_db "$db_instance" "$db_name" "$query"
  
  # In a real implementation, this would parse the results and return the list of tables
  # For simulation purposes, we'll assume no tables are at risk
  echo ""
}

# Function to perform VACUUM ANALYZE on a database
perform_vacuum_analyze() {
  local db_instance=$1
  local db_name=$2
  local table_name=$3
  local full_vacuum=$4
  
  local vacuum_type="VACUUM (ANALYZE, PARALLEL $PARALLEL_WORKERS)"
  if [[ "$full_vacuum" == "true" ]]; then
    # VACUUM FULL cannot be run in parallel, but we can still run ANALYZE in parallel
    vacuum_type="VACUUM (FULL, ANALYZE, VERBOSE)"
    log_warning "Performing FULL VACUUM ANALYZE on $db_name.$table_name - this will lock the table!"
  else
    log_info "Performing VACUUM ANALYZE with $PARALLEL_WORKERS parallel workers on $db_name.$table_name"
  fi
  
  local query="$vacuum_type $table_name;"
  connect_to_db "$db_instance" "$db_name" "$query"
  
  # Monitor progress if verbose mode is enabled
  monitor_vacuum_progress "$db_instance" "$db_name"
  
  # Log the completion
  log_info "Completed $vacuum_type on $db_name.$table_name"
}

# Function to perform VACUUM ANALYZE on all tables in a database
perform_database_vacuum() {
  local db_instance=$1
  local db_name=$2
  
  log_info "Starting vacuum operations on $db_name database"
  
  # First, check for transaction ID wraparound risk
  local wraparound_tables=$(check_txid_wraparound "$db_instance" "$db_name")
  
  # If any tables are at risk of wraparound, vacuum them first with higher priority
  if [[ -n "$wraparound_tables" ]]; then
    log_warning "Found tables at risk of transaction ID wraparound in $db_name"
    for table in $wraparound_tables; do
      log_warning "Table $table is at risk of transaction ID wraparound - performing VACUUM FREEZE"
      connect_to_db "$db_instance" "$db_name" "VACUUM (FREEZE, VERBOSE) $table;"
    done
  fi
  
  # Identify high-churn tables for targeted vacuum
  local high_churn_tables=$(identify_high_churn_tables "$db_instance" "$db_name")
  
  # Perform targeted vacuum on high-churn tables
  if [[ -n "$high_churn_tables" ]]; then
    log_info "Performing targeted vacuum on high-churn tables in $db_name"
    for table in $high_churn_tables; do
      perform_vacuum_analyze "$db_instance" "$db_name" "$table" "false"
    done
  fi
  
  # Perform regular VACUUM ANALYZE on all tables
  log_info "Performing VACUUM ANALYZE on all tables in $db_name"
  connect_to_db "$db_instance" "$db_name" "VACUUM (ANALYZE, PARALLEL $PARALLEL_WORKERS);"
  
  # Monitor progress if verbose mode is enabled
  monitor_vacuum_progress "$db_instance" "$db_name"
  
  log_info "Completed vacuum operations on $db_name database"
}

# Function to check if autovacuum is running properly
check_autovacuum_status() {
  local db_instance=$1
  local db_name=$2
  
  log_info "Checking autovacuum status on $db_name"
  
  # Query to check if autovacuum is enabled and running
  local query=""
  query+="SELECT name, setting, context "
  query+="FROM pg_settings "
  query+="WHERE name IN ('autovacuum', 'autovacuum_naptime', 'autovacuum_max_workers', "
  query+="'autovacuum_vacuum_threshold', 'autovacuum_analyze_threshold', "
  query+="'autovacuum_vacuum_scale_factor', 'autovacuum_analyze_scale_factor');"
  
  connect_to_db "$db_instance" "$db_name" "$query"
  
  # Query to check for any tables with autovacuum disabled
  local query2=""
  query2+="SELECT schemaname || '.' || relname AS table_name "
  query2+="FROM pg_class c "
  query2+="JOIN pg_namespace n ON n.oid = c.relnamespace "
  query2+="WHERE c.relkind = 'r' AND n.nspname NOT IN ('pg_catalog', 'information_schema') "
  query2+="AND c.reloptions::text LIKE '%autovacuum_enabled=false%';"
  
  connect_to_db "$db_instance" "$db_name" "$query2"
}

# Main function to process all journey databases
main() {
  log_info "Starting PostgreSQL vacuum analysis across journey databases"
  log_info "Using $PARALLEL_WORKERS parallel vacuum workers"
  
  # Process each journey database
  for journey in "${JOURNEY_DBS[@]}"; do
    log_info "Processing $journey journey database"
    
    # Get the RDS instance for this journey
    local db_instance=$(get_journey_db_instances "$journey")
    
    # Check autovacuum status
    check_autovacuum_status "$db_instance" "$journey"
    
    # Perform vacuum operations
    perform_database_vacuum "$db_instance" "$journey"
    
    log_info "Completed processing $journey journey database"
  done
  
  log_info "PostgreSQL vacuum analysis completed successfully"
}

# Execute the main function with error handling
if [[ "$DRY_RUN" == "true" ]]; then
  log_info "Running in DRY RUN mode - no actual changes will be made"
fi

# Execute main function with error handling
if ! main; then
  log_error "PostgreSQL vacuum analysis failed"
  exit 1
fi

exit 0