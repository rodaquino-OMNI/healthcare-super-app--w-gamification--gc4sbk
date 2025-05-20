#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Database Seed Script
# =========================================================================
# This script automates the seeding of all databases with test data for local
# development. It orchestrates the execution of service-specific seed scripts
# for health_journey, care_journey, plan_journey, gamification, and auth
# databases, providing a consistent data environment for testing.
#
# Usage: ./seed-data.sh [options]
#
# Options:
#   -h, --host HOST       Database host (default: localhost)
#   -p, --port PORT       Database port (default: 5432)
#   -U, --username USER   Database user (default: postgres)
#   --password PASS       Database password (default: postgres)
#   -s, --services SVCS   Comma-separated list of services to seed
#                         (default: all services)
#                         Valid values: health,care,plan,gamification,auth
#   --sql-only            Only run SQL seed files, skip Prisma seeds
#   --prisma-only         Only run Prisma seeds, skip SQL seed files
#   --help                Display this help message
#
# Environment variables:
#   POSTGRES_HOST         Database host (overrides -h/--host)
#   POSTGRES_PORT         Database port (overrides -p/--port)
#   POSTGRES_USER         Database user (overrides -U/--username)
#   POSTGRES_PASSWORD     Database password (overrides --password)
#   SEED_SERVICES         Comma-separated list of services to seed
#                         (overrides -s/--services)
#   SEED_SQL_ONLY         Set to "true" to only run SQL seed files
#   SEED_PRISMA_ONLY      Set to "true" to only run Prisma seeds
#
# Exit codes:
#   0 - All seed operations completed successfully
#   1 - Error in script arguments or environment
#   2 - Database connection error
#   3 - SQL seed file execution error
#   4 - Prisma seed execution error
# =========================================================================

# Set script directory for relative path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
HOST="localhost"
PORT=5432
USERNAME="postgres"
PASSWORD="postgres"
SERVICES="health,care,plan,gamification,auth"
SQL_ONLY=false
PRISMA_ONLY=false

# ANSI color codes for prettier output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--host)
      HOST="$2"
      shift 2
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -U|--username)
      USERNAME="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    -s|--services)
      SERVICES="$2"
      shift 2
      ;;
    --sql-only)
      SQL_ONLY=true
      shift
      ;;
    --prisma-only)
      PRISMA_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  -h, --host HOST       Database host (default: localhost)"
      echo "  -p, --port PORT       Database port (default: 5432)"
      echo "  -U, --username USER   Database user (default: postgres)"
      echo "  --password PASS       Database password (default: postgres)"
      echo "  -s, --services SVCS   Comma-separated list of services to seed"
      echo "                        (default: all services)"
      echo "                        Valid values: health,care,plan,gamification,auth"
      echo "  --sql-only            Only run SQL seed files, skip Prisma seeds"
      echo "  --prisma-only         Only run Prisma seeds, skip SQL seed files"
      echo "  --help                Display this help message"
      echo ""
      echo "Environment variables:"
      echo "  POSTGRES_HOST         Database host (overrides -h/--host)"
      echo "  POSTGRES_PORT         Database port (overrides -p/--port)"
      echo "  POSTGRES_USER         Database user (overrides -U/--username)"
      echo "  POSTGRES_PASSWORD     Database password (overrides --password)"
      echo "  SEED_SERVICES         Comma-separated list of services to seed"
      echo "                        (overrides -s/--services)"
      echo "  SEED_SQL_ONLY         Set to \"true\" to only run SQL seed files"
      echo "  SEED_PRISMA_ONLY      Set to \"true\" to only run Prisma seeds"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

# Override with environment variables if set
if [[ -n "${POSTGRES_HOST}" ]]; then
  HOST="${POSTGRES_HOST}"
fi

if [[ -n "${POSTGRES_PORT}" ]]; then
  PORT="${POSTGRES_PORT}"
fi

if [[ -n "${POSTGRES_USER}" ]]; then
  USERNAME="${POSTGRES_USER}"
fi

if [[ -n "${POSTGRES_PASSWORD}" ]]; then
  PASSWORD="${POSTGRES_PASSWORD}"
fi

if [[ -n "${SEED_SERVICES}" ]]; then
  SERVICES="${SEED_SERVICES}"
fi

if [[ "${SEED_SQL_ONLY}" == "true" ]]; then
  SQL_ONLY=true
fi

if [[ "${SEED_PRISMA_ONLY}" == "true" ]]; then
  PRISMA_ONLY=true
fi

# Validate conflicting options
if [[ "${SQL_ONLY}" == "true" && "${PRISMA_ONLY}" == "true" ]]; then
  echo -e "${RED}Error: Cannot specify both --sql-only and --prisma-only${NC}"
  exit 1
fi

# Export PGPASSWORD for psql command
export PGPASSWORD="${PASSWORD}"

# Unset PGPASSWORD on script exit
trap 'unset PGPASSWORD' EXIT

