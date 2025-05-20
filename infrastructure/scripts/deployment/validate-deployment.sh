#!/bin/bash

#############################################################################
# AUSTA SuperApp Deployment Validation Script
#
# This script performs comprehensive validation of deployed services,
# including health checks, API functionality, database connections,
# Kafka connectivity, Redis operations, and end-to-end user journeys.
#
# The script is environment-aware and integrates with monitoring systems
# to determine deployment success or failure.
#
# Usage: ./validate-deployment.sh [environment] [deployment-type] [service-name]
#   environment: development, staging, production (default: determined from context)
#   deployment-type: standard, blue-green, canary (default: standard)
#   service-name: specific service to validate (default: all services)
#
# Exit codes:
#   0: Validation successful
#   1: Validation failed
#   2: Invalid arguments
#   3: Environment setup failed
#   4: Dependency check failed
#############################################################################

set -e

# Source common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"
source "${SCRIPT_DIR}/config.sh"

# Default values
ENVIRONMENT=""
DEPLOYMENT_TYPE="standard"
SERVICE_NAME="all"
VALIDATION_TIMEOUT=300 # 5 minutes default timeout
RETRY_COUNT=3
RETRY_DELAY=10

# Parse command line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      development|staging|production)
        ENVIRONMENT="$1"
        ;;
      standard|blue-green|canary)
        DEPLOYMENT_TYPE="$1"
        ;;
      --service=*)
        SERVICE_NAME="${1#*=}"
        ;;
      --timeout=*)
        VALIDATION_TIMEOUT="${1#*=}"
        ;;
      --retry-count=*)
        RETRY_COUNT="${1#*=}"
        ;;
      --retry-delay=*)
        RETRY_DELAY="${1#*=}"
        ;;
      --help)
        show_usage
        exit 0
        ;;
      *)
        log_error "Unknown argument: $1"
        show_usage
        exit 2
        ;;
    esac
    shift
  done

  # Auto-detect environment if not specified
  if [[ -z "$ENVIRONMENT" ]]; then
    ENVIRONMENT=$(detect_environment)
    log_info "Auto-detected environment: $ENVIRONMENT"
  fi

  # Load environment-specific configuration
  load_environment_config "$ENVIRONMENT"
}

# Show usage information
show_usage() {
  echo "Usage: ./validate-deployment.sh [environment] [deployment-type] [options]"
  echo "  environment: development, staging, production"
  echo "  deployment-type: standard, blue-green, canary"
  echo "Options:"
  echo "  --service=NAME    Validate specific service"
  echo "  --timeout=SECONDS Overall validation timeout (default: 300)"
  echo "  --retry-count=N   Number of retries for failed checks (default: 3)"
  echo "  --retry-delay=N   Seconds between retries (default: 10)"
  echo "  --help            Show this help message"
}

# Check required dependencies
check_dependencies() {
  local missing_deps=0

  for cmd in kubectl curl jq aws nc timeout; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "Required dependency not found: $cmd"
      missing_deps=1
    fi
  done

  # Check for environment-specific dependencies
  if [[ "$ENVIRONMENT" == "production" ]]; then
    for cmd in prometheus promtool; do
      if ! command -v "$cmd" &> /dev/null; then
        log_warn "Production dependency not found: $cmd (some validations may be skipped)"
      fi
    done
  fi

  if [[ $missing_deps -eq 1 ]]; then
    log_error "Missing dependencies. Please install required tools."
    exit 4
  fi
}

# Initialize validation environment
initialize_environment() {
  log_info "Initializing validation environment for $ENVIRONMENT"

  # Set up Kubernetes context
  if ! kubectl config use-context "${K8S_CONTEXT}" &> /dev/null; then
    log_error "Failed to set Kubernetes context to ${K8S_CONTEXT}"
    exit 3
  fi

  # Set up AWS profile if needed
  if [[ -n "${AWS_PROFILE}" ]]; then
    export AWS_PROFILE="${AWS_PROFILE}"
    log_info "Using AWS profile: ${AWS_PROFILE}"
  fi

  # Create temporary directory for validation artifacts
  VALIDATION_TMP_DIR=$(mktemp -d)
  log_debug "Created temporary directory: $VALIDATION_TMP_DIR"

  # Register cleanup handler
  trap cleanup EXIT
}

# Cleanup temporary resources
cleanup() {
  log_debug "Cleaning up temporary resources"
  if [[ -d "$VALIDATION_TMP_DIR" ]]; then
    rm -rf "$VALIDATION_TMP_DIR"
  fi
}

#############################################################################
# Service Health Validation Functions
#############################################################################

