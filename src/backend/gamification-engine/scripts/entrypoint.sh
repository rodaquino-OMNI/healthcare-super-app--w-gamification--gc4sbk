#!/bin/bash

# entrypoint.sh
# Docker entrypoint script for the gamification-engine service
# This script sets up Kafka topics and then starts the application

set -e

# Color codes for output formatting
BLUE="\033[0;34m"
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}Starting gamification-engine service...${NC}"

# Check if we should skip Kafka setup (useful for development)
if [ "${SKIP_KAFKA_SETUP}" != "true" ]; then
  echo -e "${BLUE}Setting up Kafka topics...${NC}"
  
  # Run the Kafka setup script
  ./scripts/kafka-setup.sh
  
  # Check if Kafka setup was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}Kafka setup failed. Check the logs above for details.${NC}"
    echo -e "${RED}If you want to skip Kafka setup, set SKIP_KAFKA_SETUP=true${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Kafka setup completed successfully.${NC}"
else
  echo -e "${BLUE}Skipping Kafka setup as SKIP_KAFKA_SETUP=true${NC}"
fi

# Start the application
echo -e "${BLUE}Starting the application...${NC}"
exec node dist/main.js