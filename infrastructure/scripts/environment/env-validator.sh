#!/bin/bash
# =========================================================================
# AUSTA SuperApp Environment Validation Script
# =========================================================================
# This script performs comprehensive validation of the environment setup,
# ensuring all required components, connectivity, and permissions are
# properly configured before deployment.
#
# Features:
# - Environment configuration validation
# - Infrastructure prerequisites verification
# - Connectivity testing for dependent services
# - AWS permissions validation
# - Docker container readiness checks
# - Service port availability verification
# - Kubernetes namespace validation
#
# Usage: ./env-validator.sh [options]
#   Options:
#     --service=NAME       Service name to validate (required)
#     --journey=NAME       Journey context (health, care, plan, or shared)
#     --environment=ENV    Deployment environment (development, staging, production)
#     --timeout=SECONDS    Operation timeout (default: 30)
#     --env-file=PATH      Path to .env file to source (optional)
#     --skip-aws           Skip AWS-related checks
#     --skip-k8s           Skip Kubernetes-related checks
#     --skip-containers    Skip Docker container checks
#     --skip-connectivity  Skip connectivity tests
#     --verbose            Enable verbose output
#     --help               Display this help message
# =========================================================================

set -e

# Default values
TIMEOUT=30
SERVICE=""
JOURNEY="shared"
ENVIRONMENT="development"
ENV_FILE=""
SKIP_AWS=false
SKIP_K8S=false
SKIP_CONTAINERS=false
SKIP_CONNECTIVITY=false
VERBOSE=false

# ANSI color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

# Display usage information
show_usage() {
  echo "Usage: ./env-validator.sh [options]"
  echo "  Options:"
  echo "    --service=NAME       Service name to validate (required)"
  echo "    --journey=NAME       Journey context (health, care, plan, or shared)"
  echo "    --environment=ENV    Deployment environment (development, staging, production)"
  echo "    --timeout=SECONDS    Operation timeout (default: 30)"
  echo "    --env-file=PATH      Path to .env file to source (optional)"
  echo "    --skip-aws           Skip AWS-related checks"
  echo "    --skip-k8s           Skip Kubernetes-related checks"
  echo "    --skip-containers    Skip Docker container checks"
  echo "    --skip-connectivity  Skip connectivity tests"
  echo "    --verbose            Enable verbose output"
  echo "    --help               Display this help message"
  exit 1
}

# Log a message with timestamp and service context
log_message() {
  local level="$1"
  local message="$2"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  local prefix=""
  
  case "$level" in
    "INFO") prefix="${GREEN}INFO${NC}" ;;
    "WARN") prefix="${YELLOW}WARN${NC}" ;;
    "ERROR") prefix="${RED}ERROR${NC}" ;;
    "SUCCESS") prefix="${GREEN}SUCCESS${NC}" ;;
    "DEBUG") 
      prefix="${BLUE}DEBUG${NC}"
      # Only show debug messages in verbose mode
      if [ "$VERBOSE" != "true" ]; then
        return 0
      fi
      ;;
  esac
  
  if [ "$JOURNEY" != "shared" ]; then
    echo "[$timestamp] [$prefix] [${CYAN}$SERVICE${NC}] [${MAGENTA}$JOURNEY-journey${NC}] [${YELLOW}$ENVIRONMENT${NC}] $message"
  else
    echo "[$timestamp] [$prefix] [${CYAN}$SERVICE${NC}] [${YELLOW}$ENVIRONMENT${NC}] $message"
  fi
}

