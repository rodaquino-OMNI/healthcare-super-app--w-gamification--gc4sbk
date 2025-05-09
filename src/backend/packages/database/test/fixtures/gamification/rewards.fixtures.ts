/**
 * @file Test fixtures for rewards in the gamification system.
 * 
 * This file provides mock data for different reward types, including journey-specific
 * rewards and cross-journey rewards. These fixtures are critical for testing reward
 * distribution, redemption processes, and reward-based motivation systems in the
 * gamification engine.
 * 
 * @packageDocumentation
 */

import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '@austa/interfaces/gamification/rewards';

/**
 * Enum representing the categories of rewards in the system.
 * Used to determine how rewards can be redeemed and presented to users.
 */
export enum RewardCategory {
  DIGITAL = 'DIGITAL',       // Digital rewards like badges, avatars, or virtual items
  PHYSICAL = 'PHYSICAL',     // Physical rewards that can be redeemed for real-world items
  DISCOUNT = 'DISCOUNT',     // Discounts on services or products
  EXPERIENCE = 'EXPERIENCE', // Special experiences or access to exclusive content
  CURRENCY = 'CURRENCY'      // Virtual currency or points that can be spent
}

/**
 * Interface for reward fixtures with all required properties.
 */
export interface RewardFixture {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  journey: JourneyType;
  category: RewardCategory;
  isActive: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for user reward fixtures that track rewards earned by users.
 */
export interface UserRewardFixture {
  id: string;
  profileId: string;
  rewardId: string;
  earnedAt: Date;
  claimed: boolean;
  claimedAt?: Date;
}

/**
 * Base reward fixtures for general testing purposes.
 * These rewards cover different categories and journeys.
 */
export const baseRewardFixtures: RewardFixture[] = [
  {
    id: uuidv4(),
    title: 'Health Milestone Badge',
    description: 'Earned for reaching a significant health milestone',
    xpReward: 100,
    icon: 'badges/health-milestone',
    journey: 'health',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Care Provider Discount',
    description: 'Special discount on your next appointment',
    xpReward: 200,
    icon: 'discounts/care-provider',
    journey: 'care',
    category: RewardCategory.DISCOUNT,
    isActive: true,
    createdAt: new Date('2023-01-02T00:00:00Z'),
    updatedAt: new Date('2023-01-02T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Insurance Premium Voucher',
    description: 'Voucher for discount on your next insurance premium',
    xpReward: 300,
    icon: 'vouchers/insurance-premium',
    journey: 'plan',
    category: RewardCategory.CURRENCY,
    isActive: true,
    createdAt: new Date('2023-01-03T00:00:00Z'),
    updatedAt: new Date('2023-01-03T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Wellness Champion Trophy',
    description: 'Awarded to users who excel in all health journeys',
    xpReward: 500,
    icon: 'trophies/wellness-champion',
    journey: 'global',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-01-04T00:00:00Z'),
    updatedAt: new Date('2023-01-04T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Limited Edition Water Bottle',
    description: 'Physical reward for consistent health tracking',
    xpReward: 1000,
    icon: 'physical/water-bottle',
    journey: 'health',
    category: RewardCategory.PHYSICAL,
    isActive: true,
    availableFrom: new Date('2023-01-01T00:00:00Z'),
    availableTo: new Date('2023-12-31T23:59:59Z'),
    createdAt: new Date('2023-01-05T00:00:00Z'),
    updatedAt: new Date('2023-01-05T00:00:00Z')
  }
];

/**
 * Health journey specific reward fixtures.
 * These rewards are specifically tied to health-related achievements and activities.
 */
export const healthRewardFixtures: RewardFixture[] = [
  {
    id: uuidv4(),
    title: 'Step Master Badge',
    description: 'Achieved 10,000 steps daily for a week',
    xpReward: 150,
    icon: 'badges/step-master',
    journey: 'health',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-02-01T00:00:00Z'),
    updatedAt: new Date('2023-02-01T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Heart Health Champion',
    description: 'Maintained optimal heart rate during workouts for a month',
    xpReward: 250,
    icon: 'badges/heart-health',
    journey: 'health',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-02-02T00:00:00Z'),
    updatedAt: new Date('2023-02-02T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Nutrition Tracking Streak',
    description: 'Logged nutrition information for 30 consecutive days',
    xpReward: 200,
    icon: 'badges/nutrition-streak',
    journey: 'health',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-02-03T00:00:00Z'),
    updatedAt: new Date('2023-02-03T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Fitness Gear Discount',
    description: '15% off on fitness equipment at partner stores',
    xpReward: 300,
    icon: 'discounts/fitness-gear',
    journey: 'health',
    category: RewardCategory.DISCOUNT,
    isActive: true,
    availableFrom: new Date('2023-02-01T00:00:00Z'),
    availableTo: new Date('2023-04-30T23:59:59Z'),
    createdAt: new Date('2023-02-04T00:00:00Z'),
    updatedAt: new Date('2023-02-04T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Wellness Workshop Access',
    description: 'Free access to exclusive wellness workshop',
    xpReward: 400,
    icon: 'experiences/wellness-workshop',
    journey: 'health',
    category: RewardCategory.EXPERIENCE,
    isActive: true,
    availableFrom: new Date('2023-03-01T00:00:00Z'),
    availableTo: new Date('2023-03-31T23:59:59Z'),
    createdAt: new Date('2023-02-05T00:00:00Z'),
    updatedAt: new Date('2023-02-05T00:00:00Z')
  }
];

/**
 * Care journey specific reward fixtures.
 * These rewards are specifically tied to care-related achievements and activities.
 */
export const careRewardFixtures: RewardFixture[] = [
  {
    id: uuidv4(),
    title: 'Appointment Keeper',
    description: 'Attended 5 consecutive appointments without rescheduling',
    xpReward: 150,
    icon: 'badges/appointment-keeper',
    journey: 'care',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-03-01T00:00:00Z'),
    updatedAt: new Date('2023-03-01T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Medication Adherence Star',
    description: 'Maintained perfect medication adherence for a month',
    xpReward: 250,
    icon: 'badges/medication-adherence',
    journey: 'care',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-03-02T00:00:00Z'),
    updatedAt: new Date('2023-03-02T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Telemedicine Pioneer',
    description: 'Completed 3 telemedicine consultations',
    xpReward: 200,
    icon: 'badges/telemedicine-pioneer',
    journey: 'care',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-03-03T00:00:00Z'),
    updatedAt: new Date('2023-03-03T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Pharmacy Discount Voucher',
    description: '10% off on your next pharmacy purchase',
    xpReward: 300,
    icon: 'vouchers/pharmacy-discount',
    journey: 'care',
    category: RewardCategory.DISCOUNT,
    isActive: true,
    availableFrom: new Date('2023-03-01T00:00:00Z'),
    availableTo: new Date('2023-05-31T23:59:59Z'),
    createdAt: new Date('2023-03-04T00:00:00Z'),
    updatedAt: new Date('2023-03-04T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Priority Appointment Booking',
    description: 'Priority access for booking appointments with specialists',
    xpReward: 400,
    icon: 'experiences/priority-booking',
    journey: 'care',
    category: RewardCategory.EXPERIENCE,
    isActive: true,
    createdAt: new Date('2023-03-05T00:00:00Z'),
    updatedAt: new Date('2023-03-05T00:00:00Z')
  }
];

/**
 * Plan journey specific reward fixtures.
 * These rewards are specifically tied to plan-related achievements and activities.
 */
export const planRewardFixtures: RewardFixture[] = [
  {
    id: uuidv4(),
    title: 'Claims Master',
    description: 'Successfully submitted 10 claims with all required documentation',
    xpReward: 150,
    icon: 'badges/claims-master',
    journey: 'plan',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-04-01T00:00:00Z'),
    updatedAt: new Date('2023-04-01T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Benefits Explorer',
    description: 'Explored and utilized 5 different benefits in your plan',
    xpReward: 250,
    icon: 'badges/benefits-explorer',
    journey: 'plan',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-04-02T00:00:00Z'),
    updatedAt: new Date('2023-04-02T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Document Organizer',
    description: 'Uploaded and organized all required insurance documents',
    xpReward: 200,
    icon: 'badges/document-organizer',
    journey: 'plan',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-04-03T00:00:00Z'),
    updatedAt: new Date('2023-04-03T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Premium Discount Voucher',
    description: 'Special discount on your next insurance premium payment',
    xpReward: 500,
    icon: 'vouchers/premium-discount',
    journey: 'plan',
    category: RewardCategory.DISCOUNT,
    isActive: true,
    availableFrom: new Date('2023-04-01T00:00:00Z'),
    availableTo: new Date('2023-06-30T23:59:59Z'),
    createdAt: new Date('2023-04-04T00:00:00Z'),
    updatedAt: new Date('2023-04-04T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Insurance Consultation',
    description: 'Free consultation with an insurance specialist',
    xpReward: 400,
    icon: 'experiences/insurance-consultation',
    journey: 'plan',
    category: RewardCategory.EXPERIENCE,
    isActive: true,
    createdAt: new Date('2023-04-05T00:00:00Z'),
    updatedAt: new Date('2023-04-05T00:00:00Z')
  }
];

/**
 * Global/cross-journey reward fixtures.
 * These rewards are available across all journeys and represent major achievements.
 */
export const globalRewardFixtures: RewardFixture[] = [
  {
    id: uuidv4(),
    title: 'SuperApp Champion',
    description: 'Achieved significant milestones across all journeys',
    xpReward: 1000,
    icon: 'badges/superapp-champion',
    journey: 'global',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-05-01T00:00:00Z'),
    updatedAt: new Date('2023-05-01T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Wellness Warrior',
    description: 'Demonstrated commitment to health across all aspects of wellbeing',
    xpReward: 750,
    icon: 'badges/wellness-warrior',
    journey: 'global',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date('2023-05-02T00:00:00Z'),
    updatedAt: new Date('2023-05-02T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Premium Membership',
    description: 'Access to premium features across all journeys',
    xpReward: 2000,
    icon: 'experiences/premium-membership',
    journey: 'global',
    category: RewardCategory.EXPERIENCE,
    isActive: true,
    createdAt: new Date('2023-05-03T00:00:00Z'),
    updatedAt: new Date('2023-05-03T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Wellness Box',
    description: 'Physical box with health and wellness products',
    xpReward: 1500,
    icon: 'physical/wellness-box',
    journey: 'global',
    category: RewardCategory.PHYSICAL,
    isActive: true,
    availableFrom: new Date('2023-05-01T00:00:00Z'),
    availableTo: new Date('2023-12-31T23:59:59Z'),
    createdAt: new Date('2023-05-04T00:00:00Z'),
    updatedAt: new Date('2023-05-04T00:00:00Z')
  },
  {
    id: uuidv4(),
    title: 'Multi-Journey Discount Bundle',
    description: 'Bundle of discounts applicable across health, care, and plan services',
    xpReward: 1200,
    icon: 'vouchers/multi-journey-bundle',
    journey: 'global',
    category: RewardCategory.DISCOUNT,
    isActive: true,
    createdAt: new Date('2023-05-05T00:00:00Z'),
    updatedAt: new Date('2023-05-05T00:00:00Z')
  }
];

/**
 * Reward redemption test scenarios with different states.
 * These fixtures represent user rewards in various states of redemption.
 */
export const userRewardFixtures: UserRewardFixture[] = [
  // Earned but not claimed rewards
  {
    id: uuidv4(),
    profileId: 'profile-1',
    rewardId: healthRewardFixtures[0].id,
    earnedAt: new Date('2023-06-01T10:00:00Z'),
    claimed: false
  },
  {
    id: uuidv4(),
    profileId: 'profile-1',
    rewardId: careRewardFixtures[0].id,
    earnedAt: new Date('2023-06-02T11:00:00Z'),
    claimed: false
  },
  
  // Claimed rewards
  {
    id: uuidv4(),
    profileId: 'profile-1',
    rewardId: planRewardFixtures[0].id,
    earnedAt: new Date('2023-06-03T12:00:00Z'),
    claimed: true,
    claimedAt: new Date('2023-06-04T09:00:00Z')
  },
  {
    id: uuidv4(),
    profileId: 'profile-1',
    rewardId: globalRewardFixtures[0].id,
    earnedAt: new Date('2023-06-05T14:00:00Z'),
    claimed: true,
    claimedAt: new Date('2023-06-06T15:00:00Z')
  },
  
  // Different user's rewards
  {
    id: uuidv4(),
    profileId: 'profile-2',
    rewardId: healthRewardFixtures[1].id,
    earnedAt: new Date('2023-06-07T16:00:00Z'),
    claimed: false
  },
  {
    id: uuidv4(),
    profileId: 'profile-2',
    rewardId: careRewardFixtures[1].id,
    earnedAt: new Date('2023-06-08T17:00:00Z'),
    claimed: true,
    claimedAt: new Date('2023-06-09T18:00:00Z')
  }
];

/**
 * Combined array of all reward fixtures for easy access.
 */
export const allRewardFixtures: RewardFixture[] = [
  ...baseRewardFixtures,
  ...healthRewardFixtures,
  ...careRewardFixtures,
  ...planRewardFixtures,
  ...globalRewardFixtures
];

/**
 * Helper function to create a custom reward fixture with default values.
 * Useful for creating specific test cases with minimal configuration.
 * 
 * @param overrides - Properties to override in the default reward fixture
 * @returns A complete reward fixture with the specified overrides
 */
export function createRewardFixture(overrides: Partial<RewardFixture> = {}): RewardFixture {
  return {
    id: uuidv4(),
    title: 'Test Reward',
    description: 'A reward for testing purposes',
    xpReward: 100,
    icon: 'test/reward-icon',
    journey: 'global',
    category: RewardCategory.DIGITAL,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Helper function to create a custom user reward fixture with default values.
 * Useful for creating specific test cases with minimal configuration.
 * 
 * @param overrides - Properties to override in the default user reward fixture
 * @returns A complete user reward fixture with the specified overrides
 */
export function createUserRewardFixture(overrides: Partial<UserRewardFixture> = {}): UserRewardFixture {
  return {
    id: uuidv4(),
    profileId: 'profile-test',
    rewardId: allRewardFixtures[0].id,
    earnedAt: new Date(),
    claimed: false,
    ...overrides
  };
}

/**
 * Helper function to find a reward fixture by ID.
 * 
 * @param id - The ID of the reward to find
 * @returns The reward fixture with the specified ID, or undefined if not found
 */
export function findRewardFixtureById(id: string): RewardFixture | undefined {
  return allRewardFixtures.find(reward => reward.id === id);
}

/**
 * Helper function to find reward fixtures by journey.
 * 
 * @param journey - The journey to filter rewards by
 * @returns An array of reward fixtures for the specified journey
 */
export function findRewardFixturesByJourney(journey: JourneyType): RewardFixture[] {
  return allRewardFixtures.filter(reward => reward.journey === journey);
}

/**
 * Helper function to find reward fixtures by category.
 * 
 * @param category - The category to filter rewards by
 * @returns An array of reward fixtures for the specified category
 */
export function findRewardFixturesByCategory(category: RewardCategory): RewardFixture[] {
  return allRewardFixtures.filter(reward => reward.category === category);
}

/**
 * Helper function to find user reward fixtures by profile ID.
 * 
 * @param profileId - The profile ID to filter user rewards by
 * @returns An array of user reward fixtures for the specified profile
 */
export function findUserRewardFixturesByProfileId(profileId: string): UserRewardFixture[] {
  return userRewardFixtures.filter(userReward => userReward.profileId === profileId);
}

/**
 * Helper function to find user reward fixtures by reward ID.
 * 
 * @param rewardId - The reward ID to filter user rewards by
 * @returns An array of user reward fixtures for the specified reward
 */
export function findUserRewardFixturesByRewardId(rewardId: string): UserRewardFixture[] {
  return userRewardFixtures.filter(userReward => userReward.rewardId === rewardId);
}

/**
 * Helper function to find user reward fixtures by claimed status.
 * 
 * @param claimed - The claimed status to filter user rewards by
 * @returns An array of user reward fixtures with the specified claimed status
 */
export function findUserRewardFixturesByClaimed(claimed: boolean): UserRewardFixture[] {
  return userRewardFixtures.filter(userReward => userReward.claimed === claimed);
}