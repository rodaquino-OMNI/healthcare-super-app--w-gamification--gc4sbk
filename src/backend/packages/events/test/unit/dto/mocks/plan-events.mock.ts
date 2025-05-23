/**
 * @file plan-events.mock.ts
 * @description Provides mock data for Plan journey events (CLAIM_SUBMITTED, BENEFIT_UTILIZED, PLAN_SELECTED)
 * to facilitate testing of the gamification engine's handling of insurance and benefits-related events.
 * These mocks represent structured event data for the various plan-related user actions that trigger
 * gamification processes.
 */

import { EventType } from '../../../../src/dto/event-types.enum';
import { EventMetadataDto, EventPriority } from '../../../../src/dto/event-metadata.dto';

// Common test UUIDs for consistency
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_PROVIDER_ID = '223e4567-e89b-12d3-a456-426614174001';
const TEST_CLAIM_ID = '723e4567-e89b-12d3-a456-426614174006';
const TEST_BENEFIT_ID = '823e4567-e89b-12d3-a456-426614174007';
const TEST_PLAN_ID = '923e4567-e89b-12d3-a456-426614174008';

// Common test timestamps for consistency
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_PAST_TIMESTAMP = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
const TEST_FUTURE_TIMESTAMP = new Date(Date.now() + 86400000).toISOString(); // 1 day in future

// Common test metadata
const TEST_METADATA = EventMetadataDto.createWithCorrelation();

/**
 * Mock data for Plan Claim events
 */
export const planClaimEvents = {
  /**
   * Valid PLAN_CLAIM_SUBMITTED event for a medical consultation
   */
  medicalConsultationClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: TEST_CLAIM_ID,
      claimType: 'Consulta Médica',
      amount: 250.00,
      currency: 'BRL',
      serviceDate: TEST_PAST_TIMESTAMP,
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Clínica São Paulo',
        id: TEST_PROVIDER_ID
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_consulta.pdf'
        },
        {
          type: 'MEDICAL_REPORT',
          fileId: crypto.randomUUID(),
          fileName: 'relatorio_medico.pdf'
        }
      ],
      isComplete: true,
      hasDocuments: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_SUBMITTED event for a medical exam
   */
  medicalExamClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: crypto.randomUUID(),
      claimType: 'Exame',
      amount: 350.00,
      currency: 'BRL',
      serviceDate: TEST_PAST_TIMESTAMP,
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Laboratório Diagnósticos',
        id: crypto.randomUUID()
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_exame.pdf'
        },
        {
          type: 'EXAM_RESULTS',
          fileId: crypto.randomUUID(),
          fileName: 'resultado_exame.pdf'
        },
        {
          type: 'MEDICAL_REQUEST',
          fileId: crypto.randomUUID(),
          fileName: 'pedido_medico.pdf'
        }
      ],
      isComplete: true,
      hasDocuments: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_SUBMITTED event for therapy session
   */
  therapyClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: crypto.randomUUID(),
      claimType: 'Terapia',
      amount: 180.00,
      currency: 'BRL',
      serviceDate: TEST_PAST_TIMESTAMP,
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Centro de Terapia Integrada',
        id: crypto.randomUUID()
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_terapia.pdf'
        }
      ],
      isComplete: true,
      hasDocuments: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_SUBMITTED event for hospitalization
   */
  hospitalizationClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: crypto.randomUUID(),
      claimType: 'Internação',
      amount: 5000.00,
      currency: 'BRL',
      serviceDate: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Hospital Santa Maria',
        id: crypto.randomUUID()
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_hospital.pdf'
        },
        {
          type: 'MEDICAL_REPORT',
          fileId: crypto.randomUUID(),
          fileName: 'relatorio_medico.pdf'
        },
        {
          type: 'DISCHARGE_SUMMARY',
          fileId: crypto.randomUUID(),
          fileName: 'resumo_alta.pdf'
        }
      ],
      isComplete: true,
      hasDocuments: true,
      hospitalizationDays: 5,
      admissionDate: new Date(Date.now() - 12 * 86400000).toISOString(), // 12 days ago
      dischargeDate: new Date(Date.now() - 7 * 86400000).toISOString() // 7 days ago
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_SUBMITTED event for medication
   */
  medicationClaimSubmitted: {
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: crypto.randomUUID(),
      claimType: 'Medicamento',
      amount: 120.00,
      currency: 'BRL',
      serviceDate: TEST_PAST_TIMESTAMP,
      submissionDate: TEST_TIMESTAMP,
      provider: {
        name: 'Farmácia São João',
        id: crypto.randomUUID()
      },
      documents: [
        {
          type: 'RECEIPT',
          fileId: crypto.randomUUID(),
          fileName: 'recibo_farmacia.pdf'
        },
        {
          type: 'PRESCRIPTION',
          fileId: crypto.randomUUID(),
          fileName: 'receita_medica.pdf'
        }
      ],
      isComplete: true,
      hasDocuments: true,
      medications: [
        {
          name: 'Losartana',
          dosage: '50mg',
          quantity: 30,
          unitPrice: 4.00
        }
      ]
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_APPROVED event
   */
  claimApproved: {
    type: EventType.PLAN_CLAIM_APPROVED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: TEST_CLAIM_ID,
      approvalDate: TEST_TIMESTAMP,
      approvedAmount: 225.00,
      currency: 'BRL',
      paymentDate: TEST_FUTURE_TIMESTAMP,
      paymentMethod: 'BANK_TRANSFER',
      processingDays: 3,
      bankAccount: {
        bank: 'Itaú',
        accountType: 'CHECKING',
        lastFour: '4321'
      }
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_CLAIM_REJECTED event
   */
  claimRejected: {
    type: EventType.PLAN_CLAIM_REJECTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      claimId: crypto.randomUUID(),
      rejectionDate: TEST_TIMESTAMP,
      reason: 'INCOMPLETE_DOCUMENTATION',
      canResubmit: true,
      missingDocuments: ['MEDICAL_REQUEST', 'DETAILED_RECEIPT'],
      feedback: 'Por favor, envie o pedido médico e o recibo detalhado para reanálise.'
    },
    metadata: TEST_METADATA
  }
};

