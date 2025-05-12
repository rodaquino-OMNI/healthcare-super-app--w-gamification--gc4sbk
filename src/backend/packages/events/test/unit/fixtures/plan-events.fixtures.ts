/**
 * @file plan-events.fixtures.ts
 * @description Test fixtures for Plan journey events, including claim submission, benefit utilization,
 * plan selection/comparison, and reward redemption events. These fixtures provide structured test data
 * for validating plan-related event processing.
 */

import { v4 as uuidv4 } from 'uuid';
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
} from '@austa/interfaces/gamification/events';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

// Common test data
const TEST_USER_ID = 'user-12345';
const TEST_CORRELATION_ID = 'corr-plan-journey-test';
const TEST_SESSION_ID = 'sess-plan-journey-test';
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_VERSION = '1.0.0';

/**
 * Base journey event fixture with common properties
 */
const baseJourneyEvent: Omit<IJourneyEvent, 'type' | 'payload'> = {
  eventId: uuidv4(),
  timestamp: TEST_TIMESTAMP,
  version: TEST_VERSION,
  source: 'plan-service',
  journeyType: JourneyType.PLAN,
  userId: TEST_USER_ID,
  correlationId: TEST_CORRELATION_ID,
  sessionId: TEST_SESSION_ID,
  metadata: {
    correlationId: TEST_CORRELATION_ID,
    userId: TEST_USER_ID,
    journey: 'plan',
  },
  deviceInfo: {
    type: 'web',
    appVersion: '1.2.3',
  },
};

// ===== CLAIM EVENTS =====

/**
 * Fixture for a claim submission event
 * Represents a user submitting a new claim for reimbursement
 */
export const claimSubmittedEvent: IClaimSubmittedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.CLAIM_SUBMITTED,
  payload: {
    claim: {
      id: 'claim-123',
      userId: TEST_USER_ID,
      planId: 'plan-456',
      status: ClaimStatus.SUBMITTED,
      claimType: 'Consulta Médica',
      amount: 250.00,
      submissionDate: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      description: 'Consulta com cardiologista',
      providerName: 'Dr. Carlos Silva',
      providerTaxId: '12345678901',
      receiptNumber: 'REC-789012',
      documents: [
        { id: 'doc-1', fileName: 'recibo.pdf', fileType: 'application/pdf', fileSize: 1024 * 1024 },
        { id: 'doc-2', fileName: 'pedido_medico.jpg', fileType: 'image/jpeg', fileSize: 2.5 * 1024 * 1024 },
      ],
    },
    submissionDate: TEST_TIMESTAMP,
    amount: 250.00,
    serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'Dr. Carlos Silva',
    hasDocuments: true,
    documentCount: 2,
    isFirstClaim: false,
  },
};

/**
 * Fixture for a claim update event
 * Represents a user updating an existing claim with additional information
 */
export const claimUpdatedEvent: IClaimUpdatedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.CLAIM_UPDATED,
  payload: {
    claim: {
      id: 'claim-123',
      userId: TEST_USER_ID,
      planId: 'plan-456',
      status: ClaimStatus.UNDER_REVIEW,
      claimType: 'Consulta Médica',
      amount: 250.00,
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      description: 'Consulta com cardiologista - atualizado com informações adicionais',
      providerName: 'Dr. Carlos Silva',
      providerTaxId: '12345678901',
      receiptNumber: 'REC-789012',
      documents: [
        { id: 'doc-1', fileName: 'recibo.pdf', fileType: 'application/pdf', fileSize: 1024 * 1024 },
        { id: 'doc-2', fileName: 'pedido_medico.jpg', fileType: 'image/jpeg', fileSize: 2.5 * 1024 * 1024 },
        { id: 'doc-3', fileName: 'laudo_medico.pdf', fileType: 'application/pdf', fileSize: 1.8 * 1024 * 1024 },
      ],
    },
    updateDate: TEST_TIMESTAMP,
    previousStatus: ClaimStatus.SUBMITTED,
    newStatus: ClaimStatus.UNDER_REVIEW,
    updatedFields: ['description', 'documents'],
    documentsAdded: true,
    documentCount: 3,
  },
};

