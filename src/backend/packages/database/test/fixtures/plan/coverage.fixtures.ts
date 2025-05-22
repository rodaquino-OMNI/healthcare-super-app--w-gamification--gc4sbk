/**
 * @file Coverage Test Fixtures for Plan Journey
 * 
 * Provides test fixtures for insurance coverage details in the Plan journey.
 * Contains mock data for coverage percentages, deductibles, out-of-pocket maximums,
 * and network providers. These fixtures enable thorough testing of coverage calculation,
 * eligibility verification, and cost estimation features.
 */

import { ICoverage } from '@austa/interfaces/journey/plan';

/**
 * Extended coverage interface for test fixtures with additional properties
 * needed for comprehensive coverage testing scenarios
 */
export interface CoverageFixture extends ICoverage {
  /**
   * Coverage percentage (0-100) for in-network providers
   */
  inNetworkCoveragePercentage: number;
  
  /**
   * Coverage percentage (0-100) for out-of-network providers
   */
  outOfNetworkCoveragePercentage: number;
  
  /**
   * Annual deductible amount for in-network providers
   */
  inNetworkDeductible: number;
  
  /**
   * Annual deductible amount for out-of-network providers
   */
  outOfNetworkDeductible: number;
  
  /**
   * Annual out-of-pocket maximum for in-network providers
   */
  inNetworkOutOfPocketMax: number;
  
  /**
   * Annual out-of-pocket maximum for out-of-network providers
   */
  outOfNetworkOutOfPocketMax: number;
  
  /**
   * Whether prior authorization is required for this coverage
   */
  requiresPriorAuthorization: boolean;
  
  /**
   * Maximum number of visits/uses per year, if applicable
   */
  annualLimit?: number;
  
  /**
   * Maximum lifetime benefit amount, if applicable
   */
  lifetimeMaximum?: number;
}

/**
 * Enum for coverage types to ensure consistency across fixtures
 */
export enum CoverageType {
  MEDICAL_VISIT = 'medical_visit',
  SPECIALIST_VISIT = 'specialist_visit',
  EMERGENCY = 'emergency',
  HOSPITALIZATION = 'hospitalization',
  SURGERY = 'surgery',
  DIAGNOSTIC_TESTS = 'diagnostic_tests',
  IMAGING = 'imaging',
  LABORATORY = 'laboratory',
  MATERNITY = 'maternity',
  MENTAL_HEALTH = 'mental_health',
  REHABILITATION = 'rehabilitation',
  PRESCRIPTION_DRUGS = 'prescription_drugs',
  DENTAL = 'dental',
  VISION = 'vision',
  PREVENTIVE_CARE = 'preventive_care',
}

// Basic Plan Coverage Fixtures

/**
 * Basic plan medical visit coverage fixture
 */
export const basicMedicalVisitCoverage: CoverageFixture = {
  id: 'cov-basic-medical-visit-001',
  planId: 'plan-basic-001',
  type: CoverageType.MEDICAL_VISIT,
  details: 'Cobertura para consultas médicas em clínicas básicas',
  limitations: 'Limitado a 10 consultas por ano',
  coPayment: 50,
  inNetworkCoveragePercentage: 70,
  outOfNetworkCoveragePercentage: 50,
  inNetworkDeductible: 500,
  outOfNetworkDeductible: 1000,
  inNetworkOutOfPocketMax: 5000,
  outOfNetworkOutOfPocketMax: 10000,
  requiresPriorAuthorization: false,
  annualLimit: 10,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Básica', 'Clínicas Populares'],
  },
};

/**
 * Basic plan emergency coverage fixture
 */
export const basicEmergencyCoverage: CoverageFixture = {
  id: 'cov-basic-emergency-001',
  planId: 'plan-basic-001',
  type: CoverageType.EMERGENCY,
  details: 'Cobertura para atendimentos de emergência',
  limitations: 'Apenas em hospitais da rede credenciada básica',
  coPayment: 100,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 300,
  outOfNetworkDeductible: 800,
  inNetworkOutOfPocketMax: 5000,
  outOfNetworkOutOfPocketMax: 10000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Básicos', 'Pronto Atendimento Rede Básica'],
  },
};