# Validate health of all services or a specific service
validate_service_health() {
  local service=$1
  local namespace=${2:-"default"}
  local success=true

  log_info "Validating service health for ${service:-all services} in namespace $namespace"

  # Get list of services to validate
  local services
  if [[ "$service" == "all" ]]; then
    if [[ "$DEPLOYMENT_TYPE" == "blue-green" && "$service" == "api-gateway" ]]; then
      # For blue-green, validate both blue and green deployments
      services=$(kubectl get deployments -n "$namespace" -l "app=api-gateway" -o jsonpath='{.items[*].metadata.name}')
    else
      # Get all deployments for standard validation
      services=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
    fi
  else
    services=$service
  fi

  for svc in $services; do
    log_info "Checking health of service: $svc"
    
    # Check deployment status
    local ready_replicas available_replicas
    ready_replicas=$(kubectl get deployment "$svc" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
    available_replicas=$(kubectl get deployment "$svc" -n "$namespace" -o jsonpath='{.status.availableReplicas}')
    
    if [[ -z "$ready_replicas" || "$ready_replicas" == "0" ]]; then
      log_error "Service $svc has no ready replicas"
      success=false
      continue
    fi
    
    # Check if all pods are running and ready
    local pods_status
    pods_status=$(kubectl get pods -n "$namespace" -l "app=$svc" -o jsonpath='{.items[*].status.phase}')
    
    if [[ "$pods_status" != *"Running"* || "$pods_status" == *"Failed"* || "$pods_status" == *"CrashLoopBackOff"* ]]; then
      log_error "Service $svc has pods in unhealthy state: $pods_status"
      success=false
      continue
    fi
    
    # Check health endpoint if available
    if service_has_health_endpoint "$svc"; then
      if ! check_health_endpoint "$svc" "$namespace"; then
        log_error "Health endpoint check failed for service $svc"
        success=false
        continue
      fi
    fi
    
    log_success "Service $svc is healthy"
  done

  if [[ "$success" == "true" ]]; then
    log_success "All service health checks passed"
    return 0
  else
    log_error "One or more service health checks failed"
    return 1
  fi
}

# Check if service has a health endpoint
service_has_health_endpoint() {
  local service=$1
  
  # List of services with health endpoints
  local health_services="api-gateway auth-service health-service care-service plan-service gamification-engine notification-service"
  
  if [[ " $health_services " == *" $service "* ]]; then
    return 0
  else
    return 1
  fi
}

# Check health endpoint for a service
check_health_endpoint() {
  local service=$1
  local namespace=$2
  local health_path="/health"
  local port
  
  # Determine port based on service
  case "$service" in
    api-gateway)
      port=3000
      ;;
    auth-service)
      port=3001
      ;;
    health-service|care-service|plan-service)
      port=3002
      ;;
    gamification-engine)
      port=3003
      ;;
    notification-service)
      port=3004
      ;;
    *)
      port=8080 # Default port
      ;;
  esac
  
  # Use kubectl port-forward to access the service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for service $service"
    return 1
  fi
  
  # Start port-forward in background
  local local_port=$((10000 + RANDOM % 10000))
  kubectl port-forward "pod/$pod_name" "$local_port:$port" -n "$namespace" &> /dev/null &
  local port_forward_pid=$!
  
  # Wait for port-forward to establish
  sleep 2
  
  # Check health endpoint
  local health_status
  health_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$local_port$health_path)
  
  # Kill port-forward process
  kill $port_forward_pid &> /dev/null
  wait $port_forward_pid 2>/dev/null || true
  
  if [[ "$health_status" == "200" ]]; then
    log_success "Health endpoint check passed for service $service"
    return 0
  else
    log_error "Health endpoint check failed for service $service with status $health_status"
    return 1
  fi
}

#############################################################################
# Database Validation Functions
#############################################################################

# Validate database connections and operations
validate_databases() {
  log_info "Validating database connections and operations"
  local success=true

  # List of services with databases to validate
  local db_services="auth-service health-service care-service plan-service gamification-engine"
  
  for service in $db_services; do
    if [[ "$SERVICE_NAME" != "all" && "$SERVICE_NAME" != "$service" ]]; then
      continue
    fi
    
    log_info "Validating database for service: $service"
    
    if ! validate_service_database "$service"; then
      log_error "Database validation failed for service $service"
      success=false
    else
      log_success "Database validation passed for service $service"
    fi
  done

  if [[ "$success" == "true" ]]; then
    log_success "All database validations passed"
    return 0
  else
    log_error "One or more database validations failed"
    return 1
  fi
}

# Validate database for a specific service
validate_service_database() {
  local service=$1
  local namespace="default"
  local pod_name
  
  # Get a pod for the service
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for service $service"
    return 1
  fi
  
  # Execute database validation command in the pod
  local validation_script=""
  
  # Create appropriate validation script based on service
  case "$service" in
    auth-service)
      validation_script="
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function validateDb() {
          try {
            // Test connection
            await prisma.$connect();
            console.log('Database connection successful');
            
            // Simple query to validate schema
            const userCount = await prisma.user.count();
            console.log('User count:', userCount);
            
            return true;
          } catch (error) {
            console.error('Database validation failed:', error);
            return false;
          } finally {
            await prisma.$disconnect();
          }
        }
        validateDb().then(success => process.exit(success ? 0 : 1));
      "
      ;;
    health-service)
      validation_script="
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function validateDb() {
          try {
            await prisma.$connect();
            console.log('Database connection successful');
            
            // Validate health metrics table
            const metricCount = await prisma.healthMetric.count();
            console.log('Health metric count:', metricCount);
            
            return true;
          } catch (error) {
            console.error('Database validation failed:', error);
            return false;
          } finally {
            await prisma.$disconnect();
          }
        }
        validateDb().then(success => process.exit(success ? 0 : 1));
      "
      ;;
    care-service)
      validation_script="
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function validateDb() {
          try {
            await prisma.$connect();
            console.log('Database connection successful');
            
            // Validate appointments table
            const appointmentCount = await prisma.appointment.count();
            console.log('Appointment count:', appointmentCount);
            
            return true;
          } catch (error) {
            console.error('Database validation failed:', error);
            return false;
          } finally {
            await prisma.$disconnect();
          }
        }
        validateDb().then(success => process.exit(success ? 0 : 1));
      "
      ;;
    plan-service)
      validation_script="
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function validateDb() {
          try {
            await prisma.$connect();
            console.log('Database connection successful');
            
            // Validate plans table
            const planCount = await prisma.plan.count();
            console.log('Plan count:', planCount);
            
            return true;
          } catch (error) {
            console.error('Database validation failed:', error);
            return false;
          } finally {
            await prisma.$disconnect();
          }
        }
        validateDb().then(success => process.exit(success ? 0 : 1));
      "
      ;;
    gamification-engine)
      validation_script="
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function validateDb() {
          try {
            await prisma.$connect();
            console.log('Database connection successful');
            
            // Validate achievements table
            const achievementCount = await prisma.achievement.count();
            console.log('Achievement count:', achievementCount);
            
            return true;
          } catch (error) {
            console.error('Database validation failed:', error);
            return false;
          } finally {
            await prisma.$disconnect();
          }
        }
        validateDb().then(success => process.exit(success ? 0 : 1));
      "
      ;;
    *)
      log_error "Unknown service for database validation: $service"
      return 1
      ;;
  esac
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/db-validate-$service.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "$namespace/$pod_name:/tmp/db-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "$namespace" -- node /tmp/db-validate.js; then
    log_success "Database validation successful for service $service"
    return 0
  else
    log_error "Database validation failed for service $service"
    return 1
  fi
}

#############################################################################
# Messaging System Validation Functions
#############################################################################

