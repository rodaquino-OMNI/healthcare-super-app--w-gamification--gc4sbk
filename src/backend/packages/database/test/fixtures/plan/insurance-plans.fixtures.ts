/**
 * @file insurance-plans.fixtures.ts
 * @description Provides standardized test fixtures for insurance plans in the Plan journey.
 * Contains mock data for different plan types (Básico, Standard, Premium) with varying
 * coverage levels, prices, limits, and eligibility conditions.
 */

import { IPlan } from '@austa/interfaces/journey/plan';
import { IJourneyIdentifier } from '@austa/interfaces/common/journey.interface';

/**
 * Interface for insurance plan fixtures with additional test-specific properties
 * Extends the standard IPlan interface with properties useful for testing
 */
export interface IPlanFixture extends IPlan {
  /**
   * Indicates if the plan is eligible for new enrollments
   */
  isOpenForEnrollment: boolean;
  
  /**
   * Minimum age requirement for the plan
   */
  minimumAge?: number;
  
  /**
   * Maximum age limit for the plan
   */
  maximumAge?: number;
  
  /**
   * Annual deductible amount that must be paid before coverage begins
   */
  annualDeductible: number;
  
  /**
   * Maximum out-of-pocket expenses per year
   */
  maxOutOfPocket: number;
  
  /**
   * Network type (e.g., HMO, PPO, EPO)
   */
  networkType: string;
}

/**
 * Base plan fixture with common properties for all plan types
 * Used as a foundation for creating specific plan fixtures
 */
const basePlanFixture: Partial<IPlanFixture> = {
  userId: 'test-user-id',
  journey: 'plan' as IJourneyIdentifier,
  provider: 'AUSTA Seguros',
  currency: 'BRL',
  status: 'active',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  validityStart: new Date('2023-01-01T00:00:00Z'),
  validityEnd: new Date('2023-12-31T23:59:59Z'),
  isOpenForEnrollment: true,
};

/**
 * Basic plan fixture with minimal coverage
 */
export const basicPlanFixture: IPlanFixture = {
  ...basePlanFixture,
  id: 'plan-basic-001',
  planNumber: 'PLN-BASIC-2023',
  name: 'Plano Básico',
  description: 'Cobertura básica para cuidados essenciais de saúde',
  type: 'Básico',
  premium: 199.90,
  annualDeductible: 500,
  maxOutOfPocket: 5000,
  networkType: 'HMO',
  minimumAge: 18,
  maximumAge: 65,
  coverageDetails: {
    hospitalCoverage: '60%',
    emergencyCoverage: '80%',
    primaryCareCoverage: '70%',
    specialistCoverage: '50%',
    prescriptionCoverage: '40%',
    dentalCoverage: null,
    visionCoverage: null,
    mentalHealthCoverage: '30%',
    maternityBenefits: false,
    preventiveCare: true,
  },
} as IPlanFixture;

/**
 * Standard plan fixture with intermediate coverage
 */
export const standardPlanFixture: IPlanFixture = {
  ...basePlanFixture,
  id: 'plan-standard-001',
  planNumber: 'PLN-STANDARD-2023',
  name: 'Plano Standard',
  description: 'Cobertura intermediária com benefícios adicionais',
  type: 'Standard',
  premium: 349.90,
  annualDeductible: 300,
  maxOutOfPocket: 3500,
  networkType: 'PPO',
  minimumAge: 18,
  maximumAge: 70,
  coverageDetails: {
    hospitalCoverage: '80%',
    emergencyCoverage: '90%',
    primaryCareCoverage: '90%',
    specialistCoverage: '70%',
    prescriptionCoverage: '60%',
    dentalCoverage: '50%',
    visionCoverage: null,
    mentalHealthCoverage: '60%',
    maternityBenefits: true,
    preventiveCare: true,
  },
} as IPlanFixture;

/**
 * Premium plan fixture with comprehensive coverage
 */
export const premiumPlanFixture: IPlanFixture = {
  ...basePlanFixture,
  id: 'plan-premium-001',
  planNumber: 'PLN-PREMIUM-2023',
  name: 'Plano Premium',
  description: 'Cobertura ampla com benefícios exclusivos e rede estendida',
  type: 'Premium',
  premium: 599.90,
  annualDeductible: 100,
  maxOutOfPocket: 2000,
  networkType: 'PPO+',
  minimumAge: 18,
  maximumAge: 75,
  coverageDetails: {
    hospitalCoverage: '100%',
    emergencyCoverage: '100%',
    primaryCareCoverage: '100%',
    specialistCoverage: '90%',
    prescriptionCoverage: '80%',
    dentalCoverage: '80%',
    visionCoverage: '70%',
    mentalHealthCoverage: '90%',
    maternityBenefits: true,
    preventiveCare: true,
    internationalCoverage: true,
    wellnessPrograms: true,
  },
} as IPlanFixture;

