#!/bin/bash
# Make sure this script is executable: chmod +x infrastructure/scripts/terraform-wrapper.sh

#########################################################################
# terraform-wrapper.sh
#
# A centralized wrapper script for Terraform operations that standardizes
# environment preparation by parsing CLI arguments, setting AWS credentials,
# managing workspaces, and ensuring consistent infrastructure deployment
# across all environments.
#
# This script implements:
# - Enhanced environment flag handling for development, staging, and production
# - Improved AWS credential management with secure credential prompts
# - Added explicit workspace management for terraform workspaces
# - Better error handling and validation of required inputs
#
# Usage: ./terraform-wrapper.sh [options] <terraform-command>
#
# Options:
#   -e, --environment <env>   Specify environment (dev, staging, prod)
#   -r, --region <region>     Specify AWS region (default: sa-east-1)
#   -p, --profile <profile>   Specify AWS profile (optional)
#   -w, --workspace <name>    Specify Terraform workspace (optional)
#   -d, --directory <path>    Specify Terraform directory (default: current)
#   -v, --verbose             Enable verbose output
#   -h, --help                Display this help message
#
# Examples:
#   ./terraform-wrapper.sh -e dev plan
#   ./terraform-wrapper.sh --environment staging --region sa-east-1 apply
#   ./terraform-wrapper.sh -e prod -p production-admin -w prod-main plan
#
#########################################################################

set -e

# Default values
ENVIRONMENT=""
REGION="sa-east-1"  # Default to São Paulo region per technical spec
AWS_PROFILE=""
TF_WORKSPACE=""
TF_DIRECTORY="$(pwd)"
VERBOSE=false
TF_COMMAND=""

# ANSI color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

# Display script usage
function show_usage {
    echo -e "${BLUE}Usage:${NC} ./terraform-wrapper.sh [options] <terraform-command>"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -e, --environment <env>   Specify environment (dev, staging, prod)"
    echo "  -r, --region <region>     Specify AWS region (default: sa-east-1)"
    echo "  -p, --profile <profile>   Specify AWS profile (optional)"
    echo "  -w, --workspace <name>    Specify Terraform workspace (optional)"
    echo "  -d, --directory <path>    Specify Terraform directory (default: current)"
    echo "  -v, --verbose             Enable verbose output"
    echo "  -h, --help                Display this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./terraform-wrapper.sh -e dev plan"
    echo "  ./terraform-wrapper.sh --environment staging --region sa-east-1 apply"
    echo "  ./terraform-wrapper.sh -e prod -p production-admin -w prod-main plan"
    exit 1
}

# Log messages with different severity levels
function log_info {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

function log_debug {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Validate environment value
function validate_environment {
    local env=$1
    case "$env" in
        dev|development)
            echo "dev"
            ;;
        staging|stage)
            echo "staging"
            ;;
        prod|production)
            echo "prod"
            ;;
        *)
            log_error "Invalid environment: $env. Must be one of: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Validate AWS region
function validate_region {
    local region=$1
    # List of valid AWS regions
    local valid_regions=("sa-east-1" "us-east-1" "us-east-2" "us-west-1" "us-west-2" "eu-west-1" "eu-central-1" "ap-southeast-1" "ap-southeast-2" "ap-northeast-1")
    
    for valid_region in "${valid_regions[@]}"; do
        if [ "$region" = "$valid_region" ]; then
            return 0
        fi
    done
    
    log_error "Invalid AWS region: $region"
    log_info "Primary region should be sa-east-1 (São Paulo) per technical specification"
    log_info "Disaster recovery region is us-east-1 (N. Virginia)"
    exit 1
}

# Check if AWS CLI is installed and configured
function check_aws_cli {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    log_debug "AWS CLI is installed"
}

# Check if Terraform is installed with correct version
function check_terraform {
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    local tf_version=$(terraform version -json | grep -o '"terraform_version":"[^"]*"' | cut -d '"' -f 4)
    log_debug "Terraform version: $tf_version"
    
    # Ensure Terraform version is compatible
    if [[ "$(printf '%s\n' "1.0.0" "$tf_version" | sort -V | head -n1)" != "1.0.0" ]]; then
        log_warn "Terraform version $tf_version may not be compatible. Recommended version is 1.0.0 or higher."
    fi
}

# Set up AWS credentials
function setup_aws_credentials {
    if [ -n "$AWS_PROFILE" ]; then
        log_info "Using AWS profile: $AWS_PROFILE"
        export AWS_PROFILE="$AWS_PROFILE"
    else
        # If no profile is specified, check if credentials are already set
        if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
            log_info "No AWS profile specified and no AWS credentials found in environment"
            
            # Prompt for AWS credentials if not in CI environment
            if [ -z "$CI" ]; then
                log_info "Please enter your AWS credentials:"
                read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
                read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
                echo ""
                
                if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
                    log_error "AWS credentials cannot be empty"
                    exit 1
                fi
                
                export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
                export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
            else
                log_error "Running in CI environment but no AWS credentials or profile provided"
                exit 1
            fi
        else
            log_debug "Using AWS credentials from environment variables"
        fi
    fi
    
    # Set AWS region
    export AWS_REGION="$REGION"
    export AWS_DEFAULT_REGION="$REGION"
    
    # Verify AWS credentials
    log_info "Verifying AWS credentials..."
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "Failed to verify AWS credentials. Please check your credentials and try again."
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query "Account" --output text)
    local user_arn=$(aws sts get-caller-identity --query "Arn" --output text)
    
    log_info "AWS credentials verified successfully"
    log_debug "Account ID: $account_id"
    log_debug "User ARN: $user_arn"
}

