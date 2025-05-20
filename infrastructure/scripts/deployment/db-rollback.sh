#!/bin/bash

#############################################################################
# db-rollback.sh
#
# Database rollback utilities for the AUSTA SuperApp
#
# This script handles database rollback operations including:
# - Prisma migration rollbacks (schema versioning)
# - Transaction-based migrations when possible
# - Point-in-time recovery for data corruptions
# - Database schema validation after rollback
# - Coordination with application version rollback
#
# Usage: ./db-rollback.sh [options]
#
# Options:
#   -s, --service SERVICE     Service to rollback (health, care, plan, gamification, auth)
#   -v, --version VERSION     Target version to rollback to
#   -t, --type TYPE           Rollback type (migration, point-in-time, data-only)
#   -f, --force               Force rollback without confirmation
#   -d, --dry-run             Perform a dry run without making changes
#   -h, --help                Display this help message
#
# Examples:
#   ./db-rollback.sh --service health --version 20230102000000_create_health_metrics
#   ./db-rollback.sh --service gamification --type point-in-time --timestamp "2023-04-09T14:30:00Z"
#   ./db-rollback.sh --service plan --type data-only --backup-id backup-20230205
#
# Author: AUSTA SuperApp Team
# Date: May 2025
#############################################################################

set -e

# Default values
DRY_RUN=false
FORCE=false
ROLLBACK_TYPE="migration"
TIMESTAMP=""
BACKUP_ID=""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common functions if available
if [ -f "${SCRIPT_DIR}/common.sh" ]; then
  source "${SCRIPT_DIR}/common.sh"
fi

# Source config if available
if [ -f "${SCRIPT_DIR}/config.sh" ]; then
  source "${SCRIPT_DIR}/config.sh"
fi

# Logging functions if not provided by common.sh
if ! command -v log_info &> /dev/null; then
  log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
  }

  log_warn() {
    echo -e "\033[0;33m[WARN]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
  }

  log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
  }

  log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
      echo -e "\033[0;34m[DEBUG]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
    fi
  }

  log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
  }

  log_journey() {
    local journey=$1
    local message=$2
    case "$journey" in
      health)
        echo -e "\033[0;36m[HEALTH]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
      care)
        echo -e "\033[0;35m[CARE]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
      plan)
        echo -e "\033[0;33m[PLAN]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
      gamification)
        echo -e "\033[0;32m[GAMIFICATION]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
      auth)
        echo -e "\033[0;34m[AUTH]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
      *)
        echo -e "\033[0;37m[$journey]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $message"
        ;;
    esac
  }
fi

# Display help message
show_help() {
  grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^#/ /'
  exit 0
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -s|--service)
        SERVICE="$2"
        shift 2
        ;;
      -v|--version)
        TARGET_VERSION="$2"
        shift 2
        ;;
      -t|--type)
        ROLLBACK_TYPE="$2"
        shift 2
        ;;
      --timestamp)
        TIMESTAMP="$2"
        shift 2
        ;;
      --backup-id)
        BACKUP_ID="$2"
        shift 2
        ;;
      -f|--force)
        FORCE=true
        shift
        ;;
      -d|--dry-run)
        DRY_RUN=true
        shift
        ;;
      -h|--help)
        show_help
        ;;
      *)
        log_error "Unknown option: $1"
        show_help
        ;;
    esac
  done

  # Validate required parameters
  if [ -z "${SERVICE}" ]; then
    log_error "Service parameter is required"
    show_help
  fi

  # Validate service name
  case "${SERVICE}" in
    health|care|plan|gamification|auth|notification)
      # Valid service
      ;;
    *)
      log_error "Invalid service: ${SERVICE}. Must be one of: health, care, plan, gamification, auth, notification"
      exit 1
      ;;
  esac

  # Validate rollback type
  case "${ROLLBACK_TYPE}" in
    migration)
      if [ -z "${TARGET_VERSION}" ]; then
        log_error "Target version is required for migration rollback"
        exit 1
      fi
      ;;
    point-in-time)
      if [ -z "${TIMESTAMP}" ]; then
        log_error "Timestamp is required for point-in-time recovery"
        exit 1
      fi
      ;;
    data-only)
      if [ -z "${BACKUP_ID}" ]; then
        log_error "Backup ID is required for data-only rollback"
        exit 1
      fi
      ;;
    *)
      log_error "Invalid rollback type: ${ROLLBACK_TYPE}. Must be one of: migration, point-in-time, data-only"
      exit 1
      ;;
  esac
}

