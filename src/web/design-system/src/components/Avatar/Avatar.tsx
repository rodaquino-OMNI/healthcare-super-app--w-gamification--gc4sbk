import React, { useState } from 'react';
import { AvatarProps } from '@austa/interfaces/components';
import { Icon } from '@design-system/primitives/components/Icon';
import { Text } from '@design-system/primitives/components/Text';
import { AvatarContainer, AvatarImage, AvatarFallback } from './Avatar.styles';

/**
 * Helper function to get initials from a name or alt text
 * @param text - The text to extract initials from
 * @returns Up to two characters representing the initials
 */
const getInitials = (text?: string): string => {
  if (!text) return '';
  
  const words = text.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Avatar component that displays a user's profile image or falls back to initials or an icon.
 * 
 * The component now supports journey-specific theming through the journey prop,
 * which applies appropriate background and text colors based on the selected journey.
 *
 * @example
 * // Basic usage with image
 * <Avatar src="https://example.com/avatar.jpg" alt="John Doe" />
 * 
 * @example
 * // With journey-specific theming
 * <Avatar src="https://example.com/avatar.jpg" alt="John Doe" journey="health" />
 * 
 * @example
 * // With custom size
 * <Avatar src="https://example.com/avatar.jpg" alt="John Doe" size={64} />
 * 
 * @example
 * // Forced fallback to initials
 * <Avatar alt="John Doe" showFallback />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  journey,
  showFallback = false,
  testID,
  onImageError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeInPx = typeof size === 'number' ? `${size}px` : size;
  const shouldShowFallback = showFallback || !src || hasError;
  const initials = getInitials(alt);
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    if (onImageError) {
      onImageError(e);
    }
  };

  return (
    <AvatarContainer 
      size={sizeInPx} 
      journey={journey}
      data-testid={testID}
      aria-label={alt}
      {...rest}
    >
      {!shouldShowFallback ? (
        <AvatarImage src={src} alt={alt} onError={handleImageError} />
      ) : initials ? (
        <AvatarFallback size={sizeInPx} journey={journey}>
          <Text size={`calc(${sizeInPx} / 3)`} weight="medium" journey={journey}>
            {initials}
          </Text>
        </AvatarFallback>
      ) : (
        <Icon 
          name="profile" 
          size={`calc(${sizeInPx} * 0.6)`} 
          color={journey ? `journeys.${journey}.text` : 'neutral.gray700'}
        />
      )}
    </AvatarContainer>
  );
};

export default Avatar;