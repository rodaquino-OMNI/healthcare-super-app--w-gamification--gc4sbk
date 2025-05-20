#!/bin/bash

#############################################################################
# promote-to-production.sh
#
# Controls promotion from staging to production with manual approval gates,
# creates deployment plan for review, provisions resources via Terraform,
# executes appropriate deployment strategy based on service type (canary for
# journeys, blue-green for API Gateway), and performs phased rollout with
# validation between phases.
#
# Usage: ./promote-to-production.sh [service_name] [version] [--force] [--skip-cab]
#
# Arguments:
#   service_name - Name of the service to deploy (e.g., api-gateway, health-service)
#   version      - Version/tag to deploy
#   --force      - Skip approval prompt (requires PROMOTION_APPROVAL_TOKEN)
#   --skip-cab   - Skip Change Advisory Board review (for emergency fixes only)
#
# Environment Variables:
#   PROMOTION_APPROVAL_TOKEN - Token for automated approval (CI/CD use only)
#   CAB_REVIEW_REQUIRED      - Set to "true" to enforce CAB review
#   TERRAFORM_AUTO_APPROVE   - Set to "true" to skip Terraform plan approval
#
# Exit Codes:
#   0 - Success
#   1 - Invalid arguments
#   2 - Approval rejected
#   3 - CAB review required but skipped without authorization
#   4 - Terraform provisioning failed
#   5 - Deployment failed
#   6 - Validation failed
#   7 - Rollback failed
#############################################################################

# Source common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh" 2>/dev/null || { echo "Error: config.sh not found"; exit 1; }
source "${SCRIPT_DIR}/common.sh" 2>/dev/null || { echo "Error: common.sh not found"; exit 1; }

# Default values
FORCE_APPROVAL=false
SKIP_CAB=false
DEPLOYMENT_PLAN_FILE="deployment-plan-$(date +%Y%m%d-%H%M%S).yaml"
TERRAFORM_DIR="${SCRIPT_DIR}/../../terraform"

# ANSI color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

#############################################################################
# Function: display_usage
# Description: Displays the script usage information
#############################################################################
display_usage() {
    echo -e "${CYAN}Usage:${NC} ./promote-to-production.sh [service_name] [version] [--force] [--skip-cab]"
    echo ""
    echo -e "${CYAN}Arguments:${NC}"
    echo "  service_name - Name of the service to deploy (e.g., api-gateway, health-service)"
    echo "  version      - Version/tag to deploy"
    echo "  --force      - Skip approval prompt (requires PROMOTION_APPROVAL_TOKEN)"
    echo "  --skip-cab   - Skip Change Advisory Board review (for emergency fixes only)"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  ./promote-to-production.sh api-gateway v1.2.3"
    echo "  ./promote-to-production.sh health-service v2.0.0 --force"
    echo "  ./promote-to-production.sh all v1.5.0"
}

#############################################################################
# Function: log_message
# Description: Logs a message with timestamp and level
# Arguments:
#   $1 - Log level (INFO, WARNING, ERROR, SUCCESS)
#   $2 - Message to log
#############################################################################
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case "${level}" in
        "INFO")
            echo -e "${BLUE}[${timestamp}] [INFO]${NC} ${message}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] [WARNING]${NC} ${message}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] [ERROR]${NC} ${message}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] [SUCCESS]${NC} ${message}"
            ;;
        *)
            echo -e "[${timestamp}] [${level}] ${message}"
            ;;
    esac
}

#############################################################################
# Function: check_prerequisites
# Description: Checks if all required tools and files are available
#############################################################################
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Check for required tools
    for cmd in kubectl terraform aws jq curl; do
        if ! command -v "${cmd}" &> /dev/null; then
            log_message "ERROR" "Required command not found: ${cmd}"
            return 1
        fi
    done
    
    # Check for required script files
    for script in "${SCRIPT_DIR}/validate-deployment.sh" "${SCRIPT_DIR}/canary-deploy.sh" "${SCRIPT_DIR}/blue-green-deploy.sh" "${SCRIPT_DIR}/rollback.sh"; do
        if [ ! -f "${script}" ]; then
            log_message "ERROR" "Required script not found: ${script}"
            return 1
        fi
    done
    
    # Check for Kubernetes connection
    if ! kubectl get nodes &> /dev/null; then
        log_message "ERROR" "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    log_message "SUCCESS" "All prerequisites satisfied"
    return 0
}

