/**
 * @file Insurance Plan Test Fixtures
 * @description Provides standardized test fixtures for insurance plans in the Plan journey.
 * Contains mock data for different plan types (Básico, Standard, Premium) with varying
 * coverage levels, prices, limits, and eligibility conditions.
 */

import { IPlan } from '@austa/interfaces/journey/plan';
import { ICoverage } from '@austa/interfaces/journey/plan';
import { IBenefit } from '@austa/interfaces/journey/plan';

/**
 * Base user ID for test fixtures
 */
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Enum for insurance plan types
 */
export enum InsurancePlanType {
  BASIC = 'Básico',
  STANDARD = 'Standard',
  PREMIUM = 'Premium',
}

/**
 * Enum for insurance plan statuses
 */
export enum InsurancePlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

/**
 * Basic plan fixture with minimal coverage
 */
export const basicPlanFixture: IPlan = {
  id: '00000000-0000-0000-0000-000000000101',
  userId: TEST_USER_ID,
  planNumber: 'BAS-2023-001',
  name: 'Plano Básico',
  description: 'Plano com cobertura básica para necessidades essenciais de saúde',
  type: InsurancePlanType.BASIC,
  provider: 'AUSTA Seguros',
  monthlyPremium: 199.90,
  validityStart: new Date('2023-01-01'),
  validityEnd: new Date('2023-12-31'),
  status: InsurancePlanStatus.ACTIVE,
  coverageDetails: {
    hospitalCoverage: 'Básica',
    dentalCoverage: 'Não incluído',
    visionCoverage: 'Não incluído',
    pharmacyCoverage: 'Descontos em medicamentos',
    annualDeductible: 500,
    maxAnnualCoverage: 50000,
  },
  journey: 'plan',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

/**
 * Standard plan fixture with intermediate coverage
 */
export const standardPlanFixture: IPlan = {
  id: '00000000-0000-0000-0000-000000000102',
  userId: TEST_USER_ID,
  planNumber: 'STD-2023-001',
  name: 'Plano Standard',
  description: 'Plano com cobertura intermediária para indivíduos e famílias',
  type: InsurancePlanType.STANDARD,
  provider: 'AUSTA Seguros',
  monthlyPremium: 399.90,
  validityStart: new Date('2023-01-01'),
  validityEnd: new Date('2023-12-31'),
  status: InsurancePlanStatus.ACTIVE,
  coverageDetails: {
    hospitalCoverage: 'Ampla',
    dentalCoverage: 'Básica',
    visionCoverage: 'Básica',
    pharmacyCoverage: 'Cobertura parcial de medicamentos',
    annualDeductible: 250,
    maxAnnualCoverage: 100000,
  },
  journey: 'plan',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

/**
 * Premium plan fixture with comprehensive coverage
 */
export const premiumPlanFixture: IPlan = {
  id: '00000000-0000-0000-0000-000000000103',
  userId: TEST_USER_ID,
  planNumber: 'PRM-2023-001',
  name: 'Plano Premium',
  description: 'Plano com cobertura ampla e benefícios exclusivos',
  type: InsurancePlanType.PREMIUM,
  provider: 'AUSTA Seguros',
  monthlyPremium: 799.90,
  validityStart: new Date('2023-01-01'),
  validityEnd: new Date('2023-12-31'),
  status: InsurancePlanStatus.ACTIVE,
  coverageDetails: {
    hospitalCoverage: 'Premium',
    dentalCoverage: 'Completa',
    visionCoverage: 'Completa',
    pharmacyCoverage: 'Cobertura total de medicamentos',
    annualDeductible: 0,
    maxAnnualCoverage: 500000,
  },
  journey: 'plan',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

/**
 * Coverage fixtures for the Basic plan
 */
export const basicPlanCoverageFixtures: ICoverage[] = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    planId: basicPlanFixture.id,
    type: 'medical',
    details: 'Cobertura para consultas médicas e exames básicos',
    limitations: 'Limite de 6 consultas por ano. Exames especializados não cobertos.',
    coPayment: 50,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas rede credenciada básica',
      waitingPeriod: '60 dias para consultas, 180 dias para procedimentos',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    planId: basicPlanFixture.id,
    type: 'hospital',
    details: 'Cobertura para internações hospitalares de emergência',
    limitations: 'Limite de 3 dias de internação por evento. Quarto coletivo apenas.',
    coPayment: 100,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas hospitais da rede básica',
      waitingPeriod: '180 dias para internações programadas',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    planId: basicPlanFixture.id,
    type: 'pharmacy',
    details: 'Descontos em medicamentos genéricos',
    limitations: 'Apenas medicamentos genéricos. Desconto máximo de 30%.',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas farmácias parceiras',
      discountRates: {
        generic: 0.3,
        branded: 0,
      },
    },
  },
];

