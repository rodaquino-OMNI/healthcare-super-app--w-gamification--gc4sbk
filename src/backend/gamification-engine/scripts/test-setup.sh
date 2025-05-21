#!/bin/bash

# test-setup.sh
# Sets up the testing environment for the gamification-engine service
# This script configures a dedicated test database, test fixtures, and mocked external services
# It ensures tests can run in isolation without affecting development or production environments

set -e

# Color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
TEST_DB_NAME="gamification_test_$(date +%s)"
TEST_DB_URL=""
KAFKA_MOCK_PORT=9092
REDIS_MOCK_PORT=6379
MOCK_SERVICES_DIR="$ROOT_DIR/test/mocks"
FIXTURES_DIR="$ROOT_DIR/test/fixtures"

# Cleanup function to be called on script exit
cleanup() {
  echo -e "${YELLOW}Cleaning up test environment...${NC}"
  
  # Stop mock services
  if [ -f "$MOCK_SERVICES_DIR/kafka/kafka-mock.pid" ]; then
    echo -e "${BLUE}Stopping Kafka mock...${NC}"
    kill -9 $(cat "$MOCK_SERVICES_DIR/kafka/kafka-mock.pid") 2>/dev/null || true
    rm "$MOCK_SERVICES_DIR/kafka/kafka-mock.pid"
  fi
  
  if [ -f "$MOCK_SERVICES_DIR/redis/redis-mock.pid" ]; then
    echo -e "${BLUE}Stopping Redis mock...${NC}"
    kill -9 $(cat "$MOCK_SERVICES_DIR/redis/redis-mock.pid") 2>/dev/null || true
    rm "$MOCK_SERVICES_DIR/redis/redis-mock.pid"
  fi
  
  # Drop test database if it exists
  if [ ! -z "$TEST_DB_URL" ]; then
    echo -e "${BLUE}Dropping test database $TEST_DB_NAME...${NC}"
    # Extract connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
    
    PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $TEST_DB_NAME 2>/dev/null || true
  fi
  
  echo -e "${GREEN}Test environment cleanup completed.${NC}"
}

# Register cleanup function to be called on exit
trap cleanup EXIT

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable is not set.${NC}"
  exit 1
fi

# Create test database
echo -e "${BLUE}Creating test database $TEST_DB_NAME...${NC}"

# Extract connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create test database
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $TEST_DB_NAME || {
  echo -e "${RED}Failed to create test database.${NC}"
  exit 1
}

# Construct test database URL
TEST_DB_URL=$(echo $DATABASE_URL | sed "s/$DB_NAME/$TEST_DB_NAME/")
export DATABASE_URL=$TEST_DB_URL

echo -e "${GREEN}Test database created: $TEST_DB_NAME${NC}"
echo -e "${BLUE}Running Prisma migrations on test database...${NC}"

# Run Prisma migrations
npx prisma migrate deploy --schema="$ROOT_DIR/prisma/schema.prisma" || {
  echo -e "${RED}Failed to run Prisma migrations.${NC}"
  exit 1
}

echo -e "${GREEN}Prisma migrations completed.${NC}"

# Set up test fixtures
echo -e "${BLUE}Setting up test fixtures...${NC}"

# Create mock services directory if it doesn't exist
mkdir -p "$MOCK_SERVICES_DIR/kafka"
mkdir -p "$MOCK_SERVICES_DIR/redis"

# Start Kafka mock
echo -e "${BLUE}Starting Kafka mock on port $KAFKA_MOCK_PORT...${NC}"
# Check if the mock script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/mocks/kafka-mock.js" ]; then
  mkdir -p "$ROOT_DIR/test/mocks"
  cat > "$ROOT_DIR/test/mocks/kafka-mock.js" << 'EOF'
// Basic Kafka mock for testing
const http = require('http');

// Get port from command line arguments
const port = process.argv[2] || 9092;

// In-memory storage for topics and messages
const topics = {};

