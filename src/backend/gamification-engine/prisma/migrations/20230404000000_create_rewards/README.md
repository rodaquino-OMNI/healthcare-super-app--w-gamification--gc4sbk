# Rewards Migration

## Overview

This migration creates the database schema for the reward system in the AUSTA SuperApp gamification engine. The reward system is a critical component of the cross-journey gamification architecture, allowing users to earn rewards for their achievements and progress across all three journeys: Health ("Minha Saúde"), Care ("Cuidar-me Agora"), and Plan ("Meu Plano & Benefícios").

## Database Schema

This migration creates two primary tables:

### `rewards` Table

Stores the definitions of all available rewards in the system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, unique identifier for the reward |
| `title` | VARCHAR(100) | Display name of the reward |
| `description` | VARCHAR(500) | Detailed description of what the reward is and how it was earned |
| `xpReward` | INTEGER | Amount of experience points awarded when earning this reward |
| `icon` | VARCHAR(255) | Path or identifier for the reward's visual representation |
| `journey` | VARCHAR(50) | The journey this reward is associated with ('health', 'care', 'plan', or 'global') |
| `category` | VARCHAR(50) | Category of reward (e.g., 'digital', 'physical', 'discount', 'badge') |
| `availableFrom` | TIMESTAMP | Optional start date when the reward becomes available |
| `availableTo` | TIMESTAMP | Optional end date when the reward is no longer available |
| `isActive` | BOOLEAN | Flag indicating if the reward is currently active |
| `createdAt` | TIMESTAMP | When the reward was created |
| `updatedAt` | TIMESTAMP | When the reward was last updated |

**Indices:**
- Primary key on `id`
- Index on `journey` for efficient filtering by journey type
- Index on `category` for filtering by reward category
- Composite index on `isActive` and `journey` for active reward queries

### `user_rewards` Table

Junction table that tracks which rewards have been earned by which users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, unique identifier for the user-reward relationship |
| `profileId` | UUID | Foreign key to the game_profiles table |
| `rewardId` | UUID | Foreign key to the rewards table |
| `earnedAt` | TIMESTAMP | When the user earned this reward |

**Indices:**
- Primary key on `id`
- Foreign key index on `profileId`
- Foreign key index on `rewardId`
- Composite index on `profileId` and `rewardId` for uniqueness and efficient querying

## Cross-Journey Gamification

The reward system is designed to support the SuperApp's cross-journey gamification architecture in several ways:

1. **Journey-Specific Rewards**: The `journey` field in the `rewards` table allows for rewards to be associated with specific journeys (Health, Care, Plan) or marked as 'global' for cross-journey rewards.

2. **Unified User Progress**: By linking to the `game_profiles` table, the `user_rewards` table ensures that all rewards contribute to a user's overall gamification progress, regardless of which journey they were earned in.

3. **Consistent Experience**: The standardized reward structure ensures a consistent user experience across all journeys while allowing for journey-specific theming and content.

4. **Flexible Reward Categories**: The `category` field supports different types of rewards (digital badges, physical items, discounts, etc.) that can be applied appropriately across different journeys.

## Points Economy

The reward system forms the foundation of the gamification engine's points economy:

1. **XP Accumulation**: The `xpReward` field in the `rewards` table defines how many experience points a user receives when earning each reward, contributing to their level progression.

2. **Level Progression**: As users earn rewards across different journeys, they accumulate XP that increases their overall level in the `game_profiles` table.

3. **Achievement Tracking**: Rewards are often granted as a result of completing achievements, creating a clear path for users to earn points and progress.

4. **Journey Balance**: The reward system allows for balancing the points economy across journeys, ensuring that no single journey dominates the user's progression.

## Implementation Notes

- The reward system uses Prisma ORM for database operations, with entity classes that implement interfaces from the `@austa/interfaces` package for type safety.

- The `Reward` entity extends `PrismaModel` and implements `RewardInterface` from `@austa/interfaces/gamification/rewards`.

- The `UserReward` entity implements `IUserReward` from `@austa/interfaces/gamification` and includes methods for Prisma integration.

- Journey-specific filtering is supported through the `createJourneyFilter` method in the `UserReward` entity.

## Related Migrations

- **20230401000000_initial_schema**: Sets up the initial database structure
- **20230402000000_create_profiles**: Creates the game_profiles table that user_rewards references
- **20230403000000_create_achievements**: Creates the achievements system that often triggers rewards

## Future Considerations

- Additional indices may be added based on query performance analysis
- Support for time-limited or seasonal rewards via the availability date fields
- Integration with external reward fulfillment systems for physical rewards