/**
 * Basic plan hospitalization coverage fixture
 */
export const basicHospitalizationCoverage: CoverageFixture = {
  id: 'cov-basic-hospitalization-001',
  planId: 'plan-basic-001',
  type: CoverageType.HOSPITALIZATION,
  details: 'Cobertura para internações hospitalares',
  limitations: 'Apenas quartos coletivos, limitado a 5 dias por internação',
  coPayment: 200,
  inNetworkCoveragePercentage: 70,
  outOfNetworkCoveragePercentage: 40,
  inNetworkDeductible: 1000,
  outOfNetworkDeductible: 2000,
  inNetworkOutOfPocketMax: 5000,
  outOfNetworkOutOfPocketMax: 10000,
  requiresPriorAuthorization: true,
  annualLimit: 10,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Básicos'],
    daysPerAdmission: 5,
    roomType: 'collective',
  },
};

/**
 * Basic plan diagnostic tests coverage fixture
 */
export const basicDiagnosticCoverage: CoverageFixture = {
  id: 'cov-basic-diagnostic-001',
  planId: 'plan-basic-001',
  type: CoverageType.DIAGNOSTIC_TESTS,
  details: 'Cobertura para exames diagnósticos básicos',
  limitations: 'Apenas exames básicos, limitado a 10 exames por ano',
  coPayment: 30,
  inNetworkCoveragePercentage: 70,
  outOfNetworkCoveragePercentage: 40,
  inNetworkDeductible: 300,
  outOfNetworkDeductible: 600,
  inNetworkOutOfPocketMax: 5000,
  outOfNetworkOutOfPocketMax: 10000,
  requiresPriorAuthorization: false,
  annualLimit: 10,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Laboratórios Básicos', 'Clínicas Diagnósticas Básicas'],
    coveredTests: ['Hemograma', 'Glicemia', 'Colesterol', 'Triglicerídeos', 'Urina I'],
  },
};

/**
 * Basic plan prescription drugs coverage fixture
 */
export const basicPrescriptionCoverage: CoverageFixture = {
  id: 'cov-basic-prescription-001',
  planId: 'plan-basic-001',
  type: CoverageType.PRESCRIPTION_DRUGS,
  details: 'Cobertura para medicamentos prescritos',
  limitations: 'Apenas medicamentos genéricos da lista básica',
  coPayment: 20,
  inNetworkCoveragePercentage: 50,
  outOfNetworkCoveragePercentage: 30,
  inNetworkDeductible: 200,
  outOfNetworkDeductible: 400,
  inNetworkOutOfPocketMax: 5000,
  outOfNetworkOutOfPocketMax: 10000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Farmácias Populares', 'Drogarias Conveniadas Básicas'],
    formularyType: 'generic_only',
  },
};

// Standard Plan Coverage Fixtures

/**
 * Standard plan medical visit coverage fixture
 */
export const standardMedicalVisitCoverage: CoverageFixture = {
  id: 'cov-standard-medical-visit-001',
  planId: 'plan-standard-001',
  type: CoverageType.MEDICAL_VISIT,
  details: 'Cobertura para consultas médicas em clínicas e consultórios',
  limitations: 'Limitado a 15 consultas por ano',
  coPayment: 30,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 300,
  outOfNetworkDeductible: 800,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: false,
  annualLimit: 15,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Standard', 'Clínicas Conveniadas'],
  },
};

/**
 * Standard plan specialist visit coverage fixture
 */
export const standardSpecialistCoverage: CoverageFixture = {
  id: 'cov-standard-specialist-001',
  planId: 'plan-standard-001',
  type: CoverageType.SPECIALIST_VISIT,
  details: 'Cobertura para consultas com especialistas',
  limitations: 'Limitado a 10 consultas por ano',
  coPayment: 50,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 300,
  outOfNetworkDeductible: 800,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: false,
  annualLimit: 10,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Standard', 'Especialistas Conveniados'],
    specialties: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Ginecologia', 'Oftalmologia'],
  },
};

/**
 * Standard plan emergency coverage fixture
 */
