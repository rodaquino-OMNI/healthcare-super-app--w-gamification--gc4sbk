#!/bin/bash

# ======================================================
# docker-compose-up.sh
# ======================================================
# Intelligently starts Docker Compose services for the AUSTA SuperApp
# development environment in the correct dependency order.
#
# This script ensures:
# - Environment variables are properly validated
# - Infrastructure services (databases, Kafka) start first
# - Service dependencies are checked before startup
# - Proper logging for troubleshooting
#
# Part of the AUSTA SuperApp refactoring project to address
# critical build failures and architectural issues while
# preserving the journey-centered approach and gamification core.
# ======================================================

set -e

# Color definitions for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

# Default configuration
ENV_FILE="${DOCKER_DIR}/.env"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.yml"
INFRA_COMPOSE_FILE="${DOCKER_DIR}/docker-compose.infrastructure.yml"
BACKEND_COMPOSE_FILE="${DOCKER_DIR}/docker-compose.backend.yml"
FRONTEND_COMPOSE_FILE="${DOCKER_DIR}/docker-compose.frontend.yml"
VALIDATE_ENV_SCRIPT="${DOCKER_DIR}/scripts/validate-env.sh"
SERVICE_HEALTH_CHECK_SCRIPT="${DOCKER_DIR}/scripts/service-health-check.sh"

# Default options
START_INFRA=true
START_BACKEND=true
START_FRONTEND=true
DETACHED=false
VERBOSE=false
FORCE_RECREATE=false
SKIP_ENV_VALIDATION=false
SKIP_DEPENDENCY_CHECK=false
SELECTED_SERVICES=""

# Function to display usage information
function show_usage {
    echo -e "${BLUE}Usage:${NC} $0 [options] [services...]"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Show this help message"
    echo "  -e, --env-file FILE        Specify environment file (default: ${DOCKER_DIR}/.env)"
    echo "  -f, --file FILE            Specify docker-compose file (default: ${DOCKER_DIR}/docker-compose.yml)"
    echo "  --infra-only               Start only infrastructure services"
    echo "  --backend-only             Start only backend services"
    echo "  --frontend-only            Start only frontend services"
    echo "  -d, --detach               Run containers in the background"
    echo "  -v, --verbose              Enable verbose output"
    echo "  --force-recreate           Force recreation of containers"
    echo "  --skip-env-validation      Skip environment validation"
    echo "  --skip-dependency-check    Skip dependency checks"
    echo ""
    echo "Examples:"
    echo "  $0                         Start all services"
    echo "  $0 --infra-only            Start only infrastructure services"
    echo "  $0 api-gateway auth-service Start only specified services"
    echo "  $0 -d                      Start all services in detached mode"
    echo ""
}

# Function to log messages with timestamp
function log {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - ${message}"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - ${message}"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - ${message}"
            fi
            ;;
        *)
            echo -e "${timestamp} - ${message}"
            ;;
    esac
}

# Function to check if Docker is running
function check_docker {
    log "DEBUG" "Checking if Docker is running..."
    if ! docker info > /dev/null 2>&1; then
        log "ERROR" "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR" "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
    
    log "DEBUG" "Docker and docker-compose are running and available."
}

# Function to check if environment file exists
function check_env_file {
    log "DEBUG" "Checking if environment file exists: ${ENV_FILE}"
    if [ ! -f "${ENV_FILE}" ]; then
        log "WARN" "Environment file not found: ${ENV_FILE}"
        
        if [ -f "${DOCKER_DIR}/.env.example" ]; then
            log "INFO" "Creating environment file from example..."
            cp "${DOCKER_DIR}/.env.example" "${ENV_FILE}"
            log "INFO" "Created ${ENV_FILE} from example. Please review and update as needed."
        else
            log "ERROR" "No .env.example file found. Please create ${ENV_FILE} manually."
            exit 1
        fi
    fi
    log "DEBUG" "Environment file exists: ${ENV_FILE}"
}