# Get service directory path
get_service_dir() {
  local service=$1
  echo "${REPO_ROOT:-/src}/backend/${service}-service"
}

# Get Prisma directory path
get_prisma_dir() {
  local service=$1
  echo "$(get_service_dir "$service")/prisma"
}

# Get database connection string for a service
get_db_connection_string() {
  local service=$1
  local env_var="${service^^}_DATABASE_URL"
  
  # Try to get from environment variable
  if [ -n "${!env_var}" ]; then
    echo "${!env_var}"
    return 0
  fi
  
  # Try to get from Kubernetes secret
  if command -v kubectl &> /dev/null; then
    local namespace="austa-${service}"
    local secret_name="${service}-db-credentials"
    
    if kubectl get secret "$secret_name" -n "$namespace" &> /dev/null; then
      local db_url=$(kubectl get secret "$secret_name" -n "$namespace" -o jsonpath="{.data.DATABASE_URL}" | base64 --decode)
      if [ -n "$db_url" ]; then
        echo "$db_url"
        return 0
      fi
    fi
  fi
  
  # Default fallback for development
  echo "postgresql://postgres:postgres@localhost:5432/${service}_db?schema=public"
}

# Check if a migration exists
check_migration_exists() {
  local service=$1
  local version=$2
  local prisma_dir=$(get_prisma_dir "$service")
  
  if [ -d "${prisma_dir}/migrations/${version}" ]; then
    return 0
  else
    return 1
  fi
}

# Get current migration version
get_current_migration_version() {
  local service=$1
  local db_url=$(get_db_connection_string "$service")
  
  # Extract database name from connection string
  local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
  
  # Query the _prisma_migrations table
  local query="SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would query database for current migration version"
    echo "20230301000000_add_indices_and_relations" # Mock version for dry run
    return 0
  fi
  
  # Use psql to query the database
  if command -v psql &> /dev/null; then
    local current_version=$(PGPASSWORD=$(echo "$db_url" | sed -n 's/.*:([^:@]*)@.*/\1/p') \
      psql -h $(echo "$db_url" | sed -n 's/.*@([^:]*).*/\1/p') \
      -p $(echo "$db_url" | sed -n 's/.*:([0-9]*)\/.*$/\1/p') \
      -U $(echo "$db_url" | sed -n 's/.*\/\/([^:]*).*/\1/p') \
      -d "$db_name" -t -c "$query" | tr -d '[:space:]')
    
    if [ -n "$current_version" ]; then
      echo "$current_version"
      return 0
    fi
  fi
  
  log_error "Failed to determine current migration version"
  return 1
}

# List migrations to be rolled back
list_migrations_to_rollback() {
  local service=$1
  local target_version=$2
  local prisma_dir=$(get_prisma_dir "$service")
  local current_version=$(get_current_migration_version "$service")
  
  log_debug "Current version: $current_version, Target version: $target_version"
  
  # Get all migrations in reverse chronological order
  local all_migrations=($(find "${prisma_dir}/migrations" -maxdepth 1 -mindepth 1 -type d | sort -r | xargs -n1 basename))
  
  # Find the index of current and target versions
  local current_index=-1
  local target_index=-1
  
  for i in "${!all_migrations[@]}"; do
    if [ "${all_migrations[$i]}" = "$current_version" ]; then
      current_index=$i
    fi
    if [ "${all_migrations[$i]}" = "$target_version" ]; then
      target_index=$i
    fi
  done
  
  if [ $current_index -eq -1 ]; then
    log_error "Current version not found in migrations directory"
    return 1
  fi
  
  if [ $target_index -eq -1 ]; then
    log_error "Target version not found in migrations directory"
    return 1
  fi
  
  if [ $current_index -gt $target_index ]; then
    log_error "Target version is newer than current version"
    return 1
  fi
  
  # Return migrations to roll back (excluding the target version)
  for ((i=current_index; i>target_index; i--)); do
    echo "${all_migrations[$i]}"
  done
}

