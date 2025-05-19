#!/bin/bash

#############################################################################
# AUSTA SuperApp - Disaster Recovery Drill Script
#
# This script performs a quarterly disaster recovery drill by simulating
# a regional failure in the primary region (sa-east-1) and validating
# the failover to the DR region (us-east-1).
#
# The script tests:
# - Cross-region database replicas
# - S3 cross-region replication
# - Application functionality in the DR region
# - Generates a comprehensive DR readiness report
#
# Usage: ./dr-drill.sh [--no-report] [--help]
#   --no-report: Skip generating the HTML report
#   --help: Display this help message
#
# Requirements:
# - AWS CLI configured with appropriate permissions
# - kubectl configured with access to both primary and DR EKS clusters
# - jq for JSON processing
# - PostgreSQL client tools
#
# Author: AUSTA DevOps Team
# Last Updated: 2023-05-19
#############################################################################

set -e

# Configuration
PRIMARY_REGION="sa-east-1"
DR_REGION="us-east-1"
PRIMARY_CLUSTER="austa-superapp-cluster"
DR_CLUSTER="austa-superapp-dr-cluster"
S3_BUCKET_PREFIX="austa-superapp-documents"
RDS_INSTANCE_PREFIX="austa-db"
REPORT_DIR="./dr-reports"
REPORT_FILE="${REPORT_DIR}/dr-drill-report-$(date +%Y%m%d).html"
LOG_FILE="${REPORT_DIR}/dr-drill-$(date +%Y%m%d).log"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX"

# Journey services to test
JOURNEY_SERVICES=(
  "health-service"
  "care-service"
  "plan-service"
  "gamification-engine"
  "notification-service"
  "auth-service"
  "api-gateway"
)

# Test endpoints for each service
DECLARE -A SERVICE_ENDPOINTS
SERVICE_ENDPOINTS["health-service"]="/api/health/status"
SERVICE_ENDPOINTS["care-service"]="/api/care/status"
SERVICE_ENDPOINTS["plan-service"]="/api/plan/status"
SERVICE_ENDPOINTS["gamification-engine"]="/api/gamification/status"
SERVICE_ENDPOINTS["notification-service"]="/api/notifications/status"
SERVICE_ENDPOINTS["auth-service"]="/api/auth/status"
SERVICE_ENDPOINTS["api-gateway"]="/api/status"

# Initialize variables
GENERATE_REPORT=true
DRILL_START_TIME=$(date +%s)
TEST_RESULTS=()  # Array to store test results
OVERALL_STATUS="PASSED"

# Process command line arguments
for arg in "$@"; do
  case $arg in
    --no-report)
      GENERATE_REPORT=false
      shift
      ;;
    --help)
      echo "Usage: ./dr-drill.sh [--no-report] [--help]"
      echo "  --no-report: Skip generating the HTML report"
      echo "  --help: Display this help message"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Create report directory if it doesn't exist
mkdir -p "${REPORT_DIR}"

# Start logging
exec > >(tee -a "${LOG_FILE}") 2>&1

# Helper functions
log() {
  local level=$1
  local message=$2
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] [${level}] ${message}"
}

log_test_result() {
  local test_name=$1
  local status=$2
  local details=$3
  local duration=$4
  
  TEST_RESULTS+=("${test_name}|${status}|${details}|${duration}")
  
  if [[ "${status}" == "FAILED" ]]; then
    OVERALL_STATUS="FAILED"
  fi
  
  log "INFO" "Test: ${test_name} - Status: ${status} - Duration: ${duration}s"
  if [[ -n "${details}" ]]; then
    log "INFO" "Details: ${details}"
  fi
}

send_slack_notification() {
  local message=$1
  local color=$2
  
  if [[ -z "${SLACK_WEBHOOK_URL}" || "${SLACK_WEBHOOK_URL}" == *"XXXXXXXX"* ]]; then
    log "WARN" "Slack webhook URL not configured. Skipping notification."
    return
  fi
  
  curl -s -X POST -H 'Content-type: application/json' \
    --data "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${message}\"}]}" \
    "${SLACK_WEBHOOK_URL}"
}