export const standardEmergencyCoverage: CoverageFixture = {
  id: 'cov-standard-emergency-001',
  planId: 'plan-standard-001',
  type: CoverageType.EMERGENCY,
  details: 'Cobertura para atendimentos de emergência',
  limitations: 'Hospitais da rede credenciada standard',
  coPayment: 75,
  inNetworkCoveragePercentage: 90,
  outOfNetworkCoveragePercentage: 70,
  inNetworkDeductible: 200,
  outOfNetworkDeductible: 600,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Standard', 'Pronto Atendimento Rede Standard'],
  },
};

/**
 * Standard plan hospitalization coverage fixture
 */
export const standardHospitalizationCoverage: CoverageFixture = {
  id: 'cov-standard-hospitalization-001',
  planId: 'plan-standard-001',
  type: CoverageType.HOSPITALIZATION,
  details: 'Cobertura para internações hospitalares',
  limitations: 'Quartos semi-privados, limitado a 10 dias por internação',
  coPayment: 150,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 500,
  outOfNetworkDeductible: 1500,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: true,
  annualLimit: 20,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Standard'],
    daysPerAdmission: 10,
    roomType: 'semi-private',
  },
};

/**
 * Standard plan surgery coverage fixture
 */
export const standardSurgeryCoverage: CoverageFixture = {
  id: 'cov-standard-surgery-001',
  planId: 'plan-standard-001',
  type: CoverageType.SURGERY,
  details: 'Cobertura para procedimentos cirúrgicos',
  limitations: 'Apenas cirurgias de média complexidade',
  coPayment: 200,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 800,
  outOfNetworkDeductible: 2000,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Standard', 'Centros Cirúrgicos Conveniados'],
    complexityLevel: 'medium',
  },
};

/**
 * Standard plan diagnostic tests coverage fixture
 */
export const standardDiagnosticCoverage: CoverageFixture = {
  id: 'cov-standard-diagnostic-001',
  planId: 'plan-standard-001',
  type: CoverageType.DIAGNOSTIC_TESTS,
  details: 'Cobertura para exames diagnósticos',
  limitations: 'Exames de média complexidade, limitado a 20 exames por ano',
  coPayment: 20,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 200,
  outOfNetworkDeductible: 500,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: false,
  annualLimit: 20,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Laboratórios Standard', 'Clínicas Diagnósticas Standard'],
    coveredTests: ['Hemograma', 'Glicemia', 'Colesterol', 'Triglicerídeos', 'Urina I', 
                   'TSH', 'T4 livre', 'Ácido Úrico', 'TGO', 'TGP', 'Creatinina'],
  },
};

/**
 * Standard plan imaging coverage fixture
 */
export const standardImagingCoverage: CoverageFixture = {
  id: 'cov-standard-imaging-001',
  planId: 'plan-standard-001',
  type: CoverageType.IMAGING,
  details: 'Cobertura para exames de imagem',
  limitations: 'Exames de média complexidade, limitado a 10 exames por ano',
  coPayment: 50,
  inNetworkCoveragePercentage: 80,
  outOfNetworkCoveragePercentage: 60,
  inNetworkDeductible: 300,
  outOfNetworkDeductible: 800,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: true,
  annualLimit: 10,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Centros de Imagem Standard', 'Clínicas Radiológicas Standard'],
    coveredTests: ['Raio-X', 'Ultrassonografia', 'Mamografia', 'Densitometria Óssea'],
  },
};

/**
 * Standard plan prescription drugs coverage fixture
 */
export const standardPrescriptionCoverage: CoverageFixture = {
  id: 'cov-standard-prescription-001',
  planId: 'plan-standard-001',
  type: CoverageType.PRESCRIPTION_DRUGS,
  details: 'Cobertura para medicamentos prescritos',
  limitations: 'Medicamentos genéricos e de marca da lista standard',
  coPayment: 15,
  inNetworkCoveragePercentage: 70,
  outOfNetworkCoveragePercentage: 50,
  inNetworkDeductible: 150,
  outOfNetworkDeductible: 300,
  inNetworkOutOfPocketMax: 4000,
  outOfNetworkOutOfPocketMax: 8000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Farmácias Conveniadas', 'Drogarias Standard'],
    formularyType: 'generic_and_brand',
  },
};

