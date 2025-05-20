#!/bin/bash

#############################################################################
# AUSTA SuperApp - Common Deployment Utilities
#
# This script provides common functions used across all deployment scripts
# including environment detection, logging, error handling, Kubernetes
# resource validation, and AWS service interaction utilities.
#
# Usage: Source this script in other deployment scripts
#        source "$(dirname "$0")/common.sh"
#############################################################################

# Ensure script fails on any error
set -e

# Global variables
READY_TIMEOUT=300  # 5 minutes timeout for readiness checks
RETRY_INTERVAL=5   # 5 seconds between retries
MAX_RETRIES=3      # Maximum number of retries for operations
CORRELATION_ID=""  # For cross-service request tracking

# Detect if script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "This script should be sourced, not executed directly."
  exit 1
fi

#############################################################################
# Environment Detection Functions
#############################################################################

# Detect current environment (dev, staging, prod)
detect_environment() {
  # Check if environment is explicitly set
  if [[ -n "${DEPLOY_ENV}" ]]; then
    echo "${DEPLOY_ENV}"
    return 0
  fi

  # Try to detect from Kubernetes context
  local k8s_context
  k8s_context=$(kubectl config current-context 2>/dev/null || echo "")
  
  case "${k8s_context}" in
    *dev*|*development*)
      echo "development"
      ;;
    *stage*|*staging*)
      echo "staging"
      ;;
    *prod*|*production*)
      echo "production"
      ;;
    *)
      # Default to development if we can't determine
      echo "development"
      ;;
  esac
}

# Get environment-specific configuration
get_environment_config() {
  local env_name="$(detect_environment)"
  local config_path="$(dirname "$0")/config.sh"
  
  # Source the config file if it exists
  if [[ -f "${config_path}" ]]; then
    source "${config_path}"
  else
    log_error "Configuration file not found: ${config_path}"
    exit 1
  fi
  
  # Return the environment name for reference
  echo "${env_name}"
}

# Validate environment requirements
validate_environment() {
  local env_name="$1"
  
  # Check for required tools
  for tool in kubectl aws jq curl; do
    if ! command -v "${tool}" &> /dev/null; then
      log_error "Required tool not found: ${tool}"
      return 1
    fi
  done
  
  # Check AWS credentials if not in development
  if [[ "${env_name}" != "development" ]]; then
    if ! aws sts get-caller-identity &> /dev/null; then
      log_error "AWS credentials not configured or invalid"
      return 1
    fi
  fi
  
  # Check kubectl connection
  if ! kubectl get ns &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    return 1
  fi
  
  return 0
}

#############################################################################
# Logging Functions with Journey Context
#############################################################################

# Initialize correlation ID for request tracking
init_correlation_id() {
  # Generate a unique ID for this deployment run
  CORRELATION_ID="deploy-$(date +%Y%m%d%H%M%S)-$(openssl rand -hex 4)"
  export CORRELATION_ID
  log_info "Initialized correlation ID: ${CORRELATION_ID}"
}

# Format log message with timestamp, level, and correlation ID
format_log_message() {
  local level="$1"
  local message="$2"
  local journey="$3"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Add journey context if provided
  local journey_context=""
  if [[ -n "${journey}" ]]; then
    journey_context="[journey=${journey}]"
  fi
  
  # Format with JSON-like structure for easier parsing
  echo "${timestamp} [${level}]${journey_context} [correlation_id=${CORRELATION_ID}] ${message}"
}

# Log info message
log_info() {
  local message="$1"
  local journey="$2"
  echo "$(format_log_message "INFO" "${message}" "${journey}")" >&1
}

# Log warning message
log_warn() {
  local message="$1"
  local journey="$2"
  echo "$(format_log_message "WARN" "${message}" "${journey}")" >&2
}

# Log error message
log_error() {
  local message="$1"
  local journey="$2"
  echo "$(format_log_message "ERROR" "${message}" "${journey}")" >&2
}

# Log debug message (only if DEBUG is enabled)
log_debug() {
  if [[ "${DEBUG:-false}" == "true" ]]; then
    local message="$1"
    local journey="$2"
    echo "$(format_log_message "DEBUG" "${message}" "${journey}")" >&1
  fi
}

