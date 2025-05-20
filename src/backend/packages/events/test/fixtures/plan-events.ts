/**
 * @file plan-events.ts
 * @description Contains test fixtures specifically for Plan journey events including claim submission,
 * benefit utilization, plan selection/comparison, and reward redemption. This file provides standardized
 * test data with realistic values for testing gamification rules, achievement processing, and notifications
 * related to the Plan journey.
 */

import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';

/**
 * Base interface for all Plan journey event payloads
 */
export interface PlanEventPayload {
  type: string;
  journey: string;
  userId: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Claim types for test fixtures
 */
export enum ClaimType {
  MEDICAL = 'medical',
  DENTAL = 'dental',
  VISION = 'vision',
  PHARMACY = 'pharmacy',
  THERAPY = 'therapy',
  HOSPITAL = 'hospital',
  EMERGENCY = 'emergency',
  PREVENTIVE = 'preventive'
}

/**
 * Claim status types for test fixtures
 */
export enum ClaimStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PARTIAL = 'partial',
  DENIED = 'denied',
  APPEALED = 'appealed',
  CANCELLED = 'cancelled'
}

/**
 * Benefit types for test fixtures
 */
export enum BenefitType {
  WELLNESS = 'wellness',
  PREVENTIVE = 'preventive',
  SPECIALIST = 'specialist',
  TELEMEDICINE = 'telemedicine',
  MENTAL_HEALTH = 'mental_health',
  PHYSICAL_THERAPY = 'physical_therapy',
  PRESCRIPTION = 'prescription',
  DENTAL = 'dental',
  VISION = 'vision',
  EMERGENCY = 'emergency',
  HOSPITAL = 'hospital'
}

/**
 * Plan types for test fixtures
 */
export enum PlanType {
  HEALTH = 'health',
  DENTAL = 'dental',
  VISION = 'vision',
  COMBINED = 'combined'
}

/**
 * Coverage levels for test fixtures
 */
export enum CoverageLevel {
  INDIVIDUAL = 'individual',
  COUPLE = 'couple',
  FAMILY = 'family',
  SENIOR = 'senior'
}

/**
 * Reward types for test fixtures
 */
export enum RewardType {
  GIFT_CARD = 'gift_card',
  PREMIUM_DISCOUNT = 'premium_discount',
  MERCHANDISE = 'merchandise',
  WELLNESS_CREDIT = 'wellness_credit',
  CHARITY_DONATION = 'charity_donation',
  EXPERIENCE = 'experience'
}

/**
 * Document types for test fixtures
 */
export enum DocumentType {
  ENROLLMENT = 'enrollment',
  CONSENT = 'consent',
  AUTHORIZATION = 'authorization',
  CLAIM_FORM = 'claim_form',
  MEDICAL_RECORDS = 'medical_records',
  INSURANCE_CARD = 'insurance_card',
  POLICY_DOCUMENT = 'policy_document'
}

/**
 * Creates a base event payload for Plan journey events
 * 
 * @param userId - The user ID
 * @param type - The event type
 * @param data - The event data
 * @returns A Plan journey event payload
 */
export function createPlanEventPayload(userId: string, type: string, data: any): PlanEventPayload {
  return {
    type,
    journey: 'plan',
    userId,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      source: 'test-fixtures',
      version: '1.0.0'
    }
  };
}

/**
 * Creates a claim submission event payload
 * 
 * @param userId - The user ID
 * @param options - Optional claim data
 * @returns A claim submission event payload
 */
