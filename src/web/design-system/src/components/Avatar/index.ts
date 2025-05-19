/**
 * @file Avatar component entry point
 * @description Re-exports the Avatar component and its props interface
 */

// Import the Avatar component from the implementation file
import { Avatar } from './Avatar';

// Import the AvatarProps interface from the centralized interfaces package
import type { AvatarProps } from '@austa/interfaces/components';

// Re-export both the component and its props interface
export { Avatar };
export type { AvatarProps };

// Default export for convenient importing
export default Avatar;