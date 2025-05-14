/**
 * @file plan-events.mock.ts
 * 
 * This file provides mock data for Plan journey events (CLAIM_SUBMITTED, BENEFIT_USED, PLAN_SELECTED)
 * to facilitate testing of the gamification engine's handling of insurance and benefits-related events.
 * These mocks represent structured event data for the various plan-related user actions that trigger
 * gamification processes.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventTypesEnum } from '../../../../src/dto/event-types.enum';
import { BaseEventDto } from '../../../../src/dto/base-event.dto';
import { ClaimEventDto } from '../../../../src/dto/claim-event.dto';
import { BenefitEventDto } from '../../../../src/dto/benefit-event.dto';

// Common test values
const TEST_USER_ID = '12345678-1234-1234-1234-123456789012';
const TEST_TIMESTAMP = new Date().toISOString();
const TEST_CORRELATION_ID = uuidv4();

/**
 * Creates a base event with common properties
 */
const createBaseEvent = <T = any>(
  type: string,
  data: T,
  options: {
    userId?: string;
    timestamp?: string;
    correlationId?: string;
    version?: string;
    source?: string;
  } = {}
): BaseEventDto => ({
  eventId: uuidv4(),
  type,
  userId: options.userId || TEST_USER_ID,
  journey: 'plan',
  timestamp: options.timestamp || TEST_TIMESTAMP,
  data,
  metadata: {
    correlationId: options.correlationId || TEST_CORRELATION_ID,
    version: options.version || '1.0.0',
    source: options.source || 'plan-service'
  }
});

/**
 * Mock data for claim submission events
 */
export const claimSubmissionEvents: BaseEventDto[] = [
  // Basic medical consultation claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_SUBMITTED,
    {
      claimId: uuidv4(),
      status: 'submitted',
      type: 'Consulta Médica',
      amount: 250.0,
      currency: 'BRL',
      submittedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
      provider: {
        id: uuidv4(),
        name: 'Dr. Carlos Silva',
        category: 'Médico',
        location: 'São Paulo'
      },
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          filename: 'receipt_consultation.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'medical_report',
          filename: 'medical_report.pdf',
          uploadedAt: TEST_TIMESTAMP
        }
      ],
      notes: 'Consulta de rotina com cardiologista'
    }
  ),
  
  // Medical exam claim with higher amount
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_SUBMITTED,
    {
      claimId: uuidv4(),
      status: 'submitted',
      type: 'Exame',
      amount: 850.0,
      currency: 'BRL',
      submittedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      provider: {
        id: uuidv4(),
        name: 'Laboratório Central',
        category: 'Laboratório',
        location: 'Rio de Janeiro'
      },
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          filename: 'receipt_exam.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'prescription',
          filename: 'exam_prescription.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'exam_result',
          filename: 'exam_results.pdf',
          uploadedAt: TEST_TIMESTAMP
        }
      ],
      notes: 'Exame de ressonância magnética'
    }
  ),
  
  // Therapy session claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_SUBMITTED,
    {
      claimId: uuidv4(),
      status: 'submitted',
      type: 'Terapia',
      amount: 150.0,
      currency: 'BRL',
      submittedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      provider: {
        id: uuidv4(),
        name: 'Centro de Terapia Integrada',
        category: 'Clínica',
        location: 'Belo Horizonte'
      },
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          filename: 'receipt_therapy.pdf',
          uploadedAt: TEST_TIMESTAMP
        }
      ],
      notes: 'Sessão de fisioterapia'
    }
  ),
  
  // Hospitalization claim with high amount
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_SUBMITTED,
    {
      claimId: uuidv4(),
      status: 'submitted',
      type: 'Internação',
      amount: 5000.0,
      currency: 'BRL',
      submittedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
      provider: {
        id: uuidv4(),
        name: 'Hospital São Lucas',
        category: 'Hospital',
        location: 'Brasília'
      },
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          filename: 'hospital_invoice.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'medical_report',
          filename: 'discharge_summary.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'prescription',
          filename: 'hospital_prescription.pdf',
          uploadedAt: TEST_TIMESTAMP
        }
      ],
      notes: 'Internação para procedimento cirúrgico'
    }
  ),
  
  // Medication claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_SUBMITTED,
    {
      claimId: uuidv4(),
      status: 'submitted',
      type: 'Medicamento',
      amount: 320.0,
      currency: 'BRL',
      submittedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      provider: {
        id: uuidv4(),
        name: 'Farmácia Popular',
        category: 'Farmácia',
        location: 'Curitiba'
      },
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          filename: 'pharmacy_receipt.pdf',
          uploadedAt: TEST_TIMESTAMP
        },
        {
          id: uuidv4(),
          type: 'prescription',
          filename: 'medication_prescription.pdf',
          uploadedAt: TEST_TIMESTAMP
        }
      ],
      notes: 'Medicamentos para tratamento contínuo'
    }
  )
];