# Validate Kafka connectivity and event processing
validate_kafka() {
  log_info "Validating Kafka connectivity and event processing"
  local success=true

  # Skip if not validating event-related services
  if [[ "$SERVICE_NAME" != "all" && 
        "$SERVICE_NAME" != "gamification-engine" && 
        "$SERVICE_NAME" != "notification-service" ]]; then
    log_info "Skipping Kafka validation for service $SERVICE_NAME"
    return 0
  fi

  # Validate Kafka broker connectivity
  if ! validate_kafka_connectivity; then
    log_error "Kafka broker connectivity validation failed"
    success=false
  fi

  # Validate event processing for each journey
  local journeys="health care plan"
  for journey in $journeys; do
    if ! validate_journey_events "$journey"; then
      log_error "Event processing validation failed for $journey journey"
      success=false
    fi
  done

  if [[ "$success" == "true" ]]; then
    log_success "All Kafka validations passed"
    return 0
  else
    log_error "One or more Kafka validations failed"
    return 1
  fi
}

# Validate Kafka broker connectivity
validate_kafka_connectivity() {
  log_info "Validating Kafka broker connectivity"
  
  # Get a pod that has Kafka client tools
  local pod_name
  pod_name=$(kubectl get pods -n "default" -l "app=gamification-engine" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for Kafka validation"
    return 1
  fi
  
  # Check if Kafka brokers are reachable
  local kafka_bootstrap_servers
  kafka_bootstrap_servers=$(kubectl exec "$pod_name" -n "default" -- printenv KAFKA_BOOTSTRAP_SERVERS)
  
  if [[ -z "$kafka_bootstrap_servers" ]]; then
    log_error "KAFKA_BOOTSTRAP_SERVERS environment variable not found"
    return 1
  fi
  
  # Execute Kafka validation command in the pod
  local validation_script="
    const { Kafka } = require('kafkajs');
    
    async function validateKafka() {
      const kafka = new Kafka({
        clientId: 'deployment-validator',
        brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(',')
      });
      
      const admin = kafka.admin();
      
      try {
        await admin.connect();
        console.log('Connected to Kafka brokers');
        
        const topics = await admin.listTopics();
        console.log('Available topics:', topics);
        
        if (topics.length === 0) {
          console.error('No topics found in Kafka');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Kafka validation failed:', error);
        return false;
      } finally {
        await admin.disconnect();
      }
    }
    
    validateKafka().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/kafka-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "default/$pod_name:/tmp/kafka-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "default" -- node /tmp/kafka-validate.js; then
    log_success "Kafka broker connectivity validation successful"
    return 0
  else
    log_error "Kafka broker connectivity validation failed"
    return 1
  fi
}

# Validate event processing for a specific journey
validate_journey_events() {
  local journey=$1
  log_info "Validating event processing for $journey journey"
  
  # Get a pod for the gamification engine
  local pod_name
  pod_name=$(kubectl get pods -n "default" -l "app=gamification-engine" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for gamification-engine"
    return 1
  fi
  
  # Create test event based on journey
  local event_type
  local event_payload
  
  case "$journey" in
    health)
      event_type="HEALTH_METRIC_RECORDED"
      event_payload='{"userId":"test-user","metricType":"STEPS","value":1000,"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}';
      ;;
    care)
      event_type="APPOINTMENT_BOOKED"
      event_payload='{"userId":"test-user","appointmentId":"test-appointment","providerId":"test-provider","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}';
      ;;
    plan)
      event_type="BENEFIT_VIEWED"
      event_payload='{"userId":"test-user","benefitId":"test-benefit","planId":"test-plan","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}';
      ;;
    *)
      log_error "Unknown journey for event validation: $journey"
      return 1
      ;;
  esac
  
  # Execute event validation command in the pod
  local validation_script="
    const { Kafka } = require('kafkajs');
    const { v4: uuidv4 } = require('uuid');
    
    async function validateEventProcessing() {
      const kafka = new Kafka({
        clientId: 'deployment-validator',
        brokers: process.env.KAFKA_BOOTSTRAP_SERVERS.split(',')
      });
      
      const producer = kafka.producer();
      const consumer = kafka.consumer({ groupId: 'deployment-validator-' + uuidv4() });
      
      try {
        await producer.connect();
        await consumer.connect();
        
        // Subscribe to the response topic
        const responseTopic = 'gamification.events.processed';
        await consumer.subscribe({ topic: responseTopic, fromBeginning: false });
        
        // Generate a unique correlation ID for this test
        const correlationId = uuidv4();
        
        // Prepare to receive the response
        let responseReceived = false;
        
        const responsePromise = new Promise((resolve, reject) => {
          // Set timeout
          const timeout = setTimeout(() => {
            if (!responseReceived) {
              reject(new Error('Timeout waiting for event processing response'));
            }
          }, 30000); // 30 second timeout
          
          consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
              const messageValue = JSON.parse(message.value.toString());
              
              if (messageValue.correlationId === correlationId) {
                clearTimeout(timeout);
                responseReceived = true;
                resolve(messageValue);
                
                // We can stop consuming
                await consumer.stop();
              }
            },
          });
        });
        
        // Send the test event
        const eventTopic = '${journey}.events';
        const eventType = '${event_type}';
        const eventPayload = ${event_payload};
        
        const event = {
          id: uuidv4(),
          type: eventType,
          source: 'deployment-validator',
          timestamp: new Date().toISOString(),
          correlationId: correlationId,
          data: eventPayload
        };
        
        console.log('Sending test event to topic:', eventTopic);
        await producer.send({
          topic: eventTopic,
          messages: [
            { value: JSON.stringify(event) }
          ],
        });
        
        // Wait for the response
        const response = await responsePromise;
        console.log('Received event processing response:', response);
        
        return true;
      } catch (error) {
        console.error('Event processing validation failed:', error);
        return false;
      } finally {
        await producer.disconnect();
        await consumer.disconnect();
      }
    }
    
    validateEventProcessing().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/event-validate-$journey.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "default/$pod_name:/tmp/event-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "default" -- node /tmp/event-validate.js; then
    log_success "Event processing validation successful for $journey journey"
    return 0
  else
    log_error "Event processing validation failed for $journey journey"
    return 1
  fi
}