# Function to print a section header
print_header() {
  echo -e "\n${BLUE}=========================================================================${NC}"
  echo -e "${BLUE} $1${NC}"
  echo -e "${BLUE}=========================================================================${NC}"
}

# Function to print a subsection header
print_subheader() {
  echo -e "\n${CYAN}-------------------------------------------------------------------------${NC}"
  echo -e "${CYAN} $1${NC}"
  echo -e "${CYAN}-------------------------------------------------------------------------${NC}"
}

# Function to print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print info message
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to print debug message
print_debug() {
  if [[ "${DEBUG}" == "true" ]]; then
    echo -e "${MAGENTA}🔍 $1${NC}"
  fi
}

# Function to check if a service is in the list of services to seed
should_seed_service() {
  local service="$1"
  if [[ "${SERVICES}" == "all" ]]; then
    return 0 # true
  fi
  
  # Convert to array and check if service is in the list
  IFS=',' read -ra SERVICE_ARRAY <<< "${SERVICES}"
  for s in "${SERVICE_ARRAY[@]}"; do
    if [[ "$s" == "$service" ]]; then
      return 0 # true
    fi
  done
  
  return 1 # false
}

# Function to execute SQL seed file
execute_sql_seed() {
  local service="$1"
  local sql_file="${SCRIPT_DIR}/${service}-journey-seed.sql"
  
  # Special case for auth and gamification which don't have 'journey' in their name
  if [[ "$service" == "auth" || "$service" == "gamification" ]]; then
    sql_file="${SCRIPT_DIR}/${service}-seed.sql"
  fi
  
  if [[ ! -f "$sql_file" ]]; then
    print_error "SQL seed file not found: $sql_file"
    return 1
  fi
  
  print_info "Executing SQL seed file for $service..."
  print_debug "Running: psql -h $HOST -p $PORT -U $USERNAME -f $sql_file"
  
  # Determine the database name
  local db_name
  if [[ "$service" == "gamification" || "$service" == "auth" ]]; then
    db_name="$service"
  else
    db_name="${service}_journey"
  fi
  
  # Create a temporary log file for capturing errors
  local log_file=$(mktemp)
  
  # Execute the SQL file
  if psql -h "$HOST" -p "$PORT" -U "$USERNAME" -d "$db_name" -f "$sql_file" > "$log_file" 2>&1; then
    print_success "SQL seed completed for $service"
    rm -f "$log_file"
    return 0
  else
    print_error "Failed to execute SQL seed for $service"
    print_error "Error details:"
    cat "$log_file" | sed 's/^/    /' # Indent error output for readability
    rm -f "$log_file"
    return 1
  fi
}

# Function to execute Prisma seed
execute_prisma_seed() {
  local service="$1"
  local service_dir
  
  # Map service name to directory
  case "$service" in
    health)
      service_dir="health-service"
      ;;
    care)
      service_dir="care-service"
      ;;
    plan)
      service_dir="plan-service"
      ;;
    gamification)
      service_dir="gamification-engine"
      ;;
    auth)
      service_dir="auth-service"
      ;;
    *)
      print_error "Unknown service: $service"
      return 1
      ;;
  esac
  
  local prisma_dir="/src/backend/${service_dir}/prisma"
  
  # Check if prisma directory exists
  if [[ ! -d "$prisma_dir" ]]; then
    print_info "Prisma directory not found for $service, skipping Prisma seed"
    return 0
  fi
  
  # Check if seed.ts or seed.js exists
  if [[ ! -f "${prisma_dir}/seed.ts" && ! -f "${prisma_dir}/seed.js" ]]; then
    print_info "No Prisma seed file found for $service, skipping Prisma seed"
    return 0
  fi
  
  print_info "Executing Prisma seed for $service..."
  
  # Set DATABASE_URL environment variable for the specific service
  local db_name
  if [[ "$service" == "gamification" ]]; then
    db_name="gamification"
  elif [[ "$service" == "auth" ]]; then
    db_name="auth"
  else
    db_name="${service}_journey"
  fi
  
  # Execute the Prisma seed
  cd "/src/backend/${service_dir}" || {
    print_error "Failed to change directory to /src/backend/${service_dir}"
    return 1
  }
  
  # Set DATABASE_URL for the specific service
  export DATABASE_URL="postgresql://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${db_name}?schema=public"
  
  # Set journey-specific context for database operations
  export JOURNEY_CONTEXT="${service}"
  
  print_debug "Running: npx prisma db seed in $(pwd)"
  if npx prisma db seed > /dev/null 2>&1; then
    print_success "Prisma seed completed for $service"
    unset DATABASE_URL
    unset JOURNEY_CONTEXT
    return 0
  else
    print_error "Failed to execute Prisma seed for $service"
    unset DATABASE_URL
    unset JOURNEY_CONTEXT
    return 1
  fi
}