#############################################################################
# Function: get_service_type
# Description: Determines the type of service for deployment strategy selection
# Arguments:
#   $1 - Service name
# Returns:
#   Service type (api-gateway, journey-service, data-service)
#############################################################################
get_service_type() {
    local service_name="$1"
    
    case "${service_name}" in
        "api-gateway")
            echo "api-gateway"
            ;;
        "health-service"|"care-service"|"plan-service")
            echo "journey-service"
            ;;
        "auth-service"|"notification-service"|"gamification-engine")
            echo "core-service"
            ;;
        *)
            # Default to journey-service for unknown services
            echo "journey-service"
            ;;
    esac
}

#############################################################################
# Function: check_change_significance
# Description: Determines if changes require Change Advisory Board review
# Arguments:
#   $1 - Service name
#   $2 - Version
# Returns:
#   0 - Changes are significant (CAB review required)
#   1 - Changes are not significant (CAB review not required)
#############################################################################
check_change_significance() {
    local service_name="$1"
    local version="$2"
    local current_version
    
    log_message "INFO" "Checking significance of changes for ${service_name} ${version}..."
    
    # Get current version from production
    current_version=$(kubectl get deployment -n production "${service_name}" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null | awk -F: '{print $2}')
    
    if [ -z "${current_version}" ]; then
        # New service deployment is always significant
        log_message "INFO" "New service deployment detected - CAB review required"
        return 0
    fi
    
    # Check for major or minor version changes (assuming semver)
    local current_major=$(echo "${current_version}" | sed -E 's/v?([0-9]+)\..*/\1/')
    local current_minor=$(echo "${current_version}" | sed -E 's/v?[0-9]+\.([0-9]+).*/\1/')
    local new_major=$(echo "${version}" | sed -E 's/v?([0-9]+)\..*/\1/')
    local new_minor=$(echo "${version}" | sed -E 's/v?[0-9]+\.([0-9]+).*/\1/')
    
    if [ "${current_major}" != "${new_major}" ] || [ "${current_minor}" != "${new_minor}" ]; then
        log_message "INFO" "Major or minor version change detected - CAB review required"
        return 0
    fi
    
    # Check for database migrations
    if [ -d "${TERRAFORM_DIR}/${service_name}/migrations" ]; then
        log_message "INFO" "Service contains database migrations - CAB review required"
        return 0
    fi
    
    # Check for infrastructure changes
    if [ -d "${TERRAFORM_DIR}/${service_name}" ]; then
        terraform -chdir="${TERRAFORM_DIR}/${service_name}" init -backend=false -input=false &>/dev/null
        terraform -chdir="${TERRAFORM_DIR}/${service_name}" plan -detailed-exitcode -out=tfplan &>/dev/null
        local tf_exit_code=$?
        
        if [ ${tf_exit_code} -eq 2 ]; then
            log_message "INFO" "Infrastructure changes detected - CAB review required"
            return 0
        fi
    fi
    
    log_message "INFO" "Changes are not significant - CAB review not required"
    return 1
}

#############################################################################
# Function: get_approval
# Description: Gets manual approval for production deployment
# Arguments:
#   $1 - Service name
#   $2 - Version
# Returns:
#   0 - Approved
#   1 - Rejected
#############################################################################
get_approval() {
    local service_name="$1"
    local version="$2"
    
    if [ "${FORCE_APPROVAL}" = true ]; then
        if [ -n "${PROMOTION_APPROVAL_TOKEN}" ]; then
            log_message "INFO" "Automated approval via PROMOTION_APPROVAL_TOKEN"
            return 0
        else
            log_message "ERROR" "Force approval requested but PROMOTION_APPROVAL_TOKEN not set"
            return 1
        fi
    fi
    
    echo -e "\n${YELLOW}=======================================================================${NC}"
    echo -e "${YELLOW}                     PRODUCTION DEPLOYMENT APPROVAL${NC}"
    echo -e "${YELLOW}=======================================================================${NC}"
    echo -e "\n${CYAN}Service:${NC} ${service_name}"
    echo -e "${CYAN}Version:${NC} ${version}"
    echo -e "${CYAN}Timestamp:${NC} $(date)"
    echo -e "${CYAN}Requested by:${NC} $(whoami)@$(hostname)"
    echo -e "\n${YELLOW}This will deploy to PRODUCTION environment. Please confirm.${NC}"
    echo -e "${YELLOW}Type 'yes' to approve or anything else to cancel:${NC} "
    
    read -r approval_response
    
    if [ "${approval_response}" = "yes" ]; then
        log_message "SUCCESS" "Deployment approved by user"
        return 0
    else
        log_message "WARNING" "Deployment rejected by user"
        return 1
    fi
}

