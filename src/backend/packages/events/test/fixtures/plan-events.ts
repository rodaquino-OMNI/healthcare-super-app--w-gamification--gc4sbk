/**
 * @file plan-events.ts
 * @description Test fixtures for Plan journey events including claim submission, benefit utilization,
 * plan selection/comparison, and reward redemption. These fixtures provide standardized test data
 * with realistic values for testing gamification rules, achievement processing, and notifications
 * related to the Plan journey.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

import {
  IJourneyEvent,
  JourneyType,
  PlanEventType,
  IClaimSubmittedEvent,
  IClaimUpdatedEvent,
  IClaimApprovedEvent,
  IClaimDeniedEvent,
  IBenefitUsedEvent,
  IBenefitLimitReachedEvent,
  IPlanSelectedEvent,
  IPlanChangedEvent,
  IPlanRenewedEvent,
  IPlanComparedEvent,
  IRewardRedeemedEvent,
} from '@austa/packages/events/src/interfaces/journey-events.interface';

import { ClaimStatus } from '@austa/interfaces/journey/plan';

// Constants for test data
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_CORRELATION_ID = '987e6543-e21b-12d3-a456-426614174000';
const TEST_SESSION_ID = 'session-123456789';

const TEST_CLAIM_IDS = {
  MEDICAL: 'claim-medical-123456',
  EXAM: 'claim-exam-123456',
  THERAPY: 'claim-therapy-123456',
  HOSPITAL: 'claim-hospital-123456',
  MEDICATION: 'claim-medication-123456',
};

const TEST_BENEFIT_IDS = {
  MEDICAL_CONSULT: 'benefit-medical-consult-123456',
  EXAMS: 'benefit-exams-123456',
  THERAPY: 'benefit-therapy-123456',
  HOSPITAL: 'benefit-hospital-123456',
  MEDICATION: 'benefit-medication-123456',
  DENTAL: 'benefit-dental-123456',
  VISION: 'benefit-vision-123456',
};

const TEST_PLAN_IDS = {
  BASIC: 'plan-basic-123456',
  STANDARD: 'plan-standard-123456',
  PREMIUM: 'plan-premium-123456',
};

const TEST_REWARD_IDS = {
  DISCOUNT: 'reward-discount-123456',
  CASHBACK: 'reward-cashback-123456',
  GIFT: 'reward-gift-123456',
  SERVICE: 'reward-service-123456',
};

const TEST_PROVIDERS = {
  HOSPITAL: 'Hospital São Paulo',
  CLINIC: 'Clínica Saúde Total',
  LABORATORY: 'Laboratório Diagnósticos',
  PHARMACY: 'Farmácia Bem Estar',
  THERAPIST: 'Centro de Terapias Integradas',
};

/**
 * Base function to create a Plan journey event with common properties
 * @param type The specific Plan event type
 * @param payload The event payload
 * @param overrides Optional properties to override defaults
 * @returns A Plan journey event
 */
function createPlanJourneyEvent<T>(
  type: PlanEventType,
  payload: T,
  overrides: Partial<IJourneyEvent> = {}
): IJourneyEvent & { type: PlanEventType; payload: T } {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'plan-service',
    journeyType: JourneyType.PLAN,
    userId: TEST_USER_ID,
    correlationId: TEST_CORRELATION_ID,
    sessionId: TEST_SESSION_ID,
    type,
    payload,
    metadata: {
      journey: 'plan',
      userId: TEST_USER_ID,
      correlationId: TEST_CORRELATION_ID,
    },
    ...overrides,
  };
}

// ===== CLAIM EVENTS =====

/**
 * Creates a claim submitted event fixture
 * @param overrides Optional properties to override defaults
 * @returns A claim submitted event
 */
