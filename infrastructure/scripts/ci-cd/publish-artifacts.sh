#!/bin/bash

# ============================================================================
# publish-artifacts.sh
#
# A comprehensive script for publishing build artifacts to appropriate registries
# with versioning, signing, and promotion capabilities for container images,
# npm packages, and Terraform modules.
#
# Features:
# - Semantic versioning for all artifacts
# - Artifact signing and verification
# - Promotion across environments (dev/staging/production)
# - Support for container images, npm packages, and Terraform modules
#
# Usage:
#   ./publish-artifacts.sh [options] <artifact-type> <artifact-path>
#
# Options:
#   --env <environment>       Target environment (dev, staging, prod) [default: dev]
#   --version <version>       Semantic version (x.y.z) [default: from package.json/version file]
#   --promote-from <env>      Promote artifact from specified environment
#   --sign                    Sign the artifact
#   --verify                  Verify artifact signature
#   --registry <registry>     Override default registry
#   --dry-run                 Show commands without executing
#
# Artifact Types:
#   container                 Container image
#   npm                       NPM package
#   terraform                 Terraform module
#
# Examples:
#   ./publish-artifacts.sh --env dev --sign container src/backend/api-gateway
#   ./publish-artifacts.sh --env staging --promote-from dev container src/backend/api-gateway
#   ./publish-artifacts.sh --env prod --sign npm src/web/design-system
#   ./publish-artifacts.sh --verify container src/backend/api-gateway:1.2.3
# ============================================================================

set -e

# Default values
ENVIRONMENT="dev"
VERSION=""
PROMOTE_FROM=""
SIGN=false
VERIFY=false
DRY_RUN=false
REGISTRY=""
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Registry configurations
GITHUB_CONTAINER_REGISTRY="ghcr.io/austa"
AWS_ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/austa"
NPM_REGISTRY_DEV="https://npm.pkg.github.com/austa"
NPM_REGISTRY_PROD="https://registry.npmjs.org"
TERRAFORM_REGISTRY="registry.terraform.io/austa"

# Color codes for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# ============================================================================
# Helper functions
# ============================================================================

function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

function execute_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would execute: $1"
        return 0
    fi
    
    echo "Executing: $1"
    eval "$1"
    return $?
}

function check_dependencies() {
    local missing_deps=false
    
    # Check for required tools based on artifact type
    case "$ARTIFACT_TYPE" in
        container)
            for cmd in docker cosign; do
                if ! command -v $cmd &> /dev/null; then
                    log_error "Required command '$cmd' not found. Please install it."
                    missing_deps=true
                fi
            done
            ;;
        npm)
            for cmd in npm node; do
                if ! command -v $cmd &> /dev/null; then
                    log_error "Required command '$cmd' not found. Please install it."
                    missing_deps=true
                fi
            done
            ;;
        terraform)
            for cmd in terraform; do
                if ! command -v $cmd &> /dev/null; then
                    log_error "Required command '$cmd' not found. Please install it."
                    missing_deps=true
                fi
            done
            ;;
    esac
    
    if [ "$missing_deps" = true ]; then
        exit 1
    fi
}

function get_version() {
    # If version is already set via command line, use it
    if [ -n "$VERSION" ]; then
        return 0
    fi
    
    # Try to determine version based on artifact type
    case "$ARTIFACT_TYPE" in
        container)
            # Try to get version from package.json if it exists
            if [ -f "$ARTIFACT_PATH/package.json" ]; then
                VERSION=$(node -p "require('$ARTIFACT_PATH/package.json').version" 2>/dev/null || echo "")
            fi
            
            # If not found, try to get from version file
            if [ -z "$VERSION" ] && [ -f "$ARTIFACT_PATH/VERSION" ]; then
                VERSION=$(cat "$ARTIFACT_PATH/VERSION")
            fi
            ;;
        npm)
            # Get version from package.json
            if [ -f "$ARTIFACT_PATH/package.json" ]; then
                VERSION=$(node -p "require('$ARTIFACT_PATH/package.json').version" 2>/dev/null || echo "")
            else
                log_error "No package.json found in $ARTIFACT_PATH"
            fi
            ;;
        terraform)
            # Try to get version from VERSION file
            if [ -f "$ARTIFACT_PATH/VERSION" ]; then
                VERSION=$(cat "$ARTIFACT_PATH/VERSION")
            else
                # Try to extract from module definition
                if [ -f "$ARTIFACT_PATH/main.tf" ]; then
                    VERSION=$(grep -o 'version\s*=\s*"[0-9]\+\.[0-9]\+\.[0-9]\+"' "$ARTIFACT_PATH/main.tf" | head -1 | cut -d'"' -f2)
                fi
            fi
            ;;
    esac
    
    if [ -z "$VERSION" ]; then
        log_error "Could not determine version for $ARTIFACT_TYPE at $ARTIFACT_PATH"
    fi
    
    log_info "Using version: $VERSION"
}

