import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, Platform } from 'react-native';
import { ModalProps } from '@austa/interfaces/components/Modal';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Touchable } from '@design-system/primitives/components/Touchable';
import { useTheme } from '../../themes/ThemeProvider';
import {
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  ModalContent,
  ModalActions
} from './Modal.styles';

/**
 * Modal component for the AUSTA SuperApp design system.
 * 
 * This component provides a consistent modal experience across the application
 * with journey-specific theming and proper accessibility support.
 *
 * @example
 * ```tsx
 * <Modal
 *   visible={isModalVisible}
 *   onClose={() => setIsModalVisible(false)}
 *   title="Confirmation"
 *   journey="health"
 * >
 *   <Text>Are you sure you want to proceed?</Text>
 *   <Button onPress={handleConfirm}>Confirm</Button>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  journey = 'health',
  actions,
  testID,
  ...rest
}) => {
  const { getJourneyColor, getJourneyToken } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Get journey-specific styling tokens
  const headerColor = getJourneyColor(journey, 'primary');
  const borderColor = getJourneyColor(journey, 'border');
  const backgroundColor = getJourneyColor(journey, 'background');
  const textColor = getJourneyColor(journey, 'text');
  const borderRadius = getJourneyToken(journey, 'borderRadius', 'md');
  
  // Handle escape key for accessibility
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [visible, onClose]);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || !modalRef.current) return;
    
    // Focus the modal when it opens
    modalRef.current.focus();
    
    // Save the element that had focus before the modal opened
    const previouslyFocused = document.activeElement as HTMLElement;
    
    // Handle tab key to trap focus within modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      // Get all focusable elements in the modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // If shift+tab on first element, move to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } 
      // If tab on last element, move to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restore focus when modal closes
      if (previouslyFocused && 'focus' in previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [visible]);
  
  // Web implementation using styled components
  if (Platform.OS === 'web') {
    return (
      <ModalBackdrop 
        visible={visible}
        onClick={(e) => {
          // Close modal when clicking outside content
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        aria-modal="true"
        role="dialog"
        aria-hidden={!visible}
        data-testid={testID}
        {...rest}
      >
        <ModalContainer 
          visible={visible}
          ref={modalRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby="modal-description"
          journey={journey}
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          borderColor={borderColor}
        >
          <ModalHeader borderColor={headerColor} backgroundColor={getJourneyColor(journey, 'headerBackground')}>
            {title && (
              <Text
                fontSize="lg"
                fontWeight="medium"
                id="modal-title"
                journey={journey}
                color={headerColor}
              >
                {title}
              </Text>
            )}
            <Touchable
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              journey={journey}
            >
              <Box padding="xs">
                <Text fontSize="xl">×</Text>
              </Box>
            </Touchable>
          </ModalHeader>
          
          <ModalContent id="modal-description">
            {children}
          </ModalContent>

          {actions && (
            <ModalActions>
              {actions}
            </ModalActions>
          )}
        </ModalContainer>
      </ModalBackdrop>
    );
  }
  
  // React Native implementation
  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
      accessible={true}
      accessibilityViewIsModal={true}
      {...rest}
    >
      <Box 
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        onPress={(e) => {
          // Close modal when clicking outside content
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <Box 
          width="80%"
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          overflow="hidden"
          maxHeight="80%"
          borderColor={borderColor}
          borderWidth={1}
        >
          <Box 
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            padding="md"
            borderBottomWidth={1}
            borderBottomColor={headerColor}
            backgroundColor={getJourneyColor(journey, 'headerBackground')}
          >
            {title && (
              <Text
                fontSize="lg"
                fontWeight="medium"
                journey={journey}
                color={headerColor}
                accessibilityRole="header"
                accessibilityLabel={`${title} dialog`}
              >
                {title}
              </Text>
            )}
            <Touchable
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              journey={journey}
            >
              <Box padding="xs">
                <Text fontSize="xl">×</Text>
              </Box>
            </Touchable>
          </Box>
          
          <Box padding="md">
            {children}
          </Box>

          {actions && (
            <Box 
              flexDirection="row"
              justifyContent="flex-end"
              padding="md"
              borderTopWidth={1}
              borderTopColor={borderColor}
              backgroundColor={getJourneyColor(journey, 'actionBackground')}
            >
              {actions}
            </Box>
          )}
        </Box>
      </Box>
    </RNModal>
  );
};