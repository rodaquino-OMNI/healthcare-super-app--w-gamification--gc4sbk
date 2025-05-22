/**
 * @file Plan Journey Benefit Test Fixtures
 * 
 * Contains test fixtures for insurance plan benefits in the Plan journey. Provides mock data for different
 * benefit types associated with insurance plans, such as medical visits, hospital stays, therapy sessions,
 * and prescription coverage. These fixtures are essential for testing benefit eligibility, calculation,
 * and display features.
 */

import { IBenefit } from '@austa/interfaces/journey/plan';

/**
 * Common benefit IDs for consistent reference across tests
 */
export enum BenefitIds {
  // Basic Plan Benefits
  BASIC_MEDICAL_VISITS = 'benefit-basic-medical-visits',
  BASIC_EMERGENCY = 'benefit-basic-emergency',
  BASIC_HOSPITALIZATION = 'benefit-basic-hospitalization',
  BASIC_EXAMS = 'benefit-basic-exams',
  BASIC_MEDICATIONS = 'benefit-basic-medications',
  
  // Standard Plan Benefits
  STANDARD_MEDICAL_VISITS = 'benefit-standard-medical-visits',
  STANDARD_EMERGENCY = 'benefit-standard-emergency',
  STANDARD_HOSPITALIZATION = 'benefit-standard-hospitalization',
  STANDARD_EXAMS = 'benefit-standard-exams',
  STANDARD_MEDICATIONS = 'benefit-standard-medications',
  STANDARD_THERAPY = 'benefit-standard-therapy',
  STANDARD_DENTAL = 'benefit-standard-dental',
  
  // Premium Plan Benefits
  PREMIUM_MEDICAL_VISITS = 'benefit-premium-medical-visits',
  PREMIUM_EMERGENCY = 'benefit-premium-emergency',
  PREMIUM_HOSPITALIZATION = 'benefit-premium-hospitalization',
  PREMIUM_EXAMS = 'benefit-premium-exams',
  PREMIUM_MEDICATIONS = 'benefit-premium-medications',
  PREMIUM_THERAPY = 'benefit-premium-therapy',
  PREMIUM_DENTAL = 'benefit-premium-dental',
  PREMIUM_VISION = 'benefit-premium-vision',
  PREMIUM_MATERNITY = 'benefit-premium-maternity',
  PREMIUM_INTERNATIONAL = 'benefit-premium-international'
}

/**
 * Plan IDs for associating benefits with plans
 */
export enum PlanIds {
  BASIC_PLAN = 'plan-basic-001',
  STANDARD_PLAN = 'plan-standard-001',
  PREMIUM_PLAN = 'plan-premium-001'
}

/**
 * Basic plan benefits with limited coverage
 */
export const basicBenefits: IBenefit[] = [
  {
    id: BenefitIds.BASIC_MEDICAL_VISITS,
    planId: PlanIds.BASIC_PLAN,
    type: 'Consulta Médica',
    description: 'Consultas médicas com clínicos gerais e especialistas da rede credenciada',
    limitations: 'Limite de 6 consultas por ano, apenas com médicos da rede básica',
    coverage: 60,
    metadata: {
      annualLimit: 6,
      networkRestriction: 'basic',
      waitingPeriod: 60, // days
      copay: 50.00, // BRL
      specialistRestriction: true
    }
  },
  {
    id: BenefitIds.BASIC_EMERGENCY,
    planId: PlanIds.BASIC_PLAN,
    type: 'Emergência',
    description: 'Atendimento de emergência em prontos-socorros da rede credenciada',
    limitations: 'Apenas em casos de emergência comprovada, com coparticipação',
    coverage: 80,
    metadata: {
      networkRestriction: 'basic',
      copay: 150.00, // BRL
      requiresAuthorization: false
    }
  },
  {
    id: BenefitIds.BASIC_HOSPITALIZATION,
    planId: PlanIds.BASIC_PLAN,
    type: 'Internação',
    description: 'Internação em hospitais da rede credenciada',
    limitations: 'Apenas em enfermaria, limite de 3 dias por internação, máximo de 2 internações por ano',
    coverage: 70,
    metadata: {
      accommodationType: 'ward',
      annualLimit: 2,
      daysPerStay: 3,
      waitingPeriod: 180, // days
      requiresAuthorization: true,
      networkRestriction: 'basic'
    }
  },
  {
    id: BenefitIds.BASIC_EXAMS,
    planId: PlanIds.BASIC_PLAN,
    type: 'Exame',
    description: 'Exames laboratoriais e de imagem básicos',
    limitations: 'Apenas exames básicos, com autorização prévia para exames de imagem',
    coverage: 60,
    metadata: {
      examTypes: ['blood', 'urine', 'x-ray', 'basic-ultrasound'],
      requiresAuthorization: true,
      waitingPeriod: 90, // days
      copay: 30.00, // BRL per exam
      networkRestriction: 'basic'
    }
  },
  {
    id: BenefitIds.BASIC_MEDICATIONS,
    planId: PlanIds.BASIC_PLAN,
    type: 'Medicamento',
    description: 'Cobertura parcial para medicamentos genéricos prescritos',
    limitations: 'Apenas medicamentos genéricos, com limite anual de R$ 500,00',
    coverage: 40,
    metadata: {
      annualLimit: 500.00, // BRL
      restrictedToGeneric: true,
      requiresPrescription: true,
      waitingPeriod: 60, // days
      excludedCategories: ['cosmetic', 'experimental', 'imported']
    }
  }
];

