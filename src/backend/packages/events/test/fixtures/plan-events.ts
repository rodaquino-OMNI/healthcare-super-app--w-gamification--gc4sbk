/**
 * @file Plan journey event test fixtures
 * @description Contains test fixtures for Plan journey events including claim submission,
 * benefit utilization, plan selection/comparison, and reward redemption. These fixtures
 * provide standardized test data for gamification rules, achievement processing, and
 * notifications related to the Plan journey.
 */

import {
  EventType,
  EventJourney,
  GamificationEvent,
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload,
} from '../../../interfaces/gamification/events';

import { ClaimStatus } from '../../../interfaces/journey/plan/claim.interface';

/**
 * Base event fixture generator for Plan journey events
 * 
 * @param type - The event type
 * @param payload - The event payload
 * @param userId - The user ID (defaults to a test user ID)
 * @returns A complete GamificationEvent object
 */
const createPlanEvent = <T>(
  type: EventType,
  payload: T,
  userId: string = 'test-user-123'
): GamificationEvent => ({
  eventId: `plan-event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type,
  userId,
  journey: EventJourney.PLAN,
  payload: payload as any,
  version: { major: 1, minor: 0, patch: 0 },
  createdAt: new Date().toISOString(),
  source: 'plan-service',
  correlationId: `corr-${Date.now()}`
});

// ==========================================
// Claim Submission Event Fixtures
// ==========================================

/**
 * Fixture for a claim submission event (medical consultation)
 */
export const claimSubmittedMedicalConsultation = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-123',
    claimType: 'Consulta Médica',
    amount: 250.00,
    metadata: {
      provider: 'Dr. Ana Silva',
      specialty: 'Cardiologia',
      date: new Date().toISOString(),
      isComplete: true,
      documentCount: 2
    }
  }
);

/**
 * Fixture for a claim submission event (medical exam)
 */
export const claimSubmittedMedicalExam = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-456',
    claimType: 'Exame',
    amount: 350.00,
    metadata: {
      examType: 'Ressonância Magnética',
      provider: 'Clínica Diagnóstica Central',
      date: new Date().toISOString(),
      isComplete: true,
      documentCount: 3
    }
  }
);

/**
 * Fixture for a claim submission event (therapy session)
 */
export const claimSubmittedTherapy = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-789',
    claimType: 'Terapia',
    amount: 180.00,
    metadata: {
      therapyType: 'Fisioterapia',
      provider: 'Centro de Reabilitação Física',
      date: new Date().toISOString(),
      isComplete: true,
      documentCount: 1
    }
  }
);

/**
 * Fixture for a claim submission event (medication)
 */
export const claimSubmittedMedication = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-101',
    claimType: 'Medicamento',
    amount: 120.50,
    metadata: {
      medicationName: 'Losartana 50mg',
      pharmacy: 'Farmácia Popular',
      date: new Date().toISOString(),
      isComplete: true,
      documentCount: 2,
      prescriptionIncluded: true
    }
  }
);

/**
 * Fixture for a claim submission event (hospitalization)
 */
export const claimSubmittedHospitalization = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-202',
    claimType: 'Internação',
    amount: 5000.00,
    metadata: {
      hospital: 'Hospital São Lucas',
      admissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      dischargeDate: new Date().toISOString(),
      reason: 'Cirurgia de Apendicite',
      isComplete: true,
      documentCount: 5
    }
  }
);

/**
 * Fixture for an incomplete claim submission event
 */
export const claimSubmittedIncomplete = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_SUBMITTED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-303',
    claimType: 'Consulta Médica',
    amount: 200.00,
    metadata: {
      provider: 'Dr. Carlos Mendes',
      specialty: 'Oftalmologia',
      date: new Date().toISOString(),
      isComplete: false,
      documentCount: 0,
      missingDocuments: ['receipt', 'medical_report']
    }
  }
);

/**
 * Fixture for a claim approved event
 */
export const claimApproved = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_APPROVED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-123',
    claimType: 'Consulta Médica',
    amount: 250.00,
    metadata: {
      approvalDate: new Date().toISOString(),
      reimbursementAmount: 200.00, // 80% coverage
      expectedPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      status: ClaimStatus.APPROVED
    }
  }
);

/**
 * Fixture for a claim document uploaded event
 */
export const claimDocumentUploaded = createPlanEvent<ClaimEventPayload>(
  EventType.CLAIM_DOCUMENT_UPLOADED,
  {
    timestamp: new Date().toISOString(),
    claimId: 'claim-303',
    claimType: 'Consulta Médica',
    documentCount: 2,
    metadata: {
      documentTypes: ['receipt', 'medical_report'],
      uploadedBy: 'test-user-123',
      isComplete: true,
      status: ClaimStatus.SUBMITTED
    }
  }
);

// ==========================================
// Benefit Utilization Event Fixtures
// ==========================================

/**
 * Fixture for a dental benefit utilization event
 */
export const benefitUtilizedDental = createPlanEvent<BenefitUtilizedPayload>(
  EventType.BENEFIT_UTILIZED,
  {
    timestamp: new Date().toISOString(),
    benefitId: 'benefit-123',
    benefitType: 'Dental',
    value: 150.00,
    metadata: {
      procedure: 'Limpeza Dental',
      provider: 'Clínica Odontológica Sorriso',
      date: new Date().toISOString(),
      remainingCoverage: 850.00,
      annualLimit: 1000.00
    }
  }
);

/**
 * Fixture for a vision benefit utilization event
 */
export const benefitUtilizedVision = createPlanEvent<BenefitUtilizedPayload>(
  EventType.BENEFIT_UTILIZED,
  {
    timestamp: new Date().toISOString(),
    benefitId: 'benefit-456',
    benefitType: 'Vision',
    value: 500.00,
    metadata: {
      procedure: 'Exame Oftalmológico + Óculos',
      provider: 'Ótica Visão Clara',
      date: new Date().toISOString(),
      remainingCoverage: 0.00,
      annualLimit: 500.00,
      isLimitReached: true
    }
  }
);

/**
 * Fixture for a gym membership benefit utilization event
 */
export const benefitUtilizedGym = createPlanEvent<BenefitUtilizedPayload>(
  EventType.BENEFIT_UTILIZED,
  {
    timestamp: new Date().toISOString(),
    benefitId: 'benefit-789',
    benefitType: 'Wellness',
    value: 100.00,
    metadata: {
      benefitName: 'Reembolso Academia',
      provider: 'Academia Corpo em Forma',
      date: new Date().toISOString(),
      remainingCoverage: 400.00,
      annualLimit: 1200.00,
      monthlyLimit: 100.00,
      isRecurring: true
    }
  }
);

/**
 * Fixture for a mental health benefit utilization event
 */
export const benefitUtilizedMentalHealth = createPlanEvent<BenefitUtilizedPayload>(
  EventType.BENEFIT_UTILIZED,
  {
    timestamp: new Date().toISOString(),
    benefitId: 'benefit-101',
    benefitType: 'Mental Health',
    value: 200.00,
    metadata: {
      procedure: 'Sessão de Terapia',
      provider: 'Centro de Psicologia Bem Estar',
      date: new Date().toISOString(),
      remainingCoverage: 1800.00,
      annualLimit: 2400.00,
      sessionCount: 4,
      maxSessions: 24
    }
  }
);

/**
 * Fixture for a preventive care benefit utilization event
 */
export const benefitUtilizedPreventiveCare = createPlanEvent<BenefitUtilizedPayload>(
  EventType.BENEFIT_UTILIZED,
  {
    timestamp: new Date().toISOString(),
    benefitId: 'benefit-202',
    benefitType: 'Preventive Care',
    value: 0.00, // Fully covered
    metadata: {
      procedure: 'Check-up Anual',
      provider: 'Clínica Preventiva Saúde Total',
      date: new Date().toISOString(),
      isCovered100Percent: true,
      coverageType: 'direct'
    }
  }
);

// ==========================================
// Plan Selection and Comparison Event Fixtures
// ==========================================

/**
 * Fixture for a plan selection event (basic plan)
 */
export const planSelectedBasic = createPlanEvent<PlanEventPayload>(
  EventType.PLAN_SELECTED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-123',
    planType: 'Básico',
    isUpgrade: false,
    metadata: {
      monthlyPremium: 350.00,
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      isFirstPlan: true,
      selectedBenefits: ['basic_medical', 'emergency', 'preventive_care']
    }
  }
);

/**
 * Fixture for a plan selection event (standard plan)
 */
export const planSelectedStandard = createPlanEvent<PlanEventPayload>(
  EventType.PLAN_SELECTED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-456',
    planType: 'Standard',
    isUpgrade: true,
    metadata: {
      monthlyPremium: 550.00,
      previousPlanId: 'plan-123',
      previousPlanType: 'Básico',
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      selectedBenefits: ['standard_medical', 'emergency', 'preventive_care', 'dental', 'vision']
    }
  }
);

/**
 * Fixture for a plan selection event (premium plan)
 */
export const planSelectedPremium = createPlanEvent<PlanEventPayload>(
  EventType.PLAN_SELECTED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-789',
    planType: 'Premium',
    isUpgrade: true,
    metadata: {
      monthlyPremium: 950.00,
      previousPlanId: 'plan-456',
      previousPlanType: 'Standard',
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      selectedBenefits: ['premium_medical', 'emergency', 'preventive_care', 'dental', 'vision', 'mental_health', 'wellness', 'international']
    }
  }
);

/**
 * Fixture for a plan comparison event
 */
export const planCompared = createPlanEvent<PlanEventPayload>(
  EventType.PLAN_COMPARED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-123', // Current plan
    planType: 'Básico',
    comparedPlanIds: ['plan-456', 'plan-789'],
    metadata: {
      comparedPlanTypes: ['Standard', 'Premium'],
      comparisonCategories: ['price', 'coverage', 'benefits', 'network'],
      currentMonthlyPremium: 350.00,
      comparedMonthlyPremiums: [550.00, 950.00],
      comparisonDuration: 300, // seconds spent comparing
      userSegment: 'price_sensitive'
    }
  }
);

/**
 * Fixture for a plan renewal event
 */
export const planRenewed = createPlanEvent<PlanEventPayload>(
  EventType.PLAN_RENEWED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-456',
    planType: 'Standard',
    isUpgrade: false,
    metadata: {
      monthlyPremium: 580.00, // Slight increase from previous premium
      previousMonthlyPremium: 550.00,
      coverageStart: new Date().toISOString(),
      coverageEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      yearsWithPlan: 1,
      renewalChanges: ['premium_adjustment', 'added_telemedicine']
    }
  }
);

/**
 * Fixture for a coverage reviewed event
 */
export const coverageReviewed = createPlanEvent<PlanEventPayload>(
  EventType.COVERAGE_REVIEWED,
  {
    timestamp: new Date().toISOString(),
    planId: 'plan-456',
    planType: 'Standard',
    metadata: {
      reviewDuration: 180, // seconds spent reviewing
      reviewedCategories: ['medical', 'dental', 'vision', 'emergency'],
      downloadedDocuments: ['coverage_summary', 'network_providers'],
      searchQueries: ['cardiologist coverage', 'dental annual limit']
    }
  }
);

// ==========================================
// Reward Redemption Event Fixtures
// ==========================================

/**
 * Fixture for a reward redemption event (discount coupon)
 */
export const rewardRedeemedDiscount = createPlanEvent<Record<string, any>>(
  EventType.REWARD_REDEEMED,
  {
    timestamp: new Date().toISOString(),
    rewardId: 'reward-123',
    rewardType: 'discount_coupon',
    metadata: {
      rewardTitle: 'Desconto de 10% na Renovação',
      rewardValue: 10, // percentage
      applicableTo: 'plan_renewal',
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      earnedFrom: 'claim_submission_streak'
    }
  }
);

/**
 * Fixture for a reward redemption event (premium benefit)
 */
export const rewardRedeemedPremiumBenefit = createPlanEvent<Record<string, any>>(
  EventType.REWARD_REDEEMED,
  {
    timestamp: new Date().toISOString(),
    rewardId: 'reward-456',
    rewardType: 'premium_benefit',
    metadata: {
      rewardTitle: 'Acesso a Telemedicina Premium',
      benefitDuration: 30, // days
      normallyIncludedIn: 'Premium',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      earnedFrom: 'preventive_care_achievement'
    }
  }
);

/**
 * Fixture for a reward redemption event (wellness credit)
 */
export const rewardRedeemedWellnessCredit = createPlanEvent<Record<string, any>>(
  EventType.REWARD_REDEEMED,
  {
    timestamp: new Date().toISOString(),
    rewardId: 'reward-789',
    rewardType: 'wellness_credit',
    metadata: {
      rewardTitle: 'Crédito para Academia',
      creditAmount: 100.00,
      applicableTo: 'gym_membership',
      expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
      earnedFrom: 'health_goal_achievement'
    }
  }
);

/**
 * Fixture for a reward redemption event (priority service)
 */
export const rewardRedeemedPriorityService = createPlanEvent<Record<string, any>>(
  EventType.REWARD_REDEEMED,
  {
    timestamp: new Date().toISOString(),
    rewardId: 'reward-101',
    rewardType: 'priority_service',
    metadata: {
      rewardTitle: 'Atendimento Prioritário',
      serviceDuration: 90, // days
      serviceType: 'claim_processing',
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      earnedFrom: 'plan_loyalty'
    }
  }
);

/**
 * Fixture for a reward redemption event (partner discount)
 */
export const rewardRedeemedPartnerDiscount = createPlanEvent<Record<string, any>>(
  EventType.REWARD_REDEEMED,
  {
    timestamp: new Date().toISOString(),
    rewardId: 'reward-202',
    rewardType: 'partner_discount',
    metadata: {
      rewardTitle: 'Desconto em Farmácia Parceira',
      discountAmount: 15, // percentage
      partnerName: 'Rede de Farmácias Saúde',
      minimumPurchase: 50.00,
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
      earnedFrom: 'medication_adherence_achievement'
    }
  }
);

// Export all fixtures as a collection for easy access
export const planEventFixtures = {
  // Claim events
  claimSubmittedMedicalConsultation,
  claimSubmittedMedicalExam,
  claimSubmittedTherapy,
  claimSubmittedMedication,
  claimSubmittedHospitalization,
  claimSubmittedIncomplete,
  claimApproved,
  claimDocumentUploaded,
  
  // Benefit utilization events
  benefitUtilizedDental,
  benefitUtilizedVision,
  benefitUtilizedGym,
  benefitUtilizedMentalHealth,
  benefitUtilizedPreventiveCare,
  
  // Plan selection and comparison events
  planSelectedBasic,
  planSelectedStandard,
  planSelectedPremium,
  planCompared,
  planRenewed,
  coverageReviewed,
  
  // Reward redemption events
  rewardRedeemedDiscount,
  rewardRedeemedPremiumBenefit,
  rewardRedeemedWellnessCredit,
  rewardRedeemedPriorityService,
  rewardRedeemedPartnerDiscount
};