/**
 * Family plan fixture based on the standard plan
 */
export const familyPlanFixture: IPlanFixture = {
  ...standardPlanFixture,
  id: 'plan-family-001',
  planNumber: 'PLN-FAMILY-2023',
  name: 'Plano Família',
  description: 'Cobertura para toda a família com benefícios especiais para crianças',
  type: 'Standard',
  premium: 799.90,
  coverageDetails: {
    ...standardPlanFixture.coverageDetails as Record<string, any>,
    pediatricCare: '100%',
    familyTherapy: '70%',
    childDentalCare: '80%',
  },
} as IPlanFixture;

/**
 * Senior plan fixture with specialized coverage for older adults
 */
export const seniorPlanFixture: IPlanFixture = {
  ...basePlanFixture,
  id: 'plan-senior-001',
  planNumber: 'PLN-SENIOR-2023',
  name: 'Plano Senior',
  description: 'Cobertura especializada para adultos acima de 60 anos',
  type: 'Premium',
  premium: 699.90,
  annualDeductible: 200,
  maxOutOfPocket: 2500,
  networkType: 'PPO',
  minimumAge: 60,
  maximumAge: 85,
  coverageDetails: {
    hospitalCoverage: '90%',
    emergencyCoverage: '100%',
    primaryCareCoverage: '100%',
    specialistCoverage: '90%',
    prescriptionCoverage: '90%',
    dentalCoverage: '70%',
    visionCoverage: '80%',
    mentalHealthCoverage: '80%',
    preventiveCare: true,
    chronicConditionManagement: true,
    homeHealthCare: '80%',
    medicalEquipment: '70%',
  },
} as IPlanFixture;

/**
 * Collection of all plan fixtures for easy access
 */
export const planFixtures = {
  basic: basicPlanFixture,
  standard: standardPlanFixture,
  premium: premiumPlanFixture,
  family: familyPlanFixture,
  senior: seniorPlanFixture,
};

/**
 * Returns a plan fixture by type
 * @param type The plan type to retrieve
 * @returns The corresponding plan fixture
 */
export const getPlanFixtureByType = (type: string): IPlanFixture => {
  switch (type.toLowerCase()) {
    case 'básico':
    case 'basico':
    case 'basic':
      return basicPlanFixture;
    case 'standard':
      return standardPlanFixture;
    case 'premium':
      return premiumPlanFixture;
    case 'family':
    case 'família':
    case 'familia':
      return familyPlanFixture;
    case 'senior':
    case 'idoso':
      return seniorPlanFixture;
    default:
      return standardPlanFixture; // Default to standard plan
  }
};

/**
 * Returns all plan fixtures as an array
 * @returns Array of all plan fixtures
 */
export const getAllPlanFixtures = (): IPlanFixture[] => {
  return Object.values(planFixtures);
};

/**
 * Returns a subset of plan fixtures based on a filter function
 * @param filterFn Function to filter plans
 * @returns Filtered array of plan fixtures
 */
export const getFilteredPlanFixtures = (filterFn: (plan: IPlanFixture) => boolean): IPlanFixture[] => {
  return getAllPlanFixtures().filter(filterFn);
};

/**
 * Returns plans that are open for enrollment
 * @returns Array of plans open for enrollment
 */
export const getOpenEnrollmentPlans = (): IPlanFixture[] => {
  return getFilteredPlanFixtures(plan => plan.isOpenForEnrollment);
};

/**
 * Returns plans suitable for a specific age
 * @param age The age to check eligibility for
 * @returns Array of age-appropriate plans
 */
export const getPlansForAge = (age: number): IPlanFixture[] => {
  return getFilteredPlanFixtures(plan => {
    const minAge = plan.minimumAge || 0;
    const maxAge = plan.maximumAge || 999;
    return age >= minAge && age <= maxAge;
  });
};

/**
 * Returns plans below a specified monthly premium
 * @param maxPremium Maximum monthly premium amount
 * @returns Array of plans within budget
 */
export const getPlansWithinBudget = (maxPremium: number): IPlanFixture[] => {
  return getFilteredPlanFixtures(plan => plan.premium <= maxPremium);
};

/**
 * Default export of all plan fixtures and utility functions
 */
export default {
  planFixtures,
  basicPlanFixture,
  standardPlanFixture,
  premiumPlanFixture,
  familyPlanFixture,
  seniorPlanFixture,
  getPlanFixtureByType,
  getAllPlanFixtures,
  getFilteredPlanFixtures,
  getOpenEnrollmentPlans,
  getPlansForAge,
  getPlansWithinBudget,
};