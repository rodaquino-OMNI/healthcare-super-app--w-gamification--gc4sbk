#!/bin/bash

###############################################################################
# kafka-setup.sh
# Script to set up Kafka topics for the AUSTA SuperApp Gamification Engine
#
# Purpose:
#   This script automates the creation and configuration of all Kafka topics
#   required by the gamification-engine service. It creates topics for health
#   events, care events, plan events, user events, and gamification events with
#   appropriate partition counts, replication factors, and retention policies.
#
# Features:
#   - Creates all required topics with standardized naming conventions
#   - Sets up dead-letter queues (DLQ) for each topic for error handling
#   - Creates retry topics for gamification events
#   - Validates Kafka connectivity and permissions
#   - Detects existing topics to avoid recreation
#   - Supports dry-run mode for testing
#   - Configurable via command-line arguments or environment variables
#
# Usage:
#   ./kafka-setup.sh [OPTIONS]
#
# Environment Variables:
#   KAFKA_BOOTSTRAP_SERVERS - Kafka bootstrap servers (default: localhost:9092)
#   KAFKA_ZOOKEEPER - Zookeeper servers (default: localhost:2181)
#   TOPIC_REPLICATION_FACTOR - Topic replication factor (default: 1)
#   TOPIC_PARTITIONS - Topic partition count (default: 3)
#   TOPIC_RETENTION_MS - Topic retention in milliseconds (default: 7 days)
#   DLQ_RETENTION_MS - DLQ topic retention in milliseconds (default: 14 days)
#
# Author: AUSTA SuperApp Development Team
# Date: May 2025
# Version: 1.0.0
###############################################################################

set -e

# Ensure script exits on error and handles cleanup
trap 'echo -e "\n${RED}Script execution failed!${NC}"; exit 1' ERR

# Display usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  --bootstrap-servers <servers>  Kafka bootstrap servers (default: localhost:9092)"
  echo "  --zookeeper <servers>          Zookeeper servers (default: localhost:2181)"
  echo "  --replication-factor <factor>  Topic replication factor (default: 1)"
  echo "  --partitions <count>           Topic partition count (default: 3)"
  echo "  --retention-ms <milliseconds>  Topic retention in milliseconds (default: 7 days)"
  echo "  --dlq-retention-ms <ms>        DLQ topic retention in milliseconds (default: 14 days)"
  echo "  --dry-run                      Show what would be done without making changes"
  echo "  --help                         Display this help message"
  exit 1
}

# Process command line arguments
DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bootstrap-servers)
      KAFKA_BOOTSTRAP_SERVERS="$2"
      shift 2
      ;;
    --zookeeper)
      KAFKA_ZOOKEEPER="$2"
      shift 2
      ;;
    --replication-factor)
      TOPIC_REPLICATION_FACTOR="$2"
      shift 2
      ;;
    --partitions)
      TOPIC_PARTITIONS="$2"
      shift 2
      ;;
    --retention-ms)
      TOPIC_RETENTION_MS="$2"
      shift 2
      ;;
    --dlq-retention-ms)
      DLQ_RETENTION_MS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Configuration variables
