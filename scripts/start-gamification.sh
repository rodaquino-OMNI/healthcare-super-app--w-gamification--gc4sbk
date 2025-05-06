#!/bin/bash

# Set up strict error handling
set -e
set -o pipefail

# Print execution steps
set -x

# Determine script and repository directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/src/backend"
GAMIFICATION_DIR="$BACKEND_DIR/gamification-engine"
PRISMA_DIR="$GAMIFICATION_DIR/prisma"

echo "Starting gamification engine setup..."
echo "Repository root: $REPO_ROOT"
echo "Backend directory: $BACKEND_DIR"
echo "Gamification directory: $GAMIFICATION_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start infrastructure services using Docker Compose
echo "Starting infrastructure services (PostgreSQL, Redis, Kafka, Zookeeper)..."
cd "$GAMIFICATION_DIR"
docker-compose -f docker-compose.local.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRIES=0
until docker exec $(docker ps -q -f name=postgres) pg_isready -U postgres || [ $RETRIES -eq $MAX_RETRIES ]; do
  echo "Waiting for PostgreSQL to be ready... ($((++RETRIES))/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
  echo "Error: PostgreSQL did not become ready in time."
  exit 1
fi

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
RETRIES=0
until docker exec $(docker ps -q -f name=kafka) kafka-topics --list --bootstrap-server localhost:9092 || [ $RETRIES -eq $MAX_RETRIES ]; do
  echo "Waiting for Kafka to be ready... ($((++RETRIES))/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
  echo "Error: Kafka did not become ready in time."
  exit 1
fi

# Create Prisma directory if it doesn't exist
if [ ! -d "$PRISMA_DIR" ]; then
  echo "Creating Prisma directory..."
  mkdir -p "$PRISMA_DIR"
fi

# Create or update schema.prisma file with enhanced PrismaService configuration
if [ ! -f "$PRISMA_DIR/schema.prisma" ]; then
  echo "Creating Prisma schema file..."
  cat > "$PRISMA_DIR/schema.prisma" << 'EOF'
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["extendedWhereUnique", "fullTextSearch", "metrics"]
  engineType      = "binary"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Enhanced connection pooling configuration
  directUrl = env("DATABASE_DIRECT_URL")
  // Connection pool settings
  poolTimeout = 30
  maxConnections = 20
  minConnections = 5
}

