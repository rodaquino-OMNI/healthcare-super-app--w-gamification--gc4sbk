/**
 * @file Coverage fixtures for the Plan journey
 * 
 * This file provides test fixtures for insurance coverage details in the Plan journey.
 * It contains mock data for coverage percentages, deductibles, out-of-pocket maximums,
 * and network providers. These fixtures enable thorough testing of coverage calculation,
 * eligibility verification, and cost estimation features.
 */

import { ICoverage } from '@austa/interfaces/journey/plan/coverage.interface';

/**
 * Extended coverage fixture interface with additional properties for testing
 */
export interface CoverageFixture extends ICoverage {
  /**
   * Coverage percentage (0-100)
   */
  coveragePercentage: number;
  
  /**
   * Annual deductible amount that must be paid before coverage begins
   */
  deductible: number;
  
  /**
   * Maximum out-of-pocket expense for the covered individual
   */
  outOfPocketMax: number;
  
  /**
   * Whether this coverage applies to in-network providers only
   */
  inNetworkOnly: boolean;
  
  /**
   * Coverage percentage for out-of-network providers (if applicable)
   */
  outOfNetworkCoveragePercentage?: number;
  
  /**
   * Annual limit for this specific coverage type (if applicable)
   */
  annualLimit?: number;
  
  /**
   * Number of visits/services covered per year (if applicable)
   */
  visitsPerYear?: number;
  
  /**
   * Whether prior authorization is required for this coverage
   */
  requiresAuthorization: boolean;
  
  /**
   * Waiting period in days before coverage becomes effective
   */
  waitingPeriodDays: number;
}

/**
 * Network provider type for coverage testing
 */
export enum NetworkProviderType {
  IN_NETWORK = 'in-network',
  OUT_OF_NETWORK = 'out-of-network',
  ANY = 'any'
}

/**
 * Coverage type enum for categorizing different coverage areas
 */
export enum CoverageType {
  MEDICAL_CONSULTATION = 'medical-consultation',
  EMERGENCY = 'emergency',
  HOSPITALIZATION = 'hospitalization',
  SURGERY = 'surgery',
  EXAM_DIAGNOSTIC = 'exam-diagnostic',
  EXAM_LABORATORY = 'exam-laboratory',
  THERAPY = 'therapy',
  MENTAL_HEALTH = 'mental-health',
  DENTAL_BASIC = 'dental-basic',
  DENTAL_MAJOR = 'dental-major',
  VISION = 'vision',
  MATERNITY = 'maternity',
  MEDICATION = 'medication',
  PREVENTIVE_CARE = 'preventive-care'
}

/**
 * Base coverage fixtures for different plan types
 */