/**
 * Standard plan benefits with moderate coverage
 */
export const standardBenefits: IBenefit[] = [
  {
    id: BenefitIds.STANDARD_MEDICAL_VISITS,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Consulta Médica',
    description: 'Consultas médicas com clínicos gerais e especialistas da rede credenciada',
    limitations: 'Limite de 12 consultas por ano',
    coverage: 80,
    metadata: {
      annualLimit: 12,
      networkRestriction: 'standard',
      waitingPeriod: 30, // days
      copay: 30.00, // BRL
      specialistRestriction: false
    }
  },
  {
    id: BenefitIds.STANDARD_EMERGENCY,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Emergência',
    description: 'Atendimento de emergência em prontos-socorros da rede credenciada',
    limitations: 'Coparticipação reduzida em casos não emergenciais',
    coverage: 90,
    metadata: {
      networkRestriction: 'standard',
      copay: 80.00, // BRL for non-emergency cases
      requiresAuthorization: false
    }
  },
  {
    id: BenefitIds.STANDARD_HOSPITALIZATION,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Internação',
    description: 'Internação em hospitais da rede credenciada',
    limitations: 'Quarto semi-privativo, limite de 5 dias por internação, máximo de 3 internações por ano',
    coverage: 85,
    metadata: {
      accommodationType: 'semi-private',
      annualLimit: 3,
      daysPerStay: 5,
      waitingPeriod: 120, // days
      requiresAuthorization: true,
      networkRestriction: 'standard'
    }
  },
  {
    id: BenefitIds.STANDARD_EXAMS,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Exame',
    description: 'Exames laboratoriais e de imagem',
    limitations: 'Exames de alta complexidade requerem autorização prévia',
    coverage: 80,
    metadata: {
      examTypes: ['blood', 'urine', 'x-ray', 'ultrasound', 'ct-scan', 'basic-mri'],
      requiresAuthorization: true,
      waitingPeriod: 60, // days
      copay: 20.00, // BRL per exam
      networkRestriction: 'standard'
    }
  },
  {
    id: BenefitIds.STANDARD_MEDICATIONS,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Medicamento',
    description: 'Cobertura para medicamentos genéricos e de marca prescritos',
    limitations: 'Limite anual de R$ 1.200,00, medicamentos de marca com cobertura reduzida',
    coverage: 60,
    metadata: {
      annualLimit: 1200.00, // BRL
      restrictedToGeneric: false,
      genericCoverage: 70,
      brandCoverage: 50,
      requiresPrescription: true,
      waitingPeriod: 30, // days
      excludedCategories: ['cosmetic', 'experimental']
    }
  },
  {
    id: BenefitIds.STANDARD_THERAPY,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Terapia',
    description: 'Sessões de fisioterapia, fonoaudiologia e terapia ocupacional',
    limitations: 'Limite de 20 sessões por ano para cada especialidade',
    coverage: 70,
    metadata: {
      annualLimit: 20, // sessions per specialty
      specialties: ['physiotherapy', 'speech-therapy', 'occupational-therapy'],
      requiresReferral: true,
      waitingPeriod: 90, // days
      copay: 25.00, // BRL per session
      networkRestriction: 'standard'
    }
  },
  {
    id: BenefitIds.STANDARD_DENTAL,
    planId: PlanIds.STANDARD_PLAN,
    type: 'Odontológico',
    description: 'Tratamentos odontológicos preventivos e básicos',
    limitations: 'Não cobre tratamentos estéticos ou ortodônticos',
    coverage: 70,
    metadata: {
      includedServices: ['cleaning', 'fillings', 'extractions', 'x-rays'],
      excludedServices: ['orthodontics', 'cosmetic', 'implants'],
      waitingPeriod: 60, // days
      annualLimit: 1000.00, // BRL
      networkRestriction: 'dental'
    }
  }
];

