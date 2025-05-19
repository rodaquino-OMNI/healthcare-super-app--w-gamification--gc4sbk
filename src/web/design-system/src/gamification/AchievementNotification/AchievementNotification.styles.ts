import { Box, Text } from '@design-system/primitives';
import { styled } from 'styled-components';
import { useJourneyTheme } from '@austa/journey-context';
import { breakpoints, colors, shadows, spacing, zIndex } from '@design-system/primitives/src/tokens';

/**
 * Container for achievement notification modal
 * Uses Box primitive with fixed positioning and journey-specific theming
 */
export const NotificationContainer = styled(Box).attrs(props => {
  // Get journey-specific theme values
  const { journey } = props.theme || {};
  
  return {
    position: 'fixed',
    p: 'md',
    textAlign: 'center',
    borderRadius: 'md',
    boxShadow: 'lg',
    // Apply journey-specific background color if available
    bg: journey ? `${journey}.background` : 'white',
  };
})`
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: ${zIndex.modal};
  
  /* Responsive sizing using breakpoint tokens */
  @media (max-width: ${breakpoints.sm}) {
    width: 90%;
    max-width: 320px;
  }
  
  @media (min-width: ${breakpoints.md}) {
    width: 400px;
  }
`;

/**
 * Content container for achievement notification
 * Uses Box primitive with flex layout for content organization
 */
export const NotificationContent = styled(Box).attrs({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})`
  /* Additional styling can be added here if needed */
`;

/**
 * Title component for achievement notification
 * Uses Text primitive with heading styling and journey-specific text color
 */
export const NotificationTitle = styled(Text).attrs(props => {
  // Get journey-specific theme values
  const { journey } = props.theme || {};
  
  return {
    as: 'h2',
    fontSize: ['md', 'lg'], // Responsive font size for mobile and desktop
    fontWeight: 'bold',
    mb: 'sm',
    // Apply journey-specific text color if available
    color: journey ? `${journey}.text.primary` : 'text.primary',
  };
})`
  /* Additional styling can be added here if needed */
`;

/**
 * Message component for achievement notification
 * Uses Text primitive with paragraph styling and journey-specific text color
 */
export const NotificationMessage = styled(Text).attrs(props => {
  // Get journey-specific theme values
  const { journey } = props.theme || {};
  
  return {
    as: 'p',
    fontSize: ['sm', 'md'], // Responsive font size for mobile and desktop
    // Apply journey-specific text color if available
    color: journey ? `${journey}.text.secondary` : 'text.secondary',
  };
})`
  /* Additional styling can be added here if needed */
`;

/**
 * Custom hook to create a journey-themed notification component
 * @returns Styled components with journey-specific theming applied
 */
export const useNotificationTheme = () => {
  // Get the current journey theme from context
  const journeyTheme = useJourneyTheme();
  
  return {
    Container: NotificationContainer,
    Content: NotificationContent,
    Title: NotificationTitle,
    Message: NotificationMessage,
    // Pass the journey theme for use in the component
    theme: journeyTheme,
  };
};