# Show troubleshooting guide based on error code
show_troubleshooting_guide() {
  local error_code=$1
  
  echo "\n${YELLOW}=== Troubleshooting Guide ===${NC}"
  
  case $error_code in
    2) # Environment variable error
      echo "${CYAN}Missing Environment Variable:${NC}"
      echo "1. Check your .env file or environment configuration"
      echo "2. For local development, copy .env.local.example to .env.local"
      echo "3. For Kubernetes, verify ConfigMap and Secret resources"
      echo "4. Service-specific variables may be found in service documentation"
      ;;
      
    3|4) # Container error
      echo "${CYAN}Docker Container Issue:${NC}"
      echo "1. Check if Docker is running: docker ps"
      echo "2. For local development, run: docker-compose up -d"
      echo "3. Check container logs: docker logs <container_name>"
      echo "4. Verify container health: docker inspect <container_name>"
      echo "5. Restart the container: docker restart <container_name>"
      ;;
      
    5) # Port availability error
      echo "${CYAN}Port Conflict:${NC}"
      echo "1. Identify the process using the port:"
      echo "   - lsof -i:<port> or netstat -tuln | grep <port>"
      echo "2. Stop the conflicting process or change your service port"
      echo "3. For local development, check other running services"
      echo "4. Verify your .env file has the correct PORT setting"
      ;;
      
    6) # AWS permissions error
      echo "${CYAN}AWS Permissions Issue:${NC}"
      echo "1. Verify AWS credentials are configured: aws configure list"
      echo "2. Check IAM permissions for your user/role"
      echo "3. Ensure AWS region is set correctly"
      echo "4. For local development, check ~/.aws/credentials file"
      echo "5. For EKS, verify IAM role has necessary permissions"
      ;;
      
    7) # Kubernetes error
      echo "${CYAN}Kubernetes Configuration Issue:${NC}"
      echo "1. Check if kubectl is configured: kubectl config view"
      echo "2. Verify cluster connectivity: kubectl cluster-info"
      echo "3. Ensure correct context is selected: kubectl config current-context"
      echo "4. Check namespace exists: kubectl get ns"
      echo "5. Verify RBAC permissions: kubectl auth can-i --list"
      ;;
      
    8) # Connectivity error
      echo "${CYAN}Connectivity Issue:${NC}"
      echo "1. Check network connectivity to the service"
      echo "2. Verify DNS resolution: nslookup <hostname>"
      echo "3. Test connectivity: telnet <hostname> <port> or curl <url>"
      echo "4. Check firewall or security group settings"
      echo "5. Verify VPC and subnet configurations"
      ;;
      
    *) # General error
      echo "${CYAN}General Troubleshooting:${NC}"
      echo "1. Check service logs for more details"
      echo "2. Verify network connectivity to dependent services"
      echo "3. Ensure all required services are running"
      echo "4. Check for recent configuration changes"
      ;;
  esac
  
  echo "\n${CYAN}For more help:${NC}"
  echo "- Review service documentation in /docs"
  echo "- Check the troubleshooting guide in the wiki"
  echo "- Contact the DevOps team for assistance"
  echo "${YELLOW}===========================${NC}\n"
}

# Log an error message and exit with error code
log_error_and_exit() {
  local message="$1"
  local exit_code="${2:-1}"
  log_message "ERROR" "$message"
  show_troubleshooting_guide "$exit_code"
  exit "$exit_code"
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if a variable is set and not empty
check_env_var() {
  local var_name="$1"
  local var_value=""
  eval "var_value=\${$var_name:-}"
  
  if [ -z "$var_value" ]; then
    log_error_and_exit "Required environment variable '$var_name' is not set or empty" 2
  else
    log_message "INFO" "Environment variable '$var_name' is properly set"
    return 0
  fi
}

# Check if a Docker container is running and ready
check_container() {
  local container_name="$1"
  local max_attempts=$((TIMEOUT / 2))
  local attempt=1
  
  log_message "INFO" "Checking if container '$container_name' is running and ready..."
  
  # Check if Docker is available
  if ! command_exists docker; then
    log_message "WARN" "Docker command not found, skipping container check"
    return 0
  fi
  
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    log_error_and_exit "Container '$container_name' does not exist" 3
  fi
  
  # Check if container is running
  while [ $attempt -le $max_attempts ]; do
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
      # Check container health if available
      local health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null)
      
      if [ "$health_status" = "healthy" ] || [ "$health_status" = "running" ]; then
        log_message "SUCCESS" "Container '$container_name' is running and ready"
        return 0
      elif [ "$health_status" = "starting" ]; then
        log_message "INFO" "Container '$container_name' is starting (attempt $attempt/$max_attempts)..."
      else
        log_message "WARN" "Container '$container_name' has status: $health_status (attempt $attempt/$max_attempts)"
      fi
    else
      log_message "WARN" "Container '$container_name' is not running (attempt $attempt/$max_attempts)"
    fi
    
    attempt=$((attempt + 1))
    sleep 2
  done
  
  log_error_and_exit "Container '$container_name' is not ready after $TIMEOUT seconds" 4
}

