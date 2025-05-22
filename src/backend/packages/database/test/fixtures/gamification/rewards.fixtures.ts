/**
 * @file Gamification Rewards Test Fixtures
 * 
 * This file provides test fixtures for rewards in the gamification system.
 * It includes mock data for different reward types (health, care, plan, and cross-journey rewards)
 * and supports testing reward distribution, redemption processes, and reward-based motivation systems.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Reward,
  HealthReward,
  CareReward,
  PlanReward,
  UserReward,
  UserRewardWithDetails,
  JourneyType
} from '@austa/interfaces/gamification/rewards';
import { Journey } from '@austa/interfaces/common';

// ===== REWARD FIXTURES =====

/**
 * Creates a basic reward fixture for simple tests
 * 
 * @returns A basic reward fixture
 */
export function getBasicReward(): Reward {
  return {
    id: uuidv4(),
    title: 'Basic Reward',
    description: 'A basic reward for testing purposes',
    xpValue: 100,
    icon: 'trophy',
    journey: 'global'
  };
}

/**
 * Creates a health journey reward fixture
 * 
 * @param overrides - Optional properties to override in the fixture
 * @returns A health journey reward fixture
 */
export function getHealthReward(overrides: Partial<HealthReward> = {}): HealthReward {
  return {
    id: uuidv4(),
    title: 'Health Champion',
    description: 'Awarded for maintaining consistent health tracking',
    xpValue: 150,
    icon: 'heart-pulse',
    journey: 'health',
    metadata: {
      category: 'fitness',
      difficulty: 'medium',
      ...overrides.metadata
    },
    ...overrides
  };
}

/**
 * Creates a care journey reward fixture
 * 
 * @param overrides - Optional properties to override in the fixture
 * @returns A care journey reward fixture
 */
export function getCareReward(overrides: Partial<CareReward> = {}): CareReward {
  return {
    id: uuidv4(),
    title: 'Care Commitment',
    description: 'Awarded for attending all scheduled appointments',
    xpValue: 200,
    icon: 'stethoscope',
    journey: 'care',
    metadata: {
      category: 'appointment',
      providerId: uuidv4(),
      ...overrides.metadata
    },
    ...overrides
  };
}

/**
 * Creates a plan journey reward fixture
 * 
 * @param overrides - Optional properties to override in the fixture
 * @returns A plan journey reward fixture
 */
export function getPlanReward(overrides: Partial<PlanReward> = {}): PlanReward {
  return {
    id: uuidv4(),
    title: 'Plan Master',
    description: 'Awarded for optimizing insurance benefits',
    xpValue: 175,
    icon: 'shield-check',
    journey: 'plan',
    metadata: {
      category: 'benefit',
      planId: uuidv4(),
      ...overrides.metadata
    },
    ...overrides
  };
}

/**
 * Creates a global cross-journey reward fixture
 * 
 * @param overrides - Optional properties to override in the fixture
 * @returns A global cross-journey reward fixture
 */
export function getGlobalReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: uuidv4(),
    title: 'SuperApp Champion',
    description: 'Awarded for engagement across all journeys',
    xpValue: 300,
    icon: 'award-star',
    journey: 'global',
    metadata: {
      requiresAllJourneys: true,
      tier: 'gold',
      ...overrides.metadata
    },
    ...overrides
  };
}

/**
 * Creates a collection of health journey rewards
 * 
 * @returns An array of health journey rewards
 */