const baseCoverageFixtures: Record<string, CoverageFixture[]> = {
  'Básico': [
    {
      id: 'cov-basic-medical-consultation',
      planId: 'plan-basic-001',
      type: CoverageType.MEDICAL_CONSULTATION,
      details: 'Cobertura para consultas médicas com especialistas da rede credenciada',
      limitations: 'Limitado a 6 consultas por ano',
      coPayment: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 70,
      deductible: 200,
      outOfPocketMax: 3000,
      inNetworkOnly: true,
      requiresAuthorization: false,
      waitingPeriodDays: 30,
      visitsPerYear: 6
    },
    {
      id: 'cov-basic-emergency',
      planId: 'plan-basic-001',
      type: CoverageType.EMERGENCY,
      details: 'Cobertura para atendimentos de emergência',
      limitations: 'Apenas em hospitais da rede',
      coPayment: 100,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 80,
      deductible: 100,
      outOfPocketMax: 3000,
      inNetworkOnly: true,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-basic-hospitalization',
      planId: 'plan-basic-001',
      type: CoverageType.HOSPITALIZATION,
      details: 'Cobertura para internações hospitalares',
      limitations: 'Limitado a 5 dias por evento, quarto coletivo',
      coPayment: 200,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 60,
      deductible: 500,
      outOfPocketMax: 3000,
      inNetworkOnly: true,
      requiresAuthorization: true,
      waitingPeriodDays: 90
    },
    {
      id: 'cov-basic-exam-laboratory',
      planId: 'plan-basic-001',
      type: CoverageType.EXAM_LABORATORY,
      details: 'Cobertura para exames laboratoriais básicos',
      limitations: 'Apenas exames de rotina',
      coPayment: 30,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 70,
      deductible: 100,
      outOfPocketMax: 3000,
      inNetworkOnly: true,
      requiresAuthorization: false,
      waitingPeriodDays: 30
    },
    {
      id: 'cov-basic-medication',
      planId: 'plan-basic-001',
      type: CoverageType.MEDICATION,
      details: 'Cobertura para medicamentos genéricos',
      limitations: 'Apenas medicamentos genéricos com prescrição médica',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 40,
      deductible: 50,
      outOfPocketMax: 3000,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 20,
      requiresAuthorization: false,
      waitingPeriodDays: 30
    }
  ],
  'Standard': [
    {
      id: 'cov-standard-medical-consultation',
      planId: 'plan-standard-001',
      type: CoverageType.MEDICAL_CONSULTATION,
      details: 'Cobertura para consultas médicas com especialistas da rede credenciada',
      limitations: 'Limitado a 12 consultas por ano',
      coPayment: 30,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 80,
      deductible: 150,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 50,
      requiresAuthorization: false,
      waitingPeriodDays: 15,
      visitsPerYear: 12
    },
    {
      id: 'cov-standard-emergency',
      planId: 'plan-standard-001',
      type: CoverageType.EMERGENCY,
      details: 'Cobertura para atendimentos de emergência',
      limitations: 'Válido em qualquer hospital',
      coPayment: 75,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 90,
      deductible: 75,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 70,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-standard-hospitalization',
      planId: 'plan-standard-001',
      type: CoverageType.HOSPITALIZATION,
      details: 'Cobertura para internações hospitalares',
      limitations: 'Limitado a 10 dias por evento, quarto semi-privativo',
      coPayment: 150,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 80,
      deductible: 300,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 60,
      requiresAuthorization: true,
      waitingPeriodDays: 60
    },
    {
      id: 'cov-standard-exam-laboratory',
      planId: 'plan-standard-001',
      type: CoverageType.EXAM_LABORATORY,
      details: 'Cobertura para exames laboratoriais',
      limitations: 'Exames de rotina e específicos',
      coPayment: 20,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 80,
      deductible: 75,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 60,
      requiresAuthorization: false,
      waitingPeriodDays: 15
    },
    {
      id: 'cov-standard-exam-diagnostic',
      planId: 'plan-standard-001',
      type: CoverageType.EXAM_DIAGNOSTIC,
      details: 'Cobertura para exames diagnósticos',
      limitations: 'Inclui exames de imagem básicos',
      coPayment: 50,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 70,
      deductible: 100,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 50,
      requiresAuthorization: true,
      waitingPeriodDays: 30
    },
    {
      id: 'cov-standard-therapy',
      planId: 'plan-standard-001',
      type: CoverageType.THERAPY,
      details: 'Cobertura para terapias',
      limitations: 'Limitado a 20 sessões por ano',
      coPayment: 25,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 70,
      deductible: 100,
      outOfPocketMax: 2500,
      inNetworkOnly: true,
      requiresAuthorization: false,
      waitingPeriodDays: 30,
      visitsPerYear: 20
    },
    {
      id: 'cov-standard-dental-basic',
      planId: 'plan-standard-001',
      type: CoverageType.DENTAL_BASIC,
      details: 'Cobertura para tratamentos odontológicos básicos',
      limitations: 'Inclui limpeza, restaurações simples e extrações',
      coPayment: 30,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 70,
      deductible: 50,
      outOfPocketMax: 2500,
      inNetworkOnly: true,
      requiresAuthorization: false,
      waitingPeriodDays: 60
    },
    {
      id: 'cov-standard-medication',
      planId: 'plan-standard-001',
      type: CoverageType.MEDICATION,
      details: 'Cobertura para medicamentos genéricos e de marca',
      limitations: 'Medicamentos com prescrição médica',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 60,
      deductible: 30,
      outOfPocketMax: 2500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 40,
      requiresAuthorization: false,
      waitingPeriodDays: 15
    }
  ],
  'Premium': [
    {
      id: 'cov-premium-medical-consultation',
      planId: 'plan-premium-001',
      type: CoverageType.MEDICAL_CONSULTATION,
      details: 'Cobertura para consultas médicas com especialistas da rede credenciada',
      limitations: 'Consultas ilimitadas',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0,
      visitsPerYear: null
    },
    {
      id: 'cov-premium-emergency',
      planId: 'plan-premium-001',
      type: CoverageType.EMERGENCY,
      details: 'Cobertura para atendimentos de emergência',
      limitations: 'Válido em qualquer hospital, inclusive internacional',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 90,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-premium-hospitalization',
      planId: 'plan-premium-001',
      type: CoverageType.HOSPITALIZATION,
      details: 'Cobertura para internações hospitalares',
      limitations: 'Dias ilimitados, quarto privativo',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: true,
      waitingPeriodDays: 30
    },
    {
      id: 'cov-premium-surgery',
      planId: 'plan-premium-001',
      type: CoverageType.SURGERY,
      details: 'Cobertura para procedimentos cirúrgicos',
      limitations: 'Inclui cirurgias eletivas e de emergência',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: true,
      waitingPeriodDays: 30
    },
    {
      id: 'cov-premium-exam-laboratory',
      planId: 'plan-premium-001',
      type: CoverageType.EXAM_LABORATORY,
      details: 'Cobertura para exames laboratoriais',
      limitations: 'Todos os exames laboratoriais',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-premium-exam-diagnostic',
      planId: 'plan-premium-001',
      type: CoverageType.EXAM_DIAGNOSTIC,
      details: 'Cobertura para exames diagnósticos',
      limitations: 'Inclui todos os exames de imagem e diagnóstico',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-premium-therapy',
      planId: 'plan-premium-001',
      type: CoverageType.THERAPY,
      details: 'Cobertura para terapias',
      limitations: 'Sessões ilimitadas',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0,
      visitsPerYear: null
    },
    {
      id: 'cov-premium-mental-health',
      planId: 'plan-premium-001',
      type: CoverageType.MENTAL_HEALTH,
      details: 'Cobertura para saúde mental',
      limitations: 'Inclui psicoterapia e psiquiatria',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0,
      visitsPerYear: null
    },
    {
      id: 'cov-premium-dental-basic',
      planId: 'plan-premium-001',
      type: CoverageType.DENTAL_BASIC,
      details: 'Cobertura para tratamentos odontológicos básicos',
      limitations: 'Inclui limpeza, restaurações e extrações',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-premium-dental-major',
      planId: 'plan-premium-001',
      type: CoverageType.DENTAL_MAJOR,
      details: 'Cobertura para tratamentos odontológicos complexos',
      limitations: 'Inclui próteses, implantes e ortodontia',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 80,
      deductible: 100,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 60,
      requiresAuthorization: true,
      waitingPeriodDays: 180
    },
    {
      id: 'cov-premium-vision',
      planId: 'plan-premium-001',
      type: CoverageType.VISION,
      details: 'Cobertura para cuidados com a visão',
      limitations: 'Inclui exames, armações e lentes',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 90,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 70,
      requiresAuthorization: false,
      waitingPeriodDays: 30,
      annualLimit: 1000
    },
    {
      id: 'cov-premium-maternity',
      planId: 'plan-premium-001',
      type: CoverageType.MATERNITY,
      details: 'Cobertura para cuidados de maternidade',
      limitations: 'Inclui pré-natal, parto e pós-parto',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 80,
      requiresAuthorization: true,
      waitingPeriodDays: 300
    },
    {
      id: 'cov-premium-medication',
      planId: 'plan-premium-001',
      type: CoverageType.MEDICATION,
      details: 'Cobertura para medicamentos',
      limitations: 'Inclui medicamentos genéricos e de marca',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 90,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 70,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    },
    {
      id: 'cov-premium-preventive-care',
      planId: 'plan-premium-001',
      type: CoverageType.PREVENTIVE_CARE,
      details: 'Cobertura para cuidados preventivos',
      limitations: 'Inclui check-ups anuais e vacinas',
      coPayment: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      coveragePercentage: 100,
      deductible: 0,
      outOfPocketMax: 1500,
      inNetworkOnly: false,
      outOfNetworkCoveragePercentage: 100,
      requiresAuthorization: false,
      waitingPeriodDays: 0
    }
  ]
};