export function createClaimSubmittedEvent(
  overrides: Partial<IClaimSubmittedEvent> = {}
): IClaimSubmittedEvent {
  const defaultPayload = {
    claim: {
      id: TEST_CLAIM_IDS.MEDICAL,
      type: 'Consulta Médica',
      status: ClaimStatus.SUBMITTED,
      amount: 250.0,
      submissionDate: new Date().toISOString(),
      serviceDate: subDays(new Date(), 3).toISOString(),
      provider: TEST_PROVIDERS.CLINIC,
    },
    submissionDate: new Date().toISOString(),
    amount: 250.0,
    serviceDate: subDays(new Date(), 3).toISOString(),
    provider: TEST_PROVIDERS.CLINIC,
    hasDocuments: true,
    documentCount: 2,
    isFirstClaim: false,
  };

  return createPlanJourneyEvent(
    PlanEventType.CLAIM_SUBMITTED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IClaimSubmittedEvent;
}

/**
 * Creates a claim updated event fixture
 * @param overrides Optional properties to override defaults
 * @returns A claim updated event
 */
export function createClaimUpdatedEvent(
  overrides: Partial<IClaimUpdatedEvent> = {}
): IClaimUpdatedEvent {
  const defaultPayload = {
    claim: {
      id: TEST_CLAIM_IDS.MEDICAL,
      type: 'Consulta Médica',
      status: ClaimStatus.UNDER_REVIEW,
      amount: 250.0,
      submissionDate: subDays(new Date(), 2).toISOString(),
      serviceDate: subDays(new Date(), 5).toISOString(),
      provider: TEST_PROVIDERS.CLINIC,
    },
    updateDate: new Date().toISOString(),
    previousStatus: ClaimStatus.SUBMITTED,
    newStatus: ClaimStatus.UNDER_REVIEW,
    updatedFields: ['status', 'documents'],
    documentsAdded: true,
    documentCount: 3,
  };

  return createPlanJourneyEvent(
    PlanEventType.CLAIM_UPDATED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IClaimUpdatedEvent;
}

/**
 * Creates a claim approved event fixture
 * @param overrides Optional properties to override defaults
 * @returns A claim approved event
 */
export function createClaimApprovedEvent(
  overrides: Partial<IClaimApprovedEvent> = {}
): IClaimApprovedEvent {
  const defaultPayload = {
    claim: {
      id: TEST_CLAIM_IDS.MEDICAL,
      type: 'Consulta Médica',
      status: ClaimStatus.APPROVED,
      amount: 250.0,
      submissionDate: subDays(new Date(), 7).toISOString(),
      serviceDate: subDays(new Date(), 10).toISOString(),
      provider: TEST_PROVIDERS.CLINIC,
      approvedAmount: 200.0,
      approvalDate: new Date().toISOString(),
    },
    approvalDate: new Date().toISOString(),
    submittedAmount: 250.0,
    approvedAmount: 200.0,
    coveragePercentage: 80,
    processingDays: 7,
    paymentDate: addDays(new Date(), 3).toISOString(),
    paymentMethod: 'bank_transfer',
  };

  return createPlanJourneyEvent(
    PlanEventType.CLAIM_APPROVED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IClaimApprovedEvent;
}

/**
 * Creates a claim denied event fixture
 * @param overrides Optional properties to override defaults
 * @returns A claim denied event
 */
export function createClaimDeniedEvent(
  overrides: Partial<IClaimDeniedEvent> = {}
): IClaimDeniedEvent {
  const defaultPayload = {
    claim: {
      id: TEST_CLAIM_IDS.THERAPY,
      type: 'Terapia',
      status: ClaimStatus.DENIED,
      amount: 150.0,
      submissionDate: subDays(new Date(), 7).toISOString(),
      serviceDate: subDays(new Date(), 14).toISOString(),
      provider: TEST_PROVIDERS.THERAPIST,
      denialReason: 'Service not covered by plan',
      denialDate: new Date().toISOString(),
    },
    denialDate: new Date().toISOString(),
    denialReason: 'Service not covered by plan',
    submittedAmount: 150.0,
    processingDays: 7,
    appealEligible: true,
    appealDeadline: addDays(new Date(), 30).toISOString(),
    additionalInfoRequired: ['medical_referral', 'treatment_plan'],
  };

  return createPlanJourneyEvent(
    PlanEventType.CLAIM_DENIED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IClaimDeniedEvent;
}

// ===== BENEFIT EVENTS =====

/**
 * Creates a benefit used event fixture
 * @param overrides Optional properties to override defaults
 * @returns A benefit used event
 */
export function createBenefitUsedEvent(
  overrides: Partial<IBenefitUsedEvent> = {}
): IBenefitUsedEvent {
  const defaultPayload = {
    benefit: {
      id: TEST_BENEFIT_IDS.MEDICAL_CONSULT,
      name: 'Consultas Médicas',
      description: 'Cobertura para consultas médicas',
      coveragePercentage: 80,
      limitAmount: 2000.0,
      limitPeriod: 'yearly',
    },
    usageDate: new Date().toISOString(),
    provider: TEST_PROVIDERS.CLINIC,
    serviceDescription: 'Consulta com Clínico Geral',
    amountUsed: 200.0,
    remainingAmount: 1800.0,
    remainingPercentage: 90,
    isFirstUse: false,
  };

  return createPlanJourneyEvent(
    PlanEventType.BENEFIT_USED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IBenefitUsedEvent;
}

/**
 * Creates a benefit limit reached event fixture
 * @param overrides Optional properties to override defaults
 * @returns A benefit limit reached event
 */
export function createBenefitLimitReachedEvent(
  overrides: Partial<IBenefitLimitReachedEvent> = {}
): IBenefitLimitReachedEvent {
  const defaultPayload = {
    benefit: {
      id: TEST_BENEFIT_IDS.THERAPY,
      name: 'Terapias',
      description: 'Cobertura para sessões terapêuticas',
      coveragePercentage: 70,
      limitAmount: 1500.0,
      limitPeriod: 'yearly',
    },
    reachedDate: new Date().toISOString(),
    limitType: 'amount',
    limitValue: 1500.0,
    renewalDate: addDays(new Date(), 90).toISOString(),
    alternativeBenefits: [
      {
        id: TEST_BENEFIT_IDS.MEDICAL_CONSULT,
        name: 'Consultas Médicas',
        description: 'Cobertura para consultas médicas',
        coveragePercentage: 80,
        limitAmount: 2000.0,
        limitPeriod: 'yearly',
      },
    ],
  };

  return createPlanJourneyEvent(
    PlanEventType.BENEFIT_LIMIT_REACHED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IBenefitLimitReachedEvent;
}

// ===== PLAN EVENTS =====

/**
 * Creates a plan selected event fixture
 * @param overrides Optional properties to override defaults
 * @returns A plan selected event
 */
export function createPlanSelectedEvent(
  overrides: Partial<IPlanSelectedEvent> = {}
): IPlanSelectedEvent {
  const defaultPayload = {
    plan: {
      id: TEST_PLAN_IDS.STANDARD,
      name: 'Plano Standard',
      description: 'Plano com cobertura intermediária',
      provider: 'AUSTA Seguros',
      premium: 450.0,
      effectiveDate: addDays(new Date(), 15).toISOString(),
      expirationDate: addDays(new Date(), 380).toISOString(),
      status: 'active',
    },
    selectionDate: new Date().toISOString(),
    effectiveDate: addDays(new Date(), 15).toISOString(),
    premium: 450.0,
    paymentFrequency: 'monthly',
    isFirstPlan: false,
    comparedPlansCount: 3,
  };

  return createPlanJourneyEvent(
    PlanEventType.PLAN_SELECTED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IPlanSelectedEvent;
}

/**
 * Creates a plan changed event fixture
 * @param overrides Optional properties to override defaults
 * @returns A plan changed event
 */
export function createPlanChangedEvent(
  overrides: Partial<IPlanChangedEvent> = {}
): IPlanChangedEvent {
  const defaultPayload = {
    oldPlan: {
      id: TEST_PLAN_IDS.BASIC,
      name: 'Plano Básico',
      description: 'Plano com cobertura básica',
      provider: 'AUSTA Seguros',
      premium: 250.0,
      effectiveDate: subDays(new Date(), 180).toISOString(),
      expirationDate: addDays(new Date(), 185).toISOString(),
      status: 'inactive',
    },
    newPlan: {
      id: TEST_PLAN_IDS.STANDARD,
      name: 'Plano Standard',
      description: 'Plano com cobertura intermediária',
      provider: 'AUSTA Seguros',
      premium: 450.0,
      effectiveDate: addDays(new Date(), 15).toISOString(),
      expirationDate: addDays(new Date(), 380).toISOString(),
      status: 'active',
    },
    changeDate: new Date().toISOString(),
    effectiveDate: addDays(new Date(), 15).toISOString(),
    premiumDifference: 200.0,
    changeReason: 'Necessidade de maior cobertura',
    benefitChanges: {
      added: ['Cobertura odontológica', 'Telemedicina ilimitada'],
      removed: [],
      improved: ['Cobertura hospitalar', 'Exames laboratoriais'],
      reduced: [],
    },
  };

  return createPlanJourneyEvent(
    PlanEventType.PLAN_CHANGED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IPlanChangedEvent;
}

/**
 * Creates a plan renewed event fixture
 * @param overrides Optional properties to override defaults
 * @returns A plan renewed event
 */
export function createPlanRenewedEvent(
  overrides: Partial<IPlanRenewedEvent> = {}
): IPlanRenewedEvent {
  const defaultPayload = {
    plan: {
      id: TEST_PLAN_IDS.STANDARD,
      name: 'Plano Standard',
      description: 'Plano com cobertura intermediária',
      provider: 'AUSTA Seguros',
      premium: 472.5,
      effectiveDate: addDays(new Date(), 1).toISOString(),
      expirationDate: addDays(new Date(), 366).toISOString(),
      status: 'active',
    },
    renewalDate: new Date().toISOString(),
    previousEndDate: addDays(new Date(), 0).toISOString(),
    newEndDate: addDays(new Date(), 366).toISOString(),
    premiumChange: 22.5,
    premiumChangePercentage: 5,
    benefitChanges: true,
    yearsWithPlan: 2,
  };

  return createPlanJourneyEvent(
    PlanEventType.PLAN_RENEWED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IPlanRenewedEvent;
}

/**
 * Creates a plan compared event fixture
 * @param overrides Optional properties to override defaults
 * @returns A plan compared event
 */
export function createPlanComparedEvent(
  overrides: Partial<IPlanComparedEvent> = {}
): IPlanComparedEvent {
  const defaultPayload = {
    plansCompared: [
      {
        id: TEST_PLAN_IDS.BASIC,
        name: 'Plano Básico',
        description: 'Plano com cobertura básica',
        provider: 'AUSTA Seguros',
        premium: 250.0,
      },
      {
        id: TEST_PLAN_IDS.STANDARD,
        name: 'Plano Standard',
        description: 'Plano com cobertura intermediária',
        provider: 'AUSTA Seguros',
        premium: 450.0,
      },
      {
        id: TEST_PLAN_IDS.PREMIUM,
        name: 'Plano Premium',
        description: 'Plano com cobertura ampla',
        provider: 'AUSTA Seguros',
        premium: 750.0,
      },
    ],
    comparisonDate: new Date().toISOString(),
    comparisonCriteria: ['price', 'coverage', 'network', 'benefits'],
    selectedPlanId: TEST_PLAN_IDS.STANDARD,
    comparisonDuration: 300, // 5 minutes in seconds
    userPreferences: {
      prioritizeCoverage: true,
      maxBudget: 500.0,
      preferredHospitals: [TEST_PROVIDERS.HOSPITAL],
    },
  };

  return createPlanJourneyEvent(
    PlanEventType.PLAN_COMPARED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IPlanComparedEvent;
}

// ===== REWARD EVENTS =====

/**
 * Creates a reward redeemed event fixture
 * @param overrides Optional properties to override defaults
 * @returns A reward redeemed event
 */
export function createRewardRedeemedEvent(
  overrides: Partial<IRewardRedeemedEvent> = {}
): IRewardRedeemedEvent {
  const defaultPayload = {
    rewardId: TEST_REWARD_IDS.DISCOUNT,
    rewardName: 'Desconto na mensalidade',
    rewardType: 'discount',
    redemptionDate: new Date().toISOString(),
    pointsUsed: 1000,
    monetaryValue: 50.0,
    expirationDate: addDays(new Date(), 30).toISOString(),
    isFirstRedemption: false,
  };

  return createPlanJourneyEvent(
    PlanEventType.REWARD_REDEEMED,
    { ...defaultPayload, ...(overrides.payload || {}) },
    overrides
  ) as IRewardRedeemedEvent;
}

// ===== PREDEFINED FIXTURES =====

/**
 * Predefined claim fixtures for common test scenarios
 */
export const claimFixtures = {
  /**
   * A new medical consultation claim that was just submitted
   */
  newMedicalClaim: createClaimSubmittedEvent({
    payload: {
      claim: {
        id: TEST_CLAIM_IDS.MEDICAL,
        type: 'Consulta Médica',
        status: ClaimStatus.SUBMITTED,
      },
      isFirstClaim: true,
    },
  }),

  /**
   * A medical exam claim that was updated with additional documents
   */
  updatedExamClaim: createClaimUpdatedEvent({
    payload: {
      claim: {
        id: TEST_CLAIM_IDS.EXAM,
        type: 'Exame',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
      },
      previousStatus: ClaimStatus.SUBMITTED,
      newStatus: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
      updatedFields: ['status', 'documents'],
      documentsAdded: true,
    },
  }),

  /**
   * An approved medical consultation claim with payment scheduled
   */
  approvedMedicalClaim: createClaimApprovedEvent({
    payload: {
      claim: {
        id: TEST_CLAIM_IDS.MEDICAL,
        type: 'Consulta Médica',
        status: ClaimStatus.APPROVED,
      },
      coveragePercentage: 80,
      processingDays: 5,
    },
  }),

  /**
   * A denied therapy claim due to lack of coverage
   */
  deniedTherapyClaim: createClaimDeniedEvent({
    payload: {
      claim: {
        id: TEST_CLAIM_IDS.THERAPY,
        type: 'Terapia',
        status: ClaimStatus.DENIED,
      },
      denialReason: 'Service not covered by plan',
      appealEligible: true,
    },
  }),

  /**
   * A denied hospital claim due to missing documentation
   */
  deniedHospitalClaim: createClaimDeniedEvent({
    payload: {
      claim: {
        id: TEST_CLAIM_IDS.HOSPITAL,
        type: 'Internação',
        status: ClaimStatus.DENIED,
      },
      denialReason: 'Missing required documentation',
      appealEligible: true,
      additionalInfoRequired: ['medical_report', 'hospital_invoice', 'procedure_details'],
    },
  }),
};

/**
 * Predefined benefit fixtures for common test scenarios
 */
export const benefitFixtures = {
  /**
   * A medical consultation benefit usage
   */
  medicalConsultBenefit: createBenefitUsedEvent({
    payload: {
      benefit: {
        id: TEST_BENEFIT_IDS.MEDICAL_CONSULT,
        name: 'Consultas Médicas',
      },
      serviceDescription: 'Consulta com Clínico Geral',
      amountUsed: 200.0,
      remainingAmount: 1800.0,
    },
  }),

  /**
   * A laboratory exam benefit usage
   */
  examBenefit: createBenefitUsedEvent({
    payload: {
      benefit: {
        id: TEST_BENEFIT_IDS.EXAMS,
        name: 'Exames Laboratoriais',
      },
      provider: TEST_PROVIDERS.LABORATORY,
      serviceDescription: 'Exames de sangue completo',
      amountUsed: 350.0,
      remainingAmount: 1650.0,
    },
  }),

  /**
   * A therapy benefit that reached its limit
   */
  therapyBenefitLimit: createBenefitLimitReachedEvent({
    payload: {
      benefit: {
        id: TEST_BENEFIT_IDS.THERAPY,
        name: 'Terapias',
      },
      limitType: 'amount',
      limitValue: 1500.0,
    },
  }),

  /**
   * A dental benefit that reached its visit limit
   */
  dentalBenefitLimit: createBenefitLimitReachedEvent({
    payload: {
      benefit: {
        id: TEST_BENEFIT_IDS.DENTAL,
        name: 'Odontologia',
      },
      limitType: 'visits',
      limitValue: 4,
    },
  }),
};

/**
 * Predefined plan fixtures for common test scenarios
 */
export const planFixtures = {
  /**
   * A basic plan selection event
   */
  basicPlanSelected: createPlanSelectedEvent({
    payload: {
      plan: {
        id: TEST_PLAN_IDS.BASIC,
        name: 'Plano Básico',
        premium: 250.0,
      },
      premium: 250.0,
      isFirstPlan: true,
    },
  }),

  /**
   * A standard plan selection event after comparing options
   */
  standardPlanSelected: createPlanSelectedEvent({
    payload: {
      plan: {
        id: TEST_PLAN_IDS.STANDARD,
        name: 'Plano Standard',
        premium: 450.0,
      },
      premium: 450.0,
      isFirstPlan: false,
      comparedPlansCount: 3,
    },
  }),

  /**
   * An upgrade from basic to standard plan
   */
  basicToStandardUpgrade: createPlanChangedEvent({
    payload: {
      oldPlan: {
        id: TEST_PLAN_IDS.BASIC,
        name: 'Plano Básico',
        premium: 250.0,
      },
      newPlan: {
        id: TEST_PLAN_IDS.STANDARD,
        name: 'Plano Standard',
        premium: 450.0,
      },
      premiumDifference: 200.0,
      changeReason: 'Necessidade de maior cobertura',
    },
  }),

  /**
   * A standard plan renewal with slight premium increase
   */
  standardPlanRenewal: createPlanRenewedEvent({
    payload: {
      plan: {
        id: TEST_PLAN_IDS.STANDARD,
        name: 'Plano Standard',
        premium: 472.5,
      },
      premiumChange: 22.5,
      premiumChangePercentage: 5,
      yearsWithPlan: 2,
    },
  }),

  /**
   * A comparison of all three plan types
   */
  allPlansCompared: createPlanComparedEvent(),
};

/**
 * Predefined reward fixtures for common test scenarios
 */
export const rewardFixtures = {
  /**
   * A discount reward redemption
   */
  discountReward: createRewardRedeemedEvent({
    payload: {
      rewardId: TEST_REWARD_IDS.DISCOUNT,
      rewardName: 'Desconto na mensalidade',
      rewardType: 'discount',
      pointsUsed: 1000,
      monetaryValue: 50.0,
    },
  }),

  /**
   * A cashback reward redemption
   */
  cashbackReward: createRewardRedeemedEvent({
    payload: {
      rewardId: TEST_REWARD_IDS.CASHBACK,
      rewardName: 'Cashback em farmácias',
      rewardType: 'cashback',
      pointsUsed: 2000,
      monetaryValue: 100.0,
    },
  }),

  /**
   * A gift reward redemption
   */
  giftReward: createRewardRedeemedEvent({
    payload: {
      rewardId: TEST_REWARD_IDS.GIFT,
      rewardName: 'Kit Fitness',
      rewardType: 'gift',
      pointsUsed: 5000,
      monetaryValue: 250.0,
    },
  }),

  /**
   * A service reward redemption
   */
  serviceReward: createRewardRedeemedEvent({
    payload: {
      rewardId: TEST_REWARD_IDS.SERVICE,
      rewardName: 'Consulta com especialista premium',
      rewardType: 'service',
      pointsUsed: 3000,
      monetaryValue: 150.0,
    },
  }),

  /**
   * A first-time reward redemption
   */
  firstTimeReward: createRewardRedeemedEvent({
    payload: {
      rewardId: TEST_REWARD_IDS.DISCOUNT,
      rewardName: 'Desconto na mensalidade',
      rewardType: 'discount',
      pointsUsed: 500,
      monetaryValue: 25.0,
      isFirstRedemption: true,
    },
  }),
};

/**
 * Collection of all plan journey event fixtures
 */
export const planEventFixtures = {
  claims: claimFixtures,
  benefits: benefitFixtures,
  plans: planFixtures,
  rewards: rewardFixtures,
};

/**
 * Factory functions for creating plan journey events
 */
export const planEventFactories = {
  createClaimSubmittedEvent,
  createClaimUpdatedEvent,
  createClaimApprovedEvent,
  createClaimDeniedEvent,
  createBenefitUsedEvent,
  createBenefitLimitReachedEvent,
  createPlanSelectedEvent,
  createPlanChangedEvent,
  createPlanRenewedEvent,
  createPlanComparedEvent,
  createRewardRedeemedEvent,
};

export default {
  fixtures: planEventFixtures,
  factories: planEventFactories,
};