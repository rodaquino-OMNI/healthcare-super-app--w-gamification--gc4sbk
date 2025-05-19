#!/bin/bash

# =========================================================
# AUSTA SuperApp Docker Image Build Script
# =========================================================
# This script builds optimized Docker images for all AUSTA SuperApp services
# using multi-stage builds, layer caching, and proper versioning.
#
# Features:
# - Multi-stage build pattern with Alpine-based images
# - Layer caching optimization for faster builds
# - Proper image versioning: {service}:{semantic-version}-{git-hash}
# - Dependency optimization for smaller images
# - BuildKit support for parallel build steps
# - Security scanning integration
# =========================================================

set -e

# Configuration
REGISTRY="austa-superapp"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../"
SERVICES=("api-gateway" "auth-service" "health-service" "care-service" "plan-service" "gamification-engine" "notification-service")
BUILD_ARGS=""
PUSH=false
SCAN=true

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Print usage information
function print_usage {
  echo -e "\nUsage: $0 [options]\n"
  echo -e "Options:"
  echo -e "  -s, --service SERVICE  Build specific service(s) (comma-separated)"
  echo -e "  -t, --tag TAG          Use specific tag instead of auto-generated one"
  echo -e "  -p, --push             Push images to registry after building"
  echo -e "  -n, --no-scan          Skip security scanning"
  echo -e "  -h, --help             Show this help message"
  echo -e "\nAvailable services: ${SERVICES[*]}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--service)
      IFS=',' read -ra SELECTED_SERVICES <<< "$2"
      shift 2
      ;;
    -t|--tag)
      CUSTOM_TAG="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -n|--no-scan)
      SCAN=false
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
done

# If specific services were selected, validate them
if [[ ${#SELECTED_SERVICES[@]} -gt 0 ]]; then
  for service in "${SELECTED_SERVICES[@]}"; do
    if [[ ! " ${SERVICES[*]} " =~ " ${service} " ]]; then
      echo -e "${RED}Error: Unknown service '${service}'${NC}"
      echo -e "Available services: ${SERVICES[*]}"
      exit 1
    fi
  done
  SERVICES=("${SELECTED_SERVICES[@]}")
fi

# Enable BuildKit for improved build performance
export DOCKER_BUILDKIT=1

# Get version information
function get_version_info {
  local service=$1
  local service_dir
  
  case $service in
    api-gateway|auth-service|health-service|care-service|plan-service|gamification-engine|notification-service)
      service_dir="${BASE_DIR}/src/backend/${service}"
      ;;
    *)
      echo -e "${RED}Error: Unknown service path for '${service}'${NC}"
      exit 1
      ;;
  esac
  
  # Extract semantic version from package.json
  if [[ -f "${service_dir}/package.json" ]]; then
    VERSION=$(grep -o '"version": "[^"]*"' "${service_dir}/package.json" | cut -d '"' -f 4)
  else
    VERSION="0.1.0"
    echo -e "${YELLOW}Warning: No package.json found for ${service}, using default version ${VERSION}${NC}"
  fi
  
  # Get git hash
  GIT_HASH=$(git -C "${BASE_DIR}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  
  # Return version-hash format
  echo "${VERSION}-${GIT_HASH}"
}

# Build a single service
function build_service {
  local service=$1
  local tag_suffix=$2
  local dockerfile_path
  local context_path
  
  echo -e "\n${BLUE}Building ${service}...${NC}"
  
  # Determine paths based on service
  case $service in
    api-gateway|auth-service|health-service|care-service|plan-service|gamification-engine|notification-service)
      dockerfile_path="${BASE_DIR}/src/backend/${service}/Dockerfile"
      context_path="${BASE_DIR}/src/backend/${service}"
      ;;
    *)
      echo -e "${RED}Error: Unknown service path for '${service}'${NC}"
      return 1
      ;;
  esac
  
  # Check if Dockerfile exists
  if [[ ! -f "${dockerfile_path}" ]]; then
    echo -e "${RED}Error: Dockerfile not found at ${dockerfile_path}${NC}"
    return 1
  fi
  
  # Prepare tag
  if [[ -n "${CUSTOM_TAG}" ]]; then
    TAG="${REGISTRY}/${service}:${CUSTOM_TAG}"
  else
    TAG="${REGISTRY}/${service}:${tag_suffix}"
  fi
  
  # Also create latest tag
  LATEST_TAG="${REGISTRY}/${service}:latest"
  
  echo -e "${BLUE}Building image: ${TAG}${NC}"
  
  # Build the image with cache optimization
  docker build \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --cache-from "${LATEST_TAG}" \
    --tag "${TAG}" \
    --tag "${LATEST_TAG}" \
    ${BUILD_ARGS} \
    -f "${dockerfile_path}" \
    "${context_path}"
  
  echo -e "${GREEN}Successfully built ${TAG}${NC}"
  
  # Run security scanning if enabled
  if [[ "${SCAN}" == true ]]; then
    echo -e "${BLUE}Scanning image for vulnerabilities...${NC}"
    if command -v trivy &> /dev/null; then
      trivy image --severity HIGH,CRITICAL "${TAG}" || {
        echo -e "${YELLOW}Warning: Security vulnerabilities found in ${TAG}${NC}"
      }
    else
      echo -e "${YELLOW}Warning: Trivy not installed, skipping security scan${NC}"
    fi
  fi
  
  # Push image if requested
  if [[ "${PUSH}" == true ]]; then
    echo -e "${BLUE}Pushing image: ${TAG}${NC}"
    docker push "${TAG}"
    docker push "${LATEST_TAG}"
    echo -e "${GREEN}Successfully pushed ${TAG}${NC}"
  fi
  
  return 0
}

# Main execution
echo -e "${BLUE}=== AUSTA SuperApp Docker Image Build ===${NC}"
echo -e "${BLUE}Building services: ${SERVICES[*]}${NC}"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
  exit 1
fi

# Build each service
FAILED_SERVICES=()
for service in "${SERVICES[@]}"; do
  # Get version info for tagging
  VERSION_TAG=$(get_version_info "${service}")
  
  # Build the service
  if build_service "${service}" "${VERSION_TAG}"; then
    echo -e "${GREEN}✓ ${service} build completed successfully${NC}"
  else
    echo -e "${RED}✗ ${service} build failed${NC}"
    FAILED_SERVICES+=("${service}")
  fi
done

# Summary
echo -e "\n${BLUE}=== Build Summary ===${NC}"
if [[ ${#FAILED_SERVICES[@]} -eq 0 ]]; then
  echo -e "${GREEN}All services built successfully!${NC}"
else
  echo -e "${RED}The following services failed to build:${NC}"
  for service in "${FAILED_SERVICES[@]}"; do
    echo -e "${RED}- ${service}${NC}"
  done
  exit 1
fi

# Provide instructions for manual pushing if not pushed automatically
if [[ "${PUSH}" != true ]]; then
  echo -e "\n${YELLOW}Images built but not pushed. To push manually:${NC}"
  for service in "${SERVICES[@]}"; do
    if [[ -n "${CUSTOM_TAG}" ]]; then
      echo -e "docker push ${REGISTRY}/${service}:${CUSTOM_TAG}"
    else
      VERSION_TAG=$(get_version_info "${service}")
      echo -e "docker push ${REGISTRY}/${service}:${VERSION_TAG}"
    fi
    echo -e "docker push ${REGISTRY}/${service}:latest"
  done
fi

exit 0