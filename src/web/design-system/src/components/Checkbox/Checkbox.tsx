import React, { forwardRef, useState, useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Box } from '@design-system/primitives';
import { Text } from '@design-system/primitives';
import { Touchable } from '@design-system/primitives';
import { CheckboxProps } from '@austa/interfaces/components/core.types';
import { JourneyType } from '@austa/interfaces/themes';
import { useTheme } from '../../themes';

// Extended props to include value which is needed for the native input
interface ExtendedCheckboxProps extends CheckboxProps {
  /**
   * The value of the checkbox input (used for the native input element).
   */
  value?: string;
}

/**
 * A custom Checkbox component with styling and accessibility features.
 * Supports journey-specific theming and cross-platform rendering.
 */
export const Checkbox = forwardRef<any, ExtendedCheckboxProps>((props, ref) => {
  const {
    id,
    name,
    value,
    checked = false,
    disabled = false,
    onChange,
    label,
    testID,
    journey,
    accessibilityLabel
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
      
      // Call the onChange handler with the new checked state
      if (onChange) {
        onChange(newChecked);
      }
    }
  }, [disabled, isChecked, onChange]);
  
  // Get journey-specific styling
  const getJourneyColor = () => {
    if (journey && theme.colors.journeys && theme.colors.journeys[journey as JourneyType]) {
      return theme.colors.journeys[journey as JourneyType].primary;
    }
    return theme.colors.brand.primary; // Default to brand primary color
  };
  
  // Selected color based on journey
  const selectedColor = getJourneyColor();
  
  return (
    <Touchable
      onPress={handleChange}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      testID={testID || `checkbox-${id}`}
      style={styles.container}
    >
      <Box
        style={[
          styles.input,
          isChecked && [styles.inputChecked, { backgroundColor: selectedColor, borderColor: selectedColor }],
          disabled && styles.inputDisabled
        ]}
      >
        {isChecked && (
          <Text
            testID="checkbox-checkmark"
            aria-hidden="true"
            style={styles.checkmark}
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
          styles.label,
          disabled && styles.labelDisabled
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
  },
  input: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9E9E9E', // Will be overridden by theme colors in journey-specific styling
    marginRight: 8,
    WebkitAppearance: 'none',
    outline: 'none',
    cursor: 'pointer'
  },
  inputChecked: {
    // backgroundColor and borderColor are set dynamically based on journey
  },
  inputDisabled: {
    backgroundColor: '#EEEEEE',
    borderColor: '#BDBDBD',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    color: '#212121',
    userSelect: 'none'
  },
  labelDisabled: {
    color: '#BDBDBD',
  }
});

// Set display name for better debugging
Checkbox.displayName = 'Checkbox';