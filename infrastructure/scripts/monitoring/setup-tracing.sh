#!/bin/bash

# ============================================================================
# AUSTA SuperApp - OpenTelemetry Distributed Tracing Setup Script
# ============================================================================
# This script configures OpenTelemetry instrumentation across all services,
# sets up sampling strategies, establishes trace context propagation between
# services, and exports traces to the monitoring backend for end-to-end
# request visibility.
#
# Usage:
#   ./setup-tracing.sh [options]
#
# Options:
#   --collector-endpoint ENDPOINT  OpenTelemetry collector endpoint
#   --sampling-rate RATE          Sampling rate between 0.0 and 1.0
#   --environment ENV             Environment name
#   --services "SVC1 SVC2..."     Space-separated list of services to configure
#   --batch-timeout MS            Batch timeout in milliseconds
#   --max-batch-size SIZE         Maximum export batch size
#   --export-timeout MS           Export timeout in milliseconds
#   --help                        Display help message
# ============================================================================

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh" || { echo "Error: Failed to source common.sh"; exit 1; }

# ============================================================================
# Configuration Variables
# ============================================================================

# Default values
DEFAULT_OTEL_COLLECTOR_ENDPOINT="http://otel-collector:4317"
DEFAULT_SAMPLING_RATE="0.1" # 10% sampling rate by default
DEFAULT_ENVIRONMENT="development"
DEFAULT_SERVICES=("api-gateway" "auth-service" "gamification-engine" "health-service" "care-service" "plan-service" "notification-service")
DEFAULT_BATCH_TIMEOUT_MS="5000"
DEFAULT_MAX_EXPORT_BATCH_SIZE="512"
DEFAULT_EXPORT_TIMEOUT_MS="30000"

# Parse command line arguments
OTEL_COLLECTOR_ENDPOINT="${OTEL_COLLECTOR_ENDPOINT:-$DEFAULT_OTEL_COLLECTOR_ENDPOINT}"
SAMPLING_RATE="${SAMPLING_RATE:-$DEFAULT_SAMPLING_RATE}"
ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
SERVICES=(${SERVICES:-${DEFAULT_SERVICES[@]}})
BATCH_TIMEOUT_MS="${BATCH_TIMEOUT_MS:-$DEFAULT_BATCH_TIMEOUT_MS}"
MAX_EXPORT_BATCH_SIZE="${MAX_EXPORT_BATCH_SIZE:-$DEFAULT_MAX_EXPORT_BATCH_SIZE}"
EXPORT_TIMEOUT_MS="${EXPORT_TIMEOUT_MS:-$DEFAULT_EXPORT_TIMEOUT_MS}"

# ============================================================================
# Helper Functions
# ============================================================================

function print_usage {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --collector-endpoint ENDPOINT  OpenTelemetry collector endpoint (default: $DEFAULT_OTEL_COLLECTOR_ENDPOINT)"
    echo "  --sampling-rate RATE          Sampling rate between 0.0 and 1.0 (default: $DEFAULT_SAMPLING_RATE)"
    echo "  --environment ENV             Environment name (default: $DEFAULT_ENVIRONMENT)"
    echo "  --services "SVC1 SVC2..."     Space-separated list of services to configure"
    echo "  --batch-timeout MS            Batch timeout in milliseconds (default: $DEFAULT_BATCH_TIMEOUT_MS)"
    echo "  --max-batch-size SIZE         Maximum export batch size (default: $DEFAULT_MAX_EXPORT_BATCH_SIZE)"
    echo "  --export-timeout MS           Export timeout in milliseconds (default: $DEFAULT_EXPORT_TIMEOUT_MS)"
    echo "  --help                        Display this help message"
}

