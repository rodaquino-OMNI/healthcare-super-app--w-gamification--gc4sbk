# AUSTA SuperApp Development Proxy

## Overview

The Development Proxy is a critical component of the AUSTA SuperApp local development environment. It provides a unified entry point for frontend applications to communicate with backend microservices, simulating the production API Gateway behavior in a local development context.

### Purpose

The Development Proxy serves several key functions:

- **Unified API Endpoint**: Routes all API requests from frontend applications to the appropriate backend microservices
- **WebSocket Support**: Handles WebSocket connections for real-time features
- **Service Discovery**: Dynamically routes requests to the correct service based on URL patterns
- **CORS Handling**: Manages Cross-Origin Resource Sharing for local development
- **Error Handling**: Provides meaningful error responses when services are unavailable

### Architecture

The Development Proxy is built on Nginx (version 1.21.6) and runs as a Docker container within the local development environment. It sits between the frontend applications (web and mobile) and the backend microservices:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│  Web App    │     │ Development │     │ Backend Microservices│
│  (Next.js)  │────▶│   Proxy     │────▶│                     │
│  Port 3000  │     │  (Nginx)    │     │ - api-gateway:4000  │
└─────────────┘     │  Port 80    │     │ - auth-service:4001 │
                    │             │     │ - health-service:4002│
┌─────────────┐     │             │     │ - care-service:4003 │
│ Mobile App  │     │             │     │ - plan-service:4004 │
│(React Native)│────▶│             │────▶│ - gamification:4005 │
│  Port 8081  │     │             │     │ - notification:4006 │
└─────────────┘     └─────────────┘     └─────────────────────┘
```

## Setup and Configuration

### Prerequisites

- Docker and Docker Compose installed on your development machine
- The AUSTA SuperApp repository cloned to your local machine

### Environment Variables

The Development Proxy uses the following environment variables for service discovery:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `API_GATEWAY_URL` | URL for the API Gateway service | `http://api-gateway:4000` |
| `AUTH_SERVICE_URL` | URL for the Authentication service | `http://auth-service:4001` |
| `HEALTH_SERVICE_URL` | URL for the Health Journey service | `http://health-service:4002` |
| `CARE_SERVICE_URL` | URL for the Care Journey service | `http://care-service:4003` |
| `PLAN_SERVICE_URL` | URL for the Plan Journey service | `http://plan-service:4004` |
| `GAMIFICATION_SERVICE_URL` | URL for the Gamification Engine | `http://gamification-engine:4005` |
| `NOTIFICATION_SERVICE_URL` | URL for the Notification service | `http://notification-service:4006` |
| `PROXY_PORT` | Port on which the proxy will listen | `80` |
| `ENABLE_CORS` | Whether to enable CORS headers | `true` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000,http://localhost:8081` |

### Starting the Proxy

#### Option 1: Using the Main Docker Compose File

The simplest way to start the Development Proxy is as part of the complete local development environment:

```bash
# From the root of the repository
docker-compose -f docker-compose.dev.yml up -d
```

This will start all services, including the Development Proxy.

#### Option 2: Using the Proxy-Specific Docker Compose File

