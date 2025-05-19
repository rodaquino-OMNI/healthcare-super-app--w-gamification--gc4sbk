import React from 'react';
import { Modal } from '@austa/design-system';
import { Button } from '@austa/design-system';
import { Text } from '@design-system/primitives';
import { Badge } from '@austa/design-system';
import { useJourney } from '@austa/journey-context';
import { Achievement } from '@austa/interfaces/gamification';

/**
 * Props interface for the AchievementModal component
 */
interface AchievementModalProps {
  /**
   * Controls the visibility of the modal.
   */
  visible: boolean;
  /**
   * Function called when the modal is closed.
   */
  onClose: () => void;
  /**
   * The achievement data to display.
   */
  achievement: Achievement;
}

/**
 * A modal component that displays details about an achievement.
 *
 * @param props - The props for the component, including the achievement details and a close handler.
 * @returns A modal displaying the achievement details.
 */
export const AchievementModal: React.FC<AchievementModalProps> = ({
  visible,
  onClose,
  achievement,
}) => {
  // Destructure props to get visible, onClose, achievement.
  const { title, description, icon } = achievement;

  // Use the useJourney hook to get journey-specific theming.
  const { journey } = useJourney();

  // Render a Modal component with the achievement title.
  return (
    <Modal visible={visible} onClose={onClose} title={title} journey={journey}>
      {/* Render the achievement badge with the achievement details. */}
      <Badge
        size="lg"
        unlocked={achievement.unlocked}
        journey={journey}
        accessibilityLabel={`${title} Achievement`}
      >
        {icon}
      </Badge>
      {/* Render the achievement description using the Text component. */}
      <Text>{description}</Text>
      {/* Render a button to close the modal. */}
      <Button onPress={onClose}>
        {/* Apply journey-specific styling to the button. */}
        {/* Provide appropriate accessibility attributes. */}
        Close
      </Button>
    </Modal>
  );
};