function parse_args {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --collector-endpoint)
                OTEL_COLLECTOR_ENDPOINT="$2"
                shift 2
                ;;
            --sampling-rate)
                SAMPLING_RATE="$2"
                shift 2
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --services)
                IFS=' ' read -r -a SERVICES <<< "$2"
                shift 2
                ;;
            --batch-timeout)
                BATCH_TIMEOUT_MS="$2"
                shift 2
                ;;
            --max-batch-size)
                MAX_EXPORT_BATCH_SIZE="$2"
                shift 2
                ;;
            --export-timeout)
                EXPORT_TIMEOUT_MS="$2"
                shift 2
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                echo "Error: Unknown option $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Validate sampling rate
    if (( $(echo "$SAMPLING_RATE < 0.0 || $SAMPLING_RATE > 1.0" | bc -l) )); then
        echo "Error: Sampling rate must be between 0.0 and 1.0"
        exit 1
    fi
}

function install_otel_packages {
    local service_dir=$1
    local service_name=$2
    
    log_info "Installing OpenTelemetry packages for $service_name..."
    
    cd "$service_dir" || { log_error "Failed to change directory to $service_dir"; return 1; }
    
    # Install required OpenTelemetry packages
    npm install --save @opentelemetry/api@^1.6.0 \
                       @opentelemetry/sdk-node@^0.45.0 \
                       @opentelemetry/auto-instrumentations-node@^0.39.4 \
                       @opentelemetry/exporter-trace-otlp-http@^0.45.0 \
                       @opentelemetry/instrumentation-nestjs-core@^0.34.0 \
                       @opentelemetry/instrumentation-http@^0.44.0 \
                       @opentelemetry/instrumentation-express@^0.34.0 \
                       @opentelemetry/instrumentation-graphql@^0.35.0 \
                       @opentelemetry/instrumentation-grpc@^0.44.0 \
                       @opentelemetry/instrumentation-kafka-js@^0.35.0 \
                       @opentelemetry/instrumentation-redis@^0.35.0 \
                       @opentelemetry/instrumentation-pg@^0.35.0 \
                       @opentelemetry/sdk-trace-base@^1.18.1 \
                       @opentelemetry/resources@^1.18.1 \
                       @opentelemetry/semantic-conventions@^1.18.1 || {
        log_error "Failed to install OpenTelemetry packages for $service_name"
        return 1
    }
    
    log_success "Successfully installed OpenTelemetry packages for $service_name"
    return 0
}

function create_tracer_config {
    local service_dir=$1
    local service_name=$2
    
    log_info "Creating OpenTelemetry tracer configuration for $service_name..."
    
    local config_file="$service_dir/src/tracing.ts"
    
    # Create the tracer configuration file
    cat > "$config_file" << EOL
// OpenTelemetry configuration for $service_name
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafka-js';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { ParentBasedSampler, TraceIdRatioBased } from '@opentelemetry/sdk-trace-base';
import { trace, context, propagation } from '@opentelemetry/api';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Configure the trace exporter
const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '${OTEL_COLLECTOR_ENDPOINT}',
  headers: {}, // Add any custom headers if needed
});

// Configure the sampler
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBased(parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '${SAMPLING_RATE}')),
});

// Configure the span processor based on environment
// Use BatchSpanProcessor in production for better performance
// Use SimpleSpanProcessor in development for immediate feedback
const spanProcessor = isProduction
  ? new BatchSpanProcessor(exporter, {
      maxExportBatchSize: ${MAX_EXPORT_BATCH_SIZE},
      scheduledDelayMillis: ${BATCH_TIMEOUT_MS},
      exportTimeoutMillis: ${EXPORT_TIMEOUT_MS},
    })
  : new SimpleSpanProcessor(exporter);

// Create and configure the OpenTelemetry SDK
export const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: '${service_name}',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || '${ENVIRONMENT}',
    'austa.journey': getJourneyFromServiceName('${service_name}'),
  }),
  spanProcessor,
  sampler,
  instrumentations: [
    // Use specific instrumentations instead of auto-instrumentations for better control
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    new GraphQLInstrumentation({
      // Merge GraphQL spans to reduce noise
      mergeItems: true,
      // Ignore trivial resolvers to reduce span count
      ignoreTrivialResolveSpans: true,
    }),
    new GrpcInstrumentation(),
    new KafkaJsInstrumentation(),
    new RedisInstrumentation(),
    new PgInstrumentation(),
  ],
});