# Validate Redis operations
validate_redis() {
  log_info "Validating Redis operations"
  
  # Skip if not validating Redis-dependent services
  if [[ "$SERVICE_NAME" != "all" && 
        "$SERVICE_NAME" != "auth-service" && 
        "$SERVICE_NAME" != "api-gateway" ]]; then
    log_info "Skipping Redis validation for service $SERVICE_NAME"
    return 0
  fi
  
  # Get a pod for the auth service
  local pod_name
  pod_name=$(kubectl get pods -n "default" -l "app=auth-service" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for auth-service"
    return 1
  fi
  
  # Execute Redis validation command in the pod
  local validation_script="
    const Redis = require('ioredis');
    
    async function validateRedis() {
      const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      });
      
      try {
        // Test connection
        await redis.ping();
        console.log('Redis connection successful');
        
        // Test set/get operations
        const testKey = 'deployment-validator-' + Date.now();
        const testValue = 'test-value-' + Date.now();
        
        await redis.set(testKey, testValue, 'EX', 60); // 60 second expiry
        const retrievedValue = await redis.get(testKey);
        
        if (retrievedValue !== testValue) {
          throw new Error('Redis set/get test failed: values do not match');
        }
        
        console.log('Redis set/get operations successful');
        
        // Clean up
        await redis.del(testKey);
        
        return true;
      } catch (error) {
        console.error('Redis validation failed:', error);
        return false;
      } finally {
        redis.disconnect();
      }
    }
    
    validateRedis().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/redis-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "default/$pod_name:/tmp/redis-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "default" -- node /tmp/redis-validate.js; then
    log_success "Redis operations validation successful"
    return 0
  else
    log_error "Redis operations validation failed"
    return 1
  fi
}

#############################################################################
# API Functionality Validation Functions
#############################################################################

# Validate API functionality
validate_api_functionality() {
  log_info "Validating API functionality"
  local success=true

  # Validate API Gateway
  if [[ "$SERVICE_NAME" == "all" || "$SERVICE_NAME" == "api-gateway" ]]; then
    if ! validate_api_gateway; then
      log_error "API Gateway validation failed"
      success=false
    fi
  fi

  # Validate journey-specific APIs
  local journeys="health care plan"
  for journey in $journeys; do
    if [[ "$SERVICE_NAME" == "all" || "$SERVICE_NAME" == "$journey-service" ]]; then
      if ! validate_journey_api "$journey"; then
        log_error "API validation failed for $journey journey"
        success=false
      fi
    fi
  done

  # Validate authentication
  if [[ "$SERVICE_NAME" == "all" || "$SERVICE_NAME" == "auth-service" ]]; then
    if ! validate_authentication; then
      log_error "Authentication validation failed"
      success=false
    fi
  fi

  if [[ "$success" == "true" ]]; then
    log_success "All API functionality validations passed"
    return 0
  else
    log_error "One or more API functionality validations failed"
    return 1
  fi
}

# Validate API Gateway
validate_api_gateway() {
  log_info "Validating API Gateway"
  
  # Get API Gateway service
  local service_name="api-gateway"
  local namespace="default"
  local port=3000
  
  # For blue-green deployment, determine which deployment to validate
  if [[ "$DEPLOYMENT_TYPE" == "blue-green" ]]; then
    # Get the active deployment (the one receiving traffic)
    service_name=$(kubectl get service "api-gateway" -n "$namespace" -o jsonpath='{.spec.selector.deployment}')
    log_info "Blue-green deployment detected, validating active deployment: $service_name"
  fi
  
  # Get a pod for the API Gateway
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for API Gateway"
    return 1
  fi
  
  # Start port-forward in background
  local local_port=$((10000 + RANDOM % 10000))
  kubectl port-forward "pod/$pod_name" "$local_port:$port" -n "$namespace" &> /dev/null &
  local port_forward_pid=$!
  
  # Wait for port-forward to establish
  sleep 2
  
  # Check API Gateway endpoints
  local endpoints=(
    "/health"
    "/api/v1/journeys"
    "/api/v1/status"
  )
  
  local all_passed=true
  
  for endpoint in "${endpoints[@]}"; do
    log_info "Checking API Gateway endpoint: $endpoint"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$local_port$endpoint")
    
    if [[ "$status_code" == "200" || "$status_code" == "401" ]]; then
      log_success "API Gateway endpoint $endpoint returned status $status_code (OK)"
    else
      log_error "API Gateway endpoint $endpoint returned unexpected status $status_code"
      all_passed=false
    fi
  done
  
  # Kill port-forward process
  kill $port_forward_pid &> /dev/null
  wait $port_forward_pid 2>/dev/null || true
  
  if [[ "$all_passed" == "true" ]]; then
    log_success "API Gateway validation successful"
    return 0
  else
    log_error "API Gateway validation failed"
    return 1
  fi
}

# Validate journey-specific API
validate_journey_api() {
  local journey=$1
  log_info "Validating API for $journey journey"
  
  # Get service name
  local service_name="$journey-service"
  local namespace="default"
  local port=3002
  
  # Get a pod for the journey service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Start port-forward in background
  local local_port=$((10000 + RANDOM % 10000))
  kubectl port-forward "pod/$pod_name" "$local_port:$port" -n "$namespace" &> /dev/null &
  local port_forward_pid=$!
  
  # Wait for port-forward to establish
  sleep 2
  
  # Define journey-specific endpoints to check
  local endpoints=()
  
  case "$journey" in
    health)
      endpoints=(
        "/health"
        "/api/v1/health/metrics"
        "/api/v1/health/goals"
        "/api/v1/health/devices"
      )
      ;;
    care)
      endpoints=(
        "/health"
        "/api/v1/care/providers"
        "/api/v1/care/appointments"
        "/api/v1/care/medications"
      )
      ;;
    plan)
      endpoints=(
        "/health"
        "/api/v1/plan/plans"
        "/api/v1/plan/benefits"
        "/api/v1/plan/claims"
      )
      ;;
    *)
      log_error "Unknown journey for API validation: $journey"
      return 1
      ;;
  esac
  
  local all_passed=true
  
  for endpoint in "${endpoints[@]}"; do
    log_info "Checking $journey journey endpoint: $endpoint"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$local_port$endpoint")
    
    if [[ "$status_code" == "200" || "$status_code" == "401" ]]; then
      log_success "$journey journey endpoint $endpoint returned status $status_code (OK)"
    else
      log_error "$journey journey endpoint $endpoint returned unexpected status $status_code"
      all_passed=false
    fi
  done
  
  # Kill port-forward process
  kill $port_forward_pid &> /dev/null
  wait $port_forward_pid 2>/dev/null || true
  
  if [[ "$all_passed" == "true" ]]; then
    log_success "$journey journey API validation successful"
    return 0
  else
    log_error "$journey journey API validation failed"
    return 1
  fi
}

