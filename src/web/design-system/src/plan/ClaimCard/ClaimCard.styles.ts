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
 * Uses different colors based on the status with improved accessibility.
 * 
 * @param status - The current status of the claim from ClaimStatus type
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
      case 'partially_approved':
        return `
          color: ${tokens.colors.semantic.success};
          background-color: ${tokens.colors.semantic.success_token._10};
        `;
      case 'denied':
        return `
          color: ${tokens.colors.semantic.error};
          background-color: ${tokens.colors.semantic.error_token._10};
        `;
      case 'pending':
        return `
          color: ${tokens.colors.journeys.plan.primary};
          background-color: ${tokens.colors.journeys.plan.primary_token._10};
        `;
      case 'in_review':
        return `
          color: ${tokens.colors.journeys.plan.accent};
          background-color: ${tokens.colors.journeys.plan.accent_token._10};
        `;
      case 'additional_info_required':
      case 'appealed':
        return `
          color: ${tokens.colors.semantic.warning};
          background-color: ${tokens.colors.semantic.warning_token._10};
        `;
      default:
        return '';
    }
  }}
`;