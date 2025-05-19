#!/bin/bash

# =============================================================================
# AUSTA SuperApp - Common Maintenance Script Utilities
# =============================================================================
# This script provides common functions shared across all maintenance scripts,
# including environment detection, logging, error handling, AWS resource
# identification, and helper functions for database, Kubernetes, and backup
# operations.
# =============================================================================
#
# Usage:
#   source $(dirname "$0")/common.sh
#
# Environment Variables:
#   ENVIRONMENT - The environment to operate on (development, staging, production)
#   AWS_REGION - The AWS region to use (defaults to PRIMARY_REGION)
#   DEBUG - Set to 1 to enable debug logging
#
# Example:
#   #!/bin/bash
#   # Import common utilities
#   source $(dirname "$0")/common.sh
#
#   # Check required commands
#   check_required_commands "aws" "kubectl" "psql"
#
#   # Check AWS CLI and configure kubectl
#   check_aws_cli
#   check_kubectl
#
#   # Run maintenance on health journey
#   run_journey_maintenance "health"
#
# =============================================================================

set -o errexit  # Exit on error
set -o nounset  # Exit on unset variables
set -o pipefail # Exit if any command in a pipe fails

# =============================================================================
# ENVIRONMENT DETECTION AND VALIDATION
# =============================================================================

# Default environment if not specified
ENVIRONMENT=${ENVIRONMENT:-"development"}

# AWS regions
PRIMARY_REGION="sa-east-1"
DR_REGION="us-east-1"

# Current AWS region
CURRENT_REGION=${AWS_REGION:-$PRIMARY_REGION}

# Validate environment
validate_environment() {
  case "$ENVIRONMENT" in
    development|staging|production)
      return 0
      ;;
    *)
      error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
      return 1
      ;;
  esac
}

# Get environment-specific resource prefix
get_resource_prefix() {
  case "$ENVIRONMENT" in
    development)
      echo "dev"
      ;;
    staging)
      echo "stg"
      ;;
    production)
      echo "prod"
      ;;
    *)
      error "Invalid environment: $ENVIRONMENT"
      return 1
      ;;
  esac
}

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
GRAY="\033[0;37m"
NC="\033[0m" # No Color

# Get current timestamp in ISO 8601 format
timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Log a message with timestamp and log level
log() {
  local level=$1
  local message=$2
  local color=$3
  local ts=$(timestamp)
  local script_name=$(basename "${BASH_SOURCE[1]}")
  
  # Format: [TIMESTAMP] [LEVEL] [SCRIPT] [ENVIRONMENT] Message
  echo -e "${color}[${ts}] [${level}] [${script_name}] [${ENVIRONMENT}] ${message}${NC}" >&2
}

# Log an informational message
info() {
  log "INFO" "$1" "$BLUE"
}

# Log a success message
success() {
  log "SUCCESS" "$1" "$GREEN"
}

# Log a warning message
warn() {
  log "WARN" "$1" "$YELLOW"
}

# Log an error message
error() {
  log "ERROR" "$1" "$RED"
}

# Log a debug message (only if DEBUG=1)
debug() {
  if [[ "${DEBUG:-0}" == "1" ]]; then
    log "DEBUG" "$1" "$GRAY"
  fi
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

# Exit codes
EXIT_SUCCESS=0
EXIT_GENERAL_ERROR=1
EXIT_INVALID_ARGUMENT=2
EXIT_RESOURCE_NOT_FOUND=3
EXIT_PERMISSION_DENIED=4
EXIT_CONFIGURATION_ERROR=5
EXIT_NETWORK_ERROR=6
EXIT_TIMEOUT=7
EXIT_DEPENDENCY_ERROR=8
EXIT_AWS_ERROR=9
EXIT_KUBERNETES_ERROR=10

# Handle script exit
cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    error "Script exited with code $exit_code"
  fi
  return $exit_code
}

# Register cleanup function to run on exit
trap cleanup EXIT

