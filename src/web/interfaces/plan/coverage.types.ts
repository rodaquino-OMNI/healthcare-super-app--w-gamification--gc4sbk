/**
 * @file Coverage Types
 * @description Defines TypeScript interfaces for insurance coverage within the Plan journey.
 * These types determine the structure of coverage data displayed in coverage details components
 * and used for coverage calculations.
 */

/**
 * Represents the type of insurance coverage.
 * Used to categorize different types of medical services covered by an insurance plan.
 */
export enum CoverageType {
  /** Regular doctor visits and consultations */
  MEDICAL_VISIT = 'medical_visit',
  
  /** Visits to specialized medical professionals */
  SPECIALIST_VISIT = 'specialist_visit',
  
  /** Emergency room and urgent care services */
  EMERGENCY_CARE = 'emergency_care',
  
  /** Preventive health services like check-ups and screenings */
  PREVENTIVE_CARE = 'preventive_care',
  
  /** Prescription medication coverage */
  PRESCRIPTION_DRUGS = 'prescription_drugs',
  
  /** Mental health services and therapy */
  MENTAL_HEALTH = 'mental_health',
  
  /** Physical therapy and other rehabilitation services */
  REHABILITATION = 'rehabilitation',
  
  /** Medical equipment for home use */
  DURABLE_MEDICAL_EQUIPMENT = 'durable_medical_equipment',
  
  /** Laboratory tests and diagnostics */
  LAB_TESTS = 'lab_tests',
  
  /** X-rays, MRIs, and other imaging services */
  IMAGING = 'imaging',
  
  /** Any other coverage types not specifically categorized */
  OTHER = 'other'
}

/**
 * Represents insurance coverage details for a specific type of medical service.
 * This interface defines the structure of coverage information displayed in the Plan journey.
 */
export interface Coverage {
  /** Unique identifier for the coverage */
  id: string;
  
  /** Reference to the associated insurance plan */
  planId: string;
  
  /** Type of coverage (medical visit, specialist, etc.) */
  type: CoverageType;
  
  /** Detailed description of what is covered */
  details: string;
  
  /** Optional limitations or exclusions for this coverage */
  limitations?: string;
  
  /** Optional co-payment amount required for this coverage (in currency units) */
  coPayment?: number;
  
  /** Optional maximum coverage amount (in currency units) */
  maxCoverage?: number;
  
  /** Optional deductible amount that must be paid before coverage applies */
  deductible?: number;
  
  /** Optional percentage of costs covered after deductible (0-100) */
  coveragePercentage?: number;
}