# Function to seed a specific service
seed_service() {
  local service="$1"
  local sql_success=0
  local prisma_success=0
  local sql_skipped=false
  local prisma_skipped=false
  
  print_subheader "Seeding $service database"
  
  # Execute SQL seed if not in prisma-only mode
  if [[ "${PRISMA_ONLY}" != "true" ]]; then
    execute_sql_seed "$service"
    sql_success=$?
  else
    print_info "Skipping SQL seed for $service (--prisma-only specified)"
    sql_skipped=true
  fi
  
  # Execute Prisma seed if not in sql-only mode
  if [[ "${SQL_ONLY}" != "true" ]]; then
    execute_prisma_seed "$service"
    prisma_success=$?
  else
    print_info "Skipping Prisma seed for $service (--sql-only specified)"
    prisma_skipped=true
  fi
  
  # Determine overall success for this service
  if [[ "${sql_skipped}" == "true" && "${prisma_success}" -eq 0 ]] || \
     [[ "${prisma_skipped}" == "true" && "${sql_success}" -eq 0 ]] || \
     [[ "${sql_success}" -eq 0 && "${prisma_success}" -eq 0 ]]; then
    return 0
  else
    return 1
  fi
}

# Function to check if TimescaleDB extension is enabled for health_journey
check_timescaledb() {
  print_info "Checking TimescaleDB extension for health_journey database..."
  
  # Check if TimescaleDB extension is enabled
  local query="SELECT extname FROM pg_extension WHERE extname = 'timescaledb';"
  local result
  result=$(psql -h "$HOST" -p "$PORT" -U "$USERNAME" -d "health_journey" -t -c "$query" 2>/dev/null)
  
  if [[ -z "$result" ]]; then
    print_warning "TimescaleDB extension is not enabled for health_journey database"
    print_info "Health metrics time-series functionality may not work correctly"
    print_info "Run enable-extensions.sql to enable required extensions"
    return 1
  else
    print_success "TimescaleDB extension is properly enabled for health_journey database"
    return 0
  fi
}

# Function to print warning message
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Main function
main() {
  print_header "AUSTA SuperApp - Database Seed Script"
  
  # Print configuration
  print_info "Database Host: ${HOST}"
  print_info "Database Port: ${PORT}"
  print_info "Database User: ${USERNAME}"
  print_info "Services to seed: ${SERVICES}"
  if [[ "${SQL_ONLY}" == "true" ]]; then
    print_info "Mode: SQL seed files only"
  elif [[ "${PRISMA_ONLY}" == "true" ]]; then
    print_info "Mode: Prisma seeds only"
  else
    print_info "Mode: Both SQL and Prisma seeds"
  fi
  
  # Wait for database to be ready
  print_subheader "Checking database connection"
  if [[ -f "${SCRIPT_DIR}/wait-for-db.sh" ]]; then
    print_info "Waiting for database to be ready..."
    if ! "${SCRIPT_DIR}/wait-for-db.sh" --host "${HOST}" --port "${PORT}" --username "${USERNAME}" --password "${PASSWORD}"; then
      print_error "Database is not available. Aborting seed operation."
      exit 2
    fi
  else
    print_error "wait-for-db.sh script not found. Continuing without connection check."
  fi
  
  # Check if all required databases exist
  print_subheader "Checking required databases"
  local required_dbs=("health_journey" "care_journey" "plan_journey" "gamification" "auth")
  local missing_dbs=()
  
  for db in "${required_dbs[@]}"; do
    print_info "Checking if database '$db' exists..."
    if ! psql -h "$HOST" -p "$PORT" -U "$USERNAME" -lqt | cut -d \| -f 1 | grep -qw "$db"; then
      print_warning "Database '$db' does not exist"
      missing_dbs+=("$db")
    else
      print_success "Database '$db' exists"
    fi
  done
  
  if [[ ${#missing_dbs[@]} -gt 0 ]]; then
    print_warning "Some required databases are missing: ${missing_dbs[*]}"
    print_info "Run create-databases.sql to create all required databases"
  fi
  
  # Check TimescaleDB extension for health_journey if it's in the services list
  if should_seed_service "health"; then
    check_timescaledb
  fi
  
  # Initialize variables for tracking overall success
  local overall_success=true
  local services_seeded=0
  local services_failed=0
  
  # Seed each service if it's in the list
  for service in "health" "care" "plan" "gamification" "auth"; do
    if should_seed_service "$service"; then
      if seed_service "$service"; then
        services_seeded=$((services_seeded + 1))
      else
        services_failed=$((services_failed + 1))
        overall_success=false
      fi
    else
      print_info "Skipping $service (not in requested services list)"
    fi
  done
  
  # Print summary
  print_header "Seed Operation Summary"
  print_info "Services successfully seeded: ${services_seeded}"
  if [[ "${services_failed}" -gt 0 ]]; then
    print_error "Services failed to seed: ${services_failed}"
  else
    print_success "All requested services were seeded successfully"
  fi
  
  # Return appropriate exit code
  if [[ "${overall_success}" == "true" ]]; then
    print_success "Database seed operation completed successfully"
    return 0
  else
    print_error "Database seed operation completed with errors"
    return 1
  fi
}

# Execute main function
main
exit $?