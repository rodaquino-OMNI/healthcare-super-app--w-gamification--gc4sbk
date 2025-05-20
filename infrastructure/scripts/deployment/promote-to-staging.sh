#!/bin/bash
# Make this script executable with: chmod +x promote-to-staging.sh

# =========================================================================
# AUSTA SuperApp - Promotion Script (Development to Staging)
# =========================================================================
# This script handles the automated promotion of changes from the development
# environment to the staging environment, following the defined environment
# promotion workflow for controlled propagation of changes.
#
# The script performs the following operations:
# 1. Updates image tags in Kubernetes manifests
# 2. Applies the updated manifests to the staging environment
# 3. Executes database migrations with validation
# 4. Runs integration tests to verify successful deployment
# =========================================================================

set -e

# =========================================================================
# Configuration
# =========================================================================

# Colors for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Environment variables
GIT_HASH=${GIT_HASH:-$(git rev-parse --short HEAD)}
TIMESTAMP=$(date +%Y%m%d%H%M%S)
KUBE_CONTEXT="eks-staging"
NAMESPACES=("health-journey" "care-journey" "plan-journey" "gamification" "shared-services")
MANIFEST_DIR="./infrastructure/kubernetes"
TRANSFORMED_MANIFEST_DIR="./infrastructure/kubernetes/staging-manifests"
DATABASE_SERVICES=("health-service" "care-service" "plan-service" "gamification-engine")
TEST_TIMEOUT=600 # 10 minutes

# =========================================================================
# Helper Functions
# =========================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is required but not installed. Please install it and try again."
        exit 1
    fi
}

check_environment() {
    # Check if required environment variables are set
    if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
        log_error "AWS credentials are not set. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
        exit 1
    fi
    
    # Check if kubectl is configured with the correct context
    if ! kubectl config get-contexts | grep -q ${KUBE_CONTEXT}; then
        log_error "Kubernetes context '${KUBE_CONTEXT}' not found. Please configure kubectl."
        exit 1
    fi
}

wait_for_deployment() {
    local namespace=$1
    local deployment=$2
    local timeout=$3
    
    log_info "Waiting for deployment ${deployment} in namespace ${namespace} to complete..."
    
    kubectl rollout status deployment/${deployment} -n ${namespace} --timeout=${timeout}s
    
    if [ $? -ne 0 ]; then
        log_error "Deployment ${deployment} in namespace ${namespace} failed to roll out within ${timeout} seconds."
        return 1
    fi
    
    log_success "Deployment ${deployment} in namespace ${namespace} successfully rolled out."
    return 0
}

run_database_migration() {
    local service=$1
    local namespace
    
    # Determine namespace based on service
    case ${service} in
        health-service)
            namespace="health-journey"
            ;;
        care-service)
            namespace="care-journey"
            ;;
        plan-service)
            namespace="plan-journey"
            ;;
        gamification-engine)
            namespace="gamification"
            ;;
        *)
            log_error "Unknown service: ${service}"
            return 1
            ;;
    esac
    
    log_info "Running database migration for ${service} in namespace ${namespace}..."
    
    # Get the pod name for the service
    local pod_name=$(kubectl get pods -n ${namespace} -l app=${service} -o jsonpath="{.items[0].metadata.name}")
    
    if [ -z "${pod_name}" ]; then
        log_error "No pod found for ${service} in namespace ${namespace}."
        return 1
    fi
    
    # Execute the migration command in the pod
    kubectl exec -n ${namespace} ${pod_name} -- npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        log_error "Database migration failed for ${service}."
        return 1
    fi
    
    # Validate the migration
    kubectl exec -n ${namespace} ${pod_name} -- npx prisma migrate status
    
    if [ $? -ne 0 ]; then
        log_error "Database migration validation failed for ${service}."
        return 1
    fi
    
    log_success "Database migration completed successfully for ${service}."
    return 0
}

run_integration_tests() {
    local namespace=$1
    
    log_info "Running integration tests for namespace ${namespace}..."
    
    # Determine the test job name based on namespace
    local test_job="integration-test-${namespace}"
    
    # Create and run the test job
    cat <<EOF | kubectl apply -n ${namespace} -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${test_job}
  namespace: ${namespace}
spec:
  ttlSecondsAfterFinished: 600
  template:
    spec:
      containers:
      - name: integration-tests
        image: ghcr.io/austa/integration-tests:${GIT_HASH}
        args: ["--namespace", "${namespace}", "--environment", "staging"]
        env:
        - name: NODE_ENV
          value: "staging"
      restartPolicy: Never
  backoffLimit: 0
EOF
    
    # Wait for the job to complete
    log_info "Waiting for integration tests to complete..."
    kubectl wait --for=condition=complete --timeout=${TEST_TIMEOUT}s job/${test_job} -n ${namespace}
    
    # Check if the job succeeded
    local status=$(kubectl get job ${test_job} -n ${namespace} -o jsonpath="{.status.succeeded}")
    
    if [ "${status}" != "1" ]; then
        log_error "Integration tests failed for namespace ${namespace}."
        # Get logs from the test pod
        local test_pod=$(kubectl get pods -n ${namespace} -l job-name=${test_job} -o jsonpath="{.items[0].metadata.name}")
        kubectl logs ${test_pod} -n ${namespace}
        return 1
    fi
    
    log_success "Integration tests passed for namespace ${namespace}."
    return 0
}

