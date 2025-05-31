import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeviceCard } from './DeviceCard';
import { baseTheme } from '@austa/design-system/themes';

// Mock the Box component
jest.mock('@design-system/primitives/components/Box', () => ({
  Box: ({ children, ...props }) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
}));

// Mock the Text component
jest.mock('@design-system/primitives/components/Text', () => ({
  Text: ({ children, ...props }) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
}));

// Mock the Touchable component
jest.mock('@design-system/primitives/components/Touchable', () => ({
  Touchable: ({ children, onPress, ...props }) => (
    <button 
      data-testid="touchable" 
      onClick={onPress} 
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock the Icon component
jest.mock('@design-system/primitives/components/Icon', () => ({
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

// Mock journey context
jest.mock('@austa/journey-context', () => ({
  useJourney: jest.fn().mockReturnValue({
    currentJourney: 'health',
    setCurrentJourney: jest.fn(),
    availableJourneys: ['health', 'care', 'plan']
  })
}));

// Mock the useJourneyTheme hook
jest.mock('../../themes', () => ({
  useJourneyTheme: jest.fn().mockReturnValue(baseTheme),
  baseTheme
}));

describe('DeviceCard', () => {
  // Test rendering with all props
  it('renders correctly with all props', () => {
    render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
        onPress={() => {}}
      />
    );
    
    // Check that device name, type, last sync, and status are displayed
    expect(screen.getByText('Apple Watch')).toBeInTheDocument();
    expect(screen.getByText('Smartwatch')).toBeInTheDocument();
    expect(screen.getByText('Last sync: 5 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
  
  // Test icon selection based on device type
  it('selects the correct icon based on device type', () => {
    const { rerender } = render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    // Smartwatch should use 'steps' icon
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'steps');
    
    // Heart Rate Monitor should use 'heart' icon
    rerender(
      <DeviceCard
        deviceName="Polar H10"
        deviceType="Heart Rate Monitor"
        lastSync="10 minutes ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'heart');
    
    // Blood Pressure Monitor should use 'pulse' icon
    rerender(
      <DeviceCard
        deviceName="Omron BP"
        deviceType="Blood Pressure Monitor"
        lastSync="1 hour ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'pulse');
    
    // Scale should use 'weight' icon
    rerender(
      <DeviceCard
        deviceName="Withings Scale"
        deviceType="Smart Scale"
        lastSync="2 hours ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'weight');
    
    // Glucose Monitor should use 'glucose' icon
    rerender(
      <DeviceCard
        deviceName="Dexcom G6"
        deviceType="Glucose Monitor"
        lastSync="30 minutes ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'glucose');
    
    // Sleep tracker should use 'sleep' icon
    rerender(
      <DeviceCard
        deviceName="Oura Ring"
        deviceType="Sleep Tracker"
        lastSync="8 hours ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'sleep');
    
    // Unknown device type should use default icon
    rerender(
      <DeviceCard
        deviceName="Unknown Device"
        deviceType="Other"
        lastSync="1 day ago"
        status="Connected"
      />
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'heart-outline');
  });
  
  // Test styling for connected and disconnected states
  it('applies correct styling for connected state', () => {
    render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    // Icon should have success color for connected devices
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', 'semantic.success');
    
    // Status text should have connected=true prop
    const statusText = screen.getByText('Connected');
    expect(statusText).toBeInTheDocument();
    expect(statusText.parentElement).toHaveAttribute('connected', 'true');
  });
  
  it('applies correct styling for disconnected state', () => {
    render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Disconnected"
      />
    );
    
    // Icon should have gray color for disconnected devices
    expect(screen.getByTestId('icon')).toHaveAttribute('data-color', 'neutral.gray400');
    
    // Status text should have connected=false prop
    const statusText = screen.getByText('Disconnected');
    expect(statusText).toBeInTheDocument();
    expect(statusText.parentElement).toHaveAttribute('connected', 'false');
  });
  
  // Test handling click events
  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
        onPress={onPressMock}
      />
    );
    
    const touchable = screen.getByTestId('touchable');
    fireEvent.click(touchable);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  // Test accessibility attributes
  it('has correct accessibility attributes', () => {
    render(
      <DeviceCard
        deviceName="Apple Watch"
        deviceType="Smartwatch"
        lastSync="5 minutes ago"
        status="Connected"
      />
    );
    
    const touchable = screen.getByTestId('touchable');
    expect(touchable).toHaveAttribute('accessibilityLabel', 'Apple Watch, Smartwatch, Connected, Last synced 5 minutes ago');
    expect(touchable).toHaveAttribute('journey', 'health');
    expect(touchable).toHaveAttribute('fullWidth');
    
    // Icon should be hidden from screen readers
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });
});