/**
 * Map of claim types to coverage types for testing claim coverage
 */
const claimTypeToCoverageType: Record<string, CoverageType> = {
  'Consulta Médica': CoverageType.MEDICAL_CONSULTATION,
  'Exame': CoverageType.EXAM_LABORATORY,
  'Terapia': CoverageType.THERAPY,
  'Internação': CoverageType.HOSPITALIZATION,
  'Medicamento': CoverageType.MEDICATION
};

/**
 * Get all coverage fixtures
 * 
 * @returns All coverage fixtures
 */
export function getAllCoverageFixtures(): CoverageFixture[] {
  return Object.values(baseCoverageFixtures).flat();
}

/**
 * Get coverage fixtures by plan type
 * 
 * @param planType The plan type to get coverage fixtures for
 * @returns Coverage fixtures for the specified plan type
 */
export function getCoverageByPlanType(planType: string): CoverageFixture[] {
  return baseCoverageFixtures[planType] || [];
}

/**
 * Get a specific coverage fixture by ID
 * 
 * @param id The coverage ID to retrieve
 * @returns The coverage fixture with the specified ID, or undefined if not found
 */
export function getCoverageById(id: string): CoverageFixture | undefined {
  return getAllCoverageFixtures().find(coverage => coverage.id === id);
}

