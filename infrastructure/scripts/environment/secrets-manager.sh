#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Secrets Manager Script
# =========================================================================
# This script provides a unified interface for managing secrets across
# different environments (local development, staging, production).
# 
# It supports:
# - AWS Secrets Manager for production credentials
# - Encrypted .env files for local development
# - Journey-specific secrets segregation
# - Credential rotation mechanisms
#
# Usage:
#   ./secrets-manager.sh get <secret-name> [<key>]   - Retrieve a secret
#   ./secrets-manager.sh encrypt <file>             - Encrypt a .env file
#   ./secrets-manager.sh decrypt <file>             - Decrypt a .env file
#   ./secrets-manager.sh rotate <secret-name>       - Rotate a secret
#   ./secrets-manager.sh list [journey]             - List available secrets
# =========================================================================

set -e

# Default values
AWS_REGION="sa-east-1"
ENCRYPTION_CIPHER="aes-256-cbc"
ENCRYPTED_EXT=".enc"
JOURNEY_PREFIXES=("health" "care" "plan" "gamification" "shared")
LOCAL_SECRETS_DIR="${HOME}/.austa/secrets"

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# =========================================================================
# Helper Functions
# =========================================================================

function print_usage {
    echo -e "${BLUE}AUSTA SuperApp Secrets Manager${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 get <secret-name> [<key>]   - Retrieve a secret"
    echo "  $0 encrypt <file>             - Encrypt a .env file"
    echo "  $0 decrypt <file>             - Decrypt a .env file"
    echo "  $0 rotate <secret-name>       - Rotate a secret"
    echo "  $0 list [journey]             - List available secrets"
    echo ""
    echo "Environment Variables:"
    echo "  AUSTA_ENV                     - Environment (local, dev, staging, prod)"
    echo "  AWS_REGION                    - AWS region (default: sa-east-1)"
    echo "  AUSTA_SECRETS_KEY             - Encryption key for local secrets"
    echo "  AUSTA_SECRETS_DIR             - Directory for local secrets"
    echo ""
    echo "Examples:"
    echo "  $0 get health/database/credentials username"
    echo "  $0 encrypt .env.local"
    echo "  $0 decrypt .env.local${ENCRYPTED_EXT}"
    echo "  $0 list health"
}