check_prerequisites() {
  log "INFO" "Checking prerequisites..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    status="FAILED"
    details+="AWS CLI not found. "
  else
    aws --version >> "${LOG_FILE}" 2>&1
  fi
  
  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    status="FAILED"
    details+="kubectl not found. "
  else
    kubectl version --client >> "${LOG_FILE}" 2>&1
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    status="FAILED"
    details+="jq not found. "
  else
    jq --version >> "${LOG_FILE}" 2>&1
  fi
  
  # Check psql
  if ! command -v psql &> /dev/null; then
    status="FAILED"
    details+="PostgreSQL client not found. "
  else
    psql --version >> "${LOG_FILE}" 2>&1
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "Prerequisites Check" "${status}" "${details}" "${duration}"
  
  if [[ "${status}" == "FAILED" ]]; then
    log "ERROR" "Prerequisites check failed. Please install the required tools."
    exit 1
  fi
}

check_aws_regions() {
  log "INFO" "Checking AWS regions..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Check primary region
  if ! aws ec2 describe-regions --region "${PRIMARY_REGION}" &> /dev/null; then
    status="FAILED"
    details+="Primary region ${PRIMARY_REGION} not accessible. "
  fi
  
  # Check DR region
  if ! aws ec2 describe-regions --region "${DR_REGION}" &> /dev/null; then
    status="FAILED"
    details+="DR region ${DR_REGION} not accessible. "
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "AWS Regions Check" "${status}" "${details}" "${duration}"
  
  if [[ "${status}" == "FAILED" ]]; then
    log "ERROR" "AWS regions check failed. Please check your AWS credentials and region configuration."
    exit 1
  fi
}

check_eks_clusters() {
  log "INFO" "Checking EKS clusters..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Check primary cluster
  if ! aws eks describe-cluster --name "${PRIMARY_CLUSTER}" --region "${PRIMARY_REGION}" &> /dev/null; then
    status="FAILED"
    details+="Primary EKS cluster ${PRIMARY_CLUSTER} not found in ${PRIMARY_REGION}. "
  else
    log "INFO" "Primary EKS cluster ${PRIMARY_CLUSTER} found in ${PRIMARY_REGION}."
  fi
  
  # Check DR cluster
  if ! aws eks describe-cluster --name "${DR_CLUSTER}" --region "${DR_REGION}" &> /dev/null; then
    status="FAILED"
    details+="DR EKS cluster ${DR_CLUSTER} not found in ${DR_REGION}. "
  else
    log "INFO" "DR EKS cluster ${DR_CLUSTER} found in ${DR_REGION}."
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "EKS Clusters Check" "${status}" "${details}" "${duration}"
  
  if [[ "${status}" == "FAILED" ]]; then
    log "ERROR" "EKS clusters check failed. Please check your EKS cluster configuration."
    exit 1
  fi
}

update_kubeconfig() {
  log "INFO" "Updating kubeconfig for both clusters..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Update kubeconfig for primary cluster
  if ! aws eks update-kubeconfig --name "${PRIMARY_CLUSTER}" --region "${PRIMARY_REGION}" --alias "primary" &> /dev/null; then
    status="FAILED"
    details+="Failed to update kubeconfig for primary cluster. "
  fi
  
  # Update kubeconfig for DR cluster
  if ! aws eks update-kubeconfig --name "${DR_CLUSTER}" --region "${DR_REGION}" --alias "dr" &> /dev/null; then
    status="FAILED"
    details+="Failed to update kubeconfig for DR cluster. "
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "Kubeconfig Update" "${status}" "${details}" "${duration}"
  
  if [[ "${status}" == "FAILED" ]]; then
    log "ERROR" "Failed to update kubeconfig. Please check your AWS credentials and EKS configuration."
    exit 1
  fi
}