/**
 * Coverage fixtures for the Standard plan
 */
export const standardPlanCoverageFixtures: ICoverage[] = [
  {
    id: '00000000-0000-0000-0000-000000000204',
    planId: standardPlanFixture.id,
    type: 'medical',
    details: 'Cobertura para consultas médicas, exames e procedimentos ambulatoriais',
    limitations: 'Limite de 12 consultas por ano. Alguns exames especializados podem ter coparticipação.',
    coPayment: 30,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Rede credenciada standard',
      waitingPeriod: '30 dias para consultas, 90 dias para procedimentos',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    planId: standardPlanFixture.id,
    type: 'hospital',
    details: 'Cobertura para internações hospitalares e cirurgias',
    limitations: 'Limite de 10 dias de internação por evento. Quarto semi-privativo.',
    coPayment: 50,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Hospitais da rede standard',
      waitingPeriod: '120 dias para internações programadas',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    planId: standardPlanFixture.id,
    type: 'dental',
    details: 'Cobertura para consultas odontológicas, limpezas e procedimentos básicos',
    limitations: 'Procedimentos estéticos não cobertos. Limite de 2 limpezas por ano.',
    coPayment: 20,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas dentistas da rede credenciada',
      waitingPeriod: '60 dias para todos os procedimentos',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000207',
    planId: standardPlanFixture.id,
    type: 'vision',
    details: 'Cobertura para exames oftalmológicos e descontos em óculos',
    limitations: 'Um exame por ano. Desconto de até 30% em armações e lentes.',
    coPayment: 25,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas óticas e oftalmologistas da rede',
      waitingPeriod: '30 dias para exames',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000208',
    planId: standardPlanFixture.id,
    type: 'pharmacy',
    details: 'Cobertura parcial para medicamentos genéricos e de marca',
    limitations: 'Cobertura de 50% para genéricos e 30% para medicamentos de marca',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Todas as farmácias parceiras',
      coverageRates: {
        generic: 0.5,
        branded: 0.3,
      },
    },
  },
];

/**
 * Coverage fixtures for the Premium plan
 */
