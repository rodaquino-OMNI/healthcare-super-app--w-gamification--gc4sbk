#!/bin/bash

# =========================================================================
# AUSTA SuperApp - Docker Image Build Script
# =========================================================================
# This script builds, tags, and pushes Docker container images for all services
# with layer caching, multi-stage optimization, and standardized versioning.
#
# Usage: ./build-image.sh [OPTIONS] SERVICE_PATH
#
# Options:
#   -r, --registry      Container registry URL (default: ghcr.io/austa)
#   -p, --push          Push image after building (default: false)
#   -c, --cache-dir     BuildKit cache directory (default: /tmp/.buildx-cache)
#   -t, --tag           Additional tag to apply (optional)
#   -e, --env           Environment (dev, staging, prod) (default: dev)
#   -h, --help          Show this help message
#
# Example: ./build-image.sh -p -e staging src/backend/api-gateway
#
# Best Practices for Dockerfile Optimization:
# 1. Order layers from least frequently to most frequently changed
# 2. Place dependency installation before copying application code
# 3. Use multi-stage builds to minimize final image size
# 4. Leverage BuildKit cache for efficient rebuilds
# =========================================================================

set -eo pipefail

# Default values
REGISTRY="ghcr.io/austa"
PUSH=false
CACHE_DIR="/tmp/.buildx-cache"
ENVIRONMENT="dev"
ADDITIONAL_TAG=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--registry)
      REGISTRY="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -c|--cache-dir)
      CACHE_DIR="$2"
      shift 2
      ;;
    -t|--tag)
      ADDITIONAL_TAG="$2"
      shift 2
      ;;
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./build-image.sh [OPTIONS] SERVICE_PATH"
      echo ""
      echo "Options:"
      echo "  -r, --registry      Container registry URL (default: ghcr.io/austa)"
      echo "  -p, --push          Push image after building (default: false)"
      echo "  -c, --cache-dir     BuildKit cache directory (default: /tmp/.buildx-cache)"
      echo "  -t, --tag           Additional tag to apply (optional)"
      echo "  -e, --env           Environment (dev, staging, prod) (default: dev)"
      echo "  -h, --help          Show this help message"
      echo ""
      echo "Example: ./build-image.sh -p -e staging src/backend/api-gateway"
      exit 0
      ;;
    *)
      SERVICE_PATH="$1"
      shift
      ;;
  esac
done

# Validate required arguments
if [ -z "$SERVICE_PATH" ]; then
  echo "Error: SERVICE_PATH is required"
  echo "Run './build-image.sh --help' for usage information"
  exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Environment must be one of: dev, staging, prod"
  exit 1
fi

# Determine service name from path
SERVICE_NAME=$(basename "$SERVICE_PATH")

# Set registry based on environment
if [ "$ENVIRONMENT" == "prod" ]; then
  # Use AWS ECR for production
  if [[ "$REGISTRY" == "ghcr.io/austa" ]]; then
    # Only override if using the default registry
    REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/austa"
  fi
fi

# Extract version from package.json
if [ -f "$SERVICE_PATH/package.json" ]; then
  VERSION=$(node -p "require('./$SERVICE_PATH/package.json').version || '0.1.0'")
else
  VERSION="0.1.0"
  echo "Warning: No package.json found in $SERVICE_PATH, using default version $VERSION"
fi

# Get git hash
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Construct image tags
IMAGE_NAME="$REGISTRY/$SERVICE_NAME"
VERSION_TAG="$VERSION-$GIT_HASH"
FULL_TAG="$IMAGE_NAME:$VERSION_TAG"
LATEST_TAG="$IMAGE_NAME:latest"
ENV_TAG="$IMAGE_NAME:$ENVIRONMENT"

# Create tag list
TAGS=("$FULL_TAG" "$ENV_TAG")

# Add latest tag for staging and prod
if [ "$ENVIRONMENT" != "dev" ]; then
  TAGS+=("$LATEST_TAG")
fi

# Add additional tag if provided
if [ -n "$ADDITIONAL_TAG" ]; then
  TAGS+=("$IMAGE_NAME:$ADDITIONAL_TAG")
fi

# Prepare tag arguments for docker buildx
TAG_ARGS=""
for TAG in "${TAGS[@]}"; do
  TAG_ARGS="$TAG_ARGS --tag $TAG"
done

# Ensure cache directory exists
mkdir -p "$CACHE_DIR"

