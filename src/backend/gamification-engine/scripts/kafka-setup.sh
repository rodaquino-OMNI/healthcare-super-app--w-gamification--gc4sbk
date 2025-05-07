#!/bin/bash

# kafka-setup.sh
# Script to set up Kafka topics for the gamification-engine service
# This script creates and configures all required Kafka topics with appropriate
# settings for partitions, replication factor, and retention policies.

set -e

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Default configuration values
DEFAULT_KAFKA_BROKERS="localhost:9092"
DEFAULT_PARTITIONS=3
DEFAULT_REPLICATION_FACTOR=1
DEFAULT_RETENTION_MS=604800000 # 7 days in milliseconds

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
  echo -e "${BLUE}Loading environment variables from .env file${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Configuration from environment variables with defaults
KAFKA_BROKERS=${KAFKA_BROKERS:-$DEFAULT_KAFKA_BROKERS}
PARTITIONS=${KAFKA_PARTITIONS:-$DEFAULT_PARTITIONS}
REPLICATION_FACTOR=${KAFKA_REPLICATION_FACTOR:-$DEFAULT_REPLICATION_FACTOR}
RETENTION_MS=${KAFKA_RETENTION_MS:-$DEFAULT_RETENTION_MS}

# Topic names from environment variables with defaults
HEALTH_EVENTS_TOPIC=${KAFKA_TOPIC_HEALTH_EVENTS:-"health.events"}
CARE_EVENTS_TOPIC=${KAFKA_TOPIC_CARE_EVENTS:-"care.events"}
PLAN_EVENTS_TOPIC=${KAFKA_TOPIC_PLAN_EVENTS:-"plan.events"}
USER_EVENTS_TOPIC=${KAFKA_TOPIC_USER_EVENTS:-"user.events"}
GAME_EVENTS_TOPIC=${KAFKA_TOPIC_GAME_EVENTS:-"game.events"}

# Print configuration
echo -e "${BLUE}Kafka Setup Configuration:${NC}"
echo -e "Kafka Brokers: ${KAFKA_BROKERS}"
echo -e "Partitions: ${PARTITIONS}"
echo -e "Replication Factor: ${REPLICATION_FACTOR}"
echo -e "Retention (ms): ${RETENTION_MS}"
echo -e "\nTopic Names:"
echo -e "Health Events: ${HEALTH_EVENTS_TOPIC}"
echo -e "Care Events: ${CARE_EVENTS_TOPIC}"
echo -e "Plan Events: ${PLAN_EVENTS_TOPIC}"
echo -e "User Events: ${USER_EVENTS_TOPIC}"
echo -e "Game Events: ${GAME_EVENTS_TOPIC}"
echo -e "\n"

# Function to check if Kafka is available
check_kafka_connection() {
  echo -e "${BLUE}Checking Kafka connection...${NC}"
  
  if ! command -v kafka-topics.sh &> /dev/null; then
    echo -e "${RED}Error: kafka-topics.sh command not found.${NC}"
    echo -e "${YELLOW}Make sure Kafka binaries are in your PATH or provide the full path to kafka-topics.sh${NC}"
    exit 1
  fi
  
  if ! kafka-topics.sh --bootstrap-server "$KAFKA_BROKERS" --list &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kafka brokers at $KAFKA_BROKERS${NC}"
    echo -e "${YELLOW}Please check that Kafka is running and the broker addresses are correct${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Successfully connected to Kafka brokers${NC}"
}

# Function to create a topic if it doesn't exist
create_topic() {
  local topic_name=$1
  local partitions=$2
  local replication_factor=$3
  local retention_ms=$4
  
  echo -e "${BLUE}Checking if topic '$topic_name' exists...${NC}"
  
  # Check if topic exists
  if kafka-topics.sh --bootstrap-server "$KAFKA_BROKERS" --describe --topic "$topic_name" &> /dev/null; then
    echo -e "${YELLOW}Topic '$topic_name' already exists. Checking configuration...${NC}"
    
    # Get current configuration
    local current_config=$(kafka-topics.sh --bootstrap-server "$KAFKA_BROKERS" --describe --topic "$topic_name")
    
    # Extract current partitions
    local current_partitions=$(echo "$current_config" | grep -o "PartitionCount: [0-9]*" | cut -d' ' -f2)
    
    # Extract current replication factor
    local current_replication=$(echo "$current_config" | grep -o "ReplicationFactor: [0-9]*" | cut -d' ' -f2)
    
    echo -e "Current configuration: Partitions=$current_partitions, ReplicationFactor=$current_replication"
    
    # Check if configuration needs to be updated
    if [ "$current_partitions" -lt "$partitions" ]; then
      echo -e "${YELLOW}Updating partitions from $current_partitions to $partitions${NC}"
      kafka-topics.sh --bootstrap-server "$KAFKA_BROKERS" --alter --topic "$topic_name" --partitions "$partitions"
    fi
    
    # Update retention.ms configuration
    echo -e "${BLUE}Setting retention.ms to $retention_ms for topic '$topic_name'${NC}"
    kafka-configs.sh --bootstrap-server "$KAFKA_BROKERS" --entity-type topics --entity-name "$topic_name" \
      --alter --add-config retention.ms="$retention_ms"
    
  else
    echo -e "${BLUE}Creating topic '$topic_name'...${NC}"
    kafka-topics.sh --bootstrap-server "$KAFKA_BROKERS" --create --topic "$topic_name" \
      --partitions "$partitions" --replication-factor "$replication_factor" \
      --config retention.ms="$retention_ms"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Successfully created topic '$topic_name'${NC}"
    else
      echo -e "${RED}Failed to create topic '$topic_name'${NC}"
      exit 1
    fi
  fi
}

# Main execution
main() {
  echo -e "${BLUE}Starting Kafka topic setup for gamification-engine...${NC}"
  
  # Check Kafka connection
  check_kafka_connection
  
  # Create topics
  create_topic "$HEALTH_EVENTS_TOPIC" "$PARTITIONS" "$REPLICATION_FACTOR" "$RETENTION_MS"
  create_topic "$CARE_EVENTS_TOPIC" "$PARTITIONS" "$REPLICATION_FACTOR" "$RETENTION_MS"
  create_topic "$PLAN_EVENTS_TOPIC" "$PARTITIONS" "$REPLICATION_FACTOR" "$RETENTION_MS"
  create_topic "$USER_EVENTS_TOPIC" "$PARTITIONS" "$REPLICATION_FACTOR" "$RETENTION_MS"
  create_topic "$GAME_EVENTS_TOPIC" "$PARTITIONS" "$REPLICATION_FACTOR" "$RETENTION_MS"
  
  echo -e "\n${GREEN}Kafka topic setup completed successfully!${NC}"
  echo -e "${BLUE}The following topics are now configured for the gamification-engine:${NC}"
  echo -e "- $HEALTH_EVENTS_TOPIC (Health journey events)"
  echo -e "- $CARE_EVENTS_TOPIC (Care journey events)"
  echo -e "- $PLAN_EVENTS_TOPIC (Plan journey events)"
  echo -e "- $USER_EVENTS_TOPIC (User events)"
  echo -e "- $GAME_EVENTS_TOPIC (Gamification events)"
  echo -e "\n${BLUE}Each topic is configured with:${NC}"
  echo -e "- $PARTITIONS partitions"
  echo -e "- Replication factor of $REPLICATION_FACTOR"
  echo -e "- Retention period of $(($RETENTION_MS / 86400000)) days"
}

# Execute main function
main