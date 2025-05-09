/**
 * @file plan-journey-scenarios.ts
 * @description Test scenarios for the Plan journey in the gamification system.
 * 
 * This file provides fixtures that simulate users managing insurance claims,
 * exploring benefits, and comparing plans, triggering gamification events,
 * and earning achievements. These scenarios combine user profiles, plan events,
 * rules, achievements, and rewards to test the complete gamification flow for
 * the Plan journey.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

// Import interfaces from the gamification package
import {
  GamificationEvent,
  EventType,
  PlanEventType,
  CommonEventType,
  ClaimSubmittedPayload,
  BenefitUtilizedPayload,
  PlanSelectedPayload,
  RewardRedeemedPayload,
  createEvent,
  EventPayload,
  JourneyType
} from '@austa/interfaces/gamification';

/**
 * Interface for a Plan journey test scenario.
 * Includes all the necessary data for testing a complete flow.
 */
export interface PlanJourneyScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Descriptive name of the scenario */
  name: string;
  
  /** User ID for the scenario */
  userId: string;
  
  /** Sequence of events that make up the scenario */
  events: GamificationEvent[];
  
  /** Expected achievements to be unlocked */
  expectedAchievements?: string[];
  
  /** Expected XP to be earned */
  expectedXp?: number;
  
  /** Expected rewards to be unlocked */
  expectedRewards?: string[];
  
  /** Additional metadata for the scenario */
  metadata?: Record<string, any>;
}

/**
 * Creates a scenario for a user submitting their first insurance claim.
 * Tests the "First Claim" achievement and related gamification rules.
 */
