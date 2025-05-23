/**
 * @file plan-events.fixtures.ts
 * @description Test fixtures for Plan journey events, including claim submission,
 * benefit utilization, plan selection/comparison, and reward redemption events.
 * These fixtures provide structured test data for validating plan-related event
 * processing in the gamification engine.
 */

import { 
  EventJourney,
  EventType,
  GamificationEvent,
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload
} from '@austa/interfaces/gamification/events';

/**
 * Base event fixture with common properties
 */
const baseEventFixture = {
  version: { major: 1, minor: 0, patch: 0 },
  source: 'plan-service',
  journey: EventJourney.PLAN,
  createdAt: new Date().toISOString(),
};

/**
 * Generates a unique event ID for test fixtures
 * @returns A unique event ID string
 */
const generateEventId = (): string => {
  return `event-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
};

/**
 * Claim Submission Event Fixtures
 * 
 * These fixtures represent events generated when a user submits an insurance claim.
 * They are used to test gamification rules related to claim submission activities.
 */
export const claimSubmissionEvents: GamificationEvent[] = [
  // Standard claim submission event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.CLAIM_SUBMITTED,
    userId: 'user-123',
    payload: {
      timestamp: new Date().toISOString(),
      claimId: 'claim-456',
      claimType: 'Consulta Médica',
      amount: 150.00,
      metadata: {
        isFirstClaim: false,
        completeness: 0.95,
        submissionMethod: 'mobile'
      }
    } as ClaimEventPayload
  },
  
  // First-time claim submission event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.CLAIM_SUBMITTED,
    userId: 'user-456',
    payload: {
      timestamp: new Date().toISOString(),
      claimId: 'claim-789',
      claimType: 'Exame',
      amount: 350.00,
      metadata: {
        isFirstClaim: true,
        completeness: 1.0,
        submissionMethod: 'web'
      }
    } as ClaimEventPayload
  },
  
  // Claim approval event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.CLAIM_APPROVED,
    userId: 'user-123',
    payload: {
      timestamp: new Date().toISOString(),
      claimId: 'claim-456',
      claimType: 'Consulta Médica',
      amount: 150.00,
      metadata: {
        approvalTime: '48h',
        reimbursementMethod: 'bank_transfer',
        reimbursementETA: '5d'
      }
    } as ClaimEventPayload
  },
  
  // Claim document upload event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.CLAIM_DOCUMENT_UPLOADED,
    userId: 'user-789',
    payload: {
      timestamp: new Date().toISOString(),
      claimId: 'claim-101',
      claimType: 'Internação',
      documentCount: 3,
      metadata: {
        documentTypes: ['receipt', 'medical_report', 'prescription'],
        totalSizeKB: 2540,
        uploadMethod: 'mobile_camera'
      }
    } as ClaimEventPayload
  },
  
  // High-value claim submission event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.CLAIM_SUBMITTED,
    userId: 'user-321',
    payload: {
      timestamp: new Date().toISOString(),
      claimId: 'claim-202',
      claimType: 'Internação',
      amount: 5000.00,
      metadata: {
        isFirstClaim: false,
        completeness: 1.0,
        submissionMethod: 'web',
        hospitalStayDays: 3,
        emergencyAdmission: true
      }
    } as ClaimEventPayload
  }
];

/**
 * Benefit Utilization Event Fixtures
 * 
 * These fixtures represent events generated when a user utilizes an insurance benefit.
 * They are used to test gamification rules related to benefit usage tracking.
 */
export const benefitUtilizationEvents: GamificationEvent[] = [
  // Standard benefit utilization event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.BENEFIT_UTILIZED,
    userId: 'user-123',
    payload: {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit-456',
      benefitType: 'Dental',
      value: 120.00,
      metadata: {
        utilizationMethod: 'in_network',
        providerName: 'Clínica Odontológica Central',
        remainingCoverage: 880.00,
        annualLimit: 1000.00
      }
    } as BenefitUtilizedPayload
  },
  
  // First-time benefit utilization event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.BENEFIT_UTILIZED,
    userId: 'user-456',
    payload: {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit-789',
      benefitType: 'Vision',
      value: 350.00,
      metadata: {
        isFirstUtilization: true,
        utilizationMethod: 'out_of_network',
        providerName: 'Ótica Visão Clara',
        remainingCoverage: 150.00,
        annualLimit: 500.00,
        itemPurchased: 'prescription_glasses'
      }
    } as BenefitUtilizedPayload
  },
  
  // Preventive care benefit utilization
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.BENEFIT_UTILIZED,
    userId: 'user-789',
    payload: {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit-101',
      benefitType: 'Preventive',
      value: 0.00, // Fully covered preventive care
      metadata: {
        utilizationMethod: 'in_network',
        providerName: 'Centro Médico Preventivo',
        serviceType: 'annual_checkup',
        coveragePercentage: 100,
        preventiveCareCategory: 'routine_physical'
      }
    } as BenefitUtilizedPayload
  },
  
  // Wellness program benefit utilization
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.BENEFIT_UTILIZED,
    userId: 'user-321',
    payload: {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit-202',
      benefitType: 'Wellness',
      value: 75.00,
      metadata: {
        utilizationMethod: 'reimbursement',
        programName: 'Gym Membership',
        remainingCoverage: 225.00,
        annualLimit: 300.00,
        facilityName: 'Academia Corpo em Forma',
        membershipPeriod: 'monthly'
      }
    } as BenefitUtilizedPayload
  },
  
  // Mental health benefit utilization
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.BENEFIT_UTILIZED,
    userId: 'user-654',
    payload: {
      timestamp: new Date().toISOString(),
      benefitId: 'benefit-303',
      benefitType: 'Mental Health',
      value: 200.00,
      metadata: {
        utilizationMethod: 'in_network',
        providerName: 'Centro de Saúde Mental',
        serviceType: 'therapy_session',
        remainingCoverage: 1800.00,
        annualLimit: 2000.00,
        sessionNumber: 3,
        treatmentPlan: 'ongoing'
      }
    } as BenefitUtilizedPayload
  }
];

/**
 * Plan Selection and Comparison Event Fixtures
 * 
 * These fixtures represent events generated when a user selects or compares insurance plans.
 * They are used to test gamification rules related to plan exploration and decision-making.
 */
export const planSelectionEvents: GamificationEvent[] = [
  // Standard plan selection event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.PLAN_SELECTED,
    userId: 'user-123',
    payload: {
      timestamp: new Date().toISOString(),
      planId: 'plan-456',
      planType: 'Standard',
      isUpgrade: false,
      metadata: {
        previousPlanId: null, // New enrollment
        monthlyPremium: 350.00,
        coverageStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        selectionMethod: 'web',
        familySize: 1
      }
    } as PlanEventPayload
  },
  
  // Plan upgrade selection event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.PLAN_SELECTED,
    userId: 'user-456',
    payload: {
      timestamp: new Date().toISOString(),
      planId: 'plan-789',
      planType: 'Premium',
      isUpgrade: true,
      metadata: {
        previousPlanId: 'plan-555',
        previousPlanType: 'Standard',
        monthlyPremium: 550.00,
        previousMonthlyPremium: 350.00,
        coverageStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        selectionMethod: 'mobile',
        familySize: 2,
        upgradeTrigger: 'life_event'
      }
    } as PlanEventPayload
  },
  
  // Plan comparison event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.PLAN_COMPARED,
    userId: 'user-789',
    payload: {
      timestamp: new Date().toISOString(),
      planId: 'plan-current', // Current plan being compared
      planType: 'Standard',
      comparedPlanIds: ['plan-101', 'plan-202', 'plan-303'],
      metadata: {
        comparedPlanTypes: ['Básico', 'Standard', 'Premium'],
        comparisonCategories: ['price', 'coverage', 'network', 'benefits'],
        timeSpentMinutes: 12,
        comparisonMethod: 'web',
        comparisonSessionId: 'session-404'
      }
    } as PlanEventPayload
  },
  
  // Plan renewal event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.PLAN_RENEWED,
    userId: 'user-321',
    payload: {
      timestamp: new Date().toISOString(),
      planId: 'plan-505',
      planType: 'Premium',
      isUpgrade: false,
      metadata: {
        renewalType: 'automatic',
        previousTerm: '1 year',
        newTerm: '1 year',
        monthlyPremium: 550.00,
        previousMonthlyPremium: 520.00, // Small increase
        coverageStartDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        yearsWithPlan: 2
      }
    } as PlanEventPayload
  },
  
  // Coverage review event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.COVERAGE_REVIEWED,
    userId: 'user-654',
    payload: {
      timestamp: new Date().toISOString(),
      planId: 'plan-606',
      planType: 'Standard',
      metadata: {
        reviewMethod: 'mobile',
        reviewDurationSeconds: 180,
        coverageCategories: ['medical', 'dental', 'vision', 'pharmacy'],
        detailedViewAccessed: true,
        documentsDownloaded: ['coverage_summary', 'network_providers']
      }
    } as PlanEventPayload
  }
];

/**
 * Reward Redemption Event Fixtures
 * 
 * These fixtures represent events generated when a user redeems rewards in the Plan journey.
 * They are used to test gamification rules related to reward utilization.
 */
export const rewardRedemptionEvents: GamificationEvent[] = [
  // Standard reward redemption event
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.REWARD_REDEEMED,
    userId: 'user-123',
    payload: {
      timestamp: new Date().toISOString(),
      metadata: {
        rewardId: 'reward-456',
        rewardType: 'discount',
        rewardValue: 50.00,
        rewardName: 'Premium Discount',
        redemptionMethod: 'web',
        pointsUsed: 1000,
        remainingPoints: 500,
        appliedTo: 'monthly_premium',
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      }
    }
  },
  
  // Wellness program reward redemption
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.REWARD_REDEEMED,
    userId: 'user-456',
    payload: {
      timestamp: new Date().toISOString(),
      metadata: {
        rewardId: 'reward-789',
        rewardType: 'service',
        rewardValue: 0, // Non-monetary value
        rewardName: 'Free Wellness Consultation',
        redemptionMethod: 'mobile',
        pointsUsed: 2000,
        remainingPoints: 1500,
        serviceProvider: 'Wellness Center',
        appointmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      }
    }
  },
  
  // Gift card reward redemption
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.REWARD_REDEEMED,
    userId: 'user-789',
    payload: {
      timestamp: new Date().toISOString(),
      metadata: {
        rewardId: 'reward-101',
        rewardType: 'gift_card',
        rewardValue: 100.00,
        rewardName: 'Pharmacy Gift Card',
        redemptionMethod: 'web',
        pointsUsed: 3000,
        remainingPoints: 500,
        merchantName: 'Farmácia Popular',
        giftCardCode: 'XXXX-XXXX-XXXX-1234',
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days from now
      }
    }
  },
  
  // Premium feature access reward redemption
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.REWARD_REDEEMED,
    userId: 'user-321',
    payload: {
      timestamp: new Date().toISOString(),
      metadata: {
        rewardId: 'reward-202',
        rewardType: 'feature_access',
        rewardValue: 0, // Non-monetary value
        rewardName: 'Premium Telemedicine Access',
        redemptionMethod: 'mobile',
        pointsUsed: 5000,
        remainingPoints: 2500,
        featureDescription: 'Unlimited telemedicine consultations for 3 months',
        accessDuration: '3 months',
        activationDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      }
    }
  },
  
  // Physical reward redemption
  {
    ...baseEventFixture,
    eventId: generateEventId(),
    type: EventType.REWARD_REDEEMED,
    userId: 'user-654',
    payload: {
      timestamp: new Date().toISOString(),
      metadata: {
        rewardId: 'reward-303',
        rewardType: 'physical',
        rewardValue: 0, // Non-monetary value
        rewardName: 'Fitness Tracker',
        redemptionMethod: 'web',
        pointsUsed: 10000,
        remainingPoints: 1000,
        shippingAddress: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        estimatedDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        trackingCode: 'BR1234567890'
      }
    }
  }
];

/**
 * Combined export of all Plan journey event fixtures
 */
export const planJourneyEvents = {
  claimSubmissionEvents,
  benefitUtilizationEvents,
  planSelectionEvents,
  rewardRedemptionEvents,
};

/**
 * Default export for all Plan journey event fixtures
 */
export default planJourneyEvents;