/**
 * Mock data for Plan Benefit events
 */
export const planBenefitEvents = {
  /**
   * Valid PLAN_BENEFIT_VIEWED event
   */
  benefitViewed: {
    type: EventType.PLAN_BENEFIT_VIEWED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: TEST_BENEFIT_ID,
      benefitType: 'DENTAL',
      viewDate: TEST_TIMESTAMP,
      viewDuration: 45, // seconds
      deviceType: 'MOBILE'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_UTILIZED event for gym membership
   */
  gymMembershipBenefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: TEST_BENEFIT_ID,
      benefitType: 'GYM_MEMBERSHIP',
      utilizationDate: TEST_TIMESTAMP,
      provider: 'Academia SmartFit',
      location: 'São Paulo - Paulista',
      value: 120.00,
      currency: 'BRL',
      isFirstUtilization: true,
      remainingCoverage: 880.00
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_UTILIZED event for dental care
   */
  dentalBenefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: crypto.randomUUID(),
      benefitType: 'DENTAL',
      utilizationDate: TEST_TIMESTAMP,
      provider: 'Clínica Odontológica Sorriso',
      location: 'São Paulo - Centro',
      value: 200.00,
      currency: 'BRL',
      isFirstUtilization: false,
      remainingCoverage: 1800.00,
      procedureType: 'CLEANING'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_UTILIZED event for mental health
   */
  mentalHealthBenefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: crypto.randomUUID(),
      benefitType: 'MENTAL_HEALTH',
      utilizationDate: TEST_TIMESTAMP,
      provider: 'Centro de Psicologia Integrada',
      location: 'São Paulo - Pinheiros',
      value: 150.00,
      currency: 'BRL',
      isFirstUtilization: false,
      remainingCoverage: 1350.00,
      sessionType: 'THERAPY',
      sessionCount: 1
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_BENEFIT_UTILIZED event for nutrition
   */
  nutritionBenefitUtilized: {
    type: EventType.PLAN_BENEFIT_UTILIZED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      benefitId: crypto.randomUUID(),
      benefitType: 'NUTRITION',
      utilizationDate: TEST_TIMESTAMP,
      provider: 'Consultório de Nutrição Saúde',
      location: 'São Paulo - Moema',
      value: 180.00,
      currency: 'BRL',
      isFirstUtilization: true,
      remainingCoverage: 1620.00,
      consultationType: 'INITIAL_ASSESSMENT'
    },
    metadata: TEST_METADATA
  }
};

/**
 * Mock data for Plan Selection events
 */
