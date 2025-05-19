#!/bin/bash

#############################################################
# AUSTA SuperApp - EKS Node Security Patching Script
# 
# This script orchestrates OS security patching for EKS nodes by:
# - Identifying required security updates
# - Scheduling rolling updates through node rotation
# - Applying security patches without application downtime
# - Verifying patch application with security compliance scanning
#
# Execution: Monthly automated run
#############################################################

set -e

# Script configuration
LOG_DIR="/var/log/austa/maintenance"
LOG_FILE="${LOG_DIR}/security-patch-$(date +%Y-%m-%d).log"
CLUSTER_NAME="austa-superapp"
REGION="sa-east-1"  # Primary region: São Paulo
MAX_UNAVAILABLE="20%"  # Maximum unavailable nodes during update
SCAN_TIMEOUT=1800  # Timeout for security scanning (30 minutes)

# Node groups to patch
NODE_GROUPS=(
  "health-journey"
  "care-journey"
  "plan-journey"
  "gamification"
  "shared-services"
)

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Logging function
log() {
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] $1" | tee -a "${LOG_FILE}"
}

# Error handling function
handle_error() {
  log "ERROR: $1"
  log "Patching process failed. See log for details."
  exit 1
}

# Check required tools
check_prerequisites() {
  log "Checking prerequisites..."
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    handle_error "AWS CLI is not installed. Please install it first."
  fi
  
  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    handle_error "kubectl is not installed. Please install it first."
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    handle_error "jq is not installed. Please install it first."
  fi
  
  # Verify AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    handle_error "AWS credentials are not configured or are invalid."
  fi
  
  # Configure kubectl for the cluster
  if ! aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${REGION}" &> /dev/null; then
    handle_error "Failed to configure kubectl for cluster ${CLUSTER_NAME}."
  fi
  
  log "Prerequisites check completed successfully."
}