# Set up Terraform workspace
function setup_terraform_workspace {
    cd "$TF_DIRECTORY" || {
        log_error "Failed to change to directory: $TF_DIRECTORY"
        exit 1
    }
    
    # Initialize Terraform if .terraform directory doesn't exist
    if [ ! -d ".terraform" ]; then
        log_info "Initializing Terraform..."
        terraform init
    fi
    
    # Set up workspace
    if [ -n "$TF_WORKSPACE" ]; then
        log_info "Setting up Terraform workspace: $TF_WORKSPACE"
        
        # Check if workspace exists
        if ! terraform workspace list | grep -q " $TF_WORKSPACE$"; then
            log_info "Creating new workspace: $TF_WORKSPACE"
            terraform workspace new "$TF_WORKSPACE"
        else
            log_info "Selecting existing workspace: $TF_WORKSPACE"
            terraform workspace select "$TF_WORKSPACE"
        fi
    else
        # If no workspace specified, use environment name as workspace
        if [ -n "$ENVIRONMENT" ]; then
            TF_WORKSPACE="$ENVIRONMENT"
            log_info "No workspace specified, using environment as workspace: $TF_WORKSPACE"
            
            # Check if workspace exists
            if ! terraform workspace list | grep -q " $TF_WORKSPACE$"; then
                log_info "Creating new workspace: $TF_WORKSPACE"
                terraform workspace new "$TF_WORKSPACE"
            else
                log_info "Selecting existing workspace: $TF_WORKSPACE"
                terraform workspace select "$TF_WORKSPACE"
            fi
        else
            log_info "Using default workspace"
        fi
    fi
    
    # Show current workspace
    local current_workspace=$(terraform workspace show)
    log_info "Current Terraform workspace: $current_workspace"
}

# Set up environment-specific variables
function setup_environment_vars {
    if [ -z "$ENVIRONMENT" ]; then
        log_error "Environment (-e, --environment) is required"
        show_usage
    fi
    
    log_info "Setting up environment: $ENVIRONMENT"
    
    # Set environment-specific variables
    case "$ENVIRONMENT" in
        dev)
            export TF_VAR_environment="development"
            export TF_VAR_instance_type="t3.medium"
            export TF_VAR_min_capacity=1
            export TF_VAR_max_capacity=2
            ;;
        staging)
            export TF_VAR_environment="staging"
            export TF_VAR_instance_type="t3.medium"
            export TF_VAR_min_capacity=2
            export TF_VAR_max_capacity=4
            ;;
        prod)
            export TF_VAR_environment="production"
            export TF_VAR_instance_type="m5.large"
            export TF_VAR_min_capacity=3
            export TF_VAR_max_capacity=10
            ;;
    esac
    
    # Set common variables
    export TF_VAR_region="$REGION"
    export TF_VAR_aws_provider_version="4.60.0"  # Pinned version per technical spec
    export TF_VAR_kubernetes_provider_version="2.23.0"  # Pinned version per technical spec
    
    # Load environment-specific tfvars file if it exists
    local tfvars_file="infrastructure/terraform/environments/$ENVIRONMENT/terraform.tfvars"
    if [ -f "$tfvars_file" ]; then
        log_info "Using environment-specific tfvars file: $tfvars_file"
        export TF_CLI_ARGS_plan="-var-file=$tfvars_file"
        export TF_CLI_ARGS_apply="-var-file=$tfvars_file"
    else
        log_warn "Environment-specific tfvars file not found: $tfvars_file"
    fi
}

# Execute Terraform command
function execute_terraform {
    log_info "Executing Terraform command: terraform $TF_COMMAND"
    
    # Add -auto-approve for apply/destroy in CI environment
    if [ -n "$CI" ] && { [ "$TF_COMMAND" == "apply" ] || [ "$TF_COMMAND" == "destroy" ]; }; then
        log_info "Running in CI environment, adding -auto-approve flag"
        TF_COMMAND="$TF_COMMAND -auto-approve"
    fi
    
    # Execute the command
    if [ "$VERBOSE" = true ]; then
        TF_LOG=DEBUG terraform $TF_COMMAND
    else
        terraform $TF_COMMAND
    fi
    
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Terraform command failed with exit code: $exit_code"
        exit $exit_code
    fi
    
    log_info "Terraform command completed successfully"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT=$(validate_environment "$2")
            shift
            shift
            ;;
        -r|--region)
            REGION="$2"
            validate_region "$REGION"
            shift
            shift
            ;;
        -p|--profile)
            AWS_PROFILE="$2"
            shift
            shift
            ;;
        -w|--workspace)
            TF_WORKSPACE="$2"
            shift
            shift
            ;;
        -d|--directory)
            TF_DIRECTORY="$2"
            shift
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            # If not an option, assume it's the Terraform command
            if [ -z "$TF_COMMAND" ]; then
                TF_COMMAND="$1"
            else
                TF_COMMAND="$TF_COMMAND $1"
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [ -z "$TF_COMMAND" ]; then
    log_error "No Terraform command specified"
    show_usage
fi

# Main execution
log_info "Starting Terraform wrapper for AUSTA SuperApp"

# Check prerequisites
check_aws_cli
check_terraform

# Set up environment
setup_environment_vars

# Set up AWS credentials
setup_aws_credentials

# Set up Terraform workspace
setup_terraform_workspace

# Execute Terraform command
execute_terraform

log_info "Terraform wrapper completed successfully"
exit 0