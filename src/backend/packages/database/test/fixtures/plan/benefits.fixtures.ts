/**
 * @file Benefits test fixtures for the Plan journey
 * 
 * This file provides standardized test fixtures for insurance plan benefits in the Plan journey.
 * It contains mock data for different benefit types associated with insurance plans, such as
 * medical visits, hospital stays, therapy sessions, and prescription coverage. These fixtures
 * are essential for testing benefit eligibility, calculation, and display features.
 */

import { IBenefit } from '@austa/interfaces/journey/plan';

/**
 * Interface for benefit test fixtures
 * Extends the IBenefit interface with additional properties useful for testing
 */
export interface BenefitFixture extends IBenefit {
  /**
   * The name of the plan type this benefit belongs to
   * @example "Básico", "Standard", "Premium"
   */
  planType: string;
  
  /**
   * Flag indicating if this benefit has a limit on usage
   */
  hasLimit: boolean;
}

/**
 * Basic plan benefits with minimal coverage
 */
export const basicPlanBenefits: BenefitFixture[] = [
  {
    id: 'benefit-basic-1',
    planId: 'plan-basic-1',
    planType: 'Básico',
    type: 'Consulta Médica',
    description: 'Consultas médicas com clínicos gerais da rede credenciada',
    limitations: 'Limitado a 6 consultas por ano',
    usage: '0 de 6 consultas utilizadas',
    maxCoverage: null,
    coveragePercentage: 70,
    deductible: 50,
    copay: 30,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-only',
      requiresReferral: false,
      waitingPeriod: 30, // days
    }
  },
  {
    id: 'benefit-basic-2',
    planId: 'plan-basic-1',
    planType: 'Básico',
    type: 'Exame',
    description: 'Exames laboratoriais básicos',
    limitations: 'Apenas exames de rotina cobertos',
    usage: null,
    maxCoverage: 500,
    coveragePercentage: 60,
    deductible: 75,
    copay: 25,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-only',
      requiresReferral: true,
      waitingPeriod: 60, // days
      excludedExams: ['ressonância magnética', 'tomografia computadorizada']
    }
  },
  {
    id: 'benefit-basic-3',
    planId: 'plan-basic-1',
    planType: 'Básico',
    type: 'Internação',
    description: 'Internação hospitalar em quarto coletivo',
    limitations: 'Limitado a 3 dias por internação',
    usage: null,
    maxCoverage: 5000,
    coveragePercentage: 50,
    deductible: 500,
    copay: null,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-only',
      requiresPreAuthorization: true,
      waitingPeriod: 180, // days
      roomType: 'shared'
    }
  },
  {
    id: 'benefit-basic-4',
    planId: 'plan-basic-1',
    planType: 'Básico',
    type: 'Medicamento',
    description: 'Medicamentos genéricos para tratamentos agudos',
    limitations: 'Apenas medicamentos genéricos da lista aprovada',
    usage: null,
    maxCoverage: 300,
    coveragePercentage: 40,
    deductible: 25,
    copay: 15,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'approved-pharmacies-only',
      requiresPrescription: true,
      formularyType: 'generic-only',
      excludedMedications: ['medicamentos de marca', 'tratamentos crônicos']
    }
  },
  {
    id: 'benefit-basic-5',
    planId: 'plan-basic-1',
    planType: 'Básico',
    type: 'Terapia',
    description: 'Sessões de fisioterapia',
    limitations: 'Limitado a 10 sessões por ano',
    usage: '0 de 10 sessões utilizadas',
    maxCoverage: null,
    coveragePercentage: 50,
    deductible: 35,
    copay: 25,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-only',
      requiresReferral: true,
      waitingPeriod: 90, // days
      excludedTherapies: ['terapia ocupacional', 'fonoaudiologia']
    }
  }
];

/**
 * Standard plan benefits with moderate coverage
 */
