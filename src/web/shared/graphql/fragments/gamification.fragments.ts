import { gql } from '@apollo/client'; // v3.7.17
import type { Achievement, Quest, Reward, GameProfile } from '@austa/interfaces/gamification';

/**
 * Fragment for achievement data used across the gamification system
 * Contains all essential fields needed to display and track achievement progress
 * @type {import('@apollo/client').DocumentNode}
 */
export const AchievementFragment = gql`
  fragment AchievementFragment on Achievement {
    id
    title
    description
    journey
    icon
    progress
    total
    unlocked
  }
`;

/**
 * Fragment for quest data used across the gamification system
 * Contains all essential fields needed to display and track quest progress
 * @type {import('@apollo/client').DocumentNode}
 */
export const QuestFragment = gql`
  fragment QuestFragment on Quest {
    id
    title
    description
    journey
    icon
    progress
    total
    completed
  }
`;

/**
 * Fragment for reward data used across the gamification system
 * Contains all essential fields needed to display reward information
 * @type {import('@apollo/client').DocumentNode}
 */
export const RewardFragment = gql`
  fragment RewardFragment on Reward {
    id
    title
    description
    journey
    icon
    xp
  }
`;

/**
 * Fragment for the user's gamification profile
 * Includes level, XP, and references to achievements and quests
 * Note: When using this fragment, you must also include AchievementFragment and QuestFragment
 * @type {import('@apollo/client').DocumentNode}
 */
export const GamificationProfileFragment = gql`
  fragment GamificationProfileFragment on GameProfile {
    level
    xp
    achievements {
      ...AchievementFragment
    }
    quests {
      ...QuestFragment
    }
  }
`;