/**
 * Mock data for claim status update events
 */
export const claimStatusEvents: BaseEventDto[] = [
  // Approved claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_APPROVED,
    {
      claimId: uuidv4(),
      status: 'approved',
      type: 'Consulta Médica',
      amount: 250.0,
      approvedAmount: 225.0, // 90% coverage
      currency: 'BRL',
      submittedAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
      approvedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
      reimbursementMethod: 'bank_transfer',
      estimatedPaymentDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
      provider: {
        id: uuidv4(),
        name: 'Dr. Carlos Silva',
        category: 'Médico',
        location: 'São Paulo'
      }
    }
  ),
  
  // Rejected claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_REJECTED,
    {
      claimId: uuidv4(),
      status: 'rejected',
      type: 'Exame',
      amount: 850.0,
      currency: 'BRL',
      submittedAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      rejectedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
      rejectionReason: 'missing_documentation',
      appealable: true,
      provider: {
        id: uuidv4(),
        name: 'Laboratório Central',
        category: 'Laboratório',
        location: 'Rio de Janeiro'
      }
    }
  ),
  
  // Pending claim
  createBaseEvent<Partial<ClaimEventDto>>(
    EventTypesEnum.CLAIM_PENDING,
    {
      claimId: uuidv4(),
      status: 'pending',
      type: 'Internação',
      amount: 5000.0,
      currency: 'BRL',
      submittedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      updatedAt: TEST_TIMESTAMP,
      serviceDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      pendingReason: 'additional_review_required',
      estimatedCompletionDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      provider: {
        id: uuidv4(),
        name: 'Hospital São Lucas',
        category: 'Hospital',
        location: 'Brasília'
      }
    }
  )
];

/**
 * Mock data for benefit utilization events
 */
export const benefitEvents: BaseEventDto[] = [
  // Pharmacy discount benefit used
  createBaseEvent<Partial<BenefitEventDto>>(
    EventTypesEnum.BENEFIT_USED,
    {
      benefitId: uuidv4(),
      type: 'Desconto em Farmácia',
      action: 'used',
      value: 50.0,
      usedAt: TEST_TIMESTAMP,
      expiresAt: new Date(Date.now() + 7776000000).toISOString(), // 90 days from now
      provider: {
        id: uuidv4(),
        name: 'Rede de Farmácias Saúde',
        category: 'Farmácia',
        location: 'São Paulo'
      },
      details: {
        discountPercentage: 20,
        maxUsageCount: 5,
        currentUsageCount: 1
      }
    }
  ),
  
  // Gym membership benefit used
  createBaseEvent<Partial<BenefitEventDto>>(
    EventTypesEnum.BENEFIT_USED,
    {
      benefitId: uuidv4(),
      type: 'Academia',
      action: 'used',
      value: 100.0,
      usedAt: TEST_TIMESTAMP,
      expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      provider: {
        id: uuidv4(),
        name: 'Rede Fitness',
        category: 'Academia',
        location: 'Rio de Janeiro'
      },
      details: {
        discountPercentage: 30,
        maxUsageCount: 1,
        currentUsageCount: 1,
        membershipDuration: '1 month'
      }
    }
  ),
  
  // Nutrition consultation benefit used
  createBaseEvent<Partial<BenefitEventDto>>(
    EventTypesEnum.BENEFIT_USED,
    {
      benefitId: uuidv4(),
      type: 'Consulta Nutricional',
      action: 'used',
      value: 150.0,
      usedAt: TEST_TIMESTAMP,
      expiresAt: new Date(Date.now() + 5184000000).toISOString(), // 60 days from now
      provider: {
        id: uuidv4(),
        name: 'Centro de Nutrição Integrada',
        category: 'Nutrição',
        location: 'Belo Horizonte'
      },
      details: {
        discountPercentage: 100, // fully covered
        maxUsageCount: 2,
        currentUsageCount: 1
      }
    }
  ),
  
  // Wellness program benefit redeemed
  createBaseEvent<Partial<BenefitEventDto>>(
    EventTypesEnum.BENEFIT_REDEEMED,
    {
      benefitId: uuidv4(),
      type: 'Programa de Bem-estar',
      action: 'redeemed',
      value: 200.0,
      usedAt: TEST_TIMESTAMP,
      expiresAt: new Date(Date.now() + 15552000000).toISOString(), // 180 days from now
      provider: {
        id: uuidv4(),
        name: 'Espaço Bem-Estar',
        category: 'Bem-estar',
        location: 'Curitiba'
      },
      details: {
        programDuration: '6 months',
        sessions: 12,
        sessionFrequency: 'biweekly'
      }
    }
  ),
  
  // Expired benefit
  createBaseEvent<Partial<BenefitEventDto>>(
    EventTypesEnum.BENEFIT_EXPIRED,
    {
      benefitId: uuidv4(),
      type: 'Check-up Anual',
      action: 'expired',
      value: 500.0,
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      expiredAt: TEST_TIMESTAMP,
      provider: {
        id: uuidv4(),
        name: 'Clínica Preventiva',
        category: 'Clínica',
        location: 'Brasília'
      },
      details: {
        discountPercentage: 100, // fully covered
        maxUsageCount: 1,
        currentUsageCount: 0,
        reason: 'time_limit_reached'
      }
    }
  )
];

