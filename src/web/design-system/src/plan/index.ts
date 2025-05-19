/**
 * Barrel file for Plan journey components
 * Exports all components related to the Plan journey within the design system,
 * providing a centralized access point for Plan-related UI elements.
 * 
 * This simplifies imports for consumers of the design system:
 * import { BenefitCard, ClaimCard, CoverageInfoCard, InsuranceCard } from '@austa/design-system/plan';
 */

// Import components from their respective folders
import { BenefitCard } from './BenefitCard/BenefitCard';
import { ClaimCard } from './ClaimCard/ClaimCard';
import { CoverageInfoCard } from './CoverageInfoCard/CoverageInfoCard';
import { InsuranceCard } from './InsuranceCard/InsuranceCard';

// Re-export all Plan journey components
export {
  BenefitCard,
  ClaimCard,
  CoverageInfoCard,
  InsuranceCard
};