transform_manifests() {
    log_info "Transforming Kubernetes manifests for staging environment..."
    
    # Create the transformed manifest directory if it doesn't exist
    mkdir -p ${TRANSFORMED_MANIFEST_DIR}
    
    # Process each namespace directory
    for namespace in "${NAMESPACES[@]}"; do
        local source_dir="${MANIFEST_DIR}/${namespace}"
        local target_dir="${TRANSFORMED_MANIFEST_DIR}/${namespace}"
        
        # Create the target directory if it doesn't exist
        mkdir -p ${target_dir}
        
        # Copy and transform the manifests
        find ${source_dir} -name "*.yaml" -o -name "*.yml" | while read file; do
            local filename=$(basename ${file})
            local target_file="${target_dir}/${filename}"
            
            # Replace environment-specific values
            sed -e "s/\${ENV}/staging/g" \
                -e "s/\${GIT_HASH}/${GIT_HASH}/g" \
                -e "s/\${TIMESTAMP}/${TIMESTAMP}/g" \
                ${file} > ${target_file}
            
            # Update image tags to use the current Git hash
            sed -i -e "s|image: .*:\(.*\)|image: ghcr.io/austa/\1:${GIT_HASH}|g" ${target_file}
        done
    done
    
    log_success "Manifests transformed successfully."
}

apply_manifests() {
    log_info "Applying Kubernetes manifests to staging environment..."
    
    # Switch to the staging context
    kubectl config use-context ${KUBE_CONTEXT}
    
    # Apply manifests for each namespace
    for namespace in "${NAMESPACES[@]}"; do
        local manifest_dir="${TRANSFORMED_MANIFEST_DIR}/${namespace}"
        
        # Ensure the namespace exists
        kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -
        
        # Apply all manifests in the namespace directory
        kubectl apply -f ${manifest_dir} --recursive
        
        if [ $? -ne 0 ]; then
            log_error "Failed to apply manifests for namespace ${namespace}."
            return 1
        fi
        
        log_success "Applied manifests for namespace ${namespace}."
    done
    
    return 0
}

wait_for_deployments() {
    log_info "Waiting for all deployments to roll out..."
    
    # Wait for deployments in each namespace
    for namespace in "${NAMESPACES[@]}"; do
        # Get all deployments in the namespace
        local deployments=$(kubectl get deployments -n ${namespace} -o jsonpath="{.items[*].metadata.name}")
        
        for deployment in ${deployments}; do
            wait_for_deployment ${namespace} ${deployment} ${TEST_TIMEOUT}
            
            if [ $? -ne 0 ]; then
                log_error "Deployment rollout failed for ${deployment} in namespace ${namespace}."
                return 1
            fi
        done
    done
    
    log_success "All deployments successfully rolled out."
    return 0
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations for each database service
    for service in "${DATABASE_SERVICES[@]}"; do
        run_database_migration ${service}
        
        if [ $? -ne 0 ]; then
            log_error "Database migration failed for ${service}."
            return 1
        fi
    done
    
    log_success "All database migrations completed successfully."
    return 0
}

run_all_integration_tests() {
    log_info "Running integration tests for all namespaces..."
    
    # Run tests for each namespace
    for namespace in "${NAMESPACES[@]}"; do
        run_integration_tests ${namespace}
        
        if [ $? -ne 0 ]; then
            log_error "Integration tests failed for namespace ${namespace}."
            return 1
        fi
    done
    
    log_success "All integration tests passed successfully."
    return 0
}

# =========================================================================
# Main Execution
# =========================================================================

main() {
    log_info "Starting promotion from development to staging..."
    
    # Check for required commands
    check_command "kubectl"
    check_command "git"
    check_command "sed"
    
    # Check environment configuration
    check_environment
    
    # Transform manifests for staging environment
    transform_manifests
    
    # Apply the transformed manifests
    apply_manifests
    if [ $? -ne 0 ]; then
        log_error "Failed to apply manifests. Aborting promotion."
        exit 1
    fi
    
    # Wait for all deployments to roll out
    wait_for_deployments
    if [ $? -ne 0 ]; then
        log_error "Deployment rollout failed. Aborting promotion."
        exit 1
    fi
    
    # Run database migrations
    run_database_migrations
    if [ $? -ne 0 ]; then
        log_error "Database migrations failed. Aborting promotion."
        exit 1
    fi
    
    # Run integration tests
    run_all_integration_tests
    if [ $? -ne 0 ]; then
        log_error "Integration tests failed. Promotion completed with warnings."
        exit 1
    fi
    
    log_success "Promotion from development to staging completed successfully!"
    exit 0
}

# Execute main function
main