/**
 * Mock data for plan selection events
 */
export const planSelectionEvents: BaseEventDto[] = [
  // Basic plan selection
  createBaseEvent(
    EventTypesEnum.PLAN_SELECTED,
    {
      planId: uuidv4(),
      type: 'Básico',
      name: 'Plano Básico',
      monthlyPremium: 250.0,
      currency: 'BRL',
      coverageStartDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
      selectedAt: TEST_TIMESTAMP,
      benefits: [
        {
          id: uuidv4(),
          name: 'Consultas Médicas',
          coveragePercentage: 70,
          annualLimit: 5000.0
        },
        {
          id: uuidv4(),
          name: 'Exames Laboratoriais',
          coveragePercentage: 70,
          annualLimit: 3000.0
        },
        {
          id: uuidv4(),
          name: 'Internação',
          coveragePercentage: 70,
          annualLimit: 30000.0
        }
      ]
    }
  ),
  
  // Standard plan selection
  createBaseEvent(
    EventTypesEnum.PLAN_SELECTED,
    {
      planId: uuidv4(),
      type: 'Standard',
      name: 'Plano Standard',
      monthlyPremium: 450.0,
      currency: 'BRL',
      coverageStartDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
      selectedAt: TEST_TIMESTAMP,
      benefits: [
        {
          id: uuidv4(),
          name: 'Consultas Médicas',
          coveragePercentage: 80,
          annualLimit: 10000.0
        },
        {
          id: uuidv4(),
          name: 'Exames Laboratoriais',
          coveragePercentage: 80,
          annualLimit: 7000.0
        },
        {
          id: uuidv4(),
          name: 'Internação',
          coveragePercentage: 80,
          annualLimit: 50000.0
        },
        {
          id: uuidv4(),
          name: 'Terapias',
          coveragePercentage: 70,
          annualLimit: 5000.0
        },
        {
          id: uuidv4(),
          name: 'Medicamentos',
          coveragePercentage: 50,
          annualLimit: 3000.0
        }
      ]
    }
  ),
  
  // Premium plan selection
  createBaseEvent(
    EventTypesEnum.PLAN_SELECTED,
    {
      planId: uuidv4(),
      type: 'Premium',
      name: 'Plano Premium',
      monthlyPremium: 750.0,
      currency: 'BRL',
      coverageStartDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
      selectedAt: TEST_TIMESTAMP,
      benefits: [
        {
          id: uuidv4(),
          name: 'Consultas Médicas',
          coveragePercentage: 100,
          annualLimit: 20000.0
        },
        {
          id: uuidv4(),
          name: 'Exames Laboratoriais',
          coveragePercentage: 100,
          annualLimit: 15000.0
        },
        {
          id: uuidv4(),
          name: 'Internação',
          coveragePercentage: 90,
          annualLimit: 100000.0
        },
        {
          id: uuidv4(),
          name: 'Terapias',
          coveragePercentage: 90,
          annualLimit: 10000.0
        },
        {
          id: uuidv4(),
          name: 'Medicamentos',
          coveragePercentage: 80,
          annualLimit: 8000.0
        },
        {
          id: uuidv4(),
          name: 'Telemedicina',
          coveragePercentage: 100,
          annualLimit: null // unlimited
        },
        {
          id: uuidv4(),
          name: 'Desconto em Farmácia',
          coveragePercentage: null,
          discountPercentage: 30,
          annualLimit: null // unlimited
        },
        {
          id: uuidv4(),
          name: 'Check-up Anual',
          coveragePercentage: 100,
          annualLimit: 1500.0
        }
      ]
    }
  )
];

