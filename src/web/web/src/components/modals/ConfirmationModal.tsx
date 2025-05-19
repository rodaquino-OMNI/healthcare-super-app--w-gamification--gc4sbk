import React, { useCallback } from 'react';
import { Modal } from '@austa/design-system/components/Modal';
import { Button } from '@austa/design-system/components/Button';
import { ModalProps, ButtonProps } from '@austa/interfaces/components';
import { useI18n } from 'src/web/web/src/i18n/index.ts';
import { useJourney } from '@austa/journey-context';

/**
 * Interface for the ConfirmationModal component props
 */
interface ConfirmationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Function to call when the user confirms the action */
  onConfirm: () => void;
  /** Function to call when the user cancels the action */
  onCancel: () => void;
  /** Title of the modal */
  title: string;
  /** Message to display in the modal */
  message: string;
  /** Text for the confirm button */
  confirmText: string;
  /** Text for the cancel button */
  cancelText: string;
  /** Journey type for theming */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * ConfirmationModal component for the AUSTA SuperApp.
 *
 * This component provides a reusable modal for displaying confirmation messages and actions.
 * It uses the design system's Modal and Button components for styling and adheres to accessibility guidelines.
 *
 * @param {ConfirmationModalProps} props - The props for the ConfirmationModal component.
 * @returns {React.ReactNode} The JSX code for the confirmation modal.
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   visible={isModalVisible}
 *   onConfirm={() => {
 *     handleConfirm();
 *     setIsModalVisible(false);
 *   }}
 *   onCancel={() => setIsModalVisible(false)}
 *   title="Confirm Deletion"
 *   message="Are you sure you want to delete this item?"
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   journey="health"
 * />
 * ```
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  journey,
}) => {
  // Retrieves the translation function using the useI18n hook
  const { t } = useI18n();

  // Retrieves the current journey from the JourneyContext
  const { currentJourney } = useJourney();
  
  // Use the provided journey or fall back to the current journey from context
  const activeJourney = journey || currentJourney || 'health';

  // Wrap callbacks with error handling
  const handleConfirm = useCallback(() => {
    try {
      onConfirm();
    } catch (error) {
      console.error('Error in confirmation action:', error);
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    try {
      onCancel();
    } catch (error) {
      console.error('Error in cancel action:', error);
    }
  }, [onCancel]);

  // Create action buttons for the modal
  const modalActions = (
    <>
      <Button
        onPress={handleConfirm}
        variant="primary"
        journey={activeJourney}
        accessibilityLabel={confirmText}
        testID="confirmation-modal-confirm-button"
      >
        {confirmText}
      </Button>
      <Button
        onPress={handleCancel}
        variant="secondary"
        journey={activeJourney}
        accessibilityLabel={cancelText}
        testID="confirmation-modal-cancel-button"
      >
        {cancelText}
      </Button>
    </>
  );

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      title={title}
      journey={activeJourney}
      actions={modalActions}
      testID="confirmation-modal"
      aria={{
        describedby: 'confirmation-modal-message',
      }}
    >
      <p id="confirmation-modal-message">{message}</p>
    </Modal>
  );
};