# Validate authentication
validate_authentication() {
  log_info "Validating authentication service"
  
  # Get service name
  local service_name="auth-service"
  local namespace="default"
  local port=3001
  
  # Get a pod for the auth service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Start port-forward in background
  local local_port=$((10000 + RANDOM % 10000))
  kubectl port-forward "pod/$pod_name" "$local_port:$port" -n "$namespace" &> /dev/null &
  local port_forward_pid=$!
  
  # Wait for port-forward to establish
  sleep 2
  
  # Check auth endpoints
  local endpoints=(
    "/health"
    "/api/v1/auth/status"
  )
  
  local all_passed=true
  
  for endpoint in "${endpoints[@]}"; do
    log_info "Checking auth endpoint: $endpoint"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$local_port$endpoint")
    
    if [[ "$status_code" == "200" || "$status_code" == "401" ]]; then
      log_success "Auth endpoint $endpoint returned status $status_code (OK)"
    else
      log_error "Auth endpoint $endpoint returned unexpected status $status_code"
      all_passed=false
    fi
  done
  
  # Test token generation (if possible)
  if [[ "$ENVIRONMENT" != "production" ]]; then
    log_info "Testing token generation in non-production environment"
    
    # Use test credentials from config
    local test_credentials='{"username":"'"${TEST_USERNAME}"'","password":"'"${TEST_PASSWORD}"'"}'
    
    local token_response
    token_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$test_credentials" "http://localhost:$local_port/api/v1/auth/login")
    
    if [[ "$token_response" == *"token"* ]]; then
      log_success "Token generation successful"
    else
      log_error "Token generation failed"
      all_passed=false
    fi
  fi
  
  # Kill port-forward process
  kill $port_forward_pid &> /dev/null
  wait $port_forward_pid 2>/dev/null || true
  
  if [[ "$all_passed" == "true" ]]; then
    log_success "Authentication validation successful"
    return 0
  else
    log_error "Authentication validation failed"
    return 1
  fi
}

#############################################################################
# Journey-specific Validation Functions
#############################################################################

# Validate journey-specific functionality
validate_journey_functionality() {
  log_info "Validating journey-specific functionality"
  local success=true

  # Validate each journey
  local journeys="health care plan"
  for journey in $journeys; do
    if [[ "$SERVICE_NAME" == "all" || "$SERVICE_NAME" == "$journey-service" ]]; then
      if ! validate_specific_journey "$journey"; then
        log_error "Functionality validation failed for $journey journey"
        success=false
      fi
    fi
  done

  # Validate gamification
  if [[ "$SERVICE_NAME" == "all" || "$SERVICE_NAME" == "gamification-engine" ]]; then
    if ! validate_gamification; then
      log_error "Gamification validation failed"
      success=false
    fi
  fi

  if [[ "$success" == "true" ]]; then
    log_success "All journey functionality validations passed"
    return 0
  else
    log_error "One or more journey functionality validations failed"
    return 1
  fi
}

# Validate specific journey
validate_specific_journey() {
  local journey=$1
  log_info "Validating functionality for $journey journey"
  
  # Define journey-specific validation logic
  case "$journey" in
    health)
      validate_health_journey
      ;;
    care)
      validate_care_journey
      ;;
    plan)
      validate_plan_journey
      ;;
    *)
      log_error "Unknown journey for validation: $journey"
      return 1
      ;;
  esac
}

# Validate health journey
validate_health_journey() {
  log_info "Validating health journey functionality"
  
  # Get service name
  local service_name="health-service"
  local namespace="default"
  
  # Get a pod for the health service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Execute health journey validation script in the pod
  local validation_script="
    const axios = require('axios');
    
    async function validateHealthJourney() {
      try {
        // Test health metrics API
        const metricsResponse = await axios.get('http://localhost:3002/api/v1/health/metrics');
        console.log('Health metrics API response status:', metricsResponse.status);
        
        if (metricsResponse.status !== 200) {
          throw new Error('Health metrics API returned non-200 status');
        }
        
        // Test health goals API
        const goalsResponse = await axios.get('http://localhost:3002/api/v1/health/goals');
        console.log('Health goals API response status:', goalsResponse.status);
        
        if (goalsResponse.status !== 200) {
          throw new Error('Health goals API returned non-200 status');
        }
        
        // Test devices API
        const devicesResponse = await axios.get('http://localhost:3002/api/v1/health/devices');
        console.log('Devices API response status:', devicesResponse.status);
        
        if (devicesResponse.status !== 200) {
          throw new Error('Devices API returned non-200 status');
        }
        
        return true;
      } catch (error) {
        console.error('Health journey validation failed:', error.message);
        return false;
      }
    }
    
    validateHealthJourney().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/health-journey-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "$namespace/$pod_name:/tmp/journey-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "$namespace" -- node /tmp/journey-validate.js; then
    log_success "Health journey validation successful"
    return 0
  else
    log_error "Health journey validation failed"
    return 1
  fi
}

# Validate care journey
validate_care_journey() {
  log_info "Validating care journey functionality"
  
  # Get service name
  local service_name="care-service"
  local namespace="default"
  
  # Get a pod for the care service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Execute care journey validation script in the pod
  local validation_script="
    const axios = require('axios');
    
    async function validateCareJourney() {
      try {
        // Test providers API
        const providersResponse = await axios.get('http://localhost:3002/api/v1/care/providers');
        console.log('Providers API response status:', providersResponse.status);
        
        if (providersResponse.status !== 200) {
          throw new Error('Providers API returned non-200 status');
        }
        
        // Test appointments API
        const appointmentsResponse = await axios.get('http://localhost:3002/api/v1/care/appointments');
        console.log('Appointments API response status:', appointmentsResponse.status);
        
        if (appointmentsResponse.status !== 200) {
          throw new Error('Appointments API returned non-200 status');
        }
        
        // Test medications API
        const medicationsResponse = await axios.get('http://localhost:3002/api/v1/care/medications');
        console.log('Medications API response status:', medicationsResponse.status);
        
        if (medicationsResponse.status !== 200) {
          throw new Error('Medications API returned non-200 status');
        }
        
        return true;
      } catch (error) {
        console.error('Care journey validation failed:', error.message);
        return false;
      }
    }
    
    validateCareJourney().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/care-journey-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "$namespace/$pod_name:/tmp/journey-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "$namespace" -- node /tmp/journey-validate.js; then
    log_success "Care journey validation successful"
    return 0
  else
    log_error "Care journey validation failed"
    return 1
  fi
}