/**
 * Mock data for plan journey reward redemption events
 */
export const planRewardEvents: BaseEventDto[] = [
  // Claim discount reward
  createBaseEvent(
    EventTypesEnum.REWARD_REDEEMED,
    {
      rewardId: uuidv4(),
      rewardTitle: 'Desconto em Próxima Mensalidade',
      redeemedAt: TEST_TIMESTAMP,
      pointsCost: 1000,
      rewardType: 'discount',
      discountAmount: 50.0,
      currency: 'BRL',
      expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      journey: 'plan',
      applicationDetails: {
        appliedTo: 'monthly_premium',
        nextBillingDate: new Date(Date.now() + 1209600000).toISOString() // 14 days from now
      }
    }
  ),
  
  // Coverage upgrade reward
  createBaseEvent(
    EventTypesEnum.REWARD_REDEEMED,
    {
      rewardId: uuidv4(),
      rewardTitle: 'Upgrade de Cobertura Temporário',
      redeemedAt: TEST_TIMESTAMP,
      pointsCost: 2000,
      rewardType: 'coverage_upgrade',
      upgradeDuration: 90, // days
      expiresAt: new Date(Date.now() + 7776000000).toISOString(), // 90 days from now
      journey: 'plan',
      applicationDetails: {
        upgradedBenefits: [
          {
            benefitName: 'Consultas Médicas',
            originalCoverage: 80,
            upgradedCoverage: 100
          },
          {
            benefitName: 'Exames Laboratoriais',
            originalCoverage: 80,
            upgradedCoverage: 100
          }
        ]
      }
    }
  ),
  
  // Wellness program reward
  createBaseEvent(
    EventTypesEnum.REWARD_REDEEMED,
    {
      rewardId: uuidv4(),
      rewardTitle: 'Programa de Bem-estar Premium',
      redeemedAt: TEST_TIMESTAMP,
      pointsCost: 3000,
      rewardType: 'service',
      expiresAt: new Date(Date.now() + 15552000000).toISOString(), // 180 days from now
      journey: 'plan',
      applicationDetails: {
        serviceProvider: 'Espaço Bem-Estar Premium',
        serviceDescription: 'Acesso a programa completo de bem-estar com nutricionista, personal trainer e psicólogo',
        sessionCount: 24,
        sessionFrequency: 'weekly'
      }
    }
  ),
  
  // Claim fast-track reward
  createBaseEvent(
    EventTypesEnum.REWARD_REDEEMED,
    {
      rewardId: uuidv4(),
      rewardTitle: 'Processamento Prioritário de Reembolso',
      redeemedAt: TEST_TIMESTAMP,
      pointsCost: 500,
      rewardType: 'service_upgrade',
      expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      journey: 'plan',
      applicationDetails: {
        upgradeType: 'fast_track_processing',
        standardProcessingTime: '7-10 business days',
        upgradedProcessingTime: '1-2 business days',
        usageLimit: 3
      }
    }
  )
];

/**
 * All plan journey events combined
 */
export const allPlanEvents: BaseEventDto[] = [
  ...claimSubmissionEvents,
  ...claimStatusEvents,
  ...benefitEvents,
  ...planSelectionEvents,
  ...planRewardEvents
];

/**
 * Default export for all plan events
 */
export default allPlanEvents;