#############################################################################
# Function: get_cab_approval
# Description: Gets Change Advisory Board approval for significant changes
# Arguments:
#   $1 - Service name
#   $2 - Version
#   $3 - Deployment plan file
# Returns:
#   0 - Approved
#   1 - Rejected
#############################################################################
get_cab_approval() {
    local service_name="$1"
    local version="$2"
    local plan_file="$3"
    
    if [ "${SKIP_CAB}" = true ]; then
        log_message "WARNING" "Change Advisory Board review skipped (--skip-cab)"
        return 0
    fi
    
    echo -e "\n${MAGENTA}=======================================================================${NC}"
    echo -e "${MAGENTA}                 CHANGE ADVISORY BOARD REVIEW REQUIRED${NC}"
    echo -e "${MAGENTA}=======================================================================${NC}"
    echo -e "\n${CYAN}Service:${NC} ${service_name}"
    echo -e "${CYAN}Version:${NC} ${version}"
    echo -e "${CYAN}Deployment Plan:${NC} ${plan_file}"
    echo -e "\n${MAGENTA}This deployment requires Change Advisory Board approval.${NC}"
    echo -e "${MAGENTA}Please submit the deployment plan for review and enter the approval ID:${NC} "
    
    read -r cab_approval_id
    
    if [ -n "${cab_approval_id}" ]; then
        log_message "SUCCESS" "CAB Approval received: ${cab_approval_id}"
        echo "${cab_approval_id}" > "cab-approval-${service_name}-${version}.txt"
        return 0
    else
        log_message "WARNING" "CAB Approval not provided"
        return 1
    fi
}

