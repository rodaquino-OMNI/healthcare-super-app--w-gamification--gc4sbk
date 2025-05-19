/**
 * @file Avatar component implementation
 * @description Renders a user profile image with fallback options
 */

import React, { useState } from 'react';

// Import primitives from @design-system/primitives package
import { Icon } from '@design-system/primitives/components/Icon';
import { Text } from '@design-system/primitives/components/Text';

// Import AvatarProps interface from @austa/interfaces/components
import { AvatarProps } from '@austa/interfaces/components';

// Import styled components
import { AvatarContainer, AvatarImage, AvatarFallback } from './Avatar.styles';

/**
 * Helper function to extract initials from a name
 * @param name - The name to extract initials from
 * @returns Up to two characters representing the initials
 */
const getInitials = (name?: string): string => {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

/**
 * Avatar component that displays a user profile image or falls back to initials/icon
 * @param props - The component props
 * @returns A React component
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 40,
  showFallback = false,
  journey,
  onImageError,
  testID,
  className,
  ...rest
}) => {
  // Track image loading errors
  const [hasError, setHasError] = useState(showFallback);
  
  // Handle image loading errors
  const handleImageError = () => {
    setHasError(true);
    if (onImageError) {
      onImageError();
    }
  };
  
  // Get initials from alt text if available
  const initials = getInitials(alt);
  
  // Convert size to string with 'px' for styling
  const sizeWithUnit = `${size}px`;
  
  return (
    <AvatarContainer 
      size={sizeWithUnit} 
      journey={journey}
      className={className}
      data-testid={testID}
      {...rest}
    >
      {src && !hasError ? (
        <AvatarImage 
          src={src} 
          alt={alt} 
          onError={handleImageError} 
        />
      ) : (
        <AvatarFallback size={sizeWithUnit}>
          {initials ? (
            <Text 
              variant="body"
              weight="medium"
              color={journey ? `journeys.${journey}.text` : 'neutral.gray700'}
            >
              {initials}
            </Text>
          ) : (
            <Icon 
              name="profile" 
              size={size / 2} 
              color={journey ? `journeys.${journey}.text` : 'neutral.gray700'}
            />
          )}
        </AvatarFallback>
      )}
    </AvatarContainer>
  );
};