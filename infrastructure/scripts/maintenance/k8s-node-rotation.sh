#!/bin/bash

#############################################################################
# AUSTA SuperApp - Kubernetes Node Rotation Script
# 
# This script performs controlled replacements of EKS cluster nodes to apply
# security updates, patch kernels, and refresh node configurations while 
# ensuring zero downtime for applications by coordinating with Kubernetes 
# pod disruption budgets and respecting node anti-affinity rules.
#
# Usage: ./k8s-node-rotation.sh [--dry-run] [--node-group <name>] [--max-unavailable <count>]
#
# Requirements:
#   - AWS CLI
#   - kubectl
#   - jq
#   - AWS IAM permissions for EKS and EC2 Auto Scaling
#############################################################################

set -e

# Default configuration
DRY_RUN=false
MAX_UNAVAILABLE=1
NODE_GROUP=""
CLUSTER_NAME="austa-superapp"
REGION="sa-east-1"
LOG_FILE="/var/log/austa/node-rotation-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT_SECONDS=600
WAIT_PERIOD=30

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p /var/log/austa

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        *)
            echo -e "[LOG] $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function to display usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run                Simulate the rotation without making changes"
    echo "  --node-group NAME        Target a specific node group (default: all node groups)"
    echo "  --max-unavailable COUNT  Maximum number of nodes to be unavailable at once (default: 1)"
    echo "  --cluster-name NAME      EKS cluster name (default: austa-superapp)"
    echo "  --region REGION          AWS region (default: sa-east-1)"
    echo "  --help                   Display this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --node-group)
            NODE_GROUP="$2"
            shift 2
            ;;
        --max-unavailable)
            MAX_UNAVAILABLE="$2"
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
        --help)
            usage
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            ;;
    esac
done

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check for required commands
    for cmd in aws kubectl jq; do
        if ! command -v $cmd &> /dev/null; then
            log "ERROR" "$cmd is required but not installed. Please install it and try again."
            exit 1
        fi
    done
    
    # Check AWS CLI configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "AWS CLI is not configured properly. Please configure it and try again."
        exit 1
    fi
    
    # Check kubectl configuration
    if ! kubectl cluster-info &> /dev/null; then
        log "ERROR" "kubectl is not configured properly. Please configure it and try again."
        exit 1
    fi
    
    # Update kubeconfig for the specified cluster
    log "INFO" "Updating kubeconfig for cluster $CLUSTER_NAME in region $REGION"
    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"
    
    log "SUCCESS" "All prerequisites satisfied."
}

# Function to get all node groups in the cluster
get_node_groups() {
    log "INFO" "Retrieving node groups for cluster $CLUSTER_NAME..."
    
    NODE_GROUPS=$(aws eks list-nodegroups --cluster-name "$CLUSTER_NAME" --region "$REGION" | jq -r '.nodegroups[]')
    
    if [[ -z "$NODE_GROUPS" ]]; then
        log "ERROR" "No node groups found for cluster $CLUSTER_NAME"
        exit 1
    fi
    
    log "SUCCESS" "Retrieved node groups: $NODE_GROUPS"
    echo "$NODE_GROUPS"
}

# Function to get the Auto Scaling Group (ASG) for a node group
get_asg_for_nodegroup() {
    local nodegroup=$1
    
    log "INFO" "Getting Auto Scaling Group for node group $nodegroup"
    
    local asg_name=$(aws eks describe-nodegroup --cluster-name "$CLUSTER_NAME" --nodegroup-name "$nodegroup" --region "$REGION" | \
                    jq -r '.nodegroup.resources.autoScalingGroups[0].name')
    
    if [[ -z "$asg_name" || "$asg_name" == "null" ]]; then
        log "ERROR" "Could not find Auto Scaling Group for node group $nodegroup"
        return 1
    fi
    
    log "SUCCESS" "Found ASG: $asg_name for node group $nodegroup"
    echo "$asg_name"
}

# Function to check Pod Disruption Budgets (PDBs) in the cluster
check_pdbs() {
    log "INFO" "Checking Pod Disruption Budgets across all namespaces"
    
    local pdbs=$(kubectl get pdb --all-namespaces -o json | jq -r '.items[] | "\(.metadata.namespace)/\(.metadata.name): maxUnavailable=\(.spec.maxUnavailable)"')
    
    if [[ -z "$pdbs" ]]; then
        log "WARNING" "No Pod Disruption Budgets found in the cluster. This may lead to service disruption during rotation."
    else
        log "INFO" "Found the following Pod Disruption Budgets:"
        echo "$pdbs" | while read pdb; do
            log "INFO" "  $pdb"
        done
    fi
}