#############################################################################
# Function: create_deployment_plan
# Description: Creates a deployment plan for review
# Arguments:
#   $1 - Service name
#   $2 - Version
#   $3 - Output file
# Returns:
#   0 - Success
#   1 - Failure
#############################################################################
create_deployment_plan() {
    local service_name="$1"
    local version="$2"
    local output_file="$3"
    local service_type
    
    log_message "INFO" "Creating deployment plan for ${service_name} ${version}..."
    
    service_type=$(get_service_type "${service_name}")
    
    # Create deployment plan YAML
    cat > "${output_file}" << EOF
---
deploymentPlan:
  service:
    name: "${service_name}"
    type: "${service_type}"
    version: "${version}"
  timestamp: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  requestedBy: "$(whoami)@$(hostname)"
  deploymentStrategy: "$([ "${service_type}" = "api-gateway" ] && echo "blue-green" || echo "canary")"
  rollbackStrategy: "automatic"
  validationStrategy: "phased"
  phases:
$(if [ "${service_type}" = "api-gateway" ]; then
cat << 'BLUEGREEN'
    - name: "provision"
      description: "Provision new environment"
      actions:
        - "Apply Terraform configuration"
        - "Deploy new version to green environment"
        - "Verify green environment health"
    - name: "validation"
      description: "Validate new environment"
      actions:
        - "Run smoke tests"
        - "Verify API endpoints"
        - "Check authentication flows"
        - "Validate integration points"
    - name: "cutover"
      description: "Switch traffic to new environment"
      actions:
        - "Update service selectors"
        - "Verify traffic routing"
        - "Monitor for errors"
    - name: "cleanup"
      description: "Clean up old environment"
      actions:
        - "Drain connections from old environment"
        - "Scale down old deployment"
        - "Archive logs and metrics"
BLUEGREEN
else
cat << 'CANARY'
    - name: "initial"
      description: "Initial deployment"
      trafficPercentage: 10
      actions:
        - "Deploy new version"
        - "Route ${CANARY_INITIAL_PERCENT}% traffic"
        - "Verify health and metrics"
    - name: "secondary"
      description: "Increase traffic"
      trafficPercentage: 30
      actions:
        - "Increase traffic to ${CANARY_SECONDARY_PERCENT}%"
        - "Verify performance metrics"
        - "Check error rates"
    - name: "majority"
      description: "Majority traffic"
      trafficPercentage: 60
      actions:
        - "Increase traffic to ${CANARY_MAJORITY_PERCENT}%"
        - "Verify system stability"
        - "Monitor user experience"
    - name: "complete"
      description: "Complete migration"
      trafficPercentage: 100
      actions:
        - "Migrate remaining traffic"
        - "Verify full deployment"
        - "Scale down old version"
CANARY
fi)
  resources:
    - type: "kubernetes"
      kind: "Deployment"
      name: "${service_name}"
    - type: "kubernetes"
      kind: "Service"
      name: "${service_name}"
$(if [ -d "${TERRAFORM_DIR}/${service_name}" ]; then
echo "    - type: \"terraform\""
echo "      directory: \"${TERRAFORM_DIR}/${service_name}\""
fi)
  validationCriteria:
    - "Health check endpoints return 200 OK"
    - "Error rate below 0.1%"
    - "Response time within SLA"
    - "CPU and memory usage within limits"
    - "All integration points responsive"
  rollbackCriteria:
    - "Error rate exceeds 1%"
    - "Health checks fail for 3 consecutive minutes"
    - "Response time exceeds SLA for 5 minutes"
    - "Critical user journey failures detected"
  approvals:
    required:
      - "Deployment Engineer"
      - "Service Owner"
$(if check_change_significance "${service_name}" "${version}"; then
echo "      - \"Change Advisory Board\""
fi)
    obtained: []
  notes: |
    Deployment plan for ${service_name} version ${version} to production environment.
    Generated on $(date) by $(whoami).
    
    Please review carefully before approval.
EOF

    if [ -f "${output_file}" ]; then
        log_message "SUCCESS" "Deployment plan created: ${output_file}"
        return 0
    else
        log_message "ERROR" "Failed to create deployment plan"
        return 1
    fi
}

#############################################################################
# Function: provision_resources
# Description: Provisions resources via Terraform if needed
# Arguments:
#   $1 - Service name
# Returns:
#   0 - Success
#   1 - Failure
#############################################################################
provision_resources() {
    local service_name="$1"
    local tf_dir="${TERRAFORM_DIR}/${service_name}"
    
    if [ ! -d "${tf_dir}" ]; then
        log_message "INFO" "No Terraform configuration found for ${service_name}, skipping provisioning"
        return 0
    fi
    
    log_message "INFO" "Provisioning resources for ${service_name}..."
    
    # Initialize Terraform
    log_message "INFO" "Initializing Terraform..."
    terraform -chdir="${tf_dir}" init -input=false
    if [ $? -ne 0 ]; then
        log_message "ERROR" "Terraform initialization failed"
        return 1
    fi
    
    # Create Terraform plan
    log_message "INFO" "Creating Terraform plan..."
    terraform -chdir="${tf_dir}" plan -out=tfplan -input=false
    if [ $? -ne 0 ]; then
        log_message "ERROR" "Terraform plan creation failed"
        return 1
    fi
    
    # Apply Terraform plan
    log_message "INFO" "Applying Terraform plan..."
    
    if [ "${TERRAFORM_AUTO_APPROVE}" = "true" ]; then
        terraform -chdir="${tf_dir}" apply -input=false -auto-approve tfplan
    else
        echo -e "\n${YELLOW}=======================================================================${NC}"
        echo -e "${YELLOW}                     TERRAFORM PLAN APPROVAL${NC}"
        echo -e "${YELLOW}=======================================================================${NC}"
        echo -e "\n${YELLOW}Review the Terraform plan above and confirm application.${NC}"
        echo -e "${YELLOW}Type 'yes' to approve or anything else to cancel:${NC} "
        
        read -r tf_approval
        
        if [ "${tf_approval}" = "yes" ]; then
            terraform -chdir="${tf_dir}" apply -input=false tfplan
        else
            log_message "WARNING" "Terraform apply cancelled by user"
            return 1
        fi
    fi
    
    if [ $? -ne 0 ]; then
        log_message "ERROR" "Terraform apply failed"
        return 1
    fi
    
    log_message "SUCCESS" "Resources provisioned successfully"
    return 0
}