# Check if a port is available (not in use)
check_port_available() {
  local port="$1"
  local protocol="${2:-tcp}"
  
  log_message "INFO" "Checking if port $port/$protocol is available..."
  
  # Check if port is in use
  if command_exists netstat; then
    if netstat -tuln | grep -q ":$port "; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  elif command_exists ss; then
    if ss -tuln | grep -q ":$port "; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  elif command_exists lsof; then
    if lsof -i:"$port" >/dev/null 2>&1; then
      log_error_and_exit "Port $port is already in use" 5
    fi
  else
    log_message "WARN" "Cannot check port availability: netstat, ss, and lsof commands not found"
    return 0
  fi
  
  log_message "SUCCESS" "Port $port/$protocol is available"
  return 0
}

# Test connectivity to a host and port
test_connectivity() {
  local host="$1"
  local port="$2"
  local service_name="$3"
  local max_attempts=$((TIMEOUT / 5))
  local attempt=1
  
  log_message "INFO" "Testing connectivity to $service_name ($host:$port)..."
  
  while [ $attempt -le $max_attempts ]; do
    # Try with nc (netcat) first
    if command_exists nc; then
      if nc -z -w 5 "$host" "$port" >/dev/null 2>&1; then
        log_message "SUCCESS" "Successfully connected to $service_name ($host:$port)"
        return 0
      fi
    # Try with telnet if nc is not available
    elif command_exists telnet; then
      if echo -e "\n" | telnet "$host" "$port" 2>&1 | grep -q "Connected"; then
        log_message "SUCCESS" "Successfully connected to $service_name ($host:$port)"
        return 0
      fi
    # Try with curl if neither nc nor telnet is available
    elif command_exists curl && [ "$port" -eq 80 -o "$port" -eq 443 ]; then
      local protocol="http"
      [ "$port" -eq 443 ] && protocol="https"
      if curl -s -o /dev/null -w "%{http_code}" "$protocol://$host:$port" | grep -q -E "^[2-3][0-9][0-9]$"; then
        log_message "SUCCESS" "Successfully connected to $service_name ($host:$port)"
        return 0
      fi
    else
      log_message "WARN" "Cannot test connectivity: nc, telnet, and curl commands not found"
      return 0
    fi
    
    log_message "DEBUG" "Connection attempt $attempt/$max_attempts to $service_name ($host:$port) failed, retrying..."
    attempt=$((attempt + 1))
    sleep 5
  done
  
  log_error_and_exit "Failed to connect to $service_name ($host:$port) after $TIMEOUT seconds" 8
}

# Check AWS CLI configuration and credentials
check_aws_configuration() {
  log_message "INFO" "Checking AWS CLI configuration..."
  
  # Check if AWS CLI is installed
  if ! command_exists aws; then
    log_message "WARN" "AWS CLI not found, skipping AWS checks"
    return 0
  fi
  
  # Check if AWS credentials are configured
  if ! aws sts get-caller-identity --query "Account" --output text >/dev/null 2>&1; then
    log_error_and_exit "AWS credentials not configured or invalid" 6
  fi
  
  # Get AWS account ID and user/role
  local aws_account=$(aws sts get-caller-identity --query "Account" --output text 2>/dev/null)
  local aws_user=$(aws sts get-caller-identity --query "Arn" --output text 2>/dev/null)
  
  log_message "INFO" "AWS credentials valid for account $aws_account ($aws_user)"
  
  # Check AWS region
  local aws_region=$(aws configure get region 2>/dev/null)
  if [ -z "$aws_region" ]; then
    log_message "WARN" "AWS region not configured"
  else
    log_message "INFO" "AWS region set to $aws_region"
    
    # Verify region matches expected region based on environment
    local expected_region="sa-east-1" # Default to São Paulo region
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
      if [ "$aws_region" != "$expected_region" ]; then
        log_message "WARN" "AWS region ($aws_region) does not match expected region for $ENVIRONMENT ($expected_region)"
      fi
    fi
  fi
  
  return 0
}