# Get available security updates for the AMI
get_security_updates() {
  local node_group=$1
  log "Checking available security updates for node group: ${node_group}"
  
  # Get node group details
  local node_group_info
  node_group_info=$(aws eks describe-nodegroup --cluster-name "${CLUSTER_NAME}" \
                    --nodegroup-name "${node_group}" --region "${REGION}" 2>/dev/null) || \
                    handle_error "Failed to get node group info for ${node_group}"
  
  # Get AMI ID from a node in the group
  local node_name
  node_name=$(kubectl get nodes -l "eks.amazonaws.com/nodegroup=${node_group}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null) || \
             handle_error "Failed to get node name for node group ${node_group}"
  
  local instance_id
  instance_id=$(kubectl get node "${node_name}" -o jsonpath='{.spec.providerID}' | sed 's|.*/||' 2>/dev/null) || \
               handle_error "Failed to get instance ID for node ${node_name}"
  
  local ami_id
  ami_id=$(aws ec2 describe-instances --instance-ids "${instance_id}" --region "${REGION}" \
           --query 'Reservations[0].Instances[0].ImageId' --output text 2>/dev/null) || \
           handle_error "Failed to get AMI ID for instance ${instance_id}"
  
  log "Current AMI ID for node group ${node_group}: ${ami_id}"
  
  # Check for available updates (using SSM to check for available updates)
  local update_count
  update_count=$(aws ssm describe-instance-information --filters "Key=InstanceIds,Values=${instance_id}" \
                --region "${REGION}" --query 'InstanceInformationList[0].PlatformName' --output text 2>/dev/null)
  
  if [[ -z "${update_count}" || "${update_count}" == "None" ]]; then
    log "SSM agent not available on instance. Using AWS CLI to check for newer AMI."
    
    # Get latest EKS optimized AMI
    local ami_info
    ami_info=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=amazon-eks-node-${CLUSTER_VERSION}-*" \
              --query 'sort_by(Images, &CreationDate)[-1]' --region "${REGION}" 2>/dev/null) || \
              handle_error "Failed to get latest EKS optimized AMI"
    
    local latest_ami_id
    latest_ami_id=$(echo "${ami_info}" | jq -r '.ImageId')
    
    if [[ "${ami_id}" != "${latest_ami_id}" ]]; then
      log "Updates available: Current AMI ${ami_id} can be updated to ${latest_ami_id}"
      return 0  # Updates available
    else
      log "No updates available for node group ${node_group}"
      return 1  # No updates available
    fi
  else
    # Use SSM to check for security updates
    local update_info
    update_info=$(aws ssm send-command --instance-ids "${instance_id}" \
                 --document-name "AWS-RunShellScript" \
                 --parameters "commands=['yum check-update --security | grep -v Loaded | grep -v ^$ | wc -l']" \
                 --region "${REGION}" 2>/dev/null) || \
                 handle_error "Failed to check for security updates on instance ${instance_id}"
    
    local command_id
    command_id=$(echo "${update_info}" | jq -r '.Command.CommandId')
    
    # Wait for command to complete
    sleep 5
    
    local update_count
    update_count=$(aws ssm get-command-invocation --command-id "${command_id}" \
                  --instance-id "${instance_id}" --region "${REGION}" \
                  --query 'StandardOutputContent' --output text 2>/dev/null | tr -d '\n')
    
    if [[ -z "${update_count}" ]]; then
      log "Failed to get security update count. Assuming updates are available."
      return 0  # Assume updates available
    elif [[ "${update_count}" -gt 0 ]]; then
      log "${update_count} security updates available for node group ${node_group}"
      return 0  # Updates available
    else
      log "No security updates available for node group ${node_group}"
      return 1  # No updates available
    fi
  fi
}

# Update node group with latest AMI
update_node_group() {
  local node_group=$1
  log "Starting update process for node group: ${node_group}"
  
  # Get current cluster version
  local cluster_version
  cluster_version=$(aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${REGION}" \
                   --query 'cluster.version' --output text 2>/dev/null) || \
                   handle_error "Failed to get cluster version"
  
  log "Cluster version: ${cluster_version}"
  
  # Get latest EKS optimized AMI
  local ami_info
  ami_info=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=amazon-eks-node-${cluster_version}-*" \
            --query 'sort_by(Images, &CreationDate)[-1]' --region "${REGION}" 2>/dev/null) || \
            handle_error "Failed to get latest EKS optimized AMI"
  
  local latest_ami_id
  latest_ami_id=$(echo "${ami_info}" | jq -r '.ImageId')
  local ami_name
  ami_name=$(echo "${ami_info}" | jq -r '.Name')
  
  log "Latest AMI for EKS ${cluster_version}: ${latest_ami_id} (${ami_name})"
  
  # Update node group with latest AMI
  log "Updating node group ${node_group} to use AMI ${latest_ami_id}"
  
  # Get current node group configuration
  local node_group_config
  node_group_config=$(aws eks describe-nodegroup --cluster-name "${CLUSTER_NAME}" \
                     --nodegroup-name "${node_group}" --region "${REGION}" 2>/dev/null) || \
                     handle_error "Failed to get node group configuration for ${node_group}"
  
  # Extract current launch template ID and version
  local launch_template_id
  local launch_template_version
  
  if echo "${node_group_config}" | jq -e '.nodegroup.launchTemplate' &>/dev/null; then
    # Node group uses launch template
    launch_template_id=$(echo "${node_group_config}" | jq -r '.nodegroup.launchTemplate.id')
    launch_template_version=$(echo "${node_group_config}" | jq -r '.nodegroup.launchTemplate.version')
    
    log "Node group uses launch template: ${launch_template_id} (version ${launch_template_version})"
    
    # Create new launch template version with updated AMI
    local template_data
    template_data=$(aws ec2 describe-launch-template-versions --launch-template-id "${launch_template_id}" \
                   --versions "${launch_template_version}" --region "${REGION}" 2>/dev/null) || \
                   handle_error "Failed to get launch template data"
    
    local template_json
    template_json=$(echo "${template_data}" | jq -r '.LaunchTemplateVersions[0].LaunchTemplateData')
    
    # Update AMI ID in template data
    local updated_template_json
    updated_template_json=$(echo "${template_json}" | jq --arg ami "${latest_ami_id}" '.ImageId = $ami')
    
    # Create new version of launch template
    local new_template_version
    new_template_version=$(aws ec2 create-launch-template-version --launch-template-id "${launch_template_id}" \
                          --version-description "Security update $(date +%Y-%m-%d)" \
                          --launch-template-data "${updated_template_json}" --region "${REGION}" \
                          --query 'LaunchTemplateVersion.VersionNumber' --output text 2>/dev/null) || \
                          handle_error "Failed to create new launch template version"
    
    log "Created new launch template version: ${new_template_version}"
    
    # Update node group to use new launch template version
    aws eks update-nodegroup-version --cluster-name "${CLUSTER_NAME}" --nodegroup-name "${node_group}" \
    --launch-template "id=${launch_template_id},version=${new_template_version}" \
    --force --region "${REGION}" 2>/dev/null || \
    handle_error "Failed to update node group ${node_group} to use new launch template version"
    
  else
    # Node group doesn't use launch template, use AMI release version update
    local release_version
    release_version=$(echo "${ami_name}" | grep -oP 'v\d+\.\d+\.\d+' | head -1)
    
    if [[ -z "${release_version}" ]]; then
      handle_error "Failed to extract release version from AMI name: ${ami_name}"
    fi
    
    log "Updating node group ${node_group} to release version ${release_version}"
    
    aws eks update-nodegroup-version --cluster-name "${CLUSTER_NAME}" --nodegroup-name "${node_group}" \
    --release-version "${release_version}" --force --region "${REGION}" 2>/dev/null || \
    handle_error "Failed to update node group ${node_group} to release version ${release_version}"
  fi
  
  log "Node group update initiated successfully for ${node_group}"
}

# Wait for node group update to complete
wait_for_update() {
  local node_group=$1
  local timeout=3600  # 1 hour timeout
  local start_time=$(date +%s)
  local current_time
  local elapsed_time
  
  log "Waiting for node group ${node_group} update to complete..."
  
  while true; do
    local status
    status=$(aws eks describe-nodegroup --cluster-name "${CLUSTER_NAME}" \
            --nodegroup-name "${node_group}" --region "${REGION}" \
            --query 'nodegroup.status' --output text 2>/dev/null)
    
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    
    if [[ "${status}" == "ACTIVE" ]]; then
      log "Node group ${node_group} update completed successfully after $((elapsed_time / 60)) minutes"
      break
    elif [[ "${status}" == "DEGRADED" ]]; then
      handle_error "Node group ${node_group} update failed with status DEGRADED"
    elif [[ ${elapsed_time} -ge ${timeout} ]]; then
      handle_error "Timeout waiting for node group ${node_group} update to complete"
    fi
    
    log "Node group ${node_group} status: ${status} (elapsed: $((elapsed_time / 60)) minutes)"
    sleep 60  # Check every minute
  done
}

# Verify nodes are running the updated AMI
verify_node_update() {
  local node_group=$1
  log "Verifying nodes in node group ${node_group} are running the updated AMI"
  
  # Get the latest AMI ID
  local cluster_version
  cluster_version=$(aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${REGION}" \
                   --query 'cluster.version' --output text 2>/dev/null) || \
                   handle_error "Failed to get cluster version"
  
  local latest_ami_id
  latest_ami_id=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=amazon-eks-node-${cluster_version}-*" \
                --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text --region "${REGION}" 2>/dev/null) || \
                handle_error "Failed to get latest AMI ID"
  
  # Get nodes in the node group
  local nodes
  nodes=$(kubectl get nodes -l "eks.amazonaws.com/nodegroup=${node_group}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null) || \
         handle_error "Failed to get nodes for node group ${node_group}"
  
  local all_updated=true
  
  for node in ${nodes}; do
    local instance_id
    instance_id=$(kubectl get node "${node}" -o jsonpath='{.spec.providerID}' | sed 's|.*/||' 2>/dev/null) || \
                 handle_error "Failed to get instance ID for node ${node}"
    
    local node_ami
    node_ami=$(aws ec2 describe-instances --instance-ids "${instance_id}" --region "${REGION}" \
              --query 'Reservations[0].Instances[0].ImageId' --output text 2>/dev/null) || \
              handle_error "Failed to get AMI ID for instance ${instance_id}"
    
    if [[ "${node_ami}" != "${latest_ami_id}" ]]; then
      log "WARNING: Node ${node} is still running old AMI: ${node_ami}"
      all_updated=false
    else
      log "Node ${node} is running the latest AMI: ${node_ami}"
    fi
  done
  
  if [[ "${all_updated}" == "true" ]]; then
    log "All nodes in node group ${node_group} are running the latest AMI"
    return 0
  else
    log "WARNING: Some nodes in node group ${node_group} are not running the latest AMI"
    return 1
  fi
}

# Run security compliance scan on nodes
run_security_scan() {
  local node_group=$1
  log "Running security compliance scan on node group: ${node_group}"
  
  # Get nodes in the node group
  local nodes
  nodes=$(kubectl get nodes -l "eks.amazonaws.com/nodegroup=${node_group}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null) || \
         handle_error "Failed to get nodes for node group ${node_group}"
  
  local scan_success=true
  
  for node in ${nodes}; do
    local instance_id
    instance_id=$(kubectl get node "${node}" -o jsonpath='{.spec.providerID}' | sed 's|.*/||' 2>/dev/null) || \
                 handle_error "Failed to get instance ID for node ${node}"
    
    log "Running security scan on node ${node} (${instance_id})"
    
    # Check if SSM agent is running on the instance
    local ssm_status
    ssm_status=$(aws ssm describe-instance-information --filters "Key=InstanceIds,Values=${instance_id}" \
                --region "${REGION}" --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null)
    
    if [[ "${ssm_status}" != "Online" ]]; then
      log "WARNING: SSM agent not available on instance ${instance_id}. Skipping security scan."
      continue
    fi
    
    # Run security compliance scan using SSM
    local scan_command_id
    scan_command_id=$(aws ssm send-command --instance-ids "${instance_id}" \
                     --document-name "AWS-RunPatchBaseline" \
                     --parameters "Operation=Scan" \
                     --region "${REGION}" --query 'Command.CommandId' --output text 2>/dev/null) || \
                     handle_error "Failed to initiate security scan on instance ${instance_id}"
    
    log "Security scan initiated on instance ${instance_id} with command ID: ${scan_command_id}"
    
    # Wait for scan to complete
    local scan_status="InProgress"
    local start_time=$(date +%s)
    local current_time
    local elapsed_time
    
    while [[ "${scan_status}" == "InProgress" || "${scan_status}" == "Pending" ]]; do
      sleep 30
      
      scan_status=$(aws ssm get-command-invocation --command-id "${scan_command_id}" \
                   --instance-id "${instance_id}" --region "${REGION}" \
                   --query 'Status' --output text 2>/dev/null)
      
      current_time=$(date +%s)
      elapsed_time=$((current_time - start_time))
      
      if [[ ${elapsed_time} -ge ${SCAN_TIMEOUT} ]]; then
        log "WARNING: Timeout waiting for security scan to complete on instance ${instance_id}"
        scan_success=false
        break
      fi
    done
    
    if [[ "${scan_status}" == "Success" ]]; then
      log "Security scan completed successfully on instance ${instance_id}"
      
      # Get scan results
      local scan_result
      scan_result=$(aws ssm get-command-invocation --command-id "${scan_command_id}" \
                   --instance-id "${instance_id}" --region "${REGION}" \
                   --query 'StandardOutputContent' --output text 2>/dev/null)
      
      # Check for missing patches
      if echo "${scan_result}" | grep -q "Missing"; then
        local missing_count
        missing_count=$(echo "${scan_result}" | grep -o "Missing: [0-9]*" | awk '{print $2}')
        
        if [[ -n "${missing_count}" && "${missing_count}" -gt 0 ]]; then
          log "WARNING: Instance ${instance_id} has ${missing_count} missing patches after update"
          scan_success=false
        else
          log "Instance ${instance_id} has no missing patches"
        fi
      else
        log "Instance ${instance_id} scan completed, but couldn't parse missing patch count"
      fi
    else
      log "WARNING: Security scan failed on instance ${instance_id} with status: ${scan_status}"
      scan_success=false
    fi
  done
  
  if [[ "${scan_success}" == "true" ]]; then
    log "Security compliance scan passed for all nodes in node group ${node_group}"
    return 0
  else
    log "WARNING: Security compliance scan failed for some nodes in node group ${node_group}"
    return 1
  fi
}

# Main function
main() {
  log "Starting EKS node security patching process"
  log "Cluster: ${CLUSTER_NAME}, Region: ${REGION}"
  
  # Check prerequisites
  check_prerequisites
  
  # Get cluster version
  CLUSTER_VERSION=$(aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${REGION}" \
                   --query 'cluster.version' --output text 2>/dev/null) || \
                   handle_error "Failed to get cluster version"
  
  log "Cluster version: ${CLUSTER_VERSION}"
  
  # Process each node group
  for node_group in "${NODE_GROUPS[@]}"; do
    log "\n=== Processing node group: ${node_group} ==="
    
    # Check if updates are available
    if get_security_updates "${node_group}"; then
      # Configure max unavailable for update
      aws eks update-nodegroup-config --cluster-name "${CLUSTER_NAME}" \
      --nodegroup-name "${node_group}" --region "${REGION}" \
      --update-config "maxUnavailable=${MAX_UNAVAILABLE}" &>/dev/null || \
      log "WARNING: Failed to set maxUnavailable for node group ${node_group}"
      
      # Update node group
      update_node_group "${node_group}"
      
      # Wait for update to complete
      wait_for_update "${node_group}"
      
      # Verify nodes are updated
      verify_node_update "${node_group}"
      
      # Run security compliance scan
      run_security_scan "${node_group}"
    else
      log "No security updates required for node group ${node_group}"
    fi
  done
  
  log "\n=== EKS node security patching process completed ==="
}

# Execute main function
main