# Execute Prisma migration rollback
execute_migration_rollback() {
  local service=$1
  local target_version=$2
  local prisma_dir=$(get_prisma_dir "$service")
  local db_url=$(get_db_connection_string "$service")
  
  # Check if target migration exists
  if ! check_migration_exists "$service" "$target_version"; then
    log_error "Target migration version does not exist: $target_version"
    return 1
  fi
  
  # Get current migration version
  local current_version=$(get_current_migration_version "$service")
  log_info "Current migration version: $current_version"
  
  # List migrations to roll back
  local migrations_to_rollback=($(list_migrations_to_rollback "$service" "$target_version"))
  
  if [ ${#migrations_to_rollback[@]} -eq 0 ]; then
    log_info "No migrations to roll back"
    return 0
  fi
  
  log_info "Migrations to roll back: ${migrations_to_rollback[*]}"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would roll back the following migrations: ${migrations_to_rollback[*]}"
    return 0
  fi
  
  # Confirm rollback if not forced
  if [ "$FORCE" != "true" ]; then
    read -p "Are you sure you want to roll back these migrations? This cannot be undone. [y/N] " confirm
    if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
      log_info "Rollback cancelled"
      return 0
    fi
  fi
  
  # Execute rollback for each migration in reverse order
  for migration in "${migrations_to_rollback[@]}"; do
    log_journey "$service" "Rolling back migration: $migration"
    
    # Check if migration has a down.sql file
    local down_sql_file="${prisma_dir}/migrations/${migration}/down.sql"
    
    if [ -f "$down_sql_file" ]; then
      log_info "Found down.sql file for migration $migration"
      
      # Execute down.sql in a transaction if possible
      log_info "Executing down.sql in a transaction"
      
      # Extract database connection details
      local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
      local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
      local db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
      local db_pass=$(echo "$db_url" | sed -n 's/.*:\([^:@]*\)@.*/\1/p')
      local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
      
      # Execute down.sql with transaction wrapper
      PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" <<EOF
        BEGIN;
        \i $down_sql_file
        COMMIT;
        
        -- Update _prisma_migrations table
        DELETE FROM _prisma_migrations WHERE migration_name = '$migration';
 EOF
      
      if [ $? -ne 0 ]; then
        log_error "Failed to execute down.sql for migration $migration"
        return 1
      fi
    else
      log_warn "No down.sql file found for migration $migration"
      log_info "Using Prisma migrate to roll back"
      
      # Use Prisma CLI to roll back
      cd "$(get_service_dir "$service")"
      DATABASE_URL="$db_url" npx prisma migrate resolve --rolled-back "$migration"
      
      if [ $? -ne 0 ]; then
        log_error "Failed to roll back migration $migration using Prisma CLI"
        return 1
      fi
    fi
    
    log_success "Successfully rolled back migration: $migration"
  done
  
  # Verify rollback
  local new_version=$(get_current_migration_version "$service")
  if [ "$new_version" = "$target_version" ]; then
    log_success "Successfully rolled back to target version: $target_version"
    return 0
  else
    log_error "Rollback verification failed. Current version: $new_version, Expected: $target_version"
    return 1
  fi
}

# Execute point-in-time recovery
execute_point_in_time_recovery() {
  local service=$1
  local timestamp=$2
  local db_url=$(get_db_connection_string "$service")
  
  log_journey "$service" "Executing point-in-time recovery to timestamp: $timestamp"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would perform point-in-time recovery to timestamp: $timestamp"
    return 0
  fi
  
  # Confirm recovery if not forced
  if [ "$FORCE" != "true" ]; then
    read -p "Are you sure you want to perform point-in-time recovery? This will overwrite current data. [y/N] " confirm
    if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
      log_info "Recovery cancelled"
      return 0
    fi
  fi
  
  # Extract database connection details
  local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
  local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  local db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
  local db_pass=$(echo "$db_url" | sed -n 's/.*:\([^:@]*\)@.*/\1/p')
  local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
  
  # Check if we're in AWS RDS environment
  if [[ "$db_host" == *"rds.amazonaws.com"* ]]; then
    log_info "Detected AWS RDS environment"
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
      log_error "AWS CLI is required for RDS point-in-time recovery but not found"
      return 1
    fi
    
    # Extract RDS instance identifier from hostname
    local rds_instance=$(echo "$db_host" | cut -d'.' -f1)
    
    # Create a new DB instance from point-in-time recovery
    local recovery_instance="${rds_instance}-recovery"
    
    log_info "Creating recovery instance: $recovery_instance"
    aws rds restore-db-instance-to-point-in-time \
      --source-db-instance-identifier "$rds_instance" \
      --target-db-instance-identifier "$recovery_instance" \
      --restore-time "$timestamp" \
      --no-publicly-accessible
    
    # Wait for the recovery instance to be available
    log_info "Waiting for recovery instance to be available..."
    aws rds wait db-instance-available --db-instance-identifier "$recovery_instance"
    
    # Get the endpoint of the recovery instance
    local recovery_endpoint=$(aws rds describe-db-instances \
      --db-instance-identifier "$recovery_instance" \
      --query "DBInstances[0].Endpoint.Address" \
      --output text)
    
    log_info "Recovery instance available at: $recovery_endpoint"
    
    # Dump data from recovery instance
    log_info "Dumping data from recovery instance"
    PGPASSWORD="$db_pass" pg_dump -h "$recovery_endpoint" -p "$db_port" -U "$db_user" -d "$db_name" -c -O -x > "/tmp/${service}_recovery.sql"
    
    # Restore data to original instance
    log_info "Restoring data to original instance"
    PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "/tmp/${service}_recovery.sql"
    
    # Clean up
    log_info "Cleaning up temporary files"
    rm -f "/tmp/${service}_recovery.sql"
    
    # Delete recovery instance
    log_info "Deleting recovery instance"
    aws rds delete-db-instance \
      --db-instance-identifier "$recovery_instance" \
      --skip-final-snapshot
  else
    # Assume local or self-managed PostgreSQL
    log_info "Using local PostgreSQL point-in-time recovery"
    
    # Check if we have access to PostgreSQL binaries
    if ! command -v pg_restore &> /dev/null; then
      log_error "PostgreSQL client tools are required for point-in-time recovery but not found"
      return 1
    fi
    
    # Locate the appropriate backup file
    local backup_dir="${BACKUP_DIR:-/var/backups/postgresql}"
    local backup_file=$(find "$backup_dir" -name "${service}_db_*.backup" -o -name "${service}_db_*.sql" | sort | grep -B1 "$timestamp" | head -n1)
    
    if [ -z "$backup_file" ]; then
      log_error "No suitable backup file found for timestamp: $timestamp"
      return 1
    fi
    
    log_info "Using backup file: $backup_file"
    
    # Restore from backup
    if [[ "$backup_file" == *.backup ]]; then
      # Binary format
      PGPASSWORD="$db_pass" pg_restore -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "$backup_file"
    else
      # SQL format
      PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "$backup_file"
    fi
    
    # Apply WAL logs if available
    local wal_dir="${WAL_DIR:-/var/lib/postgresql/wal_archive}"
    if [ -d "$wal_dir" ]; then
      log_info "Applying WAL logs up to timestamp: $timestamp"
      
      # Create recovery.conf
      cat > "/tmp/recovery.conf" <<EOF
        restore_command = 'cp ${wal_dir}/%f %p'
        recovery_target_time = '${timestamp}'
        recovery_target_inclusive = true
        recovery_target_action = 'promote'
EOF
      
      # Copy recovery.conf to PostgreSQL data directory
      # Note: This requires direct access to PostgreSQL data directory
      # which might not be available in all environments
      log_warn "Manual intervention may be required to complete WAL recovery"
      log_info "Recovery configuration has been created at /tmp/recovery.conf"
    fi
  fi
  
  log_success "Point-in-time recovery completed successfully"
  return 0
}

# Execute data-only rollback from backup
execute_data_only_rollback() {
  local service=$1
  local backup_id=$2
  local db_url=$(get_db_connection_string "$service")
  
  log_journey "$service" "Executing data-only rollback from backup: $backup_id"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would perform data-only rollback from backup: $backup_id"
    return 0
  fi
  
  # Confirm rollback if not forced
  if [ "$FORCE" != "true" ]; then
    read -p "Are you sure you want to perform data-only rollback? This will overwrite current data but keep the schema. [y/N] " confirm
    if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
      log_info "Rollback cancelled"
      return 0
    fi
  fi
  
  # Extract database connection details
  local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
  local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  local db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
  local db_pass=$(echo "$db_url" | sed -n 's/.*:\([^:@]*\)@.*/\1/p')
  local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
  
  # Check if we're in AWS environment
  if [[ "$db_host" == *"rds.amazonaws.com"* ]] && [[ "$backup_id" == "snap-"* ]]; then
    log_info "Detected AWS RDS environment with snapshot backup"
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
      log_error "AWS CLI is required for RDS snapshot restore but not found"
      return 1
    fi
    
    # Extract RDS instance identifier from hostname
    local rds_instance=$(echo "$db_host" | cut -d'.' -f1)
    
    # Create a new DB instance from snapshot
    local recovery_instance="${rds_instance}-recovery"
    
    log_info "Creating recovery instance from snapshot: $backup_id"
    aws rds restore-db-instance-from-db-snapshot \
      --db-instance-identifier "$recovery_instance" \
      --db-snapshot-identifier "$backup_id" \
      --no-publicly-accessible
    
    # Wait for the recovery instance to be available
    log_info "Waiting for recovery instance to be available..."
    aws rds wait db-instance-available --db-instance-identifier "$recovery_instance"
    
    # Get the endpoint of the recovery instance
    local recovery_endpoint=$(aws rds describe-db-instances \
      --db-instance-identifier "$recovery_instance" \
      --query "DBInstances[0].Endpoint.Address" \
      --output text)
    
    log_info "Recovery instance available at: $recovery_endpoint"
    
    # Dump only data (no schema) from recovery instance
    log_info "Dumping data from recovery instance (excluding schema)"
    PGPASSWORD="$db_pass" pg_dump -h "$recovery_endpoint" -p "$db_port" -U "$db_user" -d "$db_name" --data-only > "/tmp/${service}_data_recovery.sql"
    
    # Restore data to original instance
    log_info "Restoring data to original instance"
    PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "/tmp/${service}_data_recovery.sql"
    
    # Clean up
    log_info "Cleaning up temporary files"
    rm -f "/tmp/${service}_data_recovery.sql"
    
    # Delete recovery instance
    log_info "Deleting recovery instance"
    aws rds delete-db-instance \
      --db-instance-identifier "$recovery_instance" \
      --skip-final-snapshot
  else
    # Assume local or self-managed PostgreSQL with file backup
    log_info "Using local backup file for data-only rollback"
    
    # Check if we have access to PostgreSQL binaries
    if ! command -v pg_restore &> /dev/null; then
      log_error "PostgreSQL client tools are required for data-only rollback but not found"
      return 1
    fi
    
    # Locate the backup file
    local backup_dir="${BACKUP_DIR:-/var/backups/postgresql}"
    local backup_file="${backup_dir}/${backup_id}"
    
    if [ ! -f "$backup_file" ]; then
      log_error "Backup file not found: $backup_file"
      return 1
    fi
    
    log_info "Using backup file: $backup_file"
    
    # Restore data only (no schema) from backup
    if [[ "$backup_file" == *.backup ]]; then
      # Binary format
      PGPASSWORD="$db_pass" pg_restore -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" --data-only "$backup_file"
    else
      # Extract data-only SQL from backup file
      log_info "Extracting data-only SQL from backup file"
      grep -v "CREATE\|ALTER\|DROP\|COMMENT" "$backup_file" > "/tmp/${service}_data_only.sql"
      
      # Restore data-only SQL
      PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "/tmp/${service}_data_only.sql"
      
      # Clean up
      rm -f "/tmp/${service}_data_only.sql"
    fi
  fi
  
  log_success "Data-only rollback completed successfully"
  return 0
}

# Validate database schema after rollback
validate_database_schema() {
  local service=$1
  local db_url=$(get_db_connection_string "$service")
  
  log_journey "$service" "Validating database schema after rollback"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would validate database schema after rollback"
    return 0
  fi
  
  # Extract database connection details
  local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
  local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  local db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
  local db_pass=$(echo "$db_url" | sed -n 's/.*:\([^:@]*\)@.*/\1/p')
  local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^\/\?]*\).*/\1/p')
  
  # Check if Prisma CLI is available
  if command -v npx &> /dev/null; then
    log_info "Validating schema using Prisma CLI"
    
    cd "$(get_service_dir "$service")"
    DATABASE_URL="$db_url" npx prisma validate
    
    if [ $? -ne 0 ]; then
      log_error "Prisma schema validation failed"
      return 1
    fi
  fi
  
  # Check for any broken foreign key constraints
  log_info "Checking for broken foreign key constraints"
  
  local fk_check_query="
    SELECT
      c.conname AS constraint_name,
      c.conrelid::regclass AS table_name,
      a.attname AS column_name,
      c.confrelid::regclass AS referenced_table,
      af.attname AS referenced_column,
      COUNT(*) AS violation_count
    FROM
      pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      LEFT JOIN LATERAL (
        SELECT 1
        FROM ONLY pg_catalog.pg_class r
        JOIN ONLY pg_catalog.pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN ONLY pg_catalog.pg_class rf ON rf.oid = c.confrelid
        JOIN ONLY pg_catalog.pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
        LEFT JOIN LATERAL (
          SELECT r.ctid
          FROM ONLY pg_catalog.pg_class r
          WHERE r.oid = c.conrelid
          EXCEPT
          SELECT r.ctid
          FROM ONLY pg_catalog.pg_class r, ONLY pg_catalog.pg_class rf
          WHERE r.oid = c.conrelid AND rf.oid = c.confrelid AND (
            SELECT r.ctid FROM ONLY pg_catalog.pg_class r WHERE r.oid = c.conrelid
          ) IS NOT NULL
        ) fk ON true
        WHERE c.contype = 'f' AND c.oid = c.oid AND fk.ctid IS NOT NULL
      ) fk_violations ON true
    WHERE
      c.contype = 'f'
    GROUP BY
      c.conname, c.conrelid::regclass, a.attname, c.confrelid::regclass, af.attname
    HAVING
      COUNT(*) > 0;
  "
  
  local violations=$(PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "$fk_check_query")
  
  if [ -n "$violations" ]; then
    log_error "Foreign key constraint violations found:"
    echo "$violations"
    return 1
  fi
  
  # Check for any invalid indexes
  log_info "Checking for invalid indexes"
  
  local index_check_query="
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      a.amname AS index_type
    FROM
      pg_class t,
      pg_class i,
      pg_index ix,
      pg_am a
    WHERE
      t.oid = ix.indrelid
      AND i.oid = ix.indexrelid
      AND i.relam = a.oid
      AND ix.indisvalid = false;
  "
  
  local invalid_indexes=$(PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "$index_check_query")
  
  if [ -n "$invalid_indexes" ]; then
    log_error "Invalid indexes found:"
    echo "$invalid_indexes"
    return 1
  fi
  
  log_success "Database schema validation passed"
  return 0
}

