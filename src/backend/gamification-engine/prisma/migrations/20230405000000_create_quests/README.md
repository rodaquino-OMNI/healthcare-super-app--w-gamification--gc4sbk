# Quest System Migration

## Overview

This migration creates the database schema for the quest system within the AUSTA SuperApp gamification engine. Quests are structured challenges that users can undertake to earn experience points (XP) and unlock achievements. The quest system is a core component of the cross-journey gamification architecture, allowing users to progress through engaging activities across all three journeys: Health, Care, and Plan.

## Database Schema

This migration creates two primary tables:

### `quests` Table

Stores the definition of quests available in the system.

```sql
CREATE TABLE "quests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "journey" VARCHAR NOT NULL,
  "icon" VARCHAR NOT NULL,
  "xp_reward" INTEGER NOT NULL,
  "difficulty" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_quests_journey" ON "quests" ("journey");
```

**Key Fields:**
- `id`: Unique identifier for the quest (UUID)
- `title`: Display name of the quest (3-100 characters)
- `description`: Detailed explanation of quest objectives
- `journey`: The journey this quest belongs to (`health`, `care`, `plan`)
- `icon`: Reference to an icon in the design system
- `xp_reward`: Experience points awarded upon completion (0-1000)
- `difficulty`: Optional difficulty rating (1-5)

### `user_quests` Table

Tracks individual user progress on quests.

```sql
CREATE TABLE "user_quests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "profile_id" UUID NOT NULL,
  "quest_id" UUID NOT NULL,
  "status" VARCHAR NOT NULL DEFAULT 'NOT_STARTED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB,
  "journey" VARCHAR NOT NULL,
  "rewarded" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_user_quests_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_user_quests_quest" FOREIGN KEY ("quest_id") REFERENCES "quests" ("id") ON DELETE CASCADE
);

CREATE INDEX "idx_user_quests_profile_id" ON "user_quests" ("profile_id");
CREATE INDEX "idx_user_quests_quest_id" ON "user_quests" ("quest_id");
CREATE INDEX "idx_user_quests_status" ON "user_quests" ("status");
CREATE INDEX "idx_user_quests_journey" ON "user_quests" ("journey");
CREATE UNIQUE INDEX "idx_user_quests_profile_quest" ON "user_quests" ("profile_id", "quest_id");
```

**Key Fields:**
- `id`: Unique identifier for the user quest record (UUID)
- `profile_id`: Reference to the user's gamification profile
- `quest_id`: Reference to the quest definition
- `status`: Current status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- `progress`: Percentage of completion (0-100)
- `started_at`: Timestamp when the user started the quest
- `completed_at`: Timestamp when the user completed the quest
- `metadata`: JSON field for storing additional quest-specific data
- `journey`: The journey this quest progress belongs to
- `rewarded`: Flag indicating whether XP rewards have been granted

## Quest System Architecture

### Journey-Specific Quests

Quests are designed to be journey-specific, allowing for targeted challenges within each domain:

- **Health Journey**: Quests related to tracking health metrics, achieving fitness goals, connecting wearable devices, etc.
- **Care Journey**: Quests for scheduling appointments, completing telemedicine sessions, medication adherence, etc.
- **Plan Journey**: Quests for exploring benefits, submitting claims, reviewing coverage details, etc.

The `journey` field in both tables enables filtering and organization of quests by journey context.

### Progress Tracking

The quest system implements a percentage-based progress tracking mechanism:

- Progress is stored as an integer from 0 to 100, representing completion percentage
- This allows for both binary (0% or 100%) and incremental quest completion
- The frontend can display progress bars or circular indicators based on this value
- Status transitions are automatically managed based on progress values:
  - 0% → `NOT_STARTED`
  - 1-99% → `IN_PROGRESS`
  - 100% → `COMPLETED`

### Quest Completion and Rewards

When a quest is completed:

1. The `status` is set to `COMPLETED`
2. The `completed_at` timestamp is recorded
3. The `progress` value is set to 100
4. The gamification engine processes the completion event
5. XP rewards are granted to the user's profile
6. The `rewarded` flag is set to `true`
7. Related achievements may be unlocked based on quest completion

### Integration with Gamification Components

The quest system integrates with other gamification components:

- **Profiles**: User quest progress is linked to gamification profiles
- **Achievements**: Completing quests can trigger achievements
- **Rewards**: XP from quests contributes to level progression and unlocks rewards
- **Events**: Journey events can trigger quest progress updates

## Design Considerations

### Multi-Step Challenges

The quest system supports both simple and complex multi-step challenges:

- Simple quests can be completed in a single action
- Complex quests can track progress across multiple steps
- The `metadata` field can store step-specific information

### Cross-Journey Achievements

While quests are journey-specific, they can contribute to cross-journey achievements:

- Completing quests across different journeys can unlock special achievements
- The achievement system can query quest completion across all journeys
- This encourages users to explore all aspects of the SuperApp

### Performance Optimization

The schema includes several indexes to optimize query performance:

- Indexes on `profile_id` and `quest_id` for efficient lookups
- Index on `status` for filtering active or completed quests
- Index on `journey` for journey-specific queries
- Unique composite index on `profile_id` and `quest_id` to prevent duplicates