/**
 * Fixture for a claim approval event
 * Represents a claim being approved by the insurance company
 */
export const claimApprovedEvent: IClaimApprovedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.CLAIM_APPROVED,
  payload: {
    claim: {
      id: 'claim-123',
      userId: TEST_USER_ID,
      planId: 'plan-456',
      status: ClaimStatus.APPROVED,
      claimType: 'Consulta Médica',
      amount: 250.00,
      approvedAmount: 225.00,
      submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      approvalDate: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      description: 'Consulta com cardiologista',
      providerName: 'Dr. Carlos Silva',
      providerTaxId: '12345678901',
      receiptNumber: 'REC-789012',
      documents: [
        { id: 'doc-1', fileName: 'recibo.pdf', fileType: 'application/pdf', fileSize: 1024 * 1024 },
        { id: 'doc-2', fileName: 'pedido_medico.jpg', fileType: 'image/jpeg', fileSize: 2.5 * 1024 * 1024 },
      ],
    },
    approvalDate: TEST_TIMESTAMP,
    submittedAmount: 250.00,
    approvedAmount: 225.00,
    coveragePercentage: 90,
    processingDays: 10,
    paymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
    paymentMethod: 'bank_transfer',
  },
};

/**
 * Fixture for a claim denial event
 * Represents a claim being denied by the insurance company
 */
export const claimDeniedEvent: IClaimDeniedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.CLAIM_DENIED,
  payload: {
    claim: {
      id: 'claim-456',
      userId: TEST_USER_ID,
      planId: 'plan-456',
      status: ClaimStatus.DENIED,
      claimType: 'Exame',
      amount: 500.00,
      submissionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      denialDate: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      description: 'Ressonância magnética',
      providerName: 'Clínica Diagnóstica',
      providerTaxId: '98765432101',
      receiptNumber: 'REC-654321',
      documents: [
        { id: 'doc-4', fileName: 'recibo_exame.pdf', fileType: 'application/pdf', fileSize: 1.2 * 1024 * 1024 },
      ],
    },
    denialDate: TEST_TIMESTAMP,
    denialReason: 'Procedimento não coberto pelo plano contratado',
    submittedAmount: 500.00,
    processingDays: 14,
    appealEligible: true,
    appealDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
    additionalInfoRequired: ['Laudo médico detalhado', 'Pedido médico com CID'],
  },
};

/**
 * Fixture for a claim with missing documentation
 * Useful for testing validation and error handling
 */
export const claimWithMissingDocumentation: IClaimSubmittedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.CLAIM_SUBMITTED,
  payload: {
    claim: {
      id: 'claim-789',
      userId: TEST_USER_ID,
      planId: 'plan-456',
      status: ClaimStatus.INCOMPLETE,
      claimType: 'Terapia',
      amount: 150.00,
      submissionDate: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      description: 'Sessão de fisioterapia',
      providerName: 'Clínica Fisio Saúde',
      providerTaxId: '45678912301',
      receiptNumber: 'REC-112233',
      documents: [],
    },
    submissionDate: TEST_TIMESTAMP,
    amount: 150.00,
    serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'Clínica Fisio Saúde',
    hasDocuments: false,
    documentCount: 0,
    isFirstClaim: false,
  },
};

// ===== BENEFIT EVENTS =====

/**
 * Fixture for a benefit usage event
 * Represents a user utilizing a benefit from their insurance plan
 */