# Function to validate environment variables
function validate_environment {
    if [ "$SKIP_ENV_VALIDATION" = true ]; then
        log "WARN" "Skipping environment validation as requested."
        return 0
    fi
    
    log "INFO" "Validating environment variables..."
    
    if [ -f "${VALIDATE_ENV_SCRIPT}" ]; then
        log "DEBUG" "Running environment validation script: ${VALIDATE_ENV_SCRIPT}"
        if ! "${VALIDATE_ENV_SCRIPT}" "${ENV_FILE}"; then
            log "ERROR" "Environment validation failed. Please check your ${ENV_FILE} file."
            exit 1
        fi
    else
        log "WARN" "Environment validation script not found: ${VALIDATE_ENV_SCRIPT}"
        log "WARN" "Skipping environment validation."
    fi
    
    log "INFO" "Environment validation completed successfully."
}

# Function to check if required compose files exist
function check_compose_files {
    local files_to_check=()
    
    if [ "$START_INFRA" = true ]; then
        files_to_check+=("${INFRA_COMPOSE_FILE}")
    fi
    
    if [ "$START_BACKEND" = true ]; then
        files_to_check+=("${BACKEND_COMPOSE_FILE}")
    fi
    
    if [ "$START_FRONTEND" = true ]; then
        files_to_check+=("${FRONTEND_COMPOSE_FILE}")
    fi
    
    # Always check the main compose file
    files_to_check+=("${COMPOSE_FILE}")
    
    for file in "${files_to_check[@]}"; do
        log "DEBUG" "Checking if compose file exists: ${file}"
        if [ ! -f "${file}" ]; then
            log "ERROR" "Docker Compose file not found: ${file}"
            exit 1
        fi
    done
    
    log "DEBUG" "All required Docker Compose files exist."
}

# Function to build the docker-compose command
function build_compose_command {
    local compose_files=()
    local compose_command=("docker-compose")
    
    # Add the main compose file
    compose_files+=("-f" "${COMPOSE_FILE}")
    
    # Add specific compose files based on what we're starting
    if [ "$START_INFRA" = true ]; then
        compose_files+=("-f" "${INFRA_COMPOSE_FILE}")
    fi
    
    if [ "$START_BACKEND" = true ]; then
        compose_files+=("-f" "${BACKEND_COMPOSE_FILE}")
    fi
    
    if [ "$START_FRONTEND" = true ]; then
        compose_files+=("-f" "${FRONTEND_COMPOSE_FILE}")
    fi
    
    # Add environment file
    compose_files+=("--env-file" "${ENV_FILE}")
    
    # Combine everything into the command
    compose_command+=("${compose_files[@]}")
    
    echo "${compose_command[@]}"
}

