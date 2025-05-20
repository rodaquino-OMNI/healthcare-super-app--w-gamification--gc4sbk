/**
 * @file plan-events.fixtures.ts
 * @description Contains test fixtures for Plan journey events, including claim submission,
 * benefit utilization, plan selection/comparison, and reward redemption. These fixtures provide
 * structured test data for validating plan-related event processing, with realistic insurance
 * and benefits information for comprehensive event testing.
 *
 * @module events/test/unit/fixtures
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto } from '../../../src/dto/event-metadata.dto';
import { v4 as uuidv4 } from 'uuid';

// Common user IDs for consistent testing
const TEST_USER_IDS = {
  standard: '550e8400-e29b-41d4-a716-446655440000',
  premium: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  family: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  senior: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
};

// Common provider IDs for consistent testing
const TEST_PROVIDER_IDS = {
  hospital: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
  clinic: '7ba7b811-9dad-11d1-80b4-00c04fd430c8',
  laboratory: '7ba7b812-9dad-11d1-80b4-00c04fd430c8',
  pharmacy: '7ba7b813-9dad-11d1-80b4-00c04fd430c8',
  specialist: '7ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

// Common plan IDs for consistent testing
const TEST_PLAN_IDS = {
  basic: '8ba7b810-9dad-11d1-80b4-00c04fd430c8',
  standard: '8ba7b811-9dad-11d1-80b4-00c04fd430c8',
  premium: '8ba7b812-9dad-11d1-80b4-00c04fd430c8',
};

/**
 * Creates standard event metadata for plan journey events.
 * 
 * @param options Optional overrides for metadata properties
 * @returns EventMetadataDto instance with plan journey defaults
 */
export function createPlanEventMetadata(options: Partial<EventMetadataDto> = {}): EventMetadataDto {
  const origin = new EventOriginDto();
  origin.service = 'plan-service';
  origin.component = options.origin?.component || 'event-processor';
  
  const version = new EventVersionDto();
  version.major = '1';
  version.minor = '0';
  version.patch = '0';
  
  return new EventMetadataDto({
    eventId: uuidv4(),
    correlationId: options.correlationId || uuidv4(),
    timestamp: options.timestamp || new Date(),
    origin,
    version,
    ...options,
  });
}

/**
 * Base interface for all plan journey events.
 */
export interface BasePlanEvent {
  type: EventType;
  userId: string;
  metadata: EventMetadataDto;
}

/**
 * Interface for claim submission event payload.
 */
export interface ClaimSubmissionPayload {
  claimId: string;
  claimType: string;
  providerId: string;
  serviceDate: string;
  amount: number;
  submittedAt: string;
  documentIds?: string[];
  description?: string;
  category?: string;
  urgent?: boolean;
}

/**
 * Interface for claim processed event payload.
 */
export interface ClaimProcessedPayload {
  claimId: string;
  status: 'approved' | 'denied' | 'partial' | 'pending_review' | 'pending_documentation';
  amount: number;
  coveredAmount: number;
  processedAt: string;
  reviewerId?: string;
  denialReason?: string;
  appealEligible?: boolean;
  paymentDate?: string;
}

/**
 * Interface for plan selection event payload.
 */
export interface PlanSelectionPayload {
  planId: string;
  planType: string;
  coverageLevel: string;
  premium: number;
  startDate: string;
  selectedAt: string;
  previousPlanId?: string;
  deductible?: number;
  coinsurance?: number;
  outOfPocketMax?: number;
  comparisonFactors?: string[];
}

/**
 * Interface for benefit utilization event payload.
 */
export interface BenefitUtilizationPayload {
  benefitId: string;
  benefitType: string;
  providerId?: string;
  utilizationDate: string;
  savingsAmount?: number;
  remainingUtilizations?: number;
  annualLimit?: number;
  utilizationPercentage?: number;
  category?: string;
}

/**
 * Interface for reward redemption event payload.
 */