export function createClaimSubmittedEvent(
  userId: string,
  options: {
    claimId?: string;
    claimType?: ClaimType;
    providerId?: string;
    serviceDate?: string;
    amount?: number;
    submittedAt?: string;
    documentIds?: string[];
    description?: string;
  } = {}
): PlanEventPayload {
  const claimId = options.claimId || `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const serviceDate = options.serviceDate || new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString();
  const submittedAt = options.submittedAt || new Date().toISOString();
  
  return createPlanEventPayload(userId, EventType.PLAN_CLAIM_SUBMITTED, {
    claimId,
    claimType: options.claimType || ClaimType.MEDICAL,
    providerId: options.providerId || `provider-${Math.floor(Math.random() * 1000)}`,
    serviceDate,
    amount: options.amount || Math.floor(Math.random() * 500) + 100,
    submittedAt,
    documentIds: options.documentIds || [],
    description: options.description || '',
    status: ClaimStatus.SUBMITTED
  });
}

/**
 * Creates a claim processed event payload
 * 
 * @param userId - The user ID
 * @param options - Optional claim processing data
 * @returns A claim processed event payload
 */
export function createClaimProcessedEvent(
  userId: string,
  options: {
    claimId?: string;
    status?: ClaimStatus;
    amount?: number;
    coveredAmount?: number;
    processedAt?: string;
    notes?: string;
    appealDeadline?: string;
  } = {}
): PlanEventPayload {
  const claimId = options.claimId || `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const amount = options.amount || Math.floor(Math.random() * 500) + 100;
  const status = options.status || (Math.random() > 0.2 ? ClaimStatus.APPROVED : ClaimStatus.DENIED);
  const coveredAmount = options.coveredAmount || 
    (status === ClaimStatus.APPROVED ? amount : 
     status === ClaimStatus.PARTIAL ? Math.floor(amount * 0.7) : 0);
  
  return createPlanEventPayload(userId, EventType.PLAN_CLAIM_PROCESSED, {
    claimId,
    status,
    amount,
    coveredAmount,
    processedAt: options.processedAt || new Date().toISOString(),
    notes: options.notes || '',
    appealDeadline: options.appealDeadline || 
      (status === ClaimStatus.DENIED ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined)
  });
}

/**
 * Creates a plan selection event payload
 * 
 * @param userId - The user ID
 * @param options - Optional plan selection data
 * @returns A plan selection event payload
 */
export function createPlanSelectedEvent(
  userId: string,
  options: {
    planId?: string;
    planType?: PlanType;
    coverageLevel?: CoverageLevel;
    premium?: number;
    startDate?: string;
    selectedAt?: string;
    comparedPlans?: Array<{
      planId: string;
      premium: number;
      coverageLevel: CoverageLevel;
    }>;
    previousPlanId?: string;
    annualSavings?: number;
  } = {}
): PlanEventPayload {
  const planId = options.planId || `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const premium = options.premium || Math.floor(Math.random() * 500) + 200;
  const startDate = options.startDate || new Date(Date.now() + 15 * 86400000).toISOString();
  
  return createPlanEventPayload(userId, EventType.PLAN_SELECTED, {
    planId,
    planType: options.planType || PlanType.HEALTH,
    coverageLevel: options.coverageLevel || CoverageLevel.INDIVIDUAL,
    premium,
    startDate,
    selectedAt: options.selectedAt || new Date().toISOString(),
    comparedPlans: options.comparedPlans || [
      {
        planId: `plan-alt-1-${Math.floor(Math.random() * 1000)}`,
        premium: premium + Math.floor(Math.random() * 100) + 50,
        coverageLevel: CoverageLevel.INDIVIDUAL
      },
      {
        planId: `plan-alt-2-${Math.floor(Math.random() * 1000)}`,
        premium: premium - Math.floor(Math.random() * 50),
        coverageLevel: CoverageLevel.INDIVIDUAL
      }
    ],
    previousPlanId: options.previousPlanId,
    annualSavings: options.annualSavings || (options.previousPlanId ? Math.floor(Math.random() * 1000) + 100 : undefined)
  });
}

/**
 * Creates a benefit utilization event payload
 * 
 * @param userId - The user ID
 * @param options - Optional benefit utilization data
 * @returns A benefit utilization event payload
 */
export function createBenefitUtilizedEvent(
  userId: string,
  options: {
    benefitId?: string;
    benefitType?: BenefitType;
    providerId?: string;
    utilizationDate?: string;
    savingsAmount?: number;
    description?: string;
    location?: string;
    remainingUtilizations?: number;
  } = {}
): PlanEventPayload {
  const benefitId = options.benefitId || `benefit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return createPlanEventPayload(userId, EventType.PLAN_BENEFIT_UTILIZED, {
    benefitId,
    benefitType: options.benefitType || BenefitType.WELLNESS,
    providerId: options.providerId || `provider-${Math.floor(Math.random() * 1000)}`,
    utilizationDate: options.utilizationDate || new Date().toISOString(),
    savingsAmount: options.savingsAmount || Math.floor(Math.random() * 200) + 50,
    description: options.description || '',
    location: options.location || '',
    remainingUtilizations: options.remainingUtilizations !== undefined ? 
      options.remainingUtilizations : Math.floor(Math.random() * 5)
  });
}