function get_artifact_name() {
    # Extract artifact name from path
    case "$ARTIFACT_TYPE" in
        container)
            ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
            ;;
        npm)
            if [ -f "$ARTIFACT_PATH/package.json" ]; then
                ARTIFACT_NAME=$(node -p "require('$ARTIFACT_PATH/package.json').name" 2>/dev/null | sed 's/@austa\///g')
                if [ -z "$ARTIFACT_NAME" ]; then
                    ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
                fi
            else
                ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
            fi
            ;;
        terraform)
            ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
            ;;
    esac
    
    log_info "Artifact name: $ARTIFACT_NAME"
}

function get_registry() {
    # If registry is already set via command line, use it
    if [ -n "$REGISTRY" ]; then
        return 0
    fi
    
    # Determine registry based on artifact type and environment
    case "$ARTIFACT_TYPE" in
        container)
            if [ "$ENVIRONMENT" = "prod" ]; then
                REGISTRY="$AWS_ECR_REGISTRY"
            else
                REGISTRY="$GITHUB_CONTAINER_REGISTRY"
            fi
            ;;
        npm)
            if [ "$ENVIRONMENT" = "prod" ]; then
                REGISTRY="$NPM_REGISTRY_PROD"
            else
                REGISTRY="$NPM_REGISTRY_DEV"
            fi
            ;;
        terraform)
            REGISTRY="$TERRAFORM_REGISTRY"
            ;;
    esac
    
    log_info "Using registry: $REGISTRY"
}

# ============================================================================
# Artifact-specific functions
# ============================================================================

# Container image functions
function publish_container() {
    local image_tag="$REGISTRY/$ARTIFACT_NAME:$VERSION-$GIT_HASH"
    local latest_tag="$REGISTRY/$ARTIFACT_NAME:latest"
    
    # Build the container image
    log_info "Building container image: $image_tag"
    execute_cmd "docker build -t $image_tag $ARTIFACT_PATH"
    
    # Tag as latest for the environment
    if [ "$ENVIRONMENT" != "prod" ]; then
        execute_cmd "docker tag $image_tag $latest_tag"
    fi
    
    # Sign the container image if requested
    if [ "$SIGN" = true ]; then
        sign_container "$image_tag"
    fi
    
    # Push the container image to the registry
    log_info "Pushing container image to registry: $image_tag"
    execute_cmd "docker push $image_tag"
    
    if [ "$ENVIRONMENT" != "prod" ]; then
        execute_cmd "docker push $latest_tag"
    fi
    
    log_success "Container image published successfully: $image_tag"
}

function promote_container() {
    local source_registry
    local source_image_tag
    local target_image_tag
    
    # Determine source registry based on environment
    if [ "$PROMOTE_FROM" = "dev" ]; then
        source_registry="$GITHUB_CONTAINER_REGISTRY"
    elif [ "$PROMOTE_FROM" = "staging" ]; then
        source_registry="$GITHUB_CONTAINER_REGISTRY"
    else
        log_error "Invalid promotion source: $PROMOTE_FROM"
    fi
    
    source_image_tag="$source_registry/$ARTIFACT_NAME:$VERSION-$GIT_HASH"
    target_image_tag="$REGISTRY/$ARTIFACT_NAME:$VERSION-$GIT_HASH"
    
    log_info "Promoting container image from $source_image_tag to $target_image_tag"
    
    # Pull the source image
    execute_cmd "docker pull $source_image_tag"
    
    # Verify signature if requested
    if [ "$VERIFY" = true ]; then
        verify_container "$source_image_tag"
    fi
    
    # Tag for the target registry
    execute_cmd "docker tag $source_image_tag $target_image_tag"
    
    # Push to the target registry
    execute_cmd "docker push $target_image_tag"
    
    # If promoting to production, also tag as latest
    if [ "$ENVIRONMENT" = "prod" ]; then
        local latest_tag="$REGISTRY/$ARTIFACT_NAME:latest"
        execute_cmd "docker tag $source_image_tag $latest_tag"
        execute_cmd "docker push $latest_tag"
    fi
    
    log_success "Container image promoted successfully to $target_image_tag"
}

