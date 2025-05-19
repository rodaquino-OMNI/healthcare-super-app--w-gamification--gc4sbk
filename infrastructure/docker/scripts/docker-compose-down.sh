#!/usr/bin/env bash
# Make script executable: chmod +x infrastructure/docker/scripts/docker-compose-down.sh

# ======================================================
# docker-compose-down.sh
# ======================================================
# 
# Safely stops and cleans up Docker Compose services for the AUSTA SuperApp
# development environment. Provides options for removing containers, networks,
# volumes, and cached data with safeguards to prevent accidental data loss.
#
# Author: AUSTA DevOps Team
# Created: May 2025
# ======================================================

set -e

# ======================================================
# Configuration
# ======================================================

# Default compose files
COMPOSE_FILES="-f infrastructure/docker/docker-compose.yml"

# Optional compose files
INFRASTRUCTURE_COMPOSE="-f infrastructure/docker/docker-compose.infrastructure.yml"
FRONTEND_COMPOSE="-f infrastructure/docker/docker-compose.frontend.yml"
BACKEND_COMPOSE="-f infrastructure/docker/docker-compose.backend.yml"

# Default options
REMOVE_VOLUMES=false
REMOVE_IMAGES=false
REMOVE_ORPHANS=true
FORCE_MODE=false
VERBOSE=false
SHOW_HELP=false
BACKUP_VOLUMES=false
SERVICES=""

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# ======================================================
# Functions
# ======================================================

# Display script usage information
show_usage() {
    cat << EOF

${CYAN}AUSTA SuperApp Docker Compose Down Utility${NC}

Safely stops and cleans up Docker Compose services for the AUSTA SuperApp development environment.

${YELLOW}Usage:${NC}
  ./docker-compose-down.sh [options] [service...]

${YELLOW}Options:${NC}
  -h, --help             Show this help message and exit
  -v, --volumes          Remove named volumes declared in the volumes section of the Compose file
                         ${RED}WARNING: This will delete all data in your databases!${NC}
  -i, --images           Remove images used by services
  -a, --all              Remove containers, networks, volumes, and images
                         ${RED}WARNING: This will delete ALL Docker resources!${NC}
  -b, --backup           Backup volumes before removing them (only works with -v or -a)
  -f, --force            Don't ask for confirmation (use with caution)
  --verbose              Show detailed output

${YELLOW}Examples:${NC}
  # Stop containers only
  ./docker-compose-down.sh

  # Stop and remove containers and networks
  ./docker-compose-down.sh

  # Stop and remove containers, networks, and volumes (will prompt for confirmation)
  ./docker-compose-down.sh -v

  # Stop specific services only
  ./docker-compose-down.sh api-gateway auth-service

  # Remove everything (containers, networks, volumes, images) with backup
  ./docker-compose-down.sh -a -b

  # Force remove everything without confirmation (DANGEROUS!)
  ./docker-compose-down.sh -a -f

For more information, see the documentation at: infrastructure/docker/README.md

EOF
}

# Log messages with different levels
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Confirm destructive operations
confirm() {
    if [ "$FORCE_MODE" = true ]; then
        return 0
    fi

    read -p "$1 (y/N) " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Backup volumes before removing them
backup_volumes() {
    if [ "$BACKUP_VOLUMES" = false ]; then
        return 0
    fi

    log_info "Creating backup of volumes before removal..."
    
    # Create backup directory with timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="./docker_volume_backup_${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Get list of volumes used by the compose services
    VOLUME_LIST=$(docker-compose $COMPOSE_FILES $INFRASTRUCTURE_COMPOSE $FRONTEND_COMPOSE $BACKEND_COMPOSE config --volumes 2>/dev/null)
    
    if [ -z "$VOLUME_LIST" ]; then
        log_warn "No volumes found to backup."
        return 0
    fi
    
    log_debug "Volumes to backup: $VOLUME_LIST"
    
    # Backup each volume
    for VOLUME in $VOLUME_LIST; do
        log_info "Backing up volume: $VOLUME"
        
        # Create a temporary container to access the volume
        CONTAINER_ID=$(docker run -d -v "$VOLUME:/data" alpine:latest sleep 60)
        
        # Create tar archive of the volume
        docker exec "$CONTAINER_ID" tar -cf - -C /data . | gzip > "$BACKUP_DIR/${VOLUME}.tar.gz"
        
        # Stop and remove the temporary container
        docker stop "$CONTAINER_ID" > /dev/null
        docker rm "$CONTAINER_ID" > /dev/null
        
        log_info "Volume $VOLUME backed up to ${BACKUP_DIR}/${VOLUME}.tar.gz"
    done
    
    log_info "All volumes backed up to $BACKUP_DIR"
    log_info "To restore: extract the archives and use docker volume commands to restore data."
}

# Check if Docker and Docker Compose are available
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or current user doesn't have permission to access it."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_warn "docker-compose command not found. Trying with 'docker compose' instead."
        # Redefine docker-compose command to use docker compose
        docker-compose() {
            docker compose "$@"
        }
    fi
}