/**
 * Get coverage fixtures by coverage type
 * 
 * @param coverageType The coverage type to filter by
 * @returns Coverage fixtures of the specified type
 */
export function getCoverageByCoverageType(coverageType: CoverageType): CoverageFixture[] {
  return getAllCoverageFixtures().filter(coverage => coverage.type === coverageType);
}

/**
 * Get coverage fixtures by claim type
 * 
 * @param claimType The claim type to get coverage fixtures for
 * @returns Coverage fixtures applicable to the specified claim type
 */
export function getCoverageByClaimType(claimType: string): CoverageFixture[] {
  const coverageType = claimTypeToCoverageType[claimType];
  if (!coverageType) {
    return [];
  }
  return getCoverageByCoverageType(coverageType);
}

/**
 * Get coverage fixtures by network provider type
 * 
 * @param networkType The network provider type to filter by
 * @returns Coverage fixtures applicable to the specified network type
 */
export function getCoverageByNetworkType(networkType: NetworkProviderType): CoverageFixture[] {
  switch (networkType) {
    case NetworkProviderType.IN_NETWORK:
      return getAllCoverageFixtures();
    case NetworkProviderType.OUT_OF_NETWORK:
      return getAllCoverageFixtures().filter(coverage => !coverage.inNetworkOnly);
    case NetworkProviderType.ANY:
      return getAllCoverageFixtures();
    default:
      return [];
  }
}

/**
 * Get coverage fixtures by coverage percentage
 * 
 * @param percentage The coverage percentage to filter by
 * @param exact Whether to match the percentage exactly or find coverages with at least this percentage
 * @returns Coverage fixtures with the specified coverage percentage
 */
export function getCoverageByCoveragePercentage(percentage: number, exact: boolean = true): CoverageFixture[] {
  if (exact) {
    return getAllCoverageFixtures().filter(coverage => coverage.coveragePercentage === percentage);
  } else {
    return getAllCoverageFixtures().filter(coverage => coverage.coveragePercentage >= percentage);
  }
}

/**
 * Get coverage fixtures by deductible amount
 * 
 * @param deductible The deductible amount to filter by
 * @param maxAmount Whether to find coverages with at most this deductible
 * @returns Coverage fixtures with the specified deductible
 */
export function getCoverageByDeductible(deductible: number, maxAmount: boolean = true): CoverageFixture[] {
  if (maxAmount) {
    return getAllCoverageFixtures().filter(coverage => coverage.deductible <= deductible);
  } else {
    return getAllCoverageFixtures().filter(coverage => coverage.deductible === deductible);
  }
}

/**
 * Get coverage fixtures by authorization requirement
 * 
 * @param requiresAuthorization Whether to get coverages that require authorization
 * @returns Coverage fixtures based on authorization requirement
 */
export function getCoverageByAuthorizationRequirement(requiresAuthorization: boolean): CoverageFixture[] {
  return getAllCoverageFixtures().filter(coverage => coverage.requiresAuthorization === requiresAuthorization);
}

/**
 * Get coverage fixtures by waiting period
 * 
 * @param maxDays Maximum waiting period in days
 * @returns Coverage fixtures with waiting period less than or equal to maxDays
 */
export function getCoverageByWaitingPeriod(maxDays: number): CoverageFixture[] {
  return getAllCoverageFixtures().filter(coverage => coverage.waitingPeriodDays <= maxDays);
}

/**
 * Get coverage fixtures with no waiting period
 * 
 * @returns Coverage fixtures with no waiting period
 */
export function getCoverageWithNoWaitingPeriod(): CoverageFixture[] {
  return getCoverageByWaitingPeriod(0);
}

/**
 * Get coverage fixtures with no deductible
 * 
 * @returns Coverage fixtures with no deductible
 */