# Check AWS permissions for specific resources
check_aws_permissions() {
  log_message "INFO" "Checking AWS permissions..."
  
  # Check if AWS CLI is installed
  if ! command_exists aws; then
    log_message "WARN" "AWS CLI not found, skipping AWS permission checks"
    return 0
  fi
  
  # Check ECR permissions
  log_message "DEBUG" "Checking ECR permissions..."
  if ! aws ecr describe-repositories --repository-names "austa-$SERVICE" >/dev/null 2>&1; then
    log_message "WARN" "No permission to access ECR repository 'austa-$SERVICE' or repository does not exist"
  else
    log_message "INFO" "ECR repository 'austa-$SERVICE' accessible"
  fi
  
  # Check S3 permissions for Terraform state if applicable
  if [ "$ENVIRONMENT" != "development" ]; then
    log_message "DEBUG" "Checking S3 permissions for Terraform state..."
    if ! aws s3 ls "s3://austa-terraform-state" >/dev/null 2>&1; then
      log_message "WARN" "No permission to access S3 bucket 'austa-terraform-state' or bucket does not exist"
    else
      log_message "INFO" "S3 bucket 'austa-terraform-state' accessible"
    fi
  fi
  
  # Check Secrets Manager permissions
  log_message "DEBUG" "Checking Secrets Manager permissions..."
  if ! aws secretsmanager list-secrets --max-items 1 >/dev/null 2>&1; then
    log_message "WARN" "No permission to access Secrets Manager"
  else
    log_message "INFO" "Secrets Manager accessible"
  fi
  
  return 0
}

# Check Kubernetes configuration and connectivity
check_kubernetes_configuration() {
  log_message "INFO" "Checking Kubernetes configuration..."
  
  # Check if kubectl is installed
  if ! command_exists kubectl; then
    log_message "WARN" "kubectl not found, skipping Kubernetes checks"
    return 0
  fi
  
  # Check if kubectl is configured
  if ! kubectl config current-context >/dev/null 2>&1; then
    log_error_and_exit "kubectl not configured with a valid context" 7
  fi
  
  # Get current context
  local k8s_context=$(kubectl config current-context 2>/dev/null)
  log_message "INFO" "Kubernetes context: $k8s_context"
  
  # Check cluster connectivity
  if ! kubectl cluster-info >/dev/null 2>&1; then
    log_error_and_exit "Cannot connect to Kubernetes cluster" 7
  fi
  
  log_message "SUCCESS" "Kubernetes cluster connection successful"
  return 0
}

# Check Kubernetes namespace and resources
check_kubernetes_namespace() {
  local namespace=""
  
  # Determine namespace based on journey and service
  case "$JOURNEY" in
    health)
      namespace="health-journey"
      ;;
    care)
      namespace="care-journey"
      ;;
    plan)
      namespace="plan-journey"
      ;;
    shared)
      # For shared services, determine namespace based on service name
      case "$SERVICE" in
        api-gateway|auth-service|notification-service)
          namespace="shared-services"
          ;;
        gamification-engine)
          namespace="gamification"
          ;;
        *)
          namespace="default"
          ;;
      esac
      ;;
  esac
  
  log_message "INFO" "Checking Kubernetes namespace '$namespace'..."
  
  # Check if kubectl is installed
  if ! command_exists kubectl; then
    log_message "WARN" "kubectl not found, skipping Kubernetes namespace checks"
    return 0
  fi
  
  # Check if namespace exists
  if ! kubectl get namespace "$namespace" >/dev/null 2>&1; then
    log_error_and_exit "Kubernetes namespace '$namespace' does not exist" 7
  fi
  
  log_message "INFO" "Kubernetes namespace '$namespace' exists"
  
  # Check resource quotas
  if kubectl get resourcequota -n "$namespace" >/dev/null 2>&1; then
    local quota_name="${namespace}-quota"
    log_message "DEBUG" "Checking resource quota '$quota_name'..."
    if kubectl get resourcequota "$quota_name" -n "$namespace" >/dev/null 2>&1; then
      log_message "INFO" "Resource quota '$quota_name' exists"
    else
      log_message "WARN" "Resource quota '$quota_name' not found in namespace '$namespace'"
    fi
  fi
  
  # Check limit ranges
  if kubectl get limitrange -n "$namespace" >/dev/null 2>&1; then
    log_message "DEBUG" "Checking limit ranges in namespace '$namespace'..."
    log_message "INFO" "Limit ranges exist in namespace '$namespace'"
  else
    log_message "WARN" "No limit ranges found in namespace '$namespace'"
  fi
  
  return 0
}

# =========================================================================
# Parse Command Line Arguments
# =========================================================================

