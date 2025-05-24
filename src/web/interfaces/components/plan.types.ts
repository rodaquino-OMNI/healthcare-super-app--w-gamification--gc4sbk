/**
 * @file Plan Component Types
 * @description Defines TypeScript interfaces for Plan journey-specific UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props that integrate with Plan journey data models.
 */

// Import types from the shared interfaces package
import { Benefit, Claim, ClaimStatus, Coverage, Plan } from '@austa/interfaces/plan';

/**
 * Common props shared across all Plan journey components
 */
export interface PlanComponentBaseProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testID?: string;
  
  /**
   * Optional theme override for the component
   */
  themeOverride?: Record<string, any>;
}

/**
 * Props for the BenefitCard component that displays a single benefit.
 */
export interface BenefitCardProps extends PlanComponentBaseProps {
  /**
   * The benefit data to display
   */
  benefit: Benefit;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the usage information
   * @default true
   */
  showUsage?: boolean;
  
  /**
   * Whether to show the limitations information
   * @default true
   */
  showLimitations?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the benefit is activated
   */
  onActivate?: () => void;
  
  /**
   * Whether the benefit is currently active
   * @default false
   */
  isActive?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
  

}

/**
 * Props for the ClaimCard component that displays a single claim.
 */
export interface ClaimCardProps extends PlanComponentBaseProps {
  /**
   * The claim data to display
   */
  claim: Claim;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the documents attached to the claim
   * @default false
   */
  showDocuments?: boolean;
  
  /**
   * Custom status labels for different claim statuses
   */
  statusLabels?: Partial<Record<ClaimStatus, string>>;
  
  /**
   * Custom status colors for different claim statuses
   */
  statusColors?: Partial<Record<ClaimStatus, string>>;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the view details button is clicked
   */
  onViewDetails?: () => void;
  
  /**
   * Optional handler for when the add document button is clicked
   */
  onAddDocument?: () => void;
  
  /**
   * Optional handler for when a document is clicked
   */
  onDocumentClick?: (documentId: string) => void;
  
  /**
   * Whether to show the claim amount
   * @default true
   */
  showAmount?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'list';
  

}

/**
 * Props for the CoverageInfoCard component that displays coverage details.
 */
export interface CoverageInfoCardProps extends PlanComponentBaseProps {
  /**
   * The coverage data to display
   */
  coverage: Coverage;
  
  /**
   * Optional custom title to override the default
   */
  title?: string;
  
  /**
   * Whether to show the co-payment information
   * @default true
   */
  showCoPayment?: boolean;
  
  /**
   * Whether to show the limitations information
   * @default true
   */
  showLimitations?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the info button is clicked
   */
  onInfoClick?: () => void;
  
  /**
   * Optional handler for when the simulate cost button is clicked
   */
  onSimulateCost?: () => void;
  
  /**
   * Whether to show the simulate cost button
   * @default false
   */
  showSimulateCost?: boolean;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed' | 'comparison';
  

}

/**
 * Props for the InsuranceCard component that displays insurance plan information.
 */
export interface InsuranceCardProps extends PlanComponentBaseProps {
  /**
   * The plan data to display
   */
  plan: Plan;
  
  /**
   * Whether to show the digital card view with QR code
   * @default false
   */
  showDigitalCard?: boolean;
  
  /**
   * Whether to show the plan validity dates
   * @default true
   */
  showValidity?: boolean;
  
  /**
   * Whether to show the plan type (HMO, PPO, etc.)
   * @default true
   */
  showPlanType?: boolean;
  
  /**
   * Optional handler for when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Optional handler for when the share button is clicked
   */
  onShare?: () => void;
  
  /**
   * Optional handler for when the download button is clicked
   */
  onDownload?: () => void;
  
  /**
   * Optional handler for when the view benefits button is clicked
   */
  onViewBenefits?: () => void;
  
  /**
   * Optional handler for when the view coverage button is clicked
   */
  onViewCoverage?: () => void;
  
  /**
   * Optional theme variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'digital' | 'compact' | 'detailed';
  
  /**
   * Optional QR code data for digital card view
   */
  qrCodeData?: string;
  

}