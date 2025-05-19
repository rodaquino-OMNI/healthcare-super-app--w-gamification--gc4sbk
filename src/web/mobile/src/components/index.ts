// src/web/mobile/src/components/index.ts
/**
 * @file src/web/mobile/src/components/index.ts
 * @description Aggregates and exports commonly used UI components for easy access throughout the mobile application.
 */

// Import UI components from @austa/design-system package
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  ProgressCircle,
  ProgressBar
} from '@austa/design-system/components';

// Import types from @austa/interfaces for type safety
import type {
  ButtonProps,
  CardProps,
  InputProps,
  SelectProps,
  ModalProps,
  ProgressCircleProps,
  ProgressBarProps
} from '@austa/interfaces/components';

// Import local shared components
import { JourneyHeader } from './shared/JourneyHeader';
import { LoadingIndicator } from './shared/LoadingIndicator';
import { ErrorState } from './shared/ErrorState';
import { EmptyState } from './shared/EmptyState';

// Export all imported components to make them accessible throughout the application
export {
  // UI components from design system
  Button,
  Card,
  Input,
  Select,
  Modal,
  ProgressCircle,
  ProgressBar,
  
  // Local shared components
  JourneyHeader,
  LoadingIndicator,
  ErrorState,
  EmptyState,
};

// Export component types for type safety
export type {
  ButtonProps,
  CardProps,
  InputProps,
  SelectProps,
  ModalProps,
  ProgressCircleProps,
  ProgressBarProps
};