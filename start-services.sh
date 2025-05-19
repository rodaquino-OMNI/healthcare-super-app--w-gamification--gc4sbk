#!/bin/bash

# =========================================================
# AUSTA SuperApp Service Starter
# =========================================================
# This script starts development or production services for the AUSTA SuperApp
# with support for journey-specific startup options and health checking.
# =========================================================

# Set strict error handling
set -e

# Color definitions for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# =========================================================
# HELPER FUNCTIONS
# =========================================================

# Display script usage information
show_usage() {
    echo -e "${BLUE}AUSTA SuperApp Service Starter${NC}"
    echo -e "\nUsage: ./start-services.sh [OPTIONS] [MODE]\n"
    echo -e "${CYAN}Modes:${NC}"
    echo -e "  development       Start services in development mode"
    echo -e "  production        Start services in production mode (scaled)"
    echo -e "\n${CYAN}Journey Options:${NC}"
    echo -e "  --health          Start only Health journey services"
    echo -e "  --care            Start only Care journey services"
    echo -e "  --plan            Start only Plan journey services"
    echo -e "  --all             Start all journey services (default)"
    echo -e "\n${CYAN}Additional Options:${NC}"
    echo -e "  --skip-validation Skip environment validation checks"
    echo -e "  --skip-health     Skip container health checks"
    echo -e "  --dev-only        Start development-only services"
    echo -e "  --help            Display this help message"
    echo -e "\n${CYAN}Examples:${NC}"
    echo -e "  ./start-services.sh development             # Start all services in development mode"
    echo -e "  ./start-services.sh --health development   # Start only Health journey in development mode"
    echo -e "  ./start-services.sh --dev-only production  # Start production with development services"
}

# Log messages with timestamp and color
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO") echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" ;;
        "JOURNEY") echo -e "${MAGENTA}[JOURNEY]${NC} ${timestamp} - $message" ;;
        *) echo -e "${timestamp} - $message" ;;
    esac
}

# Handle errors and provide helpful information
handle_error() {
    local exit_code=$?
    local error_message=$1
    
    log "ERROR" "$error_message (Exit code: $exit_code)"
    
    case $exit_code in
        1) log "ERROR" "General error. Check the command syntax." ;;
        126) log "ERROR" "Command cannot execute. Check permissions." ;;
        127) log "ERROR" "Command not found. Check if Docker is installed." ;;
        130) log "ERROR" "Script terminated by user." ;;
        137) log "ERROR" "Container out of memory. Increase Docker memory limit." ;;
        *) log "ERROR" "Unknown error occurred." ;;
    esac
    
    log "INFO" "For troubleshooting, check logs in ./logs directory"
    exit $exit_code
}

# Validate required environment variables
validate_environment() {
    log "INFO" "Validating environment variables..."
    
    # Create logs directory if it doesn't exist
    mkdir -p ./logs
    
    # Run the environment validation script
    if [ -f "./scripts/validate-env.sh" ]; then
        bash ./scripts/validate-env.sh > ./logs/env-validation.log 2>&1
        if [ $? -ne 0 ]; then
            log "ERROR" "Environment validation failed. See ./logs/env-validation.log for details."
            cat ./logs/env-validation.log
            return 1
        fi
        log "INFO" "Environment validation successful."
    else
        log "WARN" "Environment validation script not found. Skipping validation."
    fi
    
    return 0
}

# Check if Docker is running
check_docker() {
    log "INFO" "Checking if Docker is running..."
    docker info > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        log "ERROR" "Docker is not running. Please start Docker and try again."
        return 1
    fi
    log "INFO" "Docker is running."
    return 0
}

# Check container health
check_container_health() {
    local container_name=$1
    local max_attempts=$2
    local delay=$3
    local attempt=1
    
    log "INFO" "Checking health of container: $container_name"
    
    while [ $attempt -le $max_attempts ]; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' $container_name 2>/dev/null || echo "not_found")
        
        if [ "$status" = "not_found" ]; then
            log "WARN" "Container $container_name not found. Attempt $attempt/$max_attempts"
        elif [ "$status" = "healthy" ]; then
            log "INFO" "Container $container_name is healthy."
            return 0
        else
            log "INFO" "Container $container_name status: $status. Attempt $attempt/$max_attempts"
        fi
        
        attempt=$((attempt + 1))
        sleep $delay
    done
    
    log "ERROR" "Container $container_name failed to become healthy after $max_attempts attempts."
    return 1
}

# Start services with Docker Compose
start_docker_compose() {
    local mode=$1
    local compose_file="docker-compose.yml"
    local compose_command="up -d"
    
    if [ "$mode" = "production" ]; then
        compose_file="docker-compose.scale.yml"
        log "INFO" "Using scaled configuration for production mode."
    elif [ "$DEV_ONLY" = "true" ]; then
        compose_file="docker-compose.dev.yml"
        log "INFO" "Using development-only services configuration."
    fi
    
    log "INFO" "Starting Docker Compose services using $compose_file..."
    cd src/backend && docker-compose -f $compose_file $compose_command
    
    if [ $? -ne 0 ]; then
        handle_error "Failed to start Docker Compose services."
    fi
    
    log "INFO" "Docker Compose services started successfully."
}

