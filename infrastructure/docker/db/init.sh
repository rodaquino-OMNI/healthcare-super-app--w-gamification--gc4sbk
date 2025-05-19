#!/bin/bash

# AUSTA SuperApp Database Initialization Script
# This script orchestrates the setup of all required databases for local development.
# It executes SQL scripts in the proper order, creates databases, enables extensions,
# sets up users with appropriate permissions, and prepares the environment for
# service-specific migrations and seeding.

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Return value of a pipeline is the value of the last command to exit with non-zero status

# Configuration
PG_HOST=${POSTGRES_HOST:-localhost}
PG_PORT=${POSTGRES_PORT:-5432}
PG_USER=${POSTGRES_USER:-postgres}
PG_PASSWORD=${POSTGRES_PASSWORD:-postgres}
PG_SUPERUSER=${PG_SUPERUSER:-postgres}

# Database names
DBS=("health_journey" "care_journey" "plan_journey" "gamification" "auth")

# Log file for initialization process
LOG_FILE="/var/log/db-init.log"
touch "$LOG_FILE"

# Logging function
log() {
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
  log "ERROR: Database initialization failed at step: $1"
  log "Check the log file at $LOG_FILE for details"
  exit 1
}

# Function to execute SQL scripts
execute_sql_script() {
  local script_path=$1
  local script_name=$(basename "$script_path")
  local db_name=$2
  
  log "Executing SQL script: $script_name${db_name:+ on database '$db_name'}"
  
  # Execute the SQL script using PSQL
  if [ -z "$db_name" ]; then
    # Execute on default database
    PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -f "$script_path" 2>> "$LOG_FILE"
  else
    # Execute on specific database
    PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$db_name" -f "$script_path" 2>> "$LOG_FILE"
  fi
  
  # Check if the script executed successfully
  if [ $? -ne 0 ]; then
    handle_error "Failed to execute $script_name${db_name:+ on database '$db_name'}"
  fi
  
  log "Successfully executed: $script_name${db_name:+ on database '$db_name'}"
}

# Function to check if PostgreSQL is ready
check_postgres_ready() {
  log "Checking if PostgreSQL is ready..."
  
  # Use the wait-for-db.sh script if it exists
  if [ -f "./wait-for-db.sh" ]; then
    log "Using wait-for-db.sh to check database availability"
    chmod +x ./wait-for-db.sh
    ./wait-for-db.sh
    if [ $? -ne 0 ]; then
      handle_error "PostgreSQL is not available after timeout"
    fi
  else
    # Simple check if wait-for-db.sh is not available
    local max_attempts=30
    local attempt=1
    local backoff_time=2
    
    while [ $attempt -le $max_attempts ]; do
      log "Attempt $attempt of $max_attempts to connect to PostgreSQL"
      
      PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c "SELECT 1;" > /dev/null 2>&1
      
      if [ $? -eq 0 ]; then
        log "PostgreSQL is ready"
        return 0
      fi
      
      log "PostgreSQL is not ready yet, waiting..."
      sleep $backoff_time
      # Implement exponential backoff with a cap
      backoff_time=$(( backoff_time < 10 ? backoff_time * 2 : 10 ))
      attempt=$((attempt + 1))
    done
    
    handle_error "PostgreSQL is not available after $max_attempts attempts"
  fi
}

# Function to verify database exists
verify_database_exists() {
  local db_name=$1
  log "Verifying database '$db_name' exists"
  
  PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -lqt | cut -d \| -f 1 | grep -qw "$db_name"
  
  if [ $? -ne 0 ]; then
    handle_error "Database '$db_name' was not created successfully"
  fi
  
  log "Database '$db_name' exists"
  return 0
}

# Function to verify all databases exist
verify_all_databases() {
  log "Verifying all databases were created successfully"
  
  for db in "${DBS[@]}"; do
    verify_database_exists "$db"
  done
  
  log "All databases verified successfully"
}

# Function to verify extensions
verify_extensions() {
  log "Verifying TimescaleDB extension in health_journey database"
  
  # Check if TimescaleDB is enabled in health_journey database
  PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "health_journey" \
    -c "SELECT extname FROM pg_extension WHERE extname = 'timescaledb';" | grep -q "timescaledb"
  
  if [ $? -ne 0 ]; then
    handle_error "TimescaleDB extension was not enabled in health_journey database"
  fi
  
  log "TimescaleDB extension verified in health_journey database"
}

# Function to verify users
verify_users() {
  log "Verifying database users were created"
  
  # Check if service users exist
  for db in "${DBS[@]}"; do
    local user="${db}_user"
    PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" \
      -c "SELECT 1 FROM pg_roles WHERE rolname='$user';" | grep -q "1"
    
    if [ $? -ne 0 ]; then
      handle_error "User '$user' was not created successfully"
    fi
    
    log "User '$user' verified"
  done
  
  log "All database users verified successfully"
}

# Main initialization process
main() {
  log "Starting AUSTA SuperApp database initialization"
  
  # Step 1: Check if PostgreSQL is ready
  check_postgres_ready
  
  # Step 2: Create databases
  log "Step 1/3: Creating databases"
  execute_sql_script "./create-databases.sql"
  verify_all_databases
  
  # Step 3: Enable extensions
  log "Step 2/3: Enabling PostgreSQL extensions"
  execute_sql_script "./enable-extensions.sql"
  verify_extensions
  
  # Step 4: Create users and set permissions
  log "Step 3/3: Creating database users and setting permissions"
  execute_sql_script "./create-users.sql"
  verify_users
  
  log "Database initialization completed successfully"
  log "The following databases are now ready for migrations and seeding:"
  for db in "${DBS[@]}"; do
    case "$db" in
      "health_journey") log " - $db: Health journey service database" ;;
      "care_journey") log " - $db: Care journey service database" ;;
      "plan_journey") log " - $db: Plan journey service database" ;;
      "gamification") log " - $db: Gamification engine database" ;;
      "auth") log " - $db: Authentication service database" ;;
    esac
  done
  
  # Provide information about next steps
  log "\nNext steps:"
  log " 1. Run migrations.sh to apply Prisma migrations"
  log " 2. Run seed-data.sh to populate databases with test data"
  log "\nFor more information, see the README.md in this directory."
}

# Check if running in Docker environment
check_docker_environment() {
  # Check if running in Docker by looking for /.dockerenv file
  if [ -f /.dockerenv ]; then
    log "Running in Docker environment"
    return 0
  fi
  
  # Alternative check using cgroup
  if grep -q docker /proc/1/cgroup 2>/dev/null; then
    log "Running in Docker environment (detected via cgroup)"
    return 0
  fi
  
  log "WARNING: Not running in Docker environment. This script is designed to run inside a Docker container."
  log "Continuing anyway, but you may encounter issues if PostgreSQL is not configured as expected."
  return 1
}

# Function to handle script interruption
cleanup() {
  log "Script interrupted. Cleaning up..."
  # Add any cleanup tasks here if needed
  exit 1
}

# Set up trap for script interruption
trap cleanup INT TERM

# Check if script is being run as root or with sufficient permissions
check_permissions() {
  if [ "$(id -u)" -ne 0 ] && ! PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c "\l" &>/dev/null; then
    log "WARNING: This script may require elevated permissions or valid PostgreSQL credentials"
    log "Make sure you have the necessary permissions to create databases and users"
  fi
}

# Main execution
log "AUSTA SuperApp Database Initialization Script"
log "Version: 1.0.0"
log "Starting initialization at $(date)"

check_docker_environment
check_permissions

# Execute the main function
main

log "Initialization completed at $(date)"
exit 0