check_s3_replication() {
  log "INFO" "Checking S3 cross-region replication..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  local test_file="dr-test-$(date +%s).txt"
  local primary_bucket="${S3_BUCKET_PREFIX}-${PRIMARY_REGION}"
  local dr_bucket="${S3_BUCKET_PREFIX}-${DR_REGION}"
  
  # Create a test file
  echo "DR test file created at $(date)" > "/tmp/${test_file}"
  
  # Upload to primary bucket
  if ! aws s3 cp "/tmp/${test_file}" "s3://${primary_bucket}/dr-tests/${test_file}" --region "${PRIMARY_REGION}" &> /dev/null; then
    status="FAILED"
    details+="Failed to upload test file to primary bucket. "
  else
    log "INFO" "Uploaded test file to primary bucket s3://${primary_bucket}/dr-tests/${test_file}"
    
    # Wait for replication (up to 2 minutes)
    log "INFO" "Waiting for S3 replication to complete (up to 2 minutes)..."
    local max_attempts=12
    local attempt=0
    local replicated=false
    
    while [[ ${attempt} -lt ${max_attempts} && ${replicated} == false ]]; do
      if aws s3 ls "s3://${dr_bucket}/dr-tests/${test_file}" --region "${DR_REGION}" &> /dev/null; then
        replicated=true
        log "INFO" "Test file successfully replicated to DR bucket."
      else
        attempt=$((attempt + 1))
        log "INFO" "Waiting for replication... Attempt ${attempt}/${max_attempts}"
        sleep 10
      fi
    done
    
    if [[ ${replicated} == false ]]; then
      status="FAILED"
      details+="Test file not replicated to DR bucket within timeout period. "
    else
      # Verify file content
      local dr_content=$(aws s3 cp "s3://${dr_bucket}/dr-tests/${test_file}" - --region "${DR_REGION}" 2>/dev/null)
      local original_content=$(cat "/tmp/${test_file}")
      
      if [[ "${dr_content}" != "${original_content}" ]]; then
        status="FAILED"
        details+="Replicated file content does not match original. "
      fi
    fi
  fi
  
  # Clean up
  rm -f "/tmp/${test_file}"
  aws s3 rm "s3://${primary_bucket}/dr-tests/${test_file}" --region "${PRIMARY_REGION}" &> /dev/null || true
  aws s3 rm "s3://${dr_bucket}/dr-tests/${test_file}" --region "${DR_REGION}" &> /dev/null || true
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "S3 Cross-Region Replication" "${status}" "${details}" "${duration}"
}

check_rds_replication() {
  log "INFO" "Checking RDS cross-region replication..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Get primary RDS instance
  local primary_rds_instance=$(aws rds describe-db-instances \
    --region "${PRIMARY_REGION}" \
    --query "DBInstances[?starts_with(DBInstanceIdentifier, '${RDS_INSTANCE_PREFIX}')].DBInstanceIdentifier" \
    --output text)
  
  if [[ -z "${primary_rds_instance}" ]]; then
    status="FAILED"
    details+="Primary RDS instance not found. "
  else
    log "INFO" "Found primary RDS instance: ${primary_rds_instance}"
    
    # Get read replica in DR region
    local dr_rds_instance=$(aws rds describe-db-instances \
      --region "${DR_REGION}" \
      --query "DBInstances[?starts_with(DBInstanceIdentifier, '${RDS_INSTANCE_PREFIX}')].DBInstanceIdentifier" \
      --output text)
    
    if [[ -z "${dr_rds_instance}" ]]; then
      status="FAILED"
      details+="DR region RDS instance not found. "
    else
      log "INFO" "Found DR RDS instance: ${dr_rds_instance}"
      
      # Check replication status
      local replication_status=$(aws rds describe-db-instances \
        --region "${DR_REGION}" \
        --db-instance-identifier "${dr_rds_instance}" \
        --query "DBInstances[0].StatusInfos[?StatusType=='ReadReplicaStatus'].Status" \
        --output text)
      
      if [[ "${replication_status}" != "replicating" ]]; then
        status="FAILED"
        details+="RDS replication status is not 'replicating' (current: ${replication_status}). "
      else
        log "INFO" "RDS replication status: ${replication_status}"
        
        # Get replication lag
        local replication_lag=$(aws cloudwatch get-metric-statistics \
          --region "${DR_REGION}" \
          --namespace AWS/RDS \
          --metric-name ReplicaLag \
          --dimensions Name=DBInstanceIdentifier,Value="${dr_rds_instance}" \
          --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
          --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
          --period 60 \
          --statistics Average \
          --query "Datapoints[0].Average" \
          --output text)
        
        if [[ -z "${replication_lag}" || "${replication_lag}" == "None" ]]; then
          log "WARN" "Could not retrieve replication lag metric."
        else
          log "INFO" "RDS replication lag: ${replication_lag} seconds"
          
          if (( $(echo "${replication_lag} > 300" | bc -l) )); then
            status="FAILED"
            details+="RDS replication lag is too high: ${replication_lag} seconds (threshold: 300 seconds). "
          fi
        fi
      fi
    fi
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "RDS Cross-Region Replication" "${status}" "${details}" "${duration}"
}