# Function to check if nodes have anti-affinity rules
check_node_anti_affinity() {
    log "INFO" "Checking for pod anti-affinity rules in deployments"
    
    local deployments_with_anti_affinity=$(kubectl get deployments --all-namespaces -o json | \
        jq -r '.items[] | select(.spec.template.spec.affinity.podAntiAffinity != null) | "\(.metadata.namespace)/\(.metadata.name)"')
    
    if [[ -z "$deployments_with_anti_affinity" ]]; then
        log "WARNING" "No deployments with pod anti-affinity rules found. This may affect high availability during rotation."
    else
        log "INFO" "Found deployments with pod anti-affinity rules:"
        echo "$deployments_with_anti_affinity" | while read deployment; do
            log "INFO" "  $deployment"
        done
    fi
}

# Function to get nodes in a node group
get_nodes_in_nodegroup() {
    local nodegroup=$1
    
    log "INFO" "Getting nodes in node group $nodegroup"
    
    # Get the ASG name for the node group
    local asg_name=$(get_asg_for_nodegroup "$nodegroup")
    if [[ $? -ne 0 ]]; then
        return 1
    fi
    
    # Get instance IDs in the ASG
    local instance_ids=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "$asg_name" --region "$REGION" | \
                        jq -r '.AutoScalingGroups[0].Instances[].InstanceId')
    
    if [[ -z "$instance_ids" ]]; then
        log "WARNING" "No instances found in ASG $asg_name"
        return 1
    fi
    
    # Get the corresponding node names from Kubernetes
    local nodes=$()
    for instance_id in $instance_ids; do
        local private_dns=$(aws ec2 describe-instances --instance-ids "$instance_id" --region "$REGION" | \
                          jq -r '.Reservations[0].Instances[0].PrivateDnsName')
        
        # The node name in Kubernetes is the private DNS name
        if [[ -n "$private_dns" && "$private_dns" != "null" ]]; then
            nodes+=("$private_dns")
        fi
    done
    
    if [[ ${#nodes[@]} -eq 0 ]]; then
        log "WARNING" "Could not map any instances to Kubernetes nodes for node group $nodegroup"
        return 1
    fi
    
    log "SUCCESS" "Found ${#nodes[@]} nodes in node group $nodegroup"
    echo "${nodes[@]}"
}

# Function to check if a node can be safely drained
can_drain_node_safely() {
    local node=$1
    
    log "INFO" "Checking if node $node can be safely drained"
    
    # Get pods on the node
    local pods=$(kubectl get pods --all-namespaces -o json --field-selector spec.nodeName=$node | \
                jq -r '.items[] | "\(.metadata.namespace)/\(.metadata.name)"')
    
    # Check if any pod has no controller (standalone pod)
    local standalone_pods=$(kubectl get pods --all-namespaces -o json --field-selector spec.nodeName=$node | \
                          jq -r '.items[] | select(.metadata.ownerReferences == null or .metadata.ownerReferences | length == 0) | "\(.metadata.namespace)/\(.metadata.name)"')
    
    if [[ -n "$standalone_pods" ]]; then
        log "WARNING" "Node $node has standalone pods that will be lost during drain:"
        echo "$standalone_pods" | while read pod; do
            log "WARNING" "  $pod"
        done
        return 1
    fi
    
    # Check if any pod belongs to a deployment with insufficient replicas
    local problematic_pods=$()
    for pod in $pods; do
        IFS='/' read -r namespace pod_name <<< "$pod"
        
        # Get owner reference
        local owner_kind=$(kubectl get pod -n "$namespace" "$pod_name" -o json | \
                         jq -r '.metadata.ownerReferences[0].kind // "none"')
        local owner_name=$(kubectl get pod -n "$namespace" "$pod_name" -o json | \
                         jq -r '.metadata.ownerReferences[0].name // "none"')
        
        if [[ "$owner_kind" == "ReplicaSet" ]]; then
            # Get deployment name from replica set
            local deployment=$(kubectl get rs -n "$namespace" "$owner_name" -o json | \
                            jq -r '.metadata.ownerReferences[0].name // "none"')
            
            if [[ "$deployment" != "none" ]]; then
                # Check if deployment has enough replicas
                local replicas=$(kubectl get deployment -n "$namespace" "$deployment" -o jsonpath='{.spec.replicas}')
                
                if [[ "$replicas" -lt 2 ]]; then
                    problematic_pods+=("$pod (deployment $deployment has only $replicas replicas)")
                fi
            fi
        elif [[ "$owner_kind" == "StatefulSet" ]]; then
            # Check if statefulset has enough replicas
            local replicas=$(kubectl get statefulset -n "$namespace" "$owner_name" -o jsonpath='{.spec.replicas}')
            
            if [[ "$replicas" -lt 2 ]]; then
                problematic_pods+=("$pod (statefulset $owner_name has only $replicas replicas)")
            fi
        fi
    done
    
    if [[ ${#problematic_pods[@]} -gt 0 ]]; then
        log "WARNING" "Node $node has pods that may cause service disruption during drain:"
        for pod in "${problematic_pods[@]}"; do
            log "WARNING" "  $pod"
        done
        return 1
    fi
    
    log "SUCCESS" "Node $node can be safely drained"
    return 0
}

# Function to drain a node
drain_node() {
    local node=$1
    
    log "INFO" "Draining node $node"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would drain node $node"
        return 0
    fi
    
    # Cordon the node first to prevent new pods from being scheduled
    kubectl cordon "$node"
    
    # Drain the node with a grace period
    if kubectl drain "$node" --ignore-daemonsets --delete-emptydir-data --grace-period=120 --timeout="${TIMEOUT_SECONDS}s"; then
        log "SUCCESS" "Successfully drained node $node"
        return 0
    else
        log "ERROR" "Failed to drain node $node"
        # Uncordon the node if drain failed
        kubectl uncordon "$node"
        return 1
    fi
}

# Function to terminate an instance in an ASG
terminate_instance() {
    local instance_id=$1
    local asg_name=$2
    
    log "INFO" "Terminating instance $instance_id in ASG $asg_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would terminate instance $instance_id"
        return 0
    fi
    
    # Terminate the instance and wait for a replacement
    if aws autoscaling terminate-instance-in-auto-scaling-group \
        --instance-id "$instance_id" \
        --should-decrement-desired-capacity false \
        --region "$REGION"; then
        
        log "SUCCESS" "Successfully initiated termination of instance $instance_id"
        return 0
    else
        log "ERROR" "Failed to terminate instance $instance_id"
        return 1
    fi
}

# Function to wait for a new node to be ready
wait_for_new_node() {
    local asg_name=$1
    local old_instance_id=$2
    
    log "INFO" "Waiting for a new node to replace instance $old_instance_id in ASG $asg_name"
    
    local start_time=$(date +%s)
    local timeout=600  # 10 minutes timeout
    
    while true; do
        # Check if we've exceeded the timeout
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            log "ERROR" "Timeout waiting for new node to replace instance $old_instance_id"
            return 1
        fi
        
        # Get the current instances in the ASG
        local instances=$(aws autoscaling describe-auto-scaling-groups \
                         --auto-scaling-group-names "$asg_name" \
                         --region "$REGION" | \
                         jq -r '.AutoScalingGroups[0].Instances[] | select(.LifecycleState == "InService") | .InstanceId')
        
        # Check if we have a new instance (not the old one)
        local new_instance=false
        for instance in $instances; do
            if [[ "$instance" != "$old_instance_id" ]]; then
                # Check if the corresponding node is Ready
                local private_dns=$(aws ec2 describe-instances --instance-ids "$instance" --region "$REGION" | \
                                  jq -r '.Reservations[0].Instances[0].PrivateDnsName')
                
                if [[ -n "$private_dns" && "$private_dns" != "null" ]]; then
                    local node_status=$(kubectl get node "$private_dns" -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")
                    
                    if [[ "$node_status" == "True" ]]; then
                        log "SUCCESS" "New node $private_dns is Ready"
                        new_instance=true
                        break
                    fi
                fi
            fi
        done
        
        if [[ "$new_instance" == "true" ]]; then
            break
        fi
        
        log "INFO" "Still waiting for new node to be ready... (${elapsed}s elapsed)"
        sleep 15
    done
    
    return 0
}

# Function to rotate nodes in a node group
rotate_nodegroup() {
    local nodegroup=$1
    
    log "INFO" "Starting rotation for node group $nodegroup"
    
    # Get the ASG for this node group
    local asg_name=$(get_asg_for_nodegroup "$nodegroup")
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Failed to get ASG for node group $nodegroup. Skipping rotation."
        return 1
    fi
    
    # Get instances in the ASG
    local instance_ids=$(aws autoscaling describe-auto-scaling-groups \
                        --auto-scaling-group-names "$asg_name" \
                        --region "$REGION" | \
                        jq -r '.AutoScalingGroups[0].Instances[].InstanceId')
    
    if [[ -z "$instance_ids" ]]; then
        log "WARNING" "No instances found in ASG $asg_name. Skipping rotation."
        return 0
    fi
    
    log "INFO" "Found ${instance_ids} instances in ASG $asg_name"
    
    # Track how many nodes are currently unavailable
    local unavailable_count=0
    
    # Process each instance
    for instance_id in $instance_ids; do
        # Check if we've reached the maximum unavailable nodes
        if [[ $unavailable_count -ge $MAX_UNAVAILABLE ]]; then
            log "INFO" "Reached maximum unavailable nodes ($MAX_UNAVAILABLE). Waiting for nodes to become available."
            sleep $WAIT_PERIOD
            unavailable_count=0
        fi
        
        # Get the node name from the instance ID
        local private_dns=$(aws ec2 describe-instances --instance-ids "$instance_id" --region "$REGION" | \
                          jq -r '.Reservations[0].Instances[0].PrivateDnsName')
        
        if [[ -z "$private_dns" || "$private_dns" == "null" ]]; then
            log "WARNING" "Could not get private DNS for instance $instance_id. Skipping."
            continue
        fi
        
        # Check if the node exists in Kubernetes
        if ! kubectl get node "$private_dns" &>/dev/null; then
            log "WARNING" "Node $private_dns does not exist in Kubernetes. Skipping."
            continue
        fi
        
        log "INFO" "Processing node $private_dns (instance $instance_id)"
        
        # Check if the node can be safely drained
        if ! can_drain_node_safely "$private_dns"; then
            log "WARNING" "Node $private_dns cannot be safely drained. Skipping."
            continue
        fi
        
        # Drain the node
        if ! drain_node "$private_dns"; then
            log "ERROR" "Failed to drain node $private_dns. Skipping."
            continue
        fi
        
        # Increment the unavailable count
        ((unavailable_count++))
        
        # Terminate the instance
        if ! terminate_instance "$instance_id" "$asg_name"; then
            log "ERROR" "Failed to terminate instance $instance_id. Uncordoning node $private_dns."
            kubectl uncordon "$private_dns"
            continue
        fi
        
        # Wait for a new node to be ready
        if ! wait_for_new_node "$asg_name" "$instance_id"; then
            log "ERROR" "Failed to wait for new node to replace instance $instance_id."
            continue
        fi
        
        log "SUCCESS" "Successfully rotated node $private_dns (instance $instance_id)"
    done
    
    log "SUCCESS" "Completed rotation for node group $nodegroup"
    return 0
}

# Main function
main() {
    log "INFO" "Starting Kubernetes node rotation script"
    log "INFO" "Cluster: $CLUSTER_NAME, Region: $REGION, Max Unavailable: $MAX_UNAVAILABLE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "Running in DRY RUN mode - no changes will be made"
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Check PDBs and anti-affinity rules
    check_pdbs
    check_node_anti_affinity
    
    # Get node groups to process
    local node_groups_to_process=()
    
    if [[ -n "$NODE_GROUP" ]]; then
        # Process only the specified node group
        node_groups_to_process=("$NODE_GROUP")
        log "INFO" "Processing only node group: $NODE_GROUP"
    else
        # Process all node groups
        mapfile -t node_groups_to_process < <(get_node_groups)
        log "INFO" "Processing all node groups: ${node_groups_to_process[*]}"
    fi
    
    # Process each node group
    for ng in "${node_groups_to_process[@]}"; do
        log "INFO" "Processing node group: $ng"
        rotate_nodegroup "$ng"
    done
    
    log "SUCCESS" "Node rotation completed successfully"
}

# Run the main function
main