// Helper function to extract journey from service name
function getJourneyFromServiceName(serviceName: string): string {
  if (serviceName.includes('health')) return 'health';
  if (serviceName.includes('care')) return 'care';
  if (serviceName.includes('plan')) return 'plan';
  return 'common';
}

// Initialize the SDK
export function initTracing() {
  try {
    otelSDK.start();
    console.log('OpenTelemetry tracing initialized for ${service_name}');
    
    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      otelSDK.shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.error('Error initializing OpenTelemetry', error);
  }
}

// Export a function to create a tracer for manual instrumentation
export function getTracer(name = '${service_name}') {
  return trace.getTracer(name);
}

// Helper function to extract context from incoming request
export function extractContextFromRequest(req: any) {
  const extractedContext = propagation.extract(context.active(), req.headers);
  return extractedContext;
}

// Helper function to inject context into outgoing request
export function injectContextIntoRequest(req: any) {
  propagation.inject(context.active(), req.headers);
  return req;
}

// Helper function to create a span with the current context
export function createSpan(name: string, options: any = {}) {
  const currentContext = context.active();
  const span = getTracer().startSpan(name, options, currentContext);
  return span;
}
EOL

    if [ $? -ne 0 ]; then
        log_error "Failed to create tracer configuration for $service_name"
        return 1
    fi
    
    log_success "Successfully created OpenTelemetry tracer configuration for $service_name"
    return 0
}

function update_main_file {
    local service_dir=$1
    local service_name=$2
    
    log_info "Updating main.ts to initialize OpenTelemetry for $service_name..."
    
    local main_file="$service_dir/src/main.ts"
    
    # Check if the main file exists
    if [ ! -f "$main_file" ]; then
        log_error "Main file not found at $main_file"
        return 1
    fi
    
    # Create a backup of the original file
    cp "$main_file" "${main_file}.bak" || { log_error "Failed to create backup of $main_file"; return 1; }
    
    # Add the import and initialization at the top of the file
    sed -i '1s/^/import { initTracing } from \'.\/tracing\';\n\n/' "$main_file" || {
        log_error "Failed to add import to $main_file"
        mv "${main_file}.bak" "$main_file"
        return 1
    }
    
    # Add the initialization before bootstrap
    sed -i '/async function bootstrap/i // Initialize OpenTelemetry tracing\ninitTracing();\n' "$main_file" || {
        log_error "Failed to add initialization to $main_file"
        mv "${main_file}.bak" "$main_file"
        return 1
    }
    
    log_success "Successfully updated main.ts for $service_name"
    return 0
}

function configure_service_tracing {
    local service_name=$1
    local service_dir="/src/backend/$service_name"
    
    log_info "Configuring OpenTelemetry tracing for $service_name..."
    
    # Check if service directory exists
    if [ ! -d "$service_dir" ]; then
        log_error "Service directory not found: $service_dir"
        return 1
    fi
    
    # Install OpenTelemetry packages
    install_otel_packages "$service_dir" "$service_name" || return 1
    
    # Create tracer configuration
    create_tracer_config "$service_dir" "$service_name" || return 1
    
    # Update main.ts to initialize tracing
    update_main_file "$service_dir" "$service_name" || return 1
    
    log_success "Successfully configured OpenTelemetry tracing for $service_name"
    return 0
}

function configure_collector {
    log_info "Configuring OpenTelemetry Collector..."
    
    # Check if Kubernetes is being used
    if command -v kubectl &> /dev/null; then
        log_info "Kubernetes detected, configuring collector via Kubernetes..."
        
        # Create a temporary file for the collector configuration
        local temp_file=$(mktemp)
        
        cat > "$temp_file" << EOL
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: monitoring
data:
  collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: ${BATCH_TIMEOUT_MS}ms
        send_batch_size: ${MAX_EXPORT_BATCH_SIZE}
      
      # Configure tail sampling for error and latency-based sampling
      tail_sampling:
        decision_wait: 10s
        num_traces: 1000
        expected_new_traces_per_sec: 100
        policies:
          - name: error-policy
            type: status_code
            status_code:
              status_codes: [ERROR]
          - name: latency-policy
            type: latency
            latency:
              threshold_ms: 500
          - name: probability-policy
            type: probabilistic
            probabilistic:
              sampling_percentage: ${SAMPLING_RATE/0./}

    exporters:
      prometheus:
        endpoint: 0.0.0.0:8889
      
      # Configure the appropriate exporter based on your monitoring backend
      otlp:
        endpoint: "monitoring-backend:4317"
        tls:
          insecure: true
      
      logging:
        loglevel: debug

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, tail_sampling]
          exporters: [otlp, logging]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [prometheus, otlp]
        logs:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlp, logging]
      telemetry:
        logs:
          level: "debug"