export const standardPlanBenefits: BenefitFixture[] = [
  {
    id: 'benefit-standard-1',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Consulta Médica',
    description: 'Consultas médicas com clínicos gerais e especialistas da rede credenciada',
    limitations: 'Limitado a 12 consultas por ano',
    usage: '0 de 12 consultas utilizadas',
    maxCoverage: null,
    coveragePercentage: 80,
    deductible: 30,
    copay: 20,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-preferred',
      requiresReferral: false,
      waitingPeriod: 15, // days
      outOfNetworkCoverage: 50 // percentage
    }
  },
  {
    id: 'benefit-standard-2',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Exame',
    description: 'Exames laboratoriais e de imagem',
    limitations: 'Exames complexos requerem autorização prévia',
    usage: null,
    maxCoverage: 2000,
    coveragePercentage: 75,
    deductible: 50,
    copay: 15,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-preferred',
      requiresReferral: true,
      waitingPeriod: 30, // days
      outOfNetworkCoverage: 40, // percentage
      excludedExams: ['exames experimentais']
    }
  },
  {
    id: 'benefit-standard-3',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Internação',
    description: 'Internação hospitalar em quarto semi-privativo',
    limitations: 'Limitado a 7 dias por internação',
    usage: null,
    maxCoverage: 15000,
    coveragePercentage: 70,
    deductible: 300,
    copay: null,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-preferred',
      requiresPreAuthorization: true,
      waitingPeriod: 90, // days
      roomType: 'semi-private',
      outOfNetworkCoverage: 40 // percentage
    }
  },
  {
    id: 'benefit-standard-4',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Medicamento',
    description: 'Medicamentos genéricos e de marca para tratamentos agudos e crônicos',
    limitations: 'Medicamentos de marca requerem justificativa médica',
    usage: null,
    maxCoverage: 1000,
    coveragePercentage: 60,
    deductible: 20,
    copay: 10,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'any-pharmacy',
      requiresPrescription: true,
      formularyType: 'tiered',
      tierStructure: {
        tier1: { type: 'generic', coverage: 80 },
        tier2: { type: 'preferred-brand', coverage: 60 },
        tier3: { type: 'non-preferred-brand', coverage: 40 }
      }
    }
  },
  {
    id: 'benefit-standard-5',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Terapia',
    description: 'Sessões de fisioterapia, terapia ocupacional e fonoaudiologia',
    limitations: 'Limitado a 20 sessões por ano (combinadas)',
    usage: '0 de 20 sessões utilizadas',
    maxCoverage: null,
    coveragePercentage: 70,
    deductible: 25,
    copay: 15,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-preferred',
      requiresReferral: true,
      waitingPeriod: 60, // days
      outOfNetworkCoverage: 40 // percentage
    }
  },
  {
    id: 'benefit-standard-6',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Saúde Mental',
    description: 'Consultas com psicólogos e psiquiatras',
    limitations: 'Limitado a 15 sessões por ano',
    usage: '0 de 15 sessões utilizadas',
    maxCoverage: null,
    coveragePercentage: 70,
    deductible: 30,
    copay: 20,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'in-network-preferred',
      requiresReferral: false,
      waitingPeriod: 30, // days
      outOfNetworkCoverage: 40 // percentage
    }
  },
  {
    id: 'benefit-standard-7',
    planId: 'plan-standard-1',
    planType: 'Standard',
    type: 'Emergência',
    description: 'Atendimento de emergência',
    limitations: 'Apenas para condições que ameaçam a vida',
    usage: null,
    maxCoverage: 5000,
    coveragePercentage: 90,
    deductible: 150,
    copay: 75,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-facility',
      requiresNotification: true,
      notificationTimeframe: 48, // hours
      waiveCopayIfAdmitted: true
    }
  }
];

/**
 * Premium plan benefits with comprehensive coverage
 */