/**
 * Creates a reward redemption event payload
 * 
 * @param userId - The user ID
 * @param options - Optional reward redemption data
 * @returns A reward redemption event payload
 */
export function createRewardRedeemedEvent(
  userId: string,
  options: {
    rewardId?: string;
    rewardType?: RewardType;
    pointsRedeemed?: number;
    value?: number;
    redeemedAt?: string;
    expirationDate?: string;
    deliveryMethod?: string;
    deliveryStatus?: string;
  } = {}
): PlanEventPayload {
  const rewardId = options.rewardId || `reward-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const pointsRedeemed = options.pointsRedeemed || Math.floor(Math.random() * 500) + 100;
  
  return createPlanEventPayload(userId, EventType.PLAN_REWARD_REDEEMED, {
    rewardId,
    rewardType: options.rewardType || RewardType.GIFT_CARD,
    pointsRedeemed,
    value: options.value || Math.floor(pointsRedeemed / 10),
    redeemedAt: options.redeemedAt || new Date().toISOString(),
    expirationDate: options.expirationDate || new Date(Date.now() + 180 * 86400000).toISOString(),
    deliveryMethod: options.deliveryMethod || 'email',
    deliveryStatus: options.deliveryStatus || 'delivered'
  });
}

/**
 * Creates a document completion event payload
 * 
 * @param userId - The user ID
 * @param options - Optional document completion data
 * @returns A document completion event payload
 */
export function createDocumentCompletedEvent(
  userId: string,
  options: {
    documentId?: string;
    documentType?: DocumentType;
    completedAt?: string;
    verificationStatus?: string;
    fileSize?: number;
    fileType?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  } = {}
): PlanEventPayload {
  const documentId = options.documentId || `document-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return createPlanEventPayload(userId, EventType.PLAN_DOCUMENT_COMPLETED, {
    documentId,
    documentType: options.documentType || DocumentType.CLAIM_FORM,
    completedAt: options.completedAt || new Date().toISOString(),
    verificationStatus: options.verificationStatus || 'verified',
    fileSize: options.fileSize || Math.floor(Math.random() * 5000) + 100,
    fileType: options.fileType || 'application/pdf',
    relatedEntityId: options.relatedEntityId,
    relatedEntityType: options.relatedEntityType
  });
}

// Pre-defined test fixtures for common scenarios

/**
 * Standard user ID for test fixtures
 */
export const TEST_USER_ID = 'test-user-123';

/**
 * Claim submission test fixtures
 */
export const claimSubmissionFixtures = {
  /**
   * A basic medical claim submission
   */
  basicMedicalClaim: createClaimSubmittedEvent(TEST_USER_ID, {
    claimType: ClaimType.MEDICAL,
    amount: 250,
    description: 'Annual physical examination'
  }),
  
  /**
   * A dental claim submission
   */
  dentalClaim: createClaimSubmittedEvent(TEST_USER_ID, {
    claimType: ClaimType.DENTAL,
    amount: 180,
    description: 'Dental cleaning and X-rays'
  }),
  
  /**
   * A high-value hospital claim submission
   */
  hospitalClaim: createClaimSubmittedEvent(TEST_USER_ID, {
    claimType: ClaimType.HOSPITAL,
    amount: 3500,
    description: 'Outpatient procedure'
  }),
  
  /**
   * A claim with supporting documents
   */
  claimWithDocuments: createClaimSubmittedEvent(TEST_USER_ID, {
    claimType: ClaimType.MEDICAL,
    amount: 450,
    description: 'Specialist consultation',
    documentIds: ['doc-receipt-123', 'doc-prescription-456', 'doc-referral-789']
  }),
  
  /**
   * A pharmacy claim submission
   */
  pharmacyClaim: createClaimSubmittedEvent(TEST_USER_ID, {
    claimType: ClaimType.PHARMACY,
    amount: 75,
    description: 'Prescription medication'
  })
};

/**
 * Claim processing test fixtures
 */