#############################################################################
# Error Handling Functions
#############################################################################

# Handle errors with appropriate exit codes
handle_error() {
  local exit_code=$1
  local error_message=$2
  local journey=$3
  
  log_error "${error_message}" "${journey}"
  
  # Send error to monitoring system if in staging or production
  if [[ "$(detect_environment)" != "development" ]]; then
    send_error_to_monitoring "${error_message}" "${exit_code}" "${journey}"
  fi
  
  return ${exit_code}
}

# Send error to monitoring system
send_error_to_monitoring() {
  local error_message=$1
  local exit_code=$2
  local journey=$3
  local environment=$(detect_environment)
  
  log_debug "Sending error to monitoring: ${error_message}" "${journey}"
  
  # Construct payload for monitoring
  local payload='{"severity":"ERROR","message":"'"${error_message}"'","source":"deployment","correlation_id":"'"${CORRELATION_ID}"'","exit_code":'"${exit_code}"',"environment":"'"${environment}"'"'
  
  # Add journey if provided
  if [[ -n "${journey}" ]]; then
    payload="${payload}"',"journey":"'"${journey}"'"'
  fi
  
  # Close JSON
  payload="${payload}"'}'
  
  # Send to CloudWatch Logs (simplified example)
  if command -v aws &> /dev/null; then
    aws logs put-log-events \
      --log-group-name "/austa/deployment/${environment}" \
      --log-stream-name "deployment-errors-$(date +%Y-%m-%d)" \
      --log-events "timestamp=$(date +%s)000,message=${payload}" \
      --sequence-token "$(aws logs describe-log-streams --log-group-name "/austa/deployment/${environment}" --log-stream-name-prefix "deployment-errors-$(date +%Y-%m-%d)" --query 'logStreams[0].uploadSequenceToken' --output text 2>/dev/null || echo 'null')" \
      &>/dev/null || true
  fi
}

# Retry a command with exponential backoff
retry_command() {
  local cmd="$1"
  local description="$2"
  local journey="$3"
  local max_attempts=${4:-$MAX_RETRIES}
  local attempt=1
  local timeout=${5:-$RETRY_INTERVAL}
  
  while (( attempt <= max_attempts )); do
    log_debug "Attempt ${attempt}/${max_attempts}: ${description}" "${journey}"
    
    if eval "${cmd}"; then
      log_debug "Command succeeded on attempt ${attempt}: ${description}" "${journey}"
      return 0
    fi
    
    log_warn "Command failed on attempt ${attempt}: ${description}" "${journey}"
    
    if (( attempt == max_attempts )); then
      log_error "Command failed after ${max_attempts} attempts: ${description}" "${journey}"
      return 1
    fi
    
    sleep $(( timeout * attempt ))
    (( attempt++ ))
  done
  
  return 1
}

#############################################################################
# Kubernetes Resource Validation Functions
#############################################################################

# Check if namespace exists
check_namespace() {
  local namespace="$1"
  
  if kubectl get namespace "${namespace}" &>/dev/null; then
    log_debug "Namespace ${namespace} exists" 
    return 0
  else
    log_error "Namespace ${namespace} does not exist"
    return 1
  fi
}

# Check if deployment exists
check_deployment() {
  local deployment="$1"
  local namespace="$2"
  
  if kubectl get deployment "${deployment}" -n "${namespace}" &>/dev/null; then
    log_debug "Deployment ${deployment} exists in namespace ${namespace}"
    return 0
  else
    log_error "Deployment ${deployment} does not exist in namespace ${namespace}"
    return 1
  fi
}

# Check if service exists
check_service() {
  local service="$1"
  local namespace="$2"
  
  if kubectl get service "${service}" -n "${namespace}" &>/dev/null; then
    log_debug "Service ${service} exists in namespace ${namespace}"
    return 0
  else
    log_error "Service ${service} does not exist in namespace ${namespace}"
    return 1
  fi
}