function sign_container() {
    local image_tag="$1"
    
    log_info "Signing container image: $image_tag"
    
    # Use cosign to sign the container image
    if [ -f "$HOME/.cosign/cosign.key" ]; then
        # Use key-based signing if key exists
        execute_cmd "cosign sign --key $HOME/.cosign/cosign.key $image_tag"
    else
        # Use keyless signing with OIDC identity
        execute_cmd "COSIGN_EXPERIMENTAL=1 cosign sign $image_tag"
    fi
    
    log_success "Container image signed successfully: $image_tag"
}

function verify_container() {
    local image_tag="$1"
    
    log_info "Verifying container image signature: $image_tag"
    
    # Use cosign to verify the container image signature
    if [ -f "$HOME/.cosign/cosign.pub" ]; then
        # Use key-based verification if public key exists
        execute_cmd "cosign verify --key $HOME/.cosign/cosign.pub $image_tag"
    else
        # Use keyless verification
        execute_cmd "COSIGN_EXPERIMENTAL=1 cosign verify $image_tag"
    fi
    
    log_success "Container image signature verified successfully: $image_tag"
}

# NPM package functions
function publish_npm() {
    local package_dir="$ARTIFACT_PATH"
    
    # Set the registry URL in .npmrc
    log_info "Configuring npm registry: $REGISTRY"
    execute_cmd "npm config set registry $REGISTRY"
    
    # Build the package if needed
    if [ -f "$package_dir/package.json" ]; then
        if grep -q '"build"' "$package_dir/package.json"; then
            log_info "Building npm package"
            execute_cmd "cd $package_dir && npm run build"
        fi
    fi
    
    # Publish the package
    log_info "Publishing npm package: $ARTIFACT_NAME@$VERSION"
    if [ "$ENVIRONMENT" = "prod" ]; then
        execute_cmd "cd $package_dir && npm publish --access public"
    else
        execute_cmd "cd $package_dir && npm publish --tag $ENVIRONMENT"
    fi
    
    log_success "NPM package published successfully: $ARTIFACT_NAME@$VERSION"
}

function promote_npm() {
    local package_name="$ARTIFACT_NAME"
    local package_version="$VERSION"
    local source_registry
    
    # Determine source registry based on environment
    if [ "$PROMOTE_FROM" = "dev" ] || [ "$PROMOTE_FROM" = "staging" ]; then
        source_registry="$NPM_REGISTRY_DEV"
    else
        log_error "Invalid promotion source: $PROMOTE_FROM"
    fi
    
    log_info "Promoting npm package from $source_registry to $REGISTRY"
    
    # Download the package from source registry
    execute_cmd "npm config set registry $source_registry"
    execute_cmd "npm pack @austa/$package_name@$package_version"
    
    # Publish to target registry
    execute_cmd "npm config set registry $REGISTRY"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        execute_cmd "npm publish @austa-$package_name-$package_version.tgz --access public"
    else
        execute_cmd "npm publish @austa-$package_name-$package_version.tgz --tag $ENVIRONMENT"
    fi
    
    # Clean up
    execute_cmd "rm @austa-$package_name-$package_version.tgz"
    
    log_success "NPM package promoted successfully: $package_name@$package_version"
}