export const claimProcessingFixtures = {
  /**
   * An approved claim
   */
  approvedClaim: createClaimProcessedEvent(TEST_USER_ID, {
    claimId: 'claim-approved-123',
    status: ClaimStatus.APPROVED,
    amount: 250,
    coveredAmount: 250,
    notes: 'Claim approved in full'
  }),
  
  /**
   * A partially approved claim
   */
  partialClaim: createClaimProcessedEvent(TEST_USER_ID, {
    claimId: 'claim-partial-123',
    status: ClaimStatus.PARTIAL,
    amount: 500,
    coveredAmount: 350,
    notes: 'Partial coverage due to out-of-network provider'
  }),
  
  /**
   * A denied claim
   */
  deniedClaim: createClaimProcessedEvent(TEST_USER_ID, {
    claimId: 'claim-denied-123',
    status: ClaimStatus.DENIED,
    amount: 300,
    coveredAmount: 0,
    notes: 'Service not covered under current plan',
    appealDeadline: new Date(Date.now() + 30 * 86400000).toISOString()
  }),
  
  /**
   * A claim under review
   */
  inReviewClaim: createClaimProcessedEvent(TEST_USER_ID, {
    claimId: 'claim-review-123',
    status: ClaimStatus.IN_REVIEW,
    amount: 1200,
    notes: 'Additional documentation requested'
  }),
  
  /**
   * An appealed claim
   */
  appealedClaim: createClaimProcessedEvent(TEST_USER_ID, {
    claimId: 'claim-appeal-123',
    status: ClaimStatus.APPEALED,
    amount: 800,
    notes: 'Claim under appeal review'
  })
};

/**
 * Plan selection test fixtures
 */
export const planSelectionFixtures = {
  /**
   * Basic individual health plan selection
   */
  basicHealthPlan: createPlanSelectedEvent(TEST_USER_ID, {
    planType: PlanType.HEALTH,
    coverageLevel: CoverageLevel.INDIVIDUAL,
    premium: 350
  }),
  
  /**
   * Family health plan selection
   */
  familyHealthPlan: createPlanSelectedEvent(TEST_USER_ID, {
    planType: PlanType.HEALTH,
    coverageLevel: CoverageLevel.FAMILY,
    premium: 950
  }),
  
  /**
   * Dental plan selection
   */
  dentalPlan: createPlanSelectedEvent(TEST_USER_ID, {
    planType: PlanType.DENTAL,
    coverageLevel: CoverageLevel.INDIVIDUAL,
    premium: 45
  }),
  
  /**
   * Plan upgrade with savings
   */
  planUpgrade: createPlanSelectedEvent(TEST_USER_ID, {
    planType: PlanType.HEALTH,
    coverageLevel: CoverageLevel.INDIVIDUAL,
    premium: 425,
    previousPlanId: 'plan-previous-123',
    annualSavings: 300
  }),
  
  /**
   * Combined health and dental plan
   */
  combinedPlan: createPlanSelectedEvent(TEST_USER_ID, {
    planType: PlanType.COMBINED,
    coverageLevel: CoverageLevel.COUPLE,
    premium: 675
  })
};

/**
 * Benefit utilization test fixtures
 */
export const benefitUtilizationFixtures = {
  /**
   * Wellness program benefit
   */
  wellnessBenefit: createBenefitUtilizedEvent(TEST_USER_ID, {
    benefitType: BenefitType.WELLNESS,
    savingsAmount: 150,
    description: 'Gym membership discount',
    remainingUtilizations: 11
  }),
  
  /**
   * Preventive care benefit
   */
  preventiveBenefit: createBenefitUtilizedEvent(TEST_USER_ID, {
    benefitType: BenefitType.PREVENTIVE,
    savingsAmount: 200,
    description: 'Annual wellness check-up',
    remainingUtilizations: 0
  }),
  
  /**
   * Telemedicine benefit
   */
  telemedicineBenefit: createBenefitUtilizedEvent(TEST_USER_ID, {
    benefitType: BenefitType.TELEMEDICINE,
    savingsAmount: 75,
    description: 'Virtual doctor consultation',
    remainingUtilizations: 5
  }),
  
  /**
   * Mental health benefit
   */
  mentalHealthBenefit: createBenefitUtilizedEvent(TEST_USER_ID, {
    benefitType: BenefitType.MENTAL_HEALTH,
    savingsAmount: 120,
    description: 'Therapy session',
    remainingUtilizations: 9
  }),
  
  /**
   * Prescription benefit
   */
  prescriptionBenefit: createBenefitUtilizedEvent(TEST_USER_ID, {
    benefitType: BenefitType.PRESCRIPTION,
    savingsAmount: 45,
    description: 'Generic medication discount',
    remainingUtilizations: 23
  })
};