# Wait for deployment to be ready
wait_for_deployment() {
  local deployment="$1"
  local namespace="$2"
  local timeout=${3:-$READY_TIMEOUT}
  local journey="$3"
  
  log_info "Waiting for deployment ${deployment} to be ready in namespace ${namespace}" "${journey}"
  
  if ! kubectl rollout status deployment "${deployment}" -n "${namespace}" --timeout="${timeout}s"; then
    log_error "Deployment ${deployment} did not become ready within ${timeout} seconds" "${journey}"
    return 1
  fi
  
  log_info "Deployment ${deployment} is ready" "${journey}"
  return 0
}

# Check deployment health
check_deployment_health() {
  local deployment="$1"
  local namespace="$2"
  local journey="$3"
  
  # Check if deployment exists
  if ! check_deployment "${deployment}" "${namespace}"; then
    return 1
  fi
  
  # Get deployment status
  local replicas
  local available
  local ready
  
  replicas=$(kubectl get deployment "${deployment}" -n "${namespace}" -o jsonpath='{.status.replicas}')
  available=$(kubectl get deployment "${deployment}" -n "${namespace}" -o jsonpath='{.status.availableReplicas}')
  ready=$(kubectl get deployment "${deployment}" -n "${namespace}" -o jsonpath='{.status.readyReplicas}')
  
  # Check if all replicas are available and ready
  if [[ "${available}" == "${replicas}" ]] && [[ "${ready}" == "${replicas}" ]]; then
    log_info "Deployment ${deployment} is healthy (${ready}/${replicas} replicas ready)" "${journey}"
    return 0
  else
    log_error "Deployment ${deployment} is not healthy (${ready}/${replicas} replicas ready)" "${journey}"
    return 1
  fi
}

# Get pod logs for a deployment
get_deployment_logs() {
  local deployment="$1"
  local namespace="$2"
  local tail=${3:-100}
  local journey="$4"
  
  # Get pod names for the deployment
  local pods
  pods=$(kubectl get pods -n "${namespace}" -l "app=${deployment}" -o jsonpath='{.items[*].metadata.name}')
  
  if [[ -z "${pods}" ]]; then
    log_error "No pods found for deployment ${deployment} in namespace ${namespace}" "${journey}"
    return 1
  fi
  
  # Get logs for each pod
  for pod in ${pods}; do
    log_info "Logs for pod ${pod}:" "${journey}"
    kubectl logs "${pod}" -n "${namespace}" --tail="${tail}" || true
  done
  
  return 0
}

# Validate Kubernetes resources
validate_k8s_resources() {
  local namespace="$1"
  local deployment="$2"
  local service="$3"
  local journey="$4"
  
  # Check namespace
  if ! check_namespace "${namespace}"; then
    handle_error 1 "Namespace ${namespace} validation failed" "${journey}"
    return 1
  fi
  
  # Check deployment if provided
  if [[ -n "${deployment}" ]]; then
    if ! check_deployment "${deployment}" "${namespace}"; then
      handle_error 1 "Deployment ${deployment} validation failed" "${journey}"
      return 1
    fi
  fi
  
  # Check service if provided
  if [[ -n "${service}" ]]; then
    if ! check_service "${service}" "${namespace}"; then
      handle_error 1 "Service ${service} validation failed" "${journey}"
      return 1
    fi
  fi
  
  log_info "Kubernetes resources validated successfully" "${journey}"
  return 0
}

#############################################################################
# AWS Service Interaction Utilities
#############################################################################

# Get ECR repository URL
get_ecr_repository_url() {
  local repository_name="$1"
  local region=${2:-$(aws configure get region)}
  
  if [[ -z "${region}" ]]; then
    region="sa-east-1"  # Default region
  fi
  
  local account_id
  account_id=$(aws sts get-caller-identity --query "Account" --output text)
  
  if [[ -z "${account_id}" ]]; then
    log_error "Failed to get AWS account ID"
    return 1
  fi
  
  echo "${account_id}.dkr.ecr.${region}.amazonaws.com/${repository_name}"
}

