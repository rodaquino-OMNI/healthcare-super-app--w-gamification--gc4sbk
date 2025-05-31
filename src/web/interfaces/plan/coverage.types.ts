/**
 * @file Coverage Types
 * @description Defines TypeScript interfaces for insurance coverage within the Plan journey.
 * These types determine the structure of coverage data displayed in coverage details components
 * and used for coverage calculations.
 */

/**
 * Represents the type of insurance coverage.
 * Used to categorize different types of medical services covered by an insurance plan.
 * 
 * @example
 * // Using CoverageType in a component
 * const coverageType: CoverageType = 'specialist_visit';
 */
export enum CoverageType {
  /** Regular doctor visits and check-ups */
  MEDICAL_VISIT = 'medical_visit',
  /** Visits to specialized medical professionals */
  SPECIALIST_VISIT = 'specialist_visit',
  /** Emergency room and urgent care services */
  EMERGENCY_CARE = 'emergency_care',
  /** Preventive health services like vaccinations and screenings */
  PREVENTIVE_CARE = 'preventive_care',
  /** Coverage for prescription medications */
  PRESCRIPTION_DRUGS = 'prescription_drugs',
  /** Mental health services and counseling */
  MENTAL_HEALTH = 'mental_health',
  /** Physical therapy and rehabilitation services */
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
 * Contains information about coverage limitations, co-payments, and other relevant details.
 * 
 * @example
 * // Creating a Coverage object
 * const coverage: Coverage = {
 *   id: '123',
 *   planId: '456',
 *   type: CoverageType.SPECIALIST_VISIT,
 *   details: 'Covers visits to in-network specialists',
 *   limitations: 'Limited to 10 visits per year',
 *   coPayment: 25
 * };
 */
export interface Coverage {
  /** Unique identifier for the coverage */
  id: string;
  
  /** Reference to the associated insurance plan */
  planId: string;
  
  /** Type of medical service covered */
  type: CoverageType;
  
  /** Detailed description of what is covered */
  details: string;
  
  /** Any limitations or restrictions on the coverage (optional) */
  limitations?: string;
  
  /** Amount the insured must pay out-of-pocket for each service (optional) */
  coPayment?: number;
  
  /** Maximum number of covered services per time period (optional) */
  maxVisits?: number;
  
  /** Percentage of costs covered by insurance after deductible (optional) */
  coveragePercentage?: number;
}