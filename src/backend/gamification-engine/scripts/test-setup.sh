#!/bin/bash
# Make this script executable with: chmod +x scripts/test-setup.sh

# =========================================================
# Gamification Engine Test Environment Setup Script
# =========================================================
#
# This script prepares the testing environment for the gamification-engine service.
# It configures a dedicated test database, sets up test fixtures, and initializes
# mocked external services for integration testing.
#
# Features:
# - Creates an isolated test database with temporary tables
# - Sets up test fixtures (achievements, quests, rewards, events)
# - Initializes mocked external services (Kafka, Redis)
# - Provides teardown functionality to clean up after tests
# - Supports both local development and CI pipeline execution
#
# Usage: 
#   Setup:   ./test-setup.sh setup
#   Teardown: ./test-setup.sh teardown

# Exit on error
set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Test environment variables
TEST_DB_NAME="gamification_test"
TEST_DB_USER="postgres"
TEST_DB_PASSWORD="postgres"
TEST_DB_HOST="localhost"
TEST_DB_PORT="5432"
TEST_REDIS_HOST="localhost"
TEST_REDIS_PORT="6379"
TEST_KAFKA_BROKER="localhost:9092"

# Log functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required commands
check_requirements() {
  log_info "Checking requirements..."
  
  local missing_requirements=false
  
  if ! command_exists docker; then
    log_error "Docker is not installed. Please install Docker."
    missing_requirements=true
  fi
  
  if ! command_exists docker-compose; then
    log_error "Docker Compose is not installed. Please install Docker Compose."
    missing_requirements=true
  fi
  
  if ! command_exists node; then
    log_error "Node.js is not installed. Please install Node.js."
    missing_requirements=true
  fi
  
  if ! command_exists npm; then
    log_error "npm is not installed. Please install npm."
    missing_requirements=true
  fi
  
  if ! command_exists npx; then
    log_error "npx is not installed. Please install npx."
    missing_requirements=true
  fi
  
  if [ "$missing_requirements" = true ]; then
    log_error "Please install the missing requirements and try again."
    exit 1
  fi
  
  log_success "All requirements are met."
}

# Create test environment file
create_test_env_file() {
  log_info "Creating test environment file..."
  
  # Create .env.test file with test-specific configuration
  cat > "$ROOT_DIR/.env.test" << EOF
# Test Environment Configuration
NODE_ENV=test

# Database
DATABASE_URL=postgresql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}?schema=public
DATABASE_TYPE=postgres
DATABASE_HOST=${TEST_DB_HOST}
DATABASE_PORT=${TEST_DB_PORT}
DATABASE_USERNAME=${TEST_DB_USER}
DATABASE_PASSWORD=${TEST_DB_PASSWORD}
DATABASE_NAME=${TEST_DB_NAME}
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=error
DATABASE_MAX_CONNECTIONS=5

# Redis
REDIS_URL=redis://${TEST_REDIS_HOST}:${TEST_REDIS_PORT}
REDIS_HOST=${TEST_REDIS_HOST}
REDIS_PORT=${TEST_REDIS_PORT}
REDIS_PASSWORD=
REDIS_DB=1

# Kafka
KAFKA_BROKER=${TEST_KAFKA_BROKER}
KAFKA_CLIENT_ID=gamification-engine-test
KAFKA_GROUP_ID=gamification-engine-test-group

# Service Configuration
PORT=3005
API_PREFIX=/api
LOG_LEVEL=error

# JWT (for testing)
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h

# Feature Flags
FEATURE_LEADERBOARDS=true
FEATURE_QUESTS=true
FEATURE_REWARDS=true
FEATURE_ACHIEVEMENTS=true

# Test-specific settings
TEST_MODE=true
SKIP_AUTH=true
MOCK_EXTERNAL_SERVICES=true
EOF
  
  log_success "Test environment file created at $ROOT_DIR/.env.test"
}

