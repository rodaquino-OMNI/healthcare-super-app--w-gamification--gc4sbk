/**
 * @austa/design-system
 * 
 * This barrel file exports all components, themes, and utilities from the design system.
 * It serves as the main entry point and public API surface for the design system package.
 * 
 * The design system is organized into journey-specific modules (health, care, plan) and
 * functionality-specific modules (components, charts, gamification) to support the
 * journey-centered architecture of the AUSTA SuperApp.
 */

// Import primitives from @design-system/primitives package
import * as primitives from '@design-system/primitives';

// Import type definitions from @austa/interfaces package
import type * as interfaces from '@austa/interfaces';

// Import all components
import * as components from './components';

// Import all charts
import * as charts from './charts';

// Import all gamification components
import * as gamification from './gamification';

// Import all journey-specific components
import * as health from './health';
import * as care from './care';
import * as plan from './plan';

// Import themes
import * as themes from './themes';

// Re-export all primitives
export { primitives };

// Re-export type definitions
export { interfaces };

// Re-export all components
export { components };

// Re-export all charts
export { charts };

// Re-export all gamification components
export { gamification };

// Re-export all journey-specific components
export { health };
export { care };
export { plan };

// Re-export themes
export { themes };

// Export individual theme objects for backward compatibility
export { baseTheme, healthTheme, careTheme, planTheme } from './themes';