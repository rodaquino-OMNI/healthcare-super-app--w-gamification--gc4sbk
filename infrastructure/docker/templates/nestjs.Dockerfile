# =============================================================================
# AUSTA SuperApp - NestJS Microservice Dockerfile Template
# =============================================================================
# This Dockerfile implements a multi-stage build pattern for NestJS services
# with security best practices, proper layer caching, and minimal runtime image.
#
# Features:
# - Multi-stage build for minimal production image size
# - Proper layer caching for efficient builds
# - Security hardening with non-root user
# - Health check configuration for container orchestration
# - Support for npm, yarn, and pnpm package managers
# - Configurable build arguments for flexibility
# - Container metadata via OCI labels
# =============================================================================

# ARG values can be overridden at build time with --build-arg
# Example: docker build --build-arg NODE_VERSION=20 -t austa-service:latest .
ARG NODE_VERSION=18
ARG PORT=3000
ARG SERVICE_NAME="nestjs-service"

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM node:${NODE_VERSION}-alpine AS builder

# Set working directory
WORKDIR /app

# Add build dependencies (required for native modules)
# These will be removed in the final image
RUN apk add --no-cache python3 make g++ git

# Copy package files for dependency installation
# This is done before copying the rest of the code to leverage Docker layer caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies with exact versions from lockfile
# Using --frozen-lockfile/ci ensures reproducible builds
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci; \
    elif [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
        npm install; \
    fi

# Copy application source code
# This is done after dependency installation to leverage layer caching
COPY . .

# Build the application
RUN npm run build

# Optionally run tests
# Uncomment the following line to run tests during build
# RUN npm run test

# =============================================================================
# RUNTIME STAGE
# =============================================================================
FROM node:${NODE_VERSION}-alpine

# Add metadata labels
LABEL org.opencontainers.image.vendor="AUSTA SuperApp" \
      org.opencontainers.image.title="${SERVICE_NAME}" \
      org.opencontainers.image.description="NestJS backend service for AUSTA SuperApp" \
      org.opencontainers.image.licenses="Proprietary" \
      org.opencontainers.image.source="https://github.com/austa/superapp" \
      maintainer="AUSTA DevOps Team <devops@austa.health>"

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=${PORT}

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set security configurations
# This prevents privilege escalation attacks
RUN mkdir -p /app && \
    chown -R nestjs:nodejs /app && \
    chmod -R 755 /app

# Copy only necessary files from builder stage
# This minimizes the final image size and attack surface
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Optionally copy additional required files (uncomment as needed)
# COPY --from=builder --chown=nestjs:nodejs /app/.env.example ./
# COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Install only production dependencies if not already present
# This further reduces the image size
RUN if [ -f package-lock.json ]; then \
        npm prune --production; \
    elif [ -f yarn.lock ]; then \
        yarn install --production --frozen-lockfile; \
    fi

# Configure health check
# Note: The NestJS application must implement a /health endpoint
# This can be done using @nestjs/terminus health checks module
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:$PORT/health || exit 1

# Expose the application port
EXPOSE $PORT

# Note: Resource limits should be set at runtime
# Example Kubernetes configuration:
# resources:
#   requests:
#     cpu: "500m"
#     memory: "512Mi"
#   limits:
#     cpu: "1000m"
#     memory: "1Gi"

# Switch to non-root user
USER nestjs

# Set the entrypoint
CMD ["node", "dist/main"]