export interface RewardRedemptionPayload {
  rewardId: string;
  rewardType: string;
  pointsRedeemed: number;
  value: number;
  redeemedAt: string;
  expirationDate?: string;
  deliveryMethod?: string;
  status?: string;
  category?: string;
}

/**
 * Interface for document completion event payload.
 */
export interface DocumentCompletionPayload {
  documentId: string;
  documentType: string;
  completedAt: string;
  requiredFields?: string[];
  completionMethod?: string;
  verificationStatus?: string;
}

/**
 * Claim submission event fixtures for testing.
 */
export const claimSubmissionEvents = {
  /**
   * Valid claim submission event for a medical consultation.
   */
  valid: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.standard,
    payload: {
      claimId: uuidv4(),
      claimType: 'medical',
      providerId: TEST_PROVIDER_IDS.clinic,
      serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      amount: 150.00,
      submittedAt: new Date().toISOString(),
      documentIds: [uuidv4(), uuidv4()],
      description: 'General medical consultation',
      category: 'outpatient',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: ClaimSubmissionPayload },

  /**
   * Valid claim submission event for a laboratory test.
   */
  laboratory: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.standard,
    payload: {
      claimId: uuidv4(),
      claimType: 'laboratory',
      providerId: TEST_PROVIDER_IDS.laboratory,
      serviceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      amount: 350.00,
      submittedAt: new Date().toISOString(),
      documentIds: [uuidv4()],
      description: 'Blood panel and cholesterol test',
      category: 'diagnostic',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: ClaimSubmissionPayload },

  /**
   * Valid claim submission event for a hospital stay.
   */
  hospital: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.premium,
    payload: {
      claimId: uuidv4(),
      claimType: 'hospitalization',
      providerId: TEST_PROVIDER_IDS.hospital,
      serviceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      amount: 3500.00,
      submittedAt: new Date().toISOString(),
      documentIds: [uuidv4(), uuidv4(), uuidv4()],
      description: 'Emergency appendectomy with 2-day stay',
      category: 'inpatient',
      urgent: true,
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: ClaimSubmissionPayload },

  /**
   * Valid claim submission event for a pharmacy prescription.
   */
  pharmacy: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.family,
    payload: {
      claimId: uuidv4(),
      claimType: 'pharmacy',
      providerId: TEST_PROVIDER_IDS.pharmacy,
      serviceDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      amount: 75.50,
      submittedAt: new Date().toISOString(),
      documentIds: [uuidv4()],
      description: 'Antibiotic prescription',
      category: 'medication',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: ClaimSubmissionPayload },

  /**
   * Valid claim submission event for a specialist consultation.
   */
  specialist: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.senior,
    payload: {
      claimId: uuidv4(),
      claimType: 'specialist',
      providerId: TEST_PROVIDER_IDS.specialist,
      serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      amount: 250.00,
      submittedAt: new Date().toISOString(),
      documentIds: [uuidv4()],
      description: 'Cardiology consultation',
      category: 'specialist',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: ClaimSubmissionPayload },

  /**
   * Invalid claim submission event missing required fields.
   */
  invalid: {
    type: JourneyEvents.Plan.CLAIM_SUBMITTED,
    userId: TEST_USER_IDS.standard,
    payload: {
      claimId: uuidv4(),
      // Missing claimType
      providerId: TEST_PROVIDER_IDS.clinic,
      // Missing serviceDate
      amount: 150.00,
      submittedAt: new Date().toISOString(),
    } as any,
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  } as BasePlanEvent & { payload: Partial<ClaimSubmissionPayload> },
};

/**
 * Claim processed event fixtures for testing.
 */
