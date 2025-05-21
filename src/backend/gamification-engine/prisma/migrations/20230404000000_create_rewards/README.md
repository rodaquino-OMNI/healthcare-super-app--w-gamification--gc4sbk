# Create Rewards Migration

## Overview

This migration creates the database schema for the reward system within the AUSTA SuperApp gamification engine. It establishes the foundation for tracking and distributing rewards across all three user journeys (Health, Care, and Plan), supporting the cross-journey gamification architecture that drives user engagement throughout the platform.

## Tables Created

### `rewards`

Stores the definitions of all possible rewards that users can earn within the gamification system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key identifier for the reward |
| `title` | String | Display name of the reward shown to users |
| `description` | String | Detailed explanation of the reward and how to earn it |
| `xpReward` | Integer | Amount of experience points awarded when earning this reward |
| `icon` | String | Path or identifier for the visual representation of the reward |
| `journey` | String | The journey this reward is associated with ('health', 'care', 'plan', or 'global') |

### `user_rewards`

Tracks the relationship between users and the rewards they have earned.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key identifier for the user-reward relationship |
| `profileId` | UUID | Foreign key reference to the user's game profile |
| `rewardId` | UUID | Foreign key reference to the earned reward |
| `earnedAt` | DateTime | Timestamp when the reward was earned |

## Relationships

- Each `user_reward` belongs to exactly one `game_profile` (created in the previous migration)
- Each `user_reward` references exactly one `reward`
- A `game_profile` can have multiple `user_rewards` (one-to-many)
- A `reward` can be earned by multiple users (one-to-many)

## Cross-Journey Gamification

The reward system is a critical component of the AUSTA SuperApp's cross-journey gamification architecture. It enables:

1. **Journey-Specific Rewards**: Each journey (Health, Care, Plan) can define its own rewards that align with journey-specific activities and goals. This is implemented through the `journey` field in the `rewards` table.

2. **Cross-Journey Incentives**: The system supports global rewards (where `journey = 'global'`) that can be earned through activities across multiple journeys, encouraging users to engage with the entire platform.

3. **Unified Points Economy**: The `xpReward` field establishes a consistent points economy across all journeys, allowing users to accumulate experience points regardless of which journey they are currently focused on.

## Integration with Gamification Engine

This reward system integrates with other components of the gamification engine:

- **Achievements**: When users complete achievements, they may earn rewards as a result
- **Quests**: Completing quests often results in reward distribution
- **Game Profiles**: User progress, including earned rewards, is tracked in their game profile
- **Events**: Journey-specific events trigger reward distribution based on configured rules

## Points Economy

The rewards table supports the platform's points economy by:

1. **Standardizing Value**: The `xpReward` field provides a consistent measure of value across different types of rewards
2. **Journey Balance**: Rewards can be calibrated to ensure balanced progression across all three journeys
3. **Engagement Incentives**: Higher-value rewards can be associated with more challenging achievements or sustained engagement

## Usage Notes

- When creating new rewards, consider the journey association carefully to ensure proper categorization
- The `icon` field should reference assets available in the design system
- Reward descriptions should clearly communicate how the reward is earned and its value to users
- Consider the balance of the points economy when assigning `xpReward` values to maintain engagement across all journeys