# Validate plan journey
validate_plan_journey() {
  log_info "Validating plan journey functionality"
  
  # Get service name
  local service_name="plan-service"
  local namespace="default"
  
  # Get a pod for the plan service
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Execute plan journey validation script in the pod
  local validation_script="
    const axios = require('axios');
    
    async function validatePlanJourney() {
      try {
        // Test plans API
        const plansResponse = await axios.get('http://localhost:3002/api/v1/plan/plans');
        console.log('Plans API response status:', plansResponse.status);
        
        if (plansResponse.status !== 200) {
          throw new Error('Plans API returned non-200 status');
        }
        
        // Test benefits API
        const benefitsResponse = await axios.get('http://localhost:3002/api/v1/plan/benefits');
        console.log('Benefits API response status:', benefitsResponse.status);
        
        if (benefitsResponse.status !== 200) {
          throw new Error('Benefits API returned non-200 status');
        }
        
        // Test claims API
        const claimsResponse = await axios.get('http://localhost:3002/api/v1/plan/claims');
        console.log('Claims API response status:', claimsResponse.status);
        
        if (claimsResponse.status !== 200) {
          throw new Error('Claims API returned non-200 status');
        }
        
        return true;
      } catch (error) {
        console.error('Plan journey validation failed:', error.message);
        return false;
      }
    }
    
    validatePlanJourney().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/plan-journey-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "$namespace/$pod_name:/tmp/journey-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "$namespace" -- node /tmp/journey-validate.js; then
    log_success "Plan journey validation successful"
    return 0
  else
    log_error "Plan journey validation failed"
    return 1
  fi
}

# Validate gamification
validate_gamification() {
  log_info "Validating gamification functionality"
  
  # Get service name
  local service_name="gamification-engine"
  local namespace="default"
  
  # Get a pod for the gamification engine
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "app=$service_name" -o jsonpath='{.items[0].metadata.name}')
  
  if [[ -z "$pod_name" ]]; then
    log_error "No pods found for $service_name"
    return 1
  fi
  
  # Execute gamification validation script in the pod
  local validation_script="
    const axios = require('axios');
    
    async function validateGamification() {
      try {
        // Test achievements API
        const achievementsResponse = await axios.get('http://localhost:3003/api/v1/gamification/achievements');
        console.log('Achievements API response status:', achievementsResponse.status);
        
        if (achievementsResponse.status !== 200) {
          throw new Error('Achievements API returned non-200 status');
        }
        
        // Test rewards API
        const rewardsResponse = await axios.get('http://localhost:3003/api/v1/gamification/rewards');
        console.log('Rewards API response status:', rewardsResponse.status);
        
        if (rewardsResponse.status !== 200) {
          throw new Error('Rewards API returned non-200 status');
        }
        
        // Test profiles API
        const profilesResponse = await axios.get('http://localhost:3003/api/v1/gamification/profiles');
        console.log('Profiles API response status:', profilesResponse.status);
        
        if (profilesResponse.status !== 200) {
          throw new Error('Profiles API returned non-200 status');
        }
        
        return true;
      } catch (error) {
        console.error('Gamification validation failed:', error.message);
        return false;
      }
    }
    
    validateGamification().then(success => process.exit(success ? 0 : 1));
  "
  
  # Save validation script to temporary file
  local script_file="$VALIDATION_TMP_DIR/gamification-validate.js"
  echo "$validation_script" > "$script_file"
  
  # Copy script to pod
  kubectl cp "$script_file" "$namespace/$pod_name:/tmp/gamification-validate.js"
  
  # Execute script in pod
  if kubectl exec "$pod_name" -n "$namespace" -- node /tmp/gamification-validate.js; then
    log_success "Gamification validation successful"
    return 0
  else
    log_error "Gamification validation failed"
    return 1
  fi
}

#############################################################################
# Performance Baseline Comparison Functions
#############################################################################

# Compare performance metrics against baselines
validate_performance() {
  log_info "Validating performance metrics against baselines"
  
  # Skip performance validation in development environment
  if [[ "$ENVIRONMENT" == "development" ]]; then
    log_info "Skipping performance validation in development environment"
    return 0
  fi
  
  # Check if Prometheus tools are available
  if ! command -v prometheus &> /dev/null || ! command -v promtool &> /dev/null; then
    log_warn "Prometheus tools not found, skipping performance validation"
    return 0
  fi
  
  local success=true
  
  # Validate container startup times
  if ! validate_container_startup_times; then
    log_error "Container startup time validation failed"
    success=false
  fi
  
  # Validate API response times
  if ! validate_api_response_times; then
    log_error "API response time validation failed"
    success=false
  fi
  
  # Validate database query performance
  if ! validate_database_performance; then
    log_error "Database performance validation failed"
    success=false
  fi
  
  if [[ "$success" == "true" ]]; then
    log_success "All performance validations passed"
    return 0
  else
    log_error "One or more performance validations failed"
    return 1
  fi
}