function log_info {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_warn {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

function log_error {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

function check_dependencies {
    local missing_deps=0
    
    for cmd in aws openssl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required dependency not found: $cmd"
            missing_deps=1
        fi
    done
    
    if [ $missing_deps -eq 1 ]; then
        log_error "Please install the missing dependencies and try again."
        exit 1
    fi
}

function check_environment {
    # Set default environment if not specified
    if [ -z "$AUSTA_ENV" ]; then
        AUSTA_ENV="local"
        log_warn "AUSTA_ENV not set, defaulting to 'local'"
    fi
    
    # Override AWS region if specified
    if [ -n "$AWS_REGION" ]; then
        AWS_REGION="$AWS_REGION"
    fi
    
    # Override local secrets directory if specified
    if [ -n "$AUSTA_SECRETS_DIR" ]; then
        LOCAL_SECRETS_DIR="$AUSTA_SECRETS_DIR"
    fi
    
    # Create local secrets directory if it doesn't exist
    if [ "$AUSTA_ENV" == "local" ] && [ ! -d "$LOCAL_SECRETS_DIR" ]; then
        mkdir -p "$LOCAL_SECRETS_DIR"
        log_info "Created local secrets directory: $LOCAL_SECRETS_DIR"
    fi
    
    # Check for encryption key in local environment
    if [ "$AUSTA_ENV" == "local" ] && [ -z "$AUSTA_SECRETS_KEY" ]; then
        log_warn "AUSTA_SECRETS_KEY not set for local environment"
        log_warn "Encryption/decryption operations will prompt for a password"
    fi
}

function validate_journey {
    local journey=$1
    local valid=0
    
    for prefix in "${JOURNEY_PREFIXES[@]}"; do
        if [ "$journey" == "$prefix" ]; then
            valid=1
            break
        fi
    done
    
    if [ $valid -eq 0 ]; then
        log_error "Invalid journey: $journey"
        log_error "Valid journeys: ${JOURNEY_PREFIXES[*]}"
        exit 1
    fi
}

# =========================================================================
# AWS Secrets Manager Functions
# =========================================================================

function aws_get_secret {
    local secret_name=$1
    local key=$2
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured or lacks permissions"
        exit 1
    fi
    
    # Get the secret value
    local secret_value
    if ! secret_value=$(aws secretsmanager get-secret-value \
                         --region "$AWS_REGION" \
                         --secret-id "$secret_name" \
                         --query SecretString \
                         --output text 2>/dev/null); then
        log_error "Failed to retrieve secret: $secret_name"
        exit 1
    fi
    
    # If a key is specified and the secret is JSON, extract the key
    if [ -n "$key" ]; then
        # Check if the secret is valid JSON
        if echo "$secret_value" | jq -e . &> /dev/null; then
            # Extract the key from the JSON
            if ! secret_value=$(echo "$secret_value" | jq -r ".$key" 2>/dev/null); then
                log_error "Failed to extract key '$key' from secret"
                exit 1
            fi
            
            # Check if the key exists
            if [ "$secret_value" == "null" ]; then
                log_error "Key '$key' not found in secret"
                exit 1
            fi
        else
            log_error "Secret is not in JSON format, cannot extract key"
            exit 1
        fi
    fi
    
    echo "$secret_value"
}

function aws_list_secrets {
    local journey=$1
    local filter=""
    
    # If a journey is specified, filter by journey prefix
    if [ -n "$journey" ]; then
        validate_journey "$journey"
        filter="--filter Key=name,Values=$journey/"
    fi
    
    # List secrets
    if ! aws secretsmanager list-secrets \
            --region "$AWS_REGION" \
            $filter \
            --query "SecretList[].Name" \
            --output table; then
        log_error "Failed to list secrets"
        exit 1
    fi
}

function aws_rotate_secret {
    local secret_name=$1
    
    # Check if the secret exists
    if ! aws secretsmanager describe-secret \
            --region "$AWS_REGION" \
            --secret-id "$secret_name" &> /dev/null; then
        log_error "Secret not found: $secret_name"
        exit 1
    fi
    
    # Rotate the secret
    if ! aws secretsmanager rotate-secret \
            --region "$AWS_REGION" \
            --secret-id "$secret_name"; then
        log_error "Failed to rotate secret: $secret_name"
        exit 1
    fi
    
    log_info "Successfully initiated rotation for secret: $secret_name"
}

# =========================================================================
# Local Secrets Functions
# =========================================================================

function local_get_secret {
    local secret_name=$1
    local key=$2
    local secret_file="$LOCAL_SECRETS_DIR/${secret_name}${ENCRYPTED_EXT}"
    
    # Check if the secret file exists
    if [ ! -f "$secret_file" ]; then
        log_error "Secret file not found: $secret_file"
        exit 1
    fi
    
    # Decrypt the secret file
    local secret_value
    if [ -n "$AUSTA_SECRETS_KEY" ]; then
        # Use the encryption key from environment variable
        if ! secret_value=$(openssl $ENCRYPTION_CIPHER -d -salt -in "$secret_file" -pass "pass:$AUSTA_SECRETS_KEY" 2>/dev/null); then
            log_error "Failed to decrypt secret file with provided key"
            exit 1
        fi
    else
        # Prompt for the encryption key
        if ! secret_value=$(openssl $ENCRYPTION_CIPHER -d -salt -in "$secret_file" 2>/dev/null); then
            log_error "Failed to decrypt secret file"
            exit 1
        fi
    fi
    
    # If a key is specified, extract it from the decrypted content
    if [ -n "$key" ]; then
        # Try parsing as JSON first
        if echo "$secret_value" | jq -e . &> /dev/null; then
            # Extract the key from the JSON
            local json_value
            if ! json_value=$(echo "$secret_value" | jq -r ".$key" 2>/dev/null); then
                log_error "Failed to extract key '$key' from secret"
                exit 1
            fi
            
            # Check if the key exists
            if [ "$json_value" == "null" ]; then
                log_error "Key '$key' not found in secret"
                exit 1
            fi
            
            echo "$json_value"
            return
        fi
        
        # If not JSON, try parsing as .env format
        local env_value
        env_value=$(echo "$secret_value" | grep -E "^$key=" | cut -d= -f2-)
        
        if [ -z "$env_value" ]; then
            log_error "Key '$key' not found in secret"
            exit 1
        fi
        
        # Remove surrounding quotes if present
        env_value=$(echo "$env_value" | sed -E 's/^["'''](.*)["''']$/\1/')
        
        echo "$env_value"
    else
        # Return the entire secret value
        echo "$secret_value"
    fi
}

function local_list_secrets {
    local journey=$1
    local filter="*"
    
    # If a journey is specified, filter by journey prefix
    if [ -n "$journey" ]; then
        validate_journey "$journey"
        filter="$journey/*"
    fi
    
    # Check if the secrets directory exists
    if [ ! -d "$LOCAL_SECRETS_DIR" ]; then
        log_error "Local secrets directory not found: $LOCAL_SECRETS_DIR"
        exit 1
    fi
    
    # List secrets
    echo -e "${BLUE}Local Secrets:${NC}"
    find "$LOCAL_SECRETS_DIR" -name "$filter$ENCRYPTED_EXT" -type f | while read -r file; do
        echo "  $(basename "$file" "$ENCRYPTED_EXT")"
    done
}

function encrypt_file {
    local input_file=$1
    local output_file="${input_file}${ENCRYPTED_EXT}"
    
    # Check if the input file exists
    if [ ! -f "$input_file" ]; then
        log_error "Input file not found: $input_file"
        exit 1
    fi
    
    # Check if the output file already exists
    if [ -f "$output_file" ]; then
        read -p "Output file already exists. Overwrite? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            log_info "Encryption cancelled"
            exit 0
        fi
    fi
    
    # Encrypt the file
    if [ -n "$AUSTA_SECRETS_KEY" ]; then
        # Use the encryption key from environment variable
        if ! openssl $ENCRYPTION_CIPHER -salt -in "$input_file" -out "$output_file" -pass "pass:$AUSTA_SECRETS_KEY"; then
            log_error "Failed to encrypt file"
            exit 1
        fi
    else
        # Prompt for the encryption key
        if ! openssl $ENCRYPTION_CIPHER -salt -in "$input_file" -out "$output_file"; then
            log_error "Failed to encrypt file"
            exit 1
        fi
    fi
    
    log_info "File encrypted successfully: $output_file"
}

function decrypt_file {
    local input_file=$1
    local output_file
    
    # Check if the input file exists
    if [ ! -f "$input_file" ]; then
        log_error "Input file not found: $input_file"
        exit 1
    fi
    
    # Check if the input file has the encrypted extension
    if [[ "$input_file" != *"$ENCRYPTED_EXT" ]]; then
        log_error "Input file does not have the encrypted extension: $ENCRYPTED_EXT"
        exit 1
    fi
    
    # Determine the output file name
    output_file="${input_file%$ENCRYPTED_EXT}"
    
    # Check if the output file already exists
    if [ -f "$output_file" ]; then
        read -p "Output file already exists. Overwrite? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            log_info "Decryption cancelled"
            exit 0
        fi
    fi
    
    # Decrypt the file
    if [ -n "$AUSTA_SECRETS_KEY" ]; then
        # Use the encryption key from environment variable
        if ! openssl $ENCRYPTION_CIPHER -d -salt -in "$input_file" -out "$output_file" -pass "pass:$AUSTA_SECRETS_KEY"; then
            log_error "Failed to decrypt file with provided key"
            exit 1
        fi
    else
        # Prompt for the encryption key
        if ! openssl $ENCRYPTION_CIPHER -d -salt -in "$input_file" -out "$output_file"; then
            log_error "Failed to decrypt file"
            exit 1
        fi
    fi
    
    log_info "File decrypted successfully: $output_file"
    log_warn "Remember to securely delete this file when you're done with it"
    log_warn "You can use 'shred -u $output_file' for secure deletion"
}

# =========================================================================
# Main Function
# =========================================================================

function main {
    # Check dependencies
    check_dependencies
    
    # Check environment
    check_environment
    
    # Parse command line arguments
    if [ $# -lt 1 ]; then
        print_usage
        exit 1
    fi
    
    local command=$1
    shift
    
    case "$command" in
        get)
            if [ $# -lt 1 ]; then
                log_error "Missing secret name"
                print_usage
                exit 1
            fi
            
            local secret_name=$1
            local key=""
            
            if [ $# -ge 2 ]; then
                key=$2
            fi
            
            # Determine which environment to use
            if [ "$AUSTA_ENV" == "local" ]; then
                local_get_secret "$secret_name" "$key"
            else
                aws_get_secret "$secret_name" "$key"
            fi
            ;;
        
        list)
            local journey=""
            
            if [ $# -ge 1 ]; then
                journey=$1
            fi
            
            # Determine which environment to use
            if [ "$AUSTA_ENV" == "local" ]; then
                local_list_secrets "$journey"
            else
                aws_list_secrets "$journey"
            fi
            ;;
        
        encrypt)
            if [ $# -lt 1 ]; then
                log_error "Missing file name"
                print_usage
                exit 1
            fi
            
            encrypt_file "$1"
            ;;
        
        decrypt)
            if [ $# -lt 1 ]; then
                log_error "Missing file name"
                print_usage
                exit 1
            fi
            
            decrypt_file "$1"
            ;;
        
        rotate)
            if [ $# -lt 1 ]; then
                log_error "Missing secret name"
                print_usage
                exit 1
            fi
            
            # Only AWS Secrets Manager supports rotation
            if [ "$AUSTA_ENV" == "local" ]; then
                log_error "Rotation is not supported in local environment"
                exit 1
            fi
            
            aws_rotate_secret "$1"
            ;;
        
        *)
            log_error "Unknown command: $command"
            print_usage
            exit 1
            ;;
    esac
}

# Run the main function
main "$@"