/**
 * Reward redemption test fixtures
 */
export const rewardRedemptionFixtures = {
  /**
   * Gift card reward
   */
  giftCardReward: createRewardRedeemedEvent(TEST_USER_ID, {
    rewardType: RewardType.GIFT_CARD,
    pointsRedeemed: 500,
    value: 50,
    deliveryMethod: 'email'
  }),
  
  /**
   * Premium discount reward
   */
  premiumDiscountReward: createRewardRedeemedEvent(TEST_USER_ID, {
    rewardType: RewardType.PREMIUM_DISCOUNT,
    pointsRedeemed: 1000,
    value: 100,
    deliveryMethod: 'account_credit'
  }),
  
  /**
   * Merchandise reward
   */
  merchandiseReward: createRewardRedeemedEvent(TEST_USER_ID, {
    rewardType: RewardType.MERCHANDISE,
    pointsRedeemed: 750,
    value: 75,
    deliveryMethod: 'shipping',
    deliveryStatus: 'processing'
  }),
  
  /**
   * Wellness credit reward
   */
  wellnessCreditReward: createRewardRedeemedEvent(TEST_USER_ID, {
    rewardType: RewardType.WELLNESS_CREDIT,
    pointsRedeemed: 300,
    value: 30,
    deliveryMethod: 'account_credit'
  }),
  
  /**
   * Charity donation reward
   */
  charityDonationReward: createRewardRedeemedEvent(TEST_USER_ID, {
    rewardType: RewardType.CHARITY_DONATION,
    pointsRedeemed: 250,
    value: 25,
    deliveryMethod: 'direct_transfer'
  })
};

/**
 * Document completion test fixtures
 */
export const documentCompletionFixtures = {
  /**
   * Claim form document
   */
  claimFormDocument: createDocumentCompletedEvent(TEST_USER_ID, {
    documentType: DocumentType.CLAIM_FORM,
    relatedEntityId: 'claim-123',
    relatedEntityType: 'claim'
  }),
  
  /**
   * Enrollment document
   */
  enrollmentDocument: createDocumentCompletedEvent(TEST_USER_ID, {
    documentType: DocumentType.ENROLLMENT,
    relatedEntityId: 'plan-123',
    relatedEntityType: 'plan'
  }),
  
  /**
   * Consent document
   */
  consentDocument: createDocumentCompletedEvent(TEST_USER_ID, {
    documentType: DocumentType.CONSENT,
    verificationStatus: 'pending_review'
  }),
  
  /**
   * Medical records document
   */
  medicalRecordsDocument: createDocumentCompletedEvent(TEST_USER_ID, {
    documentType: DocumentType.MEDICAL_RECORDS,
    fileSize: 8500,
    relatedEntityId: 'claim-456',
    relatedEntityType: 'claim'
  }),
  
  /**
   * Insurance card document
   */
  insuranceCardDocument: createDocumentCompletedEvent(TEST_USER_ID, {
    documentType: DocumentType.INSURANCE_CARD,
    fileType: 'image/jpeg',
    fileSize: 1200
  })
};

/**
 * Collection of all Plan journey test fixtures
 */
export const planEventFixtures = {
  claimSubmission: claimSubmissionFixtures,
  claimProcessing: claimProcessingFixtures,
  planSelection: planSelectionFixtures,
  benefitUtilization: benefitUtilizationFixtures,
  rewardRedemption: rewardRedemptionFixtures,
  documentCompletion: documentCompletionFixtures
};

/**
 * Creates a sequence of related claim events (submission followed by processing)
 * 
 * @param userId - The user ID
 * @param options - Optional claim sequence data
 * @returns An array of related claim events
 */
