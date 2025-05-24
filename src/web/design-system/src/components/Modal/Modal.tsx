import React, { useEffect, useRef } from 'react';
import { Modal as RNModal } from 'react-native';
import { ModalProps } from '@austa/interfaces/components/Modal';
import { Box, Text, Touchable } from '@design-system/primitives/components';
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalActions } from './Modal.styles';

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
 *   journeyTheme="health"
 * >
 *   <Text>Are you sure you want to proceed?</Text>
 *   <Box marginTop="md">
 *     <Button onPress={handleConfirm}>Confirm</Button>
 *   </Box>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  journeyTheme = 'health',
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  footer,
  centered = true,
  hasBackdrop = true,
  backdropOpacity,
  scrollable = true,
  zIndex,
  ...rest
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle escape key for accessibility
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible && closeOnEscape) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [visible, onClose, closeOnEscape]);
  
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

  // Focus trap implementation
  useEffect(() => {
    if (visible && modalRef.current) {
      // Find all focusable elements
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        // Focus the first element
        (focusableElements[0] as HTMLElement).focus();
        
        // Handle tab key to trap focus within modal
        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (focusableElements.length === 1) {
              e.preventDefault();
              return;
            }
            
            // If shift key pressed, go to the last element if we're on the first
            if (e.shiftKey && document.activeElement === focusableElements[0]) {
              e.preventDefault();
              (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
            } 
            // If we're on the last element, circle back to the first
            else if (!e.shiftKey && document.activeElement === focusableElements[focusableElements.length - 1]) {
              e.preventDefault();
              (focusableElements[0] as HTMLElement).focus();
            }
          }
        };
        
        document.addEventListener('keydown', handleTabKey);
        return () => {
          document.removeEventListener('keydown', handleTabKey);
        };
      }
    }
  }, [visible]);
  
  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      {...rest}
    >
      <ModalBackdrop 
        visible={visible}
        onClick={(e) => {
          // Close modal when clicking outside content
          if (closeOnClickOutside && e.target === e.currentTarget) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby="modal-description"
      >
        <ModalContainer 
          ref={modalRef}
          visible={visible}
          onClick={(e) => e.stopPropagation()}
          journeyTheme={journeyTheme}
        >
          <ModalHeader>
            {title && (
              <Text
                fontSize="lg"
                fontWeight="medium"
                id="modal-title"
                journeyTheme={journeyTheme}
              >
                {title}
              </Text>
            )}
            {showCloseButton && (
              <Touchable
                onPress={onClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
                journeyTheme={journeyTheme}
              >
                <Box padding="xs">
                  <Text fontSize="xl">×</Text>
                </Box>
              </Touchable>
            )}
          </ModalHeader>
          
          <ModalContent id="modal-description" scrollable={scrollable}>
            {children}
          </ModalContent>
          
          {footer && (
            <ModalActions>
              {footer}
            </ModalActions>
          )}
        </ModalContainer>
      </ModalBackdrop>
    </RNModal>
  );
};

export default Modal;