export const premiumPlanCoverageFixtures: ICoverage[] = [
  {
    id: '00000000-0000-0000-0000-000000000209',
    planId: premiumPlanFixture.id,
    type: 'medical',
    details: 'Cobertura completa para consultas médicas, exames e procedimentos',
    limitations: 'Consultas e exames ilimitados. Alguns procedimentos eletivos podem ter carência.',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Livre escolha com reembolso ou rede premium',
      waitingPeriod: '15 dias para consultas, 60 dias para procedimentos',
      reimbursementRate: 0.8, // 80% reimbursement for out-of-network providers
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000210',
    planId: premiumPlanFixture.id,
    type: 'hospital',
    details: 'Cobertura completa para internações, cirurgias e tratamentos hospitalares',
    limitations: 'Internação em quarto privativo. Cobertura internacional para emergências.',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Todos os hospitais da rede premium e reembolso para outros',
      waitingPeriod: '60 dias para internações programadas',
      internationalCoverage: true,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000211',
    planId: premiumPlanFixture.id,
    type: 'dental',
    details: 'Cobertura completa para todos os procedimentos odontológicos',
    limitations: 'Inclui procedimentos estéticos básicos. Implantes com coparticipação de 20%.',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Livre escolha com reembolso ou rede premium',
      waitingPeriod: '30 dias para procedimentos básicos, 90 dias para procedimentos complexos',
      reimbursementRate: 0.7, // 70% reimbursement for out-of-network providers
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000212',
    planId: premiumPlanFixture.id,
    type: 'vision',
    details: 'Cobertura completa para exames oftalmológicos e óculos',
    limitations: 'Um par de óculos por ano. Cirurgias refrativas com coparticipação de 10%.',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Livre escolha com reembolso ou rede premium',
      waitingPeriod: '15 dias para exames, 180 dias para cirurgias',
      reimbursementRate: 0.8, // 80% reimbursement for out-of-network providers
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000213',
    planId: premiumPlanFixture.id,
    type: 'pharmacy',
    details: 'Cobertura total para medicamentos prescritos',
    limitations: 'Cobertura de 100% para genéricos e 80% para medicamentos de marca',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Todas as farmácias',
      coverageRates: {
        generic: 1.0,
        branded: 0.8,
      },
      homeDelivery: true,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000214',
    planId: premiumPlanFixture.id,
    type: 'wellness',
    details: 'Programas de bem-estar e prevenção',
    limitations: 'Inclui academia, nutricionista e psicólogo com limite de sessões',
    coPayment: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    metadata: {
      networkRestrictions: 'Apenas rede credenciada premium',
      sessionLimits: {
        nutritionist: 12, // 12 sessions per year
        psychologist: 16, // 16 sessions per year
        personalTrainer: 24, // 24 sessions per year
      },
    },
  },
];

/**
 * Benefit fixtures for the Basic plan
 */
export const basicPlanBenefitFixtures: IBenefit[] = [
  {
    id: '00000000-0000-0000-0000-000000000301',
    planId: basicPlanFixture.id,
    type: 'Consultas Médicas',
    description: 'Consultas com clínicos gerais e especialistas básicos',
    limitations: 'Limite de 6 consultas por ano',
    usage: '0/6 consultas utilizadas',
    coverage: 80,
    availableFrom: new Date('2023-01-01'),
    availableTo: new Date('2023-12-31'),
    metadata: {
      specialties: ['Clínico Geral', 'Pediatria', 'Ginecologia'],
      coPaymentValue: 50,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000302',
    planId: basicPlanFixture.id,
    type: 'Exames Básicos',
    description: 'Exames laboratoriais e de imagem básicos',
    limitations: 'Apenas exames de rotina. Exames complexos não cobertos.',
    usage: 'Disponível',
    coverage: 70,
    availableFrom: new Date('2023-01-01'),
    availableTo: new Date('2023-12-31'),
    metadata: {
      examTypes: ['Hemograma', 'Glicemia', 'Raio-X simples', 'Ultrassom básico'],
      coPaymentValue: 30,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000303',
    planId: basicPlanFixture.id,
    type: 'Internação Hospitalar',
    description: 'Cobertura para internações de emergência',
    limitations: 'Limite de 3 dias por evento. Apenas quarto coletivo.',
    usage: 'Disponível',
    coverage: 80,
    availableFrom: new Date('2023-07-01'), // 180 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      accommodationType: 'Quarto coletivo',
      coPaymentValue: 100,
      waitingPeriod: '180 dias',
    },
  },
];

/**
 * Benefit fixtures for the Standard plan
 */
export const standardPlanBenefitFixtures: IBenefit[] = [
  {
    id: '00000000-0000-0000-0000-000000000304',
    planId: standardPlanFixture.id,
    type: 'Consultas Médicas',
    description: 'Consultas com clínicos gerais e especialistas',
    limitations: 'Limite de 12 consultas por ano',
    usage: '0/12 consultas utilizadas',
    coverage: 90,
    availableFrom: new Date('2023-01-31'), // 30 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      specialties: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Ortopedia', 'Dermatologia'],
      coPaymentValue: 30,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000305',
    planId: standardPlanFixture.id,
    type: 'Exames Diagnósticos',
    description: 'Exames laboratoriais e de imagem',
    limitations: 'Exames de alta complexidade com coparticipação adicional',
    usage: 'Disponível',
    coverage: 85,
    availableFrom: new Date('2023-01-31'), // 30 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      examTypes: ['Hemograma', 'Glicemia', 'Raio-X', 'Ultrassom', 'Tomografia', 'Ressonância com coparticipação'],
      coPaymentValue: 20,
      highComplexityCoPayment: 100,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000306',
    planId: standardPlanFixture.id,
    type: 'Internação Hospitalar',
    description: 'Cobertura para internações e cirurgias',
    limitations: 'Limite de 10 dias por evento. Quarto semi-privativo.',
    usage: 'Disponível',
    coverage: 90,
    availableFrom: new Date('2023-05-01'), // 120 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      accommodationType: 'Quarto semi-privativo',
      coPaymentValue: 50,
      waitingPeriod: '120 dias',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000307',
    planId: standardPlanFixture.id,
    type: 'Atendimento Odontológico',
    description: 'Consultas, limpezas e procedimentos básicos',
    limitations: 'Procedimentos estéticos não cobertos',
    usage: 'Disponível',
    coverage: 80,
    availableFrom: new Date('2023-03-01'), // 60 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      procedures: ['Consultas', 'Limpeza', 'Restaurações', 'Extrações simples'],
      coPaymentValue: 20,
      cleaningsPerYear: 2,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000308',
    planId: standardPlanFixture.id,
    type: 'Atendimento Oftalmológico',
    description: 'Exames oftalmológicos e descontos em óculos',
    limitations: 'Um exame por ano',
    usage: 'Disponível',
    coverage: 80,
    availableFrom: new Date('2023-01-31'), // 30 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      procedures: ['Exame de vista', 'Tonometria'],
      discounts: {
        frames: 0.3, // 30% discount
        lenses: 0.3, // 30% discount
      },
      coPaymentValue: 25,
    },
  },
];

