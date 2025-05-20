#!/bin/bash

#############################################################################
# k8s-rollback.sh
#
# Kubernetes-specific rollback utilities for the AUSTA SuperApp
#
# This script handles deployment revisions, instantly reverts to previous
# working deployments, updates service selectors for traffic redirection,
# scales resources appropriately during rollback, and verifies Kubernetes
# resource health after rollback is complete.
#
# Usage: ./k8s-rollback.sh [options]
#   Options:
#     -n, --namespace <namespace>     Kubernetes namespace (required)
#     -d, --deployment <deployment>   Deployment name (required)
#     -r, --revision <revision>       Specific revision to rollback to (optional)
#     -s, --service <service>         Service name for traffic redirection (optional)
#     -t, --type <type>               Deployment type: canary|bluegreen (default: canary)
#     -v, --verify                    Verify health after rollback (default: true)
#     -h, --help                      Show this help message
#
# Examples:
#   ./k8s-rollback.sh -n health-journey -d health-service
#   ./k8s-rollback.sh -n api-gateway -d api-gateway -t bluegreen -s api-gateway-service
#   ./k8s-rollback.sh -n gamification -d gamification-engine -r 3
#
# Author: AUSTA SuperApp Team
# Date: May 2025
#############################################################################

# Source common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh" 2>/dev/null || { echo "Error: common.sh not found"; exit 1; }
source "${SCRIPT_DIR}/config.sh" 2>/dev/null || { echo "Error: config.sh not found"; exit 1; }

# Default values
NAMESPACE=""
DEPLOYMENT=""
REVISION=""
SERVICE=""
DEPLOYMENT_TYPE="canary"
VERIFY_HEALTH="true"
TIMEOUT=${ROLLBACK_HEALTH_CHECK_TIMEOUT:-300}
HEALTH_CHECK_INTERVAL=${ROLLBACK_HEALTH_CHECK_INTERVAL:-5}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -d|--deployment)
      DEPLOYMENT="$2"
      shift 2
      ;;
    -r|--revision)
      REVISION="$2"
      shift 2
      ;;
    -s|--service)
      SERVICE="$2"
      shift 2
      ;;
    -t|--type)
      DEPLOYMENT_TYPE="$2"
      shift 2
      ;;
    -v|--verify)
      VERIFY_HEALTH="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -n, --namespace <namespace>     Kubernetes namespace (required)"
      echo "  -d, --deployment <deployment>   Deployment name (required)"
      echo "  -r, --revision <revision>       Specific revision to rollback to (optional)"
      echo "  -s, --service <service>         Service name for traffic redirection (optional)"
      echo "  -t, --type <type>               Deployment type: canary|bluegreen (default: canary)"
      echo "  -v, --verify                    Verify health after rollback (default: true)"
      echo "  -h, --help                      Show this help message"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$NAMESPACE" ]]; then
  log_error "Namespace (-n, --namespace) is required"
  exit 1
fi

if [[ -z "$DEPLOYMENT" ]]; then
  log_error "Deployment (-d, --deployment) is required"
  exit 1
fi

# If service is not specified, use deployment name
if [[ -z "$SERVICE" ]]; then
  SERVICE="$DEPLOYMENT"
fi

# Validate deployment type
if [[ "$DEPLOYMENT_TYPE" != "canary" && "$DEPLOYMENT_TYPE" != "bluegreen" ]]; then
  log_error "Invalid deployment type: $DEPLOYMENT_TYPE. Must be 'canary' or 'bluegreen'"
  exit 1
fi

#############################################################################
# Functions
#############################################################################

# Check if kubectl is available
check_kubectl() {
  if ! command -v kubectl &> /dev/null; then
    log_error "kubectl command not found. Please install kubectl."
    exit 1
  fi
}

# Check if deployment exists
check_deployment_exists() {
  local namespace=$1
  local deployment=$2
  
  if ! kubectl get deployment "$deployment" -n "$namespace" &> /dev/null; then
    log_error "Deployment '$deployment' not found in namespace '$namespace'"
    return 1
  fi
  
  return 0
}

# Get available revisions for a deployment
get_available_revisions() {
  local namespace=$1
  local deployment=$2
  
  kubectl rollout history deployment "$deployment" -n "$namespace" | grep -v "REVISION" | awk '{print $1}'
}

