import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';
import { colors } from '@design-system/primitives/src/tokens/colors';
import { spacing } from '@design-system/primitives/src/tokens/spacing';

// Mock react-native components
jest.mock('react-native', () => ({
  ActivityIndicator: ({ size, color, ...props }) => (
    <div data-testid="activity-indicator" data-size={size} data-color={color} {...props} />
  ),
}));

// Mock the Touchable component to pass through props to a button element
jest.mock('@design-system/primitives/src/components/Touchable', () => ({
  Touchable: ({ children, ...props }) => (
    <button 
      data-testid="button" 
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock the Icon component
jest.mock('@design-system/primitives/src/components/Icon', () => ({
  Icon: ({ name, size, color, ...props }) => (
    <span 
      data-testid="icon" 
      data-name={name} 
      data-size={size} 
      data-color={color}
      {...props} 
    />
  ),
}));

// Mock the Text component
jest.mock('@design-system/primitives/src/components/Text', () => ({
  Text: ({ children, fontSize, fontWeight, color, ...props }) => (
    <span 
      data-testid="text" 
      data-font-size={fontSize} 
      data-font-weight={fontWeight} 
      data-color={color}
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock journey context
jest.mock('@austa/journey-context', () => ({
  useJourney: jest.fn().mockReturnValue({
    currentJourney: 'health',
    setCurrentJourney: jest.fn(),
    availableJourneys: ['health', 'care', 'plan']
  })
}));

describe('Button', () => {
  // Test rendering with default props
  it('renders correctly with default props', () => {
    render(<Button>Test Button</Button>);
    
    // Button should render with correct text content
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByTestId('text')).toHaveTextContent('Test Button');
  });
  
  // Test button variants
  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('variant', 'primary');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('variant', 'secondary');
    
    rerender(<Button variant="tertiary">Tertiary</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('variant', 'tertiary');
  });
  
  // Test button sizes
  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('size', 'sm');
    
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('size', 'md');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('size', 'lg');
  });
  
  // Test disabled state
  it('renders disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('disabled', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
  
  // Test loading state
  it('renders loading state correctly', () => {
    render(<Button loading>Loading Button</Button>);
    
    // Button should be disabled when loading
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    
    // ActivityIndicator should be present
    expect(screen.getByTestId('activity-indicator')).toBeInTheDocument();
    
    // Text content should not be visible
    expect(screen.queryByTestId('text')).not.toBeInTheDocument();
  });
  
  // Test journey-specific theming
  it('renders with different journey themes correctly', () => {
    const { rerender } = render(<Button journey="health">Health</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('journey', 'health');
    
    rerender(<Button journey="care">Care</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('journey', 'care');
    
    rerender(<Button journey="plan">Plan</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('journey', 'plan');
  });
  
  // Test journey context integration
  it('uses journey from context when not explicitly provided', () => {
    render(<Button>Context Journey</Button>);
    
    // Should use 'health' from the mocked journey context
    expect(screen.getByTestId('button')).toHaveAttribute('journey', 'health');
  });
  
  // Test icon rendering
  it('renders with icon correctly', () => {
    render(<Button icon="heart">Heart Icon</Button>);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-name', 'heart');
    expect(screen.getByTestId('text')).toHaveTextContent('Heart Icon');
  });
  
  it('renders with icon only (no text) correctly', () => {
    render(<Button icon="heart" />);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(screen.queryByTestId('text')).not.toBeInTheDocument();
    
    // Icon-only buttons should have aria-label for accessibility
    expect(screen.getByTestId('button')).toHaveAttribute('aria-label');
  });
  
  // Test accessibility
  it('has correct accessibility attributes', () => {
    render(<Button accessibilityLabel="Accessible Button">Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('accessibilityRole', 'button');
    expect(button).toHaveAttribute('accessibilityLabel', 'Accessible Button');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('aria-label', 'Accessible Button');
  });
  
  it('uses content as accessibility label when not explicitly provided', () => {
    render(<Button>Button Text</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('accessibilityLabel', 'Button Text');
    expect(button).toHaveAttribute('aria-label', 'Button Text');
  });
  
  // Test interactions
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    render(<Button onPress={onPressMock}>Clickable Button</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    render(<Button onPress={onPressMock} disabled>Disabled Button</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    render(<Button onPress={onPressMock} loading>Loading Button</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  // Test icon size based on button size
  it('passes correct icon size based on button size', () => {
    const { rerender } = render(<Button size="sm" icon="heart">Small</Button>);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '16px');
    
    rerender(<Button size="md" icon="heart">Medium</Button>);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '20px');
    
    rerender(<Button size="lg" icon="heart">Large</Button>);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '24px');
  });
  
  // Test font size based on button size
  it('passes correct font size based on button size', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByTestId('text')).toHaveAttribute('data-font-size', 'sm');
    
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByTestId('text')).toHaveAttribute('data-font-size', 'md');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByTestId('text')).toHaveAttribute('data-font-size', 'lg');
  });
  
  // Test focus management
  it('supports focus management with proper tabIndex', () => {
    render(<Button>Focusable Button</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('tabIndex', '0');
    
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByTestId('button')).toHaveAttribute('tabIndex', '-1');
  });
  
  // Test additional ARIA attributes
  it('applies additional ARIA attributes correctly', () => {
    render(
      <Button 
        aria-haspopup="true" 
        aria-expanded="false"
        aria-controls="dropdown-menu"
      >
        Dropdown Button
      </Button>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'dropdown-menu');
  });
});