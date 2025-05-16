/**
 * @file Plan Component Types
 * @description Defines TypeScript interfaces for Plan journey-specific UI components in the AUSTA SuperApp.
 * These interfaces provide strongly-typed props that integrate with Plan journey data models
 * while ensuring consistent component usage across the application.
 */

import { Benefit, Claim, ClaimStatus, ClaimType, Coverage, CoverageType, Plan } from '../plan';

/**
 * Base props interface for all Plan journey components
 */
export interface PlanComponentBaseProps {
  /** Optional custom class name for styling */
  className?: string;
  /** Optional custom style object */
  style?: React.CSSProperties;
  /** Optional theme variant (default is 'plan') */
  themeVariant?: 'plan' | 'default';
}

/**
 * Props for the BenefitCard component
 */
export interface BenefitCardProps extends PlanComponentBaseProps {
  /** The benefit to display */
  benefit: Benefit;
  /** Optional flag to show detailed information */
  showDetails?: boolean;
  /** Optional flag to show usage information if available */
  showUsage?: boolean;
  /** Optional callback when the card is clicked */
  onPress?: () => void;
  /** Optional callback when the details button is clicked */
  onDetailsPress?: () => void;
}

/**
 * Props for the ClaimCard component
 */
export interface ClaimCardProps extends PlanComponentBaseProps {
  /** The claim to display */
  claim: Claim;
  /** Optional flag to show document list */
  showDocuments?: boolean;
  /** Optional callback when the card is clicked */
  onPress?: () => void;
  /** Optional callback when the details button is clicked */
  onDetailsPress?: () => void;
  /** Optional callback when the status is clicked */
  onStatusPress?: (status: ClaimStatus) => void;
}

/**
 * Props for the CoverageInfoCard component
 */
export interface CoverageInfoCardProps extends PlanComponentBaseProps {
  /** The coverage to display */
  coverage: Coverage;
  /** Optional flag to show limitations */
  showLimitations?: boolean;
  /** Optional flag to show co-payment information if available */
  showCoPayment?: boolean;
  /** Optional callback when the card is clicked */
  onPress?: () => void;
  /** Optional callback when the details button is clicked */
  onDetailsPress?: () => void;
  /** Optional callback when the coverage type is clicked */
  onCoverageTypePress?: (type: CoverageType) => void;
}

/**
 * Props for the InsuranceCard component
 */
export interface InsuranceCardProps extends PlanComponentBaseProps {
  /** The plan to display */
  plan: Plan;
  /** Optional flag to show digital card format */
  isDigitalCard?: boolean;
  /** Optional flag to show validity dates */
  showValidity?: boolean;
  /** Optional callback when the card is clicked */
  onPress?: () => void;
  /** Optional callback to share the card */
  onShare?: () => void;
  /** Optional callback to download the card */
  onDownload?: () => void;
}

/**
 * Props for the ClaimSubmissionForm component
 */
export interface ClaimSubmissionFormProps extends PlanComponentBaseProps {
  /** The plan ID to associate with the claim */
  planId: string;
  /** Optional initial values for the form */
  initialValues?: {
    type?: ClaimType;
    amount?: number;
    description?: string;
  };
  /** Optional callback when the form is submitted */
  onSubmit?: (values: {
    type: ClaimType;
    amount: number;
    description: string;
    documents: File[];
  }) => void;
  /** Optional callback when the form is cancelled */
  onCancel?: () => void;
  /** Optional flag to show loading state */
  isLoading?: boolean;
  /** Optional error message to display */
  error?: string;
}

/**
 * Props for the CostSimulatorWidget component
 */
export interface CostSimulatorWidgetProps extends PlanComponentBaseProps {
  /** The plan to use for cost simulation */
  plan: Plan;
  /** Optional callback when a simulation is calculated */
  onCalculate?: (values: {
    procedureType: string;
    providerId?: string;
    estimatedCost: number;
    outOfPocketCost: number;
    coverageAmount: number;
  }) => void;
  /** Optional list of procedure types to select from */
  procedureTypes?: string[];
  /** Optional list of provider IDs to select from */
  providerIds?: string[];
  /** Optional flag to show loading state */
  isLoading?: boolean;
}

/**
 * Props for the BenefitsList component
 */
export interface BenefitsListProps extends PlanComponentBaseProps {
  /** The benefits to display */
  benefits: Benefit[];
  /** Optional callback when a benefit is selected */
  onBenefitSelect?: (benefit: Benefit) => void;
  /** Optional flag to show loading state */
  isLoading?: boolean;
  /** Optional error message to display */
  error?: string;
  /** Optional empty state message */
  emptyStateMessage?: string;
}

/**
 * Props for the ClaimsList component
 */
export interface ClaimsListProps extends PlanComponentBaseProps {
  /** The claims to display */
  claims: Claim[];
  /** Optional callback when a claim is selected */
  onClaimSelect?: (claim: Claim) => void;
  /** Optional filters for claim status */
  statusFilter?: ClaimStatus[];
  /** Optional filters for claim type */
  typeFilter?: ClaimType[];
  /** Optional callback when filters are changed */
  onFilterChange?: (filters: { status?: ClaimStatus[]; type?: ClaimType[] }) => void;
  /** Optional flag to show loading state */
  isLoading?: boolean;
  /** Optional error message to display */
  error?: string;
  /** Optional empty state message */
  emptyStateMessage?: string;
}