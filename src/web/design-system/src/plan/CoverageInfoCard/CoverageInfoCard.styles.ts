import styled from 'styled-components';
import { themeGet } from '@styled-system/theme-get';
import { breakpoints, colors, spacing, animation } from '@design-system/primitives/tokens';
import { Theme } from '@austa/interfaces/themes';

/**
 * Main container for the CoverageInfoCard component.
 * Applies base styling and handles theming based on the Plan journey.
 */
export const Container = styled.div<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: ${themeGet('borderRadius.md')};
  border: ${themeGet('components.coverageInfoCard.border')};
  border-top: ${themeGet('components.coverageInfoCard.borderTop')};
  background-color: ${themeGet('components.coverageInfoCard.background')};
  box-shadow: ${themeGet('components.coverageInfoCard.shadow')};
  overflow: hidden;
  transition: box-shadow ${themeGet('animation.duration.fast')} ${themeGet('animation.easing.easeInOut')};
  
  &:hover {
    box-shadow: ${themeGet('shadows.md')};
  }
  
  @media (max-width: ${breakpoints.md}) {
    border-radius: ${themeGet('borderRadius.sm')};
  }
`;

/**
 * Header section of the CoverageInfoCard.
 * Contains the title and any additional header content.
 */
export const Header = styled.div<{ theme: Theme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${themeGet('spacing.md')} ${themeGet('spacing.md')};
  border-bottom: 1px solid ${themeGet('colors.neutral.gray200')};
  background-color: ${themeGet('colors.neutral.white')};
  
  @media (max-width: ${breakpoints.sm}) {
    padding: ${themeGet('spacing.sm')} ${themeGet('spacing.sm')};
  }
`;

/**
 * Title component for the CoverageInfoCard.
 * Displays the coverage type with proper typography.
 */
export const Title = styled.h3<{ theme: Theme }>`
  margin: 0;
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.md')};
  font-weight: ${themeGet('typography.fontWeight.bold')};
  color: ${themeGet('colors.text')};
  line-height: ${themeGet('typography.lineHeight.base')};
  
  @media (max-width: ${breakpoints.sm}) {
    font-size: ${themeGet('typography.fontSize.sm')};
  }
`;

/**
 * Wrapper for the content section of the CoverageInfoCard.
 * Contains the coverage details and limitations.
 */
export const ContentWrapper = styled.div<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  padding: ${themeGet('spacing.md')};
  background-color: ${themeGet('colors.neutral.white')};
  
  @media (max-width: ${breakpoints.sm}) {
    padding: ${themeGet('spacing.sm')};
  }
`;

/**
 * Row component for individual coverage items.
 * Displays a label and value pair.
 */
export const ItemRow = styled.div<{ theme: Theme }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${themeGet('spacing.sm')};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: ${breakpoints.sm}) {
    flex-direction: column;
    margin-bottom: ${themeGet('spacing.xs')};
  }
`;

/**
 * Label component for coverage item rows.
 * Displays the property name with proper styling.
 */
export const Label = styled.span<{ theme: Theme }>`
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.sm')};
  font-weight: ${themeGet('typography.fontWeight.medium')};
  color: ${themeGet('colors.neutral.gray700')};
  margin-right: ${themeGet('spacing.md')};
  flex: 1;
  
  @media (max-width: ${breakpoints.sm}) {
    margin-right: 0;
    margin-bottom: ${themeGet('spacing.xs')};
  }
`;

/**
 * Value component for coverage item rows.
 * Displays the property value with proper styling.
 */
export const Value = styled.span<{ theme: Theme }>`
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.sm')};
  font-weight: ${themeGet('typography.fontWeight.regular')};
  color: ${themeGet('colors.text')};
  text-align: right;
  flex: 2;
  
  @media (max-width: ${breakpoints.sm}) {
    text-align: left;
    width: 100%;
  }
`;

/**
 * Badge component for displaying co-payment information.
 * Uses the Plan journey's highlight colors.
 */
export const CoPaymentBadge = styled.div<{ theme: Theme; isFullCoverage: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${themeGet('spacing.xs')} ${themeGet('spacing.sm')};
  border-radius: ${themeGet('borderRadius.sm')};
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.xs')};
  font-weight: ${themeGet('typography.fontWeight.medium')};
  background-color: ${props => 
    props.isFullCoverage
      ? themeGet('colors.semantic.success')(props)
      : themeGet('components.coverageInfoCard.highlightBackground')(props)
  };
  color: ${props => 
    props.isFullCoverage
      ? themeGet('colors.neutral.white')(props)
      : themeGet('components.coverageInfoCard.highlightText')(props)
  };
  transition: all ${themeGet('animation.duration.fast')} ${themeGet('animation.easing.easeInOut')};
  
  &:hover {
    transform: translateY(-1px);
  }
  
  @media (max-width: ${breakpoints.sm}) {
    font-size: ${themeGet('typography.fontSize.xs')};
    padding: ${themeGet('spacing.xs')} ${themeGet('spacing.xs')};
  }
`;

/**
 * Section for displaying coverage limitations.
 * Uses a subtle background to differentiate from regular content.
 */
export const LimitationsSection = styled.div<{ theme: Theme }>`
  margin-top: ${themeGet('spacing.md')};
  padding: ${themeGet('spacing.sm')};
  background-color: ${themeGet('colors.neutral.gray100')};
  border-radius: ${themeGet('borderRadius.sm')};
  
  @media (max-width: ${breakpoints.sm}) {
    margin-top: ${themeGet('spacing.sm')};
    padding: ${themeGet('spacing.xs')};
  }
`;

/**
 * Title for the limitations section.
 */
export const LimitationsTitle = styled.h4<{ theme: Theme }>`
  margin: 0 0 ${themeGet('spacing.xs')} 0;
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.sm')};
  font-weight: ${themeGet('typography.fontWeight.medium')};
  color: ${themeGet('colors.neutral.gray800')};
`;

/**
 * Text for displaying limitation details.
 */
export const LimitationsText = styled.p<{ theme: Theme }>`
  margin: 0;
  font-family: ${themeGet('typography.fontFamily.base')};
  font-size: ${themeGet('typography.fontSize.xs')};
  font-weight: ${themeGet('typography.fontWeight.regular')};
  color: ${themeGet('colors.neutral.gray700')};
  line-height: ${themeGet('typography.lineHeight.relaxed')};
`;