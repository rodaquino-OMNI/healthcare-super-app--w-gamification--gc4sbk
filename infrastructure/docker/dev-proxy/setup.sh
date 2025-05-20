#!/bin/bash

# AUSTA SuperApp Development Proxy Setup Script
# This script automates the setup and initialization of the development proxy for local development.
# It ensures that necessary environment variables are set, generates configuration files from templates,
# verifies connectivity to backend services, and can be used to start the proxy container independently
# or as part of the larger docker-compose environment.

set -e

# Color codes for terminal output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default environment variables
API_GATEWAY_URL="http://api-gateway:4000"
AUTH_SERVICE_URL="http://auth-service:4001"
HEALTH_SERVICE_URL="http://health-service:4002"
CARE_SERVICE_URL="http://care-service:4003"
PLAN_SERVICE_URL="http://plan-service:4004"
GAMIFICATION_SERVICE_URL="http://gamification-engine:4005"
NOTIFICATION_SERVICE_URL="http://notification-service:4006"
PROXY_PORT="80"
ENABLE_CORS="true"
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8081"
TEMPLATE_DIR="${SCRIPT_DIR}/templates"
CONF_DIR="${SCRIPT_DIR}/conf.d"
ERROR_PAGES_DIR="${SCRIPT_DIR}/error_pages"
START_PROXY="false"
VERIFY_CONNECTIVITY="true"
VERBOSE="false"

# Function to display usage information
usage() {
    echo -e "${BLUE}AUSTA SuperApp Development Proxy Setup${NC}"
    echo -e "Usage: $0 [options]"
    echo -e "\nOptions:"
    echo -e "  --api-gateway-url=URL       URL for the API Gateway service (default: ${API_GATEWAY_URL})"
    echo -e "  --auth-service-url=URL      URL for the Authentication service (default: ${AUTH_SERVICE_URL})"
    echo -e "  --health-service-url=URL    URL for the Health Journey service (default: ${HEALTH_SERVICE_URL})"
    echo -e "  --care-service-url=URL      URL for the Care Journey service (default: ${CARE_SERVICE_URL})"
    echo -e "  --plan-service-url=URL      URL for the Plan Journey service (default: ${PLAN_SERVICE_URL})"
    echo -e "  --gamification-url=URL      URL for the Gamification Engine (default: ${GAMIFICATION_SERVICE_URL})"
    echo -e "  --notification-url=URL      URL for the Notification service (default: ${NOTIFICATION_SERVICE_URL})"
    echo -e "  --proxy-port=PORT           Port on which the proxy will listen (default: ${PROXY_PORT})"
    echo -e "  --enable-cors=BOOL          Whether to enable CORS headers (default: ${ENABLE_CORS})"
    echo -e "  --cors-origins=ORIGINS      Comma-separated list of allowed origins (default: ${CORS_ALLOWED_ORIGINS})"
    echo -e "  --template-dir=DIR          Directory containing template files (default: ${TEMPLATE_DIR})"
    echo -e "  --conf-dir=DIR              Directory for generated configuration files (default: ${CONF_DIR})"
    echo -e "  --error-pages-dir=DIR       Directory containing error page templates (default: ${ERROR_PAGES_DIR})"
    echo -e "  --start-proxy               Start the proxy container after setup (default: ${START_PROXY})"
    echo -e "  --skip-verify               Skip service connectivity verification (default: !${VERIFY_CONNECTIVITY})"
    echo -e "  --verbose                   Enable verbose output (default: ${VERBOSE})"
    echo -e "  --help                      Display this help message"
    echo -e "\nExample:"
    echo -e "  $0 --api-gateway-url=http://localhost:4000 --enable-cors=true --start-proxy"
    exit 1
}

# Function to log messages
log() {
    local level=$1
    local message=$2
    local color=$NC
    
    case $level in
        "INFO") color=$BLUE ;;
        "SUCCESS") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
    esac
    
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}${NC}"
}

# Function to log verbose messages
log_verbose() {
    if [ "${VERBOSE}" = "true" ]; then
        log "INFO" "$1"
    fi
}

# Function to check if a directory exists and create it if it doesn't
ensure_directory() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        log_verbose "Creating directory: $dir"
        mkdir -p "$dir"
    fi
}