# Coordinate with application rollback
coordinate_with_app_rollback() {
  local service=$1
  local target_version=$2
  
  log_journey "$service" "Coordinating with application rollback"
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "[DRY RUN] Would coordinate with application rollback"
    return 0
  fi
  
  # Check if k8s-rollback.sh exists and is executable
  if [ -x "${SCRIPT_DIR}/k8s-rollback.sh" ]; then
    log_info "Triggering Kubernetes rollback for $service service"
    
    # Extract application version from migration version
    # Assuming migration versions follow the pattern: YYYYMMDD000000_description
    local app_version="v$(echo "$target_version" | cut -d'_' -f1 | sed 's/^\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\).*/\1.\2.\3/')"
    
    log_info "Derived application version: $app_version"
    
    # Call k8s-rollback.sh
    "${SCRIPT_DIR}/k8s-rollback.sh" --service "$service" --version "$app_version" --reason "Database rollback to $target_version"
    
    if [ $? -ne 0 ]; then
      log_warn "Kubernetes rollback failed or was not needed"
    fi
  else
    log_warn "k8s-rollback.sh not found or not executable, skipping application rollback"
  fi
  
  return 0
}

# Main function
main() {
  # Parse command line arguments
  parse_args "$@"
  
  log_info "Starting database rollback for $SERVICE service"
  log_info "Rollback type: $ROLLBACK_TYPE"
  
  case "$ROLLBACK_TYPE" in
    migration)
      log_info "Target version: $TARGET_VERSION"
      execute_migration_rollback "$SERVICE" "$TARGET_VERSION" || exit 1
      validate_database_schema "$SERVICE" || exit 1
      coordinate_with_app_rollback "$SERVICE" "$TARGET_VERSION" || exit 1
      ;;
    point-in-time)
      log_info "Timestamp: $TIMESTAMP"
      execute_point_in_time_recovery "$SERVICE" "$TIMESTAMP" || exit 1
      validate_database_schema "$SERVICE" || exit 1
      ;;
    data-only)
      log_info "Backup ID: $BACKUP_ID"
      execute_data_only_rollback "$SERVICE" "$BACKUP_ID" || exit 1
      validate_database_schema "$SERVICE" || exit 1
      ;;
  esac
  
  log_success "Database rollback completed successfully"
  return 0
}

# Execute main function with all arguments
main "$@"