EOL

        # Apply the ConfigMap
        kubectl apply -f "$temp_file" || {
            log_error "Failed to apply OpenTelemetry Collector ConfigMap"
            rm "$temp_file"
            return 1
        }
        
        rm "$temp_file"
        
        log_success "Successfully configured OpenTelemetry Collector via Kubernetes"
    else
        log_info "Kubernetes not detected, configuring collector via Docker Compose..."
        
        # Create a directory for the collector configuration
        mkdir -p "/infrastructure/docker/otel-collector" || {
            log_error "Failed to create directory for OpenTelemetry Collector configuration"
            return 1
        }
        
        # Create the collector configuration file
        cat > "/infrastructure/docker/otel-collector/config.yaml" << EOL
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: ${BATCH_TIMEOUT_MS}ms
    send_batch_size: ${MAX_EXPORT_BATCH_SIZE}
  
  # Configure tail sampling for error and latency-based sampling
  tail_sampling:
    decision_wait: 10s
    num_traces: 1000
    expected_new_traces_per_sec: 100
    policies:
      - name: error-policy
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: latency-policy
        type: latency
        latency:
          threshold_ms: 500
      - name: probability-policy
        type: probabilistic
        probabilistic:
          sampling_percentage: ${SAMPLING_RATE/0./}

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  
  # Configure the appropriate exporter based on your monitoring backend
  otlp:
    endpoint: "monitoring-backend:4317"
    tls:
      insecure: true
  
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, tail_sampling]
      exporters: [otlp, logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, otlp]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp, logging]
  telemetry:
    logs:
      level: "debug"
EOL

        # Create a Docker Compose file for the collector
        cat > "/infrastructure/docker/otel-collector/docker-compose.yaml" << EOL
version: '3'
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: otel-collector
    command: ["--config=/etc/otel-collector/config.yaml"]
    volumes:
      - ./config.yaml:/etc/otel-collector/config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus exporter
    networks:
      - monitoring-network

networks:
  monitoring-network:
    external: true
EOL

        log_success "Successfully configured OpenTelemetry Collector via Docker Compose"
        log_info "To start the collector, run: cd /infrastructure/docker/otel-collector && docker-compose up -d"
    fi
    
    return 0
}