#############################################################################
# Function: deploy_service
# Description: Deploys service using appropriate strategy
# Arguments:
#   $1 - Service name
#   $2 - Version
# Returns:
#   0 - Success
#   1 - Failure
#############################################################################
deploy_service() {
    local service_name="$1"
    local version="$2"
    local service_type
    local deploy_result
    
    service_type=$(get_service_type "${service_name}")
    
    log_message "INFO" "Deploying ${service_name} ${version} using ${service_type} strategy..."
    
    case "${service_type}" in
        "api-gateway")
            log_message "INFO" "Using blue-green deployment strategy"
            "${SCRIPT_DIR}/blue-green-deploy.sh" "${service_name}" "${version}"
            deploy_result=$?
            ;;
        "journey-service"|"core-service")
            log_message "INFO" "Using canary deployment strategy"
            "${SCRIPT_DIR}/canary-deploy.sh" "${service_name}" "${version}"
            deploy_result=$?
            ;;
        *)
            log_message "ERROR" "Unknown service type: ${service_type}"
            return 1
            ;;
    esac
    
    if [ ${deploy_result} -ne 0 ]; then
        log_message "ERROR" "Deployment failed with exit code ${deploy_result}"
        return 1
    fi
    
    log_message "SUCCESS" "Deployment completed successfully"
    return 0
}

#############################################################################
# Function: validate_deployment
# Description: Validates deployment success
# Arguments:
#   $1 - Service name
#   $2 - Version
# Returns:
#   0 - Success
#   1 - Failure
#############################################################################
validate_deployment() {
    local service_name="$1"
    local version="$2"
    
    log_message "INFO" "Validating deployment of ${service_name} ${version}..."
    
    "${SCRIPT_DIR}/validate-deployment.sh" "${service_name}" "production"
    local validation_result=$?
    
    if [ ${validation_result} -ne 0 ]; then
        log_message "ERROR" "Validation failed with exit code ${validation_result}"
        return 1
    fi
    
    log_message "SUCCESS" "Validation completed successfully"
    return 0
}

#############################################################################
# Function: handle_rollback
# Description: Handles rollback if deployment fails
# Arguments:
#   $1 - Service name
#   $2 - Version
#   $3 - Failure reason
# Returns:
#   0 - Success
#   1 - Failure
#############################################################################
handle_rollback() {
    local service_name="$1"
    local version="$2"
    local reason="$3"
    
    log_message "WARNING" "Initiating rollback for ${service_name} ${version}: ${reason}"
    
    "${SCRIPT_DIR}/rollback.sh" "${service_name}" "production" "${reason}"
    local rollback_result=$?
    
    if [ ${rollback_result} -ne 0 ]; then
        log_message "ERROR" "Rollback failed with exit code ${rollback_result}"
        return 1
    fi
    
    log_message "SUCCESS" "Rollback completed successfully"
    return 0
}

#############################################################################
# Function: notify_stakeholders
# Description: Notifies stakeholders of deployment status
# Arguments:
#   $1 - Service name
#   $2 - Version
#   $3 - Status (success/failure)
#   $4 - Additional message (optional)
#############################################################################
notify_stakeholders() {
    local service_name="$1"
    local version="$2"
    local status="$3"
    local message="$4"
    
    log_message "INFO" "Notifying stakeholders of deployment status: ${status}"
    
    # This is a placeholder for actual notification logic
    # In a real implementation, this would send emails, Slack messages, etc.
    
    echo -e "\n${CYAN}=======================================================================${NC}"
    echo -e "${CYAN}                     DEPLOYMENT NOTIFICATION${NC}"
    echo -e "${CYAN}=======================================================================${NC}"
    echo -e "\n${CYAN}Service:${NC} ${service_name}"
    echo -e "${CYAN}Version:${NC} ${version}"
    echo -e "${CYAN}Status:${NC} ${status}"
    echo -e "${CYAN}Timestamp:${NC} $(date)"
    
    if [ -n "${message}" ]; then
        echo -e "${CYAN}Message:${NC} ${message}"
    fi
    
    echo -e "\n${CYAN}This notification would be sent to all stakeholders.${NC}"
}