export function getHealthRewards(): HealthReward[] {
  return [
    getHealthReward({
      id: 'health-reward-1',
      title: 'Step Master',
      description: 'Awarded for reaching 10,000 steps daily for a week',
      xpValue: 150,
      icon: 'footprints',
      metadata: {
        category: 'fitness',
        difficulty: 'medium'
      }
    }),
    getHealthReward({
      id: 'health-reward-2',
      title: 'Sleep Champion',
      description: 'Awarded for maintaining healthy sleep patterns',
      xpValue: 125,
      icon: 'moon',
      metadata: {
        category: 'sleep',
        difficulty: 'easy'
      }
    }),
    getHealthReward({
      id: 'health-reward-3',
      title: 'Heart Health Hero',
      description: 'Awarded for maintaining optimal heart rate zones during exercise',
      xpValue: 200,
      icon: 'heart',
      metadata: {
        category: 'cardio',
        difficulty: 'hard'
      }
    }),
    getHealthReward({
      id: 'health-reward-4',
      title: 'Nutrition Navigator',
      description: 'Awarded for logging balanced meals for 30 days',
      xpValue: 175,
      icon: 'apple',
      metadata: {
        category: 'nutrition',
        difficulty: 'medium'
      }
    }),
    getHealthReward({
      id: 'health-reward-5',
      title: 'Device Connector',
      description: 'Awarded for connecting and syncing a health device',
      xpValue: 100,
      icon: 'device-watch',
      metadata: {
        category: 'devices',
        difficulty: 'easy'
      }
    })
  ];
}

/**
 * Creates a collection of care journey rewards
 * 
 * @returns An array of care journey rewards
 */
export function getCareRewards(): CareReward[] {
  return [
    getCareReward({
      id: 'care-reward-1',
      title: 'Appointment Ace',
      description: 'Awarded for attending 5 consecutive appointments on time',
      xpValue: 200,
      icon: 'calendar-check',
      metadata: {
        category: 'appointment',
        providerId: 'provider-123'
      }
    }),
    getCareReward({
      id: 'care-reward-2',
      title: 'Medication Manager',
      description: 'Awarded for perfect medication adherence for 30 days',
      xpValue: 225,
      icon: 'pill',
      metadata: {
        category: 'medication'
      }
    }),
    getCareReward({
      id: 'care-reward-3',
      title: 'Telemedicine Pioneer',
      description: 'Awarded for completing a telemedicine consultation',
      xpValue: 150,
      icon: 'video',
      metadata: {
        category: 'telemedicine',
        providerId: 'provider-456'
      }
    }),
    getCareReward({
      id: 'care-reward-4',
      title: 'Treatment Tracker',
      description: 'Awarded for following a treatment plan for 60 days',
      xpValue: 250,
      icon: 'clipboard-check',
      metadata: {
        category: 'treatment'
      }
    }),
    getCareReward({
      id: 'care-reward-5',
      title: 'Symptom Solver',
      description: 'Awarded for using the symptom checker to identify health concerns',
      xpValue: 125,
      icon: 'stethoscope',
      metadata: {
        category: 'symptom-checker'
      }
    })
  ];
}

/**
 * Creates a collection of plan journey rewards
 * 
 * @returns An array of plan journey rewards
 */
export function getPlanRewards(): PlanReward[] {
  return [
    getPlanReward({
      id: 'plan-reward-1',
      title: 'Claim Champion',
      description: 'Awarded for successfully submitting 5 claims with all required documentation',
      xpValue: 175,
      icon: 'receipt',
      metadata: {
        category: 'claim',
        planId: 'plan-123'
      }
    }),
    getPlanReward({
      id: 'plan-reward-2',
      title: 'Benefit Explorer',
      description: 'Awarded for exploring and using 3 different benefits',
      xpValue: 150,
      icon: 'gift',
      metadata: {
        category: 'benefit',
        planId: 'plan-123'
      }
    }),
    getPlanReward({
      id: 'plan-reward-3',
      title: 'Coverage Connoisseur',
      description: 'Awarded for reviewing and understanding your coverage details',
      xpValue: 125,
      icon: 'shield',
      metadata: {
        category: 'coverage',
        planId: 'plan-456'
      }
    }),
    getPlanReward({
      id: 'plan-reward-4',
      title: 'Document Master',
      description: 'Awarded for organizing and uploading all required insurance documents',
      xpValue: 150,
      icon: 'file-check',
      metadata: {
        category: 'documents'
      }
    }),
    getPlanReward({
      id: 'plan-reward-5',
      title: 'Cost Optimizer',
      description: 'Awarded for using the cost simulator to plan healthcare expenses',
      xpValue: 175,
      icon: 'calculator',
      metadata: {
        category: 'simulator'
      }
    })
  ];
}