export function createClaimSequence(
  userId: string,
  options: {
    claimType?: ClaimType;
    amount?: number;
    status?: ClaimStatus;
    description?: string;
    documentIds?: string[];
  } = {}
): PlanEventPayload[] {
  const claimId = `claim-seq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const amount = options.amount || Math.floor(Math.random() * 500) + 100;
  const status = options.status || (Math.random() > 0.2 ? ClaimStatus.APPROVED : ClaimStatus.DENIED);
  const coveredAmount = status === ClaimStatus.APPROVED ? amount : 
                        status === ClaimStatus.PARTIAL ? Math.floor(amount * 0.7) : 0;
  
  // Create submission event
  const submissionEvent = createClaimSubmittedEvent(userId, {
    claimId,
    claimType: options.claimType || ClaimType.MEDICAL,
    amount,
    description: options.description || 'Test claim',
    documentIds: options.documentIds
  });
  
  // Create processing event
  const processingEvent = createClaimProcessedEvent(userId, {
    claimId,
    status,
    amount,
    coveredAmount,
    processedAt: new Date(new Date(submissionEvent.timestamp).getTime() + 86400000).toISOString() // 1 day later
  });
  
  return [submissionEvent, processingEvent];
}

/**
 * Creates a sequence of benefit utilization events for testing achievement tracking
 * 
 * @param userId - The user ID
 * @param count - Number of benefit utilization events to create
 * @param benefitType - Type of benefit to utilize
 * @returns An array of benefit utilization events
 */
export function createBenefitUtilizationSequence(
  userId: string,
  count: number = 3,
  benefitType: BenefitType = BenefitType.WELLNESS
): PlanEventPayload[] {
  const events: PlanEventPayload[] = [];
  const baseTime = Date.now() - (count * 86400000); // Start 'count' days ago
  
  for (let i = 0; i < count; i++) {
    const eventTime = new Date(baseTime + (i * 86400000)).toISOString(); // 1 day apart
    events.push(createBenefitUtilizedEvent(userId, {
      benefitType,
      utilizationDate: eventTime,
      savingsAmount: Math.floor(Math.random() * 100) + 50,
      remainingUtilizations: count - i - 1
    }));
  }
  
  return events;
}

/**
 * Creates a plan comparison and selection sequence
 * 
 * @param userId - The user ID
 * @param options - Optional plan selection data
 * @returns An array of events representing the plan selection process
 */
export function createPlanSelectionSequence(
  userId: string,
  options: {
    planType?: PlanType;
    coverageLevel?: CoverageLevel;
    previousPlanId?: string;
  } = {}
): PlanEventPayload[] {
  const planType = options.planType || PlanType.HEALTH;
  const coverageLevel = options.coverageLevel || CoverageLevel.INDIVIDUAL;
  const previousPlanId = options.previousPlanId;
  
  // Create base premium and alternative plans
  const basePremium = Math.floor(Math.random() * 300) + 200;
  const plans = [
    {
      planId: `plan-option-1-${Date.now()}`,
      premium: basePremium,
      coverageLevel
    },
    {
      planId: `plan-option-2-${Date.now()}`,
      premium: basePremium + Math.floor(Math.random() * 100) + 50,
      coverageLevel
    },
    {
      planId: `plan-option-3-${Date.now()}`,
      premium: basePremium - Math.floor(Math.random() * 50),
      coverageLevel
    }
  ];
  
  // Select the lowest premium plan
  const selectedPlan = plans.reduce((prev, current) => 
    prev.premium < current.premium ? prev : current
  );
  
  // Calculate annual savings if upgrading from previous plan
  const annualSavings = previousPlanId ? Math.floor(Math.random() * 500) + 100 : undefined;
  
  // Create the plan selection event
  const selectionEvent = createPlanSelectedEvent(userId, {
    planId: selectedPlan.planId,
    planType,
    coverageLevel,
    premium: selectedPlan.premium,
    comparedPlans: plans,
    previousPlanId,
    annualSavings
  });
  
  return [selectionEvent];
}

/**
 * Creates a reward redemption sequence with point earning and redemption
 * 
 * @param userId - The user ID
 * @param options - Optional reward redemption data
 * @returns An array of events representing the reward redemption process
 */
export function createRewardRedemptionSequence(
  userId: string,
  options: {
    rewardType?: RewardType;
    pointsEarned?: number;
    pointsRedeemed?: number;
  } = {}
): PlanEventPayload[] {
  const pointsEarned = options.pointsEarned || Math.floor(Math.random() * 500) + 200;
  const pointsRedeemed = options.pointsRedeemed || Math.min(pointsEarned, Math.floor(Math.random() * 300) + 100);
  const rewardType = options.rewardType || RewardType.GIFT_CARD;
  
  // Create points earned event (from gamification)
  const pointsEvent = {
    type: EventType.GAMIFICATION_POINTS_EARNED,
    journey: 'gamification',
    userId,
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    data: {
      points: pointsEarned,
      sourceType: 'plan',
      sourceId: `plan-activity-${Date.now()}`,
      reason: 'Plan activity completion',
      earnedAt: new Date(Date.now() - 86400000).toISOString()
    },
    metadata: {
      source: 'test-fixtures',
      version: '1.0.0'
    }
  };
  
  // Create reward redemption event
  const redemptionEvent = createRewardRedeemedEvent(userId, {
    rewardType,
    pointsRedeemed,
    value: Math.floor(pointsRedeemed / 10)
  });
  
  return [pointsEvent, redemptionEvent];
}

/**
 * Creates a complete user journey through the Plan journey with multiple event types
 * 
 * @param userId - The user ID
 * @returns An array of events representing a complete user journey
 */
export function createCompletePlanJourney(userId: string): PlanEventPayload[] {
  const events: PlanEventPayload[] = [];
  const baseTime = Date.now() - (10 * 86400000); // Start 10 days ago
  
  // Day 1: User selects a plan
  const planSelection = createPlanSelectedEvent(userId, {
    planType: PlanType.HEALTH,
    coverageLevel: CoverageLevel.INDIVIDUAL,
    premium: 350,
    selectedAt: new Date(baseTime).toISOString()
  });
  events.push(planSelection);
  
  // Day 2: User completes enrollment documents
  const enrollmentDoc = createDocumentCompletedEvent(userId, {
    documentType: DocumentType.ENROLLMENT,
    completedAt: new Date(baseTime + 86400000).toISOString(),
    relatedEntityId: planSelection.data.planId,
    relatedEntityType: 'plan'
  });
  events.push(enrollmentDoc);
  
  // Day 3: User uploads insurance card
  const insuranceCard = createDocumentCompletedEvent(userId, {
    documentType: DocumentType.INSURANCE_CARD,
    completedAt: new Date(baseTime + 2 * 86400000).toISOString(),
    fileType: 'image/jpeg'
  });
  events.push(insuranceCard);
  
  // Day 5: User utilizes wellness benefit
  const wellnessBenefit = createBenefitUtilizedEvent(userId, {
    benefitType: BenefitType.WELLNESS,
    utilizationDate: new Date(baseTime + 4 * 86400000).toISOString(),
    savingsAmount: 150,
    description: 'Gym membership discount'
  });
  events.push(wellnessBenefit);
  
  // Day 6: User submits a medical claim
  const [claimSubmission, claimProcessing] = createClaimSequence(userId, {
    claimType: ClaimType.MEDICAL,
    amount: 250,
    status: ClaimStatus.APPROVED,
    description: 'Annual physical examination'
  });
  
  // Adjust timestamps
  claimSubmission.timestamp = new Date(baseTime + 5 * 86400000).toISOString();
  claimProcessing.timestamp = new Date(baseTime + 7 * 86400000).toISOString();
  
  events.push(claimSubmission);
  events.push(claimProcessing);
  
  // Day 8: User earns points for claim approval
  const pointsEvent = {
    type: EventType.GAMIFICATION_POINTS_EARNED,
    journey: 'gamification',
    userId,
    timestamp: new Date(baseTime + 7 * 86400000).toISOString(),
    data: {
      points: 50,
      sourceType: 'plan',
      sourceId: claimProcessing.data.claimId,
      reason: 'Claim approved',
      earnedAt: new Date(baseTime + 7 * 86400000).toISOString()
    },
    metadata: {
      source: 'test-fixtures',
      version: '1.0.0'
    }
  };
  events.push(pointsEvent);
  
  // Day 9: User utilizes preventive care benefit
  const preventiveBenefit = createBenefitUtilizedEvent(userId, {
    benefitType: BenefitType.PREVENTIVE,
    utilizationDate: new Date(baseTime + 8 * 86400000).toISOString(),
    savingsAmount: 200,
    description: 'Annual wellness check-up'
  });
  events.push(preventiveBenefit);
  
  // Day 10: User redeems reward points
  const rewardRedemption = createRewardRedeemedEvent(userId, {
    rewardType: RewardType.GIFT_CARD,
    pointsRedeemed: 50,
    value: 5,
    redeemedAt: new Date(baseTime + 9 * 86400000).toISOString()
  });
  events.push(rewardRedemption);
  
  return events;
}