# Validate container startup times
validate_container_startup_times() {
  log_info "Validating container startup times"
  
  # Get Prometheus endpoint
  local prometheus_url="${PROMETHEUS_URL:-http://prometheus.monitoring:9090}"
  
  # Define query to get container startup times
  local query="sum(kube_pod_start_time{namespace=\"default\"}) by (pod) - sum(kube_pod_created{namespace=\"default\"}) by (pod)"
  
  # Execute query against Prometheus
  local result
  result=$(curl -s -G --data-urlencode "query=$query" "$prometheus_url/api/v1/query")
  
  # Check if query was successful
  if [[ "$(echo "$result" | jq -r '.status')" != "success" ]]; then
    log_error "Failed to query Prometheus for container startup times"
    return 1
  fi
  
  # Parse results
  local startup_times
  startup_times=$(echo "$result" | jq -r '.data.result[] | "\(.metric.pod): \(.value[1])"')
  
  if [[ -z "$startup_times" ]]; then
    log_warn "No container startup time data found"
    return 0
  fi
  
  log_info "Container startup times:\n$startup_times"
  
  # Compare against baseline thresholds
  local exceeded=false
  
  while IFS=: read -r pod time; do
    # Get baseline threshold for this pod type
    local threshold
    local pod_type
    
    # Extract pod type from name (e.g., api-gateway-xyz -> api-gateway)
    pod_type=$(echo "$pod" | sed -E 's/([a-z-]+)-[a-z0-9]+$/\1/')
    
    # Get threshold from config
    threshold=${STARTUP_TIME_THRESHOLDS[$pod_type]:-30}
    
    if (( $(echo "$time > $threshold" | bc -l) )); then
      log_error "Container startup time for $pod ($time seconds) exceeds threshold ($threshold seconds)"
      exceeded=true
    else
      log_success "Container startup time for $pod ($time seconds) within threshold ($threshold seconds)"
    fi
  done <<< "$startup_times"
  
  if [[ "$exceeded" == "true" ]]; then
    log_error "One or more container startup times exceed thresholds"
    return 1
  else
    log_success "All container startup times within thresholds"
    return 0
  fi
}

# Validate API response times
validate_api_response_times() {
  log_info "Validating API response times"
  
  # Get Prometheus endpoint
  local prometheus_url="${PROMETHEUS_URL:-http://prometheus.monitoring:9090}"
  
  # Define query to get API response times (95th percentile)
  local query="histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{namespace=\"default\"}[5m])) by (le, service, path))"
  
  # Execute query against Prometheus
  local result
  result=$(curl -s -G --data-urlencode "query=$query" "$prometheus_url/api/v1/query")
  
  # Check if query was successful
  if [[ "$(echo "$result" | jq -r '.status')" != "success" ]]; then
    log_error "Failed to query Prometheus for API response times"
    return 1
  fi
  
  # Parse results
  local response_times
  response_times=$(echo "$result" | jq -r '.data.result[] | "\(.metric.service)\(\(.metric.path)): \(.value[1])"')
  
  if [[ -z "$response_times" ]]; then
    log_warn "No API response time data found"
    return 0
  fi
  
  log_info "API response times (95th percentile):\n$response_times"
  
  # Compare against baseline thresholds
  local exceeded=false
  
  while IFS=: read -r endpoint time; do
    # Get baseline threshold for this endpoint
    local threshold
    
    # Extract service and path from endpoint
    local service path
    if [[ "$endpoint" =~ (.+)\((.+)\) ]]; then
      service="${BASH_REMATCH[1]}"
      path="${BASH_REMATCH[2]}"
    else
      service="unknown"
      path="unknown"
    fi
    
    # Get threshold from config based on service and path
    threshold=${API_RESPONSE_TIME_THRESHOLDS["$service:$path"]:-1.0}
    
    if (( $(echo "$time > $threshold" | bc -l) )); then
      log_error "API response time for $endpoint ($time seconds) exceeds threshold ($threshold seconds)"
      exceeded=true
    else
      log_success "API response time for $endpoint ($time seconds) within threshold ($threshold seconds)"
    fi
  done <<< "$response_times"
  
  if [[ "$exceeded" == "true" ]]; then
    log_error "One or more API response times exceed thresholds"
    return 1
  else
    log_success "All API response times within thresholds"
    return 0
  fi
}

# Validate database query performance
validate_database_performance() {
  log_info "Validating database query performance"
  
  # Get Prometheus endpoint
  local prometheus_url="${PROMETHEUS_URL:-http://prometheus.monitoring:9090}"
  
  # Define query to get database query times (95th percentile)
  local query="histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket{namespace=\"default\"}[5m])) by (le, service, query_type))"
  
  # Execute query against Prometheus
  local result
  result=$(curl -s -G --data-urlencode "query=$query" "$prometheus_url/api/v1/query")
  
  # Check if query was successful
  if [[ "$(echo "$result" | jq -r '.status')" != "success" ]]; then
    log_error "Failed to query Prometheus for database query times"
    return 1
  fi
  
  # Parse results
  local query_times
  query_times=$(echo "$result" | jq -r '.data.result[] | "\(.metric.service)\(\(.metric.query_type)): \(.value[1])"')
  
  if [[ -z "$query_times" ]]; then
    log_warn "No database query time data found"
    return 0
  fi
  
  log_info "Database query times (95th percentile):\n$query_times"
  
  # Compare against baseline thresholds
  local exceeded=false
  
  while IFS=: read -r query_info time; do
    # Get baseline threshold for this query type
    local threshold
    
    # Extract service and query type from query_info
    local service query_type
    if [[ "$query_info" =~ (.+)\((.+)\) ]]; then
      service="${BASH_REMATCH[1]}"
      query_type="${BASH_REMATCH[2]}"
    else
      service="unknown"
      query_type="unknown"
    fi
    
    # Get threshold from config based on service and query type
    threshold=${DB_QUERY_TIME_THRESHOLDS["$service:$query_type"]:-0.5}
    
    if (( $(echo "$time > $threshold" | bc -l) )); then
      log_error "Database query time for $query_info ($time seconds) exceeds threshold ($threshold seconds)"
      exceeded=true
    else
      log_success "Database query time for $query_info ($time seconds) within threshold ($threshold seconds)"
    fi
  done <<< "$query_times"
  
  if [[ "$exceeded" == "true" ]]; then
    log_error "One or more database query times exceed thresholds"
    return 1
  else
    log_success "All database query times within thresholds"
    return 0
  fi
}

#############################################################################
# Monitoring Integration Functions
#############################################################################

# Integrate with monitoring systems
validate_monitoring() {
  log_info "Validating monitoring integration"
  
  # Skip monitoring validation in development environment
  if [[ "$ENVIRONMENT" == "development" ]]; then
    log_info "Skipping monitoring validation in development environment"
    return 0
  fi
  
  local success=true
  
  # Validate Prometheus metrics
  if ! validate_prometheus_metrics; then
    log_error "Prometheus metrics validation failed"
    success=false
  fi
  
  # Validate alerting rules
  if ! validate_alerting_rules; then
    log_error "Alerting rules validation failed"
    success=false
  fi
  
  # Validate logging
  if ! validate_logging; then
    log_error "Logging validation failed"
    success=false
  fi
  
  if [[ "$success" == "true" ]]; then
    log_success "All monitoring validations passed"
    return 0
  else
    log_error "One or more monitoring validations failed"
    return 1
  fi
}

