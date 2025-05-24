/**
 * @austa/design-system
 * 
 * This is the main entry point for the @austa/design-system package.
 * It serves as the central aggregation point and public API surface for all UI components
 * used in the AUSTA SuperApp across web and mobile platforms.
 * 
 * The design system is organized into the following categories:
 * 1. Primitives - Imported from @design-system/primitives package
 * 2. Components - Core UI components built on primitives
 * 3. Charts - Data visualization components
 * 4. Themes - Base and journey-specific themes
 * 5. Journey-specific components:
 *    - Health - Components for the Health journey
 *    - Care - Components for the Care journey
 *    - Plan - Components for the Plan journey
 * 6. Gamification - Cross-journey gamification components
 * 
 * @example
 * // Import all components from a category
 * import { components, health, care, plan } from '@austa/design-system';
 * 
 * // Import specific components
 * import { Button, Card } from '@austa/design-system/components';
 * import { HealthChart } from '@austa/design-system/health';
 */

// Import types from @austa/interfaces
import type { Components, Themes } from '@austa/interfaces';

// Import primitives from @design-system/primitives
import * as primitives from '@design-system/primitives';

// Import all components
import * as components from './components';

// Import all charts
import * as charts from './charts';

// Import all themes
import * as themes from './themes';

// Import all gamification components
import * as gamification from './gamification';

// Import all health components
import * as health from './health';

// Import all care components
import * as care from './care';

// Import all plan components
import * as plan from './plan';

// Export primitives from @design-system/primitives
export { primitives };

// Export all components
export { components };

// Export all charts
export { charts };

// Export all themes
export { themes };

// Export all gamification components
export { gamification };

// Export all health components
export { health };

// Export all care components
export { care };

// Export all plan components
export { plan };

// Direct exports of commonly used primitives for convenience
export const {
  Box,
  Text,
  Stack,
  Icon,
  Touchable
} = primitives;

// Direct exports of commonly used components for convenience
export const {
  Button,
  Card,
  Input,
  Modal,
  Checkbox,
  ProgressBar,
  ProgressCircle,
  DatePicker,
  Avatar,
  Badge,
  Accordion
} = components;

// Direct exports of commonly used charts for convenience
export const {
  BarChart,
  LineChart,
  RadialChart
} = charts;

// Direct exports of themes for convenience
export const {
  baseTheme,
  healthTheme,
  careTheme,
  planTheme
} = themes;

// Default export for ESM compatibility
export default {
  primitives,
  components,
  charts,
  themes,
  gamification,
  health,
  care,
  plan
};