// Game Profile Model
model GameProfile {
  id             String           @id @default(uuid())
  userId         String           @unique
  username       String?
  xp             Int              @default(0)
  level          Int              @default(1)
  achievements   UserAchievement[]
  quests         UserQuest[]
  rewards        UserReward[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  journey        String?          // Health, Care, or Plan journey context
  journeyContext Json?            // Journey-specific contextual data
  // Indexes for optimized queries
  @@index([userId])
  @@index([level])
  @@index([journey])
}

// Achievement Model
model Achievement {
  id             String           @id @default(uuid())
  name           String
  description    String
  pointValue     Int
  imageUrl       String?
  journey        String           // Health, Care, or Plan journey
  category       String?
  userAchievements UserAchievement[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  // Versioning support for event schema evolution
  version        Int              @default(1)
  // Indexes for optimized queries
  @@index([journey])
  @@index([category])
}

// User Achievement Model
model UserAchievement {
  id             String      @id @default(uuid())
  userId         String
  achievementId  String
  unlockedAt     DateTime    @default(now())
  profile        GameProfile @relation(fields: [userId], references: [userId])
  achievement    Achievement @relation(fields: [achievementId], references: [id])
  // Indexes for optimized queries
  @@index([userId])
  @@index([achievementId])
  @@unique([userId, achievementId])
}

// Quest Model
model Quest {
  id             String      @id @default(uuid())
  name           String
  description    String
  pointValue     Int
  imageUrl       String?
  journey        String      // Health, Care, or Plan journey
  requirements   Json        // JSON object with quest requirements
  userQuests     UserQuest[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  // Versioning support for event schema evolution
  version        Int         @default(1)
  // Indexes for optimized queries
  @@index([journey])
}

// User Quest Model
model UserQuest {
  id             String      @id @default(uuid())
  userId         String
  questId        String
  progress       Json        // JSON object with quest progress
  startedAt      DateTime    @default(now())
  completedAt    DateTime?
  profile        GameProfile @relation(fields: [userId], references: [userId])
  quest          Quest       @relation(fields: [questId], references: [id])
  // Indexes for optimized queries
  @@index([userId])
  @@index([questId])
  @@unique([userId, questId])
}

// Reward Model
model Reward {
  id             String      @id @default(uuid())
  name           String
  description    String
  cost           Int
  imageUrl       String?
  journey        String      // Health, Care, or Plan journey
  userRewards    UserReward[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  // Versioning support for event schema evolution
  version        Int         @default(1)
  // Indexes for optimized queries
  @@index([journey])
}

// User Reward Model
model UserReward {
  id             String      @id @default(uuid())
  userId         String
  rewardId       String
  redeemedAt     DateTime    @default(now())
  profile        GameProfile @relation(fields: [userId], references: [userId])
  reward         Reward      @relation(fields: [rewardId], references: [id])
  // Indexes for optimized queries
  @@index([userId])
  @@index([rewardId])
  @@unique([userId, rewardId])
}

// Rule Model for event processing
model Rule {
  id             String      @id @default(uuid())
  name           String
  description    String
  eventType      String      // Type of event this rule applies to
  condition      String      // JavaScript condition as string
  action         String      // Action to take when condition is met
  pointValue     Int         @default(0)
  achievementId  String?     // Optional achievement to unlock
  journey        String      // Health, Care, or Plan journey
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  // Versioning support for event schema evolution
  version        Int         @default(1)
  // Indexes for optimized queries
  @@index([eventType])
  @@index([journey])
  @@index([isActive])
}

// Event Model for tracking processed events
model Event {
  id             String      @id @default(uuid())
  type           String
  userId         String
  data           Json
  journey        String      // Health, Care, or Plan journey
  processedAt    DateTime    @default(now())
  // Versioning support for event schema evolution
  version        Int         @default(1)
  // Indexes for optimized queries
  @@index([type])
  @@index([userId])
  @@index([journey])
  @@index([processedAt])
}
EOF
fi

# Create or update .env file with enhanced configuration
if [ ! -f "$GAMIFICATION_DIR/.env" ]; then
  echo "Creating .env file..."
  cat > "$GAMIFICATION_DIR/.env" << 'EOF'
# Database Configuration with Enhanced PrismaService
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamification?schema=public
DATABASE_DIRECT_URL=postgresql://postgres:postgres@localhost:5432/gamification?schema=public
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=30

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Kafka Configuration with Standardized Event Schema
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=gamification-engine
KAFKA_GROUP_ID=gamification-engine-group
KAFKA_HEALTH_TOPIC=health.events
KAFKA_CARE_TOPIC=care.events
KAFKA_PLAN_TOPIC=plan.events
KAFKA_USER_TOPIC=user.events
KAFKA_GAMIFICATION_TOPIC=gamification.events

# Event Schema Configuration
EVENT_SCHEMA_VERSION=1
EVENT_SCHEMA_VALIDATION=true

# Journey-specific Event Integration
JOURNEY_HEALTH_ENABLED=true
JOURNEY_CARE_ENABLED=true
JOURNEY_PLAN_ENABLED=true

# Application Configuration
PORT=3005
LOG_LEVEL=debug
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-for-development-only

# Rules Engine
RULES_REFRESH_INTERVAL=60000
EOF
fi

# Install dependencies
echo "Installing dependencies..."
cd "$GAMIFICATION_DIR"
npm install

# Generate Prisma client with enhanced configuration
echo "Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "Applying database migrations..."
if [ -d "$PRISMA_DIR/migrations" ] && [ "$(ls -A "$PRISMA_DIR/migrations")" ]; then
  echo "Migrations directory exists and is not empty. Deploying migrations..."
  npx prisma migrate deploy
else
  echo "Migrations directory does not exist or is empty. Creating initial migration..."
  npx prisma migrate dev --name initial_schema --create-only
  npx prisma migrate deploy
fi

# Create or update seed.ts file with journey-specific data
if [ ! -f "$PRISMA_DIR/seed.ts" ]; then
  echo "Creating seed.ts file..."
  cat > "$PRISMA_DIR/seed.ts" << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');

    // Seed achievements for each journey
    console.log('Seeding achievements...');
    
    // Health journey achievements
    const healthAchievement1 = await prisma.achievement.upsert({
      where: { id: 'health-achievement-1' },
      update: {},
      create: {
        id: 'health-achievement-1',
        name: 'Health Tracker',
        description: 'Record your first health metric',
        pointValue: 50,
        imageUrl: '/images/achievements/health-tracker.png',
        journey: 'health',
        category: 'metrics',
        version: 1
      },
    });

    const healthAchievement2 = await prisma.achievement.upsert({
      where: { id: 'health-achievement-2' },
      update: {},
      create: {
        id: 'health-achievement-2',
        name: 'Goal Setter',
        description: 'Create your first health goal',
        pointValue: 100,
        imageUrl: '/images/achievements/goal-setter.png',
        journey: 'health',
        category: 'goals',
        version: 1
      },
    });

    // Care journey achievements
    const careAchievement1 = await prisma.achievement.upsert({
      where: { id: 'care-achievement-1' },
      update: {},
      create: {
        id: 'care-achievement-1',
        name: 'Appointment Maker',
        description: 'Book your first appointment',
        pointValue: 50,
        imageUrl: '/images/achievements/appointment-maker.png',
        journey: 'care',
        category: 'appointments',
        version: 1
      },
    });

    const careAchievement2 = await prisma.achievement.upsert({
      where: { id: 'care-achievement-2' },
      update: {},
      create: {
        id: 'care-achievement-2',
        name: 'Medication Manager',
        description: 'Track your first medication',
        pointValue: 100,
        imageUrl: '/images/achievements/medication-manager.png',
        journey: 'care',
        category: 'medications',
        version: 1
      },
    });

    // Plan journey achievements
    const planAchievement1 = await prisma.achievement.upsert({
      where: { id: 'plan-achievement-1' },
      update: {},
      create: {
        id: 'plan-achievement-1',
        name: 'Benefit Explorer',
        description: 'View your plan benefits',
        pointValue: 50,
        imageUrl: '/images/achievements/benefit-explorer.png',
        journey: 'plan',
        category: 'benefits',
        version: 1
      },
    });

    const planAchievement2 = await prisma.achievement.upsert({
      where: { id: 'plan-achievement-2' },
      update: {},
      create: {
        id: 'plan-achievement-2',
        name: 'Claim Submitter',
        description: 'Submit your first claim',
        pointValue: 100,
        imageUrl: '/images/achievements/claim-submitter.png',
        journey: 'plan',
        category: 'claims',
        version: 1
      },
    });

    // Seed quests for each journey
    console.log('Seeding quests...');
    
    // Health journey quests
    const healthQuest1 = await prisma.quest.upsert({
      where: { id: 'health-quest-1' },
      update: {},
      create: {
        id: 'health-quest-1',
        name: 'Health Tracking Week',
        description: 'Record health metrics for 7 consecutive days',
        pointValue: 200,
        imageUrl: '/images/quests/health-tracking-week.png',
        journey: 'health',
        requirements: JSON.stringify({
          daysRequired: 7,
          metricTypes: ['weight', 'steps', 'heartRate']
        }),
        version: 1
      },
    });

    // Care journey quests
    const careQuest1 = await prisma.quest.upsert({
      where: { id: 'care-quest-1' },
      update: {},
      create: {
        id: 'care-quest-1',
        name: 'Medication Adherence',
        description: 'Take all medications on time for 5 days',
        pointValue: 150,
        imageUrl: '/images/quests/medication-adherence.png',
        journey: 'care',
        requirements: JSON.stringify({
          daysRequired: 5,
          adherencePercentage: 100
        }),
        version: 1
      },
    });

    // Plan journey quests
    const planQuest1 = await prisma.quest.upsert({
      where: { id: 'plan-quest-1' },
      update: {},
      create: {
        id: 'plan-quest-1',
        name: 'Benefits Explorer',
        description: 'Review all your plan benefits',
        pointValue: 100,
        imageUrl: '/images/quests/benefits-explorer.png',
        journey: 'plan',
        requirements: JSON.stringify({
          benefitCategories: ['medical', 'dental', 'vision', 'wellness']
        }),
        version: 1
      },
    });

    // Seed rules for event processing
    console.log('Seeding rules...');
    
    // Health journey rules
    await prisma.rule.upsert({
      where: { id: 'health-rule-1' },
      update: {},
      create: {
        id: 'health-rule-1',
        name: 'Health Metric Recorded',
        description: 'Award points when a health metric is recorded',
        eventType: 'HEALTH_METRIC_RECORDED',
        condition: 'true', // Always award points
        action: 'AWARD_POINTS',
        pointValue: 10,
        journey: 'health',
        isActive: true,
        version: 1
      },
    });

    await prisma.rule.upsert({
      where: { id: 'health-rule-2' },
      update: {},
      create: {
        id: 'health-rule-2',
        name: 'First Health Metric Achievement',
        description: 'Unlock achievement for first health metric',
        eventType: 'HEALTH_METRIC_RECORDED',
        condition: 'event.data.isFirstMetric === true',
        action: 'UNLOCK_ACHIEVEMENT',
        pointValue: 50,
        achievementId: 'health-achievement-1',
        journey: 'health',
        isActive: true,
        version: 1
      },
    });

    // Care journey rules
    await prisma.rule.upsert({
      where: { id: 'care-rule-1' },
      update: {},
      create: {
        id: 'care-rule-1',
        name: 'Appointment Booked',
        description: 'Award points when an appointment is booked',
        eventType: 'APPOINTMENT_BOOKED',
        condition: 'true', // Always award points
        action: 'AWARD_POINTS',
        pointValue: 20,
        journey: 'care',
        isActive: true,
        version: 1
      },
    });

    await prisma.rule.upsert({
      where: { id: 'care-rule-2' },
      update: {},
      create: {
        id: 'care-rule-2',
        name: 'First Appointment Achievement',
        description: 'Unlock achievement for first appointment',
        eventType: 'APPOINTMENT_BOOKED',
        condition: 'event.data.isFirstAppointment === true',
        action: 'UNLOCK_ACHIEVEMENT',
        pointValue: 50,
        achievementId: 'care-achievement-1',
        journey: 'care',
        isActive: true,
        version: 1
      },
    });

    // Plan journey rules
    await prisma.rule.upsert({
      where: { id: 'plan-rule-1' },
      update: {},
      create: {
        id: 'plan-rule-1',
        name: 'Benefit Viewed',
        description: 'Award points when a benefit is viewed',
        eventType: 'BENEFIT_VIEWED',
        condition: 'true', // Always award points
        action: 'AWARD_POINTS',
        pointValue: 5,
        journey: 'plan',
        isActive: true,
        version: 1
      },
    });

    await prisma.rule.upsert({
      where: { id: 'plan-rule-2' },
      update: {},
      create: {
        id: 'plan-rule-2',
        name: 'First Benefit Achievement',
        description: 'Unlock achievement for viewing first benefit',
        eventType: 'BENEFIT_VIEWED',
        condition: 'event.data.isFirstBenefit === true',
        action: 'UNLOCK_ACHIEVEMENT',
        pointValue: 50,
        achievementId: 'plan-achievement-1',
        journey: 'plan',
        isActive: true,
        version: 1
      },
    });

    // Seed sample user profiles
    console.log('Seeding user profiles...');
    
    for (let i = 1; i <= 5; i++) {
      await prisma.gameProfile.upsert({
        where: { userId: `user${i}` },
        update: {},
        create: {
          userId: `user${i}`,
          username: `User ${i}`,
          xp: i * 100,
          level: Math.ceil(i / 2),
          journey: i <= 2 ? 'health' : i <= 4 ? 'care' : 'plan',
          journeyContext: JSON.stringify({
            preferences: {
              notifications: true,
              achievements: true
            }
          })
        },
      });
    }

    // Assign some achievements to users
    console.log('Assigning achievements to users...');
    
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: 'user1', achievementId: 'health-achievement-1' } },
      update: {},
      create: {
        userId: 'user1',
        achievementId: 'health-achievement-1',
      },
    });

    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: 'user3', achievementId: 'care-achievement-1' } },
      update: {},
      create: {
        userId: 'user3',
        achievementId: 'care-achievement-1',
      },
    });

    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: 'user5', achievementId: 'plan-achievement-1' } },
      update: {},
      create: {
        userId: 'user5',
        achievementId: 'plan-achievement-1',
      },
    });

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
EOF
fi

# Seed the database
echo "Seeding the database..."
npx prisma db seed

# Create Kafka topics if they don't exist
echo "Ensuring Kafka topics exist..."
KAFKA_CONTAINER=$(docker ps -q -f name=kafka)
TOPICS=("health.events" "care.events" "plan.events" "user.events" "gamification.events")

for TOPIC in "${TOPICS[@]}"; do
  if ! docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server localhost:9092 | grep -q "^$TOPIC$"; then
    echo "Creating Kafka topic: $TOPIC"
    docker exec $KAFKA_CONTAINER kafka-topics --create --bootstrap-server localhost:9092 --topic $TOPIC --partitions 3 --replication-factor 1
  else
    echo "Kafka topic already exists: $TOPIC"
  fi
done

# Start the gamification engine
echo "Starting the gamification engine..."
cd "$GAMIFICATION_DIR"
npm run start:dev