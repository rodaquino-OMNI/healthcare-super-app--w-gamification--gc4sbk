import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';

// Mock react-native components
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Platform: {
    OS: 'web',
  },
  TextInputProps: {},
}));

// Mock the Touchable component to pass through props to a div element
jest.mock('../../primitives/Touchable', () => ({
  Touchable: ({ children, onPress, accessibilityRole, accessibilityState, accessibilityLabel, testID, ...props }) => (
    <div 
      data-testid={testID}
      onClick={onPress}
      role={accessibilityRole}
      aria-checked={accessibilityState?.checked}
      aria-disabled={accessibilityState?.disabled}
      aria-label={accessibilityLabel}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock the Box component
jest.mock('../../primitives/Box', () => ({
  Box: ({ children, style, ...props }) => (
    <div 
      data-testid="checkbox-box"
      data-styles={JSON.stringify(style)}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock the Text component
jest.mock('../../primitives/Text', () => ({
  Text: ({ children, style, testID, ...props }) => (
    <span 
      data-testid={testID || 'checkbox-text'}
      data-styles={JSON.stringify(style)}
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock the useTheme hook
jest.mock('../../themes', () => {
  const originalModule = jest.requireActual('../../themes');
  
  return {
    ...originalModule,
    useTheme: jest.fn(() => ({
      colors: {
        brand: {
          primary: '#3A86FF',
        },
        journeys: {
          health: {
            primary: '#4CAF50',
          },
          care: {
            primary: '#FF9800',
          },
          plan: {
            primary: '#2196F3',
          },
        },
      },
    })),
  };
});

describe('Checkbox', () => {
  // Test rendering with default props
  it('renders correctly with default props', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Checkbox should render with correct label
    expect(screen.getByTestId('checkbox-test-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-text')).toHaveTextContent('Test Checkbox');
    
    // Should be unchecked by default
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'false');
  });
  
  // Test checked state
  it('renders checked state correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Checkbox should be checked
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'true');
    
    // Checkmark should be visible
    expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-checkmark')).toHaveTextContent('✓');
  });
  
  // Test disabled state
  it('renders disabled state correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        disabled={true}
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Checkbox should be disabled
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-disabled', 'true');
    
    // Box should have disabled styling
    const boxStyles = JSON.parse(screen.getByTestId('checkbox-box').getAttribute('data-styles') || '[]');
    expect(boxStyles).toContainEqual(expect.objectContaining({ backgroundColor: '#EEEEEE' }));
  });
  
  // Test checked and disabled state
  it('renders checked and disabled state correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        disabled={true}
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Checkbox should be checked and disabled
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-disabled', 'true');
    
    // Checkmark should be visible
    expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
    
    // Box should have disabled styling
    const boxStyles = JSON.parse(screen.getByTestId('checkbox-box').getAttribute('data-styles') || '[]');
    expect(boxStyles).toContainEqual(expect.objectContaining({ backgroundColor: '#EEEEEE' }));
  });
  
  // Test journey-specific styling - Health
  it('renders with health journey styling correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={jest.fn()}
        journey="health"
      />
    );
    
    // Box should have health journey color
    const boxStyles = JSON.parse(screen.getByTestId('checkbox-box').getAttribute('data-styles') || '[]');
    expect(boxStyles).toContainEqual(expect.objectContaining({ backgroundColor: '#4CAF50' }));
    expect(boxStyles).toContainEqual(expect.objectContaining({ borderColor: '#4CAF50' }));
  });
  
  // Test journey-specific styling - Care
  it('renders with care journey styling correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={jest.fn()}
        journey="care"
      />
    );
    
    // Box should have care journey color
    const boxStyles = JSON.parse(screen.getByTestId('checkbox-box').getAttribute('data-styles') || '[]');
    expect(boxStyles).toContainEqual(expect.objectContaining({ backgroundColor: '#FF9800' }));
    expect(boxStyles).toContainEqual(expect.objectContaining({ borderColor: '#FF9800' }));
  });
  
  // Test journey-specific styling - Plan
  it('renders with plan journey styling correctly', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={jest.fn()}
        journey="plan"
      />
    );
    
    // Box should have plan journey color
    const boxStyles = JSON.parse(screen.getByTestId('checkbox-box').getAttribute('data-styles') || '[]');
    expect(boxStyles).toContainEqual(expect.objectContaining({ backgroundColor: '#2196F3' }));
    expect(boxStyles).toContainEqual(expect.objectContaining({ borderColor: '#2196F3' }));
  });
  
  // Test onChange callback
  it('calls onChange when clicked', () => {
    const onChangeMock = jest.fn();
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={onChangeMock}
      />
    );
    
    // Click the checkbox
    fireEvent.click(screen.getByTestId('checkbox-test-checkbox'));
    
    // onChange should be called
    expect(onChangeMock).toHaveBeenCalledTimes(1);
    
    // The synthetic event should have the correct properties
    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          checked: true,
          value: 'test',
          name: 'test',
          id: 'test-checkbox'
        })
      })
    );
  });
  
  // Test that onChange is not called when disabled
  it('does not call onChange when disabled', () => {
    const onChangeMock = jest.fn();
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        disabled={true}
        label="Test Checkbox"
        onChange={onChangeMock}
      />
    );
    
    // Click the checkbox
    fireEvent.click(screen.getByTestId('checkbox-test-checkbox'));
    
    // onChange should not be called
    expect(onChangeMock).not.toHaveBeenCalled();
  });
  
  // Test toggling the checkbox
  it('toggles checked state when clicked multiple times', () => {
    const onChangeMock = jest.fn();
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={onChangeMock}
      />
    );
    
    // Initially unchecked
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'false');
    
    // First click - should check
    fireEvent.click(screen.getByTestId('checkbox-test-checkbox'));
    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ checked: true })
      })
    );
    
    // Update the component with the new checked state
    onChangeMock.mockReset();
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={onChangeMock}
      />
    );
    
    // Now checked
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'true');
    
    // Second click - should uncheck
    fireEvent.click(screen.getByTestId('checkbox-test-checkbox'));
    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ checked: false })
      })
    );
  });
  
  // Test accessibility attributes
  it('has correct accessibility attributes', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Accessible Checkbox"
        onChange={jest.fn()}
      />
    );
    
    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    
    // Should have correct accessibility role
    expect(checkbox).toHaveAttribute('role', 'checkbox');
    
    // Should have correct accessibility label
    expect(checkbox).toHaveAttribute('aria-label', 'Accessible Checkbox');
    
    // Should have correct checked state
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });
  
  // Test custom testID
  it('renders with custom testID', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={jest.fn()}
        testID="custom-test-id"
      />
    );
    
    // Should render with custom testID
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });
  
  // Test native input for web platform
  it('renders hidden native input for web platform', () => {
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Should render a hidden native input
    const nativeInput = document.querySelector('input[type="checkbox"]');
    expect(nativeInput).toBeInTheDocument();
    expect(nativeInput).toHaveAttribute('id', 'test-checkbox');
    expect(nativeInput).toHaveAttribute('name', 'test');
    expect(nativeInput).toHaveAttribute('value', 'test');
    
    // Input should be visually hidden but accessible
    expect(nativeInput).toHaveStyle({
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    });
  });
  
  // Test focus handling
  it('exposes focus method through ref', () => {
    const ref = React.createRef<any>();
    render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        label="Test Checkbox"
        onChange={jest.fn()}
        ref={ref}
      />
    );
    
    // Mock the focus method of the input element
    const mockFocus = jest.fn();
    const inputElement = document.querySelector('input[type="checkbox"]');
    if (inputElement) {
      Object.defineProperty(inputElement, 'focus', {
        value: mockFocus,
        configurable: true,
      });
    }
    
    // Call focus method through ref
    ref.current.focus();
    
    // Focus should be called on the input element
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });
  
  // Test that component updates when checked prop changes
  it('updates when checked prop changes', () => {
    const { rerender } = render(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={false}
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Initially unchecked
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId('checkbox-checkmark')).not.toBeInTheDocument();
    
    // Update checked prop
    rerender(
      <Checkbox
        id="test-checkbox"
        name="test"
        value="test"
        checked={true}
        label="Test Checkbox"
        onChange={jest.fn()}
      />
    );
    
    // Now checked
    expect(screen.getByTestId('checkbox-test-checkbox')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('checkbox-checkmark')).toBeInTheDocument();
  });
});