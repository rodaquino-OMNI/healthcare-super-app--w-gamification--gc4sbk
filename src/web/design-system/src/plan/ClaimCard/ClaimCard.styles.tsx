import styled from 'styled-components';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { tokens } from '@design-system/primitives/tokens';

/**
 * Container for the claim card content
 */
export const ClaimCardContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  border-radius: ${tokens.borderRadius.md};
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
 * Header section of the claim card
 */
export const ClaimCardHeader = styled(Box)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.md};
  border-bottom: 1px solid ${tokens.colors.neutral.gray200};
  background-color: ${tokens.colors.journeys.plan.background};
`;

/**
 * Body section of the claim card
 */
export const ClaimCardBody = styled(Box)`
  display: flex;
  flex-direction: column;
  padding: ${tokens.spacing.md};
  gap: ${tokens.spacing.sm};
`;

/**
 * Footer section of the claim card
 */
export const ClaimCardFooter = styled(Box)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${tokens.spacing.md};
  border-top: 1px solid ${tokens.colors.neutral.gray200};
  background-color: ${tokens.colors.neutral.gray100};
`;

/**
 * Status text with appropriate styling based on claim status
 */
interface ClaimStatusTextProps {
  status: 'pending' | 'approved' | 'denied' | 'inReview' | 'moreInfo' | 'appealed';
}

export const ClaimStatusText = styled(Text)<ClaimStatusTextProps>`
  display: inline-flex;
  align-items: center;
  font-weight: ${tokens.typography.fontWeight.medium};
  padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
  border-radius: ${tokens.borderRadius.sm};
  
  ${({ status }) => {
    switch (status) {
      case 'approved':
        return `
          color: ${tokens.colors.semantic.success};
          background-color: ${tokens.colors.semantic.success}20;
        `;
      case 'denied':
        return `
          color: ${tokens.colors.semantic.error};
          background-color: ${tokens.colors.semantic.error}20;
        `;
      case 'moreInfo':
        return `
          color: ${tokens.colors.semantic.warning};
          background-color: ${tokens.colors.semantic.warning}20;
        `;
      case 'appealed':
        return `
          color: ${tokens.colors.semantic.warning};
          background-color: ${tokens.colors.semantic.warning}20;
        `;
      case 'inReview':
        return `
          color: ${tokens.colors.journeys.plan.accent};
          background-color: ${tokens.colors.journeys.plan.accent}20;
        `;
      case 'pending':
      default:
        return `
          color: ${tokens.colors.journeys.plan.primary};
          background-color: ${tokens.colors.journeys.plan.primary}20;
        `;
    }
  }}
`;