# Start frontend services
start_frontend() {
    local mode=$1
    
    log "INFO" "Starting frontend services..."
    cd ../../src/web
    
    if [ "$mode" = "production" ]; then
        yarn build
        if [ $? -ne 0 ]; then
            handle_error "Failed to build frontend."
        fi
        log "INFO" "Frontend built successfully for production."
    else
        yarn dev &
        if [ $? -ne 0 ]; then
            handle_error "Failed to start frontend development server."
        fi
        log "INFO" "Frontend development server started."
    fi
}

# Start journey-specific services
start_journey() {
    local journey=$1
    local mode=$2
    local compose_file="docker-compose.${journey}.yml"
    
    if [ "$mode" = "production" ]; then
        compose_file="docker-compose.${journey}.scale.yml"
    elif [ "$DEV_ONLY" = "true" ]; then
        compose_file="docker-compose.${journey}.dev.yml"
    fi
    
    log "JOURNEY" "Starting $journey journey services..."
    
    if [ -f "src/backend/$compose_file" ]; then
        cd src/backend && docker-compose -f $compose_file up -d
        if [ $? -ne 0 ]; then
            handle_error "Failed to start $journey journey services."
        fi
        log "JOURNEY" "$journey journey services started successfully."
    else
        log "WARN" "$compose_file not found. Falling back to standard compose file with journey filter."
        cd src/backend && docker-compose -f docker-compose.yml up -d --scale ${journey}-service=1
        if [ $? -ne 0 ]; then
            handle_error "Failed to start $journey journey services with fallback method."
        fi
    fi
}

# Check health of critical services
check_critical_services() {
    log "INFO" "Checking health of critical services..."
    
    # List of critical services to check
    local services=("austa-api-gateway" "austa-auth-service" "austa-db")
    
    for service in "${services[@]}"; do
        check_container_health $service 10 3
        if [ $? -ne 0 ]; then
            log "ERROR" "Critical service $service is not healthy."
            return 1
        fi
    done
    
    log "INFO" "All critical services are healthy."
    return 0
}

# =========================================================
# MAIN SCRIPT EXECUTION
# =========================================================

# Default values
MODE=""
JOURNEY="all"
SKIP_VALIDATION="false"
SKIP_HEALTH="false"
DEV_ONLY="false"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|production)
            MODE="$1"
            ;;
        --health)
            JOURNEY="health"
            ;;
        --care)
            JOURNEY="care"
            ;;
        --plan)
            JOURNEY="plan"
            ;;
        --all)
            JOURNEY="all"
            ;;
        --skip-validation)
            SKIP_VALIDATION="true"
            ;;
        --skip-health)
            SKIP_HEALTH="true"
            ;;
        --dev-only)
            DEV_ONLY="true"
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
    shift
done

# Check if mode is specified
if [ -z "$MODE" ]; then
    log "ERROR" "No mode specified. Use 'development' or 'production'."
    show_usage
    exit 1
fi

# Create logs directory
mkdir -p logs

# Set up error handling
trap 'handle_error "Script execution interrupted."' ERR

# Display startup banner
log "INFO" "Starting AUSTA SuperApp services in $MODE mode"
log "INFO" "Journey: $JOURNEY"

# Check if Docker is running
check_docker || exit 1

# Validate environment if not skipped
if [ "$SKIP_VALIDATION" != "true" ]; then
    validate_environment || exit 1
fi

# Start services based on journey selection
if [ "$JOURNEY" = "all" ]; then
    log "INFO" "Starting all services..."
    start_docker_compose "$MODE"
    
    # Check health of critical services if not skipped
    if [ "$SKIP_HEALTH" != "true" ]; then
        check_critical_services || log "WARN" "Some services are not healthy, but continuing startup."
    fi
    
    start_frontend "$MODE"
else
    log "JOURNEY" "Starting $JOURNEY journey services only"
    start_journey "$JOURNEY" "$MODE"
    
    # Check health of journey-specific services if not skipped
    if [ "$SKIP_HEALTH" != "true" ]; then
        check_container_health "austa-${JOURNEY}-service" 10 3 || log "WARN" "$JOURNEY service is not healthy, but continuing startup."
    fi
    
    start_frontend "$MODE"
fi

# Display success message and endpoints
log "INFO" "AUSTA SuperApp services started successfully in $MODE mode"
log "INFO" "API Gateway available at: http://localhost:3000"

if [ "$MODE" = "development" ]; then
    log "INFO" "Web application available at: http://localhost:3001"
    log "INFO" "To stop services, use: docker-compose down in the src/backend directory"
    log "INFO" "To view logs, use: docker-compose logs -f in the src/backend directory"
fi

if [ "$JOURNEY" != "all" ]; then
    log "JOURNEY" "$JOURNEY journey services are running"
fi

exit 0