export const premiumPlanBenefits: BenefitFixture[] = [
  {
    id: 'benefit-premium-1',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Consulta Médica',
    description: 'Consultas médicas ilimitadas com qualquer especialista',
    limitations: 'Sem limite de consultas',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-provider',
      requiresReferral: false,
      waitingPeriod: 0, // days
      outOfNetworkCoverage: 80 // percentage
    }
  },
  {
    id: 'benefit-premium-2',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Exame',
    description: 'Todos os exames laboratoriais e de imagem',
    limitations: 'Exames experimentais requerem autorização prévia',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-provider',
      requiresReferral: false,
      waitingPeriod: 0, // days
      outOfNetworkCoverage: 80 // percentage
    }
  },
  {
    id: 'benefit-premium-3',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Internação',
    description: 'Internação hospitalar em quarto privativo',
    limitations: 'Sem limite de dias',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-hospital',
      requiresPreAuthorization: true,
      waitingPeriod: 30, // days
      roomType: 'private',
      outOfNetworkCoverage: 80 // percentage
    }
  },
  {
    id: 'benefit-premium-4',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Medicamento',
    description: 'Cobertura ampla para medicamentos',
    limitations: 'Medicamentos experimentais requerem autorização prévia',
    usage: null,
    maxCoverage: 5000,
    coveragePercentage: 90,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'any-pharmacy',
      requiresPrescription: true,
      formularyType: 'comprehensive',
      specialtyMedicationCoverage: true,
      mailOrderOption: true
    }
  },
  {
    id: 'benefit-premium-5',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Terapia',
    description: 'Sessões de fisioterapia, terapia ocupacional, fonoaudiologia e outras terapias',
    limitations: 'Limitado a 50 sessões por ano (combinadas)',
    usage: '0 de 50 sessões utilizadas',
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'any-provider',
      requiresReferral: false,
      waitingPeriod: 0, // days
      outOfNetworkCoverage: 80 // percentage
    }
  },
  {
    id: 'benefit-premium-6',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Saúde Mental',
    description: 'Consultas ilimitadas com psicólogos e psiquiatras',
    limitations: 'Sem limite de consultas',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-provider',
      requiresReferral: false,
      waitingPeriod: 0, // days
      outOfNetworkCoverage: 80 // percentage
    }
  },
  {
    id: 'benefit-premium-7',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Emergência',
    description: 'Atendimento de emergência em qualquer lugar do mundo',
    limitations: 'Sem limitações',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'worldwide',
      requiresNotification: true,
      notificationTimeframe: 72, // hours
      internationalCoverage: true,
      medicalEvacuation: true
    }
  },
  {
    id: 'benefit-premium-8',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Odontológico',
    description: 'Cobertura odontológica completa',
    limitations: 'Procedimentos estéticos requerem autorização prévia',
    usage: null,
    maxCoverage: 3000,
    coveragePercentage: 90,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'any-provider',
      preventiveCare: { coverage: 100, frequency: 'twice-yearly' },
      basicServices: { coverage: 90, waitingPeriod: 0 },
      majorServices: { coverage: 80, waitingPeriod: 30 },
      orthodontics: { coverage: 70, waitingPeriod: 90, lifetimeMaximum: 3000 }
    }
  },
  {
    id: 'benefit-premium-9',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Oftalmológico',
    description: 'Cobertura oftalmológica completa',
    limitations: 'Limitado a um par de óculos ou lentes de contato por ano',
    usage: null,
    maxCoverage: 1000,
    coveragePercentage: 90,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: true,
    metadata: {
      networkRestriction: 'any-provider',
      examCoverage: { coverage: 100, frequency: 'yearly' },
      framesCoverage: { coverage: 90, allowance: 500, frequency: 'yearly' },
      lensesCoverage: { coverage: 90, allowance: 300, frequency: 'yearly' },
      contactsCoverage: { coverage: 90, allowance: 300, frequency: 'yearly' }
    }
  },
  {
    id: 'benefit-premium-10',
    planId: 'plan-premium-1',
    planType: 'Premium',
    type: 'Prevenção',
    description: 'Programas de prevenção e bem-estar',
    limitations: 'Sem limitações',
    usage: null,
    maxCoverage: null,
    coveragePercentage: 100,
    deductible: 0,
    copay: 0,
    effectiveDate: '2023-01-01T00:00:00Z',
    expirationDate: '2023-12-31T23:59:59Z',
    hasLimit: false,
    metadata: {
      networkRestriction: 'any-provider',
      programsIncluded: [
        'checkup anual',
        'vacinação',
        'programas de cessação do tabagismo',
        'programas de perda de peso',
        'programas de condicionamento físico'
      ],
      wellnessRewards: true,
      healthCoaching: true
    }
  }
];

/**
 * Combined array of all benefit fixtures
 */
export const allBenefits: BenefitFixture[] = [
  ...basicPlanBenefits,
  ...standardPlanBenefits,
  ...premiumPlanBenefits
];

/**
 * Get benefits by plan type
 * 
 * @param planType The type of plan to get benefits for
 * @returns An array of benefits for the specified plan type
 */
export function getBenefitsByPlanType(planType: string): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.planType === planType);
}