export const claimProcessedEvents = {
  /**
   * Valid claim processed event with approved status.
   */
  approved: {
    type: JourneyEvents.Plan.CLAIM_PROCESSED,
    userId: TEST_USER_IDS.standard,
    payload: {
      claimId: claimSubmissionEvents.valid.payload.claimId,
      status: 'approved',
      amount: 150.00,
      coveredAmount: 120.00,
      processedAt: new Date().toISOString(),
      reviewerId: uuidv4(),
      paymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in future
    },
    metadata: createPlanEventMetadata({
      correlationId: claimSubmissionEvents.valid.metadata.correlationId,
      origin: { component: 'claim-processor' }
    }),
  } as BasePlanEvent & { payload: ClaimProcessedPayload },

  /**
   * Valid claim processed event with partial approval.
   */
  partial: {
    type: JourneyEvents.Plan.CLAIM_PROCESSED,
    userId: TEST_USER_IDS.premium,
    payload: {
      claimId: claimSubmissionEvents.hospital.payload.claimId,
      status: 'partial',
      amount: 3500.00,
      coveredAmount: 2800.00,
      processedAt: new Date().toISOString(),
      reviewerId: uuidv4(),
      paymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
    },
    metadata: createPlanEventMetadata({
      correlationId: claimSubmissionEvents.hospital.metadata.correlationId,
      origin: { component: 'claim-processor' }
    }),
  } as BasePlanEvent & { payload: ClaimProcessedPayload },

  /**
   * Valid claim processed event with denied status.
   */
  denied: {
    type: JourneyEvents.Plan.CLAIM_PROCESSED,
    userId: TEST_USER_IDS.family,
    payload: {
      claimId: claimSubmissionEvents.pharmacy.payload.claimId,
      status: 'denied',
      amount: 75.50,
      coveredAmount: 0.00,
      processedAt: new Date().toISOString(),
      reviewerId: uuidv4(),
      denialReason: 'Medication not covered under current plan',
      appealEligible: true,
    },
    metadata: createPlanEventMetadata({
      correlationId: claimSubmissionEvents.pharmacy.metadata.correlationId,
      origin: { component: 'claim-processor' }
    }),
  } as BasePlanEvent & { payload: ClaimProcessedPayload },

  /**
   * Valid claim processed event with pending documentation status.
   */
  pendingDocumentation: {
    type: JourneyEvents.Plan.CLAIM_PROCESSED,
    userId: TEST_USER_IDS.senior,
    payload: {
      claimId: claimSubmissionEvents.specialist.payload.claimId,
      status: 'pending_documentation',
      amount: 250.00,
      coveredAmount: 0.00,
      processedAt: new Date().toISOString(),
      reviewerId: uuidv4(),
    },
    metadata: createPlanEventMetadata({
      correlationId: claimSubmissionEvents.specialist.metadata.correlationId,
      origin: { component: 'claim-processor' }
    }),
  } as BasePlanEvent & { payload: ClaimProcessedPayload },
};

/**
 * Plan selection event fixtures for testing.
 */