# Get the previous revision number
get_previous_revision() {
  local namespace=$1
  local deployment=$2
  
  local revisions=($(get_available_revisions "$namespace" "$deployment"))
  
  if [[ ${#revisions[@]} -lt 2 ]]; then
    log_error "Not enough revision history for deployment '$deployment' in namespace '$namespace'"
    return 1
  fi
  
  # Return the second-to-last revision (previous version)
  echo "${revisions[${#revisions[@]}-2]}"
}

# Perform rollback to a specific revision
rollback_deployment() {
  local namespace=$1
  local deployment=$2
  local revision=$3
  
  log_info "Rolling back deployment '$deployment' in namespace '$namespace' to revision '$revision'"
  
  if [[ -z "$revision" ]]; then
    # Rollback to the previous revision
    kubectl rollout undo deployment "$deployment" -n "$namespace"
  else
    # Rollback to a specific revision
    kubectl rollout undo deployment "$deployment" -n "$namespace" --to-revision="$revision"
  fi
  
  if [[ $? -ne 0 ]]; then
    log_error "Failed to rollback deployment '$deployment' in namespace '$namespace'"
    return 1
  fi
  
  log_success "Successfully initiated rollback for deployment '$deployment' in namespace '$namespace'"
  return 0
}

# Wait for rollback to complete
wait_for_rollback() {
  local namespace=$1
  local deployment=$2
  local timeout=$3
  
  log_info "Waiting for rollback to complete for deployment '$deployment' in namespace '$namespace'"
  
  if ! kubectl rollout status deployment "$deployment" -n "$namespace" --timeout="${timeout}s"; then
    log_error "Rollback timed out for deployment '$deployment' in namespace '$namespace'"
    return 1
  fi
  
  log_success "Rollback completed successfully for deployment '$deployment' in namespace '$namespace'"
  return 0
}

# Update service selectors for blue-green deployments
update_service_selectors() {
  local namespace=$1
  local service=$2
  local deployment=$3
  
  log_info "Updating service selectors for service '$service' in namespace '$namespace'"
  
  # Get the current selector from the deployment
  local selector=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.selector.matchLabels}')
  
  # Update the service selector to match the deployment
  if ! kubectl patch service "$service" -n "$namespace" -p "{\"spec\":{\"selector\":$selector}}"; then
    log_error "Failed to update service selectors for service '$service' in namespace '$namespace'"
    return 1
  fi
  
  log_success "Successfully updated service selectors for service '$service' in namespace '$namespace'"
  return 0
}

# Scale resources during rollback for graceful transitions
scale_resources() {
  local namespace=$1
  local deployment=$2
  local scale_factor=${3:-1.5}  # Default to 1.5x scaling during rollback
  
  log_info "Scaling resources for deployment '$deployment' in namespace '$namespace'"
  
  # Get current replica count
  local current_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}')
  
  # Calculate new replica count (scale up during rollback for better availability)
  local new_replicas=$(echo "$current_replicas * $scale_factor" | bc | awk '{print int($1+0.5)}')
  
  # Scale the deployment
  if ! kubectl scale deployment "$deployment" -n "$namespace" --replicas="$new_replicas"; then
    log_error "Failed to scale deployment '$deployment' in namespace '$namespace'"
    return 1
  fi
  
  log_success "Successfully scaled deployment '$deployment' in namespace '$namespace' to $new_replicas replicas"
  return 0
}

# Verify health of the deployment after rollback
verify_deployment_health() {
  local namespace=$1
  local deployment=$2
  local timeout=$3
  local interval=$4
  
  log_info "Verifying health of deployment '$deployment' in namespace '$namespace'"
  
  local end_time=$(($(date +%s) + timeout))
  
  while [[ $(date +%s) -lt $end_time ]]; do
    # Check if all pods are ready
    local ready_pods=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
    local desired_pods=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.replicas}')
    
    if [[ "$ready_pods" == "$desired_pods" && -n "$ready_pods" && -n "$desired_pods" ]]; then
      log_success "Deployment '$deployment' in namespace '$namespace' is healthy ($ready_pods/$desired_pods pods ready)"
      return 0
    fi
    
    log_info "Waiting for deployment to become healthy: $ready_pods/$desired_pods pods ready"
    sleep "$interval"
  done
  
  log_error "Deployment health check timed out for '$deployment' in namespace '$namespace'"
  return 1
}