function configure_grafana_dashboard {
    log_info "Configuring Grafana dashboard for distributed tracing..."
    
    # Create a directory for the Grafana dashboard
    mkdir -p "/infrastructure/kubernetes/monitoring/grafana/dashboards" || {
        log_error "Failed to create directory for Grafana dashboard"
        return 1
    }
    
    # Create the Grafana dashboard configuration
    cat > "/infrastructure/kubernetes/monitoring/grafana/dashboards/distributed-tracing.json" << EOL
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "panels": [
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "ms"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 2,
      "options": {
        "legend": {
          "calcs": [
            "mean",
            "max",
            "min"
          ],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.6",
      "targets": [
        {
          "exemplar": true,
          "expr": "histogram_quantile(0.95, sum(rate(span_latency_ms_bucket{service_name=~"$service"}[5m])) by (le, service_name))",
          "interval": "",
          "legendFormat": "{{service_name}}",
          "refId": "A"
        }
      ],
      "title": "Service Latency (p95)",
      "type": "timeseries"
    },
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "reqps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "id": 3,
      "options": {
        "legend": {
          "calcs": [
            "mean",
            "max",
            "min"
          ],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.6",
      "targets": [
        {
          "exemplar": true,
          "expr": "sum(rate(spans_created_total{service_name=~"$service"}[5m])) by (service_name)",
          "interval": "",
          "legendFormat": "{{service_name}}",
          "refId": "A"
        }
      ],
      "title": "Spans Created Rate",
      "type": "timeseries"
    },
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "id": 4,
      "options": {
        "legend": {
          "calcs": [
            "mean",
            "max",
            "min"
          ],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.6",
      "targets": [
        {
          "exemplar": true,
          "expr": "sum(rate(spans_errors_total{service_name=~"$service"}[5m])) by (service_name) / sum(rate(spans_created_total{service_name=~"$service"}[5m])) by (service_name)",
          "interval": "",
          "legendFormat": "{{service_name}}",
          "refId": "A"
        }
      ],
      "title": "Error Rate",
      "type": "timeseries"
    },
    {
      "datasource": null,
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "id": 5,
      "options": {
        "legend": {
          "calcs": [
            "mean",
            "max",
            "min"
          ],
          "displayMode": "table",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.6",
      "targets": [
        {
          "exemplar": true,
          "expr": "sum(rate(spans_sampled_total{service_name=~"$service"}[5m])) by (service_name) / sum(rate(spans_created_total{service_name=~"$service"}[5m])) by (service_name)",
          "interval": "",
          "legendFormat": "{{service_name}}",
          "refId": "A"
        }
      ],
      "title": "Sampling Rate",
      "type": "timeseries"
    }
  ],
  "refresh": "10s",
  "schemaVersion": 30,
  "style": "dark",
  "tags": [
    "opentelemetry",
    "tracing"
  ],
  "templating": {
    "list": [
      {
        "allValue": ".*",
        "current": {
          "selected": false,
          "text": "All",
          "value": "$__all"
        },
        "datasource": null,
        "definition": "label_values(spans_created_total, service_name)",
        "description": null,
        "error": null,
        "hide": 0,
        "includeAll": true,
        "label": "Service",
        "multi": true,
        "name": "service",
        "options": [],
        "query": {
          "query": "label_values(spans_created_total, service_name)",
          "refId": "StandardVariableQuery"
        },
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "sort": 1,
        "type": "query"
      }
    ]
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Distributed Tracing",
  "uid": "distributed-tracing",
  "version": 1
}
EOL

    log_success "Successfully configured Grafana dashboard for distributed tracing"
    return 0
}

# ============================================================================
# Main Script
# ============================================================================

function main {
    log_header "AUSTA SuperApp - OpenTelemetry Distributed Tracing Setup"
    
    # Parse command line arguments
    parse_args "$@"
    
    log_info "Starting OpenTelemetry distributed tracing setup with the following configuration:"
    log_info "  Collector Endpoint: $OTEL_COLLECTOR_ENDPOINT"
    log_info "  Sampling Rate: $SAMPLING_RATE"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Services: ${SERVICES[*]}"
    log_info "  Batch Timeout: $BATCH_TIMEOUT_MS ms"
    log_info "  Max Export Batch Size: $MAX_EXPORT_BATCH_SIZE"
    log_info "  Export Timeout: $EXPORT_TIMEOUT_MS ms"
    
    # Configure OpenTelemetry Collector
    configure_collector || { log_error "Failed to configure OpenTelemetry Collector"; exit 1; }
    
    # Configure Grafana dashboard
    configure_grafana_dashboard || { log_error "Failed to configure Grafana dashboard"; exit 1; }
    
    # Configure tracing for each service
    for service in "${SERVICES[@]}"; do
        configure_service_tracing "$service" || { log_error "Failed to configure tracing for $service"; exit 1; }
    done
    
    log_success "OpenTelemetry distributed tracing setup completed successfully!"
    log_info "To verify the setup, check the logs of each service for 'OpenTelemetry tracing initialized' message."
    log_info "You can view traces in Grafana using the 'Distributed Tracing' dashboard."
    
    return 0
}

# Run the main function with all arguments
main "$@"