/**
 * Creates a collection of global cross-journey rewards
 * 
 * @returns An array of global cross-journey rewards
 */
export function getGlobalRewards(): Reward[] {
  return [
    getGlobalReward({
      id: 'global-reward-1',
      title: 'Journey Explorer',
      description: 'Awarded for completing activities in all three journeys',
      xpValue: 300,
      icon: 'compass',
      metadata: {
        requiresAllJourneys: true,
        tier: 'silver'
      }
    }),
    getGlobalReward({
      id: 'global-reward-2',
      title: 'SuperApp Elite',
      description: 'Awarded for reaching level 10 in the gamification system',
      xpValue: 500,
      icon: 'crown',
      metadata: {
        requiresLevel: 10,
        tier: 'gold'
      }
    }),
    getGlobalReward({
      id: 'global-reward-3',
      title: 'Wellness Warrior',
      description: 'Awarded for maintaining a 30-day streak across all journeys',
      xpValue: 400,
      icon: 'fire',
      metadata: {
        requiresStreak: 30,
        tier: 'gold'
      }
    }),
    getGlobalReward({
      id: 'global-reward-4',
      title: 'Community Champion',
      description: 'Awarded for reaching the top 10 on the leaderboard',
      xpValue: 350,
      icon: 'users',
      metadata: {
        requiresLeaderboardRank: 10,
        tier: 'silver'
      }
    }),
    getGlobalReward({
      id: 'global-reward-5',
      title: 'Achievement Hunter',
      description: 'Awarded for unlocking 20 achievements across all journeys',
      xpValue: 450,
      icon: 'trophy',
      metadata: {
        requiresAchievements: 20,
        tier: 'platinum'
      }
    })
  ];
}

/**
 * Returns all reward fixtures
 * 
 * @returns An array of all reward fixtures
 */
export function getAllRewards(): Reward[] {
  return [
    ...getHealthRewards(),
    ...getCareRewards(),
    ...getPlanRewards(),
    ...getGlobalRewards()
  ];
}

/**
 * Returns rewards filtered by journey
 * 
 * @param journey - The journey to filter rewards by
 * @returns An array of rewards for the specified journey
 */
export function getRewardsByJourney(journey: Journey | 'global'): Reward[] {
  const allRewards = getAllRewards();
  return allRewards.filter(reward => reward.journey === journey);
}

/**
 * Returns rewards that can be redeemed (typically used for testing redemption flows)
 * 
 * @returns An array of redeemable rewards
 */
export function getRedeemableRewards(): Reward[] {
  return [
    getHealthReward({
      id: 'redeemable-health-reward',
      title: 'Premium Health Content',
      description: 'Unlock premium health articles and videos',
      xpValue: 200,
      metadata: {
        category: 'content',
        difficulty: 'easy',
        redeemable: true
      }
    }),
    getCareReward({
      id: 'redeemable-care-reward',
      title: 'Priority Appointment',
      description: 'Get priority scheduling for your next appointment',
      xpValue: 300,
      metadata: {
        category: 'appointment',
        redeemable: true
      }
    }),
    getPlanReward({
      id: 'redeemable-plan-reward',
      title: 'Insurance Discount',
      description: 'Receive a discount on your next premium payment',
      xpValue: 500,
      metadata: {
        category: 'discount',
        redeemable: true
      }
    }),
    getGlobalReward({
      id: 'redeemable-global-reward',
      title: 'SuperApp Premium',
      description: 'One month of premium features across all journeys',
      xpValue: 1000,
      metadata: {
        tier: 'platinum',
        redeemable: true
      }
    })
  ];
}