export const planSelectionEvents = {
  /**
   * Valid PLAN_SELECTED event for individual plan
   */
  individualPlanSelected: {
    type: EventType.PLAN_SELECTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: TEST_PLAN_ID,
      planName: 'Premium Individual',
      planType: 'Premium',
      coverageLevel: 'INDIVIDUAL',
      startDate: TEST_FUTURE_TIMESTAMP,
      selectionDate: TEST_TIMESTAMP,
      monthlyPremium: 650.00,
      currency: 'BRL',
      dependents: 0,
      previousPlanId: null,
      isUpgrade: false
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_SELECTED event for family plan
   */
  familyPlanSelected: {
    type: EventType.PLAN_SELECTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: crypto.randomUUID(),
      planName: 'Premium Família',
      planType: 'Premium',
      coverageLevel: 'FAMILY',
      startDate: TEST_FUTURE_TIMESTAMP,
      selectionDate: TEST_TIMESTAMP,
      monthlyPremium: 850.00,
      currency: 'BRL',
      dependents: 2,
      previousPlanId: crypto.randomUUID(),
      isUpgrade: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_SELECTED event for basic plan
   */
  basicPlanSelected: {
    type: EventType.PLAN_SELECTED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: crypto.randomUUID(),
      planName: 'Básico Individual',
      planType: 'Básico',
      coverageLevel: 'INDIVIDUAL',
      startDate: TEST_FUTURE_TIMESTAMP,
      selectionDate: TEST_TIMESTAMP,
      monthlyPremium: 350.00,
      currency: 'BRL',
      dependents: 0,
      previousPlanId: crypto.randomUUID(),
      isUpgrade: false
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_COMPARISON_PERFORMED event
   */
  planComparisonPerformed: {
    type: EventType.PLAN_COMPARISON_PERFORMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planIds: [TEST_PLAN_ID, crypto.randomUUID(), crypto.randomUUID()],
      comparisonDate: TEST_TIMESTAMP,
      selectedFilters: ['PRICE', 'COVERAGE', 'NETWORK'],
      comparisonDuration: 180, // seconds
      selectedPlanId: TEST_PLAN_ID
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_PLAN_RENEWED event
   */
  planRenewed: {
    type: EventType.PLAN_PLAN_RENEWED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      planId: TEST_PLAN_ID,
      planName: 'Premium Individual',
      renewalDate: TEST_TIMESTAMP,
      previousEndDate: TEST_PAST_TIMESTAMP,
      newEndDate: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year from now
      premium: 680.00, // slight increase
      premiumChange: 30.00,
      consecutiveYears: 2
    },
    metadata: TEST_METADATA
  }
};

/**
 * Mock data for Plan Document events
 */
export const planDocumentEvents = {
  /**
   * Valid PLAN_DOCUMENT_UPLOADED event for medical certificate
   */
  medicalCertificateUploaded: {
    type: EventType.PLAN_DOCUMENT_UPLOADED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      documentId: crypto.randomUUID(),
      documentType: 'MEDICAL_CERTIFICATE',
      uploadDate: TEST_TIMESTAMP,
      fileSize: 1250000, // bytes
      fileName: 'atestado_medico.pdf',
      mimeType: 'application/pdf',
      relatedEntityId: TEST_CLAIM_ID,
      relatedEntityType: 'CLAIM'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_DOCUMENT_UPLOADED event for receipt
   */
  receiptUploaded: {
    type: EventType.PLAN_DOCUMENT_UPLOADED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      documentId: crypto.randomUUID(),
      documentType: 'RECEIPT',
      uploadDate: TEST_TIMESTAMP,
      fileSize: 950000, // bytes
      fileName: 'recibo_consulta.pdf',
      mimeType: 'application/pdf',
      relatedEntityId: crypto.randomUUID(),
      relatedEntityType: 'CLAIM'
    },
    metadata: TEST_METADATA
  }
};

/**
 * Mock data for Plan Reward events
 */
export const planRewardEvents = {
  /**
   * Valid PLAN_REWARD_REDEEMED event for pharmacy discount
   */
  pharmacyDiscountRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      rewardId: crypto.randomUUID(),
      rewardType: 'DISCOUNT',
      pointsCost: 500,
      redemptionDate: TEST_TIMESTAMP,
      value: 50.00,
      currency: 'BRL',
      expirationDate: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days from now
      category: 'PHARMACY',
      partnerName: 'Drogaria São Paulo',
      couponCode: 'AUSTA50OFF'
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_REWARD_REDEEMED event for wellness service
   */
  wellnessServiceRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      rewardId: crypto.randomUUID(),
      rewardType: 'SERVICE',
      pointsCost: 1000,
      redemptionDate: TEST_TIMESTAMP,
      value: 150.00,
      currency: 'BRL',
      expirationDate: new Date(Date.now() + 60 * 86400000).toISOString(), // 60 days from now
      category: 'WELLNESS',
      partnerName: 'Spa Urbano',
      serviceName: 'Massagem Relaxante',
      appointmentRequired: true
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_REWARD_REDEEMED event for premium plan discount
   */
  premiumPlanDiscountRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      rewardId: crypto.randomUUID(),
      rewardType: 'PLAN_DISCOUNT',
      pointsCost: 2000,
      redemptionDate: TEST_TIMESTAMP,
      value: 100.00,
      currency: 'BRL',
      expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
      category: 'INSURANCE',
      discountPeriod: 3, // months
      applicablePlans: ['Premium Individual', 'Premium Família']
    },
    metadata: TEST_METADATA
  },

  /**
   * Valid PLAN_REWARD_REDEEMED event for health device
   */
  healthDeviceRedeemed: {
    type: EventType.PLAN_REWARD_REDEEMED,
    userId: TEST_USER_ID,
    journey: 'plan',
    timestamp: TEST_TIMESTAMP,
    data: {
      rewardId: crypto.randomUUID(),
      rewardType: 'PHYSICAL_PRODUCT',
      pointsCost: 5000,
      redemptionDate: TEST_TIMESTAMP,
      value: 350.00,
      currency: 'BRL',
      category: 'HEALTH_DEVICE',
      productName: 'Monitor de Pressão Arterial Digital',
      shippingAddress: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Apto 123',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100'
      },
      estimatedDelivery: new Date(Date.now() + 15 * 86400000).toISOString() // 15 days from now
    },
    metadata: TEST_METADATA
  }
};