export const benefitUsedEvent: IBenefitUsedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.BENEFIT_USED,
  payload: {
    benefit: {
      id: 'benefit-123',
      planId: 'plan-456',
      name: 'Consultas médicas',
      description: 'Cobertura para consultas médicas em consultório',
      coveragePercentage: 90,
      annualLimit: 2000.00,
      usedAmount: 450.00,
      remainingAmount: 1550.00,
      limitType: 'monetary',
    },
    usageDate: TEST_TIMESTAMP,
    provider: 'Clínica São Lucas',
    serviceDescription: 'Consulta com neurologista',
    amountUsed: 250.00,
    remainingAmount: 1550.00,
    remainingPercentage: 77.5,
    isFirstUse: false,
  },
};

/**
 * Fixture for a benefit limit reached event
 * Represents a user reaching the limit of a specific benefit
 */
export const benefitLimitReachedEvent: IBenefitLimitReachedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.BENEFIT_LIMIT_REACHED,
  payload: {
    benefit: {
      id: 'benefit-456',
      planId: 'plan-456',
      name: 'Terapias',
      description: 'Cobertura para sessões de fisioterapia, fonoaudiologia e terapia ocupacional',
      coveragePercentage: 80,
      annualLimit: 40, // 40 sessions per year
      usedAmount: 40,
      remainingAmount: 0,
      limitType: 'quantity',
    },
    reachedDate: TEST_TIMESTAMP,
    limitType: 'visits',
    limitValue: 40,
    renewalDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(), // January 1st of next year
    alternativeBenefits: [
      {
        id: 'benefit-789',
        planId: 'plan-456',
        name: 'Terapias especiais',
        description: 'Cobertura para terapias especiais com autorização prévia',
        coveragePercentage: 70,
        annualLimit: 20,
        usedAmount: 0,
        remainingAmount: 20,
        limitType: 'quantity',
        requiresAuthorization: true,
      },
    ],
  },
};

/**
 * Fixture for a benefit with high usage
 * Useful for testing alerts and notifications
 */
export const benefitHighUsageEvent: IBenefitUsedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.BENEFIT_USED,
  payload: {
    benefit: {
      id: 'benefit-789',
      planId: 'plan-456',
      name: 'Exames de diagnóstico',
      description: 'Cobertura para exames laboratoriais e de imagem',
      coveragePercentage: 80,
      annualLimit: 5000.00,
      usedAmount: 4500.00,
      remainingAmount: 500.00,
      limitType: 'monetary',
    },
    usageDate: TEST_TIMESTAMP,
    provider: 'Laboratório Central',
    serviceDescription: 'Tomografia computadorizada',
    amountUsed: 1200.00,
    remainingAmount: 500.00,
    remainingPercentage: 10,
    isFirstUse: false,
  },
};

// ===== PLAN EVENTS =====

/**
 * Fixture for a plan selection event
 * Represents a user selecting a new insurance plan
 */
export const planSelectedEvent: IPlanSelectedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.PLAN_SELECTED,
  payload: {
    plan: {
      id: 'plan-456',
      name: 'Plano Premium',
      description: 'Plano com cobertura ampla para toda a família',
      provider: 'Austa Seguros',
      type: 'Premium',
      price: 850.00,
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days in future
      endDate: new Date(Date.now() + 380 * 24 * 60 * 60 * 1000).toISOString(), // ~1 year in future
      status: 'active',
      coverageDetails: {
        hospitalCoverage: true,
        dentalCoverage: true,
        visionCoverage: true,
        internationalCoverage: true,
        pharmacyCoverage: true,
      },
    },
    selectionDate: TEST_TIMESTAMP,
    effectiveDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    premium: 850.00,
    paymentFrequency: 'monthly',
    isFirstPlan: false,
    comparedPlansCount: 3,
  },
};

/**
 * Fixture for a plan change event
 * Represents a user switching from one plan to another
 */
