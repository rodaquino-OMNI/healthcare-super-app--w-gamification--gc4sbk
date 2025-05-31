/**
 * @file Benefits Types
 * @description Defines TypeScript interfaces for insurance benefits within the Plan journey.
 * These interfaces establish the data contract for benefit display components and benefit-related logic.
 */

/**
 * Represents the type of a benefit available under an insurance plan.
 * This categorizes benefits for filtering and display purposes.
 */
export type BenefitType = 
  | 'wellness'
  | 'fitness'
  | 'nutrition'
  | 'mental_health'
  | 'telehealth'
  | 'dental'
  | 'vision'
  | 'pharmacy'
  | 'travel'
  | 'other';

/**
 * Represents the usage metrics for a benefit.
 * Tracks how much of the benefit has been used and what remains available.
 */
export interface BenefitUsage {
  /** The amount or number of times the benefit has been used */
  used: number;
  /** The total amount or number of times the benefit is available */
  total: number;
  /** The unit of measurement (e.g., 'visits', 'dollars', 'sessions') */
  unit: string;
  /** The date when the benefit was last used */
  lastUsedDate?: string;
  /** The date when the benefit usage resets */
  resetDate?: string;
}

/**
 * Represents limitations or restrictions on a benefit.
 * Provides detailed information about how and when the benefit can be used.
 */
export interface BenefitLimitations {
  /** Maximum monetary value of the benefit */
  maxValue?: number;
  /** Maximum number of uses allowed */
  maxUses?: number;
  /** Waiting period before the benefit can be used */
  waitingPeriod?: string;
  /** Geographic restrictions on benefit usage */
  geographicRestrictions?: string[];
  /** Network restrictions (in-network, out-of-network) */
  networkRestrictions?: string[];
  /** Additional notes about limitations */
  notes?: string;
}

/**
 * Represents a benefit available under an insurance plan.
 * Benefits are additional services or perks provided by the insurance plan
 * beyond standard medical coverage.
 */
export interface Benefit {
  /** Unique identifier for the benefit */
  id: string;
  
  /** Reference to the associated insurance plan */
  planId: string;
  
  /** The category of the benefit */
  type: BenefitType;
  
  /** Human-readable name of the benefit */
  name: string;
  
  /** Detailed description of what the benefit provides */
  description: string;
  
  /** Detailed limitations and restrictions on the benefit usage */
  limitations?: BenefitLimitations;
  
  /** Current usage metrics for the benefit */
  usage?: BenefitUsage;
  
  /** Whether the benefit requires pre-authorization */
  requiresPreAuth?: boolean;
  
  /** How to access or activate the benefit */
  accessInstructions?: string;
  
  /** URL to additional information about the benefit */
  infoUrl?: string;
  
  /** Date when the benefit becomes available */
  availableFrom?: string;
  
  /** Date when the benefit expires */
  availableTo?: string;
  
  /** Tags for categorizing and filtering benefits */
  tags?: string[];
}

/**
 * Represents a request to view detailed information about a specific benefit.
 */
export interface BenefitDetailsRequest {
  /** The unique identifier of the benefit to retrieve */
  benefitId: string;
  
  /** The associated plan ID */
  planId: string;
}

/**
 * Represents a response containing detailed benefit information.
 */
export interface BenefitDetailsResponse {
  /** The benefit details */
  benefit: Benefit;
  
  /** Related benefits that might be of interest */
  relatedBenefits?: Benefit[];
  
  /** Usage history of the benefit */
  usageHistory?: Array<{
    date: string;
    amount: number;
    description: string;
  }>;
}