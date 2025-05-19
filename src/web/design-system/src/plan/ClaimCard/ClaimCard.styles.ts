import styled from 'styled-components';
import { Text } from '@design-system/primitives/components/Text';
import { Box } from '@design-system/primitives/components/Box';
import { tokens } from '@design-system/primitives/tokens';
import { ClaimStatus } from '@austa/interfaces/plan';

/**
 * The main container for the ClaimCard component.
 * Uses the Plan journey colors and styling.
 */
export const ClaimCardContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  border-radius: ${tokens.spacing.md};
  background-color: ${tokens.colors.neutral.white};
  border-left: 4px solid ${tokens.colors.journeys.plan.primary};
  box-shadow: ${tokens.shadows.sm};
  overflow: hidden;
  transition: box-shadow ${tokens.animation.duration.normal} ${tokens.animation.easing.easeInOut};
  
  &:hover {
    box-shadow: ${tokens.shadows.md};
  }
`;

/**
 * The header section of the ClaimCard component.
 * Contains the claim title and status.
 */
export const ClaimCardHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.md};
  border-bottom: 1px solid ${tokens.colors.neutral.gray200};
  background-color: ${tokens.colors.journeys.plan.background};
`;

/**
 * The body section of the ClaimCard component.
 * Contains the main claim information.
 */
export const ClaimCardBody = styled(Box)`
  padding: ${tokens.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing.sm};
`;

/**
 * The footer section of the ClaimCard component.
 * Contains actions and additional information.
 */
export const ClaimCardFooter = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.md};
  border-top: 1px solid ${tokens.colors.neutral.gray200};
  background-color: ${tokens.colors.neutral.gray100};
`;

/**
 * The text component for displaying the claim status.
 * Uses different colors based on the status for clear visual indication.
 * Includes enhanced accessibility support with proper contrast ratios.
 */
export const ClaimStatusText = styled(Text)<{ status: ClaimStatus }>`
  font-weight: ${tokens.typography.fontWeight.medium};
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  border-radius: ${tokens.spacing.sm};
  display: inline-flex;
  align-items: center;
  
  ${({ status }) => {
    switch (status) {
      case 'approved':
        return `
          color: ${tokens.colors.semantic.success};
          background-color: rgba(0, 200, 83, 0.15);
          /* Enhanced contrast for accessibility */
          font-weight: ${tokens.typography.fontWeight.semibold};
        `;
      case 'denied':
        return `
          color: ${tokens.colors.semantic.error};
          background-color: rgba(255, 59, 48, 0.15);
          /* Enhanced contrast for accessibility */
          font-weight: ${tokens.typography.fontWeight.semibold};
        `;
      case 'pending':
        return `
          color: ${tokens.colors.journeys.plan.primary};
          background-color: rgba(58, 134, 255, 0.15);
          /* Enhanced contrast for accessibility */
          font-weight: ${tokens.typography.fontWeight.semibold};
        `;
      case 'inReview':
        return `
          color: ${tokens.colors.journeys.plan.accent};
          background-color: rgba(0, 87, 231, 0.15);
          /* Enhanced contrast for accessibility */
          font-weight: ${tokens.typography.fontWeight.semibold};
        `;
      case 'moreInfo':
        return `
          color: ${tokens.colors.semantic.warning};
          background-color: rgba(255, 214, 0, 0.15);
          /* Enhanced contrast for accessibility */
          font-weight: ${tokens.typography.fontWeight.semibold};
        `;
      default:
        return '';
    }
  }}
`;