simulate_regional_failure() {
  log "INFO" "Simulating regional failure in ${PRIMARY_REGION}..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # We're not actually causing a failure, just simulating one by redirecting traffic
  log "INFO" "This is a drill - not causing actual regional failure"
  log "INFO" "Simulating failover by redirecting traffic to DR region"
  
  # In a real scenario, this would involve updating Route53 records, 
  # changing load balancer configurations, etc.
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "Regional Failure Simulation" "${status}" "${details}" "${duration}"
}

test_dr_services() {
  log "INFO" "Testing services in DR region..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Switch kubectl context to DR cluster
  kubectl config use-context dr
  
  for service in "${JOURNEY_SERVICES[@]}"; do
    log "INFO" "Testing ${service} in DR region..."
    
    # Check if service pods are running
    local running_pods=$(kubectl get pods -n "${service}" --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    
    if [[ ${running_pods} -eq 0 ]]; then
      status="FAILED"
      details+="No running pods found for ${service} in DR region. "
      log "ERROR" "No running pods found for ${service} in DR region."
      continue
    fi
    
    log "INFO" "Found ${running_pods} running pods for ${service} in DR region."
    
    # Check service endpoint if available
    if [[ -n "${SERVICE_ENDPOINTS[${service}]}" ]]; then
      local endpoint="${SERVICE_ENDPOINTS[${service}]}"
      local service_url="http://${service}.${service}.svc.cluster.local${endpoint}"
      
      # Use kubectl port-forward to access the service
      local pod_name=$(kubectl get pods -n "${service}" --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')
      kubectl port-forward -n "${service}" "${pod_name}" 8080:80 &>/dev/null &
      local port_forward_pid=$!
      
      # Wait for port-forward to establish
      sleep 3
      
      # Test the endpoint
      local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080${endpoint} 2>/dev/null)
      
      # Kill port-forward process
      kill ${port_forward_pid} 2>/dev/null || true
      wait ${port_forward_pid} 2>/dev/null || true
      
      if [[ "${response}" != "200" ]]; then
        status="FAILED"
        details+="${service} endpoint returned non-200 status code: ${response}. "
        log "ERROR" "${service} endpoint returned non-200 status code: ${response}"
      else
        log "INFO" "${service} endpoint returned 200 OK"
      fi
    fi
  done
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "DR Services Test" "${status}" "${details}" "${duration}"
}

test_database_reads() {
  log "INFO" "Testing database read operations in DR region..."
  local start_time=$(date +%s)
  local status="PASSED"
  local details=""
  
  # Get DR RDS endpoint
  local dr_rds_instance=$(aws rds describe-db-instances \
    --region "${DR_REGION}" \
    --query "DBInstances[?starts_with(DBInstanceIdentifier, '${RDS_INSTANCE_PREFIX}')].DBInstanceIdentifier" \
    --output text)
  
  if [[ -z "${dr_rds_instance}" ]]; then
    status="FAILED"
    details+="DR region RDS instance not found. "
  else
    local dr_rds_endpoint=$(aws rds describe-db-instances \
      --region "${DR_REGION}" \
      --db-instance-identifier "${dr_rds_instance}" \
      --query "DBInstances[0].Endpoint.Address" \
      --output text)
    
    log "INFO" "DR RDS endpoint: ${dr_rds_endpoint}"
    
    # Test read operations for each journey database
    local journey_dbs=("health" "care" "plan" "gamification" "auth")
    
    for db in "${journey_dbs[@]}"; do
      log "INFO" "Testing read operations on ${db} database..."
      
      # Execute a simple SELECT query
      # Note: In a real scenario, you would use proper credentials from a secret manager
      if ! PGPASSWORD="test_password" psql -h "${dr_rds_endpoint}" -U "austa" -d "${db}" -c "SELECT 1;" &>/dev/null; then
        status="FAILED"
        details+="Failed to execute read query on ${db} database. "
        log "ERROR" "Failed to execute read query on ${db} database."
      else
        log "INFO" "Successfully executed read query on ${db} database."
      fi
    done
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log_test_result "Database Read Operations" "${status}" "${details}" "${duration}"
}

generate_report() {
  if [[ "${GENERATE_REPORT}" != "true" ]]; then
    log "INFO" "Report generation skipped."
    return
  fi
  
  log "INFO" "Generating DR drill report..."
  local drill_end_time=$(date +%s)
  local total_duration=$((drill_end_time - DRILL_START_TIME))
  
  # Create HTML report
  cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUSTA SuperApp - DR Drill Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background-color: #3498db;
      color: white;
      padding: 20px;
      border-radius: 5px 5px 0 0;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 0 0 5px 5px;
    }
    .passed {
      color: #27ae60;
      font-weight: bold;
    }
    .failed {
      color: #e74c3c;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .test-details {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AUSTA SuperApp - Disaster Recovery Drill Report</h1>
      <p>Date: $(date +"%Y-%m-%d %H:%M:%S")</p>
    </div>
    
    <div class="summary">
      <h2>Executive Summary</h2>
      <p><strong>Overall Status:</strong> <span class="${OVERALL_STATUS,,}">${OVERALL_STATUS}</span></p>
      <p><strong>Total Duration:</strong> ${total_duration} seconds</p>
      <p><strong>Primary Region:</strong> ${PRIMARY_REGION}</p>
      <p><strong>DR Region:</strong> ${DR_REGION}</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Status</th>
          <th>Duration (s)</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
 EOF
  
  # Add test results to the report
  for result in "${TEST_RESULTS[@]}"; do
    IFS='|' read -r test_name status details duration <<< "${result}"
    
    cat >> "${REPORT_FILE}" << EOF
        <tr>
          <td>${test_name}</td>
          <td class="${status,,}">${status}</td>
          <td>${duration}</td>
          <td class="test-details">${details}</td>
        </tr>
 EOF
  done
  
  # Complete the HTML report
  cat >> "${REPORT_FILE}" << EOF
      </tbody>
    </table>
    
    <h2>Recommendations</h2>
    <ul>
 EOF
  
  # Add recommendations based on test results
  if [[ "${OVERALL_STATUS}" == "FAILED" ]]; then
    cat >> "${REPORT_FILE}" << EOF
      <li>Review and address all failed tests before the next DR drill.</li>
 EOF
  fi
  
  # Add standard recommendations
  cat >> "${REPORT_FILE}" << EOF
      <li>Ensure all team members are familiar with the DR procedures.</li>
      <li>Review and update DR documentation based on this drill's findings.</li>
      <li>Consider automating more aspects of the DR process to reduce RTO.</li>
      <li>Schedule the next DR drill for $(date -d "+3 months" +"%Y-%m-%d").</li>
    </ul>
    
    <h2>Next Steps</h2>
    <ol>
      <li>Share this report with all stakeholders.</li>
      <li>Create JIRA tickets for any issues identified during the drill.</li>
      <li>Update the DR playbook with any new findings.</li>
      <li>Schedule a retrospective meeting to discuss the drill results.</li>
    </ol>
    
    <p><small>Generated by AUSTA SuperApp DR Drill Script v1.0</small></p>
  </div>
</body>
</html>
 EOF
  
  log "INFO" "DR drill report generated: ${REPORT_FILE}"
}

send_notifications() {
  log "INFO" "Sending notifications..."
  
  local status_emoji="✅"
  local color="good"
  
  if [[ "${OVERALL_STATUS}" == "FAILED" ]]; then
    status_emoji="❌"
    color="danger"
  fi
  
  local message="${status_emoji} *AUSTA SuperApp DR Drill Complete*\n\n*Status:* ${OVERALL_STATUS}\n*Date:* $(date +"%Y-%m-%d %H:%M:%S")\n*Duration:* ${total_duration} seconds\n\nSee the full report for details."
  
  send_slack_notification "${message}" "${color}"
  
  log "INFO" "Notifications sent."
}

# Main execution
log "INFO" "Starting AUSTA SuperApp DR drill..."
log "INFO" "Primary Region: ${PRIMARY_REGION}, DR Region: ${DR_REGION}"

# Run tests
check_prerequisites
check_aws_regions
check_eks_clusters
update_kubeconfig
check_s3_replication
check_rds_replication
simulate_regional_failure
test_dr_services
test_database_reads

# Calculate total duration
total_duration=$(($(date +%s) - DRILL_START_TIME))

# Generate report and send notifications
generate_report
send_notifications

# Final status
log "INFO" "DR drill completed with status: ${OVERALL_STATUS}"
log "INFO" "Total duration: ${total_duration} seconds"

if [[ "${OVERALL_STATUS}" == "FAILED" ]]; then
  log "WARN" "Some tests failed. Please review the report for details."
  exit 1
fi

exit 0