export const planSelectionEvents = {
  /**
   * Valid plan selection event for a basic plan.
   */
  basic: {
    type: JourneyEvents.Plan.PLAN_SELECTED,
    userId: TEST_USER_IDS.standard,
    payload: {
      planId: TEST_PLAN_IDS.basic,
      planType: 'health',
      coverageLevel: 'individual',
      premium: 250.00,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      selectedAt: new Date().toISOString(),
      deductible: 2000.00,
      coinsurance: 20,
      outOfPocketMax: 6000.00,
      comparisonFactors: ['price', 'network'],
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'plan-selection' }
    }),
  } as BasePlanEvent & { payload: PlanSelectionPayload },

  /**
   * Valid plan selection event for a standard plan.
   */
  standard: {
    type: JourneyEvents.Plan.PLAN_SELECTED,
    userId: TEST_USER_IDS.premium,
    payload: {
      planId: TEST_PLAN_IDS.standard,
      planType: 'health',
      coverageLevel: 'individual',
      premium: 350.00,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      selectedAt: new Date().toISOString(),
      deductible: 1500.00,
      coinsurance: 15,
      outOfPocketMax: 5000.00,
      comparisonFactors: ['coverage', 'network', 'price'],
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'plan-selection' }
    }),
  } as BasePlanEvent & { payload: PlanSelectionPayload },

  /**
   * Valid plan selection event for a premium family plan.
   */
  premium: {
    type: JourneyEvents.Plan.PLAN_SELECTED,
    userId: TEST_USER_IDS.family,
    payload: {
      planId: TEST_PLAN_IDS.premium,
      planType: 'health',
      coverageLevel: 'family',
      premium: 850.00,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      selectedAt: new Date().toISOString(),
      previousPlanId: TEST_PLAN_IDS.standard,
      deductible: 1000.00,
      coinsurance: 10,
      outOfPocketMax: 4000.00,
      comparisonFactors: ['coverage', 'benefits', 'network'],
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'plan-selection' }
    }),
  } as BasePlanEvent & { payload: PlanSelectionPayload },

  /**
   * Valid plan selection event for a senior plan.
   */
  senior: {
    type: JourneyEvents.Plan.PLAN_SELECTED,
    userId: TEST_USER_IDS.senior,
    payload: {
      planId: uuidv4(),
      planType: 'medicare_supplement',
      coverageLevel: 'individual',
      premium: 200.00,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      selectedAt: new Date().toISOString(),
      deductible: 500.00,
      coinsurance: 5,
      outOfPocketMax: 2000.00,
      comparisonFactors: ['prescription_coverage', 'specialist_access'],
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'plan-selection' }
    }),
  } as BasePlanEvent & { payload: PlanSelectionPayload },
};

/**
 * Benefit utilization event fixtures for testing.
 */