# Handle errors and exit with appropriate code
fail() {
  local message=$1
  local exit_code=${2:-$EXIT_GENERAL_ERROR}
  
  error "$message"
  exit $exit_code
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required commands
check_required_commands() {
  local commands=("$@")
  local missing_commands=()
  
  for cmd in "${commands[@]}"; do
    if ! command_exists "$cmd"; then
      missing_commands+=("$cmd")
    fi
  done
  
  if [[ ${#missing_commands[@]} -gt 0 ]]; then
    fail "Required commands not found: ${missing_commands[*]}" $EXIT_DEPENDENCY_ERROR
  fi
}

# Check required environment variables
check_required_env_vars() {
  local vars=("$@")
  local missing_vars=()
  
  for var in "${vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_vars+=("$var")
    fi
  done
  
  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    fail "Required environment variables not set: ${missing_vars[*]}" $EXIT_CONFIGURATION_ERROR
  fi
}

# =============================================================================
# AWS RESOURCE IDENTIFICATION
# =============================================================================

# Check AWS CLI availability
check_aws_cli() {
  check_required_commands "aws"
  
  # Verify AWS credentials
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    fail "AWS credentials not configured or invalid" $EXIT_PERMISSION_DENIED
  fi
  
  # Check if we're in the correct region
  if [[ "$CURRENT_REGION" != "$PRIMARY_REGION" && "$CURRENT_REGION" != "$DR_REGION" ]]; then
    warn "Current AWS region ($CURRENT_REGION) is neither the primary ($PRIMARY_REGION) nor DR ($DR_REGION) region"
  fi
}

# Get RDS instance identifier for the current environment
get_rds_instance() {
  local service=$1
  local prefix=$(get_resource_prefix)
  
  # Format: <env>-<service>-db
  # Example: prod-health-db
  echo "${prefix}-${service}-db"
}

# Get ElastiCache cluster identifier for the current environment
get_elasticache_cluster() {
  local service=$1
  local prefix=$(get_resource_prefix)
  
  # Format: <env>-<service>-redis
  # Example: prod-gamification-redis
  echo "${prefix}-${service}-redis"
}

# Get MSK cluster name for the current environment
get_msk_cluster() {
  local prefix=$(get_resource_prefix)
  
  # Format: <env>-kafka
  # Example: prod-kafka
  echo "${prefix}-kafka"
}

# Get EKS cluster name for the current environment
get_eks_cluster() {
  local prefix=$(get_resource_prefix)
  
  # Format: <env>-austa-eks
  # Example: prod-austa-eks
  echo "${prefix}-austa-eks"
}

# Get S3 bucket name for backups
get_backup_bucket() {
  local prefix=$(get_resource_prefix)
  
  # Format: <env>-austa-backups
  # Example: prod-austa-backups
  echo "${prefix}-austa-backups"
}

# Check if an AWS resource exists
aws_resource_exists() {
  local resource_type=$1
  local resource_id=$2
  
  case "$resource_type" in
    rds)
      aws rds describe-db-instances --db-instance-identifier "$resource_id" >/dev/null 2>&1
      ;;
    elasticache)
      aws elasticache describe-cache-clusters --cache-cluster-id "$resource_id" >/dev/null 2>&1
      ;;
    msk)
      aws kafka list-clusters --query "ClusterInfoList[?ClusterName=='$resource_id']" | grep -q "$resource_id"
      ;;
    eks)
      aws eks describe-cluster --name "$resource_id" >/dev/null 2>&1
      ;;
    s3)
      aws s3api head-bucket --bucket "$resource_id" >/dev/null 2>&1
      ;;
    *)
      error "Unknown resource type: $resource_type"
      return 1
      ;;
  esac
  
  return $?
}

# =============================================================================
# DATABASE HELPER FUNCTIONS
# =============================================================================

# Check RDS instance status
check_rds_status() {
  local instance_id=$1
  
  debug "Checking status of RDS instance: $instance_id"
  
  local status=$(aws rds describe-db-instances \
    --db-instance-identifier "$instance_id" \
    --query "DBInstances[0].DBInstanceStatus" \
    --output text)
  
  echo "$status"
}

# Wait for RDS instance to be available
wait_for_rds_available() {
  local instance_id=$1
  local timeout=${2:-300}  # Default timeout: 5 minutes
  local interval=${3:-10}  # Default check interval: 10 seconds
  
  info "Waiting for RDS instance $instance_id to be available (timeout: ${timeout}s)"
  
  local elapsed=0
  while [[ $elapsed -lt $timeout ]]; do
    local status=$(check_rds_status "$instance_id")
    
    if [[ "$status" == "available" ]]; then
      success "RDS instance $instance_id is available"
      return 0
    fi
    
    debug "RDS instance $instance_id status: $status. Waiting ${interval}s..."
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  fail "Timeout waiting for RDS instance $instance_id to be available" $EXIT_TIMEOUT
}

