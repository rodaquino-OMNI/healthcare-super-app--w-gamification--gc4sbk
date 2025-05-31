/**
 * Input Component
 * 
 * A cross-platform, accessible input component that supports various input types,
 * journey-specific theming, error states, and focus management.
 * 
 * @example
 * // Basic usage
 * <Input name="email" value={email} onChange={handleChange} label="Email" />
 * 
 * // With error state
 * <Input name="password" value={password} onChange={handleChange} label="Password" type="password" error="Password is required" />
 * 
 * // With journey-specific theming
 * <Input name="height" value={height} onChange={handleChange} label="Height" journeyTheme="health" />
 */

import React, { forwardRef, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Box, Text, Touchable } from '@design-system/primitives';
import { InputProps } from '@austa/interfaces/components/core.types';
import { useTheme } from '../../themes';

/**
 * Input component for text entry with support for various HTML input types,
 * journey-specific theming, accessibility properties, and error states.
 */
export const Input = forwardRef<HTMLInputElement | any, InputProps>((
  {
    // Base props
    name,
    value,
    placeholder,
    label,
    required = false,
    error,
    helperText,
    type = 'text',
    maxLength,
    multiline = false,
    rows = 3,
    loading = false,
    readOnly = false,
    startIcon,
    endIcon,
    onChange,
    onChangeText,
    onFocus,
    onBlur,
    onSubmit,
    onClear,
    size = 'md',
    variant = 'outlined',
    autoCapitalize = 'none',
    autoCorrect = false,
    autoFocus = false,
    clearable = false,
    
    // Styled component props
    id,
    testID,
    className,
    journeyTheme,
    accessibilityLabel,
    disabled = false,
    style,
    rnStyle,
  },
  ref
) => {
  // Get theme based on journeyTheme prop or default theme
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Generate unique IDs for accessibility
  const inputId = id || `input-${name}`;
  const labelId = `label-${inputId}`;
  const helperId = `helper-${inputId}`;
  const errorId = `error-${inputId}`;

  // Determine input height based on size
  const getInputHeight = () => {
    switch (size) {
      case 'xs': return 32;
      case 'sm': return 36;
      case 'lg': return 48;
      case 'xl': return 56;
      case 'md':
      default: return 40;
    }
  };

  // Determine input padding based on size
  const getInputPadding = () => {
    switch (size) {
      case 'xs': return { paddingLeft: 8, paddingRight: 8 };
      case 'sm': return { paddingLeft: 12, paddingRight: 12 };
      case 'lg': return { paddingLeft: 16, paddingRight: 16 };
      case 'xl': return { paddingLeft: 20, paddingRight: 20 };
      case 'md':
      default: return { paddingLeft: 16, paddingRight: 16 };
    }
  };

  // Determine font size based on size
  const getFontSize = () => {
    switch (size) {
      case 'xs': return 'xs';
      case 'sm': return 'sm';
      case 'lg': return 'md';
      case 'xl': return 'lg';
      case 'md':
      default: return 'md';
    }
  };

  // Get journey-specific colors
  const getColors = () => {
    const currentTheme = journeyTheme ? theme[journeyTheme] : theme;
    const isError = !!error;

    return {
      borderColor: isError 
        ? currentTheme.colors.error.main 
        : isFocused 
          ? currentTheme.colors[journeyTheme || 'base'].primary.main 
          : currentTheme.colors.gray[300],
      backgroundColor: variant === 'filled' 
        ? currentTheme.colors.gray[100] 
        : 'transparent',
      textColor: disabled 
        ? currentTheme.colors.gray[400] 
        : currentTheme.colors.gray[900],
      placeholderColor: currentTheme.colors.gray[400],
      labelColor: isError 
        ? currentTheme.colors.error.main 
        : isFocused 
          ? currentTheme.colors[journeyTheme || 'base'].primary.main 
          : currentTheme.colors.gray[700],
      helperTextColor: isError 
        ? currentTheme.colors.error.main 
        : currentTheme.colors.gray[600],
      iconColor: isError 
        ? currentTheme.colors.error.main 
        : isFocused 
          ? currentTheme.colors[journeyTheme || 'base'].primary.main 
          : currentTheme.colors.gray[500],
    };
  };

  const colors = getColors();
  const height = getInputHeight();
  const padding = getInputPadding();
  const fontSize = getFontSize();

  // Handle focus event
  const handleFocus = (event: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(event);
  };

  // Handle blur event
  const handleBlur = (event: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(event);
  };

  // Handle change event
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(event);
    if (onChangeText) onChangeText(event.target.value);
  };

  // Handle text change for React Native
  const handleChangeText = (text: string) => {
    if (onChangeText) onChangeText(text);
  };

  // Handle key press for submit
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  // Handle clear button click
  const handleClear = () => {
    if (onClear) onClear();
    if (onChange) {
      const event = {
        target: { value: '', name },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    if (onChangeText) onChangeText('');
    if (inputRef.current) inputRef.current.focus();
  };

  // Combine refs
  const setRefs = (element: HTMLInputElement | null) => {
    inputRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
    }
  };

  // Render input based on platform
  const renderInput = () => {
    const commonProps = {
      id: inputId,
      name,
      value: value || '',
      placeholder,
      disabled,
      required,
      maxLength,
      autoFocus,
      readOnly,
      'aria-invalid': !!error,
      'aria-required': required,
      'aria-labelledby': label ? labelId : undefined,
      'aria-describedby': helperText ? helperId : error ? errorId : undefined,
    };

    if (Platform.OS === 'web') {
      return (
        <Box
          as="input"
          ref={setRefs}
          type={type}
          {...commonProps}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          style={{
            height,
            ...padding,
            width: '100%',
            border: variant === 'standard' ? 'none' : `1px solid ${colors.borderColor}`,
            borderRadius: 4,
            backgroundColor: colors.backgroundColor,
            color: colors.textColor,
            fontSize: theme.typography.fontSize[fontSize],
            fontFamily: theme.typography.fontFamily.base,
            outline: 'none',
            boxSizing: 'border-box',
            paddingLeft: startIcon ? (padding.paddingLeft as number) + 24 : padding.paddingLeft,
            paddingRight: (endIcon || (clearable && value)) ? (padding.paddingRight as number) + 24 : padding.paddingRight,
            borderBottom: variant === 'standard' ? `1px solid ${colors.borderColor}` : undefined,
            ...style,
          }}
          className={className}
          data-testid={testID}
        />
      );
    } else {
      // React Native implementation
      return (
        <Box
          as="TextInput"
          ref={ref}
          {...commonProps}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmit}
          secureTextEntry={type === 'password'}
          keyboardType={type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default'}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? rows : undefined}
          style={[
            {
              height: multiline ? undefined : height,
              minHeight: multiline ? height * rows / 3 : undefined,
              paddingLeft: startIcon ? (padding.paddingLeft as number) + 24 : padding.paddingLeft,
              paddingRight: (endIcon || (clearable && value)) ? (padding.paddingRight as number) + 24 : padding.paddingRight,
              width: '100%',
              borderWidth: variant === 'standard' ? 0 : 1,
              borderColor: colors.borderColor,
              borderRadius: 4,
              backgroundColor: colors.backgroundColor,
              color: colors.textColor,
              fontSize: theme.typography.fontSize[fontSize],
              fontFamily: theme.typography.fontFamily.base,
              borderBottomWidth: variant === 'standard' ? 1 : undefined,
              borderBottomColor: variant === 'standard' ? colors.borderColor : undefined,
            },
            rnStyle,
          ]}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled, required }}
        />
      );
    }
  };

  return (
    <Box width="100%">
      {/* Label */}
      {label && (
        <Text
          id={labelId}
          color={colors.labelColor}
          fontSize={fontSize}
          fontWeight="medium"
          marginBottom={1}
          as="label"
          htmlFor={inputId}
        >
          {label}
          {required && <Text color="error.main" marginLeft={1}>*</Text>}
        </Text>
      )}

      {/* Input container */}
      <Box position="relative" width="100%">
        {/* Start icon */}
        {startIcon && (
          <Box
            position="absolute"
            left={padding.paddingLeft}
            top="50%"
            style={{ transform: 'translateY(-50%)' }}
            zIndex={1}
            color={colors.iconColor}
          >
            {startIcon}
          </Box>
        )}

        {/* Input element */}
        {renderInput()}

        {/* End icon */}
        {endIcon && (
          <Box
            position="absolute"
            right={padding.paddingRight}
            top="50%"
            style={{ transform: 'translateY(-50%)' }}
            zIndex={1}
            color={colors.iconColor}
          >
            {endIcon}
          </Box>
        )}

        {/* Clear button */}
        {clearable && value && !endIcon && (
          <Touchable
            position="absolute"
            right={padding.paddingRight}
            top="50%"
            style={{ transform: 'translateY(-50%)' }}
            zIndex={1}
            onPress={handleClear}
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Box
              width={16}
              height={16}
              borderRadius={8}
              backgroundColor={colors.iconColor}
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontSize="xs" lineHeight="none">
                ×
              </Text>
            </Box>
          </Touchable>
        )}
      </Box>

      {/* Helper text or error message */}
      {(helperText || error) && (
        <Text
          id={error ? errorId : helperId}
          color={colors.helperTextColor}
          fontSize="xs"
          marginTop={1}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </Text>
      )}
    </Box>
  );
});

// Display name for debugging
Input.displayName = 'Input';

export default Input;