// Create HTTP server to mock Kafka REST API
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL to get path
  const url = new URL(req.url, `http://localhost:${port}`);
  const path = url.pathname;

  // Handle different endpoints
  if (path === '/topics' && req.method === 'GET') {
    // List topics
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.keys(topics)));
  } else if (path.startsWith('/topics/') && req.method === 'POST') {
    // Publish message to topic
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const topicName = path.split('/')[2];
        if (!topics[topicName]) {
          topics[topicName] = [];
        }
        const message = JSON.parse(body);
        topics[topicName].push(message);
        console.log(`Message published to topic ${topicName}:`, message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (error) {
        console.error('Error processing message:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (path.startsWith('/topics/') && req.method === 'GET') {
    // Get messages from topic
    const topicName = path.split('/')[2];
    if (!topics[topicName]) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Topic ${topicName} not found` }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(topics[topicName]));
  } else if (path === '/health' && req.method === 'GET') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(port, () => {
  console.log(`Kafka mock server running on port ${port}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Kafka mock server');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down Kafka mock server');
  server.close(() => {
    process.exit(0);
  });
});
EOF
  chmod +x "$ROOT_DIR/test/mocks/kafka-mock.js"
fi

node "$ROOT_DIR/test/mocks/kafka-mock.js" $KAFKA_MOCK_PORT > "$MOCK_SERVICES_DIR/kafka/kafka-mock.log" 2>&1 & 
echo $! > "$MOCK_SERVICES_DIR/kafka/kafka-mock.pid"

# Start Redis mock
echo -e "${BLUE}Starting Redis mock on port $REDIS_MOCK_PORT...${NC}"
# Check if the mock script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/mocks/redis-mock.js" ]; then
  mkdir -p "$ROOT_DIR/test/mocks"
  cat > "$ROOT_DIR/test/mocks/redis-mock.js" << 'EOF'
// Basic Redis mock for testing
const http = require('http');

// Get port from command line arguments
const port = process.argv[2] || 6379;

// In-memory storage for Redis data
const storage = {};

// Create HTTP server to mock Redis
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL to get path and query parameters
  const url = new URL(req.url, `http://localhost:${port}`);
  const path = url.pathname;
  const params = url.searchParams;

  // Handle different Redis commands
  if (path === '/set' && req.method === 'POST') {
    // SET command
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { key, value, expiry } = data;
        if (!key || value === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing key or value' }));
          return;
        }
        storage[key] = {
          value,
          expiry: expiry ? Date.now() + (expiry * 1000) : null
        };
        console.log(`SET ${key} = ${JSON.stringify(value)}${expiry ? ` (expires in ${expiry}s)` : ''}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK' }));
      } catch (error) {
        console.error('Error processing SET command:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (path === '/get' && req.method === 'GET') {
    // GET command
    const key = params.get('key');
    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing key parameter' }));
      return;
    }
    
    // Check if key exists and not expired
    if (storage[key] && (!storage[key].expiry || storage[key].expiry > Date.now())) {
      console.log(`GET ${key} = ${JSON.stringify(storage[key].value)}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ value: storage[key].value }));
    } else {
      console.log(`GET ${key} = nil (not found or expired)`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Key not found or expired' }));
    }
  } else if (path === '/del' && req.method === 'DELETE') {
    // DEL command
    const key = params.get('key');
    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing key parameter' }));
      return;
    }
    
    const existed = key in storage;
    if (existed) {
      delete storage[key];
      console.log(`DEL ${key} = 1 (deleted)`);
    } else {
      console.log(`DEL ${key} = 0 (not found)`);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ deleted: existed ? 1 : 0 }));
  } else if (path === '/health' && req.method === 'GET') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    // Not found or unsupported command
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found or unsupported command' }));
  }
});