# Start Docker services for testing
start_test_docker_services() {
  log_info "Starting Docker services for testing..."
  
  # Create docker-compose file for testing
  cat > "$ROOT_DIR/docker-compose.test.yml" << EOF
version: '3.8'

services:
  postgres-test:
    image: postgres:14-alpine
    container_name: gamification-postgres-test
    ports:
      - "${TEST_DB_PORT}:5432"
    environment:
      POSTGRES_USER: ${TEST_DB_USER}
      POSTGRES_PASSWORD: ${TEST_DB_PASSWORD}
      POSTGRES_DB: ${TEST_DB_NAME}
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    container_name: gamification-redis-test
    ports:
      - "${TEST_REDIS_PORT}:6379"
    volumes:
      - redis_test_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  zookeeper-test:
    image: confluentinc/cp-zookeeper:7.3.0
    container_name: gamification-zookeeper-test
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    healthcheck:
      test: ["CMD-SHELL", "echo 'ruok' | nc localhost 2181"]
      interval: 5s
      timeout: 5s
      retries: 5

  kafka-test:
    image: confluentinc/cp-kafka:7.3.0
    container_name: gamification-kafka-test
    depends_on:
      - zookeeper-test
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper-test:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka-test:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    healthcheck:
      test: ["CMD-SHELL", "kafka-topics --bootstrap-server localhost:9092 --list"]
      interval: 5s
      timeout: 5s
      retries: 5

  kafka-setup-test:
    image: confluentinc/cp-kafka:7.3.0
    container_name: gamification-kafka-setup-test
    depends_on:
      - kafka-test
    command: |
      bash -c '
        echo "Waiting for Kafka to be ready..."
        cub kafka-ready -b kafka-test:29092 1 30
        echo "Creating test topics..."
        kafka-topics --bootstrap-server kafka-test:29092 --create --if-not-exists --topic health.events.test --partitions 1 --replication-factor 1
        kafka-topics --bootstrap-server kafka-test:29092 --create --if-not-exists --topic care.events.test --partitions 1 --replication-factor 1
        kafka-topics --bootstrap-server kafka-test:29092 --create --if-not-exists --topic plan.events.test --partitions 1 --replication-factor 1
        kafka-topics --bootstrap-server kafka-test:29092 --create --if-not-exists --topic gamification.events.test --partitions 1 --replication-factor 1
        kafka-topics --bootstrap-server kafka-test:29092 --create --if-not-exists --topic user.events.test --partitions 1 --replication-factor 1
        echo "Test topics created."
      '

volumes:
  postgres_test_data:
  redis_test_data:
EOF
  
  # Start the services
  docker-compose -f "$ROOT_DIR/docker-compose.test.yml" up -d
  
  log_success "Test Docker services started."
}