If you want to run only the Development Proxy (for example, if you're running some services directly on your host machine):

```bash
# From the infrastructure/docker/dev-proxy directory
docker-compose up -d
```

#### Option 3: Using the Setup Script

For more control over the proxy configuration, you can use the provided setup script:

```bash
# From the infrastructure/docker/dev-proxy directory
./setup.sh --api-gateway-url=http://localhost:4000 --enable-cors=true
```

The setup script accepts all environment variables as command-line arguments.

## Usage

### Accessing Services Through the Proxy

Once the Development Proxy is running, you can access all backend services through it:

- **API Gateway**: `http://localhost/api/gateway/...`
- **Auth Service**: `http://localhost/api/auth/...`
- **Health Service**: `http://localhost/api/health/...`
- **Care Service**: `http://localhost/api/care/...`
- **Plan Service**: `http://localhost/api/plan/...`
- **Gamification Engine**: `http://localhost/api/gamification/...`
- **Notification Service**: `http://localhost/api/notifications/...`
- **WebSocket Connections**: `ws://localhost/ws/...`

### Example: Configuring Frontend Applications

#### Next.js Web Application

In your `.env.local` file for the Next.js application:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost/api
NEXT_PUBLIC_WS_BASE_URL=ws://localhost/ws
```

#### React Native Mobile Application

In your `.env.local` file for the React Native application:

```
RN_API_BASE_URL=http://localhost/api
RN_WS_BASE_URL=ws://localhost/ws
```

## Customization

### Customizing Routing Rules

The Development Proxy uses Nginx configuration files to define routing rules. These files are located in the `conf.d` directory and are generated from templates during startup.

To customize routing for specific development needs:

1. Create a new configuration file in the `conf.d` directory (e.g., `custom-routes.conf`)
2. Define your custom routing rules using Nginx syntax
3. Restart the proxy container

Example custom routing configuration:

```nginx
# Route requests to a custom service running on your host machine
location /api/custom-service/ {
    proxy_pass http://host.docker.internal:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Customizing Error Pages

You can customize the error pages displayed when services are unavailable by modifying the HTML files in the `error_pages` directory.

## Troubleshooting

### Common Issues

#### Proxy Cannot Connect to Services

**Symptom**: You receive a 502 Bad Gateway error when trying to access a service through the proxy.

**Solution**:
1. Ensure the target service is running: `docker-compose ps`
2. Check if the service is accessible directly: `curl http://localhost:4000/health`
3. Verify the environment variables in the proxy container: `docker-compose exec dev-proxy env`
4. Check the proxy logs: `docker-compose logs dev-proxy`

#### CORS Errors in Browser Console

**Symptom**: You see CORS-related errors in your browser's developer console.

**Solution**:
1. Ensure `ENABLE_CORS` is set to `true`
2. Add your frontend origin to `CORS_ALLOWED_ORIGINS`
3. Restart the proxy container

#### WebSocket Connection Failures

**Symptom**: WebSocket connections fail to establish or disconnect frequently.

**Solution**:
1. Ensure the WebSocket service is running
2. Check if you're using the correct WebSocket URL (`ws://localhost/ws/...`)
3. Verify that your WebSocket client is handling reconnection properly
4. Increase the proxy timeout settings if needed

### Viewing Proxy Logs

To view the Development Proxy logs:

```bash
docker-compose logs -f dev-proxy
```

For more detailed logging, you can modify the `nginx.conf` file to set the log level to `debug`.

## Advanced Configuration

### SSL/TLS Support

For development scenarios requiring HTTPS, you can enable SSL/TLS support:

1. Generate self-signed certificates:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cert/nginx.key -out cert/nginx.crt
   ```

2. Update the `nginx.conf` file to use the certificates:
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/cert/nginx.crt;
       ssl_certificate_key /etc/nginx/cert/nginx.key;
       # ... rest of your configuration
   }
   ```

3. Map the certificate directory to the container in `docker-compose.yml`:
   ```yaml
   volumes:
     - ./cert:/etc/nginx/cert
   ```

4. Expose port 443 in `docker-compose.yml`:
   ```yaml
   ports:
     - "443:443"
   ```

### Load Balancing

For testing load balancing scenarios, you can configure the proxy to distribute requests across multiple instances of a service:

```nginx
upstream backend_servers {
    server service1:4000;
    server service2:4000;
    server service3:4000;
}

location /api/balanced/ {
    proxy_pass http://backend_servers/;
    # ... rest of your configuration
}
```

## Integration with Development Workflow

The Development Proxy is designed to integrate seamlessly with the AUSTA SuperApp development workflow:

1. **Service Development**: When developing a specific service, you can run that service directly on your host machine while routing requests through the proxy to other containerized services.

2. **Frontend Development**: Frontend developers can use the proxy to access all backend services through a single endpoint, simplifying configuration and avoiding CORS issues.

3. **Testing**: The proxy allows testing of cross-service interactions in a local environment that closely resembles the production setup.

## Contributing

Contributions to improve the Development Proxy are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your changes maintain backward compatibility and include appropriate documentation updates.