# Validate Prometheus metrics
validate_prometheus_metrics() {
  log_info "Validating Prometheus metrics"
  
  # Get Prometheus endpoint
  local prometheus_url="${PROMETHEUS_URL:-http://prometheus.monitoring:9090}"
  
  # List of required metrics to check
  local required_metrics=(
    "up{namespace=\"default\"}"
    "kube_deployment_status_replicas_available{namespace=\"default\"}"
    "http_requests_total{namespace=\"default\"}"
    "http_request_duration_seconds_count{namespace=\"default\"}"
    "database_query_duration_seconds_count{namespace=\"default\"}"
    "kafka_consumer_lag{namespace=\"default\"}"
    "redis_connected_clients{namespace=\"default\"}"
  )
  
  local all_metrics_found=true
  
  for metric in "${required_metrics[@]}"; do
    log_info "Checking for metric: $metric"
    
    # Query Prometheus for this metric
    local result
    result=$(curl -s -G --data-urlencode "query=$metric" "$prometheus_url/api/v1/query")
    
    # Check if query was successful and returned data
    if [[ "$(echo "$result" | jq -r '.status')" != "success" || "$(echo "$result" | jq -r '.data.result | length')" -eq 0 ]]; then
      log_error "Required metric not found: $metric"
      all_metrics_found=false
    else
      log_success "Required metric found: $metric"
    fi
  done
  
  if [[ "$all_metrics_found" == "true" ]]; then
    log_success "All required Prometheus metrics found"
    return 0
  else
    log_error "One or more required Prometheus metrics not found"
    return 1
  fi
}

# Validate alerting rules
validate_alerting_rules() {
  log_info "Validating alerting rules"
  
  # Get Prometheus endpoint
  local prometheus_url="${PROMETHEUS_URL:-http://prometheus.monitoring:9090}"
  
  # Get all alerting rules
  local result
  result=$(curl -s "$prometheus_url/api/v1/rules")
  
  # Check if query was successful
  if [[ "$(echo "$result" | jq -r '.status')" != "success" ]]; then
    log_error "Failed to query Prometheus for alerting rules"
    return 1
  fi
  
  # Parse results to get all alert names
  local alert_names
  alert_names=$(echo "$result" | jq -r '.data.groups[].rules[] | select(.type == "alerting") | .name')
  
  if [[ -z "$alert_names" ]]; then
    log_warn "No alerting rules found"
    return 1
  fi
  
  log_info "Found alerting rules:\n$alert_names"
  
  # List of required alerts to check
  local required_alerts=(
    "InstanceDown"
    "KubeDeploymentReplicasMismatch"
    "KubePodCrashLooping"
    "KubePodNotReady"
    "HighErrorRate"
    "SlowAPIResponse"
    "DatabaseConnectionPoolSaturation"
    "KafkaConsumerLag"
    "RedisMemoryHigh"
  )
  
  local all_alerts_found=true
  
  for alert in "${required_alerts[@]}"; do
    if ! echo "$alert_names" | grep -q "$alert"; then
      log_error "Required alert not found: $alert"
      all_alerts_found=false
    else
      log_success "Required alert found: $alert"
    fi
  done
  
  if [[ "$all_alerts_found" == "true" ]]; then
    log_success "All required alerting rules found"
    return 0
  else
    log_error "One or more required alerting rules not found"
    return 1
  fi
}

# Validate logging
validate_logging() {
  log_info "Validating logging"
  
  # Check if we can access the logging system
  # This is a simplified check - in a real environment, you would query your logging system (e.g., Elasticsearch, Loki)
  
  # List of services to check logs for
  local services=(
    "api-gateway"
    "auth-service"
    "health-service"
    "care-service"
    "plan-service"
    "gamification-engine"
    "notification-service"
  )
  
  local all_logs_found=true
  
  for service in "${services[@]}"; do
    log_info "Checking logs for service: $service"
    
    # Get a pod for the service
    local pod_name
    pod_name=$(kubectl get pods -n "default" -l "app=$service" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$pod_name" ]]; then
      log_error "No pods found for service $service"
      all_logs_found=false
      continue
    fi
    
    # Check if logs are being generated
    local log_output
    log_output=$(kubectl logs --tail=10 "$pod_name" -n "default" 2>/dev/null)
    
    if [[ -z "$log_output" ]]; then
      log_error "No logs found for service $service"
      all_logs_found=false
    else
      log_success "Logs found for service $service"
    fi
  done
  
  if [[ "$all_logs_found" == "true" ]]; then
    log_success "Logs found for all services"
    return 0
  else
    log_error "Logs missing for one or more services"
    return 1
  fi
}

#############################################################################
# Main Execution Flow
#############################################################################

# Main function
main() {
  log_header "Starting AUSTA SuperApp Deployment Validation"
  
  # Parse command line arguments
  parse_arguments "$@"
  
  # Check dependencies
  check_dependencies
  
  # Initialize environment
  initialize_environment
  
  # Track overall validation status
  local validation_status=0
  
  # Validate service health
  if ! validate_service_health "$SERVICE_NAME"; then
    validation_status=1
  fi
  
  # Validate databases
  if ! validate_databases; then
    validation_status=1
  fi
  
  # Validate messaging systems
  if ! validate_kafka; then
    validation_status=1
  fi
  
  # Validate Redis
  if ! validate_redis; then
    validation_status=1
  fi
  
  # Validate API functionality
  if ! validate_api_functionality; then
    validation_status=1
  fi
  
  # Validate journey-specific functionality
  if ! validate_journey_functionality; then
    validation_status=1
  fi
  
  # Validate performance metrics
  if ! validate_performance; then
    validation_status=1
  fi
  
  # Validate monitoring integration
  if ! validate_monitoring; then
    validation_status=1
  fi
  
  # Final validation result
  if [[ $validation_status -eq 0 ]]; then
    log_success "Deployment validation successful"
  else
    log_error "Deployment validation failed"
  fi
  
  log_header "Deployment Validation Complete"
  
  return $validation_status
}

# Execute main function with all arguments
main "$@"