export const benefitUtilizationEvents = {
  /**
   * Valid benefit utilization event for preventive care.
   */
  preventive: {
    type: JourneyEvents.Plan.BENEFIT_UTILIZED,
    userId: TEST_USER_IDS.standard,
    payload: {
      benefitId: uuidv4(),
      benefitType: 'preventive',
      providerId: TEST_PROVIDER_IDS.clinic,
      utilizationDate: new Date().toISOString(),
      savingsAmount: 150.00,
      remainingUtilizations: null, // Unlimited
      annualLimit: null, // Unlimited
      utilizationPercentage: 0,
      category: 'wellness',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  } as BasePlanEvent & { payload: BenefitUtilizationPayload },

  /**
   * Valid benefit utilization event for specialist visit.
   */
  specialist: {
    type: JourneyEvents.Plan.BENEFIT_UTILIZED,
    userId: TEST_USER_IDS.premium,
    payload: {
      benefitId: uuidv4(),
      benefitType: 'specialist',
      providerId: TEST_PROVIDER_IDS.specialist,
      utilizationDate: new Date().toISOString(),
      savingsAmount: 75.00,
      remainingUtilizations: 3,
      annualLimit: 4,
      utilizationPercentage: 25,
      category: 'medical',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  } as BasePlanEvent & { payload: BenefitUtilizationPayload },

  /**
   * Valid benefit utilization event for dental care.
   */
  dental: {
    type: JourneyEvents.Plan.BENEFIT_UTILIZED,
    userId: TEST_USER_IDS.family,
    payload: {
      benefitId: uuidv4(),
      benefitType: 'dental',
      providerId: uuidv4(), // Dental provider
      utilizationDate: new Date().toISOString(),
      savingsAmount: 120.00,
      remainingUtilizations: 1,
      annualLimit: 2,
      utilizationPercentage: 50,
      category: 'dental',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  } as BasePlanEvent & { payload: BenefitUtilizationPayload },

  /**
   * Valid benefit utilization event for vision care.
   */
  vision: {
    type: JourneyEvents.Plan.BENEFIT_UTILIZED,
    userId: TEST_USER_IDS.senior,
    payload: {
      benefitId: uuidv4(),
      benefitType: 'vision',
      providerId: uuidv4(), // Vision provider
      utilizationDate: new Date().toISOString(),
      savingsAmount: 200.00,
      remainingUtilizations: 0,
      annualLimit: 1,
      utilizationPercentage: 100,
      category: 'vision',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  } as BasePlanEvent & { payload: BenefitUtilizationPayload },

  /**
   * Valid benefit utilization event for wellness program.
   */
  wellness: {
    type: JourneyEvents.Plan.BENEFIT_UTILIZED,
    userId: TEST_USER_IDS.standard,
    payload: {
      benefitId: uuidv4(),
      benefitType: 'wellness_program',
      utilizationDate: new Date().toISOString(),
      savingsAmount: 50.00,
      remainingUtilizations: 11,
      annualLimit: 12,
      utilizationPercentage: 8.33,
      category: 'wellness',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  } as BasePlanEvent & { payload: BenefitUtilizationPayload },
};

/**
 * Reward redemption event fixtures for testing.
 */
export const rewardRedemptionEvents = {
  /**
   * Valid reward redemption event for a gift card.
   */
  giftCard: {
    type: JourneyEvents.Plan.REWARD_REDEEMED,
    userId: TEST_USER_IDS.standard,
    payload: {
      rewardId: uuidv4(),
      rewardType: 'gift_card',
      pointsRedeemed: 5000,
      value: 50.00,
      redeemedAt: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year in future
      deliveryMethod: 'email',
      status: 'processed',
      category: 'retail',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'rewards-service' }
    }),
  } as BasePlanEvent & { payload: RewardRedemptionPayload },

  /**
   * Valid reward redemption event for a premium discount.
   */
  premiumDiscount: {
    type: JourneyEvents.Plan.REWARD_REDEEMED,
    userId: TEST_USER_IDS.premium,
    payload: {
      rewardId: uuidv4(),
      rewardType: 'premium_discount',
      pointsRedeemed: 10000,
      value: 100.00,
      redeemedAt: new Date().toISOString(),
      expirationDate: null, // No expiration
      deliveryMethod: 'account_credit',
      status: 'processed',
      category: 'insurance',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'rewards-service' }
    }),
  } as BasePlanEvent & { payload: RewardRedemptionPayload },

  /**
   * Valid reward redemption event for merchandise.
   */
  merchandise: {
    type: JourneyEvents.Plan.REWARD_REDEEMED,
    userId: TEST_USER_IDS.family,
    payload: {
      rewardId: uuidv4(),
      rewardType: 'merchandise',
      pointsRedeemed: 7500,
      value: 75.00,
      redeemedAt: new Date().toISOString(),
      expirationDate: null, // No expiration
      deliveryMethod: 'shipping',
      status: 'processing',
      category: 'fitness',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'rewards-service' }
    }),
  } as BasePlanEvent & { payload: RewardRedemptionPayload },

  /**
   * Valid reward redemption event for a charity donation.
   */
  donation: {
    type: JourneyEvents.Plan.REWARD_REDEEMED,
    userId: TEST_USER_IDS.senior,
    payload: {
      rewardId: uuidv4(),
      rewardType: 'charity_donation',
      pointsRedeemed: 3000,
      value: 30.00,
      redeemedAt: new Date().toISOString(),
      expirationDate: null, // No expiration
      deliveryMethod: 'direct_transfer',
      status: 'completed',
      category: 'charity',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'rewards-service' }
    }),
  } as BasePlanEvent & { payload: RewardRedemptionPayload },
};

/**
 * Document completion event fixtures for testing.
 */
