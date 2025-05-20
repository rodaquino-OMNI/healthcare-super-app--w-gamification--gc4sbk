FROM nginx:1.21.6

# Install required packages for configuration templating
RUN apt-get update && apt-get install -y --no-install-recommends \
    gettext-base \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Create directory for templates
RUN mkdir -p /etc/nginx/templates

# Copy nginx configuration templates
COPY nginx.conf.template /etc/nginx/templates/
COPY default.conf.template /etc/nginx/templates/

# Set permissions
RUN chmod -R 644 /etc/nginx/templates \
    && chown -R nginx:nginx /etc/nginx/templates

# Create entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Switch to non-root user for better security
USER nginx

# Set environment variables with defaults
ENV API_GATEWAY_HOST=api-gateway
ENV API_GATEWAY_PORT=4000
ENV WS_HOST=notification-service
ENV WS_PORT=3000
ENV CLIENT_MAX_BODY_SIZE=10M

# Expose ports
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]