for arg in "$@"; do
  case $arg in
    --service=*)
      SERVICE="${arg#*=}"
      ;;
    --journey=*)
      JOURNEY="${arg#*=}"
      ;;
    --environment=*)
      ENVIRONMENT="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT="${arg#*=}"
      ;;
    --env-file=*)
      ENV_FILE="${arg#*=}"
      ;;
    --skip-aws)
      SKIP_AWS=true
      ;;
    --skip-k8s)
      SKIP_K8S=true
      ;;
    --skip-containers)
      SKIP_CONTAINERS=true
      ;;
    --skip-connectivity)
      SKIP_CONNECTIVITY=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
    --help)
      show_usage
      ;;
    *)
      log_error_and_exit "Unknown option: $arg"
      ;;
  esac
do

# Validate required parameters
if [ -z "$SERVICE" ]; then
  log_error_and_exit "--service parameter is required"
fi

# Validate journey parameter
case "$JOURNEY" in
  health|care|plan|shared)
    # Valid journey
    ;;
  *)
    log_error_and_exit "Invalid journey: $JOURNEY. Must be one of: health, care, plan, shared"
    ;;
esac

# Validate environment parameter
case "$ENVIRONMENT" in
  development|staging|production)
    # Valid environment
    ;;
  *)
    log_error_and_exit "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
    ;;
esac

# Source environment file if provided
if [ -n "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE" ]; then
    log_message "INFO" "Sourcing environment variables from $ENV_FILE"
    # shellcheck disable=SC1090
    . "$ENV_FILE"
  else
    log_error_and_exit "Environment file not found: $ENV_FILE"
  fi
fi

log_message "INFO" "Starting environment validation for $SERVICE (journey: $JOURNEY, environment: $ENVIRONMENT)"

# =========================================================================
# Validate Environment Variables
# =========================================================================

log_message "INFO" "Validating required environment variables..."

# Common variables for all services
check_env_var "NODE_ENV"
check_env_var "PORT"

# Environment-specific variables
case "$ENVIRONMENT" in
  development)
    # Local development specific variables
    ;;
  staging|production)
    # Check AWS region for non-development environments
    check_env_var "AWS_REGION"
    ;;
esac

# Service-specific variables
case "$SERVICE" in
  api-gateway)
    check_env_var "AUTH_SERVICE_URL"
    check_env_var "HEALTH_SERVICE_URL"
    check_env_var "CARE_SERVICE_URL"
    check_env_var "PLAN_SERVICE_URL"
    check_env_var "GAMIFICATION_ENGINE_URL"
    ;;
    
  auth-service)
    check_env_var "JWT_SECRET"
    check_env_var "JWT_EXPIRATION"
    check_env_var "DATABASE_URL"
    check_env_var "REDIS_URL"
    ;;
    
  gamification-engine)
    check_env_var "DATABASE_URL"
    check_env_var "KAFKA_BROKERS"
    check_env_var "NOTIFICATION_SERVICE_URL"
    ;;
    
  notification-service)
    check_env_var "DATABASE_URL"
    check_env_var "KAFKA_BROKERS"
    check_env_var "EMAIL_PROVIDER"
    check_env_var "SMS_PROVIDER"
    ;;
    
  *)
    # Journey-specific services
    case "$JOURNEY" in
      health)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "FHIR_API_URL"
        ;;
        
      care)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "TELEMEDICINE_API_URL"
        ;;
        
      plan)
        check_env_var "DATABASE_URL"
        check_env_var "KAFKA_BROKERS"
        check_env_var "INSURANCE_API_URL"
        ;;
        
      shared)
        check_env_var "DATABASE_URL"
        ;;
    esac
    ;;
esac

# =========================================================================
# Validate Infrastructure Prerequisites
# =========================================================================

# Check required tools based on environment
log_message "INFO" "Checking required tools..."

# Common tools for all environments
required_tools=("node" "npm")

# Environment-specific tools
case "$ENVIRONMENT" in
  development)
    required_tools+=("docker" "docker-compose")
    ;;
  staging|production)
    required_tools+=("aws" "kubectl" "terraform")
    ;;
esac

# Check if required tools are installed
for tool in "${required_tools[@]}"; do
  if command_exists "$tool"; then
    log_message "INFO" "Required tool '$tool' is installed"
  else
    log_error_and_exit "Required tool '$tool' is not installed" 1
  fi
done