/**
 * Standard plan dental coverage fixture
 */
export const standardDentalCoverage: CoverageFixture = {
  id: 'cov-standard-dental-001',
  planId: 'plan-standard-001',
  type: CoverageType.DENTAL,
  details: 'Cobertura para tratamentos odontológicos básicos',
  limitations: 'Apenas procedimentos básicos e preventivos',
  coPayment: 30,
  inNetworkCoveragePercentage: 70,
  outOfNetworkCoveragePercentage: 50,
  inNetworkDeductible: 100,
  outOfNetworkDeductible: 300,
  inNetworkOutOfPocketMax: 2000,
  outOfNetworkOutOfPocketMax: 4000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Clínicas Odontológicas Standard'],
    coveredProcedures: ['Limpeza', 'Restaurações Simples', 'Extrações Simples', 'Radiografias'],
  },
};

// Premium Plan Coverage Fixtures

/**
 * Premium plan medical visit coverage fixture
 */
export const premiumMedicalVisitCoverage: CoverageFixture = {
  id: 'cov-premium-medical-visit-001',
  planId: 'plan-premium-001',
  type: CoverageType.MEDICAL_VISIT,
  details: 'Cobertura para consultas médicas em clínicas e consultórios premium',
  limitations: 'Sem limite de consultas por ano',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 500,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Premium', 'Clínicas Premium', 'Médicos Particulares Conveniados'],
  },
};

/**
 * Premium plan specialist visit coverage fixture
 */
export const premiumSpecialistCoverage: CoverageFixture = {
  id: 'cov-premium-specialist-001',
  planId: 'plan-premium-001',
  type: CoverageType.SPECIALIST_VISIT,
  details: 'Cobertura para consultas com especialistas premium',
  limitations: 'Sem limite de consultas por ano',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 500,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Premium', 'Especialistas Premium'],
    specialties: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Ginecologia', 'Oftalmologia',
                  'Neurologia', 'Endocrinologia', 'Oncologia', 'Urologia', 'Psiquiatria'],
  },
};

/**
 * Premium plan emergency coverage fixture
 */
export const premiumEmergencyCoverage: CoverageFixture = {
  id: 'cov-premium-emergency-001',
  planId: 'plan-premium-001',
  type: CoverageType.EMERGENCY,
  details: 'Cobertura para atendimentos de emergência em hospitais premium',
  limitations: 'Sem limitações',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 90,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 300,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Premium', 'Pronto Atendimento Rede Premium'],
    includesAmbulance: true,
    includesAirTransport: true,
  },
};

/**
 * Premium plan hospitalization coverage fixture
 */
export const premiumHospitalizationCoverage: CoverageFixture = {
  id: 'cov-premium-hospitalization-001',
  planId: 'plan-premium-001',
  type: CoverageType.HOSPITALIZATION,
  details: 'Cobertura para internações hospitalares em hospitais premium',
  limitations: 'Quartos privados, sem limite de dias por internação',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 1000,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Premium'],
    roomType: 'private',
    includesCompanionAccommodation: true,
  },
};

/**
 * Premium plan surgery coverage fixture
 */
export const premiumSurgeryCoverage: CoverageFixture = {
  id: 'cov-premium-surgery-001',
  planId: 'plan-premium-001',
  type: CoverageType.SURGERY,
  details: 'Cobertura para procedimentos cirúrgicos de qualquer complexidade',
  limitations: 'Sem limitações',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 1500,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Hospitais Premium', 'Centros Cirúrgicos Premium'],
    complexityLevel: 'all',
    includesRoboticsAndAdvancedTechniques: true,
  },
};

/**
 * Premium plan diagnostic tests coverage fixture
 */
export const premiumDiagnosticCoverage: CoverageFixture = {
  id: 'cov-premium-diagnostic-001',
  planId: 'plan-premium-001',
  type: CoverageType.DIAGNOSTIC_TESTS,
  details: 'Cobertura para exames diagnósticos de qualquer complexidade',
  limitations: 'Sem limite de exames por ano',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 300,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Laboratórios Premium', 'Clínicas Diagnósticas Premium'],
    coveredTests: 'all',
  },
};