/**
 * Premium plan benefits with comprehensive coverage
 */
export const premiumBenefits: IBenefit[] = [
  {
    id: BenefitIds.PREMIUM_MEDICAL_VISITS,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Consulta Médica',
    description: 'Consultas médicas ilimitadas com clínicos gerais e especialistas',
    limitations: 'Sem limite de consultas, inclui médicos fora da rede com reembolso',
    coverage: 100,
    metadata: {
      annualLimit: null, // unlimited
      networkRestriction: null, // no restrictions
      waitingPeriod: 0, // no waiting period
      copay: 0, // no copay
      specialistRestriction: false,
      outOfNetworkReimbursement: 80 // percentage
    }
  },
  {
    id: BenefitIds.PREMIUM_EMERGENCY,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Emergência',
    description: 'Atendimento de emergência em qualquer hospital, inclusive internacional',
    limitations: 'Cobertura internacional limitada a 30 dias por viagem',
    coverage: 100,
    metadata: {
      networkRestriction: null, // no restrictions
      copay: 0, // no copay
      requiresAuthorization: false,
      internationalCoverage: true,
      internationalDaysLimit: 30
    }
  },
  {
    id: BenefitIds.PREMIUM_HOSPITALIZATION,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Internação',
    description: 'Internação em quarto privativo em hospitais de primeira linha',
    limitations: 'Sem limite de dias, inclui acompanhante',
    coverage: 100,
    metadata: {
      accommodationType: 'private',
      annualLimit: null, // unlimited
      daysPerStay: null, // unlimited
      waitingPeriod: 60, // days
      requiresAuthorization: true,
      networkRestriction: 'premium',
      companionIncluded: true,
      outOfNetworkReimbursement: 80 // percentage
    }
  },
  {
    id: BenefitIds.PREMIUM_EXAMS,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Exame',
    description: 'Cobertura completa para exames laboratoriais e de imagem',
    limitations: 'Exames de alta complexidade podem requerer autorização prévia',
    coverage: 100,
    metadata: {
      examTypes: ['blood', 'urine', 'x-ray', 'ultrasound', 'ct-scan', 'mri', 'pet-scan', 'genetic'],
      requiresAuthorization: true,
      waitingPeriod: 30, // days
      copay: 0, // no copay
      networkRestriction: 'premium',
      outOfNetworkReimbursement: 80 // percentage
    }
  },
  {
    id: BenefitIds.PREMIUM_MEDICATIONS,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Medicamento',
    description: 'Ampla cobertura para medicamentos prescritos',
    limitations: 'Limite anual de R$ 3.000,00, inclui alguns medicamentos importados',
    coverage: 80,
    metadata: {
      annualLimit: 3000.00, // BRL
      restrictedToGeneric: false,
      genericCoverage: 90,
      brandCoverage: 80,
      importedCoverage: 50,
      requiresPrescription: true,
      waitingPeriod: 0, // no waiting period
      excludedCategories: ['cosmetic']
    }
  },
  {
    id: BenefitIds.PREMIUM_THERAPY,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Terapia',
    description: 'Sessões de fisioterapia, fonoaudiologia, terapia ocupacional e psicoterapia',
    limitations: 'Limite de 40 sessões por ano para cada especialidade',
    coverage: 90,
    metadata: {
      annualLimit: 40, // sessions per specialty
      specialties: ['physiotherapy', 'speech-therapy', 'occupational-therapy', 'psychotherapy'],
      requiresReferral: true,
      waitingPeriod: 30, // days
      copay: 0, // no copay
      networkRestriction: 'premium'
    }
  },
  {
    id: BenefitIds.PREMIUM_DENTAL,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Odontológico',
    description: 'Cobertura odontológica completa',
    limitations: 'Tratamentos estéticos têm cobertura parcial',
    coverage: 90,
    metadata: {
      includedServices: ['cleaning', 'fillings', 'extractions', 'x-rays', 'root-canal', 'crowns', 'bridges'],
      partialCoverageServices: ['orthodontics', 'cosmetic', 'implants'],
      partialCoveragePercentage: 60,
      waitingPeriod: 30, // days
      annualLimit: 3000.00, // BRL
      networkRestriction: 'dental-premium'
    }
  },
  {
    id: BenefitIds.PREMIUM_VISION,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Oftalmológico',
    description: 'Cobertura para exames oftalmológicos e auxílio para óculos e lentes',
    limitations: 'Subsídio para armações e lentes a cada 12 meses',
    coverage: 80,
    metadata: {
      examCoverage: 100,
      frameAllowance: 500.00, // BRL
      lensAllowance: 700.00, // BRL
      contactLensAllowance: 600.00, // BRL
      replacementPeriod: 12, // months
      waitingPeriod: 60, // days
      networkRestriction: 'vision'
    }
  },
  {
    id: BenefitIds.PREMIUM_MATERNITY,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Maternidade',
    description: 'Cobertura completa para pré-natal, parto e pós-parto',
    limitations: 'Período de carência de 10 meses para parto',
    coverage: 100,
    metadata: {
      prenatalVisits: 'unlimited',
      deliveryTypes: ['normal', 'cesarean'],
      privateRoom: true,
      neonatalCare: true,
      waitingPeriod: 300, // days (10 months)
      networkRestriction: 'premium'
    }
  },
  {
    id: BenefitIds.PREMIUM_INTERNATIONAL,
    planId: PlanIds.PREMIUM_PLAN,
    type: 'Cobertura Internacional',
    description: 'Atendimento médico durante viagens internacionais',
    limitations: 'Limite de 60 dias por viagem, máximo de R$ 500.000,00 por evento',
    coverage: 80,
    metadata: {
      daysPerTrip: 60,
      maxCoveragePerEvent: 500000.00, // BRL
      requiresNotification: true,
      notificationTimeframe: 48, // hours
      excludedCountries: ['sanctioned-countries'],
      repatriation: true,
      medicalEvacuation: true
    }
  }
];