export const planChangedEvent: IPlanChangedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.PLAN_CHANGED,
  payload: {
    oldPlan: {
      id: 'plan-123',
      name: 'Plano Standard',
      description: 'Plano com cobertura intermediária',
      provider: 'Austa Seguros',
      type: 'Standard',
      price: 550.00,
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      status: 'active',
      coverageDetails: {
        hospitalCoverage: true,
        dentalCoverage: false,
        visionCoverage: false,
        internationalCoverage: false,
        pharmacyCoverage: true,
      },
    },
    newPlan: {
      id: 'plan-456',
      name: 'Plano Premium',
      description: 'Plano com cobertura ampla para toda a família',
      provider: 'Austa Seguros',
      type: 'Premium',
      price: 850.00,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
      endDate: new Date(Date.now() + 395 * 24 * 60 * 60 * 1000).toISOString(), // ~1 year + 30 days in future
      status: 'pending',
      coverageDetails: {
        hospitalCoverage: true,
        dentalCoverage: true,
        visionCoverage: true,
        internationalCoverage: true,
        pharmacyCoverage: true,
      },
    },
    changeDate: TEST_TIMESTAMP,
    effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    premiumDifference: 300.00,
    changeReason: 'Necessidade de cobertura odontológica e oftalmológica',
    benefitChanges: {
      added: ['Cobertura odontológica', 'Cobertura oftalmológica', 'Cobertura internacional'],
      removed: [],
      improved: ['Cobertura hospitalar - aumento de limite'],
      reduced: [],
    },
  },
};

/**
 * Fixture for a plan renewal event
 * Represents a user renewing their existing insurance plan
 */
export const planRenewedEvent: IPlanRenewedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.PLAN_RENEWED,
  payload: {
    plan: {
      id: 'plan-456',
      name: 'Plano Premium',
      description: 'Plano com cobertura ampla para toda a família',
      provider: 'Austa Seguros',
      type: 'Premium',
      price: 892.50, // 5% increase
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days in future
      endDate: new Date(Date.now() + 380 * 24 * 60 * 60 * 1000).toISOString(), // ~1 year in future
      status: 'active',
      coverageDetails: {
        hospitalCoverage: true,
        dentalCoverage: true,
        visionCoverage: true,
        internationalCoverage: true,
        pharmacyCoverage: true,
      },
    },
    renewalDate: TEST_TIMESTAMP,
    previousEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    newEndDate: new Date(Date.now() + 380 * 24 * 60 * 60 * 1000).toISOString(),
    premiumChange: 42.50,
    premiumChangePercentage: 5,
    benefitChanges: false,
    yearsWithPlan: 2,
  },
};

/**
 * Fixture for a plan comparison event
 * Represents a user comparing different insurance plans
 */
export const planComparedEvent: IPlanComparedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.PLAN_COMPARED,
  payload: {
    plansCompared: [
      {
        id: 'plan-123',
        name: 'Plano Básico',
        description: 'Plano com cobertura básica',
        provider: 'Austa Seguros',
        type: 'Básico',
        price: 350.00,
        coverageDetails: {
          hospitalCoverage: true,
          dentalCoverage: false,
          visionCoverage: false,
          internationalCoverage: false,
          pharmacyCoverage: false,
        },
      },
      {
        id: 'plan-456',
        name: 'Plano Standard',
        description: 'Plano com cobertura intermediária',
        provider: 'Austa Seguros',
        type: 'Standard',
        price: 550.00,
        coverageDetails: {
          hospitalCoverage: true,
          dentalCoverage: false,
          visionCoverage: false,
          internationalCoverage: false,
          pharmacyCoverage: true,
        },
      },
      {
        id: 'plan-789',
        name: 'Plano Premium',
        description: 'Plano com cobertura ampla para toda a família',
        provider: 'Austa Seguros',
        type: 'Premium',
        price: 850.00,
        coverageDetails: {
          hospitalCoverage: true,
          dentalCoverage: true,
          visionCoverage: true,
          internationalCoverage: true,
          pharmacyCoverage: true,
        },
      },
    ],
    comparisonDate: TEST_TIMESTAMP,
    comparisonCriteria: ['price', 'coverage', 'benefits', 'network'],
    selectedPlanId: 'plan-456',
    comparisonDuration: 420, // 7 minutes in seconds
    userPreferences: {
      prioritizeCoverage: true,
      maxBudget: 600.00,
      requiredBenefits: ['hospitalCoverage', 'pharmacyCoverage'],
      preferredProviders: ['Hospital São Lucas', 'Clínica Central'],
    },
  },
};

