/**
 * ProgressBar Component
 * 
 * A progress bar component that visualizes progress with journey-specific theming.
 * This component supports different sizes, journey contexts, and level markers.
 * 
 * @module components/ProgressBar
 */

// Import the component implementation from local file
import { ProgressBar as ProgressBarComponent } from './ProgressBar';

// Import the props interface from the shared interfaces package
import type { ProgressBarProps } from '@austa/interfaces/components';

/**
 * ProgressBar Component
 * 
 * @example
 * ```tsx
 * <ProgressBar 
 *   current={75} 
 *   total={100} 
 *   journey="health" 
 *   size="md" 
 *   showLevels={true}
 *   levelMarkers={[25, 50, 75]}
 * />
 * ```
 */
export const ProgressBar = ProgressBarComponent;

// Re-export the props interface for consumers
export type { ProgressBarProps };

// Default export for dynamic imports
export default ProgressBar;