/**
 * All plan events combined for easy access
 */
export const planEvents = {
  claims: planClaimEvents,
  benefits: planBenefitEvents,
  selection: planSelectionEvents,
  documents: planDocumentEvents,
  rewards: planRewardEvents
};

/**
 * Flat array of all plan events for testing
 */
export const allPlanEvents = [
  ...Object.values(planClaimEvents),
  ...Object.values(planBenefitEvents),
  ...Object.values(planSelectionEvents),
  ...Object.values(planDocumentEvents),
  ...Object.values(planRewardEvents)
];

/**
 * Creates a custom plan event with specified properties
 * @param eventType The type of plan event to create
 * @param customProps Custom properties to override defaults
 * @returns A plan event with the specified properties
 */
export function createPlanEvent(eventType: EventType, customProps: Record<string, any> = {}) {
  // Find a matching event template based on the event type
  const allEvents = allPlanEvents as any[];
  const templateEvent = allEvents.find(event => event.type === eventType);
  
  if (!templateEvent) {
    throw new Error(`No template found for plan event type: ${eventType}`);
  }
  
  // Create a deep copy of the template and merge with custom properties
  const event = JSON.parse(JSON.stringify(templateEvent));
  return { ...event, ...customProps };
}

/**
 * Creates a custom claim submission event
 * @param claimType The type of claim ('Consulta Médica', 'Exame', 'Terapia', 'Internação', 'Medicamento')
 * @param amount The claim amount
 * @param customProps Additional custom properties
 * @returns A claim submission event with the specified properties
 */
export function createClaimSubmissionEvent(claimType: string, amount: number, customProps: Record<string, any> = {}) {
  let templateEvent;
  
  switch (claimType) {
    case 'Consulta Médica':
      templateEvent = planClaimEvents.medicalConsultationClaimSubmitted;
      break;
    case 'Exame':
      templateEvent = planClaimEvents.medicalExamClaimSubmitted;
      break;
    case 'Terapia':
      templateEvent = planClaimEvents.therapyClaimSubmitted;
      break;
    case 'Internação':
      templateEvent = planClaimEvents.hospitalizationClaimSubmitted;
      break;
    case 'Medicamento':
      templateEvent = planClaimEvents.medicationClaimSubmitted;
      break;
    default:
      templateEvent = planClaimEvents.medicalConsultationClaimSubmitted;
  }
  
  // Create a deep copy of the template
  const event = JSON.parse(JSON.stringify(templateEvent));
  
  // Update claim type and amount
  event.data.claimType = claimType;
  event.data.amount = amount;
  
  // Merge with custom properties
  return { ...event, ...customProps };
}