# Check if image exists in ECR
check_ecr_image() {
  local repository_name="$1"
  local image_tag="$2"
  local region=${3:-$(aws configure get region)}
  
  if [[ -z "${region}" ]]; then
    region="sa-east-1"  # Default region
  fi
  
  # Try to describe the image
  if aws ecr describe-images \
    --repository-name "${repository_name}" \
    --image-ids imageTag="${image_tag}" \
    --region "${region}" &>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Get latest image tag from ECR
get_latest_ecr_image() {
  local repository_name="$1"
  local region=${2:-$(aws configure get region)}
  
  if [[ -z "${region}" ]]; then
    region="sa-east-1"  # Default region
  fi
  
  # Get the latest image tag by creation date
  local latest_tag
  latest_tag=$(aws ecr describe-images \
    --repository-name "${repository_name}" \
    --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' \
    --region "${region}" \
    --output text)
  
  if [[ "${latest_tag}" == "None" || -z "${latest_tag}" ]]; then
    log_error "No images found in repository ${repository_name}"
    return 1
  fi
  
  echo "${latest_tag}"
}

# Get CloudWatch logs for a specific log group
get_cloudwatch_logs() {
  local log_group="$1"
  local log_stream="$2"
  local start_time=${3:-$(date -d '1 hour ago' +%s)000}
  local end_time=${4:-$(date +%s)000}
  local region=${5:-$(aws configure get region)}
  
  if [[ -z "${region}" ]]; then
    region="sa-east-1"  # Default region
  fi
  
  # Get log events
  aws logs get-log-events \
    --log-group-name "${log_group}" \
    --log-stream-name "${log_stream}" \
    --start-time "${start_time}" \
    --end-time "${end_time}" \
    --region "${region}" \
    --query 'events[*].message' \
    --output text
}

#############################################################################
# Deployment Strategy Helpers
#############################################################################

# Get deployment strategy for a service
get_deployment_strategy() {
  local service_name="$1"
  local environment="$(detect_environment)"
  
  # Default strategy is rolling update
  local strategy="rolling"
  
  # In production, use different strategies based on service type
  if [[ "${environment}" == "production" ]]; then
    case "${service_name}" in
      api-gateway*)
        strategy="blue-green"
        ;;
      *-service)
        strategy="canary"
        ;;
      *)
        strategy="rolling"
        ;;
    esac
  fi
  
  echo "${strategy}"
}

# Get traffic percentages for canary deployment
get_canary_steps() {
  local environment="$(detect_environment)"
  
  # Default canary steps for staging
  local steps="10 50 100"
  
  # Production has more gradual steps
  if [[ "${environment}" == "production" ]]; then
    steps="5 20 50 80 100"
  fi
  
  echo "${steps}"
}

# Get validation wait time between canary steps
get_canary_validation_time() {
  local environment="$(detect_environment)"
  
  # Default validation time for staging (in seconds)
  local validation_time=60
  
  # Production has longer validation periods
  if [[ "${environment}" == "production" ]]; then
    validation_time=300  # 5 minutes
  fi
  
  echo "${validation_time}"
}

# Get blue-green switch timeout
get_blue_green_timeout() {
  local environment="$(detect_environment)"
  
  # Default timeout for staging (in seconds)
  local timeout=300  # 5 minutes
  
  # Production has longer timeout
  if [[ "${environment}" == "production" ]]; then
    timeout=600  # 10 minutes
  fi
  
  echo "${timeout}"
}

#############################################################################
# Journey-specific Utilities
#############################################################################

# Get namespace for a journey
get_journey_namespace() {
  local journey="$1"
  
  case "${journey}" in
    health)
      echo "health-journey"
      ;;
    care)
      echo "care-journey"
      ;;
    plan)
      echo "plan-journey"
      ;;
    gamification)
      echo "gamification"
      ;;
    *)
      echo "${journey}"
      ;;
  esac
}

# Get services for a journey
get_journey_services() {
  local journey="$1"
  
  case "${journey}" in
    health)
      echo "health-service health-metrics-service health-goals-service health-devices-service"
      ;;
    care)
      echo "care-service appointments-service providers-service telemedicine-service"
      ;;
    plan)
      echo "plan-service benefits-service claims-service"
      ;;
    gamification)
      echo "gamification-engine achievements-service rewards-service"
      ;;
    *)
      echo ""
      ;;
  esac
}

# Initialize script
init_correlation_id

# Log script initialization
log_info "Common deployment utilities initialized"