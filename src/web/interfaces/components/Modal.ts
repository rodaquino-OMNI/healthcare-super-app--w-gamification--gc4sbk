/**
 * Modal component interface for the AUSTA SuperApp
 * 
 * This file defines the TypeScript interface for the Modal component,
 * ensuring consistent prop structures across both web and mobile platforms,
 * while supporting journey-specific theming.
 */

import { ReactNode } from 'react';
import { StyledComponentProps, JourneyTheme } from './core.types';

/**
 * Props interface for the Modal component
 */
export interface ModalProps extends StyledComponentProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Modal content */
  children: ReactNode;
  
  /** Modal title */
  title?: string | ReactNode;
  
  /** Close handler */
  onClose: () => void;
  
  /** Whether to show a close button */
  showCloseButton?: boolean;
  
  /** Whether to close the modal when clicking outside */
  closeOnClickOutside?: boolean;
  
  /** Whether to close the modal when pressing escape */
  closeOnEscape?: boolean;
  
  /** Modal width */
  width?: number | string;
  
  /** Modal height */
  height?: number | string;
  
  /** Modal footer content */
  footer?: ReactNode;
  
  /** Whether the modal is centered */
  centered?: boolean;
  
  /** Whether the modal has a backdrop */
  hasBackdrop?: boolean;
  
  /** Backdrop opacity */
  backdropOpacity?: number;
  
  /** Whether the modal is fullscreen */
  fullscreen?: boolean;
  
  /** Animation duration in milliseconds */
  animationDuration?: number;
  
  /** Whether the modal has a scrollable body */
  scrollable?: boolean;
  
  /** Z-index for the modal */
  zIndex?: number;
  
  /** Journey theme to apply */
  journeyTheme?: JourneyTheme;
}