# Function to start infrastructure services
function start_infrastructure {
    if [ "$START_INFRA" != true ]; then
        log "DEBUG" "Skipping infrastructure services startup."
        return 0
    fi
    
    log "INFO" "Starting infrastructure services..."
    
    local compose_cmd=($(build_compose_command))
    local infra_services=("postgres" "redis" "zookeeper" "kafka")
    
    # Check for network conflicts before starting services
    log "DEBUG" "Checking for port conflicts..."
    local required_ports=(5432 6379 2181 9092 9093)
    local conflict_found=false
    
    for port in "${required_ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log "WARN" "Port $port is already in use. This may cause conflicts with infrastructure services."
            conflict_found=true
        fi
    done
    
    if [ "$conflict_found" = true ]; then
        log "WARN" "Port conflicts detected. You may need to stop other services using these ports."
        log "WARN" "Continue anyway? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "INFO" "Startup aborted by user."
            exit 0
        fi
    fi
    
    # Start infrastructure services
    if [ "$DETACHED" = true ]; then
        log "DEBUG" "Starting infrastructure services in detached mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up -d --force-recreate "${infra_services[@]}"
        else
            "${compose_cmd[@]}" up -d "${infra_services[@]}"
        fi
    else
        log "DEBUG" "Starting infrastructure services in foreground mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up --force-recreate "${infra_services[@]}"
        else
            "${compose_cmd[@]}" up "${infra_services[@]}"
        fi
    fi
    
    # Wait for infrastructure services to be ready
    log "INFO" "Waiting for infrastructure services to be ready..."
    
    # Check if service-health-check.sh exists and use it
    if [ -f "${SERVICE_HEALTH_CHECK_SCRIPT}" ] && [ "$SKIP_DEPENDENCY_CHECK" != true ]; then
        log "DEBUG" "Running service health check for infrastructure services..."
        if ! "${SERVICE_HEALTH_CHECK_SCRIPT}" --infra-only; then
            log "ERROR" "Infrastructure services failed to start properly."
            exit 1
        fi
    else
        # Simple alternative check if the script doesn't exist
        log "DEBUG" "Performing basic health check for infrastructure services..."
        
        # Wait for PostgreSQL
        log "DEBUG" "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if docker-compose ps postgres | grep -q "Up"; then
                log "DEBUG" "PostgreSQL is up."
                break
            fi
            log "DEBUG" "Waiting for PostgreSQL... (${i}/30)"
            sleep 2
            if [ $i -eq 30 ]; then
                log "ERROR" "PostgreSQL failed to start properly."
                exit 1
            fi
        done
        
        # Wait for Kafka
        log "DEBUG" "Waiting for Kafka to be ready..."
        for i in {1..30}; do
            if docker-compose ps kafka | grep -q "Up"; then
                log "DEBUG" "Kafka is up."
                break
            fi
            log "DEBUG" "Waiting for Kafka... (${i}/30)"
            sleep 2
            if [ $i -eq 30 ]; then
                log "ERROR" "Kafka failed to start properly."
                exit 1
            fi
        done
    fi
    
    log "INFO" "Infrastructure services started successfully."
}

# Function to initialize databases
function initialize_databases {
    if [ "$START_INFRA" != true ]; then
        log "DEBUG" "Skipping database initialization."
        return 0
    fi
    
    log "INFO" "Initializing databases..."
    
    local compose_cmd=($(build_compose_command))
    
    # Run database initialization
    log "DEBUG" "Running database initialization..."
    if ! "${compose_cmd[@]}" run --rm db-init; then
        log "ERROR" "Database initialization failed."
        log "WARN" "You may need to run 'infrastructure/docker/scripts/reset-data.sh' to reset the database state."
        exit 1
    fi
    
    # Run database migrations
    log "DEBUG" "Running database migrations..."
    if ! "${compose_cmd[@]}" run --rm db-migrate; then
        log "ERROR" "Database migrations failed."
        log "WARN" "Check the migration logs for errors and ensure your database schema is up to date."
        exit 1
    fi
    
    # Seed databases with test data
    log "DEBUG" "Seeding databases with test data..."
    if ! "${compose_cmd[@]}" run --rm db-seed; then
        log "WARN" "Database seeding encountered issues. Some test data may not be available."
        log "WARN" "You can manually run 'infrastructure/docker/scripts/reset-data.sh --seed-only' to retry seeding."
    fi
    
    log "INFO" "Database initialization completed successfully."
}

