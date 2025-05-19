# AUSTA SuperApp Dockerfile Templates

This directory contains standardized Dockerfile templates for containerizing various components of the AUSTA SuperApp. These templates implement best practices for security, performance, and maintainability while providing consistent patterns across all services.

## Available Templates

| Template | Purpose | Key Features |
|----------|---------|-------------|
| [`base-service.Dockerfile`](./base-service.Dockerfile) | Versatile base for general services | Configurable options, security defaults, standardized environment variables |
| [`nestjs.Dockerfile`](./nestjs.Dockerfile) | NestJS backend services | Multi-stage builds, optimized for Node.js microservices, health checks |
| [`nextjs.Dockerfile`](./nextjs.Dockerfile) | Next.js frontend applications | Static asset handling, SSR support, production optimizations |
| [`react-native.Dockerfile`](./react-native.Dockerfile) | React Native development | Android/iOS build tools, volume mappings, debugging utilities |

## Containerization Approach

All templates follow a consistent multi-stage build pattern with security-focused base images:

### Multi-Stage Build Pattern

The templates use a multi-stage build approach to separate the build environment from the runtime environment:

1. **Builder Stage**: Contains all build tools and dependencies needed for compilation
2. **Runtime Stage**: Contains only the minimal runtime dependencies

This approach results in significantly smaller images and reduces the attack surface by excluding build tools from the final image.

Example pattern from `nestjs.Dockerfile`:

```dockerfile
# Builder stage with full development dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage with only production dependencies
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/main"]
```

### Base Image Principles

All templates adhere to these base image principles:

- **Minimal Alpine-based images** to reduce attack surface
- **Specific version pinning** to ensure reproducibility
- **Non-root user execution** for all containers
- **Removal of build tools** and development dependencies in production images

## Image Versioning Strategy

The AUSTA SuperApp employs a consistent image versioning strategy:

### Tag Format

```
{service}:{semantic-version}-{git-hash}
```

Example: `api-gateway:1.2.3-a1b2c3d`

### Version Sources

- **Semantic version**: Extracted from package.json
- **Git hash**: Short commit hash from the CI environment

### Registry Organization

- **Development images**: Stored in GitHub Container Registry
- **Production images**: Stored in private Amazon ECR repository

### Immutability Policy

- Once pushed, image tags are never overwritten
- Latest tag is updated only after successful tests
- Deployments always reference specific image tags, never `latest`

## Build Optimization Techniques

The templates implement several techniques to optimize container builds:

### Layer Caching

All templates follow proper ordering of Dockerfile operations to maximize cache usage:

```dockerfile
# Copy dependency files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Then copy application code
COPY . .
```

This approach ensures that dependencies are only reinstalled when package files change, not when application code changes.

### Multi-stage Builds

The multi-stage build pattern provides several optimization benefits:

- Separate build and runtime stages
- Only production artifacts included in final image
- Development dependencies excluded from runtime images

### Dependency Optimization

The templates include strategies for efficient dependency management:

- Using package manager lockfiles for deterministic installs
- Pruning dev dependencies in production images
- Deduplicating dependencies where possible

### Build Acceleration

The templates are designed to work with:

- BuildKit for parallel build steps
- GitHub Actions caching for node_modules and build artifacts
- Local layer caching for developer workflow

## Security Considerations

Container security is a priority in all templates with scanning enforced at multiple stages:

### Pre-build Security

- Dependencies are scanned for vulnerabilities via npm audit and GitHub dependabot
- Policy-as-code validation using checkov or similar tools

### Build-time Security

- Base images are scanned for vulnerabilities
- Software composition analysis for dependencies
- Secrets detection to prevent credential leakage

### Runtime Security

- Non-root user execution for all containers
- Minimal base images to reduce attack surface
- Removal of unnecessary tools and packages
- Read-only file systems where possible

## Usage Examples

### Building a NestJS Microservice

```bash
# From the service directory
docker build -t austa/health-service:dev -f ../../infrastructure/docker/templates/nestjs.Dockerfile .
```

### Building the Next.js Web Frontend

```bash
# From the web directory
docker build -t austa/web:dev -f ../../infrastructure/docker/templates/nextjs.Dockerfile .
```

### Setting Up React Native Development Environment

```bash
# From the mobile directory
docker build -t austa/mobile-dev:latest -f ../../infrastructure/docker/templates/react-native.Dockerfile .
docker run -it -v $(pwd):/app -p 8081:8081 austa/mobile-dev:latest
```

### Using the Base Service Template

```bash
# From the service directory
docker build -t austa/custom-service:dev -f ../../infrastructure/docker/templates/base-service.Dockerfile .
```

## Customization Guidelines

### Environment Variables

All templates support environment variables through build args and runtime ENV directives:

```dockerfile
# Build-time arguments
ARG NODE_ENV=production
ARG PORT=3000

# Runtime environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
```

When building, you can override these defaults:

```bash
docker build --build-arg NODE_ENV=development --build-arg PORT=8080 -t my-service .
```

### Health Checks

The service templates include configurable health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1
```

Customize the health check endpoint based on your service's health route.

### Resource Limits

When running containers, set appropriate resource limits:

```bash
docker run --memory=512m --cpus=0.5 my-service
```

In Kubernetes, these are defined in the deployment manifests.

## Important Security Notes

1. **Never run containers as root** in production environments
2. **Always scan images** before deployment using tools like Trivy or Clair
3. **Keep base images updated** to include the latest security patches
4. **Use specific version tags** rather than `latest` to ensure reproducibility
5. **Implement least privilege** by limiting container capabilities

## Troubleshooting

### Common Issues

#### Build Failures

- **Issue**: Node.js memory errors during build
  - **Solution**: Increase Docker memory allocation or add `NODE_OPTIONS="--max-old-space-size=4096"`

- **Issue**: Package installation failures
  - **Solution**: Ensure package-lock.json is included and use `npm ci` instead of `npm install`

#### Runtime Issues

- **Issue**: Permission denied errors
  - **Solution**: Check that the container user has appropriate permissions for mounted volumes

- **Issue**: Container exits immediately
  - **Solution**: Verify the CMD instruction and ensure the application doesn't crash on startup

### Debugging Containers

To debug a running container:

```bash
# Attach to a running container
docker exec -it <container_id> /bin/sh

# View logs
docker logs -f <container_id>

# Inspect container details
docker inspect <container_id>
```

## Best Practices

1. **Keep images small** by removing unnecessary files and using .dockerignore
2. **Layer your Dockerfile efficiently** to maximize cache usage
3. **Pin specific versions** of base images and dependencies
4. **Use multi-stage builds** to separate build and runtime environments
5. **Run as non-root user** for improved security
6. **Include health checks** for better orchestration integration
7. **Document build arguments** and environment variables
8. **Regularly update base images** to include security patches

## References

- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Container Security Best Practices](https://snyk.io/blog/10-docker-image-security-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/develop/develop-images/multistage-build/)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)