/**
 * All benefits combined for comprehensive testing
 */
export const allBenefits: IBenefit[] = [
  ...basicBenefits,
  ...standardBenefits,
  ...premiumBenefits
];

/**
 * Get benefits by plan ID
 * @param planId - The ID of the plan to retrieve benefits for
 * @returns An array of benefits for the specified plan
 */
export function getBenefitsByPlanId(planId: string): IBenefit[] {
  return allBenefits.filter(benefit => benefit.planId === planId);
}

/**
 * Get a specific benefit by ID
 * @param benefitId - The ID of the benefit to retrieve
 * @returns The benefit with the specified ID, or undefined if not found
 */
export function getBenefitById(benefitId: string): IBenefit | undefined {
  return allBenefits.find(benefit => benefit.id === benefitId);
}

/**
 * Get benefits by type
 * @param type - The type of benefits to retrieve
 * @returns An array of benefits of the specified type
 */
export function getBenefitsByType(type: string): IBenefit[] {
  return allBenefits.filter(benefit => benefit.type === type);
}

/**
 * Get benefits with coverage above a certain percentage
 * @param minCoverage - The minimum coverage percentage
 * @returns An array of benefits with coverage above the specified percentage
 */
export function getBenefitsWithMinCoverage(minCoverage: number): IBenefit[] {
  return allBenefits.filter(benefit => 
    benefit.coverage !== undefined && benefit.coverage >= minCoverage
  );
}

/**
 * Default export for backwards compatibility
 */
export default {
  basicBenefits,
  standardBenefits,
  premiumBenefits,
  allBenefits,
  getBenefitsByPlanId,
  getBenefitById,
  getBenefitsByType,
  getBenefitsWithMinCoverage
};