# Function to start backend services
function start_backend_services {
    if [ "$START_BACKEND" != true ]; then
        log "DEBUG" "Skipping backend services startup."
        return 0
    fi
    
    log "INFO" "Starting backend services..."
    
    local compose_cmd=($(build_compose_command))
    local backend_services=("api-gateway" "auth-service" "gamification-engine" "health-service" "care-service" "plan-service" "notification-service")
    
    # If specific services were selected, use only those
    if [ -n "$SELECTED_SERVICES" ]; then
        backend_services=()
        for service in $SELECTED_SERVICES; do
            # Check if this is a backend service
            if echo "api-gateway auth-service gamification-engine health-service care-service plan-service notification-service" | grep -q "\b$service\b"; then
                backend_services+=("$service")
            fi
        done
        
        if [ ${#backend_services[@]} -eq 0 ]; then
            log "DEBUG" "No backend services selected, skipping backend startup."
            return 0
        fi
    fi
    
    # Start backend services
    if [ "$DETACHED" = true ]; then
        log "DEBUG" "Starting backend services in detached mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up -d --force-recreate "${backend_services[@]}"
        else
            "${compose_cmd[@]}" up -d "${backend_services[@]}"
        fi
    else
        log "DEBUG" "Starting backend services in foreground mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up --force-recreate "${backend_services[@]}"
        else
            "${compose_cmd[@]}" up "${backend_services[@]}"
        fi
    fi
    
    # Wait for backend services to be ready
    if [ "$SKIP_DEPENDENCY_CHECK" != true ]; then
        log "INFO" "Waiting for backend services to be ready..."
        
        # Check if service-health-check.sh exists and use it
        if [ -f "${SERVICE_HEALTH_CHECK_SCRIPT}" ]; then
            log "DEBUG" "Running service health check for backend services..."
            if ! "${SERVICE_HEALTH_CHECK_SCRIPT}" --backend-only; then
                log "WARN" "Some backend services may not have started properly."
            fi
        else
            # Simple alternative check if the script doesn't exist
            log "DEBUG" "Performing basic health check for backend services..."
            
            # Check if API Gateway is up
            log "DEBUG" "Checking if API Gateway is up..."
            for i in {1..15}; do
                if docker-compose ps api-gateway | grep -q "Up"; then
                    log "DEBUG" "API Gateway is up."
                    break
                fi
                log "DEBUG" "Waiting for API Gateway... (${i}/15)"
                sleep 2
                if [ $i -eq 15 ]; then
                    log "WARN" "API Gateway may not have started properly."
                fi
            done
        fi
    fi
    
    log "INFO" "Backend services started."
}

# Function to start frontend services
function start_frontend_services {
    if [ "$START_FRONTEND" != true ]; then
        log "DEBUG" "Skipping frontend services startup."
        return 0
    fi
    
    log "INFO" "Starting frontend services..."
    
    local compose_cmd=($(build_compose_command))
    local frontend_services=("web" "mobile" "dev-proxy")
    
    # If specific services were selected, use only those
    if [ -n "$SELECTED_SERVICES" ]; then
        frontend_services=()
        for service in $SELECTED_SERVICES; do
            # Check if this is a frontend service
            if echo "web mobile dev-proxy" | grep -q "\b$service\b"; then
                frontend_services+=("$service")
            fi
        done
        
        if [ ${#frontend_services[@]} -eq 0 ]; then
            log "DEBUG" "No frontend services selected, skipping frontend startup."
            return 0
        fi
    fi
    
    # Start frontend services
    if [ "$DETACHED" = true ]; then
        log "DEBUG" "Starting frontend services in detached mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up -d --force-recreate "${frontend_services[@]}"
        else
            "${compose_cmd[@]}" up -d "${frontend_services[@]}"
        fi
    else
        log "DEBUG" "Starting frontend services in foreground mode..."
        if [ "$FORCE_RECREATE" = true ]; then
            "${compose_cmd[@]}" up --force-recreate "${frontend_services[@]}"
        else
            "${compose_cmd[@]}" up "${frontend_services[@]}"
        fi
    fi
    
    # Wait for frontend services to be ready
    if [ "$SKIP_DEPENDENCY_CHECK" != true ]; then
        log "INFO" "Waiting for frontend services to be ready..."
        
        # Check if service-health-check.sh exists and use it
        if [ -f "${SERVICE_HEALTH_CHECK_SCRIPT}" ]; then
            log "DEBUG" "Running service health check for frontend services..."
            if ! "${SERVICE_HEALTH_CHECK_SCRIPT}" --frontend-only; then
                log "WARN" "Some frontend services may not have started properly."
            fi
        else
            # Simple alternative check if the script doesn't exist
            log "DEBUG" "Performing basic health check for frontend services..."
            
            # Check if dev-proxy is up
            log "DEBUG" "Checking if dev-proxy is up..."
            for i in {1..15}; do
                if docker-compose ps dev-proxy | grep -q "Up"; then
                    log "DEBUG" "dev-proxy is up."
                    break
                fi
                log "DEBUG" "Waiting for dev-proxy... (${i}/15)"
                sleep 2
                if [ $i -eq 15 ]; then
                    log "WARN" "dev-proxy may not have started properly."
                fi
            done
        fi
    fi
    
    log "INFO" "Frontend services started."
}

# Function to display startup summary
function display_summary {
    log "INFO" "======================================================"
    log "INFO" "AUSTA SuperApp Development Environment"
    log "INFO" "======================================================"
    log "INFO" "Environment file: ${ENV_FILE}"
    
    # List running services
    log "INFO" "Running services:"
    docker-compose ps
    
    # Display access URLs
    log "INFO" "======================================================"
    log "INFO" "Access URLs:"
    log "INFO" "Web application: http://localhost:3000"
    log "INFO" "API Gateway: http://localhost:8000"
    log "INFO" "Swagger UI: http://localhost:8000/api/docs"
    
    # Display journey-specific URLs
    log "INFO" "Journey URLs:"
    log "INFO" "Health Journey: http://localhost:3000/health"
    log "INFO" "Care Journey: http://localhost:3000/care"
    log "INFO" "Plan Journey: http://localhost:3000/plan"
    log "INFO" "======================================================"
    
    # Display helpful commands
    log "INFO" "Helpful commands:"
    log "INFO" "View logs: docker-compose logs -f [service_name]"
    log "INFO" "Stop services: infrastructure/docker/scripts/docker-compose-down.sh"
    log "INFO" "Reset data: infrastructure/docker/scripts/reset-data.sh"
    log "INFO" "Check service health: infrastructure/docker/scripts/service-health-check.sh"
    log "INFO" "======================================================"
    
    log "INFO" "Development environment is ready!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -e|--env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        --infra-only)
            START_INFRA=true
            START_BACKEND=false
            START_FRONTEND=false
            shift
            ;;
        --backend-only)
            START_INFRA=false
            START_BACKEND=true
            START_FRONTEND=false
            shift
            ;;
        --frontend-only)
            START_INFRA=false
            START_BACKEND=false
            START_FRONTEND=true
            shift
            ;;
        -d|--detach)
            DETACHED=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --force-recreate)
            FORCE_RECREATE=true
            shift
            ;;
        --skip-env-validation)
            SKIP_ENV_VALIDATION=true
            shift
            ;;
        --skip-dependency-check)
            SKIP_DEPENDENCY_CHECK=true
            shift
            ;;
        -*)
            log "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            # If it's not an option, it's a service name
            SELECTED_SERVICES="${SELECTED_SERVICES} $1"
            shift
            ;;
    esac
