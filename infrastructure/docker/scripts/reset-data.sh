#!/bin/bash
# Make script executable with: chmod +x reset-data.sh

# =========================================================================
# AUSTA SuperApp - Database Reset Script
# =========================================================================
# This script provides functionality to reset databases and Docker volumes
# to a clean state for development. It offers options for selective database
# reset, full environment reset, or targeted journey resets.
# =========================================================================

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

# Default values
DRY_RUN=false
FORCE=false
VERBOSE=false
RESEED=true
RESET_ALL=false
RESET_HEALTH=false
RESET_CARE=false
RESET_PLAN=false
RESET_GAMIFICATION=false
RESET_AUTH=false
RESET_VOLUMES=false

# Docker Compose configuration
DOCKER_COMPOSE_FILE="../../docker-compose.dev.yml"
DB_CONTAINER="postgres"

# Database names
HEALTH_DB="health_journey"
CARE_DB="care_journey"
PLAN_DB="plan_journey"
GAMIFICATION_DB="gamification"
AUTH_DB="auth"

# Volume names (will be dynamically determined based on docker-compose project name)
DB_VOLUME=""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_SCRIPTS_DIR="${SCRIPT_DIR}/../db"

# =========================================================================
# Function Definitions
# =========================================================================

# Display script usage information
show_usage() {
    cat << EOF
${BOLD}USAGE:${RESET}
    $(basename $0) [OPTIONS]

${BOLD}DESCRIPTION:${RESET}
    Reset databases and Docker volumes for AUSTA SuperApp development.

${BOLD}OPTIONS:${RESET}
    -h, --help              Show this help message and exit
    -a, --all              Reset all databases and optionally volumes
    --health               Reset only the Health Journey database
    --care                 Reset only the Care Journey database
    --plan                 Reset only the Plan Journey database
    --gamification         Reset only the Gamification database
    --auth                 Reset only the Auth database
    -v, --volumes          Also reset Docker volumes (requires confirmation)
    -f, --force            Skip all confirmation prompts
    -n, --dry-run          Show what would be done without making changes
    --no-reseed            Skip reseeding after reset
    --verbose              Show detailed output

${BOLD}EXAMPLES:${RESET}
    # Reset all databases with confirmation
    $(basename $0) --all

    # Reset only the Health Journey database and reseed it
    $(basename $0) --health

    # Reset everything including volumes (dangerous!)
    $(basename $0) --all --volumes

    # Reset Care and Plan Journey databases
    $(basename $0) --care --plan

EOF
}

# Log messages with different severity levels
log_info() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${RESET} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${RESET} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${RESET} $1" >&2
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[VERBOSE]${RESET} $1"
    fi
}

# Check if Docker and Docker Compose are available
check_dependencies() {
    log_verbose "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or current user doesn't have permission"
        exit 1
    fi
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found at $DOCKER_COMPOSE_FILE"
        log_error "Please run this script from the infrastructure/docker/scripts directory"
        exit 1
    fi
    
    log_verbose "All dependencies satisfied"
}

# Check if the database container is running
check_db_container() {
    log_verbose "Checking if database container is running..."
    
    if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
        log_warning "Database container '$DB_CONTAINER' is not running"
        log_info "Starting the database container..."
        
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] Would start database container using docker-compose"
            return 0
        fi
        
        if ! docker-compose -f "$DOCKER_COMPOSE_FILE" up -d "$DB_CONTAINER"; then
            log_error "Failed to start database container"
            exit 1
        fi
        
        # Wait for the database to be ready
        log_info "Waiting for database to be ready..."
        sleep 5
    fi
    
    log_verbose "Database container is running"
    return 0
}

# Get the Docker Compose project name
get_project_name() {
    local project_dir=$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")") 
    echo "$(basename "$project_dir" | tr '[:upper:]' '[:lower:]')"_
}

# Identify Docker volumes used by the database
identify_volumes() {
    local project_prefix=$(get_project_name)
    DB_VOLUME="${project_prefix}postgres-data"
    log_verbose "Identified database volume: $DB_VOLUME"
}

# Reset a specific database
reset_database() {
    local db_name=$1
    log_info "Resetting database: $db_name"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would reset database $db_name"
        return 0
    fi
    
    # Drop and recreate the database
    docker exec -i "$DB_CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS $db_name;"
    docker exec -i "$DB_CONTAINER" psql -U postgres -c "CREATE DATABASE $db_name;"
    
    # Enable extensions if needed
    if [ "$db_name" = "$HEALTH_DB" ]; then
        log_verbose "Enabling TimescaleDB extension for $db_name"
        docker exec -i "$DB_CONTAINER" psql -U postgres -d "$db_name" -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
    fi
    
    log_success "Database $db_name has been reset"
    return 0
}

# Reset Docker volumes
reset_volumes() {
    log_warning "Preparing to reset Docker volumes. This will delete ALL data!"
    
    if [ "$FORCE" != true ]; then
        read -p "Are you sure you want to continue? This cannot be undone! [y/N] " confirm
        if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
            log_info "Volume reset cancelled"
            return 1
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would stop all containers and remove volume: $DB_VOLUME"
        return 0
    fi
    
    log_info "Stopping all containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    log_info "Removing database volume: $DB_VOLUME"
    if ! docker volume rm "$DB_VOLUME" 2>/dev/null; then
        log_warning "Could not remove volume $DB_VOLUME. It may not exist or is still in use."
    else
        log_success "Volume $DB_VOLUME has been removed"
    fi
    
    log_info "Starting database container..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d "$DB_CONTAINER"
    
    # Wait for the database to be ready
    log_info "Waiting for database to initialize..."
    sleep 10
    
    # Run the database initialization script
    log_info "Initializing database..."
    bash "$DB_SCRIPTS_DIR/init.sh"
    
    log_success "Database volumes have been reset and initialized"
    return 0
}