/**
 * Benefit fixtures for the Premium plan
 */
export const premiumPlanBenefitFixtures: IBenefit[] = [
  {
    id: '00000000-0000-0000-0000-000000000309',
    planId: premiumPlanFixture.id,
    type: 'Consultas Médicas',
    description: 'Consultas ilimitadas com todos os especialistas',
    limitations: 'Sem limite de consultas',
    usage: 'Ilimitado',
    coverage: 100,
    availableFrom: new Date('2023-01-15'), // 15 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      specialties: 'Todas as especialidades',
      coPaymentValue: 0,
      freeChoice: true,
      reimbursementRate: 0.8, // 80% reimbursement for out-of-network
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000310',
    planId: premiumPlanFixture.id,
    type: 'Exames Diagnósticos',
    description: 'Todos os exames laboratoriais e de imagem',
    limitations: 'Sem limitações',
    usage: 'Ilimitado',
    coverage: 100,
    availableFrom: new Date('2023-01-15'), // 15 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      examTypes: 'Todos os tipos de exames',
      coPaymentValue: 0,
      freeChoice: true,
      reimbursementRate: 0.8, // 80% reimbursement for out-of-network
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000311',
    planId: premiumPlanFixture.id,
    type: 'Internação Hospitalar',
    description: 'Cobertura completa para internações e cirurgias',
    limitations: 'Internação em quarto privativo. Cobertura internacional para emergências.',
    usage: 'Disponível',
    coverage: 100,
    availableFrom: new Date('2023-03-01'), // 60 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      accommodationType: 'Quarto privativo',
      coPaymentValue: 0,
      waitingPeriod: '60 dias',
      internationalCoverage: true,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000312',
    planId: premiumPlanFixture.id,
    type: 'Atendimento Odontológico',
    description: 'Cobertura completa para todos os procedimentos odontológicos',
    limitations: 'Implantes com coparticipação de 20%',
    usage: 'Disponível',
    coverage: 100,
    availableFrom: new Date('2023-01-31'), // 30 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      procedures: 'Todos os procedimentos, incluindo estéticos básicos',
      coPaymentValue: 0,
      implantCoPayment: 0.2, // 20% co-payment for implants
      freeChoice: true,
      reimbursementRate: 0.7, // 70% reimbursement for out-of-network
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000313',
    planId: premiumPlanFixture.id,
    type: 'Atendimento Oftalmológico',
    description: 'Cobertura completa para exames e óculos',
    limitations: 'Um par de óculos por ano. Cirurgias refrativas com coparticipação de 10%.',
    usage: 'Disponível',
    coverage: 100,
    availableFrom: new Date('2023-01-15'), // 15 days waiting period
    availableTo: new Date('2023-12-31'),
    metadata: {
      procedures: ['Exame de vista completo', 'Tonometria', 'Mapeamento de retina', 'Cirurgias refrativas'],
      glassesPerYear: 1,
      surgeryCoPayment: 0.1, // 10% co-payment for refractive surgeries
      freeChoice: true,
      reimbursementRate: 0.8, // 80% reimbursement for out-of-network
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000314',
    planId: premiumPlanFixture.id,
    type: 'Medicamentos',
    description: 'Cobertura para medicamentos prescritos',
    limitations: 'Cobertura de 100% para genéricos e 80% para medicamentos de marca',
    usage: 'Disponível',
    coverage: 100,
    availableFrom: new Date('2023-01-01'),
    availableTo: new Date('2023-12-31'),
    metadata: {
      coverageRates: {
        generic: 1.0, // 100% coverage
        branded: 0.8, // 80% coverage
      },
      homeDelivery: true,
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000315',
    planId: premiumPlanFixture.id,
    type: 'Bem-estar',
    description: 'Programas de bem-estar e prevenção',
    limitations: 'Limite de sessões para alguns serviços',
    usage: 'Disponível',
    coverage: 100,
    availableFrom: new Date('2023-01-01'),
    availableTo: new Date('2023-12-31'),
    metadata: {
      services: ['Academia', 'Nutricionista', 'Psicólogo', 'Personal Trainer'],
      sessionLimits: {
        nutritionist: 12, // 12 sessions per year
        psychologist: 16, // 16 sessions per year
        personalTrainer: 24, // 24 sessions per year
      },
      gymMembership: true,
    },
  },
];

/**
 * Complete plan fixtures with coverages and benefits
 */
export const basicPlanWithRelationsFixture: IPlan = {
  ...basicPlanFixture,
  coverages: basicPlanCoverageFixtures,
  benefits: basicPlanBenefitFixtures,
};

export const standardPlanWithRelationsFixture: IPlan = {
  ...standardPlanFixture,
  coverages: standardPlanCoverageFixtures,
  benefits: standardPlanBenefitFixtures,
};

export const premiumPlanWithRelationsFixture: IPlan = {
  ...premiumPlanFixture,
  coverages: premiumPlanCoverageFixtures,
  benefits: premiumPlanBenefitFixtures,
};

/**
 * All plan fixtures array for easy access
 */
export const allPlanFixtures: IPlan[] = [
  basicPlanFixture,
  standardPlanFixture,
  premiumPlanFixture,
];

/**
 * All plan fixtures with relations array for easy access
 */
export const allPlanWithRelationsFixtures: IPlan[] = [
  basicPlanWithRelationsFixture,
  standardPlanWithRelationsFixture,
  premiumPlanWithRelationsFixture,
];

/**
 * Helper function to get a plan fixture by type
 * @param type The plan type to retrieve
 * @returns The plan fixture matching the specified type
 */
export function getPlanFixtureByType(type: InsurancePlanType): IPlan {
  switch (type) {
    case InsurancePlanType.BASIC:
      return basicPlanFixture;
    case InsurancePlanType.STANDARD:
      return standardPlanFixture;
    case InsurancePlanType.PREMIUM:
      return premiumPlanFixture;
    default:
      throw new Error(`Unknown plan type: ${type}`);
  }
}

/**
 * Helper function to get a plan fixture with relations by type
 * @param type The plan type to retrieve
 * @returns The plan fixture with relations matching the specified type
 */
export function getPlanWithRelationsFixtureByType(type: InsurancePlanType): IPlan {
  switch (type) {
    case InsurancePlanType.BASIC:
      return basicPlanWithRelationsFixture;
    case InsurancePlanType.STANDARD:
      return standardPlanWithRelationsFixture;
    case InsurancePlanType.PREMIUM:
      return premiumPlanWithRelationsFixture;
    default:
      throw new Error(`Unknown plan type: ${type}`);
  }
}