// ===== REWARD EVENTS =====

/**
 * Fixture for a reward redemption event
 * Represents a user redeeming points for a reward
 */
export const rewardRedeemedEvent: IRewardRedeemedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.REWARD_REDEEMED,
  payload: {
    rewardId: 'reward-123',
    rewardName: 'Desconto na mensalidade',
    rewardType: 'discount',
    redemptionDate: TEST_TIMESTAMP,
    pointsUsed: 5000,
    monetaryValue: 100.00,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in future
    isFirstRedemption: false,
  },
};

/**
 * Fixture for a gift card reward redemption
 * Represents a user redeeming points for a gift card
 */
export const giftCardRewardRedeemedEvent: IRewardRedeemedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.REWARD_REDEEMED,
  payload: {
    rewardId: 'reward-456',
    rewardName: 'Vale-presente Farmácia',
    rewardType: 'gift',
    redemptionDate: TEST_TIMESTAMP,
    pointsUsed: 2500,
    monetaryValue: 50.00,
    expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days in future
    isFirstRedemption: false,
  },
};

/**
 * Fixture for a service reward redemption
 * Represents a user redeeming points for a free service
 */
export const serviceRewardRedeemedEvent: IRewardRedeemedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.REWARD_REDEEMED,
  payload: {
    rewardId: 'reward-789',
    rewardName: 'Consulta de nutrição gratuita',
    rewardType: 'service',
    redemptionDate: TEST_TIMESTAMP,
    pointsUsed: 7500,
    monetaryValue: 150.00,
    expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days in future
    isFirstRedemption: true,
  },
};

/**
 * Fixture for a cashback reward redemption
 * Represents a user redeeming points for cashback
 */
export const cashbackRewardRedeemedEvent: IRewardRedeemedEvent = {
  ...baseJourneyEvent,
  eventId: uuidv4(),
  type: PlanEventType.REWARD_REDEEMED,
  payload: {
    rewardId: 'reward-101',
    rewardName: 'Cashback em conta',
    rewardType: 'cashback',
    redemptionDate: TEST_TIMESTAMP,
    pointsUsed: 10000,
    monetaryValue: 200.00,
    expirationDate: null, // No expiration for cashback
    isFirstRedemption: false,
  },
};

// Export collections of fixtures for easier consumption in tests

/**
 * Collection of claim-related event fixtures
 */
export const claimEventFixtures = {
  submitted: claimSubmittedEvent,
  updated: claimUpdatedEvent,
  approved: claimApprovedEvent,
  denied: claimDeniedEvent,
  incomplete: claimWithMissingDocumentation,
};

/**
 * Collection of benefit-related event fixtures
 */
export const benefitEventFixtures = {
  used: benefitUsedEvent,
  limitReached: benefitLimitReachedEvent,
  highUsage: benefitHighUsageEvent,
};

/**
 * Collection of plan-related event fixtures
 */
export const planEventFixtures = {
  selected: planSelectedEvent,
  changed: planChangedEvent,
  renewed: planRenewedEvent,
  compared: planComparedEvent,
};

/**
 * Collection of reward-related event fixtures
 */
export const rewardEventFixtures = {
  discount: rewardRedeemedEvent,
  giftCard: giftCardRewardRedeemedEvent,
  service: serviceRewardRedeemedEvent,
  cashback: cashbackRewardRedeemedEvent,
};

/**
 * All plan journey event fixtures
 */
export const allPlanEventFixtures = {
  ...claimEventFixtures,
  ...benefitEventFixtures,
  ...planEventFixtures,
  ...rewardEventFixtures,
};