# Run migrations for all or specific databases
run_migrations() {
    log_info "Running database migrations..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would run migrations.sh script"
        return 0
    fi
    
    # Set environment variables for selective migrations if needed
    local env_vars=""
    if [ "$RESET_ALL" != true ]; then
        if [ "$RESET_HEALTH" = true ]; then env_vars="$env_vars MIGRATE_HEALTH=true"; fi
        if [ "$RESET_CARE" = true ]; then env_vars="$env_vars MIGRATE_CARE=true"; fi
        if [ "$RESET_PLAN" = true ]; then env_vars="$env_vars MIGRATE_PLAN=true"; fi
        if [ "$RESET_GAMIFICATION" = true ]; then env_vars="$env_vars MIGRATE_GAMIFICATION=true"; fi
        if [ "$RESET_AUTH" = true ]; then env_vars="$env_vars MIGRATE_AUTH=true"; fi
    fi
    
    if [ -n "$env_vars" ]; then
        log_verbose "Running migrations with: $env_vars"
        env $env_vars bash "$DB_SCRIPTS_DIR/migrations.sh"
    else
        bash "$DB_SCRIPTS_DIR/migrations.sh"
    fi
    
    log_success "Database migrations completed"
    return 0
}

# Seed databases with test data
seed_databases() {
    if [ "$RESEED" != true ]; then
        log_info "Skipping database seeding as requested"
        return 0
    fi
    
    log_info "Seeding databases with test data..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would run seed-data.sh script"
        return 0
    fi
    
    # Set environment variables for selective seeding if needed
    local env_vars=""
    if [ "$RESET_ALL" != true ]; then
        if [ "$RESET_HEALTH" = true ]; then env_vars="$env_vars SEED_HEALTH=true"; fi
        if [ "$RESET_CARE" = true ]; then env_vars="$env_vars SEED_CARE=true"; fi
        if [ "$RESET_PLAN" = true ]; then env_vars="$env_vars SEED_PLAN=true"; fi
        if [ "$RESET_GAMIFICATION" = true ]; then env_vars="$env_vars SEED_GAMIFICATION=true"; fi
        if [ "$RESET_AUTH" = true ]; then env_vars="$env_vars SEED_AUTH=true"; fi
    fi
    
    if [ -n "$env_vars" ]; then
        log_verbose "Seeding with: $env_vars"
        env $env_vars bash "$DB_SCRIPTS_DIR/seed-data.sh"
    else
        bash "$DB_SCRIPTS_DIR/seed-data.sh"
    fi
    
    log_success "Database seeding completed"
    return 0
}

# =========================================================================
# Parse Command Line Arguments
# =========================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -a|--all)
            RESET_ALL=true
            RESET_HEALTH=true
            RESET_CARE=true
            RESET_PLAN=true
            RESET_GAMIFICATION=true
            RESET_AUTH=true
            shift
            ;;
        --health)
            RESET_HEALTH=true
            shift
            ;;
        --care)
            RESET_CARE=true
            shift
            ;;
        --plan)
            RESET_PLAN=true
            shift
            ;;
        --gamification)
            RESET_GAMIFICATION=true
            shift
            ;;
        --auth)
            RESET_AUTH=true
            shift
            ;;
        -v|--volumes)
            RESET_VOLUMES=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-reseed)
            RESEED=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# =========================================================================
# Main Execution
# =========================================================================

# Check if at least one reset option is selected
if [ "$RESET_ALL" != true ] && 
   [ "$RESET_HEALTH" != true ] && 
   [ "$RESET_CARE" != true ] && 
   [ "$RESET_PLAN" != true ] && 
   [ "$RESET_GAMIFICATION" != true ] && 
   [ "$RESET_AUTH" != true ] && 
   [ "$RESET_VOLUMES" != true ]; then
    log_error "No reset option selected. Please specify what to reset."
    show_usage
    exit 1
fi

# Display warning for dry run mode
if [ "$DRY_RUN" = true ]; then
    log_warning "Running in DRY RUN mode. No changes will be made."
fi

# Check dependencies
check_dependencies

# Identify volumes
identify_volumes

# Handle volume reset first if requested
if [ "$RESET_VOLUMES" = true ]; then
    log_info "=== RESETTING DOCKER VOLUMES ==="
    if reset_volumes; then
        # If volumes were reset, all databases are already reset
        # We just need to run migrations and seed
        run_migrations
        seed_databases
        log_success "Volume reset and initialization completed successfully"
        exit 0
    else
        log_info "Continuing with database-only reset"
    fi
fi

# Check if database container is running
check_db_container

# Reset selected databases
if [ "$RESET_ALL" = true ] || [ "$RESET_HEALTH" = true ]; then
    reset_database "$HEALTH_DB"
fi

if [ "$RESET_ALL" = true ] || [ "$RESET_CARE" = true ]; then
    reset_database "$CARE_DB"
fi

if [ "$RESET_ALL" = true ] || [ "$RESET_PLAN" = true ]; then
    reset_database "$PLAN_DB"
fi

if [ "$RESET_ALL" = true ] || [ "$RESET_GAMIFICATION" = true ]; then
    reset_database "$GAMIFICATION_DB"
fi

if [ "$RESET_ALL" = true ] || [ "$RESET_AUTH" = true ]; then
    reset_database "$AUTH_DB"
fi

# Run migrations
run_migrations

# Seed databases if requested
seed_databases

log_success "Database reset completed successfully"
exit 0