# Health check for test services
health_check_test_services() {
  log_info "Performing health checks for test services..."
  
  # Check PostgreSQL
  check_postgres_test() {
    log_info "Checking PostgreSQL test connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it gamification-postgres-test pg_isready -h localhost -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL test is ready."
        return 0
      else
        log_warning "PostgreSQL test is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "PostgreSQL test health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Check Kafka
  check_kafka_test() {
    log_info "Checking Kafka test connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it gamification-kafka-test kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
        log_success "Kafka test is ready."
        return 0
      else
        log_warning "Kafka test is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "Kafka test health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Check Redis
  check_redis_test() {
    log_info "Checking Redis test connection..."
    local max_attempts=10
    local attempt=1
    local delay=3
    
    while [ $attempt -le $max_attempts ]; do
      if docker exec -it gamification-redis-test redis-cli ping > /dev/null 2>&1; then
        log_success "Redis test is ready."
        return 0
      else
        log_warning "Redis test is not ready (attempt $attempt of $max_attempts)."
        
        if [ $attempt -lt $max_attempts ]; then
          local backoff=$((delay * 2 ** (attempt - 1)))
          log_info "Retrying in $backoff seconds..."
          sleep $backoff
        else
          log_error "Redis test health check failed after $max_attempts attempts."
          return 1
        fi
      fi
      
      attempt=$((attempt + 1))
    done
  }
  
  # Run all health checks
  check_postgres_test || exit 1
  check_kafka_test || exit 1
  check_redis_test || exit 1
  
  log_success "All test services are healthy."
}

# Setup test database
setup_test_database() {
  log_info "Setting up test database..."
  
  # Generate Prisma client with test environment
  NODE_ENV=test npx prisma generate --schema="$ROOT_DIR/prisma/schema.prisma"
  
  # Run migrations on test database
  NODE_ENV=test npx prisma migrate deploy --schema="$ROOT_DIR/prisma/schema.prisma"
  
  log_success "Test database setup completed."
}

# Create test fixtures
create_test_fixtures() {
  log_info "Creating test fixtures..."
  
  # Create a test seed script
  cat > "$ROOT_DIR/prisma/seed-test.ts" << EOF
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test database...');

  // Create test achievements
  const healthAchievement = await prisma.achievement.upsert({
    where: { id: 'test-health-achievement-id' },
    update: {},
    create: {
      id: 'test-health-achievement-id',
      title: 'Test Health Achievement',
      description: 'A test achievement for health journey',
      journey: 'health',
      xpReward: 100,
      icon: 'test-health-icon',
    },
  });

  const careAchievement = await prisma.achievement.upsert({
    where: { id: 'test-care-achievement-id' },
    update: {},
    create: {
      id: 'test-care-achievement-id',
      title: 'Test Care Achievement',
      description: 'A test achievement for care journey',
      journey: 'care',
      xpReward: 150,
      icon: 'test-care-icon',
    },
  });

  const planAchievement = await prisma.achievement.upsert({
    where: { id: 'test-plan-achievement-id' },
    update: {},
    create: {
      id: 'test-plan-achievement-id',
      title: 'Test Plan Achievement',
      description: 'A test achievement for plan journey',
      journey: 'plan',
      xpReward: 200,
      icon: 'test-plan-icon',
    },
  });

  // Create test quests
  const healthQuest = await prisma.quest.upsert({
    where: { id: 'test-health-quest-id' },
    update: {},
    create: {
      id: 'test-health-quest-id',
      title: 'Test Health Quest',
      description: 'A test quest for health journey',
      journey: 'health',
      xpReward: 300,
      icon: 'test-health-quest-icon',
    },
  });

  const careQuest = await prisma.quest.upsert({
    where: { id: 'test-care-quest-id' },
    update: {},
    create: {
      id: 'test-care-quest-id',
      title: 'Test Care Quest',
      description: 'A test quest for care journey',
      journey: 'care',
      xpReward: 350,
      icon: 'test-care-quest-icon',
    },
  });

  const planQuest = await prisma.quest.upsert({
    where: { id: 'test-plan-quest-id' },
    update: {},
    create: {
      id: 'test-plan-quest-id',
      title: 'Test Plan Quest',
      description: 'A test quest for plan journey',
      journey: 'plan',
      xpReward: 400,
      icon: 'test-plan-quest-icon',
    },
  });

  // Create test rewards
  const healthReward = await prisma.reward.upsert({
    where: { id: 'test-health-reward-id' },
    update: {},
    create: {
      id: 'test-health-reward-id',
      title: 'Test Health Reward',
      description: 'A test reward for health journey',
      journey: 'health',
      xpReward: 500,
      icon: 'test-health-reward-icon',
    },
  });

  const careReward = await prisma.reward.upsert({
    where: { id: 'test-care-reward-id' },
    update: {},
    create: {
      id: 'test-care-reward-id',
      title: 'Test Care Reward',
      description: 'A test reward for care journey',
      journey: 'care',
      xpReward: 550,
      icon: 'test-care-reward-icon',
    },
  });

  const planReward = await prisma.reward.upsert({
    where: { id: 'test-plan-reward-id' },
    update: {},
    create: {
      id: 'test-plan-reward-id',
      title: 'Test Plan Reward',
      description: 'A test reward for plan journey',
      journey: 'plan',
      xpReward: 600,
      icon: 'test-plan-reward-icon',
    },
  });

  // Create test rules
  const healthRule = await prisma.rule.upsert({
    where: { id: 'test-health-rule-id' },
    update: {},
    create: {
      id: 'test-health-rule-id',
      eventType: 'STEPS_RECORDED',
      journey: 'health',
      condition: 'event.data.steps > 1000',
      actions: JSON.stringify([
        { type: 'AWARD_XP', amount: 50 },
        { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'test-health-achievement-id' },
      ]),
      enabled: true,
    },
  });

  const careRule = await prisma.rule.upsert({
    where: { id: 'test-care-rule-id' },
    update: {},
    create: {
      id: 'test-care-rule-id',
      eventType: 'APPOINTMENT_BOOKED',
      journey: 'care',
      condition: 'true',
      actions: JSON.stringify([
        { type: 'AWARD_XP', amount: 75 },
        { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'test-care-achievement-id' },
      ]),
      enabled: true,
    },
  });

  const planRule = await prisma.rule.upsert({
    where: { id: 'test-plan-rule-id' },
    update: {},
    create: {
      id: 'test-plan-rule-id',
      eventType: 'CLAIM_SUBMITTED',
      journey: 'plan',
      condition: 'event.data.amount > 100',
      actions: JSON.stringify([
        { type: 'AWARD_XP', amount: 100 },
        { type: 'UNLOCK_ACHIEVEMENT', achievementId: 'test-plan-achievement-id' },
      ]),
      enabled: true,
    },
  });

  // Create test user profiles
  const testUser1 = await prisma.gameProfile.upsert({
    where: { userId: 'test-user-1' },
    update: {},
    create: {
      userId: 'test-user-1',
      level: 1,
      xp: 0,
    },
  });

  const testUser2 = await prisma.gameProfile.upsert({
    where: { userId: 'test-user-2' },
    update: {},
    create: {
      userId: 'test-user-2',
      level: 2,
      xp: 1000,
    },
  });

  const testUser3 = await prisma.gameProfile.upsert({
    where: { userId: 'test-user-3' },
    update: {},
    create: {
      userId: 'test-user-3',
      level: 3,
      xp: 2500,
    },
  });

  console.log('Test database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding test database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF
  
  # Run the test seed script
  NODE_ENV=test npx ts-node "$ROOT_DIR/prisma/seed-test.ts"
  
  log_success "Test fixtures created."
}

# Create test mocks
create_test_mocks() {
  log_info "Creating test mocks..."
  
  # Create directory for test mocks if it doesn't exist
  mkdir -p "$ROOT_DIR/test/mocks"
  
  # Create mock for KafkaService
  cat > "$ROOT_DIR/test/mocks/kafka.service.mock.ts" << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockKafkaService {
  private messages: Record<string, any[]> = {};

  async publish(topic: string, message: any): Promise<void> {
    if (!this.messages[topic]) {
      this.messages[topic] = [];
    }
    this.messages[topic].push(message);
    console.log(`[MockKafkaService] Published to topic: ${topic}`, message);
    return Promise.resolve();
  }

  async consume(topic: string, groupId: string, callback: (message: any) => Promise<void>): Promise<void> {
    console.log(`[MockKafkaService] Subscribed to topic: ${topic} with groupId: ${groupId}`);
    return Promise.resolve();
  }

  getMessages(topic: string): any[] {
    return this.messages[topic] || [];
  }

  clearMessages(): void {
    this.messages = {};
  }
}
EOF
  
  # Create mock for RedisService
  cat > "$ROOT_DIR/test/mocks/redis.service.mock.ts" << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockRedisService {
  private cache: Record<string, string> = {};

  async get(key: string): Promise<string | null> {
    console.log(`[MockRedisService] Getting key: ${key}`);
    return Promise.resolve(this.cache[key] || null);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    console.log(`[MockRedisService] Setting key: ${key} with TTL: ${ttl || 'none'}`);
    this.cache[key] = value;
    return Promise.resolve();
  }

  async del(key: string): Promise<void> {
    console.log(`[MockRedisService] Deleting key: ${key}`);
    delete this.cache[key];
    return Promise.resolve();
  }

  async flushAll(): Promise<void> {
    console.log(`[MockRedisService] Flushing all keys`);
    this.cache = {};
    return Promise.resolve();
  }

  getJourneyTTL(journey: string): number {
    return 300; // 5 minutes default TTL for tests
  }
}
EOF
  
  # Create test utilities
  cat > "$ROOT_DIR/test/utils/test-utils.ts" << EOF
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a test JWT token for authentication in tests
 */
export function generateTestToken(userId: string = 'test-user-1', roles: string[] = ['user']): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret-key',
  });
  
  return jwtService.sign({
    sub: userId,
    roles,
  });
}

/**
 * Generate a test event for event processing tests
 */
export function generateTestEvent(type: string, userId: string = 'test-user-1', journey: string = 'health', data: any = {}): any {
  return {
    id: uuidv4(),
    type,
    userId,
    journey,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Clear all test data from the database
 */
export async function clearTestData(prisma: any): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.userAchievement.deleteMany({});
  await prisma.userQuest.deleteMany({});
  await prisma.userReward.deleteMany({});
  await prisma.gameProfile.deleteMany({});
  await prisma.achievement.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await prisma.quest.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await prisma.reward.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await prisma.rule.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await prisma.event.deleteMany({ where: { id: { startsWith: 'test-' } } });
}
EOF
  
  log_success "Test mocks created."
}

# Create Jest config for e2e tests
create_jest_config() {
  log_info "Creating Jest config for e2e tests..."
  
  cat > "$ROOT_DIR/test/jest-e2e.json" << EOF
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "setupFiles": ["<rootDir>/test/setup.ts"],
  "moduleNameMapper": {
    "^@app/(.*)$": "<rootDir>/../$1/src",
    "^src/(.*)$": "<rootDir>/../src/$1"
  }
}
EOF
  
  # Create Jest setup file
  cat > "$ROOT_DIR/test/setup.ts" << EOF
import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
global.beforeAll = async () => {
  console.log('Starting global test setup...');
  // Add any global setup here
};

// Global test teardown
global.afterAll = async () => {
  console.log('Running global test teardown...');
  // Add any global teardown here
};
EOF
  
  log_success "Jest config created."
}

