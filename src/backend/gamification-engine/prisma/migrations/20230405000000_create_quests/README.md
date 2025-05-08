# Quest System Migration

This migration establishes the database schema for the quest system within the AUSTA SuperApp gamification engine. Quests are structured challenges that users can undertake to earn experience points (XP) and achievements, forming a core component of the engagement strategy across all user journeys.

## Schema Overview

This migration creates two primary tables:

### `quests` Table

Stores the definition of quests available in the system:

```sql
CREATE TABLE "quests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "journey" VARCHAR(20) NOT NULL,
  "icon" VARCHAR(50) NOT NULL,
  "xp_reward" INTEGER NOT NULL,
  "deadline" TIMESTAMP WITH TIME ZONE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX "idx_quests_journey" ON "quests"("journey");
CREATE INDEX "idx_quests_is_active" ON "quests"("is_active");
```

### `user_quests` Table

Tracks individual user progress on quests:

```sql
CREATE TABLE "user_quests" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "quest_id" UUID NOT NULL REFERENCES "quests"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  "progress" FLOAT NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "progress_metadata" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "unique_user_quest" UNIQUE ("user_id", "quest_id")
);

CREATE INDEX "idx_user_quests_user_id" ON "user_quests"("user_id");
CREATE INDEX "idx_user_quests_status" ON "user_quests"("status");
```

## Design Decisions

### Journey-Specific and Cross-Journey Quests

The `journey` field in the `quests` table supports values like 'health', 'care', 'plan', and 'cross-journey', enabling:

- **Journey-Specific Quests**: Challenges tied to a particular journey (e.g., "Track blood pressure for 7 days" in the Health journey)
- **Cross-Journey Quests**: Challenges that span multiple journeys (e.g., "Complete your health profile and schedule a check-up")

This design facilitates both focused journey engagement and cross-journey user activation.

### Flexible Progress Tracking

The quest system supports multiple progression models:

1. **Binary Completion**: Simple quests with completed/not-completed states
2. **Percentage-Based Progress**: Quests with gradual progress from 0-100%
3. **Step-Based Progression**: Multi-step quests with sequential or parallel objectives

The `progress_metadata` JSONB field enables storing structured data about quest progression, including:

- Completed steps and their timestamps
- Journey-specific context data
- Related events that contributed to progress
- Custom tracking logic for complex quests

### Quest Status Lifecycle

Quests follow a defined lifecycle through the `status` field:

- `NOT_STARTED`: Quest assigned but not yet begun
- `IN_PROGRESS`: User actively working on quest objectives
- `COMPLETED`: All quest objectives fulfilled

This enables accurate tracking of user engagement and completion rates across different quest types.

## Integration with Gamification Architecture

The quest system integrates with other gamification components:

### Profile Integration

Quests are assigned to user profiles and contribute to the user's overall XP and level progression. Completed quests increase the user's gamification profile stats.

### Achievement System

Quests can trigger achievements when completed, especially for milestone quests or quest sequences. The achievement system references quest completion events.

### Reward System

Completing quests grants XP rewards (stored in `xp_reward`), which accumulate in the user's profile. Special quests may also unlock tangible rewards through the reward system.

### Event Processing

The quest system processes events from all journeys to update quest progress automatically. For example:

- Health metrics recorded → Update "Track health metrics" quest
- Appointment scheduled → Update "Schedule check-up" quest
- Insurance claim submitted → Update "Submit claim" quest

## Progress Representation

The system stores progress as a float between 0-100 to support percentage-based display in the UI. This allows for:

- Precise visual indicators (progress bars, circles)
- Partial credit for multi-step quests
- Gradual progression for time-based or count-based quests

## Indexing Strategy

The migration creates strategic indexes to optimize common query patterns:

- `idx_quests_journey`: Speeds up filtering quests by journey
- `idx_quests_is_active`: Optimizes queries for active quests
- `idx_user_quests_user_id`: Accelerates lookup of a user's quests
- `idx_user_quests_status`: Improves filtering by completion status

These indexes support efficient quest discovery, progress tracking, and reporting.

## Constraints and Data Integrity

The schema enforces several constraints to maintain data integrity:

- Foreign key relationship between `user_quests` and `quests`
- Unique constraint on user_id + quest_id to prevent duplicate assignments
- Cascading deletes to automatically remove user quest records when a quest is deleted
- Default values for status and progress fields

These constraints ensure consistent and reliable quest data throughout the system.