KAFKA_BOOTSTRAP_SERVERS=${KAFKA_BOOTSTRAP_SERVERS:-"localhost:9092"}
KAFKA_ZOOKEEPER=${KAFKA_ZOOKEEPER:-"localhost:2181"}
TOPIC_REPLICATION_FACTOR=${TOPIC_REPLICATION_FACTOR:-1}
TOPIC_PARTITIONS=${TOPIC_PARTITIONS:-3}
TOPIC_RETENTION_MS=${TOPIC_RETENTION_MS:-604800000}  # 7 days in milliseconds
DLQ_RETENTION_MS=${DLQ_RETENTION_MS:-1209600000}      # 14 days in milliseconds

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Print script banner
echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}  AUSTA SuperApp - Gamification Engine Kafka Setup${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "${YELLOW}Configuring Kafka topics for event processing...${NC}"
echo ""

# Function to check if Kafka is available
check_kafka_connection() {
  echo -e "${YELLOW}Checking Kafka connection at ${KAFKA_BOOTSTRAP_SERVERS}...${NC}"
  
  # Try to connect with timeout to avoid hanging indefinitely
  if ! timeout 10s kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --list &>/dev/null; then
    echo -e "${RED}ERROR: Cannot connect to Kafka at ${KAFKA_BOOTSTRAP_SERVERS}${NC}"
    echo -e "${RED}Please check the following:${NC}"
    echo -e "${RED}  1. Kafka service is running${NC}"
    echo -e "${RED}  2. Bootstrap servers are correctly configured${NC}"
    echo -e "${RED}  3. Network connectivity to Kafka is available${NC}"
    echo -e "${RED}  4. Firewall rules allow connection to Kafka ports${NC}"
    
    # Check if we can ping the host
    local kafka_host=$(echo "$KAFKA_BOOTSTRAP_SERVERS" | cut -d ':' -f 1)
    if ping -c 1 "$kafka_host" &>/dev/null; then
      echo -e "${YELLOW}Host $kafka_host is reachable, but Kafka service may not be running or listening on the specified port.${NC}"
    else
      echo -e "${YELLOW}Host $kafka_host is not reachable. Check network configuration.${NC}"
    fi
    
    exit 1
  fi
  
  # Verify we can describe topics (requires more permissions than just listing)
  if ! timeout 5s kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe &>/dev/null; then
    echo -e "${YELLOW}WARNING: Connected to Kafka, but may have limited permissions.${NC}"
    echo -e "${YELLOW}Topic creation may fail if the client lacks necessary permissions.${NC}"
  else
    echo -e "${GREEN}Successfully connected to Kafka with sufficient permissions!${NC}"
  fi
  
  echo ""
}

# Function to create a topic if it doesn't exist
create_topic() {
  local topic_name=$1
  local partitions=$2
  local replication_factor=$3
  local retention_ms=$4
  local is_dlq=${5:-false}
  
  # Validate topic name format
  if [[ ! "$topic_name" =~ ^[a-zA-Z0-9\._\-]+$ ]]; then
    echo -e "${RED}Invalid topic name: '$topic_name'. Topic names can only contain alphanumeric characters, dots, underscores, and hyphens.${NC}"
    exit 1
  fi
  
  # Check if topic already exists
  if kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --list | grep -q "^$topic_name$"; then
    echo -e "${YELLOW}Topic '$topic_name' already exists.${NC}"
    
    # If not in dry run mode, verify and update topic configuration if needed
    if [ "$DRY_RUN" = false ]; then
      echo -e "${YELLOW}Verifying topic configuration...${NC}"
      
      # Get current partition count
      local current_partitions=$(kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe --topic "$topic_name" | grep "PartitionCount" | awk '{print $4}')
      
      # Check if partition count needs to be increased
      if [ "$current_partitions" -lt "$partitions" ]; then
        echo -e "${YELLOW}Increasing partition count from $current_partitions to $partitions...${NC}"
        if ! kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --alter --topic "$topic_name" --partitions "$partitions"; then
          echo -e "${RED}Failed to update partition count for topic '$topic_name'${NC}"
          exit 1
        fi
        echo -e "${GREEN}Successfully updated partition count for topic '$topic_name'${NC}"
      fi
      
      # Update retention time if needed
      echo -e "${YELLOW}Updating retention time configuration...${NC}"
      if ! kafka-configs.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --entity-type topics --entity-name "$topic_name" --alter --add-config retention.ms="$retention_ms"; then
        echo -e "${RED}Failed to update retention time for topic '$topic_name'${NC}"
        exit 1
      fi
      echo -e "${GREEN}Successfully updated retention time for topic '$topic_name'${NC}"
    fi
    
    return 0
  fi
  
  # Create topic with specified configuration
  echo -e "${YELLOW}Creating topic '$topic_name'...${NC}"
  
  # Build the create topic command
  local create_cmd="kafka-topics.sh --bootstrap-server \"$KAFKA_BOOTSTRAP_SERVERS\" \
    --create \
    --topic $topic_name \
    --partitions $partitions \
    --replication-factor $replication_factor \
    --config retention.ms=$retention_ms \
    --config min.insync.replicas=1"
  
  # Add DLQ-specific configurations if this is a DLQ topic
  if [ "$is_dlq" = true ]; then
    create_cmd="$create_cmd \
    --config cleanup.policy=compact,delete \
    --config max.compaction.lag.ms=86400000 \
    --config min.compaction.lag.ms=21600000"
  else
    # Regular topic configurations
    create_cmd="$create_cmd \
    --config cleanup.policy=delete \
    --config segment.bytes=1073741824"
  fi
  
  # Check if we're in dry run mode
  if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}DRY RUN: Would execute: ${NC}"
    echo "$create_cmd"
    echo -e "${GREEN}DRY RUN: Topic '$topic_name' would be created${NC}"
    return 0
  fi
  
  # Execute the command
  if eval "$create_cmd"; then
    echo -e "${GREEN}Successfully created topic '$topic_name'${NC}"
  else
    echo -e "${RED}Failed to create topic '$topic_name'${NC}"
    exit 1
  fi
  
  # Verify topic was created successfully
  if ! kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --list | grep -q "^$topic_name$"; then
    echo -e "${RED}Topic creation verification failed for '$topic_name'${NC}"
    exit 1
  fi
}