export const documentCompletionEvents = {
  /**
   * Valid document completion event for enrollment form.
   */
  enrollment: {
    type: JourneyEvents.Plan.DOCUMENT_COMPLETED,
    userId: TEST_USER_IDS.standard,
    payload: {
      documentId: uuidv4(),
      documentType: 'enrollment',
      completedAt: new Date().toISOString(),
      requiredFields: ['personal_info', 'dependents', 'plan_selection', 'payment_info'],
      completionMethod: 'online',
      verificationStatus: 'verified',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'document-processor' }
    }),
  } as BasePlanEvent & { payload: DocumentCompletionPayload },

  /**
   * Valid document completion event for consent form.
   */
  consent: {
    type: JourneyEvents.Plan.DOCUMENT_COMPLETED,
    userId: TEST_USER_IDS.premium,
    payload: {
      documentId: uuidv4(),
      documentType: 'consent',
      completedAt: new Date().toISOString(),
      requiredFields: ['personal_info', 'privacy_agreement', 'data_sharing'],
      completionMethod: 'online',
      verificationStatus: 'verified',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'document-processor' }
    }),
  } as BasePlanEvent & { payload: DocumentCompletionPayload },

  /**
   * Valid document completion event for authorization form.
   */
  authorization: {
    type: JourneyEvents.Plan.DOCUMENT_COMPLETED,
    userId: TEST_USER_IDS.family,
    payload: {
      documentId: uuidv4(),
      documentType: 'authorization',
      completedAt: new Date().toISOString(),
      requiredFields: ['personal_info', 'provider_info', 'authorization_scope'],
      completionMethod: 'online',
      verificationStatus: 'pending',
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'document-processor' }
    }),
  } as BasePlanEvent & { payload: DocumentCompletionPayload },
};

/**
 * Comprehensive collection of all plan journey event fixtures.
 */
export const planEventFixtures = {
  claimSubmission: claimSubmissionEvents,
  claimProcessed: claimProcessedEvents,
  planSelection: planSelectionEvents,
  benefitUtilization: benefitUtilizationEvents,
  rewardRedemption: rewardRedemptionEvents,
  documentCompletion: documentCompletionEvents,
};

/**
 * Creates a custom claim submission event with the specified overrides.
 * 
 * @param overrides Properties to override in the default claim submission event
 * @returns A customized claim submission event
 */
export function createClaimSubmissionEvent(overrides: Partial<ClaimSubmissionPayload> = {}): BasePlanEvent & { payload: ClaimSubmissionPayload } {
  const baseEvent = { ...claimSubmissionEvents.valid };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      claimId: overrides.claimId || uuidv4(),
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'claim-submission' }
    }),
  };
}

/**
 * Creates a custom plan selection event with the specified overrides.
 * 
 * @param overrides Properties to override in the default plan selection event
 * @returns A customized plan selection event
 */
export function createPlanSelectionEvent(overrides: Partial<PlanSelectionPayload> = {}): BasePlanEvent & { payload: PlanSelectionPayload } {
  const baseEvent = { ...planSelectionEvents.standard };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      planId: overrides.planId || uuidv4(),
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'plan-selection' }
    }),
  };
}

/**
 * Creates a custom benefit utilization event with the specified overrides.
 * 
 * @param overrides Properties to override in the default benefit utilization event
 * @returns A customized benefit utilization event
 */
export function createBenefitUtilizationEvent(overrides: Partial<BenefitUtilizationPayload> = {}): BasePlanEvent & { payload: BenefitUtilizationPayload } {
  const baseEvent = { ...benefitUtilizationEvents.preventive };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      benefitId: overrides.benefitId || uuidv4(),
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'benefit-tracker' }
    }),
  };
}

/**
 * Creates a custom reward redemption event with the specified overrides.
 * 
 * @param overrides Properties to override in the default reward redemption event
 * @returns A customized reward redemption event
 */
export function createRewardRedemptionEvent(overrides: Partial<RewardRedemptionPayload> = {}): BasePlanEvent & { payload: RewardRedemptionPayload } {
  const baseEvent = { ...rewardRedemptionEvents.giftCard };
  return {
    ...baseEvent,
    payload: {
      ...baseEvent.payload,
      ...overrides,
      rewardId: overrides.rewardId || uuidv4(),
    },
    metadata: createPlanEventMetadata({
      origin: { component: 'rewards-service' }
    }),
  };
}

export default planEventFixtures;