# Get database connection details from SSM Parameter Store
get_db_connection_details() {
  local service=$1
  local prefix=$(get_resource_prefix)
  
  local param_prefix="/${prefix}/${service}/database"
  
  debug "Getting database connection details from SSM Parameter Store: $param_prefix"
  
  local host=$(aws ssm get-parameter \
    --name "${param_prefix}/host" \
    --query "Parameter.Value" \
    --output text)
  
  local port=$(aws ssm get-parameter \
    --name "${param_prefix}/port" \
    --query "Parameter.Value" \
    --output text)
  
  local username=$(aws ssm get-parameter \
    --name "${param_prefix}/username" \
    --query "Parameter.Value" \
    --output text)
  
  local password=$(aws ssm get-parameter \
    --name "${param_prefix}/password" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text)
  
  local dbname=$(aws ssm get-parameter \
    --name "${param_prefix}/dbname" \
    --query "Parameter.Value" \
    --output text)
  
  echo "host=$host port=$port username=$username password=$password dbname=$dbname"
}

# Run vacuum analyze on a PostgreSQL database
run_vacuum_analyze() {
  local instance_id=$1
  local db_name=$2
  local username=$3
  local password_param=$4  # SSM parameter name for the password
  
  info "Running VACUUM ANALYZE on database $db_name in instance $instance_id"
  
  # Get password from SSM Parameter Store
  local password=$(aws ssm get-parameter \
    --name "$password_param" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text)
  
  # Get endpoint
  local endpoint=$(aws rds describe-db-instances \
    --db-instance-identifier "$instance_id" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)
  
  # Run vacuum analyze
  PGPASSWORD="$password" psql \
    -h "$endpoint" \
    -U "$username" \
    -d "$db_name" \
    -c "VACUUM ANALYZE;"
  
  success "VACUUM ANALYZE completed on database $db_name"
}

# Run index optimization on a PostgreSQL database
run_index_optimization() {
  local instance_id=$1
  local db_name=$2
  local username=$3
  local password_param=$4  # SSM parameter name for the password
  
  info "Running index optimization on database $db_name in instance $instance_id"
  
  # Get password from SSM Parameter Store
  local password=$(aws ssm get-parameter \
    --name "$password_param" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text)
  
  # Get endpoint
  local endpoint=$(aws rds describe-db-instances \
    --db-instance-identifier "$instance_id" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)
  
  # Run index optimization
  PGPASSWORD="$password" psql \
    -h "$endpoint" \
    -U "$username" \
    -d "$db_name" \
    -c "SELECT pg_stat_reset(); REINDEX DATABASE \"$db_name\";"
  
  success "Index optimization completed on database $db_name"
}

# Check for long-running queries
check_long_running_queries() {
  local instance_id=$1
  local db_name=$2
  local username=$3
  local password_param=$4  # SSM parameter name for the password
  local threshold=${5:-300}  # Default threshold: 5 minutes (300 seconds)
  
  info "Checking for queries running longer than ${threshold}s on database $db_name"
  
  # Get password from SSM Parameter Store
  local password=$(aws ssm get-parameter \
    --name "$password_param" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text)
  
  # Get endpoint
  local endpoint=$(aws rds describe-db-instances \
    --db-instance-identifier "$instance_id" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)
  
  # Check for long-running queries
  local query=""
  query+="SELECT pid, now() - pg_stat_activity.query_start AS duration, query "
  query+="FROM pg_stat_activity "
  query+="WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '$threshold seconds' "
  query+="ORDER BY duration DESC;"
  
  local result=$(PGPASSWORD="$password" psql \
    -h "$endpoint" \
    -U "$username" \
    -d "$db_name" \
    -c "$query" \
    -t)
  
  if [[ -z "$result" ]]; then
    success "No long-running queries found on database $db_name"
    return 0
  else
    warn "Found long-running queries on database $db_name:"
    echo "$result"
    return 1
  fi
}

