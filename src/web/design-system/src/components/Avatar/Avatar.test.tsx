import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Avatar } from './Avatar';
import { baseTheme } from '../../themes/base.theme';
import { healthTheme } from '../../themes/health.theme';
import { careTheme } from '../../themes/care.theme';
import { planTheme } from '../../themes/plan.theme';

// Mock the Text component
jest.mock('../../primitives/Text/Text', () => ({
  Text: ({ children, color, fontWeight, testID, ...props }) => (
    <span 
      data-testid={testID || 'text'} 
      data-color={color} 
      data-font-weight={fontWeight} 
      {...props}
    >
      {children}
    </span>
  ),
}));

// Mock the Icon component
jest.mock('../../primitives/Icon/Icon', () => ({
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

/**
 * Helper function to render a component with a specific theme
 */
const renderWithTheme = (ui: React.ReactElement, theme = baseTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Avatar', () => {
  // Test rendering with default props
  it('renders correctly with default props', () => {
    renderWithTheme(<Avatar name="John Doe" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('aria-label', 'Avatar for John Doe');
  });
  
  // Test rendering with image source
  it('renders with image when src is provided', () => {
    renderWithTheme(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(image).toHaveAttribute('alt', 'User Avatar');
  });
  
  // Test fallback to initials when no image is available
  it('renders initials when no src is provided', () => {
    renderWithTheme(<Avatar name="John Doe" />);
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test fallback to icon when no name is available
  it('renders icon when no name or src is provided', () => {
    renderWithTheme(<Avatar />);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-name', 'profile');
  });
  
  // Test image loading error handling
  it('falls back to initials when image fails to load', () => {
    renderWithTheme(<Avatar src="https://example.com/invalid.jpg" name="John Doe" />);
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test onImageError callback
  it('calls onImageError when image fails to load', () => {
    const onImageError = jest.fn();
    renderWithTheme(
      <Avatar 
        src="https://example.com/invalid.jpg" 
        name="John Doe" 
        onImageError={onImageError} 
      />
    );
    
    const image = screen.getByRole('img');
    fireEvent.error(image);
    
    expect(onImageError).toHaveBeenCalledTimes(1);
  });
  
  // Test different sizes
  it('renders with different sizes', () => {
    const { rerender } = renderWithTheme(<Avatar name="John Doe" size="32px" />);
    
    let avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('width: 32px');
    expect(avatar).toHaveStyle('height: 32px');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar name="John Doe" size="64px" />
      </ThemeProvider>
    );
    
    avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('width: 64px');
    expect(avatar).toHaveStyle('height: 64px');
  });
  
  // Test forcing fallback display
  it('shows fallback when showFallback is true even if src is provided', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        name="John Doe" 
        showFallback={true} 
      />
    );
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toBeInTheDocument();
    expect(initials).toHaveTextContent('JD');
    
    // Image should not be rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  
  // Test fallback type selection
  it('respects fallbackType prop', () => {
    const { rerender } = renderWithTheme(
      <Avatar name="John Doe" fallbackType="initials" />
    );
    
    expect(screen.getByTestId('avatar-initials')).toBeInTheDocument();
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar name="John Doe" fallbackType="icon" />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-initials')).not.toBeInTheDocument();
  });
  
  // Test accessibility attributes
  it('has correct accessibility attributes', () => {
    renderWithTheme(<Avatar name="John Doe" alt="Custom Avatar Label" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('aria-label', 'Custom Avatar Label');
  });
  
  // Test journey-specific theming - Health
  it('applies health journey styling correctly', () => {
    renderWithTheme(<Avatar name="John Doe" journey="health" />, healthTheme);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #0ACF83');
  });
  
  // Test journey-specific theming - Care
  it('applies care journey styling correctly', () => {
    renderWithTheme(<Avatar name="John Doe" journey="care" />, careTheme);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #FF8C42');
  });
  
  // Test journey-specific theming - Plan
  it('applies plan journey styling correctly', () => {
    renderWithTheme(<Avatar name="John Doe" journey="plan" />, planTheme);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('background-color: #3A86FF');
  });
  
  // Test initials generation
  it('generates correct initials from different name formats', () => {
    const { rerender } = renderWithTheme(<Avatar name="John Doe" />);
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JD');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar name="John" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('J');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar name="John Middle Doe" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JD');
    
    rerender(
      <ThemeProvider theme={baseTheme}>
        <Avatar name="" />
      </ThemeProvider>
    );
    // Should fall back to icon when name is empty
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
  
  // Test custom test ID
  it('applies custom testID correctly', () => {
    renderWithTheme(<Avatar name="John Doe" testID="custom-avatar" />);
    
    expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
  });
  
  // Test that initials are uppercase
  it('renders initials in uppercase', () => {
    renderWithTheme(<Avatar name="john doe" />);
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toHaveTextContent('JD');
  });
  
  // Test that fallback text color is white
  it('renders initials with white text color', () => {
    renderWithTheme(<Avatar name="John Doe" />);
    
    const initials = screen.getByTestId('avatar-initials');
    expect(initials).toHaveAttribute('data-color', 'white');
  });
  
  // Test that icon size is proportional to avatar size
  it('renders icon with size proportional to avatar size', () => {
    renderWithTheme(<Avatar size="80px" fallbackType="icon" />);
    
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('data-size', 'calc(80px / 2)');
  });
});