// ===== USER REWARD FIXTURES =====

/**
 * Creates a basic user reward fixture
 * 
 * @param profileId - The profile ID to associate with the user reward
 * @param rewardId - The reward ID to associate with the user reward
 * @returns A basic user reward fixture
 */
export function getBasicUserReward(profileId: string = uuidv4(), rewardId: string = getBasicReward().id): UserReward {
  return {
    id: uuidv4(),
    profileId,
    rewardId,
    earnedAt: new Date()
  };
}

/**
 * Creates a collection of user rewards for a specific profile
 * 
 * @param profileId - The profile ID to associate with the user rewards
 * @returns An array of user rewards for the specified profile
 */
export function getUserRewardsForProfile(profileId: string): UserReward[] {
  const rewards = getAllRewards().slice(0, 5); // Get first 5 rewards
  
  return rewards.map(reward => ({
    id: uuidv4(),
    profileId,
    rewardId: reward.id,
    earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
  }));
}

/**
 * Creates a collection of user rewards with different earned dates
 * 
 * @param profileId - The profile ID to associate with the user rewards
 * @returns An array of user rewards with different earned dates
 */
export function getUserRewardsWithDates(profileId: string): UserReward[] {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  return [
    {
      id: uuidv4(),
      profileId,
      rewardId: getHealthRewards()[0].id,
      earnedAt: new Date(now - 30 * dayInMs) // 30 days ago
    },
    {
      id: uuidv4(),
      profileId,
      rewardId: getCareRewards()[0].id,
      earnedAt: new Date(now - 14 * dayInMs) // 14 days ago
    },
    {
      id: uuidv4(),
      profileId,
      rewardId: getPlanRewards()[0].id,
      earnedAt: new Date(now - 7 * dayInMs) // 7 days ago
    },
    {
      id: uuidv4(),
      profileId,
      rewardId: getGlobalRewards()[0].id,
      earnedAt: new Date(now - 1 * dayInMs) // 1 day ago
    },
    {
      id: uuidv4(),
      profileId,
      rewardId: getHealthRewards()[1].id,
      earnedAt: new Date() // Today
    }
  ];
}

/**
 * Creates a collection of user rewards for journey-specific testing
 * 
 * @param profileId - The profile ID to associate with the user rewards
 * @param journey - The journey to create user rewards for
 * @returns An array of user rewards for the specified journey
 */
export function getJourneyUserRewards(profileId: string, journey: JourneyType): UserReward[] {
  let rewards: Reward[];
  
  switch (journey) {
    case 'health':
      rewards = getHealthRewards();
      break;
    case 'care':
      rewards = getCareRewards();
      break;
    case 'plan':
      rewards = getPlanRewards();
      break;
    case 'global':
      rewards = getGlobalRewards();
      break;
    default:
      rewards = [];
  }
  
  return rewards.map(reward => ({
    id: uuidv4(),
    profileId,
    rewardId: reward.id,
    earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
  }));
}

/**
 * Returns all user reward fixtures
 * 
 * @returns An array of all user reward fixtures
 */
export function getAllUserRewards(): UserReward[] {
  const profileIds = [
    'profile-1',
    'profile-2',
    'profile-3'
  ];
  
  return profileIds.flatMap(profileId => [
    ...getJourneyUserRewards(profileId, 'health'),
    ...getJourneyUserRewards(profileId, 'care'),
    ...getJourneyUserRewards(profileId, 'plan'),
    ...getJourneyUserRewards(profileId, 'global')
  ]);
}

/**
 * Returns user rewards filtered by journey
 * 
 * @param journey - The journey to filter user rewards by
 * @returns An array of user rewards for the specified journey
 */