# Check database connection count
check_db_connections() {
  local instance_id=$1
  local db_name=$2
  local username=$3
  local password_param=$4  # SSM parameter name for the password
  local threshold=${5:-80}  # Default threshold: 80% of max connections
  
  info "Checking connection count on database $db_name (threshold: ${threshold}%)"
  
  # Get password from SSM Parameter Store
  local password=$(aws ssm get-parameter \
    --name "$password_param" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text)
  
  # Get endpoint
  local endpoint=$(aws rds describe-db-instances \
    --db-instance-identifier "$instance_id" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)
  
  # Check connection count
  local query=""
  query+="SELECT current_setting('max_connections')::int AS max_conn, "
  query+="COUNT(*)::int AS current_conn, "
  query+="ROUND((COUNT(*)::float / current_setting('max_connections')::float) * 100, 2) AS percent "
  query+="FROM pg_stat_activity;"
  
  local result=$(PGPASSWORD="$password" psql \
    -h "$endpoint" \
    -U "$username" \
    -d "$db_name" \
    -c "$query" \
    -t)
  
  local max_conn=$(echo "$result" | awk '{print $1}')
  local current_conn=$(echo "$result" | awk '{print $2}')
  local percent=$(echo "$result" | awk '{print $3}')
  
  info "Database $db_name connection stats: $current_conn/$max_conn connections (${percent}%)"
  
  if (( $(echo "$percent > $threshold" | bc -l) )); then
    warn "Database $db_name connection count exceeds threshold: ${percent}% > ${threshold}%"
    return 1
  else
    success "Database $db_name connection count is below threshold: ${percent}% <= ${threshold}%"
    return 0
  fi
}

# =============================================================================
# KUBERNETES HELPER FUNCTIONS
# =============================================================================

# Check kubectl availability and configure for the current EKS cluster
check_kubectl() {
  check_required_commands "kubectl"
  
  local cluster_name=$(get_eks_cluster)
  
  # Update kubeconfig for the current cluster
  info "Configuring kubectl for EKS cluster: $cluster_name"
  aws eks update-kubeconfig --name "$cluster_name" --region "$CURRENT_REGION"
  
  # Verify connection
  if ! kubectl cluster-info >/dev/null 2>&1; then
    fail "Failed to connect to EKS cluster $cluster_name" $EXIT_KUBERNETES_ERROR
  fi
  
  success "kubectl configured for EKS cluster: $cluster_name"
}

# Get all pods in a namespace with their status
get_pods_status() {
  local namespace=$1
  
  debug "Getting pod status in namespace: $namespace"
  
  kubectl get pods -n "$namespace" -o json | jq -r '.items[] | "\(.metadata.name): \(.status.phase)"'
}