/**
 * Premium plan imaging coverage fixture
 */
export const premiumImagingCoverage: CoverageFixture = {
  id: 'cov-premium-imaging-001',
  planId: 'plan-premium-001',
  type: CoverageType.IMAGING,
  details: 'Cobertura para exames de imagem de qualquer complexidade',
  limitations: 'Sem limite de exames por ano',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 500,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Centros de Imagem Premium', 'Clínicas Radiológicas Premium'],
    coveredTests: ['Raio-X', 'Ultrassonografia', 'Mamografia', 'Densitometria Óssea', 
                   'Tomografia Computadorizada', 'Ressonância Magnética', 'PET-CT', 
                   'Cintilografia', 'Angiografia'],
  },
};

/**
 * Premium plan prescription drugs coverage fixture
 */
export const premiumPrescriptionCoverage: CoverageFixture = {
  id: 'cov-premium-prescription-001',
  planId: 'plan-premium-001',
  type: CoverageType.PRESCRIPTION_DRUGS,
  details: 'Cobertura para medicamentos prescritos de qualquer tipo',
  limitations: 'Inclui medicamentos de alto custo e importados',
  coPayment: 0,
  inNetworkCoveragePercentage: 90,
  outOfNetworkCoveragePercentage: 70,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 200,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Farmácias Premium', 'Drogarias Premium'],
    formularyType: 'comprehensive',
    includesSpecialtyDrugs: true,
  },
};

/**
 * Premium plan dental coverage fixture
 */
export const premiumDentalCoverage: CoverageFixture = {
  id: 'cov-premium-dental-001',
  planId: 'plan-premium-001',
  type: CoverageType.DENTAL,
  details: 'Cobertura para tratamentos odontológicos completos',
  limitations: 'Inclui procedimentos estéticos',
  coPayment: 0,
  inNetworkCoveragePercentage: 90,
  outOfNetworkCoveragePercentage: 70,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 200,
  inNetworkOutOfPocketMax: 2000,
  outOfNetworkOutOfPocketMax: 4000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Clínicas Odontológicas Premium'],
    coveredProcedures: ['Limpeza', 'Restaurações', 'Extrações', 'Radiografias', 
                         'Tratamento de Canal', 'Próteses', 'Implantes', 'Ortodontia', 
                         'Clareamento', 'Cirurgias Odontológicas'],
  },
};

/**
 * Premium plan vision coverage fixture
 */
export const premiumVisionCoverage: CoverageFixture = {
  id: 'cov-premium-vision-001',
  planId: 'plan-premium-001',
  type: CoverageType.VISION,
  details: 'Cobertura para cuidados oftalmológicos completos',
  limitations: 'Inclui óculos e lentes de contato de alto padrão',
  coPayment: 0,
  inNetworkCoveragePercentage: 90,
  outOfNetworkCoveragePercentage: 70,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 200,
  inNetworkOutOfPocketMax: 2000,
  outOfNetworkOutOfPocketMax: 4000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Clínicas Oftalmológicas Premium', 'Óticas Conveniadas Premium'],
    coveredItems: ['Consultas', 'Exames', 'Óculos', 'Lentes de Contato', 'Cirurgias Refrativas'],
    framesAllowance: 1000,
    lensesPerYear: 2,
  },
};

/**
 * Premium plan mental health coverage fixture
 */
export const premiumMentalHealthCoverage: CoverageFixture = {
  id: 'cov-premium-mental-health-001',
  planId: 'plan-premium-001',
  type: CoverageType.MENTAL_HEALTH,
  details: 'Cobertura para tratamentos de saúde mental',
  limitations: 'Sem limite de sessões por ano',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 300,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Clínicas de Saúde Mental Premium', 'Psicólogos e Psiquiatras Conveniados'],
    coveredServices: ['Psicoterapia', 'Consultas Psiquiátricas', 'Terapia de Grupo', 
                      'Internação Psiquiátrica', 'Tratamento para Dependência Química'],
  },
};

/**
 * Premium plan preventive care coverage fixture
 */
