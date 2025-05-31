import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { baseTheme } from '../../themes/base.theme';
import { Avatar } from './Avatar';
import { colors } from '@design-system/primitives/tokens';

const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider theme={baseTheme}>{ui}</ThemeProvider>);
};

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    renderWithTheme(
      <Avatar src="https://example.com/avatar.jpg" alt="John Doe" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    const img = avatar.querySelector('img');
    
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });
  
  it('renders initials when src is not provided', () => {
    renderWithTheme(
      <Avatar alt="John Doe" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveTextContent('JD');
  });
  
  it('renders a single initial for one-word names', () => {
    renderWithTheme(
      <Avatar alt="John" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveTextContent('J');
  });
  
  it('renders a default icon when no alt text is provided', () => {
    renderWithTheme(
      <Avatar testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar.querySelector('svg')).toBeInTheDocument();
  });
  
  it('applies the correct size', () => {
    renderWithTheme(
      <Avatar alt="John Doe" size={64} testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveStyle('width: 64px');
    expect(avatar).toHaveStyle('height: 64px');
  });
  
  it('shows fallback when showFallback is true', () => {
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="John Doe" 
        showFallback 
        testID="avatar" 
      />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveTextContent('JD');
    expect(avatar.querySelector('img')).not.toBeInTheDocument();
  });
  
  it('applies health journey styling when journey is health', () => {
    renderWithTheme(
      <Avatar alt="John Doe" journey="health" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    // Note: We can't directly test the computed styles from styled-components in JSDOM
    // but we can verify the journey prop is applied
    expect(avatar).toHaveAttribute('journey', 'health');
  });
  
  it('applies care journey styling when journey is care', () => {
    renderWithTheme(
      <Avatar alt="John Doe" journey="care" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('journey', 'care');
  });
  
  it('applies plan journey styling when journey is plan', () => {
    renderWithTheme(
      <Avatar alt="John Doe" journey="plan" testID="avatar" />
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('journey', 'plan');
  });
  
  it('calls onImageError when image fails to load', () => {
    const onImageError = jest.fn();
    renderWithTheme(
      <Avatar 
        src="https://example.com/avatar.jpg" 
        alt="John Doe" 
        onImageError={onImageError} 
        testID="avatar" 
      />
    );
    
    const img = screen.getByAltText('John Doe');
    fireEvent.error(img);
    
    expect(onImageError).toHaveBeenCalled();
    // After error, it should show fallback
    expect(screen.getByTestId('avatar')).toHaveTextContent('JD');
  });
});