/**
 * Creates a custom benefit utilization event
 * @param benefitType The type of benefit ('GYM_MEMBERSHIP', 'DENTAL', 'MENTAL_HEALTH', 'NUTRITION')
 * @param value The benefit value
 * @param customProps Additional custom properties
 * @returns A benefit utilization event with the specified properties
 */
export function createBenefitUtilizationEvent(benefitType: string, value: number, customProps: Record<string, any> = {}) {
  let templateEvent;
  
  switch (benefitType) {
    case 'GYM_MEMBERSHIP':
      templateEvent = planBenefitEvents.gymMembershipBenefitUtilized;
      break;
    case 'DENTAL':
      templateEvent = planBenefitEvents.dentalBenefitUtilized;
      break;
    case 'MENTAL_HEALTH':
      templateEvent = planBenefitEvents.mentalHealthBenefitUtilized;
      break;
    case 'NUTRITION':
      templateEvent = planBenefitEvents.nutritionBenefitUtilized;
      break;
    default:
      templateEvent = planBenefitEvents.gymMembershipBenefitUtilized;
  }
  
  // Create a deep copy of the template
  const event = JSON.parse(JSON.stringify(templateEvent));
  
  // Update benefit type and value
  event.data.benefitType = benefitType;
  event.data.value = value;
  
  // Merge with custom properties
  return { ...event, ...customProps };
}

/**
 * Creates a custom plan selection event
 * @param planType The type of plan ('Básico', 'Standard', 'Premium')
 * @param coverageLevel The coverage level ('INDIVIDUAL', 'FAMILY')
 * @param premium The monthly premium amount
 * @param customProps Additional custom properties
 * @returns A plan selection event with the specified properties
 */
export function createPlanSelectionEvent(planType: string, coverageLevel: string, premium: number, customProps: Record<string, any> = {}) {
  let templateEvent;
  
  if (planType === 'Básico') {
    templateEvent = planSelectionEvents.basicPlanSelected;
  } else if (coverageLevel === 'FAMILY') {
    templateEvent = planSelectionEvents.familyPlanSelected;
  } else {
    templateEvent = planSelectionEvents.individualPlanSelected;
  }
  
  // Create a deep copy of the template
  const event = JSON.parse(JSON.stringify(templateEvent));
  
  // Update plan properties
  event.data.planType = planType;
  event.data.coverageLevel = coverageLevel;
  event.data.monthlyPremium = premium;
  
  // Update plan name based on type and coverage
  event.data.planName = `${planType} ${coverageLevel === 'FAMILY' ? 'Família' : 'Individual'}`;
  
  // Merge with custom properties
  return { ...event, ...customProps };
}

/**
 * Creates a custom reward redemption event
 * @param rewardType The type of reward ('DISCOUNT', 'SERVICE', 'PLAN_DISCOUNT', 'PHYSICAL_PRODUCT')
 * @param pointsCost The points cost of the reward
 * @param value The monetary value of the reward
 * @param customProps Additional custom properties
 * @returns A reward redemption event with the specified properties
 */
export function createRewardRedemptionEvent(rewardType: string, pointsCost: number, value: number, customProps: Record<string, any> = {}) {
  let templateEvent;
  
  switch (rewardType) {
    case 'DISCOUNT':
      templateEvent = planRewardEvents.pharmacyDiscountRedeemed;
      break;
    case 'SERVICE':
      templateEvent = planRewardEvents.wellnessServiceRedeemed;
      break;
    case 'PLAN_DISCOUNT':
      templateEvent = planRewardEvents.premiumPlanDiscountRedeemed;
      break;
    case 'PHYSICAL_PRODUCT':
      templateEvent = planRewardEvents.healthDeviceRedeemed;
      break;
    default:
      templateEvent = planRewardEvents.pharmacyDiscountRedeemed;
  }
  
  // Create a deep copy of the template
  const event = JSON.parse(JSON.stringify(templateEvent));
  
  // Update reward properties
  event.data.rewardType = rewardType;
  event.data.pointsCost = pointsCost;
  event.data.value = value;
  
  // Merge with custom properties
  return { ...event, ...customProps };
}

export default planEvents;