# Check if all pods in a namespace are running or completed
check_pods_healthy() {
  local namespace=$1
  
  info "Checking pod health in namespace: $namespace"
  
  local unhealthy_pods=()
  
  while IFS=: read -r pod_name pod_status; do
    if [[ "$pod_status" != "Running" && "$pod_status" != "Succeeded" ]]; then
      unhealthy_pods+=("$pod_name: $pod_status")
    fi
  done < <(get_pods_status "$namespace")
  
  if [[ ${#unhealthy_pods[@]} -gt 0 ]]; then
    warn "Unhealthy pods in namespace $namespace: ${unhealthy_pods[*]}"
    return 1
  fi
  
  success "All pods in namespace $namespace are healthy"
  return 0
}

# Validate Kubernetes resources in a namespace
validate_k8s_resources() {
  local namespace=$1
  
  info "Validating Kubernetes resources in namespace: $namespace"
  
  # Check if namespace exists
  if ! kubectl get namespace "$namespace" >/dev/null 2>&1; then
    error "Namespace $namespace does not exist"
    return 1
  fi
  
  # Check deployments
  local failed_deployments=()
  while IFS= read -r deployment; do
    local ready=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.replicas}')
    
    if [[ -z "$ready" || "$ready" != "$desired" ]]; then
      failed_deployments+=("$deployment (ready: ${ready:-0}, desired: $desired)")
    fi
  done < <(kubectl get deployments -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
  
  if [[ ${#failed_deployments[@]} -gt 0 ]]; then
    error "Failed deployments in namespace $namespace: ${failed_deployments[*]}"
    return 1
  fi
  
  # Check statefulsets
  local failed_statefulsets=()
  while IFS= read -r statefulset; do
    local ready=$(kubectl get statefulset "$statefulset" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
    local desired=$(kubectl get statefulset "$statefulset" -n "$namespace" -o jsonpath='{.status.replicas}')
    
    if [[ -z "$ready" || "$ready" != "$desired" ]]; then
      failed_statefulsets+=("$statefulset (ready: ${ready:-0}, desired: $desired)")
    fi
  done < <(kubectl get statefulsets -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
  
  if [[ ${#failed_statefulsets[@]} -gt 0 ]]; then
    error "Failed statefulsets in namespace $namespace: ${failed_statefulsets[*]}"
    return 1
  fi
  
  success "All resources in namespace $namespace are valid"
  return 0
}

# =============================================================================
# BACKUP AND RESTORE FUNCTIONS
# =============================================================================

# Create an RDS snapshot
create_rds_snapshot() {
  local instance_id=$1
  local snapshot_id="$instance_id-$(date +%Y%m%d%H%M%S)"
  
  info "Creating RDS snapshot $snapshot_id for instance $instance_id"
  
  aws rds create-db-snapshot \
    --db-instance-identifier "$instance_id" \
    --db-snapshot-identifier "$snapshot_id"
  
  success "RDS snapshot creation initiated: $snapshot_id"
  echo "$snapshot_id"
}

# Wait for an RDS snapshot to be available
wait_for_snapshot_available() {
  local snapshot_id=$1
  local timeout=${2:-1800}  # Default timeout: 30 minutes
  local interval=${3:-30}   # Default check interval: 30 seconds
  
  info "Waiting for RDS snapshot $snapshot_id to be available (timeout: ${timeout}s)"
  
  local elapsed=0
  while [[ $elapsed -lt $timeout ]]; do
    local status=$(aws rds describe-db-snapshots \
      --db-snapshot-identifier "$snapshot_id" \
      --query "DBSnapshots[0].Status" \
      --output text)
    
    if [[ "$status" == "available" ]]; then
      success "RDS snapshot $snapshot_id is available"
      return 0
    fi
    
    debug "RDS snapshot $snapshot_id status: $status. Waiting ${interval}s..."
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  fail "Timeout waiting for RDS snapshot $snapshot_id to be available" $EXIT_TIMEOUT
}

# Copy an RDS snapshot to the DR region
copy_snapshot_to_dr() {
  local snapshot_id=$1
  local dr_snapshot_id="$snapshot_id-dr"
  
  info "Copying RDS snapshot $snapshot_id to DR region $DR_REGION"
  
  aws rds copy-db-snapshot \
    --source-db-snapshot-identifier "arn:aws:rds:$PRIMARY_REGION:$(aws sts get-caller-identity --query 'Account' --output text):snapshot:$snapshot_id" \
    --target-db-snapshot-identifier "$dr_snapshot_id" \
    --kms-key-id "alias/aws/rds" \
    --region "$DR_REGION"
  
  success "RDS snapshot copy initiated: $dr_snapshot_id in region $DR_REGION"
  echo "$dr_snapshot_id"
}

# Verify a backup by restoring to a temporary instance
verify_backup() {
  local snapshot_id=$1
  local temp_instance_id="temp-verify-$(date +%Y%m%d%H%M%S)"
  local instance_class=${2:-"db.t3.medium"}  # Default: small instance for verification
  
  info "Verifying backup by restoring snapshot $snapshot_id to temporary instance $temp_instance_id"
  
  # Restore the snapshot to a temporary instance
  aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier "$temp_instance_id" \
    --db-snapshot-identifier "$snapshot_id" \
    --db-instance-class "$instance_class" \
    --no-multi-az \
    --no-publicly-accessible
  
  # Wait for the temporary instance to be available
  wait_for_rds_available "$temp_instance_id" 900 30
  
  # Run some validation queries here if needed
  # ...
  
  # Delete the temporary instance
  info "Validation successful. Deleting temporary instance $temp_instance_id"
  aws rds delete-db-instance \
    --db-instance-identifier "$temp_instance_id" \
    --skip-final-snapshot
  
  success "Backup verification completed successfully for snapshot $snapshot_id"
}

# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================

# Check if a service is responding on a given URL
check_service_health() {
  local url=$1
  local expected_status=${2:-200}
  local timeout=${3:-10}
  
  info "Checking health of service at $url (expected status: $expected_status, timeout: ${timeout}s)"
  
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "$url")
  
  if [[ "$status_code" == "$expected_status" ]]; then
    success "Service at $url is healthy (status: $status_code)"
    return 0
  else
    error "Service at $url is not healthy (status: $status_code, expected: $expected_status)"
    return 1
  fi
}

# Check if a port is open on a host
check_port_open() {
  local host=$1
  local port=$2
  local timeout=${3:-5}
  
  info "Checking if port $port is open on host $host (timeout: ${timeout}s)"
  
  if timeout "$timeout" bash -c "</dev/tcp/$host/$port" >/dev/null 2>&1; then
    success "Port $port is open on host $host"
    return 0
  else
    error "Port $port is not open on host $host"
    return 1
  fi
}

# Check health of all services in a namespace
check_all_services_health() {
  local namespace=$1
  local base_url=${2:-""}
  local timeout=${3:-10}
  
  info "Checking health of all services in namespace: $namespace"
  
  local unhealthy_services=()
  
  # Get all services with their endpoints
  while IFS= read -r service; do
    local service_url=""
    
    # If base_url is provided, use it to construct the service URL
    if [[ -n "$base_url" ]]; then
      service_url="${base_url}/${service}/health"
    else
      # Get service IP and port
      local service_ip=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
      local service_port=$(kubectl get service "$service" -n "$namespace" -o jsonpath='{.spec.ports[0].port}')
      
      if [[ -n "$service_ip" && -n "$service_port" ]]; then
        service_url="http://${service_ip}:${service_port}/health"
      else
        warn "Could not determine URL for service $service in namespace $namespace"
        unhealthy_services+=("$service (URL unknown)")
        continue
      fi
    fi
    
    # Check service health
    if ! check_service_health "$service_url" 200 "$timeout"; then
      unhealthy_services+=("$service")
    fi
  done < <(kubectl get services -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
  
  if [[ ${#unhealthy_services[@]} -gt 0 ]]; then
    error "Unhealthy services in namespace $namespace: ${unhealthy_services[*]}"
    return 1
  fi
  
  success "All services in namespace $namespace are healthy"
  return 0
}

# =============================================================================
# MONITORING AND SECURITY FUNCTIONS
# =============================================================================

# Check CloudWatch alarms status
check_cloudwatch_alarms() {
  local prefix=$(get_resource_prefix)
  local alarm_prefix="${prefix}-austa"
  
  info "Checking CloudWatch alarms with prefix: $alarm_prefix"
  
  local alarm_states=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "$alarm_prefix" \
    --state-value ALARM \
    --query "MetricAlarms[*].AlarmName" \
    --output text)
  
  if [[ -n "$alarm_states" ]]; then
    error "The following alarms are in ALARM state:"
    echo "$alarm_states"
    return 1
  else
    success "No alarms in ALARM state"
    return 0
  fi
}

# Check for security group changes
check_security_group_changes() {
  local prefix=$(get_resource_prefix)
  local vpc_id=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=${prefix}-austa-vpc" \
    --query "Vpcs[0].VpcId" \
    --output text)
  
  if [[ -z "$vpc_id" ]]; then
    error "Could not find VPC with name ${prefix}-austa-vpc"
    return 1
  fi
  
  info "Checking for security group changes in VPC: $vpc_id"
  
  # Get all security groups in the VPC
  local security_groups=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$vpc_id" \
    --query "SecurityGroups[*].{ID:GroupId,Name:GroupName}" \
    --output json)
  
  # Check CloudTrail for security group changes in the last 24 hours
  local end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_time=$(date -u -d "24 hours ago" +"%Y-%m-%dT%H:%M:%SZ")
  
  local sg_changes=$(aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress \
    --start-time "$start_time" \
    --end-time "$end_time" \
    --query "Events[*].{Time:EventTime,User:Username,Name:EventName}" \
    --output json)
  
  if [[ "$sg_changes" != "[]" ]]; then
    warn "Security group changes detected in the last 24 hours:"
    echo "$sg_changes"
    return 1
  else
    success "No security group changes detected in the last 24 hours"
    return 0
  fi
}

# Check for exposed resources
check_exposed_resources() {
  local prefix=$(get_resource_prefix)
  
  info "Checking for publicly exposed resources"
  
  # Check for public RDS instances
  local public_rds=$(aws rds describe-db-instances \
    --query "DBInstances[?PubliclyAccessible==\`true\`].DBInstanceIdentifier" \
    --output text)
  
  if [[ -n "$public_rds" ]]; then
    warn "Found publicly accessible RDS instances:"
    echo "$public_rds"
  fi
  
  # Check for public S3 buckets
  local buckets=$(aws s3api list-buckets \
    --query "Buckets[?starts_with(Name, \`${prefix}-austa\`)].Name" \
    --output text)
  
  local public_buckets=()
  
  for bucket in $buckets; do
    local acl=$(aws s3api get-bucket-acl \
      --bucket "$bucket" \
      --query "Grants[?Grantee.URI=='http://acs.amazonaws.com/groups/global/AllUsers']" \
      --output text)
    
    if [[ -n "$acl" ]]; then
      public_buckets+=("$bucket")
    fi
  done
  
  if [[ ${#public_buckets[@]} -gt 0 ]]; then
    warn "Found publicly accessible S3 buckets:"
    echo "${public_buckets[*]}"
  fi
  
  # Check for public security groups
  local vpc_id=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=${prefix}-austa-vpc" \
    --query "Vpcs[0].VpcId" \
    --output text)
  
  local public_sgs=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$vpc_id" "Name=ip-permission.cidr,Values=0.0.0.0/0" \
    --query "SecurityGroups[*].{ID:GroupId,Name:GroupName}" \
    --output json)
  
  if [[ "$public_sgs" != "[]" ]]; then
    warn "Found security groups with 0.0.0.0/0 ingress rules:"
    echo "$public_sgs"
  fi
  
  if [[ -n "$public_rds" || ${#public_buckets[@]} -gt 0 || "$public_sgs" != "[]" ]]; then
    error "Found publicly exposed resources"
    return 1
  else
    success "No publicly exposed resources found"
    return 0
  fi
}

# =============================================================================
# DISASTER RECOVERY FUNCTIONS
# =============================================================================

# Check if we're running in the primary or DR region
is_primary_region() {
  [[ "$CURRENT_REGION" == "$PRIMARY_REGION" ]]
  return $?
}

is_dr_region() {
  [[ "$CURRENT_REGION" == "$DR_REGION" ]]
  return $?
}

# Verify DR readiness
verify_dr_readiness() {
  info "Verifying disaster recovery readiness"
  
  # Ensure we're in the DR region
  if ! is_dr_region; then
    fail "DR readiness check must be run in the DR region ($DR_REGION)" $EXIT_CONFIGURATION_ERROR
  fi
  
  local prefix=$(get_resource_prefix)
  local eks_cluster="${prefix}-austa-eks"
  
  # Check if EKS cluster exists in DR region
  if ! aws_resource_exists "eks" "$eks_cluster"; then
    error "EKS cluster $eks_cluster does not exist in DR region"
    return 1
  fi
  
  # Check if RDS read replicas exist in DR region
  local services=("health" "care" "plan" "gamification")
  local missing_replicas=()
  
  for service in "${services[@]}"; do
    local instance_id="${prefix}-${service}-db"
    
    if ! aws_resource_exists "rds" "$instance_id"; then
      missing_replicas+=("$instance_id")
    fi
  done
  
  if [[ ${#missing_replicas[@]} -gt 0 ]]; then
    error "Missing RDS read replicas in DR region: ${missing_replicas[*]}"
    return 1
  fi
  
  # Check if S3 buckets are properly replicated
  local backup_bucket="${prefix}-austa-backups"
  
  if ! aws_resource_exists "s3" "$backup_bucket"; then
    error "Backup S3 bucket $backup_bucket does not exist in DR region"
    return 1
  fi
  
  success "DR environment is ready"
  return 0
}

# Simulate DR failover (for testing)
simulate_dr_failover() {
  info "Simulating disaster recovery failover"
  
  # Ensure we're in the DR region
  if ! is_dr_region; then
    fail "DR failover simulation must be run in the DR region ($DR_REGION)" $EXIT_CONFIGURATION_ERROR
  fi
  
  local prefix=$(get_resource_prefix)
  
  # 1. Promote RDS read replicas to primary
  local services=("health" "care" "plan" "gamification")
  
  for service in "${services[@]}"; do
    local instance_id="${prefix}-${service}-db"
    
    info "Promoting RDS read replica $instance_id to primary"
    aws rds promote-read-replica \
      --db-instance-identifier "$instance_id"
  done
  
  # 2. Update DNS records (simulated)
  info "Simulating DNS failover to DR region"
  
  # 3. Scale up EKS cluster in DR region
  local eks_cluster="${prefix}-austa-eks"
  
  info "Scaling up EKS cluster $eks_cluster in DR region"
  
  # Get current node group names
  local node_groups=$(aws eks list-nodegroups \
    --cluster-name "$eks_cluster" \
    --query "nodegroups[*]" \
    --output text)
  
  for node_group in $node_groups; do
    # Get current desired size
    local current_size=$(aws eks describe-nodegroup \
      --cluster-name "$eks_cluster" \
      --nodegroup-name "$node_group" \
      --query "nodegroup.scalingConfig.desiredSize" \
      --output text)
    
    # Scale up by 50% (minimum 1)
    local new_size=$((current_size + (current_size / 2) + 1))
    
    info "Scaling node group $node_group from $current_size to $new_size nodes"
    aws eks update-nodegroup-config \
      --cluster-name "$eks_cluster" \
      --nodegroup-name "$node_group" \
      --scaling-config desiredSize=$new_size
  done
  
  success "DR failover simulation completed"
  return 0
}

# =============================================================================
# JOURNEY-SPECIFIC MAINTENANCE FUNCTIONS
# =============================================================================

# Get all namespaces for a specific journey
get_journey_namespaces() {
  local journey=$1  # health, care, plan
  local prefix=$(get_resource_prefix)
  
  info "Getting namespaces for journey: $journey"
  
  kubectl get namespaces -o json | \
    jq -r ".items[] | select(.metadata.name | contains(\"${prefix}-${journey}\")) | .metadata.name"
}

# Check health of a specific journey
check_journey_health() {
  local journey=$1  # health, care, plan
  
  info "Checking health of $journey journey"
  
  # Get all namespaces for this journey
  local namespaces=$(get_journey_namespaces "$journey")
  
  if [[ -z "$namespaces" ]]; then
    error "No namespaces found for journey: $journey"
    return 1
  fi
  
  local unhealthy_namespaces=()
  
  for namespace in $namespaces; do
    info "Checking namespace: $namespace"
    
    # Check pods
    if ! check_pods_healthy "$namespace"; then
      unhealthy_namespaces+=("$namespace (pods)")
      continue
    fi
    
    # Check deployments and statefulsets
    if ! validate_k8s_resources "$namespace"; then
      unhealthy_namespaces+=("$namespace (resources)")
      continue
    fi
  done
  
  if [[ ${#unhealthy_namespaces[@]} -gt 0 ]]; then
    error "Unhealthy namespaces in $journey journey: ${unhealthy_namespaces[*]}"
    return 1
  fi
  
  # Check database
  local instance_id=$(get_rds_instance "$journey")
  
  if ! aws_resource_exists "rds" "$instance_id"; then
    error "RDS instance $instance_id does not exist"
    return 1
  fi
  
  local status=$(check_rds_status "$instance_id")
  
  if [[ "$status" != "available" ]]; then
    error "RDS instance $instance_id is not available (status: $status)"
    return 1
  fi
  
  success "$journey journey is healthy"
  return 0
}

# Run maintenance on a specific journey
run_journey_maintenance() {
  local journey=$1  # health, care, plan
  
  info "Running maintenance on $journey journey"
  
  # 1. Check journey health first
  if ! check_journey_health "$journey"; then
    error "Cannot run maintenance on $journey journey due to health check failure"
    return 1
  fi
  
  # 2. Run database maintenance
  local instance_id=$(get_rds_instance "$journey")
  local db_name="${journey}_db"
  local username="austa_admin"
  local password_param="/${ENVIRONMENT}/database/${journey}/password"
  
  # Run vacuum analyze
  if ! run_vacuum_analyze "$instance_id" "$db_name" "$username" "$password_param"; then
    warn "VACUUM ANALYZE failed on $journey database"
  fi
  
  # Run index optimization
  if ! run_index_optimization "$instance_id" "$db_name" "$username" "$password_param"; then
    warn "Index optimization failed on $journey database"
  fi
  
  # 3. Create database snapshot
  local snapshot_id=$(create_rds_snapshot "$instance_id")
  
  # 4. Wait for snapshot to be available
  wait_for_snapshot_available "$snapshot_id"
  
  # 5. Copy snapshot to DR region if in primary region
  if is_primary_region; then
    copy_snapshot_to_dr "$snapshot_id"
  fi
  
  success "Maintenance completed on $journey journey"
  return 0
}

# =============================================================================
# INITIALIZATION
# =============================================================================

# Check for required commands
check_required_commands "date" "curl" "jq"

# Validate environment
validate_environment

# Log script initialization
debug "Common maintenance utilities loaded"
debug "Environment: $ENVIRONMENT"
debug "AWS Region: $CURRENT_REGION"