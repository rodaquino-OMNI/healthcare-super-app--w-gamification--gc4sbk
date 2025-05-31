import React, { forwardRef, useState, useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { Touchable } from '@design-system/primitives';
import { CheckboxProps } from '@austa/interfaces/components/core.types';
import { JourneyTheme } from '@austa/interfaces/themes';
import { useTheme } from '../../themes';

/**
 * A custom Checkbox component with styling and accessibility features.
 * 
 * This component renders a styled, accessible checkbox control that works across
 * web and native platforms. It supports journey-specific theming and provides
 * proper accessibility attributes.
 */
export const Checkbox = forwardRef<any, CheckboxProps>((props, ref) => {
  const {
    id,
    name,
    value,
    checked = false,
    disabled = false,
    onChange,
    onValueChange,
    label,
    testID,
    journeyTheme,
    size = 'md',
    color
  } = props;
  
  const theme = useTheme();
  const [isChecked, setIsChecked] = useState(checked);
  const inputRef = React.useRef<any>(null);
  
  // Update internal state when checked prop changes
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  // Expose the focus method to the parent through ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }));
  
  // Handle checkbox change
  const handleChange = useCallback(() => {
    if (!disabled) {
      const newChecked = !isChecked;
      setIsChecked(newChecked);
      
      // Create a synthetic event for the onChange handler
      const syntheticEvent = {
        target: {
          checked: newChecked,
          value,
          name,
          id
        },
        currentTarget: {
          checked: newChecked,
          value,
          name,
          id
        },
        nativeEvent: {},
        preventDefault: () => {},
        stopPropagation: () => {},
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        isDefaultPrevented: () => false,
        isPropagationStopped: () => false,
        persist: () => {},
        type: 'change',
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      // Call the appropriate handler based on platform
      onChange?.(syntheticEvent);
      onValueChange?.(newChecked);
    }
  }, [disabled, isChecked, onChange, onValueChange, value, name, id]);
  
  // Get journey-specific styling
  const getJourneyColor = () => {
    // If a specific color is provided, use it
    if (color) {
      return color;
    }
    
    // If a journey theme is specified, use its primary color
    if (journeyTheme && journeyTheme !== 'base' && theme.colors.journeys[journeyTheme]) {
      return theme.colors.journeys[journeyTheme].primary;
    }
    
    // Default to brand primary color
    return theme.colors.brand.primary;
  };
  
  // Get size-specific dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          width: 16,
          height: 16,
          borderRadius: theme.borderRadius.sm,
          fontSize: 12,
          lineHeight: 16
        };
      case 'sm':
        return {
          width: 18,
          height: 18,
          borderRadius: theme.borderRadius.sm,
          fontSize: 13,
          lineHeight: 18
        };
      case 'lg':
        return {
          width: 24,
          height: 24,
          borderRadius: theme.borderRadius.md,
          fontSize: 16,
          lineHeight: 24
        };
      case 'xl':
        return {
          width: 28,
          height: 28,
          borderRadius: theme.borderRadius.md,
          fontSize: 18,
          lineHeight: 28
        };
      case 'md':
      default:
        return {
          width: 20,
          height: 20,
          borderRadius: theme.borderRadius.sm,
          fontSize: 14,
          lineHeight: 20
        };
    }
  };
  
  // Selected color based on journey
  const selectedColor = getJourneyColor();
  const sizeStyles = getSizeStyles();
  
  // Combine styles based on state and size
  const checkboxStyles = {
    width: sizeStyles.width,
    height: sizeStyles.height,
    borderRadius: sizeStyles.borderRadius,
    borderWidth: 2,
    borderColor: theme.colors.neutral.gray500,
    marginRight: theme.spacing.sm,
    WebkitAppearance: 'none',
    outline: 'none',
    cursor: disabled ? 'default' : 'pointer'
  };
  
  const checkboxCheckedStyles = {
    backgroundColor: selectedColor,
    borderColor: selectedColor,
  };
  
  const checkboxDisabledStyles = {
    backgroundColor: theme.colors.neutral.gray100,
    borderColor: theme.colors.neutral.gray300,
    cursor: 'not-allowed'
  };
  
  const checkmarkStyles = {
    color: theme.colors.neutral.white,
    fontSize: sizeStyles.fontSize,
    textAlign: 'center' as const,
    lineHeight: sizeStyles.lineHeight,
  };
  
  const labelStyles = {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.neutral.gray900,
    userSelect: 'none' as const
  };
  
  const labelDisabledStyles = {
    color: theme.colors.neutral.gray400,
  };
  
  return (
    <Touchable
      onPress={handleChange}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={label}
      testID={testID || `checkbox-${id}`}
      style={styles.container}
    >
      <Box
        style={[
          checkboxStyles,
          isChecked && checkboxCheckedStyles,
          disabled && checkboxDisabledStyles
        ]}
      >
        {isChecked && (
          <Text
            testID="checkbox-checkmark"
            aria-hidden="true"
            style={checkmarkStyles}
          >
            ✓
          </Text>
        )}
      </Box>
      
      {/* Hidden native input for web platform only */}
      {Platform.OS === 'web' && (
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0
          }}
          aria-hidden="true"
        />
      )}
      
      <Text
        style={[
          labelStyles,
          disabled && labelDisabledStyles
        ]}
      >
        {label}
      </Text>
    </Touchable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

// Set display name for better debugging
Checkbox.displayName = 'Checkbox';