# Build the docker-compose command with appropriate options
build_compose_command() {
    local cmd="docker-compose $COMPOSE_FILES $INFRASTRUCTURE_COMPOSE $FRONTEND_COMPOSE $BACKEND_COMPOSE down"
    
    if [ "$REMOVE_VOLUMES" = true ]; then
        cmd="$cmd -v"
    fi
    
    if [ "$REMOVE_IMAGES" = true ]; then
        cmd="$cmd --rmi all"
    fi
    
    if [ "$REMOVE_ORPHANS" = true ]; then
        cmd="$cmd --remove-orphans"
    fi
    
    if [ -n "$SERVICES" ]; then
        cmd="$cmd $SERVICES"
    fi
    
    echo "$cmd"
}

# ======================================================
# Parse command line arguments
# ======================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -i|--images)
            REMOVE_IMAGES=true
            shift
            ;;
        -a|--all)
            REMOVE_VOLUMES=true
            REMOVE_IMAGES=true
            shift
            ;;
        -b|--backup)
            BACKUP_VOLUMES=true
            shift
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            # Collect remaining arguments as services
            SERVICES="$SERVICES $1"
            shift
            ;;
    esac
done

# ======================================================
# Main execution
# ======================================================

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
    show_usage
    exit 0
fi

# Check dependencies
check_dependencies

# Display warning and confirmation for volume removal
if [ "$REMOVE_VOLUMES" = true ]; then
    log_warn "You are about to remove all Docker volumes used by the AUSTA SuperApp."
    log_warn "This will delete ALL DATA in your databases and other persistent storage!"
    
    if ! confirm "Are you sure you want to continue?"; then
        log_info "Operation cancelled. Volumes will not be removed."
        REMOVE_VOLUMES=false
    elif [ "$BACKUP_VOLUMES" = true ]; then
        backup_volumes
    fi
fi

# Display warning and confirmation for removing everything
if [ "$REMOVE_VOLUMES" = true ] && [ "$REMOVE_IMAGES" = true ]; then
    log_warn "You are about to remove ALL Docker resources (containers, networks, volumes, and images)."
    log_warn "This is a destructive operation that cannot be undone!"
    
    if ! confirm "Are you ABSOLUTELY sure you want to continue?"; then
        log_info "Operation cancelled."
        exit 0
    fi
fi

# Build and execute the docker-compose command
COMPOSE_CMD=$(build_compose_command)
log_debug "Executing: $COMPOSE_CMD"

# Execute the command
log_info "Stopping Docker Compose services..."
eval "$COMPOSE_CMD"

# Provide feedback on completion
log_info "Docker Compose services have been stopped successfully."

if [ "$REMOVE_VOLUMES" = true ]; then
    log_info "Volumes have been removed."
fi

if [ "$REMOVE_IMAGES" = true ]; then
    log_info "Images have been removed."
fi

log_info "Environment cleanup complete."

# Provide hint for starting services again
log_info "To start services again, run: ./infrastructure/docker/scripts/docker-compose-up.sh"

exit 0