# Set up Docker BuildKit if not already enabled
export DOCKER_BUILDKIT=1

# Check if buildx is available
if ! docker buildx version &>/dev/null; then
  echo "Setting up Docker BuildKit..."
  docker buildx create --use --name austa-builder
fi

# Determine if Dockerfile exists or use default location
DOCKERFILE="$SERVICE_PATH/Dockerfile"
if [ ! -f "$DOCKERFILE" ]; then
  # Check if there's a template for this service type
  if [[ "$SERVICE_PATH" == *"/backend/"* ]]; then
    DOCKERFILE="infrastructure/docker/templates/backend.Dockerfile"
  elif [[ "$SERVICE_PATH" == *"/web/"* ]]; then
    DOCKERFILE="infrastructure/docker/templates/frontend.Dockerfile"
  else
    echo "Error: No Dockerfile found for $SERVICE_PATH"
    exit 1
  fi
  
  echo "Using template Dockerfile: $DOCKERFILE"
fi

# Determine build context
BUILD_CONTEXT="."

# Print build information
echo "=========================================================================="
echo "Building Docker image for $SERVICE_NAME"
echo "Service path:     $SERVICE_PATH"
echo "Dockerfile:       $DOCKERFILE"
echo "Version:          $VERSION"
echo "Git hash:         $GIT_HASH"
echo "Environment:      $ENVIRONMENT"
echo "Registry:         $REGISTRY"
echo "Cache directory:  $CACHE_DIR"
echo "Will push:        $PUSH"
echo "Tags:             ${TAGS[*]}"
echo "=========================================================================="

# Build the image
BUILD_ARGS=()
BUILD_ARGS+=("--file" "$DOCKERFILE")
BUILD_ARGS+=("--build-arg" "SERVICE_PATH=$SERVICE_PATH")
BUILD_ARGS+=("--build-arg" "SERVICE_NAME=$SERVICE_NAME")
BUILD_ARGS+=("--build-arg" "VERSION=$VERSION")
BUILD_ARGS+=("--build-arg" "GIT_HASH=$GIT_HASH")
BUILD_ARGS+=("--build-arg" "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')")
BUILD_ARGS+=("--build-arg" "ENVIRONMENT=$ENVIRONMENT")
BUILD_ARGS+=("--cache-from" "type=local,src=$CACHE_DIR")
BUILD_ARGS+=("--cache-to" "type=local,dest=$CACHE_DIR-new,mode=max")

# Add all tags
for TAG in "${TAGS[@]}"; do
  BUILD_ARGS+=("--tag" "$TAG")
done

# Add push flag if enabled
if [ "$PUSH" = true ]; then
  BUILD_ARGS+=("--push")
fi

# Execute the build
echo "Building image..."
docker buildx build "${BUILD_ARGS[@]}" "$BUILD_CONTEXT"

# Rotate the cache (buildx creates a new cache directory)
# This strategy ensures we maintain a clean cache state while preserving layers
# that can be reused in subsequent builds, significantly improving build times
if [ -d "$CACHE_DIR-new" ]; then
  rm -rf "$CACHE_DIR"
  mv "$CACHE_DIR-new" "$CACHE_DIR"
fi

echo "=========================================================================="
echo "Build completed successfully!"
if [ "$PUSH" = true ]; then
  echo "Image pushed to registry with tags:"
else
  echo "Image built locally with tags:"
fi

for TAG in "${TAGS[@]}"; do
  echo " - $TAG"
done
echo "=========================================================================="

# Add metadata labels for image scanning and tracking
if [ "$PUSH" = true ]; then
  echo "Adding metadata annotations..."
  
  # This would typically use a tool like Cosign for image signing
  # or OCI annotations, but a simplified version is shown here
  echo "Image metadata:"
  echo " - org.opencontainers.image.created: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo " - org.opencontainers.image.version: $VERSION"
  echo " - org.opencontainers.image.revision: $GIT_HASH"
  echo " - io.austa.service.name: $SERVICE_NAME"
  echo " - io.austa.environment: $ENVIRONMENT"
  
  # For production images, we would typically perform additional security scanning
  if [ "$ENVIRONMENT" == "prod" ]; then
    echo "\nNote: For production deployments, additional security scanning would be performed here."
    echo "This would include vulnerability scanning, secrets detection, and policy validation."
  fi
fi

exit 0