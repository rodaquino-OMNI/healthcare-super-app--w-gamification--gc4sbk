/**
 * @file ProgressBar component entry point
 * @description Exports the ProgressBar component and its types for use in the application
 * @module components/ProgressBar
 */

// Import the component implementation from local file
import { ProgressBar } from './ProgressBar';

// Import the type definition from the shared interfaces package
import type { ProgressBarProps } from '@austa/interfaces/components';

// Re-export the component and its types
export { ProgressBar };
export type { ProgressBarProps };

// Default export for compatibility with older import patterns
// while maintaining tree-shaking compatibility
export default ProgressBar;