#############################################################################
# Main script execution
#############################################################################

# Parse command line arguments
if [ $# -lt 2 ]; then
    display_usage
    exit 1
fi

SERVICE_NAME="$1"
VERSION="$2"
shift 2

# Parse optional arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --force)
            FORCE_APPROVAL=true
            ;;
        --skip-cab)
            SKIP_CAB=true
            ;;
        --help)
            display_usage
            exit 0
            ;;
        *)
            log_message "ERROR" "Unknown option: $1"
            display_usage
            exit 1
            ;;
    esac
    shift
done

# Check prerequisites
if ! check_prerequisites; then
    log_message "ERROR" "Prerequisites check failed"
    exit 1
fi

# Create deployment plan
if ! create_deployment_plan "${SERVICE_NAME}" "${VERSION}" "${DEPLOYMENT_PLAN_FILE}"; then
    log_message "ERROR" "Failed to create deployment plan"
    exit 1
fi

# Check if changes are significant and require CAB review
if check_change_significance "${SERVICE_NAME}" "${VERSION}"; then
    CAB_REVIEW_REQUIRED="true"
    log_message "INFO" "Changes are significant - CAB review required"
else
    CAB_REVIEW_REQUIRED="false"
    log_message "INFO" "Changes are not significant - CAB review not required"
fi

# Get approval for production deployment
if ! get_approval "${SERVICE_NAME}" "${VERSION}"; then
    log_message "ERROR" "Deployment not approved"
    exit 2
fi

# Get CAB approval if required
if [ "${CAB_REVIEW_REQUIRED}" = "true" ]; then
    if ! get_cab_approval "${SERVICE_NAME}" "${VERSION}" "${DEPLOYMENT_PLAN_FILE}"; then
        log_message "ERROR" "CAB approval not received"
        exit 3
    fi
fi

# Provision resources if needed
if ! provision_resources "${SERVICE_NAME}"; then
    log_message "ERROR" "Resource provisioning failed"
    exit 4
fi

# Deploy service using appropriate strategy
if ! deploy_service "${SERVICE_NAME}" "${VERSION}"; then
    log_message "ERROR" "Deployment failed"
    if ! handle_rollback "${SERVICE_NAME}" "${VERSION}" "Deployment failure"; then
        log_message "ERROR" "Rollback also failed - manual intervention required"
        notify_stakeholders "${SERVICE_NAME}" "${VERSION}" "CRITICAL FAILURE" "Deployment and rollback both failed - manual intervention required"
        exit 7
    fi
    notify_stakeholders "${SERVICE_NAME}" "${VERSION}" "FAILURE" "Deployment failed, rollback successful"
    exit 5
fi

# Validate deployment
if ! validate_deployment "${SERVICE_NAME}" "${VERSION}"; then
    log_message "ERROR" "Validation failed"
    if ! handle_rollback "${SERVICE_NAME}" "${VERSION}" "Validation failure"; then
        log_message "ERROR" "Rollback also failed - manual intervention required"
        notify_stakeholders "${SERVICE_NAME}" "${VERSION}" "CRITICAL FAILURE" "Validation and rollback both failed - manual intervention required"
        exit 7
    fi
    notify_stakeholders "${SERVICE_NAME}" "${VERSION}" "FAILURE" "Validation failed, rollback successful"
    exit 6
fi

# Deployment successful
log_message "SUCCESS" "${SERVICE_NAME} ${VERSION} successfully deployed to production"
notify_stakeholders "${SERVICE_NAME}" "${VERSION}" "SUCCESS" "Deployment completed successfully"

exit 0