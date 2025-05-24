/**
 * AchievementNotification.styles.ts
 * 
 * Defines styled components for the AchievementNotification UI using primitives
 * from @design-system/primitives. Provides journey-specific theming and responsive
 * layout with proper accessibility support.
 * 
 * This file centralizes all styling concerns for the achievement notification modal
 * that appears when users unlock achievements. It uses the Box and Text primitives
 * from @design-system/primitives and applies journey-specific theming through the
 * useJourney hook from @austa/journey-context.
 */

import styled from 'styled-components';
import { Box, Text } from '@design-system/primitives';
import { tokens } from '@design-system/primitives';
import { useJourney } from '@austa/journey-context';

/**
 * Hook to get journey-specific theme values for the achievement notification
 * @returns Object with theme values for the current journey
 */
export const useAchievementNotificationTheme = () => {
  const { journeyId, getJourneyTheme } = useJourney();
  
  // Get journey theme colors
  const journeyTheme = getJourneyTheme();
  
  // Default colors
  const defaultColors = {
    background: 'white',
    border: tokens.colors.neutral.gray200,
    title: tokens.colors.neutral.gray900,
    message: tokens.colors.neutral.gray600,
    shadow: tokens.shadows.lg,
  };
  
  // Journey-specific colors
  const journeyColors = {
    health: {
      background: 'white',
      border: tokens.colors.journeys.health.primary,
      title: tokens.colors.journeys.health.primary,
      message: tokens.colors.journeys.health.text,
      shadow: tokens.shadows.lg,
    },
    care: {
      background: 'white',
      border: tokens.colors.journeys.care.primary,
      title: tokens.colors.journeys.care.primary,
      message: tokens.colors.journeys.care.text,
      shadow: tokens.shadows.lg,
    },
    plan: {
      background: 'white',
      border: tokens.colors.journeys.plan.primary,
      title: tokens.colors.journeys.plan.primary,
      message: tokens.colors.journeys.plan.text,
      shadow: tokens.shadows.lg,
    },
  };
  
  // Return journey-specific colors or default colors
  return journeyColors[journeyId] || defaultColors;
};

/**
 * Container for the achievement notification modal
 * Uses Box primitive with fixed positioning and proper z-index from design tokens
 */
export const NotificationContainer = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => props.backgroundColor || 'white'};
  border-radius: ${tokens.spacing.md};
  padding: ${tokens.spacing.lg};
  box-shadow: ${tokens.shadows.lg};
  z-index: ${tokens.colors.zIndices?.modal || 1000};
  text-align: center;
  
  /* Responsive sizing using breakpoint tokens */
  width: 90%;
  max-width: 320px;
  
  ${tokens.mediaQueries.md} {
    max-width: 400px;
  }
  
  /* Add subtle border for better visibility */
  border: 1px solid ${props => props.borderColor || tokens.colors.neutral.gray200};
`;

/**
 * Content wrapper for the notification
 * Uses Box primitive with flex layout for content organization
 */
export const NotificationContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${tokens.spacing.md};
  
  /* Add animation for better user experience */
  animation: fadeIn ${tokens.animation.duration.normal} ${tokens.animation.easing.easeOut};
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * Title component for the notification
 * Uses Text primitive with proper typography tokens
 */
export const NotificationTitle = styled(Text).attrs({
  as: 'h2',
  fontWeight: 'bold',
  fontSize: 'xl',
})`
  color: ${props => props.color || tokens.colors.neutral.gray900};
  margin-bottom: ${tokens.spacing.sm};
  
  /* Responsive font size */
  ${tokens.mediaQueries.sm} {
    font-size: ${tokens.typography.fontSize.xl};
  }
  
  ${tokens.mediaQueries.md} {
    font-size: ${tokens.typography.fontSize.xxl};
  }
`;

/**
 * Message component for the notification
 * Uses Text primitive with proper typography tokens
 */
export const NotificationMessage = styled(Text).attrs({
  as: 'p',
  fontSize: 'md',
})`
  color: ${props => props.color || tokens.colors.neutral.gray600};
  line-height: ${tokens.typography.lineHeight.relaxed};
  
  /* Responsive font size */
  ${tokens.mediaQueries.md} {
    font-size: ${tokens.typography.fontSize.lg};
  }
`;