# Rollback ConfigMaps and Secrets if needed
rollback_config() {
  local namespace=$1
  local deployment=$2
  
  log_info "Checking for versioned ConfigMaps and Secrets for deployment '$deployment' in namespace '$namespace'"
  
  # Get the current ConfigMap and Secret names from the deployment
  local configmaps=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.volumes[*].configMap.name}')
  local secrets=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.volumes[*].secret.secretName}')
  
  # Add ConfigMaps from environment variables
  local env_configmaps=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.containers[*].envFrom[?(@.configMapRef)].configMapRef.name}')
  configmaps="$configmaps $env_configmaps"
  
  # Add Secrets from environment variables
  local env_secrets=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.containers[*].envFrom[?(@.secretRef)].secretRef.name}')
  secrets="$secrets $env_secrets"
  
  # Rollback ConfigMaps if they have previous versions
  for cm in $configmaps; do
    if [[ -n "$cm" ]]; then
      local prev_cm="${cm}-previous"
      if kubectl get configmap "$prev_cm" -n "$namespace" &> /dev/null; then
        log_info "Rolling back ConfigMap '$cm' to previous version"
        kubectl get configmap "$prev_cm" -n "$namespace" -o yaml | sed "s/name: $prev_cm/name: $cm/" | kubectl apply -f -
      fi
    fi
  done
  
  # Rollback Secrets if they have previous versions
  for secret in $secrets; do
    if [[ -n "$secret" ]]; then
      local prev_secret="${secret}-previous"
      if kubectl get secret "$prev_secret" -n "$namespace" &> /dev/null; then
        log_info "Rolling back Secret '$secret' to previous version"
        kubectl get secret "$prev_secret" -n "$namespace" -o yaml | sed "s/name: $prev_secret/name: $secret/" | kubectl apply -f -
      fi
    fi
  done
  
  return 0
}

# Restore HPA settings after rollback
restore_hpa() {
  local namespace=$1
  local deployment=$2
  
  log_info "Checking for HPA for deployment '$deployment' in namespace '$namespace'"
  
  # Check if HPA exists for this deployment
  if kubectl get hpa -n "$namespace" -l "app=$deployment" &> /dev/null; then
    log_info "Restoring HPA settings for deployment '$deployment' in namespace '$namespace'"
    
    # Get the HPA name
    local hpa_name=$(kubectl get hpa -n "$namespace" -l "app=$deployment" -o jsonpath='{.items[0].metadata.name}')
    
    # Restart the HPA by temporarily disabling and re-enabling it
    kubectl patch hpa "$hpa_name" -n "$namespace" -p '{"spec":{"minReplicas":0}}'
    sleep 2
    kubectl patch hpa "$hpa_name" -n "$namespace" -p '{"spec":{"minReplicas":3}}'
    
    log_success "Successfully restored HPA settings for deployment '$deployment' in namespace '$namespace'"
  else
    log_info "No HPA found for deployment '$deployment' in namespace '$namespace'"
  fi
  
  return 0
}

#############################################################################
# Main Script
#############################################################################

# Check if kubectl is available
check_kubectl

# Check if deployment exists
if ! check_deployment_exists "$NAMESPACE" "$DEPLOYMENT"; then
  exit 1
fi

# Get revision to rollback to if not specified
if [[ -z "$REVISION" ]]; then
  REVISION=$(get_previous_revision "$NAMESPACE" "$DEPLOYMENT")
  if [[ $? -ne 0 ]]; then
    log_error "Failed to determine previous revision. Please specify a revision with -r or --revision"
    exit 1
  fi
  log_info "Using previous revision: $REVISION"
fi

# Start the rollback process
log_section "Starting Kubernetes rollback for $DEPLOYMENT in namespace $NAMESPACE"

# Rollback ConfigMaps and Secrets if needed
rollback_config "$NAMESPACE" "$DEPLOYMENT"

# Scale up resources for graceful transition
if [[ "$DEPLOYMENT_TYPE" == "canary" ]]; then
  scale_resources "$NAMESPACE" "$DEPLOYMENT"
fi

# Perform the rollback
if ! rollback_deployment "$NAMESPACE" "$DEPLOYMENT" "$REVISION"; then
  log_error "Rollback failed. Exiting."
  exit 1
fi

# Wait for rollback to complete
if ! wait_for_rollback "$NAMESPACE" "$DEPLOYMENT" "$TIMEOUT"; then
  log_error "Rollback did not complete successfully within timeout period"
  exit 1
fi

# Update service selectors for blue-green deployments
if [[ "$DEPLOYMENT_TYPE" == "bluegreen" && -n "$SERVICE" ]]; then
  if ! update_service_selectors "$NAMESPACE" "$SERVICE" "$DEPLOYMENT"; then
    log_error "Failed to update service selectors. Traffic may not be properly redirected."
    # Continue anyway, as the deployment itself has been rolled back
  fi
fi

# Verify health after rollback if requested
if [[ "$VERIFY_HEALTH" == "true" ]]; then
  if ! verify_deployment_health "$NAMESPACE" "$DEPLOYMENT" "$TIMEOUT" "$HEALTH_CHECK_INTERVAL"; then
    log_error "Deployment health check failed after rollback"
    exit 1
  fi
fi

# Restore HPA settings
restore_hpa "$NAMESPACE" "$DEPLOYMENT"

log_success "Rollback completed successfully for deployment '$DEPLOYMENT' in namespace '$NAMESPACE'"
exit 0