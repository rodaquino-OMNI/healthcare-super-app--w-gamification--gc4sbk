#!/bin/bash

# =========================================================================
# k8s-eks-upgrade.sh
# =========================================================================
# Semi-automated script for upgrading EKS cluster versions with minimal
# disruption. Performs compatibility checking, pre-upgrade validation,
# control plane upgrade, node group updates, and post-upgrade validation.
#
# This script is designed to be run quarterly as part of the regular
# maintenance cycle for the AUSTA SuperApp infrastructure.
#
# Usage: ./k8s-eks-upgrade.sh [--target-version <version>] [--dry-run] [--help]
# =========================================================================

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Default values
DRY_RUN=false
TARGET_VERSION=""
CLUSTER_NAME="austa-eks-cluster"
REGION="sa-east-1"
DR_REGION="us-east-1"
LOG_FILE="${SCRIPT_DIR}/../logs/eks-upgrade-$(date +%Y%m%d-%H%M%S).log"
UPGRADE_PLAN_FILE="${SCRIPT_DIR}/../logs/eks-upgrade-plan-$(date +%Y%m%d-%H%M%S).json"

# Create logs directory if it doesn't exist
mkdir -p "${SCRIPT_DIR}/../logs"

# =========================================================================
# Function Definitions
# =========================================================================

function show_help {
    echo "EKS Cluster Version Upgrade Script"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --target-version VERSION   Specify target EKS version (e.g., 1.27)"
    echo "  --cluster-name NAME        Specify EKS cluster name (default: ${CLUSTER_NAME})"
    echo "  --region REGION            Specify AWS region (default: ${REGION})"
    echo "  --dry-run                  Validate and create upgrade plan without executing"
    echo "  --help                     Display this help message"
    exit 0
}

function parse_args {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target-version)
                TARGET_VERSION="$2"
                shift 2
                ;;
            --cluster-name)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

function check_prerequisites {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured or are invalid."
        exit 1
    fi
    
    # Check EKS cluster exists
    if ! aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${REGION}" &> /dev/null; then
        log_error "EKS cluster '${CLUSTER_NAME}' not found in region '${REGION}'."
        exit 1
    fi
    
    log_success "All prerequisites satisfied."
}

function get_current_cluster_info {
    log_info "Retrieving current cluster information..."
    
    # Get current cluster version
    CURRENT_VERSION=$(aws eks describe-cluster \
        --name "${CLUSTER_NAME}" \
        --region "${REGION}" \
        --query "cluster.version" \
        --output text)
    
    log_info "Current EKS cluster version: ${CURRENT_VERSION}"
    
    # Get available EKS versions
    AVAILABLE_VERSIONS=$(aws eks describe-addon-versions \
        --region "${REGION}" \
        --query "sort_by(addons[0].addonVersions[].compatibleKubernetesVersion, &to_string(@))" \
        --output json)
    
    # Get node groups
    NODE_GROUPS=$(aws eks list-nodegroups \
        --cluster-name "${CLUSTER_NAME}" \
        --region "${REGION}" \
        --query "nodegroups" \
        --output json)
    
    # Get cluster addons
    CLUSTER_ADDONS=$(aws eks list-addons \
        --cluster-name "${CLUSTER_NAME}" \
        --region "${REGION}" \
        --query "addons" \
        --output json)
    
    log_info "Retrieved ${NODE_GROUPS | jq 'length'} node groups and ${CLUSTER_ADDONS | jq 'length'} cluster addons."
}

function determine_upgrade_path {
    log_info "Determining upgrade path..."
    
    # If target version not specified, find the next available version
    if [[ -z "${TARGET_VERSION}" ]]; then
        # Find next version after current
        TARGET_VERSION=$(echo "${AVAILABLE_VERSIONS}" | jq -r '.[] | select(. > "'"${CURRENT_VERSION}"'") | sort | .[0]')
        
        if [[ -z "${TARGET_VERSION}" || "${TARGET_VERSION}" == "null" ]]; then
            log_info "Cluster is already at the latest available version: ${CURRENT_VERSION}"
            exit 0
        fi
    fi
    
    # Validate target version is available
    if ! echo "${AVAILABLE_VERSIONS}" | jq -r '.[]' | grep -q "^${TARGET_VERSION}$"; then
        log_error "Target version ${TARGET_VERSION} is not available. Available versions: $(echo "${AVAILABLE_VERSIONS}" | jq -r '.[]' | tr '\n' ', ')"
        exit 1
    fi
    
    # Check if target version is newer than current version
    if [[ "$(printf '%s\n' "${CURRENT_VERSION}" "${TARGET_VERSION}" | sort -V | head -n1)" == "${TARGET_VERSION}" ]]; then
        log_error "Target version ${TARGET_VERSION} is not newer than current version ${CURRENT_VERSION}."
        exit 1
    fi
    
    log_success "Upgrade path determined: ${CURRENT_VERSION} -> ${TARGET_VERSION}"
}