# Function to create a topic and its corresponding dead-letter queue
create_topic_with_dlq() {
  local base_name=$1
  local partitions=$2
  local replication_factor=$3
  local retention_ms=$4
  
  # Validate input parameters
  if [[ -z "$base_name" ]]; then
    echo -e "${RED}Error: Topic name cannot be empty${NC}"
    exit 1
  fi
  
  if [[ ! "$partitions" =~ ^[0-9]+$ ]] || [ "$partitions" -lt 1 ]; then
    echo -e "${RED}Error: Partition count must be a positive integer, got '$partitions'${NC}"
    exit 1
  fi
  
  if [[ ! "$replication_factor" =~ ^[0-9]+$ ]] || [ "$replication_factor" -lt 1 ]; then
    echo -e "${RED}Error: Replication factor must be a positive integer, got '$replication_factor'${NC}"
    exit 1
  fi
  
  if [[ ! "$retention_ms" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Error: Retention time must be a positive integer in milliseconds, got '$retention_ms'${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}Setting up topic group: ${base_name}${NC}"
  
  # Create main topic
  create_topic "$base_name" "$partitions" "$replication_factor" "$retention_ms"
  
  # Create DLQ topic with DLQ suffix
  # DLQ topics typically need fewer partitions but longer retention
  local dlq_partitions=$(( partitions > 1 ? partitions / 2 : 1 ))
  create_topic "${base_name}.dlq" "$dlq_partitions" "$replication_factor" "$DLQ_RETENTION_MS" true
  
  # Create retry topic if needed for complex retry patterns
  if [[ "$base_name" == *"gamification"* ]]; then
    # Gamification events might need retry topics for complex retry patterns
    create_topic "${base_name}.retry" "$dlq_partitions" "$replication_factor" "$TOPIC_RETENTION_MS" false
  fi
}

# Function to validate environment
validate_environment() {
  # Check for required commands
  for cmd in kafka-topics.sh kafka-configs.sh; do
    if ! command -v "$cmd" &>/dev/null; then
      echo -e "${RED}ERROR: Required command '$cmd' not found in PATH${NC}"
      echo -e "${YELLOW}Please ensure Kafka binaries are installed and in your PATH${NC}"
      exit 1
    fi
  done
  
  # Check environment variables
  if [[ -z "$KAFKA_BOOTSTRAP_SERVERS" ]]; then
    echo -e "${YELLOW}WARNING: KAFKA_BOOTSTRAP_SERVERS not set, using default: localhost:9092${NC}"
  fi
}

# Function to print configuration summary
print_config_summary() {
  echo -e "\n${BLUE}Configuration Summary:${NC}"
  echo -e "${BLUE}--------------------------------------------------${NC}"
  echo -e "${BLUE}Kafka Bootstrap Servers:   ${NC}${KAFKA_BOOTSTRAP_SERVERS}"
  echo -e "${BLUE}Zookeeper:                 ${NC}${KAFKA_ZOOKEEPER}"
  echo -e "${BLUE}Topic Replication Factor:  ${NC}${TOPIC_REPLICATION_FACTOR}"
  echo -e "${BLUE}Topic Partitions:          ${NC}${TOPIC_PARTITIONS}"
  echo -e "${BLUE}Topic Retention:           ${NC}${TOPIC_RETENTION_MS} ms ($(( TOPIC_RETENTION_MS / 86400000 )) days)"
  echo -e "${BLUE}DLQ Retention:             ${NC}${DLQ_RETENTION_MS} ms ($(( DLQ_RETENTION_MS / 86400000 )) days)"
  echo -e "${BLUE}Dry Run Mode:              ${NC}${DRY_RUN}"
  echo -e "${BLUE}--------------------------------------------------${NC}\n"
}

# Main execution

# Validate environment
validate_environment

# Print configuration summary
print_config_summary

# Check if we're in dry run mode
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Running in DRY RUN mode. No changes will be made.${NC}\n"
fi

# Check Kafka connection
check_kafka_connection

# Create journey-specific event topics
echo -e "${BLUE}Creating journey-specific event topics...${NC}"

# Health journey event topics
echo -e "\n${BLUE}Health Journey Event Topics:${NC}"
create_topic_with_dlq "austa.events.health.metrics" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.health.goals" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.health.devices" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.health.insights" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Care journey event topics
echo -e "\n${BLUE}Care Journey Event Topics:${NC}"
create_topic_with_dlq "austa.events.care.appointments" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.care.medications" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.care.telemedicine" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.care.providers" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.care.treatments" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Plan journey event topics
echo -e "\n${BLUE}Plan Journey Event Topics:${NC}"
create_topic_with_dlq "austa.events.plan.claims" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.plan.benefits" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.plan.coverage" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.plan.documents" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# User events
echo -e "\n${BLUE}User Event Topics:${NC}"
create_topic_with_dlq "austa.events.users.profile" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.users.auth" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.users.preferences" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Gamification-specific event topics
echo -e "\n${BLUE}Gamification Event Topics:${NC}"
create_topic_with_dlq "austa.events.gamification.achievements" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.gamification.rewards" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.gamification.quests" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.gamification.leaderboard" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.gamification.rules" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.gamification.profiles" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Notification topics
echo -e "\n${BLUE}Notification Event Topics:${NC}"
create_topic_with_dlq "austa.events.notifications.achievements" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.notifications.rewards" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"
create_topic_with_dlq "austa.events.notifications.quests" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Create aggregated events topic for analytics
echo -e "\n${BLUE}Analytics Event Topics:${NC}"
create_topic_with_dlq "austa.events.analytics.gamification" "$TOPIC_PARTITIONS" "$TOPIC_REPLICATION_FACTOR" "$TOPIC_RETENTION_MS"

# Summary
echo -e "\n${GREEN}=========================================================${NC}"
echo -e "${GREEN}Kafka topic setup completed successfully!${NC}"
echo -e "${GREEN}All required topics for the Gamification Engine are configured.${NC}"
echo -e "${GREEN}=========================================================${NC}"

# List all configured topics
echo -e "\n${BLUE}Configured topics:${NC}"
kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --list | grep "^austa" | sort

# Print topic details if not in dry run mode
if [ "$DRY_RUN" = false ]; then
  echo -e "\n${BLUE}Topic details:${NC}"
  kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe --topics-with-overrides | grep -E "Topic:|retention.ms"
  
  # Print partition counts
  echo -e "\n${BLUE}Topic partition counts:${NC}"
  kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe | grep -E "Topic:|PartitionCount" | grep -A1 "austa" | grep -v "--"
  
  # Print replication factors
  echo -e "\n${BLUE}Topic replication factors:${NC}"
  kafka-topics.sh --bootstrap-server "$KAFKA_BOOTSTRAP_SERVERS" --describe | grep -E "Topic:|ReplicationFactor" | grep -A1 "austa" | grep -v "--"
fi

exit 0