done

# Function to check system requirements
function check_system_requirements {
    log "DEBUG" "Checking system requirements..."
    
    # Check available disk space
    local available_space=$(df -k . | awk 'NR==2 {print $4}')
    local required_space=$((10 * 1024 * 1024)) # 10 GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log "WARN" "Low disk space detected. At least 10GB of free space is recommended."
        log "WARN" "Available space: $(($available_space / 1024 / 1024)) GB"
    fi
    
    # Check available memory
    if command -v free &> /dev/null; then
        local available_memory=$(free -m | awk 'NR==2 {print $7}')
        local required_memory=4000 # 4 GB in MB
        
        if [ "$available_memory" -lt "$required_memory" ]; then
            log "WARN" "Low memory detected. At least 4GB of free memory is recommended."
            log "WARN" "Available memory: $available_memory MB"
        fi
    fi
    
    log "DEBUG" "System requirements check completed."
}

# Main execution flow
log "INFO" "Starting AUSTA SuperApp development environment..."

# Perform initial checks
check_docker
check_env_file
check_compose_files
check_system_requirements
validate_environment

# Start services in the correct order
start_infrastructure
initialize_databases
start_backend_services
start_frontend_services

# If we're in detached mode, display a summary
if [ "$DETACHED" = true ]; then
    display_summary
fi

log "INFO" "Startup completed successfully."
log "INFO" "The AUSTA SuperApp development environment is now ready for use."