# Check Node.js version
if command_exists node; then
  node_version=$(node --version | cut -d 'v' -f 2)
  log_message "INFO" "Node.js version: $node_version"
  
  # Check if Node.js version is at least 18.15.0
  if [ "$(printf '%s\n' "18.15.0" "$node_version" | sort -V | head -n1)" != "18.15.0" ]; then
    log_message "WARN" "Node.js version $node_version is older than recommended version 18.15.0"
  fi
fi

# =========================================================================
# Validate AWS Configuration (if applicable)
# =========================================================================

if [ "$SKIP_AWS" = "false" ] && [ "$ENVIRONMENT" != "development" ]; then
  check_aws_configuration
  check_aws_permissions
else
  log_message "INFO" "Skipping AWS configuration checks"
fi

# =========================================================================
# Validate Kubernetes Configuration (if applicable)
# =========================================================================

if [ "$SKIP_K8S" = "false" ] && [ "$ENVIRONMENT" != "development" ]; then
  check_kubernetes_configuration
  check_kubernetes_namespace
else
  log_message "INFO" "Skipping Kubernetes configuration checks"
fi

# =========================================================================
# Validate Docker Container Readiness
# =========================================================================

if [ "$SKIP_CONTAINERS" = "false" ] && [ "$ENVIRONMENT" = "development" ]; then
  log_message "INFO" "Validating Docker container readiness..."
  
  # Check common dependencies
  if echo "$DATABASE_URL" | grep -q "postgres"; then
    check_container "postgres"
  fi
  
  if echo "$DATABASE_URL" | grep -q "timescale"; then
    check_container "timescaledb"
  fi
  
  if [ -n "$REDIS_URL" ]; then
    check_container "redis"
  fi
  
  if [ -n "$KAFKA_BROKERS" ]; then
    check_container "kafka"
    check_container "zookeeper"
  fi
  
  # Service-specific container dependencies
  case "$SERVICE" in
    api-gateway)
      # API Gateway typically doesn't have additional container dependencies
      ;;
      
    auth-service)
      # Auth service dependencies already checked (postgres, redis)
      ;;
      
    gamification-engine)
      # Gamification engine dependencies already checked (postgres, kafka)
      ;;
      
    notification-service)
      # Check email service mock if in development
      if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
        check_container "mailhog"
      fi
      ;;
      
    *)
      # Journey-specific container dependencies
      case "$JOURNEY" in
        health)
          # Health journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "fhir-server-mock"
          fi
          ;;
          
        care)
          # Care journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "telemedicine-mock"
          fi
          ;;
          
        plan)
          # Plan journey might have specific containers
          if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "test" ]; then
            check_container "insurance-api-mock"
          fi
          ;;
      esac
      ;;
  esac
else
  log_message "INFO" "Skipping Docker container checks"
fi

# =========================================================================
# Validate Port Availability
# =========================================================================

log_message "INFO" "Validating port availability..."

# Check if the service's port is available
if [ -n "$PORT" ]; then
  check_port_available "$PORT" "tcp"
fi

# Check additional ports based on service type
case "$SERVICE" in
  api-gateway)
    # API Gateway might use additional ports for WebSocket
    if [ -n "$WS_PORT" ]; then
      check_port_available "$WS_PORT" "tcp"
    fi
    ;;
    
  notification-service)
    # Notification service might use additional ports for WebSocket
    if [ -n "$WS_PORT" ]; then
      check_port_available "$WS_PORT" "tcp"
    fi
    ;;
esac

# =========================================================================
# Validate Connectivity to Dependent Services
# =========================================================================

