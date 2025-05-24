/**
 * Button Component
 * 
 * @description A versatile button component that supports various styles, sizes, and states.
 * The Button component is a core interactive element used throughout the AUSTA SuperApp
 * across all three journeys (Health, Care, and Plan).
 * 
 * @example
 * // Basic usage
 * <Button label="Click me" onClick={handleClick} />
 * 
 * // With journey-specific theming
 * <Button label="Health Action" journeyTheme="health" variant="primary" />
 * 
 * // With icons
 * <Button label="Add Item" leftIcon={<PlusIcon />} />
 * 
 * @see ButtonProps for all available props and customization options
 */

import { Button } from './Button';
import type { ButtonProps } from '@austa/interfaces/components';

// Re-export the Button component
export { Button };

// Re-export the ButtonProps interface from the interfaces package
export type { ButtonProps };

// Default export for more flexible importing options
export default Button;