/**
 * Get benefits by coverage percentage
 * 
 * @param percentage The coverage percentage to filter by
 * @returns An array of benefits with the specified coverage percentage
 */
export function getBenefitsByCoveragePercentage(percentage: number): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.coveragePercentage === percentage);
}

/**
 * Get benefits by limit type
 * 
 * @param limitType Whether to get benefits with or without limits
 * @returns An array of benefits based on the limit type
 */
export function getBenefitsByLimit(limitType: 'limited' | 'unlimited'): BenefitFixture[] {
  return allBenefits.filter(benefit => {
    if (limitType === 'limited') {
      return benefit.hasLimit === true;
    } else {
      return benefit.hasLimit === false;
    }
  });
}

/**
 * Get a specific benefit by ID
 * 
 * @param id The ID of the benefit to retrieve
 * @returns The benefit with the specified ID, or undefined if not found
 */
export function getBenefitById(id: string): BenefitFixture | undefined {
  return allBenefits.find(benefit => benefit.id === id);
}

/**
 * Get benefits by type
 * 
 * @param type The type of benefit to retrieve
 * @returns An array of benefits of the specified type
 */
export function getBenefitsByType(type: string): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.type === type);
}

/**
 * Get benefits by plan ID
 * 
 * @param planId The ID of the plan to get benefits for
 * @returns An array of benefits for the specified plan
 */
export function getBenefitsByPlanId(planId: string): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.planId === planId);
}

/**
 * Get benefits with copay
 * 
 * @returns An array of benefits that have a copay amount
 */
export function getBenefitsWithCopay(): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.copay !== null && benefit.copay > 0);
}

/**
 * Get benefits with deductible
 * 
 * @returns An array of benefits that have a deductible amount
 */
export function getBenefitsWithDeductible(): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.deductible !== null && benefit.deductible > 0);
}

/**
 * Get benefits with maximum coverage
 * 
 * @returns An array of benefits that have a maximum coverage amount
 */
export function getBenefitsWithMaxCoverage(): BenefitFixture[] {
  return allBenefits.filter(benefit => benefit.maxCoverage !== null);
}

/**
 * Get benefits that require referral
 * 
 * @returns An array of benefits that require a referral
 */
export function getBenefitsThatRequireReferral(): BenefitFixture[] {
  return allBenefits.filter(benefit => 
    benefit.metadata && 
    benefit.metadata.requiresReferral === true
  );
}

/**
 * Get benefits that require pre-authorization
 * 
 * @returns An array of benefits that require pre-authorization
 */
export function getBenefitsThatRequirePreAuth(): BenefitFixture[] {
  return allBenefits.filter(benefit => 
    benefit.metadata && 
    benefit.metadata.requiresPreAuthorization === true
  );
}

/**
 * Get benefits with network restrictions
 * 
 * @param networkType The type of network restriction to filter by
 * @returns An array of benefits with the specified network restriction
 */
export function getBenefitsByNetworkRestriction(networkType: string): BenefitFixture[] {
  return allBenefits.filter(benefit => 
    benefit.metadata && 
    benefit.metadata.networkRestriction === networkType
  );
}

/**
 * Get benefits with waiting periods
 * 
 * @param minDays Minimum waiting period in days
 * @param maxDays Maximum waiting period in days
 * @returns An array of benefits with waiting periods in the specified range
 */
export function getBenefitsWithWaitingPeriod(minDays: number, maxDays: number): BenefitFixture[] {
  return allBenefits.filter(benefit => 
    benefit.metadata && 
    typeof benefit.metadata.waitingPeriod === 'number' &&
    benefit.metadata.waitingPeriod >= minDays &&
    benefit.metadata.waitingPeriod <= maxDays
  );
}

/**
 * Default export for easier importing
 */
export default {
  allBenefits,
  basicPlanBenefits,
  standardPlanBenefits,
  premiumPlanBenefits,
  getBenefitsByPlanType,
  getBenefitsByCoveragePercentage,
  getBenefitsByLimit,
  getBenefitById,
  getBenefitsByType,
  getBenefitsByPlanId,
  getBenefitsWithCopay,
  getBenefitsWithDeductible,
  getBenefitsWithMaxCoverage,
  getBenefitsThatRequireReferral,
  getBenefitsThatRequirePreAuth,
  getBenefitsByNetworkRestriction,
  getBenefitsWithWaitingPeriod
};