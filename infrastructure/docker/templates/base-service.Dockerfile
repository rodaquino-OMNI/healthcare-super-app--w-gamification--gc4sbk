# Base Service Dockerfile Template for AUSTA SuperApp
# This template provides a standardized foundation for containerizing various service types
# with security best practices, efficient layer caching, and optimized runtime configuration.
#
# This template is part of the AUSTA SuperApp refactoring effort to standardize
# container patterns across services and implement security best practices by default.
#
# Usage:
# 1. Create a service-specific Dockerfile that extends this template
# 2. Override build arguments as needed
# 3. Add service-specific build steps
#
# Example:
# ```
# FROM ${REGISTRY}/base-service:latest as builder
# ARG PORT=4000
# ARG SERVICE_NAME=api-gateway
# 
# # Add service-specific build steps here
# ```

# ===== BUILD ARGUMENTS =====
# These arguments can be customized when building the image
# Modify these values in your service-specific Dockerfile with:
# FROM ${REGISTRY}/base-service:latest
# ARG PORT=4000

# Base image for the build stage
ARG BUILD_IMAGE=node:18-alpine
# Base image for the runtime stage
ARG RUNTIME_IMAGE=node:18-alpine
# Working directory inside the container
ARG WORKDIR=/app
# User ID to run the container (non-root)
ARG USER_ID=1000
# Group ID to run the container (non-root)
ARG GROUP_ID=1000
# Port to expose (if applicable)
ARG PORT=3000
# Command to run the application
ARG CMD=["node", "dist/main.js"]

# ===== BUILD STAGE =====
# This stage compiles and builds the application
FROM ${BUILD_IMAGE} AS builder

# Set working directory
WORKDIR ${WORKDIR}

# Copy package files first for better layer caching
# Only copy what's needed for dependency installation
COPY package*.json ./
# If using yarn, uncomment the following line
# COPY yarn.lock ./
# For monorepo setups, copy workspace configuration
# COPY lerna.json tsconfig.json ./
# COPY packages/shared/ ./packages/shared/

# Install dependencies
# For production builds, use --production or --only=production flag
RUN npm ci
# If using yarn, uncomment the following line and comment out the npm ci line above
# RUN yarn install --frozen-lockfile

# For monorepo setups with workspace tools
# RUN npx lerna bootstrap --scope=@austa/service-name

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build
# If using a different build command, replace the line above
# RUN npm run build:prod

# For monorepo setups with specific service builds
# RUN npx lerna run build --scope=@austa/service-name

# Run tests if needed as part of the build process
# RUN npm test

# Generate Prisma client if applicable
# RUN npx prisma generate

# ===== RUNTIME STAGE =====
# This stage contains only what's needed to run the application
FROM ${RUNTIME_IMAGE}

# Import build arguments into this stage
ARG WORKDIR
ARG USER_ID
ARG GROUP_ID
ARG PORT
ARG CMD

# Set working directory
WORKDIR ${WORKDIR}

# Install production-only dependencies if needed
# Uncomment and modify if your application requires runtime dependencies
# COPY package*.json ./
# RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder ${WORKDIR}/dist ./dist
# Copy package.json for reference (if needed)
COPY --from=builder ${WORKDIR}/package.json ./

# Copy additional runtime files if needed
# COPY --from=builder ${WORKDIR}/config ./config
# COPY --from=builder ${WORKDIR}/prisma ./prisma
# COPY --from=builder ${WORKDIR}/node_modules/.prisma ./node_modules/.prisma

# For journey-specific services, copy journey configuration
# COPY --from=builder ${WORKDIR}/src/journey-config ./journey-config

# Create a non-root user and group
# Alpine uses addgroup and adduser
RUN addgroup -g ${GROUP_ID} appuser && \
    adduser -u ${USER_ID} -G appuser -s /bin/sh -D appuser && \
    chown -R appuser:appuser ${WORKDIR}

# If using a debian-based image, use the following instead:
# RUN groupadd -g ${GROUP_ID} appuser && \
#     useradd -u ${USER_ID} -g appuser -s /bin/bash -m appuser && \
#     chown -R appuser:appuser ${WORKDIR}

# Install additional runtime dependencies if needed
# Keep this list minimal for security and image size
# RUN apk --no-cache add curl ca-certificates tzdata

# Set proper permissions
RUN chmod -R 755 ${WORKDIR}

# Expose the service port
EXPOSE ${PORT}

# Switch to non-root user for better security
USER appuser

# Set environment variables
ENV NODE_ENV=production \
    PORT=${PORT} \
    SERVICE_NAME="austa-service" \
    JOURNEY_ENABLED=false \
    TRACING_ENABLED=true \
    METRICS_ENABLED=true

# Health check configuration
# Customize the health check endpoint based on your service
# Default health check uses the /health endpoint which should be implemented in all services
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# For journey-specific services, you may want to use a more specific health check
# HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health/journey || exit 1

# Run the application
CMD ${CMD}

# ===== CUSTOMIZATION NOTES =====
# 1. For non-Node.js services, change BUILD_IMAGE and RUNTIME_IMAGE arguments
#    Example for Python: python:3.10-alpine
#    Example for Java: eclipse-temurin:17-jre-alpine
# 
# 2. Adjust build commands based on your technology stack
#    For Python: RUN pip install -r requirements.txt
#    For Java: RUN ./gradlew build
# 
# 3. Modify the COPY commands to include only what's needed for your service
#    Example: COPY --from=builder ${WORKDIR}/target/*.jar ./app.jar
# 
# 4. Update the CMD instruction for your specific runtime
#    Example for Python: CMD ["python", "app.py"]
#    Example for Java: CMD ["java", "-jar", "app.jar"]
# 
# 5. Security considerations:
#    - Always run as a non-root user
#    - Minimize installed packages
#    - Use specific version tags for base images
#    - Remove build tools from the runtime image
#    - Scan images for vulnerabilities before deployment
# 
# 6. Performance optimizations:
#    - Keep layers small and focused
#    - Use .dockerignore to exclude unnecessary files
#    - Consider using multi-stage builds for compiled languages
#    - Optimize dependency installation for your specific stack
#
# 7. Journey-specific services:
#    - Set JOURNEY_ENABLED=true in environment variables
#    - Copy journey-specific configuration files
#    - Include journey-specific health checks
#    - Set appropriate resource limits in Kubernetes deployment
#
# 8. Gamification integration:
#    - For services that emit gamification events, ensure Kafka client is properly configured
#    - Include event schema validation in the build process
#    - Set appropriate retry and error handling for event emission
#
# 9. Monitoring and observability:
#    - Ensure Prometheus metrics endpoint is exposed
#    - Configure proper logging with correlation IDs
#    - Enable distributed tracing with appropriate sampling
#    - Set up proper health check endpoints for readiness and liveness probes