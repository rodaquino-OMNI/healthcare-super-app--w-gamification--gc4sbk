FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache python3 make g++ curl bash

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Second stage: runtime
FROM node:18-alpine

WORKDIR /app

# Install Kafka tools for topic management
RUN apk add --no-cache bash curl jq

# Install Kafka binaries
RUN curl -sL https://archive.apache.org/dist/kafka/3.3.1/kafka_2.13-3.3.1.tgz | tar xz -C /tmp && \
    mv /tmp/kafka_2.13-3.3.1/bin/* /usr/local/bin/ && \
    rm -rf /tmp/kafka_2.13-3.3.1

# Copy built application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copy scripts directory
COPY scripts ./scripts

# Make scripts executable
RUN chmod +x ./scripts/*.sh

# Expose port
EXPOSE 3000

# Set entrypoint to our custom script
ENTRYPOINT ["/app/scripts/entrypoint.sh"]