// Start server
server.listen(port, () => {
  console.log(`Redis mock server running on port ${port}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Redis mock server');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down Redis mock server');
  server.close(() => {
    process.exit(0);
  });
});
EOF
  chmod +x "$ROOT_DIR/test/mocks/redis-mock.js"
fi

node "$ROOT_DIR/test/mocks/redis-mock.js" $REDIS_MOCK_PORT > "$MOCK_SERVICES_DIR/redis/redis-mock.log" 2>&1 &
echo $! > "$MOCK_SERVICES_DIR/redis/redis-mock.pid"

# Wait for mock services to start
sleep 2

# Check if mock services are running
if ! nc -z localhost $KAFKA_MOCK_PORT; then
  echo -e "${RED}Kafka mock failed to start.${NC}"
  exit 1
fi

if ! nc -z localhost $REDIS_MOCK_PORT; then
  echo -e "${RED}Redis mock failed to start.${NC}"
  exit 1
fi

echo -e "${GREEN}Mock services started successfully.${NC}"

# Set environment variables for tests
export KAFKA_BROKERS="localhost:$KAFKA_MOCK_PORT"
export KAFKA_CLIENT_ID="gamification-test-client"
export KAFKA_GROUP_ID="gamification-test-group"
export KAFKA_TOPIC_HEALTH_EVENTS="health-events-test"
export KAFKA_TOPIC_CARE_EVENTS="care-events-test"
export KAFKA_TOPIC_PLAN_EVENTS="plan-events-test"
export KAFKA_TOPIC_USER_EVENTS="user-events-test"
export KAFKA_TOPIC_GAMIFICATION_EVENTS="gamification-events-test"
export REDIS_HOST="localhost"
export REDIS_PORT="$REDIS_MOCK_PORT"
export NODE_ENV="test"

# Seed test data
echo -e "${BLUE}Seeding test data...${NC}"

# Run the seed script with test environment
TEST_ENV=true npx ts-node "$ROOT_DIR/prisma/seed.ts" || {
  echo -e "${RED}Failed to seed test data.${NC}"
  exit 1
}

echo -e "${GREEN}Test data seeded successfully.${NC}"

# Create test fixtures for achievements
echo -e "${BLUE}Creating test fixtures for achievements...${NC}"
# Check if the fixture script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/fixtures/create-achievement-fixtures.js" ]; then
  mkdir -p "$ROOT_DIR/test/fixtures"
  cat > "$ROOT_DIR/test/fixtures/create-achievement-fixtures.js" << 'EOF'
// Basic achievement fixtures for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAchievementFixtures() {
  try {
    // Create test achievements for each journey
    const healthAchievement = await prisma.achievement.upsert({
      where: { id: 'test-health-achievement' },
      update: {},
      create: {
        id: 'test-health-achievement',
        title: 'Test Health Achievement',
        description: 'Achievement for testing health journey events',
        journeyType: 'HEALTH',
        pointValue: 100,
        iconUrl: 'https://example.com/icons/health.png',
        conditions: JSON.stringify({
          type: 'HEALTH_METRIC',
          metric: 'STEPS',
          threshold: 1000
        })
      }
    });

    const careAchievement = await prisma.achievement.upsert({
      where: { id: 'test-care-achievement' },
      update: {},
      create: {
        id: 'test-care-achievement',
        title: 'Test Care Achievement',
        description: 'Achievement for testing care journey events',
        journeyType: 'CARE',
        pointValue: 150,
        iconUrl: 'https://example.com/icons/care.png',
        conditions: JSON.stringify({
          type: 'APPOINTMENT',
          action: 'COMPLETED'
        })
      }
    });

    const planAchievement = await prisma.achievement.upsert({
      where: { id: 'test-plan-achievement' },
      update: {},
      create: {
        id: 'test-plan-achievement',
        title: 'Test Plan Achievement',
        description: 'Achievement for testing plan journey events',
        journeyType: 'PLAN',
        pointValue: 200,
        iconUrl: 'https://example.com/icons/plan.png',
        conditions: JSON.stringify({
          type: 'BENEFIT',
          action: 'VIEWED'
        })
      }
    });

    console.log('Achievement fixtures created successfully');
  } catch (error) {
    console.error('Error creating achievement fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAchievementFixtures();
EOF
  chmod +x "$ROOT_DIR/test/fixtures/create-achievement-fixtures.js"
fi

node "$ROOT_DIR/test/fixtures/create-achievement-fixtures.js" || {
  echo -e "${YELLOW}Warning: Failed to create achievement fixtures.${NC}"
}

# Create test fixtures for quests
echo -e "${BLUE}Creating test fixtures for quests...${NC}"
# Check if the fixture script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/fixtures/create-quest-fixtures.js" ]; then
  mkdir -p "$ROOT_DIR/test/fixtures"
  cat > "$ROOT_DIR/test/fixtures/create-quest-fixtures.js" << 'EOF'
// Basic quest fixtures for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createQuestFixtures() {
  try {
    // Create test quests for each journey
    const healthQuest = await prisma.quest.upsert({
      where: { id: 'test-health-quest' },
      update: {},
      create: {
        id: 'test-health-quest',
        title: 'Test Health Quest',
        description: 'Quest for testing health journey progression',
        journeyType: 'HEALTH',
        pointValue: 500,
        iconUrl: 'https://example.com/icons/health-quest.png',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        requirements: JSON.stringify({
          type: 'HEALTH_METRIC',
          metric: 'STEPS',
          threshold: 10000,
          duration: 7 // days
        }),
        status: 'ACTIVE'
      }
    });

    const careQuest = await prisma.quest.upsert({
      where: { id: 'test-care-quest' },
      update: {},
      create: {
        id: 'test-care-quest',
        title: 'Test Care Quest',
        description: 'Quest for testing care journey progression',
        journeyType: 'CARE',
        pointValue: 750,
        iconUrl: 'https://example.com/icons/care-quest.png',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        requirements: JSON.stringify({
          type: 'APPOINTMENT',
          count: 2,
          status: 'COMPLETED'
        }),
        status: 'ACTIVE'
      }
    });

    const planQuest = await prisma.quest.upsert({
      where: { id: 'test-plan-quest' },
      update: {},
      create: {
        id: 'test-plan-quest',
        title: 'Test Plan Quest',
        description: 'Quest for testing plan journey progression',
        journeyType: 'PLAN',
        pointValue: 1000,
        iconUrl: 'https://example.com/icons/plan-quest.png',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        requirements: JSON.stringify({
          type: 'BENEFIT',
          count: 3,
          action: 'VIEWED'
        }),
        status: 'ACTIVE'
      }
    });

    console.log('Quest fixtures created successfully');
  } catch (error) {
    console.error('Error creating quest fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createQuestFixtures();
EOF
  chmod +x "$ROOT_DIR/test/fixtures/create-quest-fixtures.js"
fi

node "$ROOT_DIR/test/fixtures/create-quest-fixtures.js" || {
  echo -e "${YELLOW}Warning: Failed to create quest fixtures.${NC}"
}

# Create test fixtures for rewards
echo -e "${BLUE}Creating test fixtures for rewards...${NC}"
# Check if the fixture script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/fixtures/create-reward-fixtures.js" ]; then
  mkdir -p "$ROOT_DIR/test/fixtures"
  cat > "$ROOT_DIR/test/fixtures/create-reward-fixtures.js" << 'EOF'
// Basic reward fixtures for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRewardFixtures() {
  try {
    // Create test rewards for each journey
    const healthReward = await prisma.reward.upsert({
      where: { id: 'test-health-reward' },
      update: {},
      create: {
        id: 'test-health-reward',
        title: 'Test Health Reward',
        description: 'Reward for completing health achievements',
        journeyType: 'HEALTH',
        pointCost: 1000,
        iconUrl: 'https://example.com/icons/health-reward.png',
        quantity: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        rewardType: 'DIGITAL',
        rewardData: JSON.stringify({
          type: 'BADGE',
          badgeId: 'health-master',
          imageUrl: 'https://example.com/badges/health-master.png'
        })
      }
    });

    const careReward = await prisma.reward.upsert({
      where: { id: 'test-care-reward' },
      update: {},
      create: {
        id: 'test-care-reward',
        title: 'Test Care Reward',
        description: 'Reward for completing care achievements',
        journeyType: 'CARE',
        pointCost: 1500,
        iconUrl: 'https://example.com/icons/care-reward.png',
        quantity: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        rewardType: 'DISCOUNT',
        rewardData: JSON.stringify({
          type: 'APPOINTMENT_DISCOUNT',
          percentOff: 15,
          maxDiscount: 50,
          code: 'CARE15'
        })
      }
    });

    const planReward = await prisma.reward.upsert({
      where: { id: 'test-plan-reward' },
      update: {},
      create: {
        id: 'test-plan-reward',
        title: 'Test Plan Reward',
        description: 'Reward for completing plan achievements',
        journeyType: 'PLAN',
        pointCost: 2000,
        iconUrl: 'https://example.com/icons/plan-reward.png',
        quantity: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        rewardType: 'PHYSICAL',
        rewardData: JSON.stringify({
          type: 'GIFT_CARD',
          value: 25,
          provider: 'Amazon',
          deliveryMethod: 'EMAIL'
        })
      }
    });

    console.log('Reward fixtures created successfully');
  } catch (error) {
    console.error('Error creating reward fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createRewardFixtures();
EOF
  chmod +x "$ROOT_DIR/test/fixtures/create-reward-fixtures.js"
fi

node "$ROOT_DIR/test/fixtures/create-reward-fixtures.js" || {
  echo -e "${YELLOW}Warning: Failed to create reward fixtures.${NC}"
}

# Create test fixtures for events
echo -e "${BLUE}Creating test fixtures for events...${NC}"
# Check if the fixture script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/fixtures/create-event-fixtures.js" ]; then
  mkdir -p "$ROOT_DIR/test/fixtures"
  cat > "$ROOT_DIR/test/fixtures/create-event-fixtures.js" << 'EOF'
// Basic event fixtures for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEventFixtures() {
  try {
    // Create test events for each journey
    const healthEvent = await prisma.event.upsert({
      where: { id: 'test-health-event' },
      update: {},
      create: {
        id: 'test-health-event',
        userId: 'test-user',
        eventType: 'HEALTH_METRIC',
        journeyType: 'HEALTH',
        eventData: JSON.stringify({
          metricType: 'STEPS',
          value: 10000,
          date: new Date().toISOString(),
          source: 'TEST'
        }),
        processed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const careEvent = await prisma.event.upsert({
      where: { id: 'test-care-event' },
      update: {},
      create: {
        id: 'test-care-event',
        userId: 'test-user',
        eventType: 'APPOINTMENT',
        journeyType: 'CARE',
        eventData: JSON.stringify({
          appointmentId: 'test-appointment',
          status: 'COMPLETED',
          specialtyId: 'test-specialty',
          providerId: 'test-provider',
          date: new Date().toISOString()
        }),
        processed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const planEvent = await prisma.event.upsert({
      where: { id: 'test-plan-event' },
      update: {},
      create: {
        id: 'test-plan-event',
        userId: 'test-user',
        eventType: 'BENEFIT',
        journeyType: 'PLAN',
        eventData: JSON.stringify({
          benefitId: 'test-benefit',
          action: 'VIEWED',
          planId: 'test-plan',
          date: new Date().toISOString()
        }),
        processed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Event fixtures created successfully');
  } catch (error) {
    console.error('Error creating event fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createEventFixtures();
EOF
  chmod +x "$ROOT_DIR/test/fixtures/create-event-fixtures.js"
fi

node "$ROOT_DIR/test/fixtures/create-event-fixtures.js" || {
  echo -e "${YELLOW}Warning: Failed to create event fixtures.${NC}"
}

# Create test fixtures for rules
echo -e "${BLUE}Creating test fixtures for rules...${NC}"
# Check if the fixture script exists, otherwise create a basic version
if [ ! -f "$ROOT_DIR/test/fixtures/create-rule-fixtures.js" ]; then
  mkdir -p "$ROOT_DIR/test/fixtures"
  cat > "$ROOT_DIR/test/fixtures/create-rule-fixtures.js" << 'EOF'
// Basic rule fixtures for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRuleFixtures() {
  try {
    // Create test rules for each journey
    const healthRule = await prisma.rule.upsert({
      where: { id: 'test-health-rule' },
      update: {},
      create: {
        id: 'test-health-rule',
        name: 'Test Health Rule',
        description: 'Rule for processing health events',
        journeyType: 'HEALTH',
        eventType: 'HEALTH_METRIC',
        conditions: JSON.stringify({
          metricType: 'STEPS',
          operator: 'gte',
          threshold: 10000
        }),
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 100
          },
          {
            type: 'TRIGGER_ACHIEVEMENT',
            achievementId: 'test-health-achievement'
          }
        ]),
        priority: 1,
        isActive: true
      }
    });

    const careRule = await prisma.rule.upsert({
      where: { id: 'test-care-rule' },
      update: {},
      create: {
        id: 'test-care-rule',
        name: 'Test Care Rule',
        description: 'Rule for processing care events',
        journeyType: 'CARE',
        eventType: 'APPOINTMENT',
        conditions: JSON.stringify({
          status: 'COMPLETED'
        }),
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 150
          },
          {
            type: 'TRIGGER_ACHIEVEMENT',
            achievementId: 'test-care-achievement'
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            questId: 'test-care-quest',
            increment: 1
          }
        ]),
        priority: 1,
        isActive: true
      }
    });

    const planRule = await prisma.rule.upsert({
      where: { id: 'test-plan-rule' },
      update: {},
      create: {
        id: 'test-plan-rule',
        name: 'Test Plan Rule',
        description: 'Rule for processing plan events',
        journeyType: 'PLAN',
        eventType: 'BENEFIT',
        conditions: JSON.stringify({
          action: 'VIEWED'
        }),
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 50
          },
          {
            type: 'UPDATE_QUEST_PROGRESS',
            questId: 'test-plan-quest',
            increment: 1
          }
        ]),
        priority: 1,
        isActive: true
      }
    });

    // Create a cross-journey rule
    const crossJourneyRule = await prisma.rule.upsert({
      where: { id: 'test-cross-journey-rule' },
      update: {},
      create: {
        id: 'test-cross-journey-rule',
        name: 'Test Cross-Journey Rule',
        description: 'Rule that applies to events from any journey',
        journeyType: 'ALL',
        eventType: 'ANY',
        conditions: JSON.stringify({
          userId: 'test-user'
        }),
        actions: JSON.stringify([
          {
            type: 'AWARD_XP',
            amount: 10
          }
        ]),
        priority: 10, // Lower priority, runs after journey-specific rules
        isActive: true
      }
    });

    console.log('Rule fixtures created successfully');
  } catch (error) {
    console.error('Error creating rule fixtures:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createRuleFixtures();
EOF
  chmod +x "$ROOT_DIR/test/fixtures/create-rule-fixtures.js"
fi

node "$ROOT_DIR/test/fixtures/create-rule-fixtures.js" || {
  echo -e "${YELLOW}Warning: Failed to create rule fixtures.${NC}"
}

echo -e "${GREEN}Test environment setup completed successfully.${NC}"
echo -e "${YELLOW}Test database: $TEST_DB_NAME${NC}"
echo -e "${YELLOW}Kafka mock running on port: $KAFKA_MOCK_PORT${NC}"
echo -e "${YELLOW}Redis mock running on port: $REDIS_MOCK_PORT${NC}"
echo -e "${YELLOW}To clean up resources, press Ctrl+C or let the tests complete.${NC}"

# Keep script running if TEST_KEEP_ALIVE is set
if [ "$TEST_KEEP_ALIVE" = "true" ]; then
  echo -e "${BLUE}Keeping test environment alive. Press Ctrl+C to exit and clean up.${NC}"
  # Wait indefinitely
  tail -f /dev/null
fi