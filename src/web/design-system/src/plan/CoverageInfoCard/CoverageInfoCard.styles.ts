/**
 * Styled components for the CoverageInfoCard component in the Plan journey.
 * These styles apply theming and styling based on the Plan journey's visual language.
 */
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { colors, spacing, shadows, animation, breakpoints } from '@design-system/primitives/tokens';

/**
 * Main container for the CoverageInfoCard component.
 * Applies Plan journey-specific styling with proper elevation and interactive states.
 */
export const CoverageInfoCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${colors.journeys.plan.background};
  border-radius: ${themeGet('borderRadius.lg')};
  box-shadow: ${themeGet('shadows.md')};
  overflow: hidden;
  margin-bottom: ${spacing.md};
  border-left: 4px solid ${colors.journeys.plan.primary};
  width: 100%;
  transition: transform ${animation.duration.normal} ${animation.easing.easeOut}, 
              box-shadow ${animation.duration.normal} ${animation.easing.easeOut};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${themeGet('shadows.lg')};
  }

  @media (min-width: ${breakpoints.md}) {
    flex-direction: column;
  }
`;

/**
 * Header section of the CoverageInfoCard.
 * Contains the title and any additional header elements.
 */
export const CoverageInfoCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.md};
  border-bottom: 1px solid ${colors.neutral.gray300};
  background-color: ${colors.journeys.plan.background};
`;

/**
 * Title element for the CoverageInfoCard.
 * Uses Plan journey's primary color for emphasis.
 */
export const CoverageInfoCardTitle = styled.h3`
  font-family: ${themeGet('typography.fontFamily.heading')};
  font-size: ${themeGet('typography.fontSize.lg')};
  font-weight: ${themeGet('typography.fontWeight.bold')};
  color: ${colors.journeys.plan.primary};
  margin: 0;
  padding: 0;
`;

/**
 * Content wrapper for the CoverageInfoCard.
 * Contains all the coverage details, limitations, and other information.
 */
export const CoverageInfoCardContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${spacing.md};
  gap: ${spacing.sm};
`;

/**
 * Individual item row in the CoverageInfoCard.
 * Displays a label-value pair with responsive layout.
 */
export const CoverageInfoCardItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.sm} 0;
  border-bottom: 1px solid ${colors.neutral.gray200};
  
  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${spacing.xs};
  }
`;

/**
 * Label element for items in the CoverageInfoCard.
 * Uses neutral gray for secondary text importance.
 */
export const CoverageInfoCardLabel = styled.span`
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.sm')};
  color: ${colors.neutral.gray700};
  font-weight: ${themeGet('typography.fontWeight.medium')};
`;

/**
 * Value element for items in the CoverageInfoCard.
 * Supports different states through class modifiers.
 */
export const CoverageInfoCardValue = styled.span`
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.md')};
  color: ${colors.neutral.gray900};
  font-weight: ${themeGet('typography.fontWeight.bold')};
  transition: color ${animation.duration.fast} ${animation.easing.easeOut};
  
  &.highlighted {
    color: ${colors.journeys.plan.secondary};
  }
  
  &.covered {
    color: ${colors.semantic.success};
  }
  
  &.not-covered {
    color: ${colors.semantic.error};
  }
  
  &.partially-covered {
    color: ${colors.semantic.warning};
  }
`;

/**
 * Badge component for displaying co-payment information.
 * Uses semantic colors to indicate coverage level.
 */
export const CoverageInfoCardBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${themeGet('borderRadius.sm')};
  font-size: ${themeGet('typography.fontSize.xs')};
  font-weight: ${themeGet('typography.fontWeight.medium')};
  background-color: ${colors.journeys.plan.primary_10};
  color: ${colors.journeys.plan.primary};
  
  &.full {
    background-color: ${colors.semantic.success_token._10};
    color: ${colors.semantic.success};
  }
  
  &.partial {
    background-color: ${colors.semantic.warning_token._10};
    color: ${colors.semantic.warning};
  }
  
  &.none {
    background-color: ${colors.semantic.error_token._10};
    color: ${colors.semantic.error};
  }
`;