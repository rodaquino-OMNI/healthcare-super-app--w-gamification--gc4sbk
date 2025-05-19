/**
 * @file Shared Components Index
 * @description Exports all shared UI components and their associated TypeScript props interfaces
 * from the shared components directory, providing a single, centralized import entry point for the
 * AUSTA SuperApp mobile application.
 */

// Component imports
import EmptyState from './EmptyState';
import FileUploader from './FileUploader';
import GamificationPopup from './GamificationPopup';
import JourneyHeader from './JourneyHeader';
import LoadingIndicator from './LoadingIndicator';
import PhotoCapture from './PhotoCapture';

// Type imports from @austa/interfaces
import type {
  EmptyStateProps,
  FileUploaderProps,
  GamificationPopupProps,
  JourneyHeaderProps,
  LoadingIndicatorProps,
  PhotoCaptureProps
} from '@austa/interfaces/components';

// Component exports
export {
  EmptyState,
  FileUploader,
  GamificationPopup,
  JourneyHeader,
  LoadingIndicator,
  PhotoCapture
};

// Type exports
export type {
  EmptyStateProps,
  FileUploaderProps,
  GamificationPopupProps,
  JourneyHeaderProps,
  LoadingIndicatorProps,
  PhotoCaptureProps
};