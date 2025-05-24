/**
 * Avatar Component
 * 
 * A component for displaying user profile images with fallback to initials or icon.
 * Supports journey-specific styling and various sizes.
 * 
 * @module Avatar
 */

// Import the Avatar component from the local implementation file
import { Avatar } from './Avatar';

// Import the AvatarProps interface from the centralized interfaces package
import type { AvatarProps } from '@austa/interfaces/components';

// Re-export the component and its props interface
export { Avatar };
export type { AvatarProps };

// Default export for convenient importing
export default Avatar;