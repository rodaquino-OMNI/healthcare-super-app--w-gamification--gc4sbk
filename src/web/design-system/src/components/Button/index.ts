/**
 * @file Button component index
 * @description Exports the Button component and its props interface for use throughout the AUSTA SuperApp.
 * This file provides a clean, consistent import path for consumers of the design system.
 * 
 * @example
 * // Import with named exports
 * import { Button, ButtonProps } from '@austa/design-system/components/Button';
 * 
 * // Or import with default export
 * import Button from '@austa/design-system/components/Button';
 */

import { Button } from './Button';
import type { ButtonProps } from '@austa/interfaces/components/core.types';

// Named exports for explicit imports
export { Button };
export type { ButtonProps };

// Default export for more flexible importing options
export default Button;