export const premiumPreventiveCoverage: CoverageFixture = {
  id: 'cov-premium-preventive-001',
  planId: 'plan-premium-001',
  type: CoverageType.PREVENTIVE_CARE,
  details: 'Cobertura para cuidados preventivos completos',
  limitations: 'Sem limitações',
  coPayment: 0,
  inNetworkCoveragePercentage: 100,
  outOfNetworkCoveragePercentage: 80,
  inNetworkDeductible: 0,
  outOfNetworkDeductible: 200,
  inNetworkOutOfPocketMax: 3000,
  outOfNetworkOutOfPocketMax: 6000,
  requiresPriorAuthorization: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  metadata: {
    networkProviders: ['Rede Premium', 'Clínicas Preventivas Premium'],
    coveredServices: ['Check-up Completo', 'Vacinas', 'Exames Preventivos', 
                      'Aconselhamento Nutricional', 'Programas de Bem-estar'],
  },
};

// Coverage Collections by Plan Type

/**
 * Collection of basic plan coverage fixtures
 */
export const basicCoverage = {
  medicalVisit: basicMedicalVisitCoverage,
  emergency: basicEmergencyCoverage,
  hospitalization: basicHospitalizationCoverage,
  diagnosticTests: basicDiagnosticCoverage,
  prescriptionDrugs: basicPrescriptionCoverage,
};

/**
 * Collection of standard plan coverage fixtures
 */
export const standardCoverage = {
  medicalVisit: standardMedicalVisitCoverage,
  specialistVisit: standardSpecialistCoverage,
  emergency: standardEmergencyCoverage,
  hospitalization: standardHospitalizationCoverage,
  surgery: standardSurgeryCoverage,
  diagnosticTests: standardDiagnosticCoverage,
  imaging: standardImagingCoverage,
  prescriptionDrugs: standardPrescriptionCoverage,
  dental: standardDentalCoverage,
};

/**
 * Collection of premium plan coverage fixtures
 */
export const premiumCoverage = {
  medicalVisit: premiumMedicalVisitCoverage,
  specialistVisit: premiumSpecialistCoverage,
  emergency: premiumEmergencyCoverage,
  hospitalization: premiumHospitalizationCoverage,
  surgery: premiumSurgeryCoverage,
  diagnosticTests: premiumDiagnosticCoverage,
  imaging: premiumImagingCoverage,
  prescriptionDrugs: premiumPrescriptionCoverage,
  dental: premiumDentalCoverage,
  vision: premiumVisionCoverage,
  mentalHealth: premiumMentalHealthCoverage,
  preventiveCare: premiumPreventiveCoverage,
};

// Helper Functions

/**
 * Returns coverage fixtures for testing in-network vs. out-of-network scenarios
 * @returns Object containing coverage fixtures for network testing
 */
export function getNetworkCoverageFixtures() {
  return {
    inNetwork: {
      basic: basicMedicalVisitCoverage,
      standard: standardMedicalVisitCoverage,
      premium: premiumMedicalVisitCoverage,
    },
    outOfNetwork: {
      basic: {
        ...basicMedicalVisitCoverage,
        id: 'cov-basic-medical-visit-out-001',
        inNetworkCoveragePercentage: 0,
        outOfNetworkCoveragePercentage: 50,
      },
      standard: {
        ...standardMedicalVisitCoverage,
        id: 'cov-standard-medical-visit-out-001',
        inNetworkCoveragePercentage: 0,
        outOfNetworkCoveragePercentage: 60,
      },
      premium: {
        ...premiumMedicalVisitCoverage,
        id: 'cov-premium-medical-visit-out-001',
        inNetworkCoveragePercentage: 0,
        outOfNetworkCoveragePercentage: 80,
      },
    },
  };
}

/**
 * Returns coverage fixtures for testing deductible calculations
 * @returns Object containing coverage fixtures with different deductible scenarios
 */
export function getDeductibleTestFixtures() {
  return {
    noDeductible: {
      ...premiumMedicalVisitCoverage,
      id: 'cov-test-no-deductible-001',
      inNetworkDeductible: 0,
      outOfNetworkDeductible: 0,
    },
    lowDeductible: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-low-deductible-001',
      inNetworkDeductible: 250,
      outOfNetworkDeductible: 500,
    },
    highDeductible: {
      ...basicMedicalVisitCoverage,
      id: 'cov-test-high-deductible-001',
      inNetworkDeductible: 1500,
      outOfNetworkDeductible: 3000,
    },
  };
}