export function createFirstClaimScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  const yesterday = subDays(now, 1);
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [
    // User views their plan details
    createEvent<Record<string, any>>(
      PlanEventType.PLAN_VIEWED,
      userId,
      {
        data: {
          planId: 'plan-123',
          planType: 'Premium',
          viewedAt: format(subDays(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        },
        metadata: {
          source: 'mobile-app'
        }
      },
      JourneyType.PLAN
    ),
    
    // User checks their coverage
    createEvent<Record<string, any>>(
      PlanEventType.COVERAGE_CHECKED,
      userId,
      {
        data: {
          coverageType: 'medical',
          checkedAt: format(subDays(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        },
        metadata: {
          source: 'mobile-app'
        }
      },
      JourneyType.PLAN
    ),
    
    // User uploads a document for their claim
    createEvent<Record<string, any>>(
      PlanEventType.DOCUMENT_UPLOADED,
      userId,
      {
        data: {
          documentId: 'doc-456',
          documentType: 'receipt',
          uploadedAt: format(yesterday, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        },
        metadata: {
          fileSize: 1024 * 1024, // 1MB
          fileType: 'application/pdf'
        }
      },
      JourneyType.PLAN
    ),
    
    // User submits their first claim
    createEvent<ClaimSubmittedPayload>(
      PlanEventType.CLAIM_SUBMITTED,
      userId,
      {
        data: {
          claimId: 'claim-789',
          amount: 150.00,
          claimType: 'medical',
          submittedAt: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          hasDocuments: true,
          isFirstClaim: true
        },
        metadata: {
          completeness: 100, // Percentage of required fields completed
          channel: 'mobile-app'
        }
      },
      JourneyType.PLAN
    )
  ];
  
  return {
    id: `first-claim-${uuidv4()}`,
    name: 'First Claim Submission',
    userId,
    events,
    expectedAchievements: ['claim-master-level-1'],
    expectedXp: 50,
    metadata: {
      description: 'User submits their first insurance claim with all required documentation',
      testTags: ['plan-journey', 'claims', 'first-time-user']
    }
  };
}

/**
 * Creates a scenario for a user submitting multiple claims over time.
 * Tests the progression through multiple levels of the "Claim Master" achievement.
 */
export function createClaimMasterProgressionScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [];
  
  // Add 5 claim submissions over the past 30 days
  for (let i = 0; i < 5; i++) {
    const claimDate = subDays(now, i * 6); // Every 6 days
    const claimId = `claim-${i + 1}`;
    const amount = 100 + (i * 50); // Increasing amounts
    
    // Add document upload before each claim
    events.push(
      createEvent<Record<string, any>>(
        PlanEventType.DOCUMENT_UPLOADED,
        userId,
        {
          data: {
            documentId: `doc-${i + 1}`,
            documentType: 'receipt',
            uploadedAt: format(subDays(claimDate, 1), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
          },
          metadata: {
            fileSize: 1024 * 1024, // 1MB
            fileType: 'application/pdf'
          }
        },
        JourneyType.PLAN
      )
    );
    
    // Add the claim submission event
    events.push(
      createEvent<ClaimSubmittedPayload>(
        PlanEventType.CLAIM_SUBMITTED,
        userId,
        {
          data: {
            claimId,
            amount,
            claimType: i % 2 === 0 ? 'medical' : 'dental',
            submittedAt: format(claimDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
            hasDocuments: true,
            isFirstClaim: i === 0
          },
          metadata: {
            completeness: 100, // Percentage of required fields completed
            channel: 'mobile-app'
          }
        },
        JourneyType.PLAN
      )
    );
    
    // Add claim approval events for the first 4 claims
    if (i < 4) {
      events.push(
        createEvent<Record<string, any>>(
          PlanEventType.CLAIM_APPROVED,
          userId,
          {
            data: {
              claimId,
              amount,
              approvedAt: format(addDays(claimDate, 3), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
              reimbursementAmount: amount * 0.8 // 80% coverage
            },
            metadata: {
              processingTime: '3 days',
              approvedBy: 'system'
            }
          },
          JourneyType.PLAN
        )
      );
    }
  }
  
  return {
    id: `claim-master-progression-${uuidv4()}`,
    name: 'Claim Master Achievement Progression',
    userId,
    events,
    expectedAchievements: ['claim-master-level-1', 'claim-master-level-2', 'claim-master-level-3'],
    expectedXp: 200, // 50 + 75 + 75 for the three levels
    metadata: {
      description: 'User submits multiple claims over time, progressing through all levels of the Claim Master achievement',
      testTags: ['plan-journey', 'claims', 'achievement-progression']
    }
  };
}

/**
 * Creates a scenario for a user exploring benefits and utilizing them.
 * Tests the "Benefit Explorer" achievement and related gamification rules.
 */
export function createBenefitExplorerScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [];
  
  // User views different benefits over a week
  const benefitTypes = [
    'preventive-care',
    'specialist-visits',
    'prescription-drugs',
    'emergency-care',
    'mental-health',
    'vision',
    'dental'
  ];
  
  // Add benefit viewed events
  benefitTypes.forEach((benefitType, index) => {
    const viewDate = subDays(now, 7 - index); // Spread over a week
    
    events.push(
      createEvent<BenefitUtilizedPayload>(
        PlanEventType.BENEFIT_VIEWED,
        userId,
        {
          data: {
            benefitId: `benefit-${index + 1}`,
            benefitType,
            utilizedAt: format(viewDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
            isFirstUtilization: index === 0
          },
          metadata: {
            viewDuration: 60 + (index * 10), // Seconds spent viewing
            source: index % 2 === 0 ? 'mobile-app' : 'web-app'
          }
        },
        JourneyType.PLAN
      )
    );
  });
  
  return {
    id: `benefit-explorer-${uuidv4()}`,
    name: 'Benefit Explorer Achievement',
    userId,
    events,
    expectedAchievements: ['benefit-explorer-level-1', 'benefit-explorer-level-2'],
    expectedXp: 125, // 50 + 75 for the two levels
    metadata: {
      description: 'User explores various benefits available in their insurance plan',
      testTags: ['plan-journey', 'benefits', 'exploration']
    }
  };
}

/**
 * Creates a scenario for a user comparing and selecting a new insurance plan.
 * Tests the "Plan Optimizer" achievement and related gamification rules.
 */
export function createPlanOptimizerScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [];
  
  // User views their current plan
  events.push(
    createEvent<Record<string, any>>(
      PlanEventType.PLAN_VIEWED,
      userId,
      {
        data: {
          planId: 'plan-current',
          planType: 'Standard',
          viewedAt: format(subDays(now, 3), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        },
        metadata: {
          source: 'web-app',
          viewDuration: 120 // seconds
        }
      },
      JourneyType.PLAN
    )
  );
  
  // User compares different plans
  const planComparisons = [
    { planId: 'plan-basic', planType: 'Basic' },
    { planId: 'plan-standard', planType: 'Standard' },
    { planId: 'plan-premium', planType: 'Premium' }
  ];
  
  // Add plan comparison events
  events.push(
    createEvent<Record<string, any>>(
      PlanEventType.PLAN_COMPARED,
      userId,
      {
        data: {
          plans: planComparisons,
          comparedAt: format(subDays(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
        },
        metadata: {
          source: 'web-app',
          comparisonDuration: 300 // seconds
        }
      },
      JourneyType.PLAN
    )
  );
  
  // User selects a new plan
  events.push(
    createEvent<PlanSelectedPayload>(
      PlanEventType.PLAN_SELECTED,
      userId,
      {
        data: {
          planId: 'plan-premium',
          planType: 'Premium',
          selectedAt: format(subDays(now, 1), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          coverageLevel: 'family',
          annualCost: 5000,
          isNewEnrollment: false
        },
        metadata: {
          source: 'web-app',
          previousPlan: 'Standard'
        }
      },
      JourneyType.PLAN
    )
  );
  
  return {
    id: `plan-optimizer-${uuidv4()}`,
    name: 'Plan Optimizer Achievement',
    userId,
    events,
    expectedAchievements: ['plan-optimizer-level-1'],
    expectedXp: 75,
    metadata: {
      description: 'User compares different insurance plans and selects a new one',
      testTags: ['plan-journey', 'plan-selection', 'comparison']
    }
  };
}

/**
 * Creates a scenario for a user redeeming rewards earned through the Plan journey.
 * Tests the reward redemption flow and related gamification rules.
 */
export function createRewardRedemptionScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [];
  
  // User has already earned some achievements and XP
  // Now they're redeeming a reward
  events.push(
    createEvent<RewardRedeemedPayload>(
      CommonEventType.REWARD_REDEEMED,
      userId,
      {
        data: {
          rewardId: 'reward-123',
          rewardName: 'Premium Plan Discount',
          redeemedAt: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          value: 50, // $50 discount
          rewardType: 'discount'
        },
        metadata: {
          source: 'mobile-app',
          xpCost: 500, // XP spent to redeem this reward
          journeyOrigin: 'plan'
        }
      },
      JourneyType.PLAN
    )
  );
  
  // User applies the reward to their plan
  events.push(
    createEvent<Record<string, any>>(
      PlanEventType.PLAN_SELECTED,
      userId,
      {
        data: {
          planId: 'plan-premium',
          planType: 'Premium',
          selectedAt: format(addDays(now, 1), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          coverageLevel: 'family',
          annualCost: 4950, // Discounted by $50
          isNewEnrollment: false
        },
        metadata: {
          source: 'mobile-app',
          previousPlan: 'Premium',
          appliedReward: 'reward-123'
        }
      },
      JourneyType.PLAN
    )
  );
  
  return {
    id: `reward-redemption-${uuidv4()}`,
    name: 'Plan Reward Redemption',
    userId,
    events,
    expectedAchievements: ['reward-redeemer-level-1'],
    expectedXp: -500, // XP is spent to redeem the reward
    expectedRewards: ['reward-123'],
    metadata: {
      description: 'User redeems a reward earned through the Plan journey',
      testTags: ['plan-journey', 'rewards', 'redemption']
    }
  };
}

/**
 * Creates a comprehensive scenario that combines multiple Plan journey activities.
 * Tests the integration between different Plan journey features and achievements.
 */
export function createComprehensivePlanJourneyScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  let events: GamificationEvent[] = [];
  
  // Start with plan exploration
  const planScenario = createPlanOptimizerScenario();
  events = events.concat(planScenario.events.map(event => ({
    ...event,
    userId
  })));
  
  // Add benefit exploration
  const benefitScenario = createBenefitExplorerScenario();
  events = events.concat(benefitScenario.events.map(event => ({
    ...event,
    userId
  })));
  
  // Add claim submissions
  const claimScenario = createClaimMasterProgressionScenario();
  events = events.concat(claimScenario.events.map(event => ({
    ...event,
    userId
  })));
  
  // Finally, add reward redemption
  const rewardScenario = createRewardRedemptionScenario();
  events = events.concat(rewardScenario.events.map(event => ({
    ...event,
    userId
  })));
  
  // Sort events by timestamp to ensure proper chronological order
  events.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  });
  
  return {
    id: `comprehensive-plan-journey-${uuidv4()}`,
    name: 'Comprehensive Plan Journey',
    userId,
    events,
    expectedAchievements: [
      'plan-optimizer-level-1',
      'benefit-explorer-level-1',
      'benefit-explorer-level-2',
      'claim-master-level-1',
      'claim-master-level-2',
      'claim-master-level-3',
      'reward-redeemer-level-1',
      'plan-journey-master' // Special achievement for completing multiple Plan journey activities
    ],
    expectedXp: 400, // Combined XP from all scenarios minus reward redemption cost
    expectedRewards: ['reward-123'],
    metadata: {
      description: 'User completes a comprehensive journey through the Plan features, earning multiple achievements',
      testTags: ['plan-journey', 'comprehensive', 'integration-test']
    }
  };
}

/**
 * Creates a scenario for testing edge cases in the Plan journey.
 * Includes unusual event sequences, missing data, and boundary conditions.
 */
export function createPlanJourneyEdgeCaseScenario(): PlanJourneyScenario {
  const userId = `user-${uuidv4()}`;
  const now = new Date();
  
  // Create a sequence of events for the scenario
  const events: GamificationEvent[] = [];
  
  // Edge case 1: Claim rejected
  events.push(
    createEvent<ClaimSubmittedPayload>(
      PlanEventType.CLAIM_SUBMITTED,
      userId,
      {
        data: {
          claimId: 'claim-edge-1',
          amount: 1000.00,
          claimType: 'medical',
          submittedAt: format(subDays(now, 10), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          hasDocuments: false, // Missing documents
          isFirstClaim: true
        },
        metadata: {
          completeness: 70, // Incomplete claim
          channel: 'web-app'
        }
      },
      JourneyType.PLAN
    )
  );
  
  events.push(
    createEvent<Record<string, any>>(
      PlanEventType.CLAIM_REJECTED,
      userId,
      {
        data: {
          claimId: 'claim-edge-1',
          rejectedAt: format(subDays(now, 7), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          reason: 'Missing documentation'
        },
        metadata: {
          processingTime: '3 days',
          rejectedBy: 'system'
        }
      },
      JourneyType.PLAN
    )
  );
  
  // Edge case 2: Extremely high claim amount
  events.push(
    createEvent<ClaimSubmittedPayload>(
      PlanEventType.CLAIM_SUBMITTED,
      userId,
      {
        data: {
          claimId: 'claim-edge-2',
          amount: 50000.00, // Very high amount
          claimType: 'hospital',
          submittedAt: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          hasDocuments: true,
          isFirstClaim: false
        },
        metadata: {
          completeness: 100,
          channel: 'mobile-app'
        }
      },
      JourneyType.PLAN
    )
  );
  
  // Edge case 3: Multiple plan selections in a short period
  for (let i = 0; i < 3; i++) {
    events.push(
      createEvent<PlanSelectedPayload>(
        PlanEventType.PLAN_SELECTED,
        userId,
        {
          data: {
            planId: `plan-edge-${i + 1}`,
            planType: i === 0 ? 'Basic' : i === 1 ? 'Standard' : 'Premium',
            selectedAt: format(subDays(now, 2 - i), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
            coverageLevel: 'individual',
            annualCost: 2000 + (i * 1500),
            isNewEnrollment: i === 0
          },
          metadata: {
            source: 'web-app',
            previousPlan: i === 0 ? null : i === 1 ? 'Basic' : 'Standard'
          }
        },
        JourneyType.PLAN
      )
    );
  }
  
  return {
    id: `plan-journey-edge-cases-${uuidv4()}`,
    name: 'Plan Journey Edge Cases',
    userId,
    events,
    expectedAchievements: ['claim-master-level-1'], // Only level 1 despite multiple claims due to rejection
    expectedXp: 100, // Reduced XP due to edge cases
    metadata: {
      description: 'Tests edge cases in the Plan journey including rejected claims and unusual behavior',
      testTags: ['plan-journey', 'edge-cases', 'error-handling']
    }
  };
}

/**
 * Exports all Plan journey scenarios for use in tests.
 */
export const planJourneyScenarios = {
  firstClaim: createFirstClaimScenario,
  claimMasterProgression: createClaimMasterProgressionScenario,
  benefitExplorer: createBenefitExplorerScenario,
  planOptimizer: createPlanOptimizerScenario,
  rewardRedemption: createRewardRedemptionScenario,
  comprehensive: createComprehensivePlanJourneyScenario,
  edgeCases: createPlanJourneyEdgeCaseScenario
};