export function getUserRewardsByJourney(journey: Journey | 'global'): UserReward[] {
  const allUserRewards = getAllUserRewards();
  const journeyRewardIds = getRewardsByJourney(journey).map(reward => reward.id);
  
  return allUserRewards.filter(userReward => journeyRewardIds.includes(userReward.rewardId));
}

/**
 * Returns user rewards that haven't been redeemed yet
 * 
 * @returns An array of unredeemed user rewards
 */
export function getUnredeemedUserRewards(): UserReward[] {
  const profileId = 'profile-redemption-test';
  const redeemableRewards = getRedeemableRewards();
  
  return redeemableRewards.map(reward => ({
    id: uuidv4(),
    profileId,
    rewardId: reward.id,
    earnedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Random date within last 7 days
  }));
}

/**
 * Creates user rewards with full details (including reward and profile information)
 * 
 * @param count - Number of user rewards to create
 * @returns An array of user rewards with details
 */
export function getUserRewardsWithDetails(count: number = 5): UserRewardWithDetails[] {
  const profileId = 'profile-details-test';
  const rewards = getAllRewards().slice(0, count);
  
  return rewards.map(reward => ({
    id: uuidv4(),
    profileId,
    rewardId: reward.id,
    earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    reward,
    profile: {
      id: profileId,
      userId: 'user-details-test'
    }
  }));
}

/**
 * Creates a set of user rewards for testing reward distribution mechanisms
 * 
 * @returns An array of user rewards for distribution testing
 */
export function getRewardDistributionFixtures(): UserReward[] {
  const profileIds = ['profile-dist-1', 'profile-dist-2', 'profile-dist-3'];
  const rewards = [
    ...getHealthRewards().slice(0, 2),
    ...getCareRewards().slice(0, 2),
    ...getPlanRewards().slice(0, 2),
    ...getGlobalRewards().slice(0, 2)
  ];
  
  const userRewards: UserReward[] = [];
  
  // Create a distribution pattern where:
  // - profile-dist-1 has rewards from all journeys
  // - profile-dist-2 has only health and care rewards
  // - profile-dist-3 has only plan and global rewards
  
  // Profile 1 - all journeys
  rewards.forEach(reward => {
    userRewards.push({
      id: uuidv4(),
      profileId: profileIds[0],
      rewardId: reward.id,
      earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });
  });
  
  // Profile 2 - health and care only
  rewards.filter(r => r.journey === 'health' || r.journey === 'care').forEach(reward => {
    userRewards.push({
      id: uuidv4(),
      profileId: profileIds[1],
      rewardId: reward.id,
      earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });
  });
  
  // Profile 3 - plan and global only
  rewards.filter(r => r.journey === 'plan' || r.journey === 'global').forEach(reward => {
    userRewards.push({
      id: uuidv4(),
      profileId: profileIds[2],
      rewardId: reward.id,
      earnedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });
  });
  
  return userRewards;
}

/**
 * Creates a set of user rewards for testing reward notification systems
 * 
 * @returns An array of user rewards for notification testing
 */
export function getRewardNotificationFixtures(): UserReward[] {
  const profileId = 'profile-notification-test';
  const now = new Date();
  
  // Create rewards earned at specific times for notification testing
  return [
    // Just earned (for immediate notification)
    {
      id: 'notification-reward-1',
      profileId,
      rewardId: getHealthRewards()[0].id,
      earnedAt: now
    },
    // Earned 1 hour ago (for digest notification)
    {
      id: 'notification-reward-2',
      profileId,
      rewardId: getCareRewards()[0].id,
      earnedAt: new Date(now.getTime() - 60 * 60 * 1000)
    },
    // Earned 1 day ago (for daily digest)
    {
      id: 'notification-reward-3',
      profileId,
      rewardId: getPlanRewards()[0].id,
      earnedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    },
    // Earned 1 week ago (for weekly digest)
    {
      id: 'notification-reward-4',
      profileId,
      rewardId: getGlobalRewards()[0].id,
      earnedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  ];
}