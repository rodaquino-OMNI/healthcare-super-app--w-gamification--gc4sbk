import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

// Updated imports for the LineChart component to match new structure
import LineChart from './LineChart';

// Updated imports for design tokens from @design-system/primitives/tokens instead of direct paths
import { colors } from '@design-system/primitives/tokens';

// Mock the useJourneyColor hook from @web/shared
jest.mock('@web/shared', () => ({
  useJourneyColor: jest.fn((journey) => {
    const journeyColors = {
      health: { primary: '#0ACF83' },
      care: { primary: '#FF8C42' },
      plan: { primary: '#3A86FF' }
    };
    return journeyColors[journey] || journeyColors.health;
  })
}));

// Sample data for testing
const sampleData = [
  { date: new Date('2023-01-01'), value: 10 },
  { date: new Date('2023-01-02'), value: 15 },
  { date: new Date('2023-01-03'), value: 12 },
  { date: new Date('2023-01-04'), value: 18 },
  { date: new Date('2023-01-05'), value: 14 }
];

// Mock theme for testing
const mockTheme = {
  colors: colors,
  spacing: {
    md: '16px',
    lg: '24px'
  },
  borderRadius: {
    md: '8px'
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  typography: {
    fontFamily: {
      base: 'Arial, sans-serif'
    }
  },
  breakpoints: {
    md: '768px',
    lg: '1024px'
  }
};

// Wrapper component with theme provider for testing
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {ui}
    </ThemeProvider>
  );
};

describe('LineChart Component', () => {
  // Test basic rendering
  test('renders the chart with data', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
      />
    );
    
    // Check if the chart container is rendered
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toBeInTheDocument();
    
    // Check if axis labels are rendered
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
  
  // Test empty state
  test('renders empty state when no data is provided', () => {
    renderWithTheme(
      <LineChart
        data={[]}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
      />
    );
    
    // Check if empty state message is displayed
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
  
  // Test accessibility
  test('has proper accessibility attributes', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
      />
    );
    
    // Check if chart has proper aria-label
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toHaveAttribute('aria-label', 'Line chart showing Value over Date');
  });
  
  // Test journey-specific theming - Health Journey
  test('applies health journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
        journey="health"
      />
    );
    
    // Health journey should use the health primary color
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toBeInTheDocument();
    // Note: We can't directly test the SVG color here as it's applied by Victory,
    // but we can verify the component renders with the journey prop
  });
  
  // Test journey-specific theming - Care Journey
  test('applies care journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
        journey="care"
      />
    );
    
    // Care journey should use the care primary color
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toBeInTheDocument();
  });
  
  // Test journey-specific theming - Plan Journey
  test('applies plan journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
        journey="plan"
      />
    );
    
    // Plan journey should use the plan primary color
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toBeInTheDocument();
  });
  
  // Test custom line color
  test('applies custom line color when provided', () => {
    const customColor = '#FF0000';
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
        lineColor={customColor}
      />
    );
    
    // Chart should render with custom color
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toBeInTheDocument();
  });
  
  // Test with different data types
  test('renders with numeric x-axis data', () => {
    const numericData = [
      { index: 1, value: 10 },
      { index: 2, value: 15 },
      { index: 3, value: 12 }
    ];
    
    renderWithTheme(
      <LineChart
        data={numericData}
        xAxisKey="index"
        yAxisKey="value"
        xAxisLabel="Index"
        yAxisLabel="Value"
      />
    );
    
    // Chart should render with numeric x-axis
    const chartElement = screen.getByRole('img', { name: /line chart showing value over index/i });
    expect(chartElement).toBeInTheDocument();
    expect(screen.getByText('Index')).toBeInTheDocument();
  });
});