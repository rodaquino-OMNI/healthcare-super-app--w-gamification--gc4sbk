# Multi-stage Dockerfile for Next.js applications in the AUSTA SuperApp
# Optimized for production with proper caching, security, and performance
#
# Features:
# - Multi-stage build for optimized image size
# - Monorepo-aware build process with workspace dependencies
# - Proper caching of dependencies for faster builds
# - Security hardening with non-root user execution
# - Health checks for container orchestration
# - Environment variable configuration for different environments
# - Static asset optimization for Next.js
# - Server-side rendering support

# ===== BUILD STAGE =====
FROM node:18.15.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies required for node-gyp on Alpine
RUN apk add --no-cache python3 make g++ git

# Set build arguments for environment-specific builds
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_GAMIFICATION_URL

# First, copy workspace configuration for monorepo setup
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* turbo.json* ./
COPY .yarn ./.yarn
COPY .yarnrc.yml* ./

# Copy package.json files from all workspaces for better layer caching
COPY src/web/design-system/package.json ./src/web/design-system/
COPY src/web/primitives/package.json ./src/web/primitives/
COPY src/web/interfaces/package.json ./src/web/interfaces/
COPY src/web/journey-context/package.json ./src/web/journey-context/
COPY src/web/web/package.json ./src/web/web/

# Install dependencies with exact versions (production only in final stage)
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy application code
# First copy shared packages that the web app depends on
COPY src/web/primitives ./src/web/primitives
COPY src/web/interfaces ./src/web/interfaces
COPY src/web/journey-context ./src/web/journey-context
COPY src/web/design-system ./src/web/design-system

# Then copy the web app code
COPY src/web/web ./src/web/web
COPY tsconfig.json ./

# Build the shared packages first
RUN pnpm --filter="@design-system/primitives" build && \
    pnpm --filter="@austa/interfaces" build && \
    pnpm --filter="@austa/journey-context" build && \
    pnpm --filter="@austa/design-system" build

# Build the Next.js application
WORKDIR /app/src/web/web

# Optimize build for production
RUN pnpm build

# Optional: Analyze bundle size during build
# RUN ANALYZE=true pnpm build

# ===== PRODUCTION STAGE =====
FROM node:18.15.0-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy only necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/package.json ./package.json

# For standalone mode, copy the standalone folder instead
# COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/.next/static ./.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/src/web/web/public ./public

# Install only production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --prod --frozen-lockfile

# Clean npm cache to reduce image size
RUN pnpm store prune

# Set proper permissions
RUN chmod -R 755 /app

# Expose the listening port
EXPOSE 3000

# Set runtime environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Configure runtime environment variables
# These can be overridden at runtime
ENV NEXT_PUBLIC_API_URL="https://api.austa.health"
ENV NEXT_PUBLIC_ENVIRONMENT="production"
ENV NEXT_PUBLIC_AUTH_URL="https://auth.austa.health"
ENV NEXT_PUBLIC_GAMIFICATION_URL="https://gamification.austa.health"

# Switch to non-root user
USER nextjs

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]