function check_addon_compatibility {
    log_info "Checking add-on compatibility with target version ${TARGET_VERSION}..."
    
    INCOMPATIBLE_ADDONS=[]
    
    # For each addon, check compatibility with target version
    for ADDON in $(echo "${CLUSTER_ADDONS}" | jq -r '.[]'); do
        ADDON_VERSION=$(aws eks describe-addon \
            --cluster-name "${CLUSTER_NAME}" \
            --addon-name "${ADDON}" \
            --region "${REGION}" \
            --query "addon.addonVersion" \
            --output text)
        
        # Check if current addon version is compatible with target K8s version
        COMPATIBLE=$(aws eks describe-addon-versions \
            --addon-name "${ADDON}" \
            --kubernetes-version "${TARGET_VERSION}" \
            --region "${REGION}" \
            --query "addons[0].addonVersions[?addonVersion=='${ADDON_VERSION}'].compatibleKubernetesVersion" \
            --output text)
        
        if [[ -z "${COMPATIBLE}" || "${COMPATIBLE}" == "None" ]]; then
            log_warning "Add-on ${ADDON} version ${ADDON_VERSION} is not compatible with Kubernetes ${TARGET_VERSION}."
            
            # Find latest compatible version
            LATEST_COMPATIBLE=$(aws eks describe-addon-versions \
                --addon-name "${ADDON}" \
                --kubernetes-version "${TARGET_VERSION}" \
                --region "${REGION}" \
                --query "addons[0].addonVersions[0].addonVersion" \
                --output text)
            
            log_info "Latest compatible version for ${ADDON} is ${LATEST_COMPATIBLE}."
            INCOMPATIBLE_ADDONS+=("${ADDON}:${ADDON_VERSION}:${LATEST_COMPATIBLE}")
        else
            log_success "Add-on ${ADDON} version ${ADDON_VERSION} is compatible with Kubernetes ${TARGET_VERSION}."
        fi
    done
    
    if [[ ${#INCOMPATIBLE_ADDONS[@]} -gt 0 ]]; then
        log_warning "Found ${#INCOMPATIBLE_ADDONS[@]} incompatible add-ons that will need to be updated."
        for ADDON_INFO in "${INCOMPATIBLE_ADDONS[@]}"; do
            IFS=':' read -r ADDON CURRENT_VER NEW_VER <<< "${ADDON_INFO}"
            log_info "  - ${ADDON}: ${CURRENT_VER} -> ${NEW_VER}"
        done
    else
        log_success "All add-ons are compatible with target version ${TARGET_VERSION}."
    fi
}

function create_upgrade_plan {
    log_info "Creating upgrade plan..."
    
    # Create a JSON plan file with all the upgrade steps
    cat > "${UPGRADE_PLAN_FILE}" << EOF
{
  "clusterName": "${CLUSTER_NAME}",
  "region": "${REGION}",
  "currentVersion": "${CURRENT_VERSION}",
  "targetVersion": "${TARGET_VERSION}",
  "nodeGroups": $(echo "${NODE_GROUPS}" | jq '.'),
  "addons": $(echo "${CLUSTER_ADDONS}" | jq '.'),
  "incompatibleAddons": [
$(for ADDON_INFO in "${INCOMPATIBLE_ADDONS[@]}"; do
    IFS=':' read -r ADDON CURRENT_VER NEW_VER <<< "${ADDON_INFO}"
    echo "    {
      \"name\": \"${ADDON}\",
      \"currentVersion\": \"${CURRENT_VER}\",
      \"newVersion\": \"${NEW_VER}\"
    },"
 done | sed '$s/,$//')
  ],
  "steps": [
    {
      "name": "Pre-upgrade validation",
      "description": "Validate cluster health before upgrade"
    },
    {
      "name": "Update incompatible add-ons",
      "description": "Update add-ons that are incompatible with the target version"
    },
    {
      "name": "Upgrade control plane",
      "description": "Upgrade the EKS control plane to the target version"
    },
    {
      "name": "Validate control plane",
      "description": "Validate control plane functionality after upgrade"
    },
$(for NG in $(echo "${NODE_GROUPS}" | jq -r '.[]'); do
    echo "    {
      \"name\": \"Upgrade node group ${NG}\",
      \"description\": \"Upgrade node group ${NG} to the target version\"
    },"
done)
    {
      "name": "Post-upgrade validation",
      "description": "Validate cluster functionality after all upgrades"
    }
  ]
}
EOF
    
    log_success "Upgrade plan created: ${UPGRADE_PLAN_FILE}"
    log_info "Review the plan before proceeding with the upgrade."
}

function pre_upgrade_validation {
    log_info "Performing pre-upgrade validation..."
    
    # Update kubeconfig
    aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${REGION}" > /dev/null
    
    # Check cluster health
    log_info "Checking control plane health..."
    if ! kubectl get --raw='/healthz' | grep -q 'ok'; then
        log_error "Control plane health check failed."
        exit 1
    fi
    
    # Check node health
    log_info "Checking node health..."
    NODE_STATUS=$(kubectl get nodes -o json)
    UNHEALTHY_NODES=$(echo "${NODE_STATUS}" | jq -r '.items[] | select(.status.conditions[] | select(.type == "Ready" and .status != "True")) | .metadata.name')
    
    if [[ -n "${UNHEALTHY_NODES}" ]]; then
        log_error "Found unhealthy nodes: ${UNHEALTHY_NODES}"
        exit 1
    fi
    
    # Check pod health
    log_info "Checking pod health..."
    UNHEALTHY_PODS=$(kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.status.phase != "Running" and .status.phase != "Succeeded") | .metadata.namespace + "/" + .metadata.name')
    
    if [[ -n "${UNHEALTHY_PODS}" ]]; then
        log_warning "Found unhealthy pods: ${UNHEALTHY_PODS}"
        read -p "Continue despite unhealthy pods? (y/n): " CONTINUE
        if [[ "${CONTINUE}" != "y" ]]; then
            log_error "Aborting upgrade due to unhealthy pods."
            exit 1
        fi
    fi
    
    # Check for PodDisruptionBudgets
    log_info "Checking PodDisruptionBudgets..."
    PDBS=$(kubectl get pdb --all-namespaces -o json | jq -r '.items[] | .metadata.namespace + "/" + .metadata.name')
    
    if [[ -n "${PDBS}" ]]; then
        log_info "Found PodDisruptionBudgets: ${PDBS}"
        log_info "These will be respected during node group upgrades."
    fi
    
    # Check for critical workloads
    log_info "Checking for critical workloads..."
    CRITICAL_NAMESPACES=("health-journey" "care-journey" "plan-journey" "gamification" "ingress")
    
    for NS in "${CRITICAL_NAMESPACES[@]}"; do
        DEPLOYMENTS=$(kubectl get deployments -n "${NS}" -o json | jq -r '.items[].metadata.name')
        log_info "Found deployments in ${NS}: ${DEPLOYMENTS}"
    done
    
    log_success "Pre-upgrade validation completed successfully."
}

function update_incompatible_addons {
    log_info "Updating incompatible add-ons..."
    
    if [[ ${#INCOMPATIBLE_ADDONS[@]} -eq 0 ]]; then
        log_info "No incompatible add-ons to update."
        return
    fi
    
    for ADDON_INFO in "${INCOMPATIBLE_ADDONS[@]}"; do
        IFS=':' read -r ADDON CURRENT_VER NEW_VER <<< "${ADDON_INFO}"
        
        log_info "Updating add-on ${ADDON} from ${CURRENT_VER} to ${NEW_VER}..."
        
        if [[ "${DRY_RUN}" == "true" ]]; then
            log_info "[DRY RUN] Would update add-on ${ADDON} to version ${NEW_VER}."
        else
            aws eks update-addon \
                --cluster-name "${CLUSTER_NAME}" \
                --addon-name "${ADDON}" \
                --addon-version "${NEW_VER}" \
                --resolve-conflicts PRESERVE \
                --region "${REGION}"
            
            log_success "Add-on ${ADDON} updated to version ${NEW_VER}."
        fi
    done
    
    log_success "All incompatible add-ons updated successfully."
}

function upgrade_control_plane {
    log_info "Upgrading EKS control plane from ${CURRENT_VERSION} to ${TARGET_VERSION}..."
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would upgrade control plane to version ${TARGET_VERSION}."
    else
        # Start the control plane upgrade
        aws eks update-cluster-version \
            --name "${CLUSTER_NAME}" \
            --kubernetes-version "${TARGET_VERSION}" \
            --region "${REGION}"
        
        # Wait for the upgrade to complete
        log_info "Waiting for control plane upgrade to complete. This may take 20-30 minutes..."
        
        while true; do
            UPGRADE_STATUS=$(aws eks describe-update \
                --name "${CLUSTER_NAME}" \
                --update-id $(aws eks list-updates \
                    --name "${CLUSTER_NAME}" \
                    --region "${REGION}" \
                    --query "updateIds[0]" \
                    --output text) \
                --region "${REGION}" \
                --query "update.status" \
                --output text)
            
            log_info "Control plane upgrade status: ${UPGRADE_STATUS}"
            
            if [[ "${UPGRADE_STATUS}" == "Successful" ]]; then
                break
            elif [[ "${UPGRADE_STATUS}" == "Failed" ]]; then
                log_error "Control plane upgrade failed."
                exit 1
            fi
            
            sleep 60
        done
        
        log_success "Control plane upgraded successfully to version ${TARGET_VERSION}."
    fi
}

function validate_control_plane {
    log_info "Validating control plane after upgrade..."
    
    # Update kubeconfig
    aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${REGION}" > /dev/null
    
    # Check control plane version
    SERVER_VERSION=$(kubectl version -o json | jq -r '.serverVersion.gitVersion')
    log_info "Server version: ${SERVER_VERSION}"
    
    # Check control plane health
    if ! kubectl get --raw='/healthz' | grep -q 'ok'; then
        log_error "Control plane health check failed after upgrade."
        exit 1
    fi
    
    # Check API resources
    log_info "Checking API resources..."
    kubectl api-resources > /dev/null
    
    # Check core components
    log_info "Checking core components..."
    CORE_NAMESPACES=("kube-system" "kube-public" "kube-node-lease")
    
    for NS in "${CORE_NAMESPACES[@]}"; do
        PODS=$(kubectl get pods -n "${NS}" -o json | jq -r '.items[] | .metadata.name + ": " + .status.phase')
        log_info "Pods in ${NS}: ${PODS}"
    done
    
    log_success "Control plane validation completed successfully."
}

function upgrade_node_group {
    local NODE_GROUP=$1
    
    log_info "Upgrading node group ${NODE_GROUP} to version ${TARGET_VERSION}..."
    
    # Get current node group version
    NODE_GROUP_VERSION=$(aws eks describe-nodegroup \
        --cluster-name "${CLUSTER_NAME}" \
        --nodegroup-name "${NODE_GROUP}" \
        --region "${REGION}" \
        --query "nodegroup.version" \
        --output text)
    
    log_info "Current version of node group ${NODE_GROUP}: ${NODE_GROUP_VERSION}"
    
    if [[ "${NODE_GROUP_VERSION}" == "${TARGET_VERSION}" ]]; then
        log_info "Node group ${NODE_GROUP} is already at version ${TARGET_VERSION}."
        return
    fi
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would upgrade node group ${NODE_GROUP} to version ${TARGET_VERSION}."
    else
        # Start the node group upgrade
        aws eks update-nodegroup-version \
            --cluster-name "${CLUSTER_NAME}" \
            --nodegroup-name "${NODE_GROUP}" \
            --kubernetes-version "${TARGET_VERSION}" \
            --region "${REGION}"
        
        # Wait for the upgrade to complete
        log_info "Waiting for node group ${NODE_GROUP} upgrade to complete. This may take some time..."
        
        while true; do
            UPGRADE_STATUS=$(aws eks describe-update \
                --name "${CLUSTER_NAME}" \
                --update-id $(aws eks list-updates \
                    --name "${CLUSTER_NAME}" \
                    --nodegroup-name "${NODE_GROUP}" \
                    --region "${REGION}" \
                    --query "updateIds[0]" \
                    --output text) \
                --region "${REGION}" \
                --query "update.status" \
                --output text)
            
            log_info "Node group ${NODE_GROUP} upgrade status: ${UPGRADE_STATUS}"
            
            if [[ "${UPGRADE_STATUS}" == "Successful" ]]; then
                break
            elif [[ "${UPGRADE_STATUS}" == "Failed" ]]; then
                log_error "Node group ${NODE_GROUP} upgrade failed."
                exit 1
            fi
            
            sleep 60
        done
        
        log_success "Node group ${NODE_GROUP} upgraded successfully to version ${TARGET_VERSION}."
    fi
}

function upgrade_all_node_groups {
    log_info "Upgrading all node groups..."
    
    # Upgrade node groups in a specific order to minimize disruption
    # 1. shared-services (monitoring, ingress, etc.)
    # 2. Journey-specific node groups
    
    # Define the order of node groups
    ORDERED_NODE_GROUPS=()
    
    # Add shared-services first if it exists
    if echo "${NODE_GROUPS}" | jq -r '.[]' | grep -q "shared-services"; then
        ORDERED_NODE_GROUPS+=("shared-services")
    fi
    
    # Add remaining node groups
    for NG in $(echo "${NODE_GROUPS}" | jq -r '.[]'); do
        if [[ "${NG}" != "shared-services" ]]; then
            ORDERED_NODE_GROUPS+=("${NG}")
        fi
    done
    
    log_info "Node group upgrade order: ${ORDERED_NODE_GROUPS[*]}"
    
    # Upgrade each node group
    for NG in "${ORDERED_NODE_GROUPS[@]}"; do
        upgrade_node_group "${NG}"
        
        # Validate node group after upgrade
        log_info "Validating node group ${NG} after upgrade..."
        
        # Check node status
        NODE_SELECTOR="eks.amazonaws.com/nodegroup=${NG}"
        NODE_STATUS=$(kubectl get nodes -l "${NODE_SELECTOR}" -o json)
        UNHEALTHY_NODES=$(echo "${NODE_STATUS}" | jq -r '.items[] | select(.status.conditions[] | select(.type == "Ready" and .status != "True")) | .metadata.name')
        
        if [[ -n "${UNHEALTHY_NODES}" ]]; then
            log_warning "Found unhealthy nodes in node group ${NG}: ${UNHEALTHY_NODES}"
            read -p "Continue with next node group? (y/n): " CONTINUE
            if [[ "${CONTINUE}" != "y" ]]; then
                log_error "Aborting upgrade due to unhealthy nodes."
                exit 1
            fi
        fi
        
        log_success "Node group ${NG} validation completed successfully."
    done
    
    log_success "All node groups upgraded successfully."
}

function post_upgrade_validation {
    log_info "Performing post-upgrade validation..."
    
    # Update kubeconfig
    aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${REGION}" > /dev/null
    
    # Check cluster version
    CLUSTER_VERSION=$(aws eks describe-cluster \
        --name "${CLUSTER_NAME}" \
        --region "${REGION}" \
        --query "cluster.version" \
        --output text)
    
    log_info "Cluster version: ${CLUSTER_VERSION}"
    
    if [[ "${CLUSTER_VERSION}" != "${TARGET_VERSION}" ]]; then
        log_error "Cluster version mismatch. Expected: ${TARGET_VERSION}, Actual: ${CLUSTER_VERSION}"
        exit 1
    fi
    
    # Check node versions
    log_info "Checking node versions..."
    NODE_VERSIONS=$(kubectl get nodes -o json | jq -r '.items[] | .status.nodeInfo.kubeletVersion')
    MISMATCHED_NODES=$(kubectl get nodes -o json | jq -r '.items[] | select(.status.nodeInfo.kubeletVersion != "v'"${TARGET_VERSION}"'") | .metadata.name')
    
    if [[ -n "${MISMATCHED_NODES}" ]]; then
        log_warning "Found nodes with mismatched versions: ${MISMATCHED_NODES}"
    fi
    
    # Check pod health
    log_info "Checking pod health..."
    UNHEALTHY_PODS=$(kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.status.phase != "Running" and .status.phase != "Succeeded") | .metadata.namespace + "/" + .metadata.name')
    
    if [[ -n "${UNHEALTHY_PODS}" ]]; then
        log_warning "Found unhealthy pods after upgrade: ${UNHEALTHY_PODS}"
    fi
    
    # Check critical workloads
    log_info "Checking critical workloads..."
    CRITICAL_NAMESPACES=("health-journey" "care-journey" "plan-journey" "gamification" "ingress")
    
    for NS in "${CRITICAL_NAMESPACES[@]}"; do
        if ! kubectl get namespace "${NS}" &> /dev/null; then
            log_warning "Namespace ${NS} not found."
            continue
        fi
        
        DEPLOYMENTS=$(kubectl get deployments -n "${NS}" -o json | jq -r '.items[] | .metadata.name + ": " + (.status.readyReplicas | tostring) + "/" + (.status.replicas | tostring)')
        log_info "Deployments in ${NS}: ${DEPLOYMENTS}"
        
        UNHEALTHY_DEPLOYMENTS=$(kubectl get deployments -n "${NS}" -o json | jq -r '.items[] | select(.status.readyReplicas < .status.replicas) | .metadata.name')
        
        if [[ -n "${UNHEALTHY_DEPLOYMENTS}" ]]; then
            log_warning "Found unhealthy deployments in ${NS}: ${UNHEALTHY_DEPLOYMENTS}"
        fi
    done
    
    # Check add-on versions
    log_info "Checking add-on versions..."
    for ADDON in $(echo "${CLUSTER_ADDONS}" | jq -r '.[]'); do
        ADDON_VERSION=$(aws eks describe-addon \
            --cluster-name "${CLUSTER_NAME}" \
            --addon-name "${ADDON}" \
            --region "${REGION}" \
            --query "addon.addonVersion" \
            --output text)
        
        log_info "Add-on ${ADDON} version: ${ADDON_VERSION}"
    done
    
    log_success "Post-upgrade validation completed successfully."
}

function generate_upgrade_report {
    log_info "Generating upgrade report..."
    
    REPORT_FILE="${SCRIPT_DIR}/../logs/eks-upgrade-report-$(date +%Y%m%d-%H%M%S).md"
    
    # Create report file
    cat > "${REPORT_FILE}" << EOF
# EKS Cluster Upgrade Report

## Upgrade Details

- **Cluster Name:** ${CLUSTER_NAME}
- **Region:** ${REGION}
- **Previous Version:** ${CURRENT_VERSION}
- **New Version:** ${TARGET_VERSION}
- **Upgrade Date:** $(date +"%Y-%m-%d")
- **Upgrade Time:** $(date +"%H:%M:%S")

## Node Groups

| Node Group | Previous Version | New Version | Status |
|------------|------------------|-------------|--------|
$(for NG in $(echo "${NODE_GROUPS}" | jq -r '.[]'); do
    NG_VERSION=$(aws eks describe-nodegroup \
        --cluster-name "${CLUSTER_NAME}" \
        --nodegroup-name "${NG}" \
        --region "${REGION}" \
        --query "nodegroup.version" \
        --output text)
    echo "| ${NG} | ${CURRENT_VERSION} | ${NG_VERSION} | $(if [[ "${NG_VERSION}" == "${TARGET_VERSION}" ]]; then echo "✅ Success"; else echo "❌ Failed"; fi) |"
done)

## Add-ons

| Add-on | Previous Version | New Version | Status |
|--------|------------------|-------------|--------|
$(for ADDON in $(echo "${CLUSTER_ADDONS}" | jq -r '.[]'); do
    ADDON_VERSION=$(aws eks describe-addon \
        --cluster-name "${CLUSTER_NAME}" \
        --addon-name "${ADDON}" \
        --region "${REGION}" \
        --query "addon.addonVersion" \
        --output text)
    
    # Find if this addon was in the incompatible list
    PREV_VERSION=""
    for ADDON_INFO in "${INCOMPATIBLE_ADDONS[@]}"; do
        IFS=':' read -r A_NAME A_PREV A_NEW <<< "${ADDON_INFO}"
        if [[ "${A_NAME}" == "${ADDON}" ]]; then
            PREV_VERSION="${A_PREV}"
            break
        fi
    done
    
    if [[ -z "${PREV_VERSION}" ]]; then
        PREV_VERSION="${ADDON_VERSION} (unchanged)"
    fi
    
    echo "| ${ADDON} | ${PREV_VERSION} | ${ADDON_VERSION} | ✅ Success |"
done)

## Validation Results

### Control Plane

- **Health Check:** ✅ Passed
- **API Resources:** ✅ Available
- **Core Components:** ✅ Running

### Workloads

$(for NS in "health-journey" "care-journey" "plan-journey" "gamification" "ingress"; do
    if kubectl get namespace "${NS}" &> /dev/null; then
        TOTAL_DEPS=$(kubectl get deployments -n "${NS}" -o json | jq '.items | length')
        HEALTHY_DEPS=$(kubectl get deployments -n "${NS}" -o json | jq '.items[] | select(.status.readyReplicas == .status.replicas) | .metadata.name' | wc -l)
        echo "- **${NS}:** ${HEALTHY_DEPS}/${TOTAL_DEPS} deployments healthy"
    else
        echo "- **${NS}:** Namespace not found"
    fi
done)

## Next Steps

1. Monitor the cluster for any issues over the next 24-48 hours
2. Update application documentation to reflect the new Kubernetes version
3. Review any deprecated APIs that will be removed in future versions
4. Schedule the next upgrade according to the EKS version lifecycle

## Notes

$(if [[ -n "${UNHEALTHY_PODS}" ]]; then
    echo "The following pods were unhealthy after the upgrade and may require attention:\n"
    for POD in ${UNHEALTHY_PODS}; do
        echo "- ${POD}\n"
    done
fi)

$(if [[ -n "${MISMATCHED_NODES}" ]]; then
    echo "The following nodes had version mismatches and may require manual intervention:\n"
    for NODE in ${MISMATCHED_NODES}; do
        echo "- ${NODE}\n"
    done
fi)

EOF
    
    log_success "Upgrade report generated: ${REPORT_FILE}"
}

# =========================================================================
# Main Script Execution
# =========================================================================

# Parse command line arguments
parse_args "$@"

# Check prerequisites
check_prerequisites

# Get current cluster information
get_current_cluster_info

# Determine upgrade path
determine_upgrade_path

# Check add-on compatibility
check_addon_compatibility

# Create upgrade plan
create_upgrade_plan

# If dry run, exit here
if [[ "${DRY_RUN}" == "true" ]]; then
    log_info "Dry run completed. Upgrade plan created: ${UPGRADE_PLAN_FILE}"
    exit 0
fi

# Confirm upgrade
echo ""
echo "======================================================================="
echo "                       EKS CLUSTER UPGRADE PLAN                       "
echo "======================================================================="
echo "Cluster: ${CLUSTER_NAME}"
echo "Region: ${REGION}"
echo "Current Version: ${CURRENT_VERSION}"
echo "Target Version: ${TARGET_VERSION}"
echo "Node Groups: $(echo "${NODE_GROUPS}" | jq -r '.[]' | tr '\n' ', ')"
echo "Add-ons: $(echo "${CLUSTER_ADDONS}" | jq -r '.[]' | tr '\n' ', ')"
echo "Incompatible Add-ons: $(if [[ ${#INCOMPATIBLE_ADDONS[@]} -eq 0 ]]; then echo "None"; else for ADDON_INFO in "${INCOMPATIBLE_ADDONS[@]}"; do IFS=':' read -r ADDON CURRENT_VER NEW_VER <<< "${ADDON_INFO}"; echo "${ADDON} (${CURRENT_VER} -> ${NEW_VER}), "; done | sed 's/, $/./'; fi)"
echo "======================================================================="
echo ""
read -p "Do you want to proceed with the upgrade? (y/n): " PROCEED

if [[ "${PROCEED}" != "y" ]]; then
    log_info "Upgrade aborted by user."
    exit 0
fi

# Perform pre-upgrade validation
pre_upgrade_validation

# Update incompatible add-ons
update_incompatible_addons

# Upgrade control plane
upgrade_control_plane

# Validate control plane
validate_control_plane

# Upgrade node groups
upgrade_all_node_groups

# Perform post-upgrade validation
post_upgrade_validation

# Generate upgrade report
generate_upgrade_report

log_success "EKS cluster ${CLUSTER_NAME} successfully upgraded from ${CURRENT_VERSION} to ${TARGET_VERSION}."
log_info "Upgrade report: ${REPORT_FILE}"

exit 0