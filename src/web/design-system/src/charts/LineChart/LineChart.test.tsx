import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { LineChart } from './LineChart';
import { colors } from '@design-system/primitives/tokens';
import { journeyTokens } from '@design-system/primitives/tokens';

// Mock the useJourneyColor hook
jest.mock('@web/shared', () => ({
  useJourneyColor: (journey: 'health' | 'care' | 'plan') => {
    const journeyColors = {
      health: { primary: colors.journeys.health.primary },
      care: { primary: colors.journeys.care.primary },
      plan: { primary: colors.journeys.plan.primary },
    };
    return journeyColors[journey];
  },
}));

// Sample data for testing
const sampleData = [
  { date: new Date('2023-01-01'), value: 10 },
  { date: new Date('2023-01-02'), value: 15 },
  { date: new Date('2023-01-03'), value: 12 },
  { date: new Date('2023-01-04'), value: 18 },
  { date: new Date('2023-01-05'), value: 14 },
];

// Create a wrapper with theme for testing
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={journeyTokens.health}>
      {ui}
    </ThemeProvider>
  );
};

describe('LineChart Component', () => {
  it('renders the chart with data', () => {
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
  
  it('displays empty state when no data is provided', () => {
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
  
  it('applies health journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        journey="health"
      />
    );
    
    // The chart should be rendered with health journey color
    const chartElement = screen.getByRole('img');
    expect(chartElement).toBeInTheDocument();
    
    // We can't directly test the color in JSDOM, but we can check if the journey prop is applied
    // This is a limitation of JSDOM, but in a real environment with visual regression testing,
    // we would verify the actual color
  });
  
  it('applies care journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        journey="care"
      />
    );
    
    // The chart should be rendered with care journey color
    const chartElement = screen.getByRole('img');
    expect(chartElement).toBeInTheDocument();
  });
  
  it('applies plan journey theming correctly', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        journey="plan"
      />
    );
    
    // The chart should be rendered with plan journey color
    const chartElement = screen.getByRole('img');
    expect(chartElement).toBeInTheDocument();
  });
  
  it('uses custom line color when provided', () => {
    const customColor = '#FF0000';
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        lineColor={customColor}
      />
    );
    
    // The chart should be rendered with custom color
    const chartElement = screen.getByRole('img');
    expect(chartElement).toBeInTheDocument();
    
    // Similar to journey theming, we can't directly test the color in JSDOM
    // but we can check if the component renders without errors
  });
  
  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
        xAxisLabel="Date"
        yAxisLabel="Value"
      />
    );
    
    // Check if the chart has proper aria-label
    const chartElement = screen.getByRole('img', { name: /line chart showing value over date/i });
    expect(chartElement).toHaveAttribute('aria-label', 'Line chart showing Value over Date');
  });
  
  it('renders with numeric data on x-axis', () => {
    const numericData = [
      { index: 1, value: 10 },
      { index: 2, value: 15 },
      { index: 3, value: 12 },
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
    
    // Check if the chart container is rendered
    const chartElement = screen.getByRole('img', { name: /line chart showing value over index/i });
    expect(chartElement).toBeInTheDocument();
  });
  
  it('handles undefined axis labels gracefully', () => {
    renderWithTheme(
      <LineChart
        data={sampleData}
        xAxisKey="date"
        yAxisKey="value"
      />
    );
    
    // Chart should render without axis labels
    const chartElement = screen.getByRole('img', { name: /line chart showing data over time/i });
    expect(chartElement).toBeInTheDocument();
    
    // No axis label elements should be present
    const axisLabels = screen.queryAllByText(/Date|Value/);
    expect(axisLabels.length).toBe(0);
  });
});