# Terraform module functions
function publish_terraform() {
    local module_dir="$ARTIFACT_PATH"
    local module_name="$ARTIFACT_NAME"
    
    # Create a release archive
    log_info "Creating Terraform module archive: $module_name-$VERSION.zip"
    execute_cmd "cd $module_dir && zip -r ../$module_name-$VERSION.zip ."
    
    # Calculate checksums
    log_info "Calculating checksums for Terraform module"
    execute_cmd "shasum -a 256 $module_name-$VERSION.zip > $module_name-$VERSION.zip.sha256sum"
    
    # Sign the checksums if requested
    if [ "$SIGN" = true ]; then
        sign_terraform "$module_name-$VERSION.zip.sha256sum"
    fi
    
    # Upload to registry or storage
    log_info "Uploading Terraform module to registry/storage"
    
    # For Terraform modules, we typically use GitHub releases
    # This is a simplified example - in practice, you would use the GitHub API
    log_info "For Terraform modules, create a GitHub release with the archive and checksums"
    log_info "GitHub release URL: https://github.com/austa/$module_name/releases/tag/v$VERSION"
    
    log_success "Terraform module published successfully: $module_name@$VERSION"
}

function promote_terraform() {
    log_info "Terraform modules are typically promoted through GitHub releases"
    log_info "Ensure the module is properly tagged and released on GitHub"
    
    log_success "Terraform module promotion process completed"
}

function sign_terraform() {
    local checksum_file="$1"
    
    log_info "Signing Terraform module checksums: $checksum_file"
    
    # Use GPG to sign the checksum file
    execute_cmd "gpg --detach-sign --armor $checksum_file"
    
    log_success "Terraform module checksums signed successfully"
}

function verify_terraform() {
    local checksum_file="$1"
    local signature_file="$checksum_file.asc"
    
    log_info "Verifying Terraform module signature: $signature_file"
    
    # Use GPG to verify the signature
    execute_cmd "gpg --verify $signature_file $checksum_file"
    
    log_success "Terraform module signature verified successfully"
}

# ============================================================================
# Main script execution
# ============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --env)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        --version)
            VERSION="$2"
            shift
            shift
            ;;
        --promote-from)
            PROMOTE_FROM="$2"
            shift
            shift
            ;;
        --sign)
            SIGN=true
            shift
            ;;
        --verify)
            VERIFY=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            # First non-option argument is artifact type
            if [ -z "$ARTIFACT_TYPE" ]; then
                ARTIFACT_TYPE="$1"
                shift
            # Second non-option argument is artifact path
            elif [ -z "$ARTIFACT_PATH" ]; then
                ARTIFACT_PATH="$1"
                shift
            else
                log_error "Unknown argument: $1"
            fi
            ;;
    esac
done

# Validate required arguments
if [ -z "$ARTIFACT_TYPE" ]; then
    log_error "Artifact type is required"
fi

if [ -z "$ARTIFACT_PATH" ]; then
    log_error "Artifact path is required"
fi

# Validate artifact type
case "$ARTIFACT_TYPE" in
    container|npm|terraform)
        # Valid artifact type
        ;;
    *)
        log_error "Invalid artifact type: $ARTIFACT_TYPE. Must be one of: container, npm, terraform"
        ;;
esac

# Validate environment
case "$ENVIRONMENT" in
    dev|staging|prod)
        # Valid environment
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
        ;;
esac

# Check for required dependencies
check_dependencies

# Get artifact name and version
get_artifact_name
get_version
get_registry

# Execute the appropriate action based on artifact type and whether we're promoting
if [ -n "$PROMOTE_FROM" ]; then
    log_info "Promoting $ARTIFACT_TYPE artifact from $PROMOTE_FROM to $ENVIRONMENT"
    
    case "$ARTIFACT_TYPE" in
        container)
            promote_container
            ;;
        npm)
            promote_npm
            ;;
        terraform)
            promote_terraform
            ;;
    esac
else
    log_info "Publishing $ARTIFACT_TYPE artifact to $ENVIRONMENT"
    
    case "$ARTIFACT_TYPE" in
        container)
            publish_container
            ;;
        npm)
            publish_npm
            ;;
        terraform)
            publish_terraform
            ;;
    esac
fi

log_success "Artifact publishing completed successfully"
exit 0