/**
 * Returns coverage fixtures for testing out-of-pocket maximum calculations
 * @returns Object containing coverage fixtures with different out-of-pocket maximum scenarios
 */
export function getOutOfPocketMaxTestFixtures() {
  return {
    lowOutOfPocketMax: {
      ...premiumMedicalVisitCoverage,
      id: 'cov-test-low-oop-001',
      inNetworkOutOfPocketMax: 2000,
      outOfNetworkOutOfPocketMax: 4000,
    },
    mediumOutOfPocketMax: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-medium-oop-001',
      inNetworkOutOfPocketMax: 4000,
      outOfNetworkOutOfPocketMax: 8000,
    },
    highOutOfPocketMax: {
      ...basicMedicalVisitCoverage,
      id: 'cov-test-high-oop-001',
      inNetworkOutOfPocketMax: 6000,
      outOfNetworkOutOfPocketMax: 12000,
    },
  };
}

/**
 * Returns coverage fixtures for testing prior authorization requirements
 * @returns Object containing coverage fixtures with different prior authorization scenarios
 */
export function getPriorAuthorizationTestFixtures() {
  return {
    requiresAuthorization: {
      ...standardSurgeryCoverage,
      id: 'cov-test-requires-auth-001',
      requiresPriorAuthorization: true,
    },
    noAuthorizationRequired: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-no-auth-001',
      requiresPriorAuthorization: false,
    },
  };
}

/**
 * Returns coverage fixtures for testing annual limits
 * @returns Object containing coverage fixtures with different annual limit scenarios
 */
export function getAnnualLimitTestFixtures() {
  return {
    noLimit: {
      ...premiumMedicalVisitCoverage,
      id: 'cov-test-no-limit-001',
      annualLimit: undefined,
    },
    lowLimit: {
      ...basicMedicalVisitCoverage,
      id: 'cov-test-low-limit-001',
      annualLimit: 5,
    },
    highLimit: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-high-limit-001',
      annualLimit: 30,
    },
  };
}

/**
 * Returns coverage fixtures for testing co-payment scenarios
 * @returns Object containing coverage fixtures with different co-payment scenarios
 */
export function getCoPaymentTestFixtures() {
  return {
    noCoPayment: {
      ...premiumMedicalVisitCoverage,
      id: 'cov-test-no-copay-001',
      coPayment: 0,
    },
    lowCoPayment: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-low-copay-001',
      coPayment: 15,
    },
    highCoPayment: {
      ...basicMedicalVisitCoverage,
      id: 'cov-test-high-copay-001',
      coPayment: 75,
    },
  };
}

/**
 * Returns coverage fixtures for testing coverage percentage calculations
 * @returns Object containing coverage fixtures with different coverage percentage scenarios
 */
export function getCoveragePercentageTestFixtures() {
  return {
    fullCoverage: {
      ...premiumMedicalVisitCoverage,
      id: 'cov-test-full-coverage-001',
      inNetworkCoveragePercentage: 100,
      outOfNetworkCoveragePercentage: 80,
    },
    partialCoverage: {
      ...standardMedicalVisitCoverage,
      id: 'cov-test-partial-coverage-001',
      inNetworkCoveragePercentage: 80,
      outOfNetworkCoveragePercentage: 60,
    },
    minimalCoverage: {
      ...basicMedicalVisitCoverage,
      id: 'cov-test-minimal-coverage-001',
      inNetworkCoveragePercentage: 60,
      outOfNetworkCoveragePercentage: 40,
    },
  };
}

/**
 * Default export for backwards compatibility
 */
export default {
  basicCoverage,
  standardCoverage,
  premiumCoverage,
  getNetworkCoverageFixtures,
  getDeductibleTestFixtures,
  getOutOfPocketMaxTestFixtures,
  getPriorAuthorizationTestFixtures,
  getAnnualLimitTestFixtures,
  getCoPaymentTestFixtures,
  getCoveragePercentageTestFixtures,
};