import React, { forwardRef, useRef, useState } from 'react';
import { useTheme } from 'styled-components';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { Touchable } from '@design-system/primitives/components/Touchable';
import { InputProps } from '@austa/interfaces/components/core.types';
import { InputContainer, InputLabel, InputField } from './Input.styles';

/**
 * Input component for text entry
 * 
 * Supports various HTML input types (text, password, email, number),
 * journey-specific theming, accessibility properties, error states,
 * and focus management.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    id,
    name,
    type = 'text',
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    label,
    disabled = false,
    required = false,
    error,
    success,
    journey,
    size = 'md',
    fullWidth = false,
    marginBottom,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    tabIndex,
    testID,
    ...rest
  },
  ref
) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Generate a unique ID if none is provided
  const inputId = id || `input-${name || Math.random().toString(36).substring(2, 9)}`;
  
  // Handle focus event
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };
  
  // Handle blur event
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };
  
  // Combine refs
  const combinedRef = (node: HTMLInputElement) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <InputContainer 
      $fullWidth={fullWidth} 
      $marginBottom={marginBottom}
      data-testid={testID ? `${testID}-container` : undefined}
    >
      {label && (
        <InputLabel 
          htmlFor={inputId} 
          $required={required} 
          $disabled={disabled} 
          $journey={journey}
          data-testid={testID ? `${testID}-label` : undefined}
        >
          {label}
        </InputLabel>
      )}
      
      <InputField
        ref={combinedRef}
        id={inputId}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy || (label ? inputId : undefined)}
        tabIndex={tabIndex}
        $error={!!error}
        $success={!!success}
        $disabled={disabled}
        $journey={journey}
        $size={size}
        data-testid={testID}
        {...rest}
      />
      
      {error && typeof error === 'string' && (
        <Box marginTop="xs">
          <Text 
            color="semantic.error" 
            size="sm"
            data-testid={testID ? `${testID}-error` : undefined}
          >
            {error}
          </Text>
        </Box>
      )}
    </InputContainer>
  );
});

Input.displayName = 'Input';