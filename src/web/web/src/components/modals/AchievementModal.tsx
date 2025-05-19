import React, { useRef, useEffect } from 'react';
import { Modal } from '@austa/design-system/components/Modal';
import { AchievementBadge } from '@austa/design-system/gamification/AchievementBadge';
import { Button } from '@austa/design-system/components/Button';
import { Stack } from '@design-system/primitives/components/Stack';
import { Text } from '@design-system/primitives/components/Text';
import { Box } from '@design-system/primitives/components/Box';
import { Achievement } from '@austa/interfaces/gamification';
import { useJourneyContext } from '@austa/journey-context';
import { useGamification } from '../../hooks/useGamification';
import { useAuth } from '../../hooks/useAuth';

/**
 * Props interface for the AchievementModal component
 */
interface AchievementModalProps {
  /**
   * The ID of the achievement to display.
   */
  achievementId: string;
  /**
   * A boolean to control the visibility of the modal.
   */
  visible: boolean;
  /**
   * A function to call when the modal is closed.
   */
  onClose: () => void;
}

/**
 * Displays a modal with details about a specific achievement.
 * Supports journey-specific theming and enhanced accessibility.
 */
export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievementId,
  visible,
  onClose,
}) => {
  // Get the current user ID from auth context
  const { user } = useAuth();
  const userId = user?.id;

  // Get the current journey context for theming
  const { currentJourney } = useJourneyContext();

  // Create refs for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Retrieve the achievement data using the `useGamification` hook.
  const { data, loading, error } = useGamification(userId);

  // Find the achievement by ID
  const achievement: Achievement | undefined = data?.gameProfile?.achievements?.find(
    (a) => a.id === achievementId
  );

  // Set focus to the close button when the modal opens
  useEffect(() => {
    if (visible && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (loading) {
    return (
      <Modal 
        visible={visible} 
        onClose={onClose} 
        title="Loading Achievement"
        aria-labelledby="loading-achievement-title"
        aria-describedby="loading-achievement-description"
        journey={currentJourney}
      >
        <Box ref={modalContentRef} tabIndex={-1}>
          <Text id="loading-achievement-title" variant="heading3">Loading Achievement</Text>
          <Text id="loading-achievement-description">Loading achievement details...</Text>
          <Button ref={closeButtonRef} onClick={onClose} variant="secondary" mt="md">
            Close
          </Button>
        </Box>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal 
        visible={visible} 
        onClose={onClose} 
        title="Error"
        aria-labelledby="error-title"
        aria-describedby="error-description"
        journey={currentJourney}
      >
        <Box ref={modalContentRef} tabIndex={-1}>
          <Text id="error-title" variant="heading3" color="error">Error</Text>
          <Text id="error-description">Error loading achievement details. Please try again later.</Text>
          <Button ref={closeButtonRef} onClick={onClose} variant="secondary" mt="md">
            Close
          </Button>
        </Box>
      </Modal>
    );
  }

  if (!achievement) {
    return (
      <Modal 
        visible={visible} 
        onClose={onClose} 
        title="Achievement Not Found"
        aria-labelledby="not-found-title"
        aria-describedby="not-found-description"
        journey={currentJourney}
      >
        <Box ref={modalContentRef} tabIndex={-1}>
          <Text id="not-found-title" variant="heading3">Achievement Not Found</Text>
          <Text id="not-found-description">The requested achievement could not be found.</Text>
          <Button ref={closeButtonRef} onClick={onClose} variant="secondary" mt="md">
            Close
          </Button>
        </Box>
      </Modal>
    );
  }

  // Use the achievement's journey for theming if available, otherwise use current journey
  const journeyTheme = achievement.journey || currentJourney;

  // Renders a `Modal` component with proper accessibility attributes
  return (
    <Modal 
      visible={visible} 
      onClose={onClose} 
      title="Achievement Details"
      aria-labelledby="achievement-title"
      aria-describedby="achievement-description"
      journey={journeyTheme}
    >
      <Stack 
        ref={modalContentRef} 
        tabIndex={-1}
        direction="column" 
        spacing="md"
        align="center"
      >
        {/* Displays the achievement badge using the `AchievementBadge` component. */}
        <AchievementBadge 
          achievement={achievement} 
          size="lg" 
          showProgress={!achievement.unlocked} 
          aria-hidden="true"
        />
        
        {/* Displays the achievement title and description. */}
        <Text 
          id="achievement-title" 
          variant="heading3" 
          textAlign="center"
          color={journeyTheme}
        >
          {achievement.title}
        </Text>
        
        <Text 
          id="achievement-description" 
          variant="body" 
          textAlign="center"
        >
          {achievement.description}
        </Text>
        
        {/* If the achievement is not unlocked, displays the progress towards unlocking it. */}
        {!achievement.unlocked && (
          <Box mt="sm">
            <Text variant="body" textAlign="center">
              Progress: {achievement.progress} / {achievement.total}
            </Text>
          </Box>
        )}
        
        {/* Provides a button to close the modal with proper focus management. */}
        <Button 
          ref={closeButtonRef}
          onClick={onClose} 
          variant="primary" 
          mt="md"
          journey={journeyTheme}
          aria-label="Close achievement details"
        >
          Close
        </Button>
      </Stack>
    </Modal>
  );
};