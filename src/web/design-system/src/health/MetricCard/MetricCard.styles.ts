/**
 * Styled components for the MetricCard component in the Health journey.
 * 
 * This file defines all the styled components used by the MetricCard component,
 * including containers, typography elements, and visual indicators. It supports
 * journey-specific theming and responsive design across platforms.
 */

import styled, { css } from 'styled-components';
import { Box, Text } from '@design-system/primitives';
import { Card } from '../../components/Card/Card';
import { ThemeProps, JourneyTheme, StyleProps } from '@austa/interfaces/themes';

/**
 * Interface for the MetricCardContainer props
 */
interface MetricCardContainerProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * The main container for the MetricCard component, extending the Card component.
 * Applies journey-specific styling with proper spacing and visual treatment.
 */
export const MetricCardContainer = styled(Card)<MetricCardContainerProps>`
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  border-left: 4px solid ${props => {
    const journey = props.journey || 'health';
    return props.theme.colors.journeys[journey].primary;
  }};
  background-color: ${props => {
    const journey = props.journey || 'health';
    return props.theme.colors.journeys[journey].background;
  }};
  transition: transform ${props => props.theme.animation.duration.fast} ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    padding: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

/**
 * Interface for the MetricIconContainer props
 */
interface MetricIconContainerProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Container for the metric icon with appropriate styling.
 * Uses journey-specific primary color for the background.
 */
export const MetricIconContainer = styled(Box)<MetricIconContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => {
    const journey = props.journey || 'health';
    return props.theme.colors.journeys[journey].primary;
  }};
  color: ${props => props.theme.colors.neutral.white};
  margin-right: ${props => props.theme.spacing.sm};
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    width: 32px;
    height: 32px;
  }
  
  /* Accessibility enhancement for focus state */
  &:focus-within {
    outline: 2px solid ${props => {
      const journey = props.journey || 'health';
      return props.theme.colors.journeys[journey].secondary;
    }};
    outline-offset: 2px;
  }
`;

/**
 * Interface for the MetricTitle props
 */
interface MetricTitleProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Styled text component for the metric title.
 */
export const MetricTitle = styled(Text)<MetricTitleProps>`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.neutral.gray800};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  /* Journey-specific styling */
  ${props => {
    const journey = props.journey || 'health';
    if (journey === 'health') {
      return css`
        color: ${props.theme.colors.journeys.health.text};
      `;
    } else if (journey === 'care') {
      return css`
        color: ${props.theme.colors.journeys.care.text};
      `;
    } else if (journey === 'plan') {
      return css`
        color: ${props.theme.colors.journeys.plan.text};
      `;
    }
    return '';
  }}
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`;

/**
 * Interface for the MetricValue props
 */
interface MetricValueProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Styled text component for the metric value.
 */
export const MetricValue = styled(Text)<MetricValueProps>`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.neutral.gray900};
  margin-right: ${props => props.theme.spacing.xs};
  display: inline-flex;
  align-items: baseline;
  
  /* Journey-specific styling */
  ${props => {
    const journey = props.journey || 'health';
    if (journey === 'health') {
      return css`
        color: ${props.theme.colors.journeys.health.primary};
      `;
    } else if (journey === 'care') {
      return css`
        color: ${props.theme.colors.journeys.care.primary};
      `;
    } else if (journey === 'plan') {
      return css`
        color: ${props.theme.colors.journeys.plan.primary};
      `;
    }
    return '';
  }}
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`;

/**
 * Interface for the MetricUnit props
 */
interface MetricUnitProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Styled text component for the metric unit.
 */
export const MetricUnit = styled(Text)<MetricUnitProps>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.regular};
  color: ${props => props.theme.colors.neutral.gray600};
  margin-left: ${props => props.theme.spacing.xs};
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

/**
 * Interface for the TrendIndicatorContainer props
 */
interface TrendIndicatorContainerProps extends StyleProps {
  /**
   * Trend direction: up, down, or stable
   */
  trend?: 'up' | 'down' | 'stable';
  
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Styled container for the trend indicator with conditional styling based on trend direction.
 */
export const TrendIndicatorContainer = styled(Box)<TrendIndicatorContainerProps>`
  display: flex;
  align-items: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.xs};
  
  /* Journey-specific trend colors */
  color: ${props => {
    const journey = props.journey || 'health';
    
    if (props.trend === 'up') {
      return journey === 'health' 
        ? props.theme.colors.semantic.success
        : journey === 'care'
          ? props.theme.colors.contextual.care.success
          : props.theme.colors.contextual.plan.success;
    } else if (props.trend === 'down') {
      return journey === 'health'
        ? props.theme.colors.semantic.error
        : journey === 'care'
          ? props.theme.colors.contextual.care.error
          : props.theme.colors.contextual.plan.error;
    } else {
      return props.theme.colors.neutral.gray600;
    }
  }};
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

/**
 * Interface for the AchievementContainer props
 */
interface AchievementContainerProps extends StyleProps {
  /**
   * Optional journey context for theming
   */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Styled container for achievement badges displayed on the metric card.
 */
export const AchievementContainer = styled(Box)<AchievementContainerProps>`
  display: flex;
  align-items: center;
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs};
  background-color: ${props => {
    const journey = props.journey || 'health';
    return `${props.theme.colors.journeys[journey].primary}10`; // 10% opacity
  }};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  /* Responsive styling for smaller screens */
  @media ${props => props.theme.breakpoints.down('sm')} {
    margin-top: ${props => props.theme.spacing.xs};
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  }
`;