# Setup test environment
setup_test_environment() {
  log_info "Setting up test environment..."
  
  check_requirements
  create_test_env_file
  start_test_docker_services
  health_check_test_services
  setup_test_database
  create_test_fixtures
  create_test_mocks
  create_jest_config
  
  log_success "Test environment setup completed."
  log_info "You can now run tests with: npm run test:e2e"
}

# Teardown test environment
teardown_test_environment() {
  log_info "Tearing down test environment..."
  
  # Stop and remove test Docker services
  if [ -f "$ROOT_DIR/docker-compose.test.yml" ]; then
    docker-compose -f "$ROOT_DIR/docker-compose.test.yml" down -v
    rm "$ROOT_DIR/docker-compose.test.yml"
    log_success "Test Docker services stopped and removed."
  else
    log_warning "docker-compose.test.yml not found. Skipping Docker services teardown."
  fi
  
  # Remove test environment file
  if [ -f "$ROOT_DIR/.env.test" ]; then
    rm "$ROOT_DIR/.env.test"
    log_success "Test environment file removed."
  else
    log_warning ".env.test not found. Skipping removal."
  fi
  
  # Remove test seed script
  if [ -f "$ROOT_DIR/prisma/seed-test.ts" ]; then
    rm "$ROOT_DIR/prisma/seed-test.ts"
    log_success "Test seed script removed."
  else
    log_warning "seed-test.ts not found. Skipping removal."
  fi
  
  log_success "Test environment teardown completed."
}

# Main execution
main() {
  # Check command argument
  if [ "$1" = "setup" ]; then
    setup_test_environment
  elif [ "$1" = "teardown" ]; then
    teardown_test_environment
  else
    log_error "Invalid command. Usage: ./test-setup.sh [setup|teardown]"
    exit 1
  fi
}

# Run the main function with the first argument
main "$1"