export function getCoverageWithNoDeductible(): CoverageFixture[] {
  return getCoverageByDeductible(0, false);
}

/**
 * Get coverage fixtures with full coverage (100%)
 * 
 * @returns Coverage fixtures with 100% coverage
 */
export function getCoverageWithFullCoverage(): CoverageFixture[] {
  return getCoverageByCoveragePercentage(100);
}

/**
 * Get coverage fixtures with annual visit limits
 * 
 * @returns Coverage fixtures with annual visit limits
 */
export function getCoverageWithVisitLimits(): CoverageFixture[] {
  return getAllCoverageFixtures().filter(coverage => coverage.visitsPerYear !== undefined && coverage.visitsPerYear !== null);
}

/**
 * Get coverage fixtures with annual monetary limits
 * 
 * @returns Coverage fixtures with annual monetary limits
 */
export function getCoverageWithAnnualLimits(): CoverageFixture[] {
  return getAllCoverageFixtures().filter(coverage => coverage.annualLimit !== undefined && coverage.annualLimit !== null);
}

/**
 * Get coverage fixtures for a specific plan and coverage type
 * 
 * @param planType The plan type to filter by
 * @param coverageType The coverage type to filter by
 * @returns Coverage fixtures for the specified plan and coverage type
 */
export function getCoverageByPlanAndType(planType: string, coverageType: CoverageType): CoverageFixture | undefined {
  const planCoverages = getCoverageByPlanType(planType);
  return planCoverages.find(coverage => coverage.type === coverageType);
}

/**
 * Calculate estimated out-of-pocket cost for a service based on coverage
 * 
 * @param coverage The coverage fixture to use for calculation
 * @param serviceAmount The total amount of the service
 * @param isInNetwork Whether the service is provided by an in-network provider
 * @returns The estimated out-of-pocket cost
 */
export function calculateEstimatedCost(coverage: CoverageFixture, serviceAmount: number, isInNetwork: boolean = true): number {
  // If in-network only and service is out-of-network, no coverage applies
  if (coverage.inNetworkOnly && !isInNetwork) {
    return serviceAmount;
  }
  
  // Determine the applicable coverage percentage
  const coveragePercentage = isInNetwork ? coverage.coveragePercentage : (coverage.outOfNetworkCoveragePercentage || 0);
  
  // Apply deductible
  let remainingAmount = Math.max(0, serviceAmount - coverage.deductible);
  
  // Apply coverage percentage
  const coveredAmount = (remainingAmount * coveragePercentage) / 100;
  
  // Calculate patient responsibility
  let patientCost = serviceAmount - coveredAmount;
  
  // Apply co-payment if applicable
  if (coverage.coPayment) {
    patientCost += coverage.coPayment;
  }
  
  // Ensure cost doesn't exceed out-of-pocket maximum
  patientCost = Math.min(patientCost, coverage.outOfPocketMax);
  
  return Math.max(0, patientCost);
}

/**
 * Check if a service is covered by the specified coverage
 * 
 * @param coverage The coverage fixture to check
 * @param serviceDate The date of the service
 * @param isInNetwork Whether the service is provided by an in-network provider
 * @returns Whether the service is covered
 */
export function isServiceCovered(coverage: CoverageFixture, serviceDate: Date, isInNetwork: boolean = true): boolean {
  // If in-network only and service is out-of-network, not covered
  if (coverage.inNetworkOnly && !isInNetwork) {
    return false;
  }
  
  // Check waiting period
  const coverageStartDate = new Date(coverage.createdAt);
  coverageStartDate.setDate(coverageStartDate.getDate() + coverage.waitingPeriodDays);
  
  if (serviceDate < coverageStartDate) {
    return false;
  }
  
  return true;
}

/**
 * Default export for easier importing
 */
export default {
  getAllCoverageFixtures,
  getCoverageByPlanType,
  getCoverageById,
  getCoverageByCoverageType,
  getCoverageByClaimType,
  getCoverageByNetworkType,
  getCoverageByCoveragePercentage,
  getCoverageByDeductible,
  getCoverageByAuthorizationRequirement,
  getCoverageByWaitingPeriod,
  getCoverageWithNoWaitingPeriod,
  getCoverageWithNoDeductible,
  getCoverageWithFullCoverage,
  getCoverageWithVisitLimits,
  getCoverageWithAnnualLimits,
  getCoverageByPlanAndType,
  calculateEstimatedCost,
  isServiceCovered,
};