# Function to verify connectivity to a service
verify_service_connectivity() {
    local service_name=$1
    local service_url=$2
    local max_retries=3
    local retry_count=0
    local health_endpoint="/health"
    
    # Extract the protocol, host, and port from the URL
    local protocol=$(echo $service_url | grep -o "^[^:]*")
    local host_port=$(echo $service_url | sed -e "s|^[^:]*://||" -e "s|/.*$||")
    local host=$(echo $host_port | cut -d: -f1)
    local port=$(echo $host_port | cut -d: -f2)
    
    log_verbose "Verifying connectivity to ${service_name} at ${host}:${port}"
    
    # Try to connect to the service
    while [ $retry_count -lt $max_retries ]; do
        if nc -z -w 2 $host $port 2>/dev/null; then
            log "SUCCESS" "✓ ${service_name} is reachable at ${host}:${port}"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log "WARNING" "⚠ ${service_name} is not reachable at ${host}:${port}, retrying ($retry_count/$max_retries)..."
                sleep 2
            else
                log "WARNING" "⚠ ${service_name} is not reachable at ${host}:${port} after ${max_retries} attempts"
                return 1
            fi
        fi
    done
}

# Function to generate Nginx configuration files from templates
generate_config_files() {
    log "INFO" "Generating Nginx configuration files..."
    
    # Ensure the configuration directory exists
    ensure_directory "$CONF_DIR"
    
    # Create the main services configuration file
    cat > "${CONF_DIR}/services.conf" << EOF
# Generated by setup.sh on $(date)

# API Gateway Service
location /api/gateway/ {
    proxy_pass ${API_GATEWAY_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Auth Service
location /api/auth/ {
    proxy_pass ${AUTH_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Health Journey Service
location /api/health/ {
    proxy_pass ${HEALTH_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Care Journey Service
location /api/care/ {
    proxy_pass ${CARE_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Plan Journey Service
location /api/plan/ {
    proxy_pass ${PLAN_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Gamification Engine
location /api/gamification/ {
    proxy_pass ${GAMIFICATION_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Notification Service
location /api/notifications/ {
    proxy_pass ${NOTIFICATION_SERVICE_URL}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# WebSocket Connections
location /ws/ {
    proxy_pass ${API_GATEWAY_URL}/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Health Check Endpoint
location /health {
    access_log off;
    add_header Content-Type text/plain;
    return 200 'OK';
}

# Root Redirect
location = / {
    return 302 /health;
}

# Error Pages
error_page 502 /502.html;
location = /502.html {
    root /usr/share/nginx/html/error_pages;
    internal;
}

error_page 504 /504.html;
location = /504.html {
    root /usr/share/nginx/html/error_pages;
    internal;
}

error_page 500 /500.html;
location = /500.html {
    root /usr/share/nginx/html/error_pages;
    internal;
}

error_page 404 /404.html;
location = /404.html {
    root /usr/share/nginx/html/error_pages;
    internal;
}
EOF

    # Create CORS configuration if enabled
    if [ "${ENABLE_CORS}" = "true" ]; then
        cat > "${CONF_DIR}/cors.conf" << EOF
# Generated by setup.sh on $(date)

# CORS Configuration
add_header 'Access-Control-Allow-Origin' '${CORS_ALLOWED_ORIGINS}' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

# Pre-flight requests
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' '${CORS_ALLOWED_ORIGINS}' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain; charset=utf-8';
    add_header 'Content-Length' 0;
    return 204;
}
EOF
        log "SUCCESS" "✓ CORS configuration generated"
    else
        log_verbose "CORS is disabled, skipping CORS configuration"
        # Remove any existing CORS configuration
        if [ -f "${CONF_DIR}/cors.conf" ]; then
            rm "${CONF_DIR}/cors.conf"
            log_verbose "Removed existing CORS configuration"
        fi
    fi
    
    # Ensure error pages directory exists
    ensure_directory "$ERROR_PAGES_DIR"
    
    # Create basic error pages if they don't exist
    for error_code in 404 500 502 504; do
        if [ ! -f "${ERROR_PAGES_DIR}/${error_code}.html" ]; then
            cat > "${ERROR_PAGES_DIR}/${error_code}.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Error ${error_code} - AUSTA SuperApp Development Proxy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #e74c3c;
            margin-top: 0;
        }
        .service-list {
            margin-top: 20px;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .service-item {
            margin-bottom: 10px;
        }
        .service-name {
            font-weight: bold;
        }
        .service-url {
            font-family: monospace;
            background-color: #eee;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .help-text {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f7fb;
            border-left: 4px solid #3498db;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Error ${error_code}</h1>
        
        <p>The AUSTA SuperApp Development Proxy encountered an error while processing your request.</p>
        
        <div class="service-list">
            <h3>Service Configuration:</h3>
            <div class="service-item">
                <span class="service-name">API Gateway:</span> 
                <span class="service-url">${API_GATEWAY_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Auth Service:</span> 
                <span class="service-url">${AUTH_SERVICE_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Health Service:</span> 
                <span class="service-url">${HEALTH_SERVICE_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Care Service:</span> 
                <span class="service-url">${CARE_SERVICE_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Plan Service:</span> 
                <span class="service-url">${PLAN_SERVICE_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Gamification Engine:</span> 
                <span class="service-url">${GAMIFICATION_SERVICE_URL}</span>
            </div>
            <div class="service-item">
                <span class="service-name">Notification Service:</span> 
                <span class="service-url">${NOTIFICATION_SERVICE_URL}</span>
            </div>
        </div>
        
        <div class="help-text">
            <h3>Troubleshooting:</h3>
            <ul>
                <li>Ensure all required services are running</li>
                <li>Check service logs for more detailed error information</li>
                <li>Verify that the service URLs are correct</li>
                <li>Check network connectivity between services</li>
            </ul>
            <p>For more information, see the <a href="https://github.com/austa/superapp/blob/main/infrastructure/docker/dev-proxy/README.md">Development Proxy documentation</a>.</p>
        </div>
    </div>
</body>
</html>
EOF
            log_verbose "Created error page for ${error_code}"
        fi
    done
    
    log "SUCCESS" "✓ Configuration files generated successfully"
}

# Function to create a Docker Compose environment file
create_env_file() {
    local env_file="${SCRIPT_DIR}/.env"
    
    log "INFO" "Creating environment file for Docker Compose..."
    
    cat > "$env_file" << EOF
# Generated by setup.sh on $(date)

# Service URLs
API_GATEWAY_URL=${API_GATEWAY_URL}
AUTH_SERVICE_URL=${AUTH_SERVICE_URL}
HEALTH_SERVICE_URL=${HEALTH_SERVICE_URL}
CARE_SERVICE_URL=${CARE_SERVICE_URL}
PLAN_SERVICE_URL=${PLAN_SERVICE_URL}
GAMIFICATION_SERVICE_URL=${GAMIFICATION_SERVICE_URL}
NOTIFICATION_SERVICE_URL=${NOTIFICATION_SERVICE_URL}

# Proxy Configuration
PROXY_PORT=${PROXY_PORT}
ENABLE_CORS=${ENABLE_CORS}
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
EOF
    
    log "SUCCESS" "✓ Environment file created at ${env_file}"
}

# Function to start the proxy container
start_proxy() {
    log "INFO" "Starting the development proxy container..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed or not in PATH. Please install Docker to continue."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR" "Docker Compose is not installed or not in PATH. Please install Docker Compose to continue."
        exit 1
    fi
    
    # Start the container using Docker Compose
    if docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" up -d; then
        log "SUCCESS" "✓ Development proxy started successfully"
        log "INFO" "The proxy is now available at http://localhost:${PROXY_PORT}"
    else
        log "ERROR" "Failed to start the development proxy container"
        exit 1
    fi
}

# Parse command-line arguments
while [ $# -gt 0 ]; do
    case $1 in
        --api-gateway-url=*)
            API_GATEWAY_URL="${1#*=}"
            ;;
        --auth-service-url=*)
            AUTH_SERVICE_URL="${1#*=}"
            ;;
        --health-service-url=*)
            HEALTH_SERVICE_URL="${1#*=}"
            ;;
        --care-service-url=*)
            CARE_SERVICE_URL="${1#*=}"
            ;;
        --plan-service-url=*)
            PLAN_SERVICE_URL="${1#*=}"
            ;;
        --gamification-url=*)
            GAMIFICATION_SERVICE_URL="${1#*=}"
            ;;
        --notification-url=*)
            NOTIFICATION_SERVICE_URL="${1#*=}"
            ;;
        --proxy-port=*)
            PROXY_PORT="${1#*=}"
            ;;
        --enable-cors=*)
            ENABLE_CORS="${1#*=}"
            ;;
        --cors-origins=*)
            CORS_ALLOWED_ORIGINS="${1#*=}"
            ;;
        --template-dir=*)
            TEMPLATE_DIR="${1#*=}"
            ;;
        --conf-dir=*)
            CONF_DIR="${1#*=}"
            ;;
        --error-pages-dir=*)
            ERROR_PAGES_DIR="${1#*=}"
            ;;
        --start-proxy)
            START_PROXY="true"
            ;;
        --skip-verify)
            VERIFY_CONNECTIVITY="false"
            ;;
        --verbose)
            VERBOSE="true"
            ;;
        --help)
            usage
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            ;;
    esac
    shift
done

# Display banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║               AUSTA SuperApp Development Proxy                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Log configuration
log "INFO" "Development Proxy Setup"
log_verbose "Configuration:"
log_verbose "  API Gateway URL: ${API_GATEWAY_URL}"
log_verbose "  Auth Service URL: ${AUTH_SERVICE_URL}"
log_verbose "  Health Service URL: ${HEALTH_SERVICE_URL}"
log_verbose "  Care Service URL: ${CARE_SERVICE_URL}"
log_verbose "  Plan Service URL: ${PLAN_SERVICE_URL}"
log_verbose "  Gamification Service URL: ${GAMIFICATION_SERVICE_URL}"
log_verbose "  Notification Service URL: ${NOTIFICATION_SERVICE_URL}"
log_verbose "  Proxy Port: ${PROXY_PORT}"
log_verbose "  Enable CORS: ${ENABLE_CORS}"
log_verbose "  CORS Allowed Origins: ${CORS_ALLOWED_ORIGINS}"
log_verbose "  Template Directory: ${TEMPLATE_DIR}"
log_verbose "  Configuration Directory: ${CONF_DIR}"
log_verbose "  Error Pages Directory: ${ERROR_PAGES_DIR}"
log_verbose "  Start Proxy: ${START_PROXY}"
log_verbose "  Verify Connectivity: ${VERIFY_CONNECTIVITY}"
log_verbose "  Verbose Output: ${VERBOSE}"

# Verify connectivity to services if enabled
if [ "${VERIFY_CONNECTIVITY}" = "true" ]; then
    log "INFO" "Verifying connectivity to backend services..."
    
    # Check if netcat is available for connectivity checks
    if ! command -v nc &> /dev/null; then
        log "WARNING" "netcat (nc) is not installed. Skipping connectivity verification."
    else
        # Extract host and port from URLs and verify connectivity
        verify_service_connectivity "API Gateway" "${API_GATEWAY_URL}"
        verify_service_connectivity "Auth Service" "${AUTH_SERVICE_URL}"
        verify_service_connectivity "Health Service" "${HEALTH_SERVICE_URL}"
        verify_service_connectivity "Care Service" "${CARE_SERVICE_URL}"
        verify_service_connectivity "Plan Service" "${PLAN_SERVICE_URL}"
        verify_service_connectivity "Gamification Engine" "${GAMIFICATION_SERVICE_URL}"
        verify_service_connectivity "Notification Service" "${NOTIFICATION_SERVICE_URL}"
    fi
else
    log_verbose "Skipping service connectivity verification"
fi

# Generate configuration files
generate_config_files

# Create environment file for Docker Compose
create_env_file

# Start the proxy if requested
if [ "${START_PROXY}" = "true" ]; then
    start_proxy
else
    log "INFO" "Setup completed successfully. To start the proxy, run:"
    log "INFO" "  cd ${SCRIPT_DIR} && docker-compose up -d"
    log "INFO" "Or run this script with the --start-proxy option"
fi

log "SUCCESS" "✓ Development proxy setup completed successfully"