if [ "$SKIP_CONNECTIVITY" = "false" ]; then
  log_message "INFO" "Validating connectivity to dependent services..."
  
  # Extract host and port from URLs
  extract_host_port() {
    local url="$1"
    local default_port="$2"
    
    # Extract protocol, host, and port
    local protocol=$(echo "$url" | grep -oP '^\w+(?=://)')
    local host_port=$(echo "$url" | grep -oP '(?<=://)([^/]+)')
    local host=$(echo "$host_port" | cut -d ':' -f 1)
    local port=$(echo "$host_port" | grep -oP '(?<=:)\d+' || echo "$default_port")
    
    # If no port specified, use default based on protocol
    if [ -z "$port" ]; then
      if [ "$protocol" = "https" ]; then
        port="443"
      elif [ "$protocol" = "http" ]; then
        port="80"
      else
        port="$default_port"
      fi
    fi
    
    echo "$host $port"
  }
  
  # Test connectivity to database
  if [ -n "$DATABASE_URL" ]; then
    log_message "DEBUG" "Parsing DATABASE_URL: $DATABASE_URL"
    
    # Extract host and port from DATABASE_URL
    if echo "$DATABASE_URL" | grep -q "postgres"; then
      local db_host_port=$(echo "$DATABASE_URL" | grep -oP '(?<=@)[^/]+')
      local db_host=$(echo "$db_host_port" | cut -d ':' -f 1)
      local db_port=$(echo "$db_host_port" | cut -d ':' -f 2)
      
      # Default to port 5432 if not specified
      [ -z "$db_port" ] && db_port="5432"
      
      test_connectivity "$db_host" "$db_port" "PostgreSQL database"
    fi
  fi
  
  # Test connectivity to Redis
  if [ -n "$REDIS_URL" ]; then
    log_message "DEBUG" "Parsing REDIS_URL: $REDIS_URL"
    
    # Extract host and port from REDIS_URL
    local redis_host_port=$(echo "$REDIS_URL" | grep -oP '(?<=@)[^/]+')
    local redis_host=$(echo "$redis_host_port" | cut -d ':' -f 1)
    local redis_port=$(echo "$redis_host_port" | cut -d ':' -f 2)
    
    # Default to port 6379 if not specified
    [ -z "$redis_port" ] && redis_port="6379"
    
    test_connectivity "$redis_host" "$redis_port" "Redis"
  fi
  
  # Test connectivity to Kafka
  if [ -n "$KAFKA_BROKERS" ]; then
    log_message "DEBUG" "Parsing KAFKA_BROKERS: $KAFKA_BROKERS"
    
    # Split comma-separated brokers and test each one
    IFS=',' read -ra BROKERS <<< "$KAFKA_BROKERS"
    for broker in "${BROKERS[@]}"; do
      local kafka_host=$(echo "$broker" | cut -d ':' -f 1)
      local kafka_port=$(echo "$broker" | cut -d ':' -f 2)
      
      # Default to port 9092 if not specified
      [ -z "$kafka_port" ] && kafka_port="9092"
      
      test_connectivity "$kafka_host" "$kafka_port" "Kafka broker"
    done
  fi
  
  # Service-specific connectivity tests
  case "$SERVICE" in
    api-gateway)
      # Test connectivity to dependent services
      if [ -n "$AUTH_SERVICE_URL" ]; then
        read -r auth_host auth_port < <(extract_host_port "$AUTH_SERVICE_URL" "3001")
        test_connectivity "$auth_host" "$auth_port" "Auth Service"
      fi
      ;;
      
    gamification-engine)
      # Test connectivity to notification service
      if [ -n "$NOTIFICATION_SERVICE_URL" ]; then
        read -r notif_host notif_port < <(extract_host_port "$NOTIFICATION_SERVICE_URL" "3004")
        test_connectivity "$notif_host" "$notif_port" "Notification Service"
      fi
      ;;
      
    *)
      # Journey-specific connectivity tests
      case "$JOURNEY" in
        health)
          # Test connectivity to FHIR API
          if [ -n "$FHIR_API_URL" ]; then
            read -r fhir_host fhir_port < <(extract_host_port "$FHIR_API_URL" "80")
            test_connectivity "$fhir_host" "$fhir_port" "FHIR API"
          fi
          ;;
          
        care)
          # Test connectivity to Telemedicine API
          if [ -n "$TELEMEDICINE_API_URL" ]; then
            read -r tele_host tele_port < <(extract_host_port "$TELEMEDICINE_API_URL" "80")
            test_connectivity "$tele_host" "$tele_port" "Telemedicine API"
          fi
          ;;
          
        plan)
          # Test connectivity to Insurance API
          if [ -n "$INSURANCE_API_URL" ]; then
            read -r ins_host ins_port < <(extract_host_port "$INSURANCE_API_URL" "80")
            test_connectivity "$ins_host" "$ins_port" "Insurance API"
          fi
          ;;
      esac
      ;;
  esac
else
  log_message "INFO" "Skipping connectivity tests"
fi

# =========================================================================
# Validation Complete
# =========================================================================

